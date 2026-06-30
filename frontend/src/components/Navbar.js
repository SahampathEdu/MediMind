import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const logout = () => { logoutUser(); navigate('/'); setOpen(false); };
  const active = (p) => location.pathname === p ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-mark">⚕</span>
          <span className="logo-word">Medi<em>Mind</em></span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={active('/')}>Home</Link>
          <Link to="/search" className={active('/search')}>Drug Search</Link>
          {user && <Link to="/dashboard" className={active('/dashboard')}>Dashboard</Link>}
          {user?.is_admin && <Link to="/admin" className={active('/admin')}>Admin</Link>}
        </div>

        <div className="navbar-end">
          {user ? (
            <div ref={ref} style={{ position: 'relative' }}>
              <button className="user-pill" onClick={() => setOpen(!open)}>
                <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-pill-name">{user.name.split(' ')[0]}</span>
                <span className="user-pill-arrow">{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <div className="dropdown-menu">
                  <div className="dropdown-top">
                    <p className="dropdown-top-name">{user.name}</p>
                    <p className="dropdown-top-email">{user.email}</p>
                  </div>
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setOpen(false)}>
                    <span className="dropdown-item-icon">📊</span> My Dashboard
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setOpen(false)}>
                    <span className="dropdown-item-icon">👤</span> Profile
                  </Link>
                  {user.is_admin && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setOpen(false)}>
                      <span className="dropdown-item-icon">🛡</span> Admin Panel
                    </Link>
                  )}
                  <button className="dropdown-item danger" onClick={logout}>
                    <span className="dropdown-item-icon">🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
