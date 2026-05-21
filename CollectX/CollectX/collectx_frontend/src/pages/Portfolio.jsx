import { useState, useEffect } from 'react'
import client from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AccessDeniedModal from '../components/AccessDeniedModal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

const empty = { customerId: '', product: 'HOME_LOAN', principalOS: '', interestOS: '', lastPaymentDate: '', region: '' }

export default function Portfolio() {
  const [loans, setLoans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ bucket: '', status: '', searchBy: 'loanId', searchValue: '' })
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(empty)
  const [saving, setSaving]   = useState(false)
  const [selected, setSelected] = useState(null)
  const [accessModal, setAccessModal] = useState(false)
  const toast = useToast()
  const { user } = useAuth()
  const canCreate = ['ADMIN', 'SUPERVISOR'].includes(user?.role)

  const load = () => {
    setLoading(true)
    client.get('/portfolio/loans').then(r => setLoans(r.data || [])).catch(() => toast('Failed to load loans', 'error')).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async e => {
    e.preventDefault()
    if (Number(form.principalOS) < 0 || Number(form.interestOS) < 0) {
      toast('Principal and Interest amounts cannot be negative', 'warning')
      return
    }
    setSaving(true)
    try {
      await client.post('/portfolio/loan', {
        customerId: Number(form.customerId),
        product: form.product,
        principalOS: Number(form.principalOS),
        interestOS: Number(form.interestOS),
        lastPaymentDate: form.lastPaymentDate,
        region: form.region,
      })
      toast('Loan created & assigned to strategy', 'success')
      setModal(false)
      setForm(empty)
      load()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create loan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filtered = loans.filter(l => {
    if (filter.bucket && l.bucket !== filter.bucket) return false
    if (filter.status && l.status?.toLowerCase() !== filter.status.toLowerCase()) return false
    if (filter.searchValue.trim()) {
      const val = filter.searchValue.trim()
      if (filter.searchBy === 'loanId') {
        if (String(l.loanAccountId) !== val) return false
      } else {
        if (String(l.customerId) !== val) return false
      }
    }
    return true
  })

  const products = ['HOME_LOAN', 'CAR_LOAN', 'PERSONAL_LOAN', 'BUSINESS_LOAN', 'GOLD_LOAN']
  const buckets  = ['0-30', '31-60', '61-90', '90+']
  const statuses = ['Current', 'Delinquent', 'NPA', 'CLOSED', 'ACTIVE']

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Loan Portfolio</div>
          <div className="page-subtitle">Track outstanding balances, DPD and bucket classification</div>
        </div>
        <div className="page-actions">
          {canCreate ? (
            <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Loan</button>
          ) : (
            <button className="btn-locked" onClick={() => setAccessModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              + Add Loan
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {buckets.map(b => {
          const cnt = loans.filter(l => l.bucket === b).length
          const colors = { '0-30': '#10b981', '31-60': '#f59e0b', '61-90': '#f97316', '90+': '#ef4444' }
          return (
            <div key={b} className="stat-card"
              style={{ cursor: 'pointer', borderLeft: `4px solid ${colors[b]}` }}
              onClick={() => setFilter(f => ({ ...f, bucket: f.bucket === b ? '' : b }))}>
              <div className="stat-label">Bucket {b}</div>
              <div className="stat-value">{cnt}</div>
              <div className="stat-sub">loans</div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '12px 16px' }}>
          <div className="filter-bar">
            <select
              className="form-select"
              style={{ width: 150, flexShrink: 0 }}
              value={filter.searchBy}
              onChange={e => setFilter(f => ({ ...f, searchBy: e.target.value, searchValue: '' }))}
            >
              <option value="loanId">Loan ID</option>
              <option value="customerId">Customer ID</option>
            </select>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder={filter.searchBy === 'loanId' ? 'Enter Loan ID…' : 'Enter Customer ID…'}
              type="number"
              min="1"
              step="1"
              value={filter.searchValue}
              onKeyDown={e => {
                if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault()
              }}
              onChange={e => {
                const clean = e.target.value.replace(/\D/g, '')
                setFilter(f => ({ ...f, searchValue: clean }))
              }}
            />
            <select className="form-select" value={filter.bucket} onChange={e => setFilter(f => ({ ...f, bucket: e.target.value }))}>
              <option value="">All Buckets</option>
              {buckets.map(b => <option key={b}>{b}</option>)}
            </select>
            <select className="form-select" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            {(filter.bucket || filter.status || filter.searchValue) && (
              <button className="btn btn-outline btn-sm" onClick={() => setFilter({ bucket: '', status: '', searchBy: filter.searchBy, searchValue: '' })}>Clear</button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Loan Accounts ({filtered.length})</span>
        </div>
        {loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Loan ID</th><th>Customer</th><th>Product</th>
                  <th>Principal OS</th><th>Interest OS</th>
                  <th>DPD</th><th>Bucket</th><th>Region</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.loanAccountId} onClick={() => setSelected(l)} style={{ cursor: 'pointer' }}>
                    <td className="td-primary td-mono">#L{l.loanAccountId}</td>
                    <td>{l.customerId}</td>
                    <td>{l.product}</td>
                    <td>₹{(l.principalOS || 0).toLocaleString()}</td>
                    <td>₹{(l.interestOS || 0).toLocaleString()}</td>
                    <td className={`td-primary ${l.dpd > 90 ? 'text-red' : ''}`} style={{ color: l.dpd > 90 ? '#ef4444' : l.dpd > 30 ? '#f59e0b' : '#10b981' }}>
                      {l.dpd}d
                    </td>
                    <td><Badge value={l.bucket} /></td>
                    <td>{l.region}</td>
                    <td><Badge value={l.status} /></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9}><div className="empty-state"><p>No loans found</p><span>Adjust filters or create a new loan</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setForm(empty) }} title="Create New Loan">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: 12 }}>
              <div style={{
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: 6, padding: '8px 12px', fontSize: 12, color: 'var(--text-2)'
              }}>
                🔢 <strong>Loan Account ID</strong> is auto-assigned by the system after creation.
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input className="form-input" type="number" placeholder="e.g. 500" value={form.customerId} onChange={set('customerId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Region</label>
                <input className="form-input" placeholder="e.g. NORTH" value={form.region} onChange={set('region')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Product</label>
              <select className="form-select" value={form.product} onChange={set('product')}>
                {products.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Principal Outstanding (₹)</label>
                <input className="form-input" type="number" step="0.01" min="0" placeholder="500000" value={form.principalOS} onChange={set('principalOS')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Interest Outstanding (₹)</label>
                <input className="form-input" type="number" step="0.01" min="0" placeholder="25000" value={form.interestOS} onChange={set('interestOS')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Last Payment Date</label>
              <input className="form-input" type="date" value={form.lastPaymentDate} onChange={set('lastPaymentDate')} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => { setModal(false); setForm(empty) }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Loan'}</button>
          </div>
        </form>
      </Modal>

      <AccessDeniedModal
        open={accessModal}
        onClose={() => setAccessModal(false)}
        feature="Create Loan"
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Loan #L${selected?.loanAccountId}`} size="modal-lg">
        {selected && (
          <>
            <div className="modal-body">
              <div className="form-grid-3">
                {[
                  ['Customer ID', selected.customerId],
                  ['Product', selected.product],
                  ['Region', selected.region],
                  ['Principal OS', `₹${(selected.principalOS || 0).toLocaleString()}`],
                  ['Interest OS', `₹${(selected.interestOS || 0).toLocaleString()}`],
                  ['Total OS', `₹${((selected.principalOS || 0) + (selected.interestOS || 0)).toLocaleString()}`],
                  ['DPD', `${selected.dpd} days`],
                  ['Bucket', <Badge value={selected.bucket} />],
                  ['Status', <Badge value={selected.status} />],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="form-label" style={{ marginBottom: 4 }}>{k}</div>
                    <div className="fw-600">{v}</div>
                  </div>
                ))}
              </div>
              <div className="section-sep" />
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Last payment: {selected.lastPaymentDate}</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
