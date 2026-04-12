from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import pickle
import numpy as np
import os
from typing import Dict, Any
from PIL import Image
import io

app = FastAPI(title="Healthcare AI Service", version="1.0.0")

# ── Load all models at startup ──────────────────────────────────
MODELS_DIR = os.getenv("MODELS_DIR", "./models")

models = {}
model_files = {
    "diabetes": "diabetes_model.sav",
    "heart_disease": "heart_disease_model.sav",
    "parkinsons": "parkinsons_model.sav",
    "lung_cancer": "lungs_disease_model.sav",
    "thyroid": "Thyroid_model.sav",
}

for name, filename in model_files.items():
    path = os.path.join(MODELS_DIR, filename)
    if os.path.exists(path):
        with open(path, "rb") as f:
            models[name] = pickle.load(f)
        print(f"✓ Loaded model: {name}")
    else:
        print(f"✗ Model not found: {path}")

# ── Feature ordering per disease (must match training order) ────
FEATURE_ORDER = {
    "diabetes": ["Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
                 "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"],
    "heart_disease": ["age", "sex", "cp", "trestbps", "chol", "fbs",
                      "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"],
    "parkinsons": ["fo", "fhi", "flo", "Jitter_percent", "Jitter_Abs", "RAP", "PPQ",
                   "DDP", "Shimmer", "Shimmer_dB", "APQ3", "APQ5", "APQ", "DDA",
                   "NHR", "HNR", "RPDE", "DFA", "spread1", "spread2", "D2", "PPE"],
    "lung_cancer": ["GENDER", "AGE", "SMOKING", "YELLOW_FINGERS", "ANXIETY",
                    "PEER_PRESSURE", "CHRONIC_DISEASE", "FATIGUE", "ALLERGY",
                    "WHEEZING", "ALCOHOL_CONSUMING", "COUGHING",
                    "SHORTNESS_OF_BREATH", "SWALLOWING_DIFFICULTY", "CHEST_PAIN"],
    "thyroid": ["age", "sex", "on_thyroxine", "tsh", "t3_measured", "t3", "tt4"],
}

DISEASE_MESSAGES = {
    "diabetes": ("The person is diabetic", "The person is not diabetic"),
    "heart_disease": ("The person has heart disease", "The person does not have heart disease"),
    "parkinsons": ("The person has Parkinson's disease", "The person does not have Parkinson's disease"),
    "lung_cancer": ("The person has lung cancer", "The person does not have lung cancer"),
    "thyroid": ("The person has Hypo-Thyroid disease", "The person does not have Hypo-Thyroid disease"),
}


class PredictionRequest(BaseModel):
    features: Dict[str, Any]


# ── Load image model (MobileNetV2 fine-tuned for chest X-ray) ──
image_model = None
try:
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    from tensorflow.keras.models import load_model as keras_load_model

    image_model_path = os.path.join(MODELS_DIR, "chest_xray_model.h5")
    if os.path.exists(image_model_path):
        image_model = keras_load_model(image_model_path)
        print("✓ Loaded image model: chest_xray")
    else:
        # Fallback: use base MobileNetV2 with ImageNet weights for demo
        image_model = MobileNetV2(weights="imagenet")
        print("✓ Loaded fallback image model: MobileNetV2 (ImageNet)")
except Exception as e:
    print(f"✗ Image model load failed: {e}")

IMAGE_CLASSES = ["Normal", "Pneumonia"]  # update when using custom model
IMAGE_SIZE = (224, 224)


def preprocess_image(file_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB").resize(IMAGE_SIZE)
    arr = np.array(img, dtype=np.float32)
    arr = arr / 127.5 - 1.0  # MobileNetV2 preprocess_input equivalent
    return np.expand_dims(arr, axis=0)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "loaded_models": list(models.keys()),
        "image_model_ready": image_model is not None,
    }


@app.post("/predict/{disease_type}")
def predict(disease_type: str, request: PredictionRequest):
    if disease_type not in models:
        raise HTTPException(status_code=404, detail=f"Model '{disease_type}' not found")

    feature_order = FEATURE_ORDER.get(disease_type)
    if not feature_order:
        raise HTTPException(status_code=400, detail=f"No feature order defined for '{disease_type}'")

    try:
        feature_values = [float(request.features[f]) for f in feature_order]
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing feature: {e}")

    model = models[disease_type]
    input_array = np.array(feature_values).reshape(1, -1)
    prediction = model.predict(input_array)[0]

    # Get probability if model supports it
    confidence = 0.0
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(input_array)[0]
        confidence = float(max(proba))

    positive = bool(prediction == 1)
    pos_msg, neg_msg = DISEASE_MESSAGES[disease_type]

    return {
        "disease_type": disease_type,
        "positive": positive,
        "confidence": confidence,
        "message": pos_msg if positive else neg_msg,
    }


@app.post("/predict/image")
async def predict_image(
    file: UploadFile = File(...),
    disease_type: str = "chest_xray",
):
    if image_model is None:
        raise HTTPException(status_code=503, detail="Image model not available")

    allowed_types = {"image/jpeg", "image/png", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images are accepted")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="Image must be under 10 MB")

    try:
        input_array = preprocess_image(file_bytes)
        predictions = image_model.predict(input_array)

        # Binary classification output (sigmoid) or softmax
        if predictions.shape[-1] == 1:
            confidence = float(predictions[0][0])
            positive = confidence >= 0.5
        else:
            class_idx = int(np.argmax(predictions[0]))
            confidence = float(predictions[0][class_idx])
            positive = class_idx == 1  # index 1 = Pneumonia / disease

        label = IMAGE_CLASSES[1] if positive else IMAGE_CLASSES[0]
        return {
            "disease_type": disease_type,
            "positive": positive,
            "confidence": round(confidence, 4),
            "predicted_class": label,
            "message": f"Image classified as: {label} (confidence: {confidence:.1%})",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
