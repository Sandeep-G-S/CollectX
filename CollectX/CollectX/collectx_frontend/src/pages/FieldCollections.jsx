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

const emptyVisit    = { agentId: '', loanAccountId: '', customerId: '', visitDate: '', address: '', outcome: 'CONNECTED', notes: '', visitType: 'COMPLETED' }
const emptySchedule = { agentId: '', loanAccountId: '', customerId: '', visitDate: '', address: '', notes: '', visitType: 'SCHEDULED' }
const emptyRepo     = { agentId: '', loanAccountId: '', assetDescription: '', estimatedValue: '', repossessedDate: '' }
const emptyPlace    = { loanAccountId: '', agencyId: '', agencyName: '', placementDate: '', outstandingAmount: '' }

export default function FieldCollections() {
  const [tab,       setTab]      = useState('visits')
  const [visits,    setVisits]   = useState([])
  const [repos,     setRepos]    = useState([])
  const [placements,setPlacements]= useState([])
  const [loading,   setLoading]  = useState(true)
  const [visitModal,   setVisitModal]   = useState(false)
  const [scheduleModal,setScheduleModal]= useState(false)
  const [repoModal,    setRepoModal]    = useState(false)
  const [placeModal,   setPlaceModal]   = useState(false)
  const [visitForm,    setVisitForm]    = useState(emptyVisit)
  const [scheduleForm, setScheduleForm] = useState(emptySchedule)
  const [repoForm,     setRepoForm]     = useState(emptyRepo)
  const [placeForm,    setPlaceForm]    = useState(emptyPlace)
  const [saving,    setSaving]    = useState(false)
  const [accessModal,setAccessModal] = useState(false)
  const toast = useToast()
  const { user } = useAuth()
  const canManageVisits = ['ADMIN', 'SUPERVISOR', 'FIELD', 'AGENT', 'RECOVERY'].includes(user?.role)
  const canAssignAgency = ['ADMIN', 'SUPERVISOR', 'FIELD'].includes(user?.role)

  const loadAll = () => {
    setLoading(true)
    Promise.allSettled([
      client.get('/field/visits'),
      client.get('/field/repossessions'),
      client.get('/field/agency-placements'),
    ]).then(([v, r, p]) => {
      setVisits(v.status === 'fulfilled' ? v.value.data || [] : [])
      setRepos(r.status === 'fulfilled' ? r.value.data || [] : [])
      setPlacements(p.status === 'fulfilled' ? p.value.data || [] : [])
    }).finally(() => setLoading(false))
  }

  useEffect(loadAll, [])

  const set = setter => k => e => setter(f => ({ ...f, [k]: e.target.value }))

  const saveVisit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await client.post('/field/visit', {
        agentId: Number(visitForm.agentId),
        loanAccountId: Number(visitForm.loanAccountId),
        customerId: Number(visitForm.customerId),
        visitDate: visitForm.visitDate,
        address: visitForm.address,
        outcome: visitForm.outcome,
        notes: visitForm.notes,
        visitType: 'COMPLETED',
      })
      toast('Visit logged', 'success')
      setVisitModal(false); setVisitForm(emptyVisit); loadAll()
    } catch (err) { toast(err.response?.data?.message || 'Failed to log visit', 'error') }
    finally { setSaving(false) }
  }

  const saveSchedule = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await client.post('/field/visit', {
        agentId: Number(scheduleForm.agentId),
        loanAccountId: Number(scheduleForm.loanAccountId),
        customerId: Number(scheduleForm.customerId),
        visitDate: scheduleForm.visitDate,
        address: scheduleForm.address,
        notes: scheduleForm.notes,
        visitType: 'SCHEDULED',
        outcome: null,
      })
      toast('Visit scheduled', 'success')
      setScheduleModal(false); setScheduleForm(emptySchedule); loadAll()
    } catch (err) { toast(err.response?.data?.message || 'Failed to schedule visit', 'error') }
    finally { setSaving(false) }
  }

  const saveRepo = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await client.post('/field/repossession', {
        agentId: Number(repoForm.agentId),
        loanAccountId: Number(repoForm.loanAccountId),
        assetDescription: repoForm.assetDescription,
        estimatedValue: Number(repoForm.estimatedValue),
        repossessedDate: repoForm.repossessedDate,
      })
      toast('Repossession recorded', 'success')
      setRepoModal(false); setRepoForm(emptyRepo); loadAll()
    } catch (err) { toast(err.response?.data?.message || 'Failed to record repossession', 'error') }
    finally { setSaving(false) }
  }

  const savePlace = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await client.post('/field/agency-placement', {
        loanAccountId: Number(placeForm.loanAccountId),
        agencyId: Number(placeForm.agencyId),
        agencyName: placeForm.agencyName,
        placementDate: placeForm.placementDate,
        outstandingAmount: Number(placeForm.outstandingAmount),
      })
      toast('Agency placement created', 'success')
      setPlaceModal(false); setPlaceForm(emptyPlace); loadAll()
    } catch (err) { toast(err.response?.data?.message || 'Failed to create placement', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Field Collections</div>
          <div className="page-subtitle">Manage field visits, repossessions and agency placements</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'visits' && (canManageVisits ? <>
            <button className="btn btn-outline" onClick={() => setScheduleModal(true)}>+ Schedule Visit</button>
            <button className="btn btn-primary" onClick={() => setVisitModal(true)}>+ Log Visit</button>
          </> : <>
            <button className="btn-locked" onClick={() => setAccessModal(true)}><LockSVG /> Schedule Visit</button>
            <button className="btn-locked" onClick={() => setAccessModal(true)}><LockSVG /> Log Visit</button>
          </>)}
          {tab === 'repos' && (canManageVisits
            ? <button className="btn btn-primary" onClick={() => setRepoModal(true)}>+ Record Repossession</button>
            : <button className="btn-locked" onClick={() => setAccessModal(true)}><LockSVG /> Record Repossession</button>
          )}
          {tab === 'placements' && (
            canAssignAgency
              ? <button className="btn btn-primary" onClick={() => setPlaceModal(true)}>+ New Placement</button>
              : <button className="btn-locked" onClick={() => setAccessModal(true)}>
                  <LockSVG /> New Placement
                </button>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Field Visits</div>
          <div className="stat-value">{visits.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-label">Repossessions</div>
          <div className="stat-value">{repos.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-label">Agency Placements</div>
          <div className="stat-value">{placements.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">Connected Visits</div>
          <div className="stat-value">{visits.filter(v => v.outcome === 'CONNECTED').length}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'visits' ? 'active' : ''}`} onClick={() => setTab('visits')}>Visits ({visits.length})</button>
        <button className={`tab-btn ${tab === 'repos' ? 'active' : ''}`} onClick={() => setTab('repos')}>Repossessions ({repos.length})</button>
        <button className={`tab-btn ${tab === 'placements' ? 'active' : ''}`} onClick={() => setTab('placements')}>Agency Placements ({placements.length})</button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {tab === 'visits' ? 'Field Visit Log' : tab === 'repos' ? 'Repossession Records' : 'Agency Placements'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={loadAll}>↻ Refresh</button>
        </div>

        {loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            {tab === 'visits' && (
              <table>
                <thead>
                  <tr><th>Visit ID</th><th>Type</th><th>Loan ID</th><th>Agent</th><th>Customer</th><th>Visit Date</th><th>Address</th><th>Outcome</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {visits.map(v => (
                    <tr key={v.visitId}>
                      <td className="td-mono">{v.visitId}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 8px',
                          borderRadius: 4,
                          background: v.visitType === 'SCHEDULED' ? 'rgba(99,102,241,.1)' : 'rgba(16,185,129,.1)',
                          color: v.visitType === 'SCHEDULED' ? '#6366f1' : '#10b981',
                        }}>
                          {v.visitType === 'SCHEDULED' ? 'Scheduled' : 'Logged'}
                        </span>
                      </td>
                      <td className="td-primary">#L{v.loanAccountId}</td>
                      <td>Agent {v.agentId}</td>
                      <td>{v.customerId}</td>
                      <td className="text-muted">{v.visitDate || '—'}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.address || '—'}</td>
                      <td><Badge value={v.outcome} /></td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 12 }}>{v.notes || '—'}</td>
                    </tr>
                  ))}
                  {visits.length === 0 && <tr><td colSpan={9}><div className="empty-state"><p>No visits yet</p></div></td></tr>}
                </tbody>
              </table>
            )}

            {tab === 'repos' && (
              <table>
                <thead>
                  <tr><th>Repo ID</th><th>Loan ID</th><th>Agent</th><th>Asset</th><th>Est. Value</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {repos.map(r => (
                    <tr key={r.repossessionId}>
                      <td className="td-mono">{r.repossessionId}</td>
                      <td className="td-primary">#L{r.loanAccountId}</td>
                      <td>Agent {r.agentId}</td>
                      <td>{r.assetDescription || '—'}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(r.estimatedValue || 0).toLocaleString()}</td>
                      <td className="text-muted">{r.repossessedDate || '—'}</td>
                      <td><Badge value={r.status || 'SEIZED'} /></td>
                    </tr>
                  ))}
                  {repos.length === 0 && <tr><td colSpan={7}><div className="empty-state"><p>No repossessions recorded</p></div></td></tr>}
                </tbody>
              </table>
            )}

            {tab === 'placements' && (
              <table>
                <thead>
                  <tr><th>Placement ID</th><th>Loan ID</th><th>Agency</th><th>Placement Date</th><th>Outstanding</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {placements.map(p => (
                    <tr key={p.placementId}>
                      <td className="td-mono">{p.placementId}</td>
                      <td className="td-primary">#L{p.loanAccountId}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.agencyName || `Agency ${p.agencyId}`}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>ID: {p.agencyId}</div>
                      </td>
                      <td className="text-muted">{p.placementDate || '—'}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(p.outstandingAmount || 0).toLocaleString()}</td>
                      <td><Badge value={p.status || 'ACTIVE'} /></td>
                    </tr>
                  ))}
                  {placements.length === 0 && <tr><td colSpan={6}><div className="empty-state"><p>No agency placements yet</p></div></td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <AccessDeniedModal
        open={accessModal}
        onClose={() => setAccessModal(false)}
        feature="Field Collection write actions (ADMIN, SUPERVISOR, FIELD, AGENT or RECOVERY only)"
      />

      <Modal open={scheduleModal} onClose={() => { setScheduleModal(false); setScheduleForm(emptySchedule) }} title="Schedule Field Visit">
        <form onSubmit={saveSchedule}>
          <div className="modal-body">
            <div style={{ background: 'rgba(99,102,241,.07)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 14, fontSize: 13, color: '#6366f1' }}>
              Scheduling a future visit — no outcome required yet.
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1001" value={scheduleForm.loanAccountId} onChange={set(setScheduleForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input className="form-input" type="number" placeholder="e.g. 500" value={scheduleForm.customerId} onChange={set(setScheduleForm)('customerId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Agent ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1" value={scheduleForm.agentId} onChange={set(setScheduleForm)('agentId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input className="form-input" type="date" min={new Date().toISOString().split('T')[0]} value={scheduleForm.visitDate} onChange={set(setScheduleForm)('visitDate')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="Customer address to visit" value={scheduleForm.address} onChange={set(setScheduleForm)('address')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Notes <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: 11 }}>(optional)</span></label>
              <textarea className="form-textarea" placeholder="Purpose of visit, instructions…" value={scheduleForm.notes} onChange={set(setScheduleForm)('notes')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setScheduleModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Scheduling…' : 'Schedule Visit'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={visitModal} onClose={() => { setVisitModal(false); setVisitForm(emptyVisit) }} title="Log Field Visit">
        <form onSubmit={saveVisit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1001" value={visitForm.loanAccountId} onChange={set(setVisitForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input className="form-input" type="number" placeholder="e.g. 500" value={visitForm.customerId} onChange={set(setVisitForm)('customerId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Agent ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1" value={visitForm.agentId} onChange={set(setVisitForm)('agentId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Visit Date</label>
                <input className="form-input" type="date" value={visitForm.visitDate} onChange={set(setVisitForm)('visitDate')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="Customer address visited" value={visitForm.address} onChange={set(setVisitForm)('address')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Outcome</label>
              <select className="form-select" value={visitForm.outcome} onChange={set(setVisitForm)('outcome')}>
                {['CONNECTED', 'NOT_HOME', 'REFUSED', 'PARTIAL_PAYMENT', 'PTP_GIVEN'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" placeholder="Visit remarks…" value={visitForm.notes} onChange={set(setVisitForm)('notes')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setVisitModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Log Visit'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={repoModal} onClose={() => { setRepoModal(false); setRepoForm(emptyRepo) }} title="Record Repossession">
        <form onSubmit={saveRepo}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1001" value={repoForm.loanAccountId} onChange={set(setRepoForm)('loanAccountId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Agent ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1" value={repoForm.agentId} onChange={set(setRepoForm)('agentId')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Asset Description</label>
              <input className="form-input" placeholder="e.g. Honda Activa — MH02-AB1234" value={repoForm.assetDescription} onChange={set(setRepoForm)('assetDescription')} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Estimated Value (₹)</label>
                <input className="form-input" type="number" step="0.01" placeholder="e.g. 80000" value={repoForm.estimatedValue} onChange={set(setRepoForm)('estimatedValue')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Repossession Date</label>
                <input className="form-input" type="date" value={repoForm.repossessedDate} onChange={set(setRepoForm)('repossessedDate')} required />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setRepoModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={placeModal} onClose={() => { setPlaceModal(false); setPlaceForm(emptyPlace) }} title="New Agency Placement">
        <form onSubmit={savePlace}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Loan Account ID</label>
              <input className="form-input" type="number" placeholder="e.g. 1001" value={placeForm.loanAccountId} onChange={set(setPlaceForm)('loanAccountId')} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Agency ID</label>
                <input className="form-input" type="number" placeholder="e.g. 10" value={placeForm.agencyId} onChange={set(setPlaceForm)('agencyId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Agency Name</label>
                <input className="form-input" placeholder="e.g. Alpha Recoveries Pvt Ltd" value={placeForm.agencyName} onChange={set(setPlaceForm)('agencyName')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Placement Date</label>
                <input className="form-input" type="date" value={placeForm.placementDate} onChange={set(setPlaceForm)('placementDate')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Outstanding Amount (₹)</label>
                <input className="form-input" type="number" step="0.01" placeholder="e.g. 120000" value={placeForm.outstandingAmount} onChange={set(setPlaceForm)('outstandingAmount')} required />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setPlaceModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Placement'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
