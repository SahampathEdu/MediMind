import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../services/api';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Profile() {
  const { user, loginUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await updateMe({ name });
      loginUser(localStorage.getItem('token'), res.data);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page" style={{gridTemplateColumns:'1fr'}}>
      <div className="auth-right" style={{background:'var(--snow)'}}>
        <div className="auth-card card anim-fade-up" style={{maxWidth:500}}>
          <div style={{fontSize:48,marginBottom:16}}>👤</div>
          <h2 className="auth-form-title">My Profile</h2>
          <p className="auth-form-sub">{user?.email}</p>
          <form onSubmit={submit} noValidate>
            <div className="field">
              <label className="field-label">Full Name</label>
              <input className="field-input" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
            <div className="field" style={{marginTop:20}}>
              <label className="field-label">Email</label>
              <input className="field-input" value={user?.email} disabled />
            </div>
            <div className="field" style={{marginTop:20}}>
              <label className="field-label">Role</label>
              <input className="field-input" value={user?.role?.replace('_',' ')} disabled style={{textTransform:'capitalize'}} />
            </div>
            <div className="field" style={{marginTop:20}}>
              <label className="field-label">Account Status</label>
              <input className="field-input" value={user?.status} disabled style={{textTransform:'capitalize'}} />
            </div>
            <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>
              {loading ? <><span className="spinner spinner-sm"/>Saving…</> : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
