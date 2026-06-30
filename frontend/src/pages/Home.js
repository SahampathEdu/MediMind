import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DrugSearchForm from '../components/DrugSearchForm';
import './Home.css';

const features = [
  { icon:'🔬', title:'AI-Powered Analysis', desc:'Machine learning trained on 382,000+ drug pairs predicts interactions with high accuracy.' },
  { icon:'⚡', title:'Instant Results', desc:'Get risk levels, descriptions, and confidence scores in milliseconds — no login needed.' },
  { icon:'👤', title:'Patient-Aware', desc:'Personalised warnings based on age, gender, and existing health conditions.' },
  { icon:'📊', title:'Visual Insights', desc:'Confidence bars, risk charts, and severity indicators make results easy to understand.' },
  { icon:'🔐', title:'Saved History', desc:'Create a free account to track all your past searches and monitor patterns.' },
  { icon:'🛡', title:'Trusted Data', desc:'Built on DrugBank clinical interaction data with over 382,000 verified drug pairs.' },
];

const stats = [
  { val:'382K+', lbl:'Drug Pairs' },
  { val:'AI+DB', lbl:'Prediction Method' },
  { val:'3',     lbl:'Risk Levels' },
  { val:'Free',  lbl:'No Login Needed' },
];

const examples = [
  { d1:'aspirin', d2:'warfarin' },
  { d1:'sertraline', d2:'tramadol' },
  { d1:'metformin', d2:'alcohol' },
  { d1:'omeprazole', d2:'clopidogrel' },
];

export default function Home() {
  const [formDrug1, setFormDrug1] = useState('');
  const [formDrug2, setFormDrug2] = useState('');

  return (
    <div className="home-page">

      {/* ── Hero ────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="container">
          <div className="hero-content">
            <div className="anim-fade-up">
              <div className="hero-eyebrow">
                <span className="eyebrow-dot" />
                AI-Powered Drug Safety Platform
              </div>
              <h1 className="hero-title">
                Check Drug<br />
                <span className="hero-title-accent">Interactions</span><br />
                Instantly
              </h1>
              <p className="hero-sub">
                MediMind uses machine learning trained on 382,000+ drug pairs
                to help patients, pharmacists, and clinicians avoid dangerous
                drug combinations — completely free.
              </p>
            </div>

            <div className="hero-search-card anim-fade-up delay-2">
              <div className="hero-search-label">🔍 Try it now — no account required</div>
              <DrugSearchForm compact={false} />
            </div>

            <div className="example-pills anim-fade-up delay-3">
              <span className="ex-label">Try an example:</span>
              {examples.map(ex => (
                <button key={ex.d1+ex.d2} className="ex-pill"
                  onClick={() => {
                    window.scrollTo({ top: 340, behavior: 'smooth' });
                  }}>
                  {ex.d1} + {ex.d2}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────── */}
      <section className="stats-strip">
        {stats.map((s, i) => (
          <div key={s.lbl} className={`stat-cell anim-fade-up delay-${i+1}`}>
            <span className="stat-val">{s.val}</span>
            <span className="stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="how-section section-pad">
        <div className="container">
          <div className="how-header">
            <span className="section-eyebrow">How It Works</span>
            <h2 className="section-title">Three steps to safer medication</h2>
          </div>
          <div className="how-steps">
            {[
              { n:'01', title:'Enter Drug Names', desc:'Type both drug names into the search form. Autocomplete helps you find the right drug quickly.', icon:'✏️' },
              { n:'02', title:'AI Analyses the Pair', desc:'Our ML model and clinical database check the combination instantly, returning a detailed prediction.', icon:'🤖' },
              { n:'03', title:'Review & Act Safely', desc:'Get risk level, interaction description, confidence score, and personalised patient notes.', icon:'✅' },
            ].map((s, i) => (
              <div key={s.n} className={`how-step card card-hover anim-fade-up delay-${i+1}`}>
                <span className="how-num">{s.n}</span>
                <span className="how-icon">{s.icon}</span>
                <h3 className="how-title">{s.title}</h3>
                <p className="how-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="features-section section-pad" style={{ background:'var(--snow)' }}>
        <div className="container">
          <span className="section-eyebrow">Features</span>
          <h2 className="section-title">Everything you need for safer prescribing</h2>
          <p className="section-body" style={{ marginBottom:56 }}>
            MediMind combines AI prediction with a comprehensive clinical dataset
            so you always get the most complete picture.
          </p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={f.title} className={`feature-tile card card-hover anim-fade-up delay-${(i%4)+1}`}>
                <span className="feature-icon-wrap">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="container">
          <div className="cta-inner anim-fade-up">
            <span className="section-eyebrow" style={{ color:'var(--sage)' }}>Save your work</span>
            <h2 className="cta-title">Track your search history</h2>
            <p className="cta-sub">
              Create a free account to save every interaction search,
              view trends in your dashboard, and get personalised insights.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-xl" style={{ background:'white', color:'var(--forest)' }}>
                Create Free Account →
              </Link>
              <Link to="/search" className="btn btn-xl btn-outline" style={{ borderColor:'rgba(255,255,255,.35)', color:'white' }}>
                Continue Without Account
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
