import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, login } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'patient' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const set = e => setForm({...form, [e.target.name]: e.target.value});

  const submit = async e => {
    e.preventDefault();
    if(form.password.length < 6){ toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      const res = await login({ email:form.email, password:form.password });
      loginUser(res.data.access_token, res.data.user);
      toast.success('Account created! Welcome to MediMind 🎉');
      navigate('/dashboard');
    } catch(err) {
      toast.error(err.response?.data?.detail || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">⚕ MediMind</div>
          <h2 className="auth-tagline">Join thousands making safer medication choices.</h2>
          <p className="auth-tagline-sub">Free forever. No credit card. Cancel anytime.</p>
          <div className="auth-bullets">
            {['Full dashboard with history','Save unlimited searches','Personalised patient notes','Admin tools for professionals'].map(b => (
              <div key={b} className="auth-bullet"><span className="auth-bullet-dot">✓</span>{b}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card anim-fade-up">
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-sub">Free forever — no credit card required</p>
          <form onSubmit={submit} noValidate>
            <div className="field">
              <label className="field-label">Full Name</label>
              <input className="field-input" name="name" value={form.name} onChange={set} placeholder="Dr. Jane Smith" required />
            </div>
            <div className="field" style={{marginTop:20}}>
              <label className="field-label">Email address</label>
              <input className="field-input" type="email" name="email" value={form.email} onChange={set} placeholder="you@example.com" required />
            </div>
            <div className="field" style={{marginTop:20}}>
              <label className="field-label">Password</label>
              <input className="field-input" type="password" name="password" value={form.password} onChange={set} placeholder="Minimum 6 characters" required />
            </div>
            <div className="field" style={{marginTop:20}}>
              <label className="field-label">I am a</label>
              <select className="field-input" name="role" value={form.role} onChange={set}>
                <option value="patient">Patient</option>
                <option value="healthcare_worker">Healthcare Worker / Pharmacist</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm"/>Creating account…</> : 'Create Account →'}
            </button>
          </form>
          <div className="auth-divider"><span>or</span></div>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
