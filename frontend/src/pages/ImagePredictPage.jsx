import React, { useState, useRef } from 'react';
import { diagnosisApi } from '../services/api';
import toast from 'react-hot-toast';

export default function ImagePredictPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)) {
      toast.error('Only JPEG/PNG images accepted');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const { data } = await diagnosisApi.predictImage(file, 'chest_xray');
      setResult(data);
      toast.success('Image analyzed!');
    } catch {
      toast.error('Image analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>🩻 Medical Image Analysis</h2>
        <p style={styles.sub}>Upload a chest X-ray image for AI-powered disease detection</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Drop zone */}
          <div style={styles.dropZone} onClick={() => inputRef.current.click()}>
            {preview
              ? <img src={preview} alt="preview" style={styles.preview} />
              : <>
                  <div style={{ fontSize: '3rem' }}>🩻</div>
                  <p style={{ color: '#94a3b8' }}>Click to upload or drag & drop</p>
                  <p style={{ color: '#475569', fontSize: '0.85rem' }}>JPEG / PNG · Max 10 MB</p>
                </>
            }
            <input ref={inputRef} type="file" accept="image/jpeg,image/png"
              style={{ display: 'none' }} onChange={handleFile} />
          </div>

          {file && (
            <p style={styles.fileName}>📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
          )}

          <button style={{ ...styles.btn, opacity: file ? 1 : 0.5 }}
            type="submit" disabled={!file || loading}>
            {loading ? 'Analyzing image...' : 'Analyze Image'}
          </button>
        </form>

        {result && (
          <div style={{ ...styles.resultCard, borderColor: result.positive ? '#ef4444' : '#22c55e' }}>
            <div style={{ fontSize: '2.5rem' }}>{result.positive ? '⚠️' : '✅'}</div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: '700', color: result.positive ? '#ef4444' : '#22c55e' }}>
                {result.predictedClass}
              </div>
              <div style={{ color: '#cbd5e1', marginTop: '0.25rem' }}>{result.message}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', padding: '2rem' },
  container: { maxWidth: '600px', margin: '0 auto' },
  heading: { fontSize: '1.5rem', marginBottom: '0.5rem', color: '#e2e8f0' },
  sub: { color: '#64748b', marginBottom: '2rem' },
  form: { background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  dropZone: { border: '2px dashed #334155', borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minHeight: '200px', justifyContent: 'center' },
  preview: { maxHeight: '250px', maxWidth: '100%', borderRadius: '0.5rem', objectFit: 'contain' },
  fileName: { color: '#94a3b8', fontSize: '0.85rem' },
  btn: { padding: '0.75rem', borderRadius: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', fontSize: '1rem', cursor: 'pointer', fontWeight: '600' },
  resultCard: { marginTop: '1.5rem', background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '2px solid' },
};
