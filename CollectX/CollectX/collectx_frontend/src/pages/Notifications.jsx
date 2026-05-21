import { useState, useEffect } from 'react'
import client from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import AccessDeniedModal from '../components/AccessDeniedModal'

const emptyForm = { customerId: '', loanAccountId: '', channel: 'SMS', message: '', notificationType: 'REMINDER' }

const typeIcon = {
  REMINDER: '🔔', ALERT: '⚠️', PAYMENT: '💳', LEGAL: '⚖️', GENERAL: '📢', PTP: '🤝', SYSTEM: '🖥️'
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modal,         setModal]         = useState(false)
  const [form,          setForm]          = useState(emptyForm)
  const [saving,        setSaving]        = useState(false)
  const [filter,        setFilter]        = useState({ status: '', channel: '' })
  const [markingId,     setMarkingId]     = useState(null)
  const toast  = useToast()
  const { user } = useAuth()

  const canSend = ['ADMIN', 'SUPERVISOR'].includes(user?.role)
  const [accessModal, setAccessModal] = useState(false)

  const load = () => {
    setLoading(true)
    client.get('/notify/all')
      .then(r => setNotifications(r.data || []))
      .catch(() => toast('Could not load notifications', 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSend = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await client.post('/notify/create', {
        customerId: Number(form.customerId),
        loanAccountId: Number(form.loanAccountId),
        channel: form.channel,
        message: form.message,
        notificationType: form.notificationType,
      })
      toast('Notification sent', 'success')
      setModal(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send notification', 'error')
    } finally { setSaving(false) }
  }

  const markRead = async (id) => {
    setMarkingId(id)
    try {
      await client.put(`/notify/${id}/read`)
      setNotifications(ns => ns.map(n => n.notificationId === id ? { ...n, status: 'READ' } : n))
    } catch {
      toast('Failed to mark as read', 'error')
    } finally { setMarkingId(null) }
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => n.status === 'UNREAD').map(n => n.notificationId)
    if (!unread.length) return
    try {
      await Promise.allSettled(unread.map(id => client.put(`/notify/${id}/read`)))
      setNotifications(ns => ns.map(n => ({ ...n, status: 'READ' })))
      toast('All marked as read', 'success')
    } catch {
      toast('Some notifications could not be updated', 'warning')
    }
  }

  const filtered = notifications.filter(n => {
    if (filter.status  && n.status  !== filter.status)  return false
    if (filter.channel && n.channel !== filter.channel) return false
    return true
  })

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 10, background: '#ef4444', color: '#fff',
                borderRadius: 12, padding: '2px 8px', fontSize: 13, fontWeight: 700,
              }}>{unreadCount}</span>
            )}
          </div>
          <div className="page-subtitle">Customer communication log and notification centre</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button className="btn btn-outline" onClick={markAllRead}>✓ Mark all read</button>
          )}
          {canSend
            ? <button className="btn btn-primary" onClick={() => setModal(true)}>+ Send Notification</button>
            : <button className="btn-locked" onClick={() => setAccessModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, stroke: 'currentColor' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Send Notification
              </button>
          }
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{notifications.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-label">Unread</div>
          <div className="stat-value">{unreadCount}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">SMS</div>
          <div className="stat-value">{notifications.filter(n => n.channel === 'SMS').length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="stat-label">Email</div>
          <div className="stat-value">{notifications.filter(n => n.channel === 'EMAIL').length}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '10px 16px' }}>
          <div className="filter-bar">
            <select className="form-select" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {['UNREAD', 'READ', 'DISMISSED'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="form-select" value={filter.channel} onChange={e => setFilter(f => ({ ...f, channel: e.target.value }))}>
              <option value="">All Channels</option>
              {['SMS', 'EMAIL', 'PUSH', 'INAPP'].map(c => <option key={c}>{c}</option>)}
            </select>
            {(filter.status || filter.channel) && (
              <button className="btn btn-outline btn-sm" onClick={() => setFilter({ status: '', channel: '' })}>Clear</button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader-wrap"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: 48 }}>
            <p>No notifications</p>
            <span>Send a notification using the button above</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(n => (
            <div
              key={n.notificationId}
              className="card"
              style={{
                borderLeft: n.status === 'UNREAD' ? '4px solid #6366f1' : '4px solid transparent',
                background: n.status === 'UNREAD' ? 'rgba(99,102,241,0.04)' : 'var(--surface)',
                transition: 'background 0.2s',
              }}
            >
              <div className="card-body" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                    <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>
                      {typeIcon[n.notificationType] || '📢'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                        <Badge value={n.notificationType || 'GENERAL'} />
                        <Badge value={n.channel} />
                        <Badge value={n.status} />
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          Loan #L{n.loanAccountId} · Customer {n.customerId}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
                        {n.message || '—'}
                      </p>
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
                        {n.sentAt ? new Date(n.sentAt).toLocaleString() : n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}
                      </div>
                    </div>
                  </div>
                  {n.status === 'UNREAD' && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                      onClick={() => markRead(n.notificationId)}
                      disabled={markingId === n.notificationId}
                    >
                      {markingId === n.notificationId ? '…' : 'Mark read'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccessDeniedModal
        open={accessModal}
        onClose={() => setAccessModal(false)}
        feature="Send Notification (ADMIN or SUPERVISOR only)"
      />

      <Modal open={modal} onClose={() => { setModal(false); setForm(emptyForm) }} title="Send Notification">
        <form onSubmit={handleSend}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Customer ID <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-3)' }}>(from Customer module)</span></label>
                <input className="form-input" type="number" placeholder="e.g. 500" min="1" value={form.customerId} onChange={set('customerId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Loan Account ID</label>
                <input className="form-input" type="number" placeholder="e.g. 1001" value={form.loanAccountId} onChange={set('loanAccountId')} required />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Channel</label>
                <select className="form-select" value={form.channel} onChange={set('channel')}>
                  {['SMS', 'EMAIL', 'PUSH', 'INAPP'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.notificationType} onChange={set('notificationType')}>
                  {['REMINDER', 'ALERT', 'PAYMENT', 'LEGAL', 'GENERAL', 'PTP', 'SYSTEM'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" rows={4} placeholder="Enter notification message…" value={form.message} onChange={set('message')} required />
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>
                {form.message.length} / 500
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Sending…' : 'Send'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
