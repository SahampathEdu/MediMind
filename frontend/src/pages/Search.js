import React from 'react';
import DrugSearchForm from '../components/DrugSearchForm';
import './Search.css';

const riskCards = [
  { icon:'🔴', level:'High Risk', color:'#fee2e2', border:'#fca5a5', text:'#991b1b', desc:'Dangerous combination. Avoid or seek immediate medical advice.' },
  { icon:'🟡', level:'Moderate Risk', color:'#fef3c7', border:'#fcd34d', text:'#92400e', desc:'May reduce efficacy or cause side effects. Monitor closely.' },
  { icon:'🟢', level:'Low Risk', color:'var(--mist)', border:'var(--sage)', text:'var(--forest)', desc:'Minor or no significant interaction detected.' },
];

export default function Search() {
  return (
    <div className="search-page page-enter">
      <div className="search-hero">
        <div className="container">
          <span className="section-eyebrow">Drug Interaction Checker</span>
          <h1 className="search-h1">Check any drug combination</h1>
          <p className="search-sub">
            Powered by AI and clinical data from 382,000+ drug pairs.
            Enter two drug names below — no account required.
          </p>
        </div>
      </div>

      <div className="container search-body">
        <div className="search-form-card card">
          <DrugSearchForm compact={false} />
        </div>

        <div className="risk-guide">
          <h3 className="risk-guide-title">Understanding Risk Levels</h3>
          <div className="risk-cards-row">
            {riskCards.map(r => (
              <div key={r.level} className="risk-card"
                style={{ background:r.color, borderColor:r.border, color:r.text }}>
                <span className="risk-card-icon">{r.icon}</span>
                <strong>{r.level}</strong>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="disclaimer-box">
          <span className="disclaimer-icon">⚕️</span>
          <p>
            <strong>Medical Disclaimer:</strong> MediMind is for informational and educational purposes only.
            It does not replace professional medical advice, diagnosis, or treatment.
            Always consult a qualified healthcare provider before making any medication decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
