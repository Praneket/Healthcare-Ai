import React, { useEffect, useState } from 'react';
import { patientApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: '', age: '', gender: '', bloodGroup: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    patientApi.getProfile().then((r) => {
      const d = r.data;
      setForm({
        fullName: d.fullName || '',
        age: d.age || '',
        gender: d.gender || '',
        bloodGroup: d.bloodGroup || '',
      });
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await patientApi.updateProfile(form);
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>👤 My Profile</h2>
        <p style={styles.email}>{user?.email}</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="Full Name" value={form.fullName} onChange={set('fullName')} />
          <Field label="Age" type="number" value={form.age} onChange={set('age')} />
          <div style={styles.field}>
            <label style={styles.label}>Gender</label>
            <select style={styles.input} value={form.gender} onChange={set('gender')}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Blood Group</label>
            <select style={styles.input} value={form.bloodGroup} onChange={set('bloodGroup')}>
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type={type} value={value} onChange={onChange} />
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a', padding: '2rem' },
  container: { maxWidth: '500px', margin: '0 auto' },
  heading: { fontSize: '1.5rem', marginBottom: '0.25rem', color: '#e2e8f0' },
  email: { color: '#64748b', marginBottom: '2rem' },
  form: { background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '0.6rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '0.95rem', outline: 'none' },
  btn: { padding: '0.75rem', borderRadius: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', fontSize: '1rem', cursor: 'pointer', fontWeight: '600', marginTop: '0.5rem' },
};
