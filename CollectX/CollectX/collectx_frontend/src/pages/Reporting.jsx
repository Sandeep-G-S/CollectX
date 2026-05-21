import { useState, useEffect } from 'react'
import client from '../api/client'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS       = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']
const BUCKET_COLORS = { '0-30 DPD': '#059669', '31-60 DPD': '#d97706', '61-90 DPD': '#ea580c', '90+ DPD': '#dc2626' }

export default function Reporting() {
  const { user } = useAuth()
  const [kpis,        setKpis]        = useState(null)
  const [performance, setPerformance] = useState([])
  const [cashFlow,    setCashFlow]    = useState([])
  const [bucketDist,  setBucketDist]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [generating,  setGenerating]  = useState(false)
  const [tab,         setTab]         = useState('overview')
  const toast = useToast()

  const canViewReports   = ['ADMIN', 'SUPERVISOR', 'COMPLIANCE', 'FIELD', 'RECOVERY'].includes(user?.role)
  const canGenerateReport = ['ADMIN', 'SUPERVISOR'].includes(user?.role)

  const load = () => {
    if (!canViewReports) return
    setLoading(true)
    Promise.allSettled([
      client.get('/report/kpi'),
      client.get('/report/agent-performance'),
      client.get('/report/cash-flow'),
      client.get('/report/bucket-distribution'),
    ]).then(([k, p, c, b]) => {
      if (k.status === 'fulfilled') setKpis(k.value.data)
      if (p.status === 'fulfilled') setPerformance(p.value.data || [])
      if (c.status === 'fulfilled') setCashFlow(c.value.data || [])
      if (b.status === 'fulfilled') setBucketDist(b.value.data || [])
    }).catch(() => toast('Failed to load reports', 'error'))
    .finally(() => setLoading(false))
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      await client.post('/report/generate')
      toast('Report generated', 'success')
      load()
    } catch {
      toast('Failed to generate report', 'error')
    } finally { setGenerating(false) }
  }

  useEffect(load, [])

  const perfData = performance.length > 0 ? performance : [
    { agentName: 'Agent 1', collectionAmount: 85000, ptpCount: 12, visitCount: 8, connectRate: 72 },
    { agentName: 'Agent 2', collectionAmount: 62000, ptpCount: 9,  visitCount: 6, connectRate: 65 },
    { agentName: 'Agent 3', collectionAmount: 110000, ptpCount: 18, visitCount: 14, connectRate: 81 },
  ]

  const cashData = cashFlow.length > 0 ? cashFlow : [
    { month: 'Jan', collected: 420000, target: 500000 },
    { month: 'Feb', collected: 380000, target: 500000 },
    { month: 'Mar', collected: 510000, target: 500000 },
    { month: 'Apr', collected: 460000, target: 500000 },
    { month: 'May', collected: 530000, target: 500000 },
  ]

  const bucketData = bucketDist.length > 0 ? bucketDist : [
    { name: '0-30 DPD',  value: 45 },
    { name: '31-60 DPD', value: 22 },
    { name: '61-90 DPD', value: 18 },
    { name: '90+ DPD',   value: 15 },
  ]

  if (!canViewReports) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access Restricted</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 320 }}>
            Your role ({user?.role}) does not have permission to view Reports & Analytics.
            Contact your supervisor or administrator for access.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">KPIs, collection performance and portfolio analytics</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canGenerateReport && (
            <button className="btn btn-primary btn-sm" onClick={generateReport} disabled={generating}>
              {generating ? 'Generating…' : '⚡ Generate Report'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      {!kpis && !loading && canGenerateReport && (
        <div style={{ padding: '10px 16px', marginBottom: 12, background: 'rgba(99,102,241,0.07)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', fontSize: 13, color: 'var(--text-2)' }}>
          ℹ️ No KPI data yet. Click <strong>⚡ Generate Report</strong> above to populate the KPI cards.
        </div>
      )}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Cure Rate</div>
          <div className="stat-value">{kpis?.cureRate ?? '—'}{kpis?.cureRate != null ? '%' : ''}</div>
          <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>% accounts cured this month</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-label">Roll Rate</div>
          <div className="stat-value">{kpis?.rollRate ?? '—'}{kpis?.rollRate != null ? '%' : ''}</div>
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>% rolled to next bucket</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">Collection Efficiency</div>
          <div className="stat-value">{kpis?.collectionEfficiency ?? '—'}{kpis?.collectionEfficiency != null ? '%' : ''}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Collected vs Demand</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-label">PTP Kept Rate</div>
          <div className="stat-value">{kpis?.ptpKeptPct ?? '—'}{kpis?.ptpKeptPct != null ? '%' : ''}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Promises honoured</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`tab-btn ${tab === 'agents' ? 'active' : ''}`} onClick={() => setTab('agents')}>Agent Performance</button>
        <button className={`tab-btn ${tab === 'cashflow' ? 'active' : ''}`} onClick={() => setTab('cashflow')}>Cash Flow</button>
      </div>

      {loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
        <>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <div className="card-header"><span className="card-title">DPD Bucket Distribution</span></div>
                <div className="card-body" style={{ padding: '16px' }}>
                  {(() => {
                    const totalBkt = bucketData.reduce((s, d) => s + (d.value || 0), 0)
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ flexShrink: 0, width: 190, height: 190, position: 'relative' }}>
                          <ResponsiveContainer width="100%" height={190}>
                            <PieChart>
                              <Pie
                                data={bucketData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%" cy="50%"
                                outerRadius={85}
                                innerRadius={50}
                                paddingAngle={3}
                                startAngle={90}
                                endAngle={-270}
                              >
                                {bucketData.map((entry, i) => (
                                  <Cell key={i} fill={BUCKET_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(v, n) => [`${v}% (${Math.round(v / totalBkt * 100)}% of portfolio)`, n]}
                                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center', pointerEvents: 'none',
                          }}>
                            <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{totalBkt}%</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>PORTFOLIO</div>
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {bucketData.map((entry, i) => {
                            const color = BUCKET_COLORS[entry.name] || COLORS[i % COLORS.length]
                            const pct = totalBkt > 0 ? Math.round(entry.value / totalBkt * 100) : 0
                            return (
                              <div key={entry.name} style={{ marginBottom: 13 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{entry.name}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700 }}>{entry.value}%</span>
                                    <span style={{
                                      fontSize: 10, fontWeight: 600, padding: '1px 5px',
                                      borderRadius: 4, background: color + '22', color,
                                    }}>{pct}% share</span>
                                  </div>
                                </div>
                                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                  <div style={{
                                    width: `${pct}%`, height: '100%',
                                    background: color, borderRadius: 3,
                                    transition: 'width 0.6s ease',
                                  }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">Collection vs Target</span></div>
                <div className="card-body" style={{ padding: '16px 8px' }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={cashData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="collected" name="Collected" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {tab === 'agents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-header"><span className="card-title">Collection by Agent</span></div>
                <div className="card-body" style={{ padding: '16px 8px' }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={perfData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="agentName" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                      <Bar dataKey="collectionAmount" name="Collected" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">Agent Scorecard</span></div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Agent</th><th>Amount Collected</th><th>PTPs</th><th>Visits</th><th>Connect Rate</th><th>Score</th></tr>
                    </thead>
                    <tbody>
                      {perfData.map((a, i) => {
                        const score = Math.min(100, Math.round((a.connectRate || 0) * 0.4 + (a.ptpCount || 0) * 1.5 + (a.visitCount || 0) * 1))
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{a.agentName || `Agent ${a.agentId}`}</td>
                            <td style={{ fontWeight: 600, color: '#10b981' }}>₹{Number(a.collectionAmount || 0).toLocaleString()}</td>
                            <td>{a.ptpCount || 0}</td>
                            <td>{a.visitCount || 0}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                                  <div style={{ width: `${a.connectRate || 0}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                                </div>
                                <span style={{ fontSize: 12, minWidth: 32 }}>{a.connectRate || 0}%</span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                                background: score >= 80 ? '#d1fae5' : score >= 60 ? '#fef3c7' : '#fee2e2',
                                color: score >= 80 ? '#065f46' : score >= 60 ? '#92400e' : '#991b1b',
                              }}>{score}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'cashflow' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Monthly Cash Flow Trend</span></div>
              <div className="card-body" style={{ padding: '16px 8px' }}>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={cashData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="collected" name="Collected" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="target" name="Target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
