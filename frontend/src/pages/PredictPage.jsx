import React, { useState } from 'react';
import { diagnosisApi } from '../services/api';
import toast from 'react-hot-toast';

// Feature definitions per disease
const DISEASE_FEATURES = {
  diabetes: [
    { key: 'Pregnancies', label: 'Pregnancies', hint: 'Number of times pregnant' },
    { key: 'Glucose', label: 'Glucose Level', hint: 'Plasma glucose concentration' },
    { key: 'BloodPressure', label: 'Blood Pressure', hint: 'Diastolic blood pressure (mm Hg)' },
    { key: 'SkinThickness', label: 'Skin Thickness', hint: 'Triceps skin fold thickness (mm)' },
    { key: 'Insulin', label: 'Insulin', hint: '2-Hour serum insulin (mu U/ml)' },
    { key: 'BMI', label: 'BMI', hint: 'Body mass index' },
    { key: 'DiabetesPedigreeFunction', label: 'Pedigree Function', hint: 'Diabetes pedigree function' },
    { key: 'Age', label: 'Age', hint: 'Age in years' },
  ],
  heart_disease: [
    { key: 'age', label: 'Age' }, { key: 'sex', label: 'Sex (1=Male, 0=Female)' },
    { key: 'cp', label: 'Chest Pain Type (0-3)' }, { key: 'trestbps', label: 'Resting Blood Pressure' },
    { key: 'chol', label: 'Cholesterol (mg/dl)' }, { key: 'fbs', label: 'Fasting Blood Sugar >120 (1/0)' },
    { key: 'restecg', label: 'Resting ECG (0-2)' }, { key: 'thalach', label: 'Max Heart Rate' },
    { key: 'exang', label: 'Exercise Angina (1/0)' }, { key: 'oldpeak', label: 'ST Depression' },
    { key: 'slope', label: 'Slope (0-2)' }, { key: 'ca', label: 'Major Vessels (0-3)' },
    { key: 'thal', label: 'Thal (0=Normal, 1=Fixed, 2=Reversible)' },
  ],
  parkinsons: [
    { key: 'fo', label: 'MDVP:Fo(Hz)' }, { key: 'fhi', label: 'MDVP:Fhi(Hz)' },
    { key: 'flo', label: 'MDVP:Flo(Hz)' }, { key: 'Jitter_percent', label: 'Jitter(%)' },
    { key: 'Jitter_Abs', label: 'Jitter(Abs)' }, { key: 'RAP', label: 'RAP' },
    { key: 'PPQ', label: 'PPQ' }, { key: 'DDP', label: 'DDP' },
    { key: 'Shimmer', label: 'Shimmer' }, { key: 'Shimmer_dB', label: 'Shimmer(dB)' },
    { key: 'APQ3', label: 'APQ3' }, { key: 'APQ5', label: 'APQ5' },
    { key: 'APQ', label: 'APQ' }, { key: 'DDA', label: 'DDA' },
    { key: 'NHR', label: 'NHR' }, { key: 'HNR', label: 'HNR' },
    { key: 'RPDE', label: 'RPDE' }, { key: 'DFA', label: 'DFA' },
    { key: 'spread1', label: 'Spread1' }, { key: 'spread2', label: 'Spread2' },
    { key: 'D2', label: 'D2' }, { key: 'PPE', label: 'PPE' },
  ],
  lung_cancer: [
    { key: 'GENDER', label: 'Gender (1=Male, 0=Female)' }, { key: 'AGE', label: 'Age' },
    { key: 'SMOKING', label: 'Smoking (1/0)' }, { key: 'YELLOW_FINGERS', label: 'Yellow Fingers (1/0)' },
    { key: 'ANXIETY', label: 'Anxiety (1/0)' }, { key: 'PEER_PRESSURE', label: 'Peer Pressure (1/0)' },
    { key: 'CHRONIC_DISEASE', label: 'Chronic Disease (1/0)' }, { key: 'FATIGUE', label: 'Fatigue (1/0)' },
    { key: 'ALLERGY', label: 'Allergy (1/0)' }, { key: 'WHEEZING', label: 'Wheezing (1/0)' },
    { key: 'ALCOHOL_CONSUMING', label: 'Alcohol (1/0)' }, { key: 'COUGHING', label: 'Coughing (1/0)' },
    { key: 'SHORTNESS_OF_BREATH', label: 'Shortness of Breath (1/0)' },
    { key: 'SWALLOWING_DIFFICULTY', label: 'Swallowing Difficulty (1/0)' },
    { key: 'CHEST_PAIN', label: 'Chest Pain (1/0)' },
  ],
  thyroid: [
    { key: 'age', label: 'Age' }, { key: 'sex', label: 'Sex (1=Male, 0=Female)' },
    { key: 'on_thyroxine', label: 'On Thyroxine (1/0)' }, { key: 'tsh', label: 'TSH Level' },
    { key: 't3_measured', label: 'T3 Measured (1/0)' }, { key: 't3', label: 'T3 Level' },
    { key: 'tt4', label: 'TT4 Level' },
  ],
};

export default function PredictPage() {
  const [diseaseType, setDiseaseType] = useState('diabetes');
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const features = DISEASE_FEATURES[diseaseType];

  const handleChange = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await diagnosisApi.predict(diseaseType, values);
      setResult(data);
      toast.success('Prediction complete!');
    } catch {
      toast.error('Prediction failed. Check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>🔬 Symptom-Based Diagnosis</h2>

        <select style={styles.select} value={diseaseType}
          onChange={(e) => { setDiseaseType(e.target.value); setValues({}); setResult(null); }}>
          {Object.keys(DISEASE_FEATURES).map((d) => (
            <option key={d} value={d}>{d.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid}>
            {features.map(({ key, label, hint }) => (
              <div key={key} style={styles.field}>
                <label style={styles.label}>{label}</label>
                <input style={styles.input} type="number" step="any" required
                  placeholder={hint || '0'}
                  value={values[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)} />
              </div>
            ))}
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Run Diagnosis'}
          </button>
        </form>

        {result && <ResultCard result={result} />}
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const positive = result.positive;
  return (
    <div style={{ ...styles.resultCard, borderColor: positive ? '#ef4444' : '#22c55e' }}>
      <div style={{ fontSize: '2.5rem' }}>{positive ? '⚠️' : '✅'}</div>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: '700', color: positive ? '#ef4444' : '#22c55e' }}>
          {positive ? 'Positive' : 'Negative'}
        </div>
        <div style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>{result.message}</div>
        {result.confidence > 0 && (
          <div style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.85rem' }}>
            Confidence: {(result.confidence * 100).toFixed(1)}%
            {result.fromCache && ' · (cached)'}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', padding: '2rem' },
  container: { maxWidth: '900px', margin: '0 auto' },
  heading: { fontSize: '1.5rem', marginBottom: '1.5rem', color: '#e2e8f0' },
  select: { padding: '0.6rem 1rem', borderRadius: '0.5rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', fontSize: '1rem', marginBottom: '1.5rem', cursor: 'pointer' },
  form: { background: '#1e293b', borderRadius: '1rem', padding: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.95rem', outline: 'none' },
  btn: { padding: '0.75rem 2rem', borderRadius: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', fontSize: '1rem', cursor: 'pointer', fontWeight: '600' },
  resultCard: { marginTop: '1.5rem', background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '2px solid' },
};
