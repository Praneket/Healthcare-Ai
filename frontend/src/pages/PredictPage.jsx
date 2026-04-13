import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { diagnosisApi } from '../services/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const DISEASE_FEATURES = {
  diabetes: [
    { key: 'Pregnancies', label: 'Pregnancies', hint: 'Times pregnant' },
    { key: 'Glucose', label: 'Glucose Level', hint: 'mg/dL' },
    { key: 'BloodPressure', label: 'Blood Pressure', hint: 'mm Hg' },
    { key: 'SkinThickness', label: 'Skin Thickness', hint: 'mm' },
    { key: 'Insulin', label: 'Insulin', hint: 'mu U/ml' },
    { key: 'BMI', label: 'BMI', hint: 'kg/m²' },
    { key: 'DiabetesPedigreeFunction', label: 'Pedigree Function', hint: '0.0 – 2.5' },
    { key: 'Age', label: 'Age', hint: 'years' },
  ],
  heart_disease: [
    { key: 'age', label: 'Age', hint: 'years' },
    { key: 'sex', label: 'Sex', hint: '1=Male, 0=Female' },
    { key: 'cp', label: 'Chest Pain Type', hint: '0–3' },
    { key: 'trestbps', label: 'Resting BP', hint: 'mm Hg' },
    { key: 'chol', label: 'Cholesterol', hint: 'mg/dl' },
    { key: 'fbs', label: 'Fasting Blood Sugar', hint: '>120mg/dl: 1/0' },
    { key: 'restecg', label: 'Resting ECG', hint: '0–2' },
    { key: 'thalach', label: 'Max Heart Rate', hint: 'bpm' },
    { key: 'exang', label: 'Exercise Angina', hint: '1=Yes, 0=No' },
    { key: 'oldpeak', label: 'ST Depression', hint: '0.0–6.2' },
    { key: 'slope', label: 'ST Slope', hint: '0–2' },
    { key: 'ca', label: 'Major Vessels', hint: '0–3' },
    { key: 'thal', label: 'Thal', hint: '0=Normal, 1=Fixed, 2=Reversible' },
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
    { key: 'GENDER', label: 'Gender', hint: '1=Male, 0=Female' }, { key: 'AGE', label: 'Age', hint: 'years' },
    { key: 'SMOKING', label: 'Smoking', hint: '1/0' }, { key: 'YELLOW_FINGERS', label: 'Yellow Fingers', hint: '1/0' },
    { key: 'ANXIETY', label: 'Anxiety', hint: '1/0' }, { key: 'PEER_PRESSURE', label: 'Peer Pressure', hint: '1/0' },
    { key: 'CHRONIC_DISEASE', label: 'Chronic Disease', hint: '1/0' }, { key: 'FATIGUE', label: 'Fatigue', hint: '1/0' },
    { key: 'ALLERGY', label: 'Allergy', hint: '1/0' }, { key: 'WHEEZING', label: 'Wheezing', hint: '1/0' },
    { key: 'ALCOHOL_CONSUMING', label: 'Alcohol', hint: '1/0' }, { key: 'COUGHING', label: 'Coughing', hint: '1/0' },
    { key: 'SHORTNESS_OF_BREATH', label: 'Shortness of Breath', hint: '1/0' },
    { key: 'SWALLOWING_DIFFICULTY', label: 'Swallowing Difficulty', hint: '1/0' },
    { key: 'CHEST_PAIN', label: 'Chest Pain', hint: '1/0' },
  ],
  thyroid: [
    { key: 'age', label: 'Age', hint: 'years' }, { key: 'sex', label: 'Sex', hint: '1=Male, 0=Female' },
    { key: 'on_thyroxine', label: 'On Thyroxine', hint: '1/0' }, { key: 'tsh', label: 'TSH Level', hint: 'mIU/L' },
    { key: 't3_measured', label: 'T3 Measured', hint: '1/0' }, { key: 't3', label: 'T3 Level', hint: 'nmol/L' },
    { key: 'tt4', label: 'TT4 Level', hint: 'nmol/L' },
  ],
};

