import { useState, useEffect } from 'react'
import client from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AccessDeniedModal from '../components/AccessDeniedModal'
import AccessDeniedPage from '../components/AccessDeniedPage'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

const LockSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export default function Strategy() {
  const { user } = useAuth()

  const canViewStrategy = ['ADMIN', 'SUPERVISOR', 'AGENT'].includes(user?.role)
  const canAddRule = ['ADMIN', 'SUPERVISOR'].includes(user?.role)
  const canViewRules = ['ADMIN', 'SUPERVISOR'].includes(user?.role)

  const [tab, setTab]             = useState('assignments')
  const [assignments, setAssigns] = useState([])
  const [rules, setRules]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [ruleModal, setRuleModal] = useState(false)
  const [accessModal, setAccessModal] = useState(false)
  const [ruleForm, setRuleForm]   = useState({ name: '', bucket: '0-30', riskBand: 'HIGH', expression: '', priority: 1 })
  const [saving, setSaving]       = useState(false)
  const toast = useToast()

  const loadAssignments = () =>
    client.get('/strategy/assignments')
      .then(r => setAssigns(r.data || []))
      .catch(() => {})

  const loadRules = () =>
    client.get('/strategy/rules')
      .then(r => setRules(r.data || []))
      .catch(() => {})

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([loadAssignments(), loadRules()]).finally(() => setLoading(false))
  }, [])

  if (!canViewStrategy) {
    return <AccessDeniedPage module="Strategy & Queue Allocation" role={user?.role} />
  }

  const set = k => e => setRuleForm(f => ({ ...f, [k]: e.target.value }))

  const createRule = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/strategy/rule', {
        name: ruleForm.name,
        bucket: ruleForm.bucket,
        riskBand: ruleForm.riskBand,
        expression: ruleForm.expression || `bucket=${ruleForm.bucket}&riskBand=${ruleForm.riskBand}`,
        priority: Number(ruleForm.priority),
      })
      toast('Strategy rule created', 'success')
      setRuleModal(false)
      setRuleForm({ name: '', bucket: '0-30', riskBand: 'HIGH', expression: '', priority: 1 })
      loadRules()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create rule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const byStatus = (status) => assignments.filter(a => a.status === status).length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Strategy & Queue Allocation</div>
          <div className="page-subtitle">
            {user?.role === 'AGENT'
              ? 'View your loan assignments — read-only access'
              : 'Rule-driven segmentation and agent assignment'}
          </div>
        </div>
        {canAddRule ? (
          <button className="btn btn-primary" onClick={() => setRuleModal(true)}>+ Add Rule</button>
        ) : (
          <button className="btn-locked" onClick={() => setAccessModal(true)}>
            <LockSVG /> Add Rule
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Assignments</div>
          <div className="stat-value">{assignments.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">Open</div>
          <div className="stat-value">{byStatus('OPEN')}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-label">Reassigned</div>
          <div className="stat-value">{byStatus('REASSIGNED')}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #94a3b8' }}>
          <div className="stat-label">Active Rules</div>
          <div className="stat-value">{rules.filter(r => r.status === 'ACTIVE').length}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>
          Assignments ({assignments.length})
        </button>
        {canViewRules && (
          <button className={`tab-btn ${tab === 'rules' ? 'active' : ''}`} onClick={() => setTab('rules')}>
            Strategy Rules ({rules.length})
          </button>
        )}
      </div>

      {tab === 'assignments' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Agent Assignments ({assignments.length})</span>
            <button className="btn btn-outline btn-sm" onClick={() => { setLoading(true); loadAssignments().finally(() => setLoading(false)) }}>↻ Refresh</button>
          </div>
          {loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Assignment ID</th><th>Loan ID</th><th>Agent ID</th><th>Queue ID</th><th>Assigned Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.assignmentId}>
                      <td className="td-mono">{a.assignmentId}</td>
                      <td className="td-primary">#L{a.loanAccountId}</td>
                      <td>Agent {a.agentId}</td>
                      <td>Q-{a.queueId}</td>
                      <td className="text-muted">{a.assignedDate}</td>
                      <td><Badge value={a.status} /></td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr><td colSpan={6}><div className="empty-state"><p>No assignments yet</p><span>Create a loan in Portfolio to trigger auto-assignment</span></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'rules' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Strategy Rules ({rules.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => { loadRules() }}>↻ Refresh</button>
              {canAddRule
                ? <button className="btn btn-primary btn-sm" onClick={() => setRuleModal(true)}>+ Add Rule</button>
                : <button className="btn-locked" style={{ fontSize: 13 }} onClick={() => setAccessModal(true)}><LockSVG /> Add Rule</button>
              }
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Rule ID</th><th>Name</th><th>Bucket</th><th>Risk Band</th><th>Priority</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.ruleId}>
                    <td className="td-mono">{r.ruleId}</td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><Badge value={r.bucket} /></td>
                    <td><Badge value={r.riskBand} /></td>
                    <td style={{ textAlign: 'center' }}>{r.priority}</td>
                    <td><Badge value={r.status} /></td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state"><p>No rules configured yet</p><span>Add a rule above to define bucket + risk band → agent mapping</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AccessDeniedModal
        open={accessModal}
        onClose={() => setAccessModal(false)}
        feature="Strategy Rule Management (ADMIN or SUPERVISOR only)"
      />

      <Modal open={ruleModal} onClose={() => setRuleModal(false)} title="Create Strategy Rule">
        <form onSubmit={createRule}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 1" value={ruleForm.priority} onChange={set('priority')} />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>
                  🔢 Rule ID is auto-assigned by the system
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Rule Name</label>
              <input className="form-input" placeholder="e.g. High-Risk 90+ Rule" value={ruleForm.name} onChange={set('name')} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Target Bucket</label>
                <select className="form-select" value={ruleForm.bucket} onChange={set('bucket')}>
                  {['0-30', '31-60', '61-90', '90+'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Risk Band</label>
                <select className="form-select" value={ruleForm.riskBand} onChange={set('riskBand')}>
                  {['LOW', 'MED', 'HIGH'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Expression (optional JSON/DSL)</label>
              <textarea className="form-textarea" placeholder='{"bucket":"90+","riskBand":"HIGH"}' value={ruleForm.expression} onChange={set('expression')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setRuleModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Rule'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
