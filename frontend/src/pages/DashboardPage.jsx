import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import Layout from '../components/Layout';

const DISEASE_ICONS = { diabetes:'🩸', heart_disease:'❤️', parkinsons:'🧠', lung_cancer:'🫁', thyroid:'🦋', chest_xray:'🩻' };
const DISEASE_COLORS = { diabetes:'#f59e0b', heart_disease:'#ef4444', parkinsons:'#8b5cf6', lung_cancer:'#06b6d4', thyroid:'#10b981', chest_xray:'#6366f1' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary]   = useState(null);
  const [history, setHistory]   = useState([]);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useNotifications(user?.userId);

  const fetchData = useCallback(() => {
    Promise.all([
      patientApi.getSummary(),
      patientApi.getHistory(),
      patientApi.getProfile(),
    ]).then(([s, h, p]) => {
      setSummary(s.data);
      setHistory(h.data.slice(0, 6));
      setProfile(p.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 10s to pick up new diagnoses from Kafka
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const displayName = profile?.fullName || user?.fullName || user?.email?.split('@')[0] || 'User';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{greeting} 👋</p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>{displayName}</h1>
        </div>

        {/* Quick action cards */}
        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem', animationDelay: '0.05s' }}>
          {[
            { label: 'Total Diagnoses', value: loading ? '—' : (summary?.totalDiagnoses ?? 0), icon: '🔬', color: '#6366f1' },
            { label: 'Diseases Tracked', value: loading ? '—' : Object.keys(summary?.countByDisease ?? {}).length, icon: '📊', color: '#8b5cf6' },
            { label: 'Last Diagnosis', value: history[0] ? new Date(history[0].diagnosedAt).toLocaleDateString() : '—', icon: '📅', color: '#06b6d4' },
          ].map((card, i) => (
            <div key={i} className="glass card-hover" style={{ padding: '1.25rem', animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{card.label}</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color }}>{card.value}</p>
                </div>
                <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
              </div>
            </div>
          ))}

          {/* Run diagnosis CTA */}
          <Link to="/predict" style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ padding: '1.25rem', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.5rem' }}>⚡</span>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>Run Diagnosis</p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>AI-powered analysis</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Disease breakdown */}
        {summary?.countByDisease && Object.keys(summary.countByDisease).length > 0 && (
          <div className="glass fade-up" style={{ padding: '1.5rem', marginBottom: '2rem', animationDelay: '0.1s' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text)' }}>Disease Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(summary.countByDisease).map(([disease, count]) => {
                const pct = Math.round((count / summary.totalDiagnoses) * 100);
                return (
                  <div key={disease}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{DISEASE_ICONS[disease]} {disease.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="conf-bar-track">
                      <div className="conf-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${DISEASE_COLORS[disease] ?? '#6366f1'}, ${DISEASE_COLORS[disease] ?? '#6366f1'}88)` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent history */}
        <div className="fade-up" style={{ animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)' }}>Recent Diagnoses</h3>
            <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>View all →</Link>
          </div>

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64 }} />)}
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="glass" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔬</div>
              <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>No diagnoses yet</p>
              <Link to="/predict" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Run your first diagnosis →</Link>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {history.map((item, i) => (
              <div key={i} className="glass card-hover slide-in"
                style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animationDelay: `${i * 0.05}s`, borderLeft: `3px solid ${item.positive ? 'var(--red)' : 'var(--green)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{DISEASE_ICONS[item.diseaseType] ?? '💊'}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{item.diseaseType.replace(/_/g, ' ')}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{new Date(item.diagnosedAt).toLocaleString()}</p>
                  </div>
                </div>
                <span className={item.positive ? 'badge-positive' : 'badge-negative'}>
                  {item.positive ? 'Positive' : 'Negative'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