const DISEASE_META = {
  diabetes:     { icon: '🩸', color: '#f59e0b', desc: 'Blood glucose & insulin analysis' },
  heart_disease:{ icon: '❤️', color: '#ef4444', desc: 'Cardiovascular risk assessment' },
  parkinsons:   { icon: '🧠', color: '#8b5cf6', desc: 'Voice biomarker analysis' },
  lung_cancer:  { icon: '🫁', color: '#06b6d4', desc: 'Symptom-based lung cancer screening' },
  thyroid:      { icon: '🦋', color: '#10b981', desc: 'Thyroid hormone level analysis' },
};

export default function PredictPage() {
  const [diseaseType, setDiseaseType] = useState('diabetes');
  const [values, setValues]           = useState({});
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);

  const features = DISEASE_FEATURES[diseaseType];
  const meta     = DISEASE_META[diseaseType];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await diagnosisApi.predict(diseaseType, values);
      setResult(data);
      toast.success('Analysis complete!');
    } catch {
      toast.error('Prediction failed. Check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>AI Diagnosis</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Enter patient data for instant AI-powered analysis</p>
        </div>

        {/* Disease selector */}
        <div className="fade-up" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', animationDelay: '0.05s' }}>
          {Object.entries(DISEASE_META).map(([key, m]) => (
            <button key={key} onClick={() => { setDiseaseType(key); setValues({}); setResult(null); }}
              style={{
                padding: '0.6rem 1rem', borderRadius: '10px', border: `1px solid ${diseaseType === key ? m.color : 'var(--border)'}`,
                background: diseaseType === key ? `${m.color}18` : 'var(--card)',
                color: diseaseType === key ? m.color : 'var(--muted)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                transition: 'all 0.2s ease', fontFamily: 'Inter, sans-serif',
                backdropFilter: 'blur(8px)',
              }}>
              {m.icon} {key.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Disease info banner */}
        <div className="glass fade-up" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `3px solid ${meta.color}`, animationDelay: '0.1s' }}>
          <span style={{ fontSize: '2rem' }}>{meta.icon}</span>
          <div>
            <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>{diseaseType.replace(/_/g, ' ')}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{meta.desc}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="glass" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {features.map(({ key, label, hint }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.35rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                    {hint && <span style={{ color: '#475569', marginLeft: '0.3rem', textTransform: 'none', letterSpacing: 0 }}>({hint})</span>}
                  </label>
                  <input className="input-field" type="number" step="any" required placeholder="0"
                    value={values[key] ?? ''}
                    onChange={e => setValues(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}
            style={{ padding: '0.85rem 2.5rem', fontSize: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? <><span className="spinner" /> Analyzing...</> : '⚡ Run Diagnosis'}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="glass fade-up" style={{ marginTop: '1.5rem', padding: '1.75rem', borderLeft: `4px solid ${result.positive ? 'var(--red)' : 'var(--green)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '3rem', animation: 'float 2s ease-in-out infinite' }}>
                {result.positive ? '⚠️' : '✅'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: result.positive ? 'var(--red)' : 'var(--green)' }}>
                    {result.positive ? 'Positive Result' : 'Negative Result'}
                  </h3>
                  <span className={result.positive ? 'badge-positive' : 'badge-negative'}>
                    {result.positive ? 'At Risk' : 'Clear'}
                  </span>
                  {result.fromCache && <span style={{ fontSize: '0.75rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>cached</span>}
                </div>
                <p style={{ color: 'var(--muted)', marginBottom: '0.75rem' }}>{result.message}</p>
                {result.confidence > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                      <span>Confidence</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="conf-bar-track">
                      <div className="conf-bar-fill" style={{ width: `${result.confidence * 100}%` }} />
                    </div>
                  </>
                )}
                <Link to="/history" style={{ display: 'inline-block', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                  View in History →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
