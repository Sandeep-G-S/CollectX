import { useState, useEffect } from 'react'
import client from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AccessDeniedModal from '../components/AccessDeniedModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

const emptyAction = {
  loanAccountId: '', customerId: '', actionType: 'NOTICE',
  caseNumber: '', courtName: '', filedDate: '',
  nextHearingDate: '', assignedLawyer: '', notes: '',
}
const emptyWriteoff = {
  loanAccountId: '', customerId: '',
  principalWO: '', interestWO: '', feesWO: '',
  writeOffReason: 'BANK_POLICY', reason: '', approvedBy: '',
  chargeOffDate: '', approvalDate: '', notes: '',
}
const emptyRecovery = {
  loanAccountId: '', customerId: '',
  recoveredAmount: '', recoveryDate: '',
  source: 'AGENCY', recoveryMode: 'CASH',
  recoveryType: '', linkedWriteOffId: '', notes: '',
}

const LockSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const fmtAmt = v => v != null ? `₹${Number(v).toLocaleString()}` : '—'

const nextAllowedStatuses = status => {
  if (status === 'OPEN')        return ['IN_PROGRESS']
  if (status === 'IN_PROGRESS') return ['DISPOSED', 'WITHDRAWN', 'SETTLEMENT']
  return []
}

export default function Legal() {
  const { user } = useAuth()
  const toast = useToast()

  const canViewActions    = true
  const canViewWriteoffs  = ['ADMIN', 'COMPLIANCE'].includes(user?.role)
  const canViewRecoveries = ['ADMIN', 'RECOVERY', 'COMPLIANCE'].includes(user?.role)
  const canFileAction     = ['COMPLIANCE', 'ADMIN'].includes(user?.role)
  const canUpdateAction   = ['COMPLIANCE', 'ADMIN'].includes(user?.role)
  const canWriteOff       = user?.role === 'ADMIN'
  const canRecordRecovery = ['ADMIN', 'RECOVERY'].includes(user?.role)
  const canVerifyClose    = ['ADMIN', 'SUPERVISOR'].includes(user?.role)

  const defaultTab = () => {
    if (user?.role === 'RECOVERY') return 'recoveries'
    return 'actions'
  }

  const [tab,           setTab]          = useState(defaultTab)
  const [actions,       setActions]      = useState([])
  const [writeoffs,     setWriteoffs]    = useState([])
  const [recoveries,    setRecoveries]   = useState([])
  const [loading,       setLoading]      = useState(true)

  const [actionModal,   setActionModal]  = useState(false)
  const [woModal,       setWoModal]      = useState(false)
  const [recModal,      setRecModal]     = useState(false)
  const [statusModal,   setStatusModal]  = useState(false)
  const [statusTarget,  setStatusTarget] = useState(null)
  const [newStatus,     setNewStatus]    = useState('')

  const [accessModal,   setAccessModal]  = useState(false)
  const [accessFeature, setAccessFeature]= useState('')

  const [actionForm,    setActionForm]   = useState(emptyAction)
  const [woForm,        setWoForm]       = useState(emptyWriteoff)
  const [recForm,       setRecForm]      = useState(emptyRecovery)
  const [saving,        setSaving]       = useState(false)

  const showAccessDenied = feat => { setAccessFeature(feat); setAccessModal(true) }

  const loadAll = () => {
    setLoading(true)
    const calls = [
      canViewActions    ? client.get('/legal/actions')    : Promise.resolve({ data: [] }),
      canViewWriteoffs  ? client.get('/legal/writeoffs')  : Promise.resolve({ data: [] }),
      canViewRecoveries ? client.get('/legal/recoveries') : Promise.resolve({ data: [] }),
    ]
    Promise.allSettled(calls).then(([a, w, r]) => {
      setActions   (a.status === 'fulfilled' ? a.value.data || [] : [])
      setWriteoffs (w.status === 'fulfilled' ? w.value.data || [] : [])
      setRecoveries(r.status === 'fulfilled' ? r.value.data || [] : [])
    }).finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  const set = setter => key => e => setter(f => ({ ...f, [key]: e.target.value }))

  const saveAction = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await client.post('/legal/action', {
        loanAccountId:   Number(actionForm.loanAccountId),
        customerId:      Number(actionForm.customerId),
        actionType:      actionForm.actionType,
        caseNumber:      actionForm.caseNumber,
        courtName:       actionForm.courtName,
        filedDate:       actionForm.filedDate || null,
        nextHearingDate: actionForm.nextHearingDate || null,
        assignedLawyer:  actionForm.assignedLawyer,
        notes:           actionForm.notes,
      })
      toast('Legal action filed', 'success')
      if (res.data) setActions(prev => [...prev, res.data])
      setActionModal(false); setActionForm(emptyAction)
      setTimeout(loadAll, 300)
    } catch (err) { toast(err.response?.data?.message || 'Failed to file action', 'error') }
    finally { setSaving(false) }
  }

  const openStatusModal = action => {
    setStatusTarget({ id: action.legalActionId, currentStatus: action.status })
    setNewStatus(nextAllowedStatuses(action.status)[0] || '')
    setStatusModal(true)
  }

  const submitStatusUpdate = async () => {
    if (!newStatus) return
    setSaving(true)
    try {
      const res = await client.put(`/legal/action/${statusTarget.id}/status`, { status: newStatus })
      toast(`Status updated to ${newStatus}`, 'success')
      setActions(prev => prev.map(a => a.legalActionId === statusTarget.id ? res.data : a))
      setStatusModal(false)
    } catch (err) { toast(err.response?.data?.message || 'Status update failed', 'error') }
    finally { setSaving(false) }
  }

  const saveWriteoff = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const principal = woForm.principalWO ? Number(woForm.principalWO) : null
      const interest  = woForm.interestWO  ? Number(woForm.interestWO)  : null
      const fees      = woForm.feesWO      ? Number(woForm.feesWO)      : null
      const total     = (principal || 0) + (interest || 0) + (fees || 0)

      const res = await client.post('/legal/writeoff', {
        loanAccountId:  Number(woForm.loanAccountId),
        customerId:     Number(woForm.customerId),
        principalWO:    principal,
        interestWO:     interest,
        feesWO:         fees,
        writeOffAmount: total || null,
        writeOffReason: woForm.writeOffReason,
        reason:         woForm.reason,
        approvedBy:     woForm.approvedBy,
        chargeOffDate:  woForm.chargeOffDate || null,
        approvalDate:   woForm.approvalDate  || null,
        notes:          woForm.notes,
      })
      toast('Write-off initiated (PENDING)', 'success')
      if (res.data) setWriteoffs(prev => [...prev, res.data])
      setWoModal(false); setWoForm(emptyWriteoff)
      setTimeout(loadAll, 300)
    } catch (err) { toast(err.response?.data?.message || 'Failed to initiate write-off', 'error') }
    finally { setSaving(false) }
  }

  const woAction = async (endpoint, id, label) => {
    try {
      const res = await client.put(`/legal/writeoff/${id}/${endpoint}`)
      toast(`Write-off ${label}`, 'success')
      setWriteoffs(prev => prev.map(w => w.writeOffId === id ? res.data : w))
    } catch (err) { toast(err.response?.data?.message || `Failed to ${label} write-off`, 'error') }
  }

  const saveRecovery = async e => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await client.post('/legal/recovery', {
        loanAccountId:   Number(recForm.loanAccountId),
        customerId:      Number(recForm.customerId),
        recoveredAmount: Number(recForm.recoveredAmount),
        recoveryDate:    recForm.recoveryDate || null,
        source:          recForm.source,
        recoveryMode:    recForm.recoveryMode,
        recoveryType:    recForm.recoveryType || null,
        linkedWriteOffId: recForm.linkedWriteOffId ? Number(recForm.linkedWriteOffId) : null,
        notes:           recForm.notes,
      })
      toast('Recovery recorded (RECORDED)', 'success')
      if (res.data) setRecoveries(prev => [...prev, res.data])
      setRecModal(false); setRecForm(emptyRecovery)
      setTimeout(loadAll, 300)
    } catch (err) { toast(err.response?.data?.message || 'Failed to record recovery', 'error') }
    finally { setSaving(false) }
  }

  const recoveryAction = async (endpoint, id, label) => {
    try {
      const res = await client.put(`/legal/recovery/${id}/${endpoint}`)
      toast(`Recovery ${label}`, 'success')
      setRecoveries(prev => prev.map(r => r.recoveryId === id ? res.data : r))
    } catch (err) { toast(err.response?.data?.message || `Failed to ${label} recovery`, 'error') }
  }

  const totalWrittenOff = writeoffs.reduce((s, w) => s + (w.writeOffAmount || 0), 0)
  const totalRecovered  = recoveries.reduce((s, r) => s + (r.recoveredAmount || 0), 0)
  const openActions     = actions.filter(a => a.status === 'OPEN').length
  const pendingWO       = writeoffs.filter(w => w.status === 'PENDING').length

  const visibleTabs = [
    canViewActions    && { key: 'actions',    label: 'Legal Actions',     count: actions.length },
    canViewWriteoffs  && { key: 'writeoffs',  label: 'Write-Offs',        count: writeoffs.length },
    canViewRecoveries && { key: 'recoveries', label: 'Recovery',          count: recoveries.length },
  ].filter(Boolean)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Legal & Write-Off</div>
          <div className="page-subtitle">Legal notices, write-offs and post-write-off recovery</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'actions' && (
            canFileAction
              ? <button className="btn btn-primary" onClick={() => setActionModal(true)}>+ File Action</button>
              : <button className="btn-locked" onClick={() => showAccessDenied('File Legal Action (COMPLIANCE or ADMIN only)')}>
                  <LockSVG /> File Action
                </button>
          )}
          {tab === 'writeoffs' && (
            canWriteOff
              ? <button className="btn btn-primary" onClick={() => setWoModal(true)}>+ Write-Off</button>
              : <button className="btn-locked" onClick={() => showAccessDenied('Initiate Write-Off (ADMIN only)')}>
                  <LockSVG /> Write-Off
                </button>
          )}
          {tab === 'recoveries' && (
            canRecordRecovery
              ? <button className="btn btn-primary" onClick={() => setRecModal(true)}>+ Record Recovery</button>
              : <button className="btn-locked" onClick={() => showAccessDenied('Record Recovery (ADMIN or RECOVERY role only)')}>
                  <LockSVG /> Record Recovery
                </button>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Legal Actions</div>
          <div className="stat-value">{actions.length}</div>
          <div className="stat-sub">{openActions} open</div>
        </div>
        {canViewWriteoffs && (
          <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="stat-label">Total Written Off</div>
            <div className="stat-value">{fmtAmt(totalWrittenOff)}</div>
            <div className="stat-sub">{pendingWO} pending approval</div>
          </div>
        )}
        {canViewRecoveries && (
          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="stat-label">Total Recovered</div>
            <div className="stat-value">{fmtAmt(totalRecovered)}</div>
          </div>
        )}
        {canViewWriteoffs && canViewRecoveries && (
          <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
            <div className="stat-label">Recovery Rate</div>
            <div className="stat-value">
              {totalWrittenOff > 0 ? Math.round(totalRecovered / totalWrittenOff * 100) : 0}%
            </div>
          </div>
        )}
      </div>

      <div className="tabs">
        {visibleTabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {tab === 'actions' ? 'Legal Actions' : tab === 'writeoffs' ? 'Write-Off Records' : 'Post Write-Off Recoveries'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={loadAll}>↻ Refresh</button>
        </div>

        {loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
          <div className="table-wrapper">

            {tab === 'actions' && (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Loan</th><th>Customer</th><th>Type</th>
                    <th>Case #</th><th>Court</th><th>Filed</th><th>Next Hearing</th>
                    <th>Lawyer</th><th>Status</th><th>Prev Status</th>
                    {canUpdateAction && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {actions.map(a => {
                    const canTransition = nextAllowedStatuses(a.status).length > 0
                    return (
                      <tr key={a.legalActionId}>
                        <td className="td-mono">{a.legalActionId}</td>
                        <td className="td-primary">#L{a.loanAccountId}</td>
                        <td>{a.customerId}</td>
                        <td><Badge value={a.actionType} /></td>
                        <td className="td-mono" style={{ fontSize: 12 }}>{a.caseNumber || '—'}</td>
                        <td>{a.courtName || '—'}</td>
                        <td className="text-muted">{a.filedDate || '—'}</td>
                        <td className="text-muted">{a.nextHearingDate || '—'}</td>
                        <td>{a.assignedLawyer || '—'}</td>
                        <td><Badge value={a.status || 'OPEN'} /></td>
                        <td className="text-muted" style={{ fontSize: 12 }}>{a.previousStatus || '—'}</td>
                        {canUpdateAction && (
                          <td>
                            {canTransition && (
                              <button className="btn btn-xs btn-outline" onClick={() => openStatusModal(a)}>
                                Update Status
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {actions.length === 0 && (
                    <tr><td colSpan={canUpdateAction ? 12 : 11}>
                      <div className="empty-state"><p>No legal actions filed</p></div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

            {tab === 'writeoffs' && (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Loan</th><th>Customer</th>
                    <th>Principal WO</th><th>Interest WO</th><th>Fees WO</th><th>Total</th>
                    <th>Reason</th><th>Charge-Off Date</th><th>Approved By</th>
                    <th>Status</th><th>Prev Status</th>
                    {canWriteOff && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {writeoffs.map(w => (
                    <tr key={w.writeOffId} style={w.status === 'REVERSED' ? { opacity: 0.6 } : {}}>
                      <td className="td-mono">{w.writeOffId}</td>
                      <td className="td-primary">#L{w.loanAccountId}</td>
                      <td>{w.customerId}</td>
                      <td>{fmtAmt(w.principalWO)}</td>
                      <td>{fmtAmt(w.interestWO)}</td>
                      <td>{fmtAmt(w.feesWO)}</td>
                      <td style={{ fontWeight: 600, color: '#ef4444' }}>{fmtAmt(w.writeOffAmount)}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.writeOffReason || w.reason || '—'}
                      </td>
                      <td className="text-muted">{w.chargeOffDate || '—'}</td>
                      <td>{w.approvedBy || '—'}</td>
                      <td><Badge value={w.status || 'PENDING'} /></td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{w.previousStatus || '—'}</td>
                      {canWriteOff && (
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {w.status === 'PENDING' && (
                            <button className="btn btn-xs btn-success" onClick={() => woAction('post', w.writeOffId, 'posted')}>
                              Post
                            </button>
                          )}
                          {w.status === 'POSTED' && (
                            <button className="btn btn-xs btn-danger" onClick={() => woAction('reverse', w.writeOffId, 'reversed')}
                              style={{ marginLeft: 4 }}>
                              Reverse
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {writeoffs.length === 0 && (
                    <tr><td colSpan={canWriteOff ? 13 : 12}>
                      <div className="empty-state"><p>No write-offs recorded</p></div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

            {tab === 'recoveries' && (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Loan</th><th>Customer</th><th>Recovered</th>
                    <th>Source</th><th>Mode</th><th>Date</th><th>Linked WO</th>
                    <th>Status</th><th>Prev Status</th><th>Notes</th>
                    {canVerifyClose && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {recoveries.map(r => (
                    <tr key={r.recoveryId}>
                      <td className="td-mono">{r.recoveryId}</td>
                      <td className="td-primary">#L{r.loanAccountId}</td>
                      <td>{r.customerId}</td>
                      <td style={{ fontWeight: 600, color: '#10b981' }}>{fmtAmt(r.recoveredAmount)}</td>
                      <td><Badge value={r.source || r.recoveryType || 'AGENCY'} /></td>
                      <td>{r.recoveryMode || '—'}</td>
                      <td className="text-muted">{r.recoveryDate || '—'}</td>
                      <td className="td-mono">{r.linkedWriteOffId || '—'}</td>
                      <td><Badge value={r.status || 'RECORDED'} /></td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{r.previousStatus || '—'}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {r.notes || '—'}
                      </td>
                      {canVerifyClose && (
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {r.status === 'RECORDED' && (
                            <button className="btn btn-xs btn-success" onClick={() => recoveryAction('verify', r.recoveryId, 'verified')}>
                              Verify
                            </button>
                          )}
                          {r.status === 'VERIFIED' && (
                            <button className="btn btn-xs btn-primary" onClick={() => recoveryAction('close', r.recoveryId, 'closed')}
                              style={{ marginLeft: 4 }}>
                              Close
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {recoveries.length === 0 && (
                    <tr><td colSpan={canVerifyClose ? 12 : 11}>
                      <div className="empty-state"><p>No recoveries recorded</p></div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <AccessDeniedModal open={accessModal} onClose={() => setAccessModal(false)} feature={accessFeature} />

      {statusModal && statusTarget && (
        <div className="modal-overlay" onClick={() => setStatusModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Update Legal Action Status</span>
              <button className="modal-close" onClick={() => setStatusModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-3)' }}>
                Action #{statusTarget.id} — current status: <strong>{statusTarget.currentStatus}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {nextAllowedStatuses(statusTarget.currentStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setStatusModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitStatusUpdate} disabled={saving || !newStatus}>
                {saving ? 'Updating…' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={actionModal} onClose={() => { setActionModal(false); setActionForm(emptyAction) }} title="File Legal Action">
        <form onSubmit={saveAction}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID *</label>
                <input className="form-input" type="number" placeholder="e.g. 1001"
                  value={actionForm.loanAccountId} onChange={set(setActionForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID *</label>
                <input className="form-input" type="number" placeholder="e.g. 500"
                  value={actionForm.customerId} onChange={set(setActionForm)('customerId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Action Type *</label>
                <select className="form-select" value={actionForm.actionType} onChange={set(setActionForm)('actionType')}>
                  {['NOTICE', 'SUMMONS', 'ARBITRATION', 'CIVIL_SUIT', 'CRIMINAL_COMPLAINT', 'LOK_ADALAT'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Filed Date *</label>
                <input className="form-input" type="date" value={actionForm.filedDate}
                  onChange={set(setActionForm)('filedDate')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Next Hearing Date</label>
                <input className="form-input" type="date" value={actionForm.nextHearingDate}
                  onChange={set(setActionForm)('nextHearingDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Lawyer</label>
                <input className="form-input" placeholder="e.g. Adv. Sharma" value={actionForm.assignedLawyer}
                  onChange={set(setActionForm)('assignedLawyer')} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Case Number</label>
                <input className="form-input" placeholder="e.g. CC/2024/1234" value={actionForm.caseNumber}
                  onChange={set(setActionForm)('caseNumber')} />
              </div>
              <div className="form-group">
                <label className="form-label">Court Name</label>
                <input className="form-input" placeholder="e.g. Civil Court, Mumbai" value={actionForm.courtName}
                  onChange={set(setActionForm)('courtName')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={3} placeholder="Additional remarks…"
                value={actionForm.notes} onChange={set(setActionForm)('notes')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setActionModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Filing…' : 'File Action'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={woModal} onClose={() => { setWoModal(false); setWoForm(emptyWriteoff) }} title="Initiate Write-Off">
        <form onSubmit={saveWriteoff}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID *</label>
                <input className="form-input" type="number" placeholder="e.g. 1001"
                  value={woForm.loanAccountId} onChange={set(setWoForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID *</label>
                <input className="form-input" type="number" placeholder="e.g. 500"
                  value={woForm.customerId} onChange={set(setWoForm)('customerId')} required />
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 8px' }}>
              Enter the breakdown (principal + interest + fees). Total is computed automatically.
            </p>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Principal (₹)</label>
                <input className="form-input" type="number" step="0.01" placeholder="0.00"
                  value={woForm.principalWO} onChange={set(setWoForm)('principalWO')} />
              </div>
              <div className="form-group">
                <label className="form-label">Interest (₹)</label>
                <input className="form-input" type="number" step="0.01" placeholder="0.00"
                  value={woForm.interestWO} onChange={set(setWoForm)('interestWO')} />
              </div>
              <div className="form-group">
                <label className="form-label">Fees (₹)</label>
                <input className="form-input" type="number" step="0.01" placeholder="0.00"
                  value={woForm.feesWO} onChange={set(setWoForm)('feesWO')} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Write-Off Reason *</label>
                <select className="form-select" value={woForm.writeOffReason} onChange={set(setWoForm)('writeOffReason')}>
                  {['BANK_POLICY', 'CUSTOMER_BANKRUPTCY', 'REGULATORY_REQUIREMENT', 'SETTLEMENT', 'OTHER'].map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Approved By *</label>
                <input className="form-input" placeholder="e.g. CFO / Credit Head" value={woForm.approvedBy}
                  onChange={set(setWoForm)('approvedBy')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Charge-Off Date</label>
                <input className="form-input" type="date" value={woForm.chargeOffDate}
                  onChange={set(setWoForm)('chargeOffDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Approval Date</label>
                <input className="form-input" type="date" value={woForm.approvalDate}
                  onChange={set(setWoForm)('approvalDate')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <textarea className="form-textarea" rows={2} placeholder="Write-off justification…"
                value={woForm.reason} onChange={set(setWoForm)('reason')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setWoModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Initiate Write-Off'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={recModal} onClose={() => { setRecModal(false); setRecForm(emptyRecovery) }} title="Record Recovery">
        <form onSubmit={saveRecovery}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID *</label>
                <input className="form-input" type="number" placeholder="e.g. 1001"
                  value={recForm.loanAccountId} onChange={set(setRecForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID *</label>
                <input className="form-input" type="number" placeholder="e.g. 500"
                  value={recForm.customerId} onChange={set(setRecForm)('customerId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Recovered Amount (₹) *</label>
                <input className="form-input" type="number" step="0.01" placeholder="e.g. 20000"
                  value={recForm.recoveredAmount} onChange={set(setRecForm)('recoveredAmount')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Recovery Date *</label>
                <input className="form-input" type="date" value={recForm.recoveryDate}
                  onChange={set(setRecForm)('recoveryDate')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Source</label>
                <select className="form-select" value={recForm.source} onChange={set(setRecForm)('source')}>
                  {['AGENCY', 'LEGAL', 'WALK_IN', 'SETTLEMENT'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-select" value={recForm.recoveryMode} onChange={set(setRecForm)('recoveryMode')}>
                  {['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Linked Write-Off ID</label>
              <input className="form-input" type="number" placeholder="Optional — write-off this recovery is linked to"
                value={recForm.linkedWriteOffId} onChange={set(setRecForm)('linkedWriteOffId')} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={2} placeholder="Recovery details…"
                value={recForm.notes} onChange={set(setRecForm)('notes')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setRecModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record Recovery'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
