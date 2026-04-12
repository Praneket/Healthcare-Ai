import React, { useEffect, useState } from 'react';
import { patientApi } from '../services/api';

const DISEASE_ICONS = {
  diabetes: '🩸', heart_disease: '❤️', parkinsons: '🧠',
  lung_cancer: '🫁', thyroid: '🦋', chest_xray: '🩻',
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApi.getHistory(filter || undefined)
      .then((r) => setHistory(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>📋 Diagnosis History</h2>

        <select style={styles.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Diseases</option>
          {['diabetes', 'heart_disease', 'parkinsons', 'lung_cancer', 'thyroid', 'chest_xray'].map((d) => (
            <option key={d} value={d}>{d.replace('_', ' ')}</option>
          ))}
        </select>

        {loading && <p style={styles.empty}>Loading...</p>}
        {!loading && history.length === 0 && <p style={styles.empty}>No records found.</p>}

        <div style={styles.list}>
          {history.map((item, i) => (
            <div key={i} style={{ ...styles.row, borderLeft: `4px solid ${item.positive ? '#ef4444' : '#22c55e'}` }}>
              <div style={styles.rowLeft}>
                <span style={{ fontSize: '1.5rem' }}>{DISEASE_ICONS[item.diseaseType] ?? '💊'}</span>
                <div>
                  <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                    {item.diseaseType.replace('_', ' ')}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {new Date(item.diagnosedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={styles.rowRight}>
                <span style={{ color: item.positive ? '#ef4444' : '#22c55e', fontWeight: '600' }}>
                  {item.positive ? 'Positive' : 'Negative'}
                </span>
                {item.confidence > 0 && (
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {(item.confidence * 100).toFixed(1)}% confidence
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', padding: '2rem' },
  container: { maxWidth: '800px', margin: '0 auto' },
  heading: { fontSize: '1.5rem', marginBottom: '1.5rem', color: '#e2e8f0' },
  select: { padding: '0.6rem 1rem', borderRadius: '0.5rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', fontSize: '0.95rem', marginBottom: '1.5rem', cursor: 'pointer' },
  empty: { color: '#64748b' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  row: { background: '#1e293b', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  rowRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' },
};
