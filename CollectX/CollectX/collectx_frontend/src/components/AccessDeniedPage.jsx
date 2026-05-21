export default function AccessDeniedPage({ module = 'this module', role = '' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 420, width: '100%'
    }}>
      <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 460 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(239,68,68,0.07)', border: '2px solid rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
            stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div style={{
          fontSize: 22, fontWeight: 800, marginBottom: 10,
          color: 'var(--text)', letterSpacing: '-0.4px'
        }}>
          Access Restricted
        </div>

        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, maxWidth: 360, margin: '0 auto' }}>
          {role && (
            <span>
              Your current role <strong style={{ color: 'var(--text)' }}>({role})</strong> does not have
              permission to access{' '}
            </span>
          )}
          {!role && 'You do not have permission to access '}
          <strong>{module}</strong>.
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>
          Contact your Administrator or Supervisor to request access.
        </div>

        <div style={{
          marginTop: 28, padding: '10px 18px',
          background: 'rgba(99,102,241,0.05)', borderRadius: 8,
          fontSize: 12, color: 'var(--text-3)',
          border: '1px solid rgba(99,102,241,0.10)',
          display: 'inline-block',
        }}>
          🛡️ Access attempts are logged for security purposes
        </div>
      </div>
    </div>
  )
}
