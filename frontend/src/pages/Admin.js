import React, { useEffect, useState } from 'react';
import {
  adminGetStats, adminGetMetrics, adminGetUsers, adminGetLogs,
  adminSuspendUser, adminActivateUser, adminDeleteUser,
  adminGetDatasetInfo, adminUploadDataset
} from '../services/api';
import { BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend } from 'recharts';
import toast from 'react-hot-toast';
import './Admin.css';

const RISK_COLORS = ['#ef4444','#f59e0b','#22a06b','#9ca3af'];

const TABS = [
  { id:'overview', label:'Overview',  icon:'📊' },
  { id:'users',    label:'Users',     icon:'👥' },
  { id:'logs',     label:'Logs',      icon:'📋' },
  { id:'model',    label:'AI Model',  icon:'🤖' },
  { id:'dataset',  label:'Dataset',   icon:'📁' },
];

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats]     = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers]     = useState([]);
  const [logs, setLogs]       = useState([]);
  const [dsInfo, setDsInfo]   = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    adminGetStats().then(r=>setStats(r.data)).catch(()=>{});
    adminGetMetrics().then(r=>setMetrics(r.data)).catch(()=>{});
  }, []);

  useEffect(() => {
    if(tab==='users' && !users.length) adminGetUsers().then(r=>setUsers(r.data)).catch(()=>{});
    if(tab==='logs' && !logs.length) adminGetLogs(100).then(r=>setLogs(r.data)).catch(()=>{});
    if(tab==='dataset') adminGetDatasetInfo().then(r=>setDsInfo(r.data)).catch(()=>{});
    if(tab==='model' && !metrics) adminGetMetrics().then(r=>setMetrics(r.data)).catch(()=>{});
  }, [tab]);

  const suspend  = async id => { try { await adminSuspendUser(id);  setUsers(u=>u.map(x=>x.id===id?{...x,status:'suspended'}:x)); toast.success('User suspended'); } catch { toast.error('Failed'); } };
  const activate = async id => { try { await adminActivateUser(id); setUsers(u=>u.map(x=>x.id===id?{...x,status:'active'}:x));    toast.success('User activated'); } catch { toast.error('Failed'); } };
  const del      = async id => {
    if(!window.confirm('Delete this user permanently?')) return;
    try { await adminDeleteUser(id); setUsers(u=>u.filter(x=>x.id!==id)); toast.success('User deleted'); } catch { toast.error('Failed'); }
  };

  const upload = async e => {
    const f = e.target.files[0]; if(!f) return;
    const fd = new FormData(); fd.append('file',f);
    setUploading(true);
    try { const r=await adminUploadDataset(fd); toast.success(`Uploaded! ${r.data.rows} rows loaded.`); adminGetDatasetInfo().then(r=>setDsInfo(r.data)); }
    catch { toast.error('Upload failed.'); } finally { setUploading(false); }
  };

  const metricsBar = metrics?.model_trained ? [
    {name:'Found',    val:metrics.true_positives+metrics.false_negatives, fill:'var(--jade)'},
    {name:'Not Found',val:metrics.true_negatives+metrics.false_positives, fill:'var(--stone)'},
    {name:'High',     val:metrics.high_risk_count||0, fill:'#ef4444'},
    {name:'Moderate', val:metrics.moderate_risk_count||0, fill:'#f59e0b'},
    {name:'Low',      val:metrics.low_risk_count||0, fill:'#22a06b'},
  ] : [];

  const modelCards = metrics?.all_models ? Object.entries(metrics.all_models) : [];

  return (
    <div className="admin-page page-enter">
      <div className="admin-hero">
        <div className="container">
          <span className="section-eyebrow" style={{color:'var(--sage)'}}>System Management</span>
          <h1 className="admin-h1">Admin Panel</h1>
        </div>
      </div>

      <div className="container admin-body">
        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab==='overview' && (
          <div className="anim-fade-up">
            <div className="admin-stat-grid">
              {stats && [
                {l:'Total Users',      v:stats.total_users,       c:'var(--pine)',   bg:'var(--foam)'},
                {l:'Active Users',     v:stats.active_users,      c:'var(--jade)',   bg:'var(--mist)'},
                {l:'Suspended',        v:stats.suspended_users,   c:'#991b1b',       bg:'#fee2e2'},
                {l:'Predictions',      v:stats.total_predictions, c:'var(--forest)', bg:'var(--snow)'},
                {l:'Dataset Rows',     v:stats.dataset_size?.toLocaleString(), c:'var(--emerald)', bg:'var(--foam)'},
              ].map(s=>(
                <div key={s.l} className="admin-stat-card" style={{background:s.bg}}>
                  <span className="asc-val" style={{color:s.c}}>{s.v}</span>
                  <span className="asc-lbl">{s.l}</span>
                </div>
              ))}
            </div>
            {metrics?.model_trained && (
              <div className="charts-row">
                <div className="card">
                  <h3 className="chart-h">Prediction Breakdown</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={metricsBar}><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:11}}/><Tooltip/>
                      <Bar dataKey="val" radius={[6,6,0,0]}>
                        {metricsBar.map(e=><Cell key={e.name} fill={e.fill}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h3 className="chart-h">Model Accuracy</h3>
                  <div className="metric-big">{(metrics.accuracy*100).toFixed(1)}%</div>
                  <p className="metric-label">Best model: <strong>{metrics.best_model}</strong></p>
                  <div className="metric-row"><span>Precision</span><span>{(metrics.precision*100).toFixed(1)}%</span></div>
                  <div className="metric-row"><span>Recall</span><span>{(metrics.recall*100).toFixed(1)}%</span></div>
                  <div className="metric-row"><span>F1 Score</span><span>{(metrics.f1_score*100).toFixed(1)}%</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Users ── */}
        {tab==='users' && (
          <div className="card anim-fade-up">
            <div className="table-header-row"><h3 className="chart-h">All Users</h3><p className="chart-sub">{users.length} registered users</p></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong>{u.is_admin&&<span className="badge badge-green" style={{marginLeft:8,fontSize:10}}>Admin</span>}</td>
                      <td style={{color:'var(--stone)'}}>{u.email}</td>
                      <td style={{textTransform:'capitalize'}}>{u.role?.replace('_',' ')}</td>
                      <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                      <td style={{color:'var(--stone)',fontSize:13}}>{u.created_at?new Date(u.created_at).toLocaleDateString():'—'}</td>
                      <td>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          {u.status==='active'&&!u.is_admin&&<button className="btn btn-sm" style={{background:'#fef3c7',color:'#92400e',border:'none'}} onClick={()=>suspend(u.id)}>Suspend</button>}
                          {u.status==='suspended'&&<button className="btn btn-sm btn-primary" onClick={()=>activate(u.id)}>Activate</button>}
                          {!u.is_admin&&<button className="btn btn-sm btn-danger" onClick={()=>del(u.id)}>Delete</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Logs ── */}
        {tab==='logs' && (
          <div className="card anim-fade-up">
            <div className="table-header-row"><h3 className="chart-h">Prediction Logs</h3><p className="chart-sub">Last {logs.length} queries</p></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Drug 1</th><th>Drug 2</th><th>Risk</th><th>Type</th><th>User</th><th>Date</th></tr></thead>
                <tbody>
                  {logs.map(l=>(
                    <tr key={l.id}>
                      <td style={{color:'var(--silver)',fontSize:12}}>{l.id}</td>
                      <td style={{textTransform:'capitalize',fontWeight:600}}>{l.drug1}</td>
                      <td style={{textTransform:'capitalize',fontWeight:600}}>{l.drug2}</td>
                      <td><span className={`badge badge-${(l.risk_level||'unknown').toLowerCase()}`}>{l.risk_level||'—'}</span></td>
                      <td style={{fontSize:13,color:'var(--slate)'}}>{l.interaction_type?.replace(/_/g,' ')||'—'}</td>
                      <td>{l.user_id||<span style={{color:'var(--silver)'}}>Guest</span>}</td>
                      <td style={{fontSize:13,color:'var(--stone)'}}>{l.created_at?new Date(l.created_at).toLocaleDateString():'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AI Model ── */}
        {tab==='model' && (
          <div className="anim-fade-up">
            {metrics?.model_trained ? (
              <>
                <div className="model-metrics-grid">
                  {[
                    {l:'Accuracy',  v:`${(metrics.accuracy*100).toFixed(2)}%`,  color:'var(--pine)'},
                    {l:'Precision', v:`${(metrics.precision*100).toFixed(2)}%`, color:'var(--jade)'},
                    {l:'Recall',    v:`${(metrics.recall*100).toFixed(2)}%`,    color:'#f59e0b'},
                    {l:'F1 Score',  v:`${(metrics.f1_score*100).toFixed(2)}%`,  color:'var(--emerald)'},
                  ].map(m=>(
                    <div key={m.l} className="card model-metric-card">
                      <span className="mm-val" style={{color:m.color}}>{m.v}</span>
                      <span className="mm-lbl">{m.l}</span>
                      <div className="mm-bar-track">
                        <div className="mm-bar-fill" style={{width:m.v,background:m.color}} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="model-info-row">
                  <div className="card">
                    <h3 className="chart-h">Model Details</h3>
                    <div className="info-lines">
                      <div className="info-line"><span>Best Model</span><strong>{metrics.best_model}</strong></div>
                      <div className="info-line"><span>Training Samples</span><strong>{metrics.train_size?.toLocaleString()}</strong></div>
                      <div className="info-line"><span>Test Samples</span><strong>{metrics.test_size?.toLocaleString()}</strong></div>
                      <div className="info-line"><span>Total Dataset</span><strong>{metrics.total_samples?.toLocaleString()}</strong></div>
                      <div className="info-line"><span>True Positives</span><strong>{metrics.true_positives}</strong></div>
                      <div className="info-line"><span>True Negatives</span><strong>{metrics.true_negatives}</strong></div>
                      <div className="info-line"><span>False Positives</span><strong style={{color:'#991b1b'}}>{metrics.false_positives}</strong></div>
                      <div className="info-line"><span>False Negatives</span><strong style={{color:'#92400e'}}>{metrics.false_negatives}</strong></div>
                    </div>
                  </div>
                  {modelCards.length > 0 && (
                    <div className="card">
                      <h3 className="chart-h">Model Comparison</h3>
                      <p className="chart-sub">All trained models</p>
                      <div className="table-wrap">
                        <table>
                          <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead>
                          <tbody>
                            {modelCards.map(([name,m])=>(
                              <tr key={name}>
                                <td><strong>{name}</strong>{name===metrics.best_model&&<span className="badge badge-green" style={{marginLeft:6,fontSize:10}}>Best</span>}</td>
                                <td>{(m.accuracy*100).toFixed(2)}%</td>
                                <td>{(m.precision*100).toFixed(2)}%</td>
                                <td>{(m.recall*100).toFixed(2)}%</td>
                                <td><strong style={{color:'var(--pine)'}}>{(m.f1*100).toFixed(2)}%</strong></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card no-model-card">
                <div className="no-model-icon">🤖</div>
                <h3>No Trained Model Found</h3>
                <p>Run the training script to train your ML model.</p>
                <div className="code-block"><code>python train_model.py</code></div>
                <p style={{marginTop:16,fontSize:13,color:'var(--stone)'}}>
                  Training takes ~2–5 minutes. Once done, restart the backend and return here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Dataset ── */}
        {tab==='dataset' && (
          <div className="anim-fade-up">
            {dsInfo && (
              <div className="ds-stat-grid">
                <div className="card ds-stat"><span className="ds-val">{dsInfo.total_pairs?.toLocaleString()}</span><span className="ds-lbl">Total Pairs</span></div>
                <div className="card ds-stat"><span className="ds-val" style={{color:'var(--jade)'}}>{dsInfo.with_interactions?.toLocaleString()}</span><span className="ds-lbl">With Interactions</span></div>
                <div className="card ds-stat"><span className="ds-val" style={{color:'var(--stone)'}}>{dsInfo.no_interaction?.toLocaleString()}</span><span className="ds-lbl">No Interaction</span></div>
              </div>
            )}
            <div className="card upload-card">
              <h3 className="chart-h">Upload New Dataset</h3>
              <p className="chart-sub" style={{marginBottom:24}}>
                Upload a CSV file with columns: drug1, drug2, interaction_description, interaction_effect,<br/>
                interaction_type, label, source, pair_key
              </p>
              <label className="upload-btn">
                {uploading ? <><span className="spinner spinner-sm"/>Uploading…</> : <><span>📁</span> Choose CSV File</>}
                <input type="file" accept=".csv" onChange={upload} style={{display:'none'}} disabled={uploading} />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
