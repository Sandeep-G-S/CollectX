export default function AccessDeniedModal({ open, onClose, feature = 'this feature' }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal access-denied-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Access Restricted</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body access-denied-body">
          <div className="access-denied-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="access-denied-title">You are not authorized</h3>
          <p className="access-denied-desc">
            You don't have permission to access <strong>{feature}</strong>.<br />
            Contact your Administrator or Supervisor to request access.
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}
