import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import client from '../api/client'
import Badge from '../components/Badge'
import { useAuth } from '../context/AuthContext'

const BUCKET_COLORS = { '0-30': '#059669', '31-60': '#d97706', '61-90': '#ea580c', '90+': '#dc2626' }

const StatIcon = ({ color, bg, children }) => (
  <div className="stat-icon" style={{ background: bg }}>
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  </div>
)

export default function Dashboard() {
  const [loans,       setLoans]       = useState([])
  const [reports,     setReports]     = useState([])
  const [notifs,      setNotifs]      = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  const canViewNotifs      = !!user?.role
  const canViewAssignments = ['ADMIN', 'SUPERVISOR', 'AGENT'].includes(user?.role)
  const canViewReports     = ['ADMIN', 'SUPERVISOR', 'COMPLIANCE'].includes(user?.role)

  useEffect(() => {
    const calls = [
      client.get('/portfolio/loans'),
      canViewReports      ? client.get('/report/all') : Promise.resolve({ data: [] }),
      canViewNotifs       ? client.get('/notify/all') : Promise.resolve({ data: [] }),
      canViewAssignments  ? client.get('/strategy/assignments') : Promise.resolve({ data: [] }),
    ]
    Promise.allSettled(calls).then(([l, r, n, a]) => {
      if (l.status === 'fulfilled') setLoans(l.value.data || [])
      if (r.status === 'fulfilled') setReports(r.value.data || [])
      if (n.status === 'fulfilled') setNotifs(n.value.data || [])
      if (a.status === 'fulfilled') setAssignments(a.value.data || [])
      setLoading(false)
    })
  }, [])

  const totalLoans  = loans.length
  const delinquent  = loans.filter(l => ['Delinquent','DELINQUENT'].includes(l.status)).length
  const totalOS     = loans.reduce((s, l) => s + (l.principalOS || 0) + (l.interestOS || 0), 0)
  const unread      = notifs.filter(n => ['UNREAD','Unread'].includes(n.status)).length
  const openAssign  = assignments.filter(a => a.status === 'OPEN').length

  const buckets    = ['0-30', '31-60', '61-90', '90+']
  const bucketData = buckets.map(b => ({ name: b, count: loans.filter(l => l.bucket === b).length }))
  const pieData    = bucketData.filter(b => b.count > 0)

  const reportBarData = reports.slice(-6).map((r, i) => ({
    name: `Rpt ${i + 1}`,
    collected: r.cashCollected || r.metrics?.CashCollected || 0,
  }))

  if (loading) return <div className="loader-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="stats-grid">

        <div className="stat-card" onClick={() => navigate('/portfolio')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-accent" style={{ background: '#1a5fdb' }} />
          <StatIcon color="#1a5fdb" bg="rgba(26,95,219,.1)">
            <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            <path d="M3 7l9 6 9-6" />
          </StatIcon>
          <div className="stat-label">Total Loans</div>
          <div className="stat-value">{totalLoans}</div>
          <div className="stat-sub">{delinquent} delinquent accounts</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/portfolio')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-accent" style={{ background: '#dc2626' }} />
          <StatIcon color="#dc2626" bg="rgba(220,38,38,.1)">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </StatIcon>
          <div className="stat-label">Outstanding Balance</div>
          <div className="stat-value">₹{(totalOS / 100000).toFixed(1)}L</div>
          <div className="stat-sub">principal + interest</div>
        </div>

        {canViewAssignments && (
        <div className="stat-card" onClick={() => navigate('/strategy')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-accent" style={{ background: '#059669' }} />
          <StatIcon color="#059669" bg="rgba(5,150,105,.1)">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </StatIcon>
          <div className="stat-label">Active Assignments</div>
          <div className="stat-value">{openAssign}</div>
          <div className="stat-sub">of {assignments.length} total</div>
        </div>
        )}

        <div className="stat-card" onClick={() => navigate('/notifications')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-accent" style={{ background: '#d97706' }} />
          <StatIcon color="#d97706" bg="rgba(217,119,6,.1)">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </StatIcon>
          <div className="stat-label">Unread Alerts</div>
          <div className="stat-value">{unread}</div>
          <div className="stat-sub">of {notifs.length} notifications</div>
        </div>

      </div>

      <div className="dash-grid">

        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span className="card-title-dot" />
              DPD Bucket Distribution
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portfolio')}>
              View Portfolio →
            </button>
          </div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            {pieData.length > 0 ? (() => {
              const totalPie = pieData.reduce((s, d) => s + d.count, 0)
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flexShrink: 0, width: 170, height: 170, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%" cy="50%"
                          outerRadius={78}
                          innerRadius={46}
                          paddingAngle={3}
                          startAngle={90}
                          endAngle={-270}
                        >
                          {pieData.map(entry => (
                            <Cell key={entry.name} fill={BUCKET_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [`${v} accounts (${Math.round(v / totalPie * 100)}%)`, n + ' DPD']}
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center', pointerEvents: 'none',
                    }}>
                      <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{totalPie}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>LOANS</div>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {pieData.map(entry => {
                      const pct = totalPie > 0 ? Math.round(entry.count / totalPie * 100) : 0
                      const color = BUCKET_COLORS[entry.name] || '#94a3b8'
                      return (
                        <div key={entry.name} style={{ marginBottom: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{entry.name} DPD</span>
                            </div>
                            <div style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{entry.count}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                                background: color + '22', color,
                              }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`, height: '100%',
                              background: color, borderRadius: 3,
                              transition: 'width 0.6s ease',
                            }} />
                          </div>
                        </div>
                      )
                    })}
                    <div style={{
                      marginTop: 4, paddingTop: 8,
                      borderTop: '1px solid var(--border)',
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 11, color: 'var(--muted)',
                    }}>
                      <span>Total accounts</span>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{totalPie}</span>
                    </div>
                  </div>
                </div>
              )
            })() : (
              <div className="empty-state"><p>No loan data yet</p><span>Add loans from the Portfolio module</span></div>
            )}
          </div>
        </div>

        {canViewReports && <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span className="card-title-dot" style={{ background: '#059669' }} />
              Cash Collected — Last 6 Reports
            </span>
          </div>
          <div className="card-body chart-wrap">
            {reportBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reportBarData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dde4ed" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    cursor={{ fill: 'rgba(26,95,219,.05)' }}
                    formatter={v => [`₹${v.toLocaleString()}`, 'Collected']}
                  />
                  <Bar dataKey="collected" fill="#1a5fdb" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No reports yet</p><span>Generate a report from the Reporting module</span></div>
            )}
          </div>
        </div>}

        {canViewAssignments && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="card-title-dot" style={{ background: '#7c3aed' }} />
                Recent Assignments
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/strategy')}>View All →</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Agent</th>
                    <th>Assigned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.slice(0, 6).map(a => (
                    <tr key={a.assignmentId}>
                      <td className="td-primary td-mono">#L{a.loanAccountId}</td>
                      <td>Agent {a.agentId}</td>
                      <td className="text-muted">{a.assignedDate || '—'}</td>
                      <td><Badge value={a.status} /></td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr><td colSpan={4}>
                      <div className="empty-state" style={{ padding: '24px 20px' }}>
                        <p>No assignments yet</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {canViewNotifs && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="card-title-dot" style={{ background: '#d97706' }} />
                Recent Notifications
                {unread > 0 && (
                  <span style={{
                    background: '#dc2626', color: '#fff',
                    borderRadius: 9999, fontSize: 10, fontWeight: 700,
                    padding: '1px 7px', marginLeft: 4,
                  }}>
                    {unread} new
                  </span>
                )}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/notifications')}>View All →</button>
            </div>
            <div className="notif-list">
              {notifs.slice(0, 5).map(n => (
                <div key={n.notificationId} className={`notif-item${n.status === 'UNREAD' ? ' unread' : ''}`}>
                  <div className={`notif-dot${n.status === 'READ' ? ' read' : ''}`} />
                  <div className="notif-content">
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-meta"><Badge value={n.notificationType || n.category} /></div>
                  </div>
                </div>
              ))}
              {notifs.length === 0 && (
                <div className="empty-state" style={{ padding: '28px 20px' }}>
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
