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

const emptyForm = {
  customerId: '', name: '', email: '', phone: '',
  address: '', city: '', state: '', pinCode: '',
  dateOfBirth: '', status: 'ACTIVE',
  consentSms: true, consentEmail: true, consentCall: true,
}

export default function Customers() {
  const [customers,   setCustomers]  = useState([])
  const [loading,     setLoading]    = useState(true)
  const [search,      setSearch]     = useState('')
  const [searchBy,    setSearchBy]   = useState('all')
  const [createModal, setCreateModal]= useState(false)
  const [detailModal, setDetailModal]= useState(false)
  const [editModal,   setEditModal]  = useState(false)
  const [selected,    setSelected]   = useState(null)
  const [form,        setForm]       = useState(emptyForm)
  const [editForm,    setEditForm]   = useState(emptyForm)
  const [saving,      setSaving]     = useState(false)
  const [loans,       setLoans]      = useState([])
  const [loansLoad,   setLoansLoad]  = useState(false)
  const [accessModal, setAccessModal]= useState({ open: false, feature: '' })
  const toast = useToast()
  const { user } = useAuth()

  const canCreate = ['ADMIN', 'SUPERVISOR'].includes(user?.role)
  const canEdit   = ['ADMIN', 'SUPERVISOR'].includes(user?.role)

  const showAccessDenied = (feature) => setAccessModal({ open: true, feature })

  const load = () => {
    setLoading(true)
    client.get('/customer/all')
      .then(r => setCustomers(r.data || []))
      .catch(() => toast('Could not load customers', 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const set    = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setEd  = k => e => setEditForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleCreate = async e => {
    e.preventDefault(); setSaving(true)
    if (form.phone.replace(/\D/g, '').length < 10) {
      toast('Phone number must be at least 10 digits', 'warning'); setSaving(false); return
    }
    try {
      await client.post('/customer/create', {
        name: form.name, email: form.email, phone: form.phone,
        address: form.address, city: form.city, state: form.state, pinCode: form.pinCode,
        dateOfBirth: form.dateOfBirth || null,
        status: form.status,
        consentSms: form.consentSms, consentEmail: form.consentEmail, consentCall: form.consentCall,
      })
      toast('Customer created', 'success')
      setCreateModal(false); setForm(emptyForm); load()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create customer', 'error')
    } finally { setSaving(false) }
  }

  const handleEdit = async e => {
    e.preventDefault(); setSaving(true)
    if (editForm.phone.replace(/\D/g, '').length < 10) {
      toast('Phone number must be at least 10 digits', 'warning'); setSaving(false); return
    }
    try {
      await client.put(`/customer/${selected.customerId}`, {
        name: editForm.name, email: editForm.email, phone: editForm.phone,
        address: editForm.address, city: editForm.city, state: editForm.state, pinCode: editForm.pinCode,
        dateOfBirth: editForm.dateOfBirth || null,
        status: editForm.status,
      })
      await client.put(`/customer/${selected.customerId}/consent`, {
        consentSms: editForm.consentSms,
        consentEmail: editForm.consentEmail,
        consentCall: editForm.consentCall,
      })
      toast('Customer updated', 'success')
      setEditModal(false); load()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update customer', 'error')
    } finally { setSaving(false) }
  }

  const openDetail = async (c) => {
    setSelected(c); setDetailModal(true); setLoans([])
    setLoansLoad(true)
    client.get(`/portfolio/loan?customerId=${c.customerId}`)
      .then(r => setLoans(r.data || []))
      .catch(() => {})
      .finally(() => setLoansLoad(false))
  }

  const openEdit = (c) => {
    setSelected(c)
    setEditForm({
      name: c.name || '', email: c.email || '', phone: c.phone || '',
      address: c.address || '', city: c.city || '', state: c.state || '', pinCode: c.pinCode || '',
      dateOfBirth: c.dateOfBirth || '', status: c.status || 'ACTIVE',
      consentSms: c.consentSms ?? true, consentEmail: c.consentEmail ?? true, consentCall: c.consentCall ?? true,
    })
    setEditModal(true)
  }

  const filtered = customers.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    switch (searchBy) {
      case 'name':  return c.name?.toLowerCase().includes(s)
      case 'email': return c.email?.toLowerCase().includes(s)
      case 'phone': return c.phone?.includes(search)
      case 'id':    return String(c.customerId).includes(search)
      default:
        return (
          c.name?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s) ||
          c.phone?.includes(search) ||
          String(c.customerId).includes(search)
        )
    }
  })

  const active      = customers.filter(c => c.status === 'ACTIVE').length
  const blacklisted = customers.filter(c => c.status === 'BLACKLISTED').length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Customer Management</div>
          <div className="page-subtitle">Manage borrower profiles, consent preferences and loan linkage</div>
        </div>
        {canCreate ? (
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}>+ New Customer</button>
        ) : (
          <button className="btn-locked" onClick={() => showAccessDenied('New Customer (ADMIN or SUPERVISOR only)')}>
            <LockSVG />
            + New Customer
          </button>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{customers.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">Active</div>
          <div className="stat-value">{active}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-label">Blacklisted</div>
          <div className="stat-value">{blacklisted}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-label">Inactive</div>
          <div className="stat-value">{customers.length - active - blacklisted}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Customers ({filtered.length})</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="form-select"
              value={searchBy}
              onChange={e => { setSearchBy(e.target.value); setSearch('') }}
              style={{ width: 120, fontSize: 13 }}
            >
              <option value="all">All Fields</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="id">Customer ID</option>
            </select>
            <input
              className="form-input"
              placeholder={
                searchBy === 'name'  ? 'Search by name…'        :
                searchBy === 'email' ? 'Search by email…'       :
                searchBy === 'phone' ? 'Search by phone…'       :
                searchBy === 'id'    ? 'Search by customer ID…' :
                'Search name, email, phone, ID…'
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 220, fontSize: 13 }}
            />
            {search && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')} title="Clear">✕</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
          </div>
        </div>

        {loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Phone</th><th>Email</th>
                  <th>City</th><th>Consent</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.customerId}>
                    <td className="td-mono">{c.customerId}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phone}</td>
                    <td className="text-muted" style={{ fontSize: 13 }}>{c.email || '—'}</td>
                    <td>{c.city || '—'}{c.state ? `, ${c.state}` : ''}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {c.consentSms   && <span title="SMS"   style={consentDot('#10b981')}>S</span>}
                        {c.consentEmail && <span title="Email" style={consentDot('#6366f1')}>E</span>}
                        {c.consentCall  && <span title="Call"  style={consentDot('#f59e0b')}>C</span>}
                        {!c.consentSms && !c.consentEmail && !c.consentCall && (
                          <span style={{ fontSize: 11, color: '#ef4444' }}>Opted out</span>
                        )}
                      </div>
                    </td>
                    <td><Badge value={c.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openDetail(c)}>View</button>
                        {canEdit ? (
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        ) : (
                          <button className="btn-locked btn-sm" style={{ fontSize: 12, padding: '3px 10px' }}
                            onClick={() => showAccessDenied('Edit Customer (ADMIN or SUPERVISOR only)')}>
                            <LockSVG />
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <p>{search ? 'No customers match your search' : 'No customers yet'}</p>
                      <span>Create a customer using the button above</span>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={detailModal} onClose={() => { setDetailModal(false); setSelected(null) }} title="Customer Profile" size="modal-lg">
        {selected && (
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0,
                  }}>{selected.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>ID: {selected.customerId}</div>
                  </div>
                  <Badge value={selected.status} />
                </div>
                <InfoRow label="Email"    value={selected.email} />
                <InfoRow label="Phone"    value={selected.phone} />
                <InfoRow label="DOB"      value={selected.dateOfBirth} />
                <InfoRow label="Address"  value={[selected.address, selected.city, selected.state, selected.pinCode].filter(Boolean).join(', ')} />
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Communication Consent</div>
                <ConsentBadge label="SMS"   active={selected.consentSms} />
                <ConsentBadge label="Email" active={selected.consentEmail} />
                <ConsentBadge label="Call"  active={selected.consentCall} />

                <div style={{ fontWeight: 600, marginTop: 20, marginBottom: 10, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Linked Loans</div>
                {loansLoad ? <div className="spinner" style={{ margin: '8px 0' }} /> : loans.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>No loans found for this customer</div>
                ) : (
                  loans.map(l => (
                    <div key={l.loanAccountId} style={{
                      padding: '8px 12px', background: 'var(--surface)', borderRadius: 6,
                      border: '1px solid var(--border)', marginBottom: 6,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>#L{l.loanAccountId}</span>
                        <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>{l.product}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Badge value={l.bucket} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>₹{Number(l.principalOS || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        <div className="modal-footer">
          {canEdit ? (
            <button className="btn btn-outline" onClick={() => { setDetailModal(false); selected && openEdit(selected) }}>Edit Profile</button>
          ) : (
            <button className="btn-locked" onClick={() => showAccessDenied('Edit Customer Profile (ADMIN or SUPERVISOR only)')}>
              <LockSVG />
              Edit Profile
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setDetailModal(false)}>Close</button>
        </div>
      </Modal>

      <Modal open={createModal} onClose={() => { setCreateModal(false); setForm(emptyForm) }} title="New Customer">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="e.g. Rahul Sharma" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Phone <span style={{ color: 'var(--danger)', fontSize: 11 }}>*min 10 digits</span></label>
                <input
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={set('phone')}
                  inputMode="numeric"
                  pattern="[0-9]{10,}"
                  title="Enter at least 10 digit phone number"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="rahul@example.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="Street address" value={form.address} onChange={set('address')} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="e.g. Mumbai" value={form.city} onChange={set('city')} required />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" placeholder="e.g. Maharashtra" value={form.state} onChange={set('state')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input className="form-input" placeholder="e.g. 400001" value={form.pinCode} onChange={set('pinCode')} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} required />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Communication Consent</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {[['consentSms','SMS'],['consentEmail','Email'],['consentCall','Call']].map(([k, label]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[k]} onChange={set(k)} style={{ width: 16, height: 16 }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Customer'}</button>
          </div>
        </form>
      </Modal>

      <AccessDeniedModal
        open={accessModal.open}
        onClose={() => setAccessModal({ open: false, feature: '' })}
        feature={accessModal.feature}
      />

      <Modal open={editModal} onClose={() => setEditModal(false)} title={`Edit — ${selected?.name}`}>
        <form onSubmit={handleEdit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editForm.name} onChange={setEd('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={editForm.phone} onChange={setEd('phone')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={editForm.email} onChange={setEd('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={editForm.address} onChange={setEd('address')} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={editForm.city} onChange={setEd('city')} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" value={editForm.state} onChange={setEd('state')} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input className="form-input" value={editForm.pinCode} onChange={setEd('pinCode')} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date" value={editForm.dateOfBirth} onChange={setEd('dateOfBirth')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editForm.status} onChange={setEd('status')}>
                {['ACTIVE', 'INACTIVE', 'BLACKLISTED'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Communication Consent</label>
              <div style={{ display: 'flex', gap: 20 }}>
                {[['consentSms','SMS'],['consentEmail','Email'],['consentCall','Call']].map(([k, label]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input type="checkbox" checked={editForm[k]} onChange={setEd(k)} style={{ width: 16, height: 16 }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: 'var(--muted)', minWidth: 60 }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

function ConsentBadge({ label, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 12px', borderRadius: 6, marginBottom: 6,
      background: active ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
    }}>
      <span style={{ fontSize: 14 }}>{active ? '✓' : '✗'}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 12, color: active ? '#10b981' : '#ef4444', marginLeft: 'auto' }}>
        {active ? 'Allowed' : 'Opted out'}
      </span>
    </div>
  )
}

function consentDot(color) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 20, height: 20, borderRadius: '50%',
    background: color, color: '#fff', fontSize: 10, fontWeight: 700,
  }
}
