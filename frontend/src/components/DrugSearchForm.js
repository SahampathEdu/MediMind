import React, { useState, useRef, useEffect, useCallback } from 'react';
import { predictInteraction, searchDrugs } from '../services/api';
import toast from 'react-hot-toast';
import './DrugSearchForm.css';

/* ── Risk badge ─────────────────────────────────────────────── */
function RiskBadge({ level }) {
  const cfg = {
    High:     { cls: 'badge-high',     icon: '🔴', label: 'High Risk' },
    Moderate: { cls: 'badge-moderate', icon: '🟡', label: 'Moderate Risk' },
    Low:      { cls: 'badge-low',      icon: '🟢', label: 'Low Risk' },
    Unknown:  { cls: 'badge-unknown',  icon: '⚪', label: 'Unknown' },
  };
  const c = cfg[level] || cfg.Unknown;
  return <span className={`badge ${c.cls}`}>{c.icon} {c.label}</span>;
}

/* ── Confidence bar ─────────────────────────────────────────── */
function ConfidenceBar({ score }) {
  const pct = Math.round(score * 100);
  const color = score >= .85 ? 'var(--jade)' : score >= .65 ? 'var(--warn)' : '#fc8181';
  return (
    <div className="conf-wrap">
      <div className="conf-track">
        <div className="conf-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="conf-label">{pct}%</span>
    </div>
  );
}

/* ── Autocomplete input ─────────────────────────────────────── */
function DrugInput({ label, value, onChange, placeholder, icon }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    clearTimeout(timer.current);
    if (v.length >= 2) {
      timer.current = setTimeout(async () => {
        try {
          const res = await searchDrugs(v);
          setSuggestions(res.data.drugs || []);
          setOpen(true);
        } catch { setSuggestions([]); }
      }, 180);
    } else { setSuggestions([]); setOpen(false); }
  };

  return (
    <div className="drug-input-wrap" ref={ref}>
      <div className="drug-input-inner">
        <span className="drug-input-icon">{icon}</span>
        <div className="field" style={{ flex: 1 }}>
          <label className="field-label">{label}</label>
          <input
            className="field-input drug-field"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            autoComplete="off"
            onFocus={() => suggestions.length > 0 && setOpen(true)}
          />
        </div>
      </div>
      {open && suggestions.length > 0 && (
        <ul className="suggest-list">
          {suggestions.map(s => (
            <li key={s} className="suggest-item"
              onClick={() => { onChange(s); setOpen(false); setSuggestions([]); }}>
              <span className="suggest-icon">💊</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Main form ──────────────────────────────────────────────── */
export default function DrugSearchForm({ compact = false }) {
  const [drug1, setDrug1] = useState('');
  const [drug2, setDrug2] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [conditions, setConditions] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!drug1.trim() || !drug2.trim()) { toast.error('Please enter both drug names'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await predictInteraction({
        drug1: drug1.trim(), drug2: drug2.trim(),
        age: age ? parseInt(age) : null,
        gender: gender || null,
        health_conditions: conditions ? conditions.split(',').map(c => c.trim()).filter(Boolean) : null,
      });
      setResult(res.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
    } catch { toast.error('Request failed. Is the backend running?'); }
    finally { setLoading(false); }
  };

  const resultClass = { High:'result-high', Moderate:'result-moderate', Low:'result-low', Unknown:'result-unknown' }[result?.risk_level] || 'result-unknown';

  return (
    <div className="search-form-root">
      <form onSubmit={submit} noValidate>
        {/* Drug pair row */}
        <div className="drugs-row">
          <DrugInput label="First Drug" value={drug1} onChange={setDrug1} placeholder="e.g. Aspirin" icon="💊" />
          <div className="vs-badge">VS</div>
          <DrugInput label="Second Drug" value={drug2} onChange={setDrug2} placeholder="e.g. Warfarin" icon="💊" />
        </div>

        {/* Optional patient info */}
        {!compact && (
          <div className="patient-row">
            <div className="field">
              <label className="field-label">Age <span className="optional-tag">optional</span></label>
              <input className="field-input" type="number" min="1" max="120"
                value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 65" />
            </div>
            <div className="field">
              <label className="field-label">Gender <span className="optional-tag">optional</span></label>
              <select className="field-input" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field" style={{ flex: 2 }}>
              <label className="field-label">Health Conditions <span className="optional-tag">optional, comma-separated</span></label>
              <input className="field-input" value={conditions} onChange={e => setConditions(e.target.value)}
                placeholder="e.g. diabetes, kidney disease, liver disease" />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block check-btn" disabled={loading}>
          {loading
            ? <><span className="spinner spinner-sm" /> Analysing interaction…</>
            : <><span>🔬</span> Check Interaction</>}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div ref={resultRef} className={`result-wrap ${resultClass} anim-scale-in`}>
          {/* Header */}
          <div className="result-head">
            <div className="result-drugs">
              <span className="drug-chip">{result.drug1}</span>
              <span className="drug-plus">+</span>
              <span className="drug-chip">{result.drug2}</span>
            </div>
            <RiskBadge level={result.risk_level} />
          </div>

          {result.found ? (
            <div className="result-body">
              {result.interaction_effect && (
                <div className="result-line">
                  <span className="rl-key">Effect</span>
                  <span className="rl-val">{result.interaction_effect}</span>
                </div>
              )}
              {result.interaction_description && (
                <div className="result-line">
                  <span className="rl-key">Description</span>
                  <span className="rl-val">{result.interaction_description}</span>
                </div>
              )}
              {result.interaction_type && (
                <div className="result-line">
                  <span className="rl-key">Type</span>
                  <span className="type-chip">{result.interaction_type.replace(/_/g,' ')}</span>
                </div>
              )}
              {result.prediction_source && (
                <div className="result-line">
                  <span className="rl-key">Source</span>
                  <span className="source-chip">{result.prediction_source === 'dataset+ml' ? '🤖 Dataset + AI Model' : result.prediction_source === 'ml_only' ? '🤖 AI Model' : '📚 Dataset'}</span>
                </div>
              )}
              {result.confidence_score != null && (
                <div className="result-line align-top">
                  <span className="rl-key">Confidence</span>
                  <ConfidenceBar score={result.confidence_score} />
                </div>
              )}
              {result.patient_risk_note && (
                <div className="risk-note-box">
                  <span className="risk-note-icon">ℹ️</span>
                  <p>{result.patient_risk_note}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-interaction-box">
              <span className="no-int-icon">✅</span>
              <p>No known interaction detected between <strong>{result.drug1}</strong> and <strong>{result.drug2}</strong>.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
