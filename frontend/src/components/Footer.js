import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-brand">
          <div className="footer-logo">⚕ MediMind</div>
          <p>AI-powered drug interaction checking for safer medication decisions.</p>
        </div>
        <div className="footer-nav">
          <div className="footer-col">
            <span className="footer-col-title">Product</span>
            <Link to="/">Home</Link>
            <Link to="/search">Drug Search</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Account</span>
            <Link to="/register">Sign Up Free</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom container">
        <p>For informational purposes only. Not a substitute for professional medical advice.</p>
        <p>© 2026 MediMind. Built for educational purposes.</p>
      </div>
    </footer>
  );
}
