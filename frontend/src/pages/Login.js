import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const set = e => setForm({...form, [e.target.name]: e.target.value});

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.access_token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}! 👋`);
      navigate(res.data.user.is_admin ? '/admin' : '/dashboard');
    } catch(err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">⚕ MediMind</div>
          <h2 className="auth-tagline">Safer medication decisions,<br/>powered by AI.</h2>
          <p className="auth-tagline-sub">382,000+ drug interaction pairs at your fingertips.</p>
          <div className="auth-bullets">
            {['Instant drug interaction checks','AI + clinical database','Patient-aware risk notes','Free forever'].map(b => (
              <div key={b} className="auth-bullet"><span className="auth-bullet-dot">✓</span>{b}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card anim-fade-up">
          <h2 className="auth-form-title">Welcome back</h2>
          <p className="auth-form-sub">Login to your MediMind account</p>
          <form onSubmit={submit} noValidate>
            <div className="field">
              <label className="field-label">Email address</label>
              <input className="field-input" type="email" name="email"
                value={form.email} onChange={set} placeholder="you@example.com" required />
            </div>
            <div className="field" style={{marginTop:20}}>
              <label className="field-label">Password</label>
              <input className="field-input" type="password" name="password"
                value={form.password} onChange={set} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm"/>Signing in…</> : 'Sign In →'}
            </button>
          </form>
          <div className="auth-divider"><span>or</span></div>
          <p className="auth-switch">Don't have an account? <Link to="/register">Create one free</Link></p>
          <p className="auth-switch" style={{marginTop:8}}>
            <Link to="/search" style={{color:'var(--stone)'}}>Continue without account →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
