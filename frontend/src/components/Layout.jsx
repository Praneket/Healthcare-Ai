import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { patientApi } from '../services/api';

const NAV = [
  { to: '/dashboard',     icon: '▦',  label: 'Dashboard'    },
  { to: '/predict',       icon: '⬡',  label: 'Diagnose'     },
  { to: '/predict/image', icon: '⬢',  label: 'Image Scan'   },
  { to: '/history',       icon: '◫',  label: 'History'      },
  { to: '/profile',       icon: '◉',  label: 'Profile'      },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileName, setProfileName] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    patientApi.getProfile()
      .then(r => { if (r.data.fullName) setProfileName(r.data.fullName); })
      .catch(() => {});
  }, []);

  const displayName = profileName || user?.fullName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: collapsed ? '72px' : '240px',
        background: 'rgba(13,17,23,0.95)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '1.25rem 0.75rem',
        gap: '0.25rem',
        flexShrink: 0,
        transition: 'width 0.3s ease',
        position: 'sticky', top: 0, height: '100vh',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.5rem 1.5rem', overflow: 'hidden' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', animation: 'float 3s ease-in-out infinite',
          }}>⚕</div>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: '1rem', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MediAI
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            className="nav-item"
            style={{ border: 'none', background: 'transparent', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', color: 'var(--muted)', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.1rem' }}>⏻</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button onClick={() => setCollapsed(c => !c)}
            style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', fontSize: '0.8rem', transition: 'color 0.2s' }}
            title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
