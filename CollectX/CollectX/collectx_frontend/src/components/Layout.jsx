import { useState, useEffect } from 'react'
import { NavLink, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Dashboard from '../pages/Dashboard'
import Portfolio from '../pages/Portfolio'
import Strategy from '../pages/Strategy'
import Dunning from '../pages/Dunning'
import AgentWorkbench from '../pages/AgentWorkbench'
import Payments from '../pages/Payments'
import FieldCollections from '../pages/FieldCollections'
import Legal from '../pages/Legal'
import Reporting from '../pages/Reporting'
import Notifications from '../pages/Notifications'
import Customers from '../pages/Customers'

// ── SVG Icon Components ─────────────────────────────────────────────────────
const Icon = ({ d, d2 }) => (
  <svg viewBox="0 0 24 24">
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
)

const icons = {
  dashboard:     <Icon d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" d2="M9 21V12h6v9" />,
  customers:     <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" d2="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z" />,
  portfolio:     <Icon d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" d2="M3 7l9 6 9-6" />,
  strategy:      <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  dunning:       <Icon d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />,
  workbench:     <Icon d="M2 17h20v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z" d2="M6 17V7a2 2 0 012-2h8a2 2 0 012 2v10M12 12a2 2 0 100-4 2 2 0 000 4z" />,
  payments:      <Icon d="M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" d2="M2 11h20" />,
  field:         <Icon d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" d2="M12 13a3 3 0 100-6 3 3 0 000 6z" />,
  legal:         <Icon d="M12 3v3M12 21v-3M3 12h3M21 12h-3M5.6 5.6l2.1 2.1M18.4 18.4l-2.1-2.1M5.6 18.4l2.1-2.1M18.4 5.6l-2.1 2.1" d2="M8 12a4 4 0 108 0 4 4 0 00-8 0z" />,
  reporting:     <Icon d="M18 20V10M12 20V4M6 20v-6" />,
  notifications: <Icon d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />,
}

const NavIcon = ({ name }) => (
  <span className="nav-icon">{icons[name]}</span>
)

const LockChip = () => (
  <span style={{
    marginLeft: 'auto',
    display: 'inline-flex', alignItems: 'center', gap: 3,
    background: 'rgba(220,38,38,.1)', color: '#f87171',
    borderRadius: 4, padding: '1.5px 5px', fontSize: 9, fontWeight: 700,
    flexShrink: 0, letterSpacing: .4,
  }}>
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
    LOCKED
  </span>
)

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/',          label: 'Dashboard',        icon: 'dashboard'  },
      { to: '/customers', label: 'Customers',         icon: 'customers'  },
    ]
  },
  {
    label: 'Collections',
    items: [
      { to: '/portfolio',  label: 'Portfolio',          icon: 'portfolio'  },
      { to: '/strategy',   label: 'Strategy & Queues',  icon: 'strategy',   lockedFor: ['FIELD','RECOVERY','COMPLIANCE'] },
      { to: '/dunning',    label: 'Dunning',             icon: 'dunning',    lockedFor: ['FIELD', 'RECOVERY'] },
      { to: '/workbench',  label: 'Agent Workbench',     icon: 'workbench',  lockedFor: ['COMPLIANCE', 'FIELD', 'RECOVERY'] },
      { to: '/payments',   label: 'Payments & PTP',      icon: 'payments'   },
    ]
  },
  {
    label: 'Recovery',
    items: [
      { to: '/field', label: 'Field Collections', icon: 'field'  },
      { to: '/legal', label: 'Legal & Write-Off',  icon: 'legal'  },
    ]
  },
  {
    label: 'Insights',
    items: [
      { to: '/reporting',     label: 'Reporting',     icon: 'reporting',     lockedFor: ['AGENT'] },
      { to: '/notifications', label: 'Notifications', icon: 'notifications' },
    ]
  },
]

const pageTitles = {
  '/':              'Dashboard',
  '/portfolio':     'Portfolio & Loans',
  '/strategy':      'Strategy & Queues',
  '/dunning':       'Dunning & Contact',
  '/workbench':     'Agent Workbench',
  '/payments':      'Payments & PTP',
  '/field':         'Field Collections',
  '/legal':         'Legal & Write-Off',
  '/reporting':     'Reporting',
  '/notifications': 'Notifications',
  '/customers':     'Customer Management',
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="navbar-time">
      {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      {' · '}
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </span>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [logoutModal, setLogoutModal] = useState(false)

  const title   = pageTitles[location.pathname] || 'CollectX'
  const initial = user?.email?.[0]?.toUpperCase() || 'U'
  const name    = user?.email?.split('@')[0] || 'User'

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="shell">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">CX</div>
            <div>
              <div className="logo-text">CollectX</div>
              <div className="logo-sub">v2.0 · Collections Suite</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {navSections.map(sec => (
          <div key={sec.label} className="sidebar-section">
            <div className="sidebar-label">{sec.label}</div>
            {sec.items.map(item => {
              const isLocked = item.lockedFor?.includes(user?.role)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}${isLocked ? ' nav-item-locked' : ''}`}
                  style={isLocked ? { opacity: 0.5 } : undefined}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                  {isLocked && <LockChip />}
                </NavLink>
              )
            })}
          </div>
        ))}

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
            <button className="logout-btn" onClick={() => setLogoutModal(true)} title="Log out">
              <svg viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <div className="main-area">

        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-breadcrumb">
            <span className="navbar-app-name">CollectX</span>
            <span className="navbar-sep">/</span>
            <span className="navbar-title">{title}</span>
          </div>
          <div className="navbar-actions">
            <LiveClock />
            <span className="badge badge-blue">{user?.role}</span>
          </div>
        </nav>

        {/* Page content */}
        <div className="page-content">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/portfolio"     element={<Portfolio />} />
            <Route path="/strategy"      element={<Strategy />} />
            <Route path="/dunning"       element={<Dunning />} />
            <Route path="/workbench"     element={<AgentWorkbench />} />
            <Route path="/payments"      element={<Payments />} />
            <Route path="/field"         element={<FieldCollections />} />
            <Route path="/legal"         element={<Legal />} />
            <Route path="/reporting"     element={<Reporting />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/customers"     element={<Customers />} />
          </Routes>
        </div>
      </div>

      {/* ── LOGOUT MODAL ─────────────────────────────────────────────── */}
      {logoutModal && (
        <div className="modal-overlay" onClick={() => setLogoutModal(false)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Logout</span>
              <button className="modal-close" onClick={() => setLogoutModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: 28, paddingBottom: 6 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--danger-bg)', border: '2px solid rgba(220,38,38,.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, letterSpacing: '-.3px' }}>Log out of CollectX?</p>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
                Your session will end and you'll be redirected to the login page.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setLogoutModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
