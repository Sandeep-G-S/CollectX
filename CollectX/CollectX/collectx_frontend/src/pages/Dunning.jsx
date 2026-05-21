import { useState, useEffect } from 'react'
import client from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AccessDeniedModal from '../components/AccessDeniedModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

const emptyForm = { loanAccountId: '', agentId: '', bucket: '0-30', channel: 'CALL', customerId: '', notes: '', outcome: 'CONNECTED' }
const OUTCOMES = ['CONNECTED', 'NO_ANSWER', 'REFUSED']

export default function Dunning() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [filter, setFilter]     = useState({ channel: '', outcome: '' })
  const [accessModal, setAccessModal] = useState(false)
  const toast = useToast()
  const { user } = useAuth()
  const canViewAttempts = ['ADMIN', 'SUPERVISOR', 'AGENT', 'COMPLIANCE'].includes(user?.role)
  const canLogAttempt   = ['ADMIN', 'SUPERVISOR', 'AGENT'].includes(user?.role)

  const load = () => {
    if (!canViewAttempts) return
    setLoading(true)
    client.get('/dunning/attempts').then(r => setAttempts(r.data || [])).catch(() => toast('Could not load attempts', 'error')).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/dunning/attempt', {
        loanAccountId: Number(form.loanAccountId),
        agentId:       Number(form.agentId),
        customerId:    Number(form.customerId),
        bucket:        form.bucket,
        channel:       form.channel,
        outcome:       form.outcome,
        notes:         form.notes || null,
      })
      toast('Contact attempt logged', 'success')
      setModal(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to log attempt', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filtered = attempts.filter(a => {
    if (filter.channel && a.channel !== filter.channel) return false
    if (filter.outcome && a.outcome !== filter.outcome) return false
    return true
  })

  const stats = {
    total: attempts.length,
    connected: attempts.filter(a => a.outcome === 'CONNECTED').length,
    noAnswer: attempts.filter(a => a.outcome === 'NO_ANSWER').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dunning & Contact Management</div>
          <div className="page-subtitle">Track customer contact attempts, channels and outcomes</div>
        </div>
        {canLogAttempt
          ? <button className="btn btn-primary" onClick={() => setModal(true)}>+ Log Attempt</button>
          : (
            <button className="btn-locked" onClick={() => setAccessModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Log Attempt
            </button>
          )
        }
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Total Attempts</div><div className="stat-value">{stats.total}</div></div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}><div className="stat-label">Connected</div><div className="stat-value">{stats.connected}</div></div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}><div className="stat-label">No Answer</div><div className="stat-value">{stats.noAnswer}</div></div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-label">Connect Rate</div>
          <div className="stat-value">{stats.total ? Math.round(stats.connected / stats.total * 100) : 0}%</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '12px 16px' }}>
          <div className="filter-bar">
            <select className="form-select" value={filter.channel} onChange={e => setFilter(f => ({ ...f, channel: e.target.value }))}>
              <option value="">All Channels</option>
              {['CALL', 'SMS', 'EMAIL', 'VISIT', 'INAPP'].map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="form-select" value={filter.outcome} onChange={e => setFilter(f => ({ ...f, outcome: e.target.value }))}>
              <option value="">All Outcomes</option>
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
            {(filter.channel || filter.outcome) && (
              <button className="btn btn-outline btn-sm" onClick={() => setFilter({ channel: '', outcome: '' })}>Clear</button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Contact Attempts ({canViewAttempts ? filtered.length : 0})</span>
          {canViewAttempts && <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>}
        </div>
        {!canViewAttempts ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🔒</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>Access Restricted</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>You don't have permission to view contact attempts.<br />Contact your Supervisor or Administrator for access.</div>
          </div>
        ) : loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Attempt ID</th><th>Loan ID</th><th>Agent</th><th>Customer</th><th>Channel</th><th>Time</th><th>Outcome</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.attemptId}>
                    <td className="td-mono">{a.attemptId}</td>
                    <td className="td-primary">#L{a.loanAccountId}</td>
                    <td>Agent {a.agentId}</td>
                    <td>{a.customerId}</td>
                    <td><Badge value={a.channel} /></td>
                    <td className="text-muted">{a.attemptTime ? new Date(a.attemptTime).toLocaleString() : '—'}</td>
                    <td><Badge value={a.outcome} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><p>No attempts yet</p><span>Log a contact attempt using the button above</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AccessDeniedModal
        open={accessModal}
        onClose={() => setAccessModal(false)}
        feature="Log Contact Attempt (ADMIN, SUPERVISOR or AGENT only)"
      />

      <Modal open={modal} onClose={() => { setModal(false); setForm(emptyForm) }} title="Log Contact Attempt">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1001" value={form.loanAccountId} onChange={set('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input className="form-input" type="number" placeholder="e.g. 500" value={form.customerId} onChange={set('customerId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Agent ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1" value={form.agentId} onChange={set('agentId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Channel</label>
                <select className="form-select" value={form.channel} onChange={set('channel')}>
                  <option>CALL</option><option>VISIT</option><option>INAPP</option><option>SMS</option><option>EMAIL</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Bucket</label>
                <select className="form-select" value={form.bucket} onChange={set('bucket')}>
                  {['0-30', '31-60', '61-90', '90+'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Outcome</label>
                <select className="form-select" value={form.outcome} onChange={set('outcome')}>
                  {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 11 }}>(optional)</span></label>
              <input className="form-input" placeholder="e.g. Customer requested callback tomorrow" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => { setModal(false); setForm(emptyForm) }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Logging…' : 'Log Attempt'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
