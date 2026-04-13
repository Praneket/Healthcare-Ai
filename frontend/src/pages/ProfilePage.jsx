import React, { useEffect, useState } from 'react';
import { patientApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm]     = useState({ fullName: '', age: '', gender: '', bloodGroup: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    patientApi.getProfile().then(r => {
      const d = r.data;
      setForm({ fullName: d.fullName || '', age: d.age || '', gender: d.gender || '', bloodGroup: d.bloodGroup || '' });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await patientApi.updateProfile(form);
      toast.success('Profile updated!');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const set = f => e => setForm({ ...form, [f]: e.target.value });
  const initials = (form.fullName || user?.email || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: '560px', margin: '0 auto' }}>
        <div className="fade-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Profile</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Manage your personal health information</p>
        </div>

        {/* Avatar */}
        <div className="fade-up glass" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', animationDelay: '0.05s' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, flexShrink: 0, animation: 'pulse-ring 2.5s infinite' }}>
            {initials}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{form.fullName || 'Your Name'}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user?.email}</p>
            <p style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{user?.role ?? 'PATIENT'}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass fade-up" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', animationDelay: '0.1s' }}>
          {[
            { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'John Doe' },
            { label: 'Age', key: 'age', type: 'number', placeholder: '25' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem', fontWeight: 500 }}>{label}</label>
              <input className="input-field" type={type} placeholder={placeholder} value={form[key]} onChange={set(key)} />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem', fontWeight: 500 }}>Gender</label>
            <select className="input-field" value={form.gender} onChange={set('gender')}>
              <option value="">Select gender</option>
              {['Male', 'Female', 'Other'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem', fontWeight: 500 }}>Blood Group</label>
            <select className="input-field" value={form.bloodGroup} onChange={set('bloodGroup')}>
              <option value="">Select blood group</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}
            style={{ padding: '0.85rem', fontSize: '1rem', borderRadius: '12px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? <><span className="spinner" /> Saving...</> : saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
