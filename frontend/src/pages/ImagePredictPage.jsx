import React, { useState, useRef } from 'react';
import { diagnosisApi } from '../services/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

const SEVERITY_COLOR = { None: 'var(--green)', High: 'var(--red)', Medium: '#f59e0b' };

export default function ImagePredictPage() {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const processFile = (f) => {
    if (!f) return;
    if (!['image/jpeg','image/png','image/jpg'].includes(f.type)) { toast.error('Only JPEG/PNG accepted'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return; }
    setFile(f); setPreview(URL.createObjectURL(f)); setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const { data } = await diagnosisApi.predictImage(file, 'chest_xray');
      setResult(data);
      toast.success('Analysis complete!');
    } catch {
      toast.error('Image analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: '860px', margin: '0 auto' }}>
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Chest X-Ray Analysis</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>AI-powered radiological screening with medical insights</p>
        </div>

        {/* Upload + preview side by side when result exists */}
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>

          {/* Upload form */}
          <form onSubmit={handleSubmit} className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              className="glass"
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current.click()}
              style={{
                padding: '2rem', textAlign: 'center', cursor: 'pointer',
                border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
                background: dragging ? 'rgba(99,102,241,0.06)' : 'var(--card)',
                transition: 'all 0.2s', minHeight: '200px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              }}>
              {preview
                ? <img src={preview} alt="xray" style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: '10px', objectFit: 'contain', filter: 'grayscale(20%)' }} />
                : <>
                    <div style={{ fontSize: '3rem', animation: 'float 3s ease-in-out infinite' }}>🩻</div>
                    <p style={{ color: 'var(--text)', fontWeight: 500 }}>Drop X-ray here or click to upload</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>JPEG / PNG · Max 10 MB</p>
                  </>
              }
              <input ref={inputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
            </div>

            {file && (
              <div className="glass" style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>📎 {file.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{(file.size/1024).toFixed(1)} KB</span>
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={!file || loading}
              style={{ padding: '0.85rem', fontSize: '1rem', borderRadius: '12px', opacity: file ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? <><span className="spinner" /> Analyzing X-Ray...</> : '🔍 Analyze X-Ray'}
            </button>

            {/* Image properties */}
            {result?.image_properties && (
              <div className="glass fade-up" style={{ padding: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Image Properties</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'Brightness', value: result.image_properties.mean_brightness },
                    { label: 'Contrast',   value: result.image_properties.contrast },
                    { label: 'Dark Regions', value: `${result.image_properties.dark_region_pct}%` },
                    { label: 'Bright Regions', value: `${result.image_properties.bright_region_pct}%` },
                    { label: 'Image Quality', value: result.image_properties.image_quality, full: true },
                  ].map(p => (
                    <div key={p.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem 0.75rem', gridColumn: p.full ? '1/-1' : 'auto' }}>
                      <p style={{ fontSize: '0.68rem', color: 'var(--muted)', marginBottom: '0.15rem', textTransform: 'uppercase' }}>{p.label}</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Results panel */}
          {result && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Main result */}
              <div className="glass" style={{ padding: '1.25rem', borderLeft: `4px solid ${result.positive ? 'var(--red)' : 'var(--green)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2.5rem', animation: 'float 2s ease-in-out infinite' }}>{result.positive ? '⚠️' : '✅'}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: result.positive ? 'var(--red)' : 'var(--green)' }}>{result.predicted_class}</h3>
                      <span className={result.positive ? 'badge-positive' : 'badge-negative'}>{result.positive ? 'Detected' : 'Clear'}</span>
                      {result.severity && result.severity !== 'None' && (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: `${SEVERITY_COLOR[result.severity]}18`, color: SEVERITY_COLOR[result.severity], border: `1px solid ${SEVERITY_COLOR[result.severity]}44`, fontWeight: 600 }}>
                          {result.severity} Severity
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{result.message}</p>
                  </div>
                </div>
                {result.confidence > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                      <span>Model Confidence</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{(result.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="conf-bar-track">
                      <div className="conf-bar-fill" style={{ width: `${result.confidence * 100}%`, background: `linear-gradient(90deg, ${result.positive ? 'var(--red)' : 'var(--green)'}, ${result.positive ? '#f9827288' : '#34d39988'})` }} />
                    </div>
                  </>
                )}
              </div>

              {/* Findings */}
              {result.findings?.length > 0 && (
                <div className="glass" style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>🔬 Radiological Findings</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.findings.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text)' }}>
                        <span style={{ color: result.positive ? 'var(--red)' : 'var(--green)', flexShrink: 0, marginTop: '0.1rem' }}>•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="glass" style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>💊 Recommendations</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.recommendations.map((r, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text)' }}>
                        <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.1rem' }}>→</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next steps */}
              {result.next_steps && (
                <div className="glass" style={{ padding: '1rem 1.25rem', background: result.positive ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', border: `1px solid ${result.positive ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>📋 Next Steps</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{result.next_steps}</p>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  ⚠️ <strong style={{ color: 'var(--text)' }}>Disclaimer:</strong> {result.disclaimer}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
