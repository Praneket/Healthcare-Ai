import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.register(form.email, form.password, form.fullName);
      login(data);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚕️ Healthcare AI</h1>
        <p style={styles.subtitle}>Create your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} placeholder="Full Name" required value={form.fullName} onChange={set('fullName')} />
          <input style={styles.input} type="email" placeholder="Email" required value={form.email} onChange={set('email')} />
          <input style={styles.input} type="password" placeholder="Password (min 6 chars)" minLength={6} required value={form.password} onChange={set('password')} />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p style={styles.link}>
          Have an account? <Link to="/login" style={{ color: '#38bdf8' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  card: { background: '#1e293b', padding: '2.5rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  title: { fontSize: '1.8rem', textAlign: 'center', marginBottom: '0.25rem', color: '#38bdf8' },
  subtitle: { textAlign: 'center', color: '#94a3b8', marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '1rem', outline: 'none' },
  btn: { padding: '0.75rem', borderRadius: '0.5rem', background: '#0ea5e9', color: '#fff', border: 'none', fontSize: '1rem', cursor: 'pointer', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: '1.5rem', color: '#94a3b8' },
};
