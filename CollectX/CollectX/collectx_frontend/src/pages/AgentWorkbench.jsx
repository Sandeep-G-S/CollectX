import { useState, useEffect } from 'react'
import client from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AccessDeniedPage from '../components/AccessDeniedPage'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

const emptyNote  = { agentId: '', loanAccountId: '', note: '', noteType: 'GENERAL' }
const emptyTask  = { agentId: '', loanAccountId: '', taskType: 'CALL', dueDate: '', priority: 'MEDIUM' }
const emptyPtp   = { loanAccountId: '', amount: '', promisedDate: '' }
const emptyCase  = { loanAccountId: '', caseType: 'COLLECTIONS', priority: 'MEDIUM' }
const CASE_TYPES = ['COLLECTIONS', 'HARDSHIP', 'LEGAL', 'DELINQUENCY', 'DISPUTE']

export default function AgentWorkbench() {
  const [assignments, setAssignments] = useState([])
  const [selected,    setSelected]    = useState(null)
  const [notes,       setNotes]       = useState([])
  const [tasks,       setTasks]       = useState([])
  const [ptps,        setPtps]        = useState([])
  const [cases,       setCases]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [detailLoad,  setDetailLoad]  = useState(false)
  const [activeTab,   setActiveTab]   = useState('notes')
  const [noteModal,   setNoteModal]   = useState(false)
  const [taskModal,   setTaskModal]   = useState(false)
  const [ptpModal,    setPtpModal]    = useState(false)
  const [caseModal,   setCaseModal]   = useState(false)
  const [noteForm,    setNoteForm]    = useState(emptyNote)
  const [taskForm,    setTaskForm]    = useState(emptyTask)
  const [ptpForm,     setPtpForm]     = useState(emptyPtp)
  const [caseForm,    setCaseForm]    = useState(emptyCase)
  const [saving,      setSaving]      = useState(false)
  const [search,      setSearch]      = useState('')
  const toast = useToast()
  const { user } = useAuth()
  const canViewAssignments = ['ADMIN', 'SUPERVISOR', 'AGENT'].includes(user?.role)

  useEffect(() => {
    if (!canViewAssignments) { setLoading(false); return }
    setLoading(true)
    client.get('/strategy/assignments')
      .then(r => setAssignments(r.data || []))
      .catch(() => toast('Could not load assignments', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const selectCase = async (a) => {
    setSelected(a)
    setActiveTab('notes')
    setDetailLoad(true)
    try {
      const [n, t, p, c] = await Promise.allSettled([
        client.get(`/agent/notes/loan/${a.loanAccountId}`),
        client.get(`/agent/tasks/agent/${a.agentId}`),
        client.get(`/payment/ptp/loan/${a.loanAccountId}`),
        client.get(`/agent/cases/${a.loanAccountId}`),
      ])
      setNotes(n.status === 'fulfilled' ? n.value.data || [] : [])
      setTasks(t.status === 'fulfilled' ? t.value.data || [] : [])
      setPtps(p.status === 'fulfilled' ? p.value.data || [] : [])
      setCases(c.status === 'fulfilled' ? c.value.data || [] : [])
    } catch {
      toast('Could not load case details', 'error')
    } finally {
      setDetailLoad(false)
    }
  }

  const set = (setter) => k => e => setter(f => ({ ...f, [k]: e.target.value }))

  const saveNote = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/agent/note', noteForm)
      toast('Note added', 'success')
      setNoteModal(false)
      setNoteForm(emptyNote)
      const r = await client.get(`/agent/notes/loan/${selected.loanAccountId}`)
      setNotes(r.data || [])
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save note', 'error')
    } finally { setSaving(false) }
  }

  const saveTask = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/agent/task', taskForm)
      toast('Task created', 'success')
      setTaskModal(false)
      setTaskForm(emptyTask)
      const r = await client.get(`/agent/tasks/agent/${selected.agentId}`)
      setTasks(r.data || [])
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create task', 'error')
    } finally { setSaving(false) }
  }

  const savePtp = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/agent/ptp', {
        loanAccountId: String(ptpForm.loanAccountId),
        amount: String(ptpForm.amount),
        promisedDate: ptpForm.promisedDate || undefined,
      })
      toast('PTP Created', 'success')
      setPtpModal(false)
      setPtpForm(emptyPtp)
      const r = await client.get(`/payment/ptp/loan/${selected.loanAccountId}`)
      setPtps(r.data || [])
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to log PTP', 'error')
    } finally { setSaving(false) }
  }

  const openNoteModal = () => {
    setNoteForm({ ...emptyNote, agentId: selected?.agentId || '', loanAccountId: selected?.loanAccountId || '' })
    setNoteModal(true)
  }
  const openTaskModal = () => {
    setTaskForm({ ...emptyTask, agentId: selected?.agentId || '', loanAccountId: selected?.loanAccountId || '' })
    setTaskModal(true)
  }
  const openPtpModal = () => {
    setPtpForm({ ...emptyPtp, loanAccountId: selected?.loanAccountId || '' })
    setPtpModal(true)
  }

  const openCaseModal = () => {
    setCaseForm({ ...emptyCase, loanAccountId: selected?.loanAccountId || '' })
    setCaseModal(true)
  }

  const saveCase = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/agent/case', {
        loanAccountId: Number(caseForm.loanAccountId),
        caseType:      caseForm.caseType,
        priority:      caseForm.priority,
      })
      toast('Case created', 'success')
      setCaseModal(false)
      setCaseForm(emptyCase)
      const r = await client.get(`/agent/cases/${selected.loanAccountId}`)
      setCases(r.data || [])
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create case', 'error')
    } finally { setSaving(false) }
  }

  const filtered = assignments.filter(a => {
    if (!search) return true
    const s = search.toLowerCase()
    return String(a.loanAccountId).includes(s) || String(a.agentId).includes(s)
  })

  if (!canViewAssignments) {
    return <AccessDeniedPage module="Agent Workbench" role={user?.role} />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Agent Workbench</div>
          <div className="page-subtitle">Select a case to view details, add notes, tasks and PTPs</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ maxHeight: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ flexShrink: 0 }}>
            <span className="card-title">My Cases</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{assignments.length}</span>
          </div>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <input
              className="form-input"
              placeholder="Search loan / agent ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {!canViewAssignments ? (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 6 }}>Access Restricted</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>Case assignments are available to Agents, Supervisors and Admins only.</div>
              </div>
            ) : loading ? (
              <div className="loader-wrap"><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state"><p>No cases found</p></div>
            ) : (
              filtered.map(a => (
                <div
                  key={a.assignmentId}
                  onClick={() => selectCase(a)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selected?.assignmentId === a.assignmentId ? 'rgba(99,102,241,0.08)' : 'transparent',
                    borderLeft: selected?.assignmentId === a.assignmentId ? '3px solid var(--accent)' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (selected?.assignmentId !== a.assignmentId) e.currentTarget.style.background = 'var(--surface)' }}
                  onMouseLeave={e => { if (selected?.assignmentId !== a.assignmentId) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>#L{a.loanAccountId}</span>
                    <Badge value={a.status} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Agent {a.agentId} · Q-{a.queueId}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.assignedDate}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-body" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Loan #L{selected.loanAccountId}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                      Agent {selected.agentId} &nbsp;·&nbsp; Queue Q-{selected.queueId} &nbsp;·&nbsp; Assigned {selected.assignedDate}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Badge value={selected.status} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={openNoteModal}>+ Add Note</button>
              <button className="btn btn-outline btn-sm" onClick={openTaskModal}>+ New Task</button>
              <button className="btn btn-outline btn-sm" onClick={openPtpModal}>+ Log PTP</button>
              <button className="btn btn-outline btn-sm" style={{ borderColor: '#7c3aed', color: '#7c3aed' }} onClick={openCaseModal}>+ Create Case</button>
            </div>

            <div className="tabs">
              <button className={`tab-btn ${activeTab === 'notes'  ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes ({notes.length})</button>
              <button className={`tab-btn ${activeTab === 'tasks'  ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Tasks ({tasks.length})</button>
              <button className={`tab-btn ${activeTab === 'ptps'   ? 'active' : ''}`} onClick={() => setActiveTab('ptps')}>PTPs ({ptps.length})</button>
              <button className={`tab-btn ${activeTab === 'cases'  ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>Cases ({cases.length})</button>
            </div>

            {detailLoad ? <div className="loader-wrap"><div className="spinner" /></div> : (
              <div className="card">
                <div className="table-wrapper">
                  {activeTab === 'notes' && (
                    <table>
                      <thead>
                        <tr><th>Note ID</th><th>Agent</th><th>Type</th><th>Note</th><th>Created</th></tr>
                      </thead>
                      <tbody>
                        {notes.map(n => (
                          <tr key={n.noteId}>
                            <td className="td-mono">{n.noteId}</td>
                            <td>Agent {n.agentId}</td>
                            <td><Badge value={n.noteType || 'GENERAL'} /></td>
                            <td style={{ maxWidth: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{n.note}</td>
                            <td className="text-muted">{n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                        {notes.length === 0 && (
                          <tr><td colSpan={5}><div className="empty-state"><p>No notes yet</p><span>Click "Add Note" to get started</span></div></td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                  {activeTab === 'tasks' && (
                    <table>
                      <thead>
                        <tr><th>Task ID</th><th>Type</th><th>Priority</th><th>Due Date</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {tasks.map(t => (
                          <tr key={t.taskId}>
                            <td className="td-mono">{t.taskId}</td>
                            <td>{t.taskType}</td>
                            <td><Badge value={t.priority} /></td>
                            <td className="text-muted">{t.dueDate || '—'}</td>
                            <td><Badge value={t.status || 'OPEN'} /></td>
                          </tr>
                        ))}
                        {tasks.length === 0 && (
                          <tr><td colSpan={5}><div className="empty-state"><p>No tasks</p><span>Click "New Task" to create one</span></div></td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                  {activeTab === 'ptps' && (
                    <table>
                      <thead>
                        <tr><th>PTP ID</th><th>Customer</th><th>Amount</th><th>Promised Date</th><th>Channel</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {ptps.map(p => (
                          <tr key={p.ptpId}>
                            <td className="td-mono">{p.ptpId}</td>
                            <td>{p.customerId}</td>
                            <td style={{ fontWeight: 600 }}>₹{Number(p.promisedAmount || 0).toLocaleString()}</td>
                            <td className="text-muted">{p.promisedDate || '—'}</td>
                            <td><Badge value={p.channel} /></td>
                            <td><Badge value={p.status} /></td>
                          </tr>
                        ))}
                        {ptps.length === 0 && (
                          <tr><td colSpan={6}><div className="empty-state"><p>No PTPs</p><span>Click "Log PTP" to record a promise</span></div></td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                  {activeTab === 'cases' && (
                    <table>
                      <thead>
                        <tr><th>Case ID</th><th>Type</th><th>Priority</th><th>Opened</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {cases.map(c => (
                          <tr key={c.caseId}>
                            <td className="td-mono">{c.caseId}</td>
                            <td><Badge value={c.caseType} /></td>
                            <td><Badge value={c.priority} /></td>
                            <td className="text-muted">{c.openedDate || '—'}</td>
                            <td><Badge value={c.status || 'OPEN'} /></td>
                          </tr>
                        ))}
                        {cases.length === 0 && (
                          <tr><td colSpan={5}><div className="empty-state"><p>No cases</p><span>Click "+ Create Case" to open a collection case</span></div></td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <div className="empty-state">
              <p>No case selected</p>
              <span>Click a case from the list on the left to view details</span>
            </div>
          </div>
        )}
      </div>

      <Modal open={noteModal} onClose={() => { setNoteModal(false); setNoteForm(emptyNote) }} title="Add Case Note">
        <form onSubmit={saveNote}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Agent ID</label>
                <input className="form-input" type="number" value={noteForm.agentId} onChange={set(setNoteForm)('agentId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Note Type</label>
                <select className="form-select" value={noteForm.noteType} onChange={set(setNoteForm)('noteType')}>
                  {['GENERAL', 'FOLLOWUP', 'ESCALATION', 'PAYMENT', 'LEGAL'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Loan Account ID</label>
              <input className="form-input" type="number" value={noteForm.loanAccountId} onChange={set(setNoteForm)('loanAccountId')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea className="form-textarea" rows={4} placeholder="Write your note here…" value={noteForm.note} onChange={set(setNoteForm)('note')} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setNoteModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Note'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={taskModal} onClose={() => { setTaskModal(false); setTaskForm(emptyTask) }} title="Create Task">
        <form onSubmit={saveTask}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Agent ID</label>
                <input className="form-input" type="number" value={taskForm.agentId} onChange={set(setTaskForm)('agentId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" value={taskForm.loanAccountId} onChange={set(setTaskForm)('loanAccountId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Task Type</label>
                <select className="form-select" value={taskForm.taskType} onChange={set(setTaskForm)('taskType')}>
                  {['CALL', 'VISIT', 'EMAIL', 'REVIEW', 'ESCALATE'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={taskForm.priority} onChange={set(setTaskForm)('priority')}>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={taskForm.dueDate} onChange={set(setTaskForm)('dueDate')} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setTaskModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Task'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={caseModal} onClose={() => { setCaseModal(false); setCaseForm(emptyCase) }} title="Create Collection Case">
        <form onSubmit={saveCase}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Loan Account ID</label>
              <input className="form-input" type="number" value={caseForm.loanAccountId} onChange={e => setCaseForm(f => ({ ...f, loanAccountId: e.target.value }))} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Case Type</label>
                <select className="form-select" value={caseForm.caseType} onChange={e => setCaseForm(f => ({ ...f, caseType: e.target.value }))}>
                  {CASE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={caseForm.priority} onChange={e => setCaseForm(f => ({ ...f, priority: e.target.value }))}>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setCaseModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Case'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={ptpModal} onClose={() => { setPtpModal(false); setPtpForm(emptyPtp) }} title="Log Promise to Pay">
        <form onSubmit={savePtp}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Loan Account ID</label>
              <input className="form-input" type="number" value={ptpForm.loanAccountId} onChange={set(setPtpForm)('loanAccountId')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Promised Amount (₹)</label>
              <input className="form-input" type="number" step="0.01" min="0" placeholder="e.g. 10000" value={ptpForm.amount} onChange={set(setPtpForm)('amount')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Promise Date</label>
              <input className="form-input" type="date" value={ptpForm.promisedDate} onChange={set(setPtpForm)('promisedDate')} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setPtpModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create PTP'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
