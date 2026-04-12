import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';

const DISEASE_ICONS = {
  diabetes: '🩸', heart_disease: '❤️', parkinsons: '🧠',
  lung_cancer: '🫁', thyroid: '🦋', chest_xray: '🩻',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);

  useNotifications(user?.userId);

  useEffect(() => {
    patientApi.getSummary().then((r) => setSummary(r.data)).catch(() => {});
    patientApi.getHistory().then((r) => setHistory(r.data.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>⚕️ Healthcare AI</div>
        <nav style={styles.nav}>
          <NavLink to="/dashboard" label="📊 Dashboard" />
          <NavLink to="/predict" label="🔬 Diagnose" />
          <NavLink to="/predict/image" label="🩻 Image Scan" />
          <NavLink to="/history" label="📋 History" />
          <NavLink to="/profile" label="👤 Profile" />
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>Sign Out</button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <h2 style={styles.heading}>Welcome, {user?.email} 👋</h2>

        {/* Summary cards */}
        <div style={styles.cardGrid}>
          <StatCard label="Total Diagnoses" value={summary?.totalDiagnoses ?? '—'} icon="🔬" />
          {summary?.countByDisease && Object.entries(summary.countByDisease).map(([disease, count]) => (
            <StatCard key={disease} label={disease.replace('_', ' ')} value={count} icon={DISEASE_ICONS[disease] ?? '💊'} />
          ))}
        </div>

        {/* Recent history */}
        <h3 style={styles.sectionTitle}>Recent Diagnoses</h3>
        {history.length === 0
          ? <p style={styles.empty}>No diagnoses yet. <Link to="/predict" style={{ color: '#38bdf8' }}>Run your first one →</Link></p>
          : <div style={styles.historyList}>
              {history.map((h, i) => (
                <HistoryRow key={i} item={h} />
              ))}
            </div>
        }
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div style={styles.statCard}>
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#38bdf8' }}>{value}</div>
        <div style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{label}</div>
      </div>
    </div>
  );
}

function HistoryRow({ item }) {
  return (
    <div style={{ ...styles.historyRow, borderLeft: `4px solid ${item.positive ? '#ef4444' : '#22c55e'}` }}>
      <span>{DISEASE_ICONS[item.diseaseType] ?? '💊'} {item.diseaseType.replace('_', ' ')}</span>
      <span style={{ color: item.positive ? '#ef4444' : '#22c55e', fontWeight: '600' }}>
        {item.positive ? 'Positive' : 'Negative'}
      </span>
      <span style={{ color: '#64748b' }}>{new Date(item.diagnosedAt).toLocaleDateString()}</span>
    </div>
  );
}

function NavLink({ to, label }) {
  return <Link to={to} style={styles.navLink}>{label}</Link>;
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: '#0f172a' },
  sidebar: { width: '220px', background: '#1e293b', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 },
  logo: { fontSize: '1.2rem', fontWeight: '700', color: '#38bdf8', marginBottom: '1.5rem', padding: '0 0.5rem' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 },
  navLink: { padding: '0.6rem 0.75rem', borderRadius: '0.5rem', color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', display: 'block' },
  logoutBtn: { padding: '0.6rem', borderRadius: '0.5rem', background: 'transparent', border: '1px solid #334155', color: '#94a3b8', cursor: 'pointer', marginTop: 'auto' },
  main: { flex: 1, padding: '2rem', overflowY: 'auto' },
  heading: { fontSize: '1.5rem', marginBottom: '1.5rem', color: '#e2e8f0' },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#1e293b', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  sectionTitle: { fontSize: '1.1rem', color: '#94a3b8', marginBottom: '1rem' },
  empty: { color: '#64748b' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  historyRow: { background: '#1e293b', borderRadius: '0.5rem', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '1rem' },
};
