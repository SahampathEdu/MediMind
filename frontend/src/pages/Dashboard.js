import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyHistory } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Dashboard.css';

const RISK_COLORS = { High:'#ef4444', Moderate:'#f59e0b', Low:'#22a06b', Unknown:'#9ca3af' };

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyHistory(0, 50).then(r => setHistory(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const riskCounts = history.reduce((a, h) => {
    const r = h.risk_level || 'Unknown';
    a[r] = (a[r]||0)+1; return a;
  }, {});

  const pieData = Object.entries(riskCounts).map(([name, value]) => ({ name, value }));
  const barData = history.slice(0,12).map(h => ({
    label: `${h.drug1}+${h.drug2}`.substring(0,22),
    score: h.confidence_score ? Math.round(h.confidence_score*100) : 0,
    level: h.risk_level,
  }));

  const statCards = [
    { label:'Total Searches',  val:history.length, color:'var(--pine)', bg:'var(--foam)' },
    { label:'High Risk Found',  val:riskCounts['High']||0,     color:'#991b1b', bg:'#fee2e2' },
    { label:'Moderate Risk',    val:riskCounts['Moderate']||0, color:'#92400e', bg:'#fef3c7' },
    { label:'Low / No Risk',    val:riskCounts['Low']||0,      color:'var(--pine)', bg:'var(--mist)' },
  ];

  return (
    <div className="dash-page page-enter">
      <div className="dash-hero">
        <div className="container">
          <div className="dash-hero-inner">
            <div>
              <span className="section-eyebrow">My Dashboard</span>
              <h1 className="dash-h1">Welcome back, {user?.name?.split(' ')[0]}</h1>
              <p style={{color:'rgba(255,255,255,.65)',fontSize:16,marginTop:6}}>
                {user?.role?.replace('_',' ')} · {user?.email}
              </p>
            </div>
            <Link to="/search" className="btn btn-xl" style={{background:'white',color:'var(--forest)',flexShrink:0}}>
              + New Search
            </Link>
          </div>
        </div>
      </div>

      <div className="container dash-body">
        {/* Stat cards */}
        <div className="stat-grid">
          {statCards.map((s,i) => (
            <div key={s.label} className={`stat-card anim-fade-up delay-${i+1}`} style={{background:s.bg}}>
              <span className="stat-card-val" style={{color:s.color}}>{s.val}</span>
              <span className="stat-card-lbl">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Charts */}
        {history.length > 0 && (
          <div className="charts-grid anim-fade-up delay-2">
            <div className="card chart-card">
              <h3 className="chart-h">Risk Distribution</h3>
              <p className="chart-sub">Breakdown of all your searches by risk level</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                    dataKey="value" paddingAngle={3}
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}>
                    {pieData.map(e => <Cell key={e.name} fill={RISK_COLORS[e.name]||'#9ca3af'} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card chart-card">
              <h3 className="chart-h">Confidence Scores</h3>
              <p className="chart-sub">AI model confidence for recent searches</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} layout="vertical" margin={{left:0}}>
                  <XAxis type="number" domain={[0,100]} unit="%" tick={{fontSize:11}} />
                  <YAxis type="category" dataKey="label" tick={{fontSize:10}} width={120} />
                  <Tooltip formatter={v=>`${v}%`} />
                  <Bar dataKey="score" radius={[0,6,6,0]}>
                    {barData.map(e => <Cell key={e.label} fill={RISK_COLORS[e.level]||'#9ca3af'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History table */}
        <div className="card anim-fade-up delay-3">
          <div className="table-header-row">
            <div>
              <h3 className="chart-h">Search History</h3>
              <p className="chart-sub">Your last {history.length} searches</p>
            </div>
          </div>
          {loading ? (
            <div className="loading-center"><span className="spinner spinner-lg" /></div>
          ) : history.length === 0 ? (
            <div className="empty-dash">
              <div className="empty-icon">🔬</div>
              <h3>No searches yet</h3>
              <p>Run your first drug interaction check to see results here.</p>
              <Link to="/search" className="btn btn-primary" style={{marginTop:20}}>Start Searching</Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Drug 1</th><th>Drug 2</th><th>Risk Level</th>
                  <th>Interaction Type</th><th>Confidence</th><th>Date</th>
                </tr></thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td className="td-drug">{h.drug1}</td>
                      <td className="td-drug">{h.drug2}</td>
                      <td>
                        <span className={`badge badge-${(h.risk_level||'unknown').toLowerCase()}`}>
                          {h.risk_level || '—'}
                        </span>
                      </td>
                      <td className="td-type">{h.interaction_type?.replace(/_/g,' ') || '—'}</td>
                      <td>
                        {h.confidence_score
                          ? <span className="td-conf">{Math.round(h.confidence_score*100)}%</span>
                          : '—'}
                      </td>
                      <td className="td-date">{h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
