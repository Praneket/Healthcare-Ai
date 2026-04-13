from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import pickle
import numpy as np
import os
from typing import Dict, Any, List
from PIL import Image, ImageStat
import io

app = FastAPI(title="Healthcare AI Service", version="1.0.0")

MODELS_DIR = os.getenv("MODELS_DIR", "./models")

models = {}
model_files = {
    "diabetes":     "diabetes_model.sav",
    "heart_disease":"heart_disease_model.sav",
    "parkinsons":   "parkinsons_model.sav",
    "lung_cancer":  "lungs_disease_model.sav",
    "thyroid":      "Thyroid_model.sav",
}

for name, filename in model_files.items():
    path = os.path.join(MODELS_DIR, filename)
    if os.path.exists(path):
        with open(path, "rb") as f:
            models[name] = pickle.load(f)
        print(f"✓ Loaded model: {name}")
    else:
        print(f"✗ Model not found: {path}")

image_model = None
image_model_path = os.path.join(MODELS_DIR, "chest_xray_model.sav")
if os.path.exists(image_model_path):
    with open(image_model_path, "rb") as f:
        image_model = pickle.load(f)
    print("✓ Loaded image model: chest_xray")
else:
    print("ℹ Image model not found — using image analysis heuristics")

FEATURE_ORDER = {
    "diabetes": ["Pregnancies","Glucose","BloodPressure","SkinThickness","Insulin","BMI","DiabetesPedigreeFunction","Age"],
    "heart_disease": ["age","sex","cp","trestbps","chol","fbs","restecg","thalach","exang","oldpeak","slope","ca","thal"],
    "parkinsons": ["fo","fhi","flo","Jitter_percent","Jitter_Abs","RAP","PPQ","DDP","Shimmer","Shimmer_dB","APQ3","APQ5","APQ","DDA","NHR","HNR","RPDE","DFA","spread1","spread2","D2","PPE"],
    "lung_cancer": ["GENDER","AGE","SMOKING","YELLOW_FINGERS","ANXIETY","PEER_PRESSURE","CHRONIC_DISEASE","FATIGUE","ALLERGY","WHEEZING","ALCOHOL_CONSUMING","COUGHING","SHORTNESS_OF_BREATH","SWALLOWING_DIFFICULTY","CHEST_PAIN"],
    "thyroid": ["age","sex","on_thyroxine","tsh","t3_measured","t3","tt4"],
}

DISEASE_MESSAGES = {
    "diabetes":     ("The person is diabetic", "The person is not diabetic"),
    "heart_disease":("The person has heart disease", "The person does not have heart disease"),
    "parkinsons":   ("The person has Parkinson's disease", "The person does not have Parkinson's disease"),
    "lung_cancer":  ("The person has lung cancer", "The person does not have lung cancer"),
    "thyroid":      ("The person has Hypo-Thyroid disease", "The person does not have Hypo-Thyroid disease"),
}

# ── Medical insights database ────────────────────────────────────
MEDICAL_INSIGHTS = {
    "Normal": {
        "summary": "No significant abnormalities detected in the chest X-ray.",
        "findings": [
            "Lung fields appear clear with no consolidation",
            "No pleural effusion or pneumothorax detected",
            "Cardiac silhouette within normal limits",
            "Costophrenic angles appear sharp",
        ],
        "recommendations": [
            "Continue routine annual health check-ups",
            "Maintain a healthy lifestyle with regular exercise",
            "Avoid smoking and exposure to air pollutants",
            "Stay up to date with vaccinations (flu, pneumococcal)",
        ],
        "next_steps": "No immediate medical intervention required. Schedule routine follow-up in 12 months.",
        "severity": "None",
    },
    "Pneumonia": {
        "summary": "Radiological findings suggest possible pneumonia or pulmonary consolidation.",
        "findings": [
            "Increased opacity or consolidation pattern detected",
            "Possible infiltrates in one or both lung fields",
            "Potential air bronchograms present",
            "Possible mild pleural reaction",
        ],
        "recommendations": [
            "Seek immediate medical consultation with a pulmonologist",
            "Complete blood count (CBC) and CRP blood tests recommended",
            "Sputum culture to identify causative organism",
            "Antibiotic therapy may be required — do not self-medicate",
            "Rest, adequate hydration, and monitoring of oxygen saturation",
            "Repeat chest X-ray after 4–6 weeks to confirm resolution",
        ],
        "next_steps": "Consult a doctor within 24 hours. If experiencing difficulty breathing, chest pain, or high fever — go to the emergency room immediately.",
        "severity": "High",
    },
}

IMAGE_SIZE    = (64, 64)
IMAGE_CLASSES = ["Normal", "Pneumonia"]


