import { useState, useEffect } from 'react'
import client from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AccessDeniedModal from '../components/AccessDeniedModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

const LockSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const StatusFlow = ({ current }) => {
  const steps = ['RECORDED', 'POSTED', 'CLOSED']
  if (current === 'FAILED') {
    return (
      <span style={{ background: 'rgba(220,38,38,.12)', color: '#dc2626', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
        FAILED
      </span>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
      {steps.map((s, i) => {
        const idx    = steps.indexOf(current)
        const done   = idx >= i
        const active = current === s
        return (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {i > 0 && <span style={{ color: 'var(--muted)', fontSize: 9 }}>→</span>}
            <span style={{
              borderRadius: 4, padding: '2px 7px', fontWeight: active ? 800 : 600,
              background: active  ? (s === 'CLOSED' ? 'rgba(5,150,105,.14)' : 'rgba(26,95,219,.13)') :
                          done    ? 'rgba(100,116,139,.1)' : 'var(--border)',
              color:  active ? (s === 'CLOSED' ? '#059669' : '#1a5fdb') :
                      done   ? 'var(--text-2)' : 'var(--muted)',
              opacity: done ? 1 : 0.4,
            }}>
              {s}
            </span>
          </span>
        )
      })}
    </div>
  )
}

const emptyPtp = {
  loanAccountId: '', agentId: '', customerId: '',
  promisedAmount: '', promisedDate: '',
  channel: 'CALL', promisedBy: '', notes: '',
}
const emptyPayment = {
  loanAccountId: '', agentId: '', customerId: '',
  amount: '', paymentMode: 'CASH', referenceNumber: '',
  paymentDate: new Date().toISOString().split('T')[0],
}
const emptySettlement = {
  loanAccountId: '', agentId: '', customerId: '',
  settlementAmount: '', waiverAmount: '', reason: '',
}

export default function Payments() {
  const [tab,         setTab]         = useState('ptps')
  const [ptps,        setPtps]        = useState([])
  const [payments,    setPayments]    = useState([])
  const [settlements, setSettlements] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [ptpModal,    setPtpModal]    = useState(false)
  const [payModal,    setPayModal]    = useState(false)
  const [settModal,   setSettModal]   = useState(false)
  const [ptpForm,     setPtpForm]     = useState(emptyPtp)
  const [payForm,     setPayForm]     = useState(emptyPayment)
  const [settForm,    setSettForm]    = useState(emptySettlement)
  const [saving,      setSaving]      = useState(false)
  const [accessModal, setAccessModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const toast = useToast()
  const { user } = useAuth()

  const isAdmin    = ['ADMIN', 'SUPERVISOR'].includes(user?.role)
  const canSettle  = isAdmin
  const canViewSettlements = ['SUPERVISOR', 'ADMIN', 'COMPLIANCE', 'AGENT', 'FIELD', 'RECOVERY'].includes(user?.role)
  const canRecord  = ['ADMIN', 'SUPERVISOR', 'AGENT', 'RECOVERY', 'FIELD'].includes(user?.role)
  const canLogPtp  = ['ADMIN', 'SUPERVISOR', 'AGENT', 'RECOVERY', 'FIELD'].includes(user?.role)

  const loadAll = () => {
    setLoading(true)
    Promise.allSettled([
      client.get('/payment/ptp/all'),
      client.get('/payment/payments'),
      canViewSettlements ? client.get('/payment/settlements') : Promise.resolve({ data: [] }),
    ]).then(([p, py, s]) => {
      setPtps(       p.status  === 'fulfilled' ? p.value.data  || [] : [])
      setPayments(   py.status === 'fulfilled' ? py.value.data || [] : [])
      setSettlements(s.status  === 'fulfilled' ? s.value.data  || [] : [])
    }).finally(() => setLoading(false))
  }
  useEffect(loadAll, [])

  const set = setter => k => e => setter(f => ({ ...f, [k]: e.target.value }))

  const savePtp = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/payment/ptp', {
        loanAccountId:  Number(ptpForm.loanAccountId),
        agentId:        Number(ptpForm.agentId),
        customerId:     Number(ptpForm.customerId),
        promisedAmount: Number(ptpForm.promisedAmount),
        promisedDate:   ptpForm.promisedDate,
        channel:        ptpForm.channel,
        promisedBy:     ptpForm.promisedBy,
        notes:          ptpForm.notes || null,
      })
      toast('PTP logged — status set to OPEN', 'success')
      setPtpModal(false); setPtpForm(emptyPtp); loadAll()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to log PTP', 'error')
    } finally { setSaving(false) }
  }

  const savePayment = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/payment/create', {
        loanAccountId:   Number(payForm.loanAccountId),
        agentId:         Number(payForm.agentId),
        customerId:      Number(payForm.customerId),
        amount:          Number(payForm.amount),
        paymentMode:     payForm.paymentMode,
        referenceNumber: payForm.referenceNumber,
        paymentDate:     payForm.paymentDate || null,
      })
      toast('Payment recorded (RECORDED) — awaiting admin verification', 'success')
      setPayModal(false); setPayForm(emptyPayment); loadAll()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to record payment', 'error')
    } finally { setSaving(false) }
  }

  const paymentAction = async (id, action) => {
    setActionLoading(id + '-' + action)
    try {
      await client.put(`/payment/${action}/${id}`)
      const msgs = {
        verify: 'Payment verified → POSTED',
        close:  'Payment closed → CLOSED',
        fail:   'Payment marked FAILED',
      }
      toast(msgs[action] || 'Done', 'success')
      loadAll()
    } catch (err) {
      toast(err.response?.data?.message || `Failed to ${action} payment`, 'error')
    } finally { setActionLoading(null) }
  }

  const triggerAutoUpdate = async () => {
    setSaving(true)
    try {
      const res = await client.post('/payment/ptp/auto-update')
      toast(`Auto-update: ${res.data.recordsUpdated} PTP(s) updated`, 'success')
      loadAll()
    } catch (err) {
      toast('PTP auto-update failed', 'error')
    } finally { setSaving(false) }
  }

  const saveSettlement = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/payment/settlement', {
        loanAccountId:    Number(settForm.loanAccountId),
        agentId:          Number(settForm.agentId),
        customerId:       Number(settForm.customerId),
        settlementAmount: Number(settForm.settlementAmount),
        waiverAmount:     Number(settForm.waiverAmount),
        reason:           settForm.reason,
      })
      toast('Settlement request submitted', 'success')
      setSettModal(false); setSettForm(emptySettlement); loadAll()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit settlement', 'error')
    } finally { setSaving(false) }
  }

  const totalCollected = payments
    .filter(p => ['POSTED', 'CLOSED'].includes(p.status))
    .reduce((s, p) => s + (p.amount || 0), 0)
  const keptPtps   = ptps.filter(p => p.status === 'KEPT').length
  const openPtps   = ptps.filter(p => p.status === 'OPEN').length
  const brokenPtps = ptps.filter(p => p.status === 'BROKEN').length
  const pendVerify = payments.filter(p => p.status === 'RECORDED').length
  const approvedS  = settlements.filter(s => s.approvalStatus === 'APPROVED').length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Payments &amp; Settlements</div>
          <div className="page-subtitle">Log PTPs · Record &amp; verify payments · Track settlements</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isAdmin && (
            <button className="btn btn-outline btn-sm" onClick={triggerAutoUpdate} disabled={saving}>
              ⚙ Run PTP Auto-Update
            </button>
          )}
          {canSettle
            ? <button className="btn btn-outline" onClick={() => setSettModal(true)}>+ Settlement</button>
            : <button className="btn-locked" onClick={() => setAccessModal(true)}><LockSVG /> Settlement</button>
          }
          {tab === 'ptps' && (canLogPtp
            ? <button className="btn btn-outline" onClick={() => setPtpModal(true)}>+ Log PTP</button>
            : <button className="btn-locked" onClick={() => setAccessModal(true)}><LockSVG /> Log PTP</button>
          )}
          {canRecord
            ? <button className="btn btn-primary" onClick={() => setPayModal(true)}>+ Record Payment</button>
            : <button className="btn-locked" onClick={() => setAccessModal(true)}><LockSVG /> Record Payment</button>
          }
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Collected (Posted + Closed)</div>
          <div className="stat-value">₹{totalCollected.toLocaleString()}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">PTPs Kept</div>
          <div className="stat-value">{keptPtps}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-label">Open PTPs</div>
          <div className="stat-value">{openPtps}</div>
        </div>
        {brokenPtps > 0 && (
          <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
            <div className="stat-label">Broken PTPs</div>
            <div className="stat-value" style={{ color: '#dc2626' }}>{brokenPtps}</div>
            {isAdmin && <div className="stat-sub" style={{ color: '#dc2626' }}>⚠ review / escalate</div>}
          </div>
        )}
        {isAdmin && pendVerify > 0 && (
          <div className="stat-card" style={{ borderLeft: '4px solid #1a5fdb' }}>
            <div className="stat-label">Awaiting Verification</div>
            <div className="stat-value">{pendVerify}</div>
            <div className="stat-sub">RECORDED → needs admin verify</div>
          </div>
        )}
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-label">Settlements Approved</div>
          <div className="stat-value">{approvedS}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'ptps'        ? 'active' : ''}`} onClick={() => setTab('ptps')}>
          PTPs ({ptps.length})
        </button>
        <button className={`tab-btn ${tab === 'payments'    ? 'active' : ''}`} onClick={() => setTab('payments')}>
          Payments ({payments.length})
          {pendVerify > 0 && isAdmin && (
            <span style={{ background: '#1a5fdb', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 5 }}>
              {pendVerify}
            </span>
          )}
        </button>
        <button className={`tab-btn ${tab === 'settlements' ? 'active' : ''}`} onClick={() => setTab('settlements')}>
          Settlements ({settlements.length})
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {tab === 'ptps' ? 'Promise to Pay' : tab === 'payments' ? 'Payment Records' : 'Settlement Requests'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={loadAll}>↻ Refresh</button>
        </div>

        {loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
          <div className="table-wrapper">

            {tab === 'ptps' && (
              <table>
                <thead>
                  <tr>
                    <th>PTP ID</th><th>Loan ID</th><th>Agent</th><th>Customer</th>
                    <th>Amount</th><th>Promise Date</th><th>Channel</th><th>Promised By</th>
                    <th>Status</th><th>Prev Status</th><th>New Status</th>
                    <th>Notes</th><th>Created By</th><th>Modified By</th>
                  </tr>
                </thead>
                <tbody>
                  {ptps.map(p => (
                    <tr key={p.ptpId}
                      style={p.status === 'BROKEN' ? { background: 'rgba(220,38,38,.04)' } : {}}>
                      <td className="td-mono">{p.ptpId}</td>
                      <td className="td-primary">#L{p.loanAccountId}</td>
                      <td className="text-muted" style={{ fontSize: 12 }}>
                        {p.agentId ? `Agent ${p.agentId}` : '—'}
                      </td>
                      <td>{p.customerId}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(p.promisedAmount || 0).toLocaleString()}</td>
                      <td className="text-muted">{p.promisedDate || '—'}</td>
                      <td><Badge value={p.channel} /></td>
                      <td style={{ fontSize: 12 }}>{p.promisedBy || '—'}</td>
                      <td>
                        <Badge value={p.status} />
                        {p.status === 'BROKEN' && <span style={{ marginLeft: 4, fontSize: 11, color: '#dc2626' }}>⚠</span>}
                      </td>
                      <td className="text-muted" style={{ fontSize: 11 }}>{p.previousStatus || '—'}</td>
                      <td className="text-muted" style={{ fontSize: 11 }}>{p.newStatus || '—'}</td>
                      <td style={{ maxWidth: 160, fontSize: 12, color: 'var(--text-3)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.notes || '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.createdBy || '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.modifiedBy || '—'}</td>
                    </tr>
                  ))}
                  {ptps.length === 0 && (
                    <tr><td colSpan={14}><div className="empty-state"><p>No PTPs recorded yet</p></div></td></tr>
                  )}
                </tbody>
              </table>
            )}

            {tab === 'payments' && (
              <table>
                <thead>
                  <tr>
                    <th>Payment ID</th><th>Loan ID</th><th>Agent</th><th>Customer</th>
                    <th>Amount</th><th>Mode</th><th>Reference</th>
                    <th>Payment Date</th><th>Status</th>
                    <th>Prev Status</th><th>New Status</th>
                    <th>Created By</th><th>Modified By</th>
                    {isAdmin && <th style={{ minWidth: 170 }}>Admin Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const busy = actionLoading && actionLoading.startsWith(String(p.paymentId))
                    return (
                      <tr key={p.paymentId}>
                        <td className="td-mono">{p.paymentId}</td>
                        <td className="td-primary">#L{p.loanAccountId}</td>
                        <td className="text-muted" style={{ fontSize: 12 }}>
                          {p.agentId ? `Agent ${p.agentId}` : '—'}
                        </td>
                        <td>{p.customerId}</td>
                        <td style={{ fontWeight: 600, color: '#10b981' }}>₹{Number(p.amount || 0).toLocaleString()}</td>
                        <td><Badge value={p.paymentMode} /></td>
                        <td className="td-mono" style={{ fontSize: 12 }}>{p.referenceNumber || '—'}</td>
                        <td className="text-muted">{p.paymentDate || '—'}</td>
                        <td><StatusFlow current={p.status} /></td>
                        <td className="text-muted" style={{ fontSize: 11 }}>{p.previousStatus || '—'}</td>
                        <td className="text-muted" style={{ fontSize: 11 }}>{p.newStatus || '—'}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.createdBy || '—'}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.modifiedBy || '—'}</td>
                        {isAdmin && (
                          <td>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                              {p.status === 'RECORDED' && (<>
                                <button disabled={busy} onClick={() => paymentAction(p.paymentId, 'verify')}
                                  style={{ background: '#1a5fdb', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 10px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .5 : 1 }}>
                                  Verify →
                                </button>
                                <button disabled={busy} onClick={() => paymentAction(p.paymentId, 'fail')}
                                  style={{ background: 'rgba(220,38,38,.1)', color: '#dc2626', border: '1px solid rgba(220,38,38,.2)', borderRadius: 5, padding: '3px 8px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .5 : 1 }}>
                                  Fail
                                </button>
                              </>)}
                              {p.status === 'POSTED' && (
                                <button disabled={busy} onClick={() => paymentAction(p.paymentId, 'close')}
                                  style={{ background: 'rgba(5,150,105,.1)', color: '#059669', border: '1px solid rgba(5,150,105,.2)', borderRadius: 5, padding: '3px 10px', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .5 : 1 }}>
                                  Close ✓
                                </button>
                              )}
                              {['CLOSED', 'FAILED'].includes(p.status) && (
                                <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>final</span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {payments.length === 0 && (
                    <tr><td colSpan={isAdmin ? 14 : 13}><div className="empty-state"><p>No payments recorded yet</p></div></td></tr>
                  )}
                </tbody>
              </table>
            )}

            {tab === 'settlements' && (
              <table>
                <thead>
                  <tr>
                    <th>Settlement ID</th><th>Loan ID</th><th>Customer</th>
                    <th>Settlement Amt</th><th>Waiver Amt</th><th>Reason</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map(s => (
                    <tr key={s.settlementId}>
                      <td className="td-mono">{s.settlementId}</td>
                      <td className="td-primary">#L{s.loanAccountId}</td>
                      <td>{s.customerId}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(s.settlementAmount || 0).toLocaleString()}</td>
                      <td style={{ color: '#f59e0b' }}>₹{Number(s.waiverAmount || 0).toLocaleString()}</td>
                      <td style={{ maxWidth: 200, whiteSpace: 'pre-wrap' }}>{s.reason || '—'}</td>
                      <td><Badge value={s.approvalStatus || s.status} /></td>
                    </tr>
                  ))}
                  {settlements.length === 0 && (
                    <tr><td colSpan={7}><div className="empty-state"><p>No settlements yet</p></div></td></tr>
                  )}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>

      <AccessDeniedModal
        open={accessModal}
        onClose={() => setAccessModal(false)}
        feature={
          !canSettle ? 'Settlement Request (SUPERVISOR or ADMIN only)' :
          !canRecord ? 'Record Payment (AGENT, RECOVERY, FIELD, SUPERVISOR or ADMIN only)' :
                       'Log PTP (AGENT, RECOVERY, FIELD, SUPERVISOR or ADMIN only)'
        }
      />

      <Modal open={ptpModal} onClose={() => { setPtpModal(false); setPtpForm(emptyPtp) }} title="Log Promise to Pay">
        <form onSubmit={savePtp}>
          <div className="modal-body">
            <div style={{ background: 'rgba(26,95,219,.07)', border: '1px solid rgba(26,95,219,.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Status on creation:</span>
              <span style={{ background: '#1a5fdb', color: '#fff', borderRadius: 5, padding: '2px 10px', fontSize: 12, fontWeight: 700, letterSpacing: .4 }}>OPEN</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>(system-managed · not editable)</span>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1001" value={ptpForm.loanAccountId} onChange={set(setPtpForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input className="form-input" type="number" placeholder="e.g. 500" value={ptpForm.customerId} onChange={set(setPtpForm)('customerId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Agent ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1" value={ptpForm.agentId} onChange={set(setPtpForm)('agentId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Promised Amount (₹)</label>
                <input className="form-input" type="number" step="0.01" min="0" placeholder="e.g. 10000" value={ptpForm.promisedAmount} onChange={set(setPtpForm)('promisedAmount')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Promise Date</label>
                <input className="form-input" type="date" value={ptpForm.promisedDate} onChange={set(setPtpForm)('promisedDate')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Channel</label>
                <select className="form-select" value={ptpForm.channel} onChange={set(setPtpForm)('channel')}>
                  {['CALL', 'SMS', 'EMAIL', 'VISIT'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Promised By</label>
              <input className="form-input" placeholder="Customer name / contact" value={ptpForm.promisedBy} onChange={set(setPtpForm)('promisedBy')} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea className="form-textarea" rows={2} placeholder="Any remarks about this promise…" value={ptpForm.notes} onChange={set(setPtpForm)('notes')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => { setPtpModal(false); setPtpForm(emptyPtp) }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Log PTP'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={payModal} onClose={() => { setPayModal(false); setPayForm(emptyPayment) }} title="Record Payment">
        <form onSubmit={savePayment}>
          <div className="modal-body">
            <div style={{ background: 'rgba(100,116,139,.07)', border: '1px solid rgba(100,116,139,.18)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Initial status:</span>
              <span style={{ background: '#64748b', color: '#fff', borderRadius: 5, padding: '2px 10px', fontSize: 12, fontWeight: 700, letterSpacing: .4 }}>RECORDED</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Admin must verify → POSTED</span>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1001" value={payForm.loanAccountId} onChange={set(setPayForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input className="form-input" type="number" placeholder="e.g. 500" value={payForm.customerId} onChange={set(setPayForm)('customerId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Agent ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1" value={payForm.agentId} onChange={set(setPayForm)('agentId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" step="0.01" min="0" placeholder="e.g. 10000" value={payForm.amount} onChange={set(setPayForm)('amount')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-select" value={payForm.paymentMode} onChange={set(setPayForm)('paymentMode')}>
                  {['CASH', 'CHEQUE', 'UPI', 'NEFT', 'RTGS'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reference Number</label>
                <input className="form-input" placeholder="UTR / Cheque No." value={payForm.referenceNumber} onChange={set(setPayForm)('referenceNumber')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input className="form-input" type="date" value={payForm.paymentDate} onChange={set(setPayForm)('paymentDate')} />
              <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, display: 'block' }}>
                Defaults to today if left unchanged
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => { setPayModal(false); setPayForm(emptyPayment) }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={settModal} onClose={() => { setSettModal(false); setSettForm(emptySettlement) }} title="Request Settlement">
        <form onSubmit={saveSettlement}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1001" value={settForm.loanAccountId} onChange={set(setSettForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input className="form-input" type="number" placeholder="e.g. 500" value={settForm.customerId} onChange={set(setSettForm)('customerId')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Agent ID</label>
              <input className="form-input" type="number" placeholder="e.g. 1" value={settForm.agentId} onChange={set(setSettForm)('agentId')} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Settlement Amount (₹)</label>
                <input className="form-input" type="number" step="0.01" min="0" placeholder="e.g. 45000" value={settForm.settlementAmount} onChange={set(setSettForm)('settlementAmount')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Waiver Amount (₹)</label>
                <input className="form-input" type="number" step="0.01" min="0" placeholder="e.g. 5000" value={settForm.waiverAmount} onChange={set(setSettForm)('waiverAmount')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-textarea" placeholder="Reason for settlement…" value={settForm.reason} onChange={set(setSettForm)('reason')} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => { setSettModal(false); setSettForm(emptySettlement) }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting…' : 'Submit Request'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
