import React, { useEffect, useState, useCallback } from 'react';
import { patientApi } from '../services/api';
import Layout from '../components/Layout';

const DISEASE_ICONS  = { diabetes:'🩸', heart_disease:'❤️', parkinsons:'🧠', lung_cancer:'🫁', thyroid:'🦋', chest_xray:'🩻' };
const DISEASE_COLORS = { diabetes:'#f59e0b', heart_disease:'#ef4444', parkinsons:'#8b5cf6', lung_cancer:'#06b6d4', thyroid:'#10b981', chest_xray:'#6366f1' };

// Human-readable labels for feature keys
const FEATURE_LABELS = {
  Pregnancies:'Pregnancies', Glucose:'Glucose Level', BloodPressure:'Blood Pressure',
  SkinThickness:'Skin Thickness', Insulin:'Insulin', BMI:'BMI',
  DiabetesPedigreeFunction:'Pedigree Function', Age:'Age',
  age:'Age', sex:'Sex', cp:'Chest Pain Type', trestbps:'Resting BP',
  chol:'Cholesterol', fbs:'Fasting Blood Sugar', restecg:'Resting ECG',
  thalach:'Max Heart Rate', exang:'Exercise Angina', oldpeak:'ST Depression',
  slope:'ST Slope', ca:'Major Vessels', thal:'Thal',
  fo:'MDVP:Fo(Hz)', fhi:'MDVP:Fhi(Hz)', flo:'MDVP:Flo(Hz)',
  Jitter_percent:'Jitter(%)', Jitter_Abs:'Jitter(Abs)', RAP:'RAP', PPQ:'PPQ', DDP:'DDP',
  Shimmer:'Shimmer', Shimmer_dB:'Shimmer(dB)', APQ3:'APQ3', APQ5:'APQ5',
  APQ:'APQ', DDA:'DDA', NHR:'NHR', HNR:'HNR', RPDE:'RPDE', DFA:'DFA',
  spread1:'Spread1', spread2:'Spread2', D2:'D2', PPE:'PPE',
  GENDER:'Gender', AGE:'Age', SMOKING:'Smoking', YELLOW_FINGERS:'Yellow Fingers',
  ANXIETY:'Anxiety', PEER_PRESSURE:'Peer Pressure', CHRONIC_DISEASE:'Chronic Disease',
  FATIGUE:'Fatigue', ALLERGY:'Allergy', WHEEZING:'Wheezing',
  ALCOHOL_CONSUMING:'Alcohol', COUGHING:'Coughing',
  SHORTNESS_OF_BREATH:'Shortness of Breath', SWALLOWING_DIFFICULTY:'Swallowing Difficulty',
  CHEST_PAIN:'Chest Pain', on_thyroxine:'On Thyroxine', tsh:'TSH Level',
  t3_measured:'T3 Measured', t3:'T3 Level', tt4:'TT4 Level',
  fileName:'File Name', inputType:'Input Type',
};

export default function HistoryPage() {
  const [history, setHistory]       = useState([]);
  const [filter, setFilter]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded]     = useState(null); // index of expanded row

  const fetchHistory = useCallback((showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    patientApi.getHistory(filter || undefined)
      .then(r => setHistory(r.data))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    setExpanded(null);
    fetchHistory();
    const interval = setInterval(() => fetchHistory(), 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const toggle = (i) => setExpanded(prev => prev === i ? null : i);

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Diagnosis History</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Click any record to see the full input values</p>
          </div>
          <button onClick={() => fetchHistory(true)} className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {refreshing ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '↻'} Refresh
          </button>
        </div>

        {/* Filter chips */}
        <div className="fade-up" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', animationDelay: '0.05s' }}>
          {['', 'diabetes', 'heart_disease', 'parkinsons', 'lung_cancer', 'thyroid', 'chest_xray'].map(d => (
            <button key={d} onClick={() => setFilter(d)}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '999px',
                border: `1px solid ${filter === d ? (DISEASE_COLORS[d] ?? 'var(--primary)') : 'var(--border)'}`,
                background: filter === d ? `${DISEASE_COLORS[d] ?? 'var(--primary)'}18` : 'transparent',
                color: filter === d ? (DISEASE_COLORS[d] ?? 'var(--primary)') : 'var(--muted)',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
              }}>
              {d ? `${DISEASE_ICONS[d]} ${d.replace(/_/g, ' ')}` : 'All'}
            </button>
          ))}
        </div>

        {/* Stats */}
        {!loading && history.length > 0 && (
          <div className="fade-up" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', animationDelay: '0.1s' }}>
            {[
              { label: 'Total',    value: history.length,                          color: 'var(--primary)' },
              { label: 'Positive', value: history.filter(h => h.positive).length,  color: 'var(--red)'     },
              { label: 'Negative', value: history.filter(h => !h.positive).length, color: 'var(--green)'   },
            ].map(s => (
              <div key={s.label} className="glass" style={{ padding: '0.75rem 1.25rem', flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 72 }} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && history.length === 0 && (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ color: 'var(--muted)' }}>No diagnosis records found</p>
          </div>
        )}

        {/* History list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {history.map((item, i) => {
            const isOpen  = expanded === i;
            const color   = DISEASE_COLORS[item.diseaseType] ?? '#6366f1';
            const features = item.features && Object.keys(item.features).length > 0 ? item.features : null;

            return (
              <div key={i} className="glass slide-in"
                style={{ borderLeft: `3px solid ${item.positive ? 'var(--red)' : 'var(--green)'}`, animationDelay: `${i * 0.04}s`, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>

                {/* Row header — clickable */}
                <div onClick={() => toggle(i)}
                  style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {DISEASE_ICONS[item.diseaseType] ?? '💊'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', marginBottom: '0.15rem' }}>
                        {item.diseaseType.replace(/_/g, ' ')}
                      </p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{new Date(item.diagnosedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span className={item.positive ? 'badge-positive' : 'badge-negative'}>
                        {item.positive ? 'Positive' : 'Negative'}
                      </span>
                      {item.confidence > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                          {(item.confidence * 100).toFixed(1)}% confidence
                        </span>
                      )}
                    </div>
                    {/* Expand chevron */}
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>▼</span>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', background: 'rgba(0,0,0,0.2)' }}>

                    {/* Result summary */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '10px', background: item.positive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${item.positive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                      <span style={{ fontSize: '1.8rem' }}>{item.positive ? '⚠️' : '✅'}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, color: item.positive ? 'var(--red)' : 'var(--green)', marginBottom: '0.2rem' }}>
                          {item.positive ? 'Positive — At Risk' : 'Negative — Clear'}
                        </p>
                        {item.confidence > 0 && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                              <span>Confidence</span>
                              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{(item.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="conf-bar-track">
                              <div className="conf-bar-fill" style={{ width: `${item.confidence * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Feature values grid */}
                    {features ? (
                      <>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                          Input Values
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
                          {Object.entries(features).map(([key, val]) => (
                            <div key={key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--border)' }}>
                              <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {FEATURE_LABELS[key] ?? key}
                              </p>
                              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>{val}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No input values recorded for this entry.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