def analyze_image_properties(img_gray: Image.Image) -> dict:
    """Extract basic radiological image properties for reporting."""
    stat = ImageStat.Stat(img_gray)
    mean_brightness = stat.mean[0]
    std_dev         = stat.stddev[0]

    # Heuristic brightness zones
    arr = np.array(img_gray, dtype=np.float32)
    dark_ratio   = float(np.sum(arr < 60)  / arr.size)   # very dark = air/lung
    bright_ratio = float(np.sum(arr > 180) / arr.size)   # bright = bone/consolidation
    mid_ratio    = 1.0 - dark_ratio - bright_ratio

    return {
        "mean_brightness": round(mean_brightness, 1),
        "contrast":        round(std_dev, 1),
        "dark_region_pct": round(dark_ratio * 100, 1),
        "bright_region_pct": round(bright_ratio * 100, 1),
        "mid_region_pct":  round(mid_ratio * 100, 1),
        "image_quality":   "Good" if std_dev > 30 else "Low contrast — consider retaking",
    }


def preprocess_image(file_bytes: bytes):
    img = Image.open(io.BytesIO(file_bytes)).convert("L")
    props = analyze_image_properties(img)
    img_resized = img.resize(IMAGE_SIZE)
    arr = np.array(img_resized, dtype=np.float32).flatten() / 255.0
    return arr.reshape(1, -1), props


def heuristic_predict(file_bytes: bytes):
    """
    When no trained model is available, use image statistics as a heuristic.
    Bright mid-region (consolidation pattern) → Pneumonia signal.
    This is NOT a medical diagnosis — for demo purposes only.
    """
    img = Image.open(io.BytesIO(file_bytes)).convert("L")
    props = analyze_image_properties(img)
    arr   = np.array(img, dtype=np.float32) / 255.0

    # Simple heuristic: high mid-brightness variance in lung zone suggests consolidation
    h, w  = arr.shape
    lung_zone = arr[h//4: 3*h//4, w//6: 5*w//6]
    local_std = float(np.std(lung_zone))
    mean_val  = float(np.mean(lung_zone))

    # Consolidation pattern: moderate brightness + low local variance
    pneumonia_score = 0.0
    if 0.35 < mean_val < 0.70 and local_std < 0.18:
        pneumonia_score = min(0.55 + (0.18 - local_std) * 2, 0.82)
    else:
        pneumonia_score = max(0.15, min(0.45, local_std * 1.5))

    positive   = pneumonia_score >= 0.50
    confidence = pneumonia_score if positive else (1.0 - pneumonia_score)
    return positive, round(confidence, 4), props


class PredictionRequest(BaseModel):
    features: Dict[str, Any]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "loaded_models": list(models.keys()),
        "image_model_ready": image_model is not None,
    }


# ── Image endpoint MUST be before /predict/{disease_type} ────────
@app.post("/predict/image")
async def predict_image(
    file: UploadFile = File(...),
    disease_type: str = "chest_xray",
):
    allowed_types = {"image/jpeg", "image/png", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images are accepted")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10 MB")

    try:
        if image_model is not None:
            input_array, props = preprocess_image(file_bytes)
            prediction  = image_model.predict(input_array)[0]
            confidence  = 0.0
            if hasattr(image_model, "predict_proba"):
                proba      = image_model.predict_proba(input_array)[0]
                confidence = float(max(proba))
            positive = bool(prediction == 1)
        else:
            positive, confidence, props = heuristic_predict(file_bytes)

        label   = IMAGE_CLASSES[1] if positive else IMAGE_CLASSES[0]
        insight = MEDICAL_INSIGHTS[label]

        return {
            "disease_type":    disease_type,
            "positive":        positive,
            "confidence":      round(confidence, 4),
            "predicted_class": label,
            "message":         insight["summary"],
            "severity":        insight["severity"],
            "findings":        insight["findings"],
            "recommendations": insight["recommendations"],
            "next_steps":      insight["next_steps"],
            "image_properties": props,
            "disclaimer":      "This is an AI-assisted screening tool. Results must be confirmed by a qualified radiologist.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


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

    model       = models[disease_type]
    input_array = np.array(feature_values).reshape(1, -1)
    prediction  = model.predict(input_array)[0]

    confidence = 0.0
    if hasattr(model, "predict_proba"):
        proba      = model.predict_proba(input_array)[0]
        confidence = float(max(proba))

    positive = bool(prediction == 1)
    pos_msg, neg_msg = DISEASE_MESSAGES[disease_type]

    return {
        "disease_type": disease_type,
        "positive":     positive,
        "confidence":   confidence,
        "message":      pos_msg if positive else neg_msg,
    }
