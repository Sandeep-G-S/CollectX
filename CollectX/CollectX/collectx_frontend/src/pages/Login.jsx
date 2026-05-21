import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

const ROLES = ['ADMIN', 'SUPERVISOR', 'AGENT', 'FIELD', 'RECOVERY', 'COMPLIANCE']

const FeatureIcon = ({ path, path2 }) => (
  <div className="login-feature-icon">
    <svg viewBox="0 0 24 24">
      <path d={path} />
      {path2 && <path d={path2} />}
    </svg>
  </div>
)

const features = [
  {
    path:  'M18 20V10M12 20V4M6 20v-6',
    title: 'Live Portfolio Tracking',
    desc:  'DPD buckets, risk scores and outstanding balances updated in real time',
  },
  {
    path:  'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    title: 'Smart Strategy Routing',
    desc:  'Rule-based engine assigns accounts to agents automatically',
  },
  {
    path:  'M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7z',
    path2: 'M2 11h20',
    title: 'PTP & Payment Management',
    desc:  'Track promises, record collections and manage OTS requests',
  },
  {
    path:  'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    title: 'Omnichannel Dunning',
    desc:  'Call, SMS, email and field visits tracked in a single workflow',
  },
]

export default function Login() {
  const [mode, setMode]     = useState('login')
  const [form, setForm]     = useState({ email: '', password: '', name: '', role: 'AGENT' })
  const [loading, setLoading] = useState(false)
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const toast       = useToast()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleLogin = async e => {
    e.preventDefault()
    if (!form.email || !form.password) return toast('Please fill in all fields', 'warning')
    setLoading(true)
    try {
      const res = await client.post('/auth/login', { email: form.email, password: form.password })
      login(res.data.token)
      toast('Welcome back!', 'success')
      navigate('/')
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid credentials', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async e => {
    e.preventDefault()
    if (!form.email || !form.password || !form.name) return toast('Please fill all fields', 'warning')
    if (form.password.length < 8) return toast('Password must be at least 8 characters', 'warning')
    setLoading(true)
    try {
      await client.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
      toast('Account created — please sign in', 'success')
      setMode('login')
    } catch (err) {
      toast(err.response?.data?.message || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-left">
          <div>
            <div className="login-logo-wrap">
              <div className="login-logo-box">CX</div>
              <div>
                <div className="login-app-name">CollectX</div>
                <div className="login-app-tag">Enterprise Collections Platform</div>
              </div>
            </div>
            <div className="login-headline">
              Collections that<br /><span>work smarter.</span>
            </div>
            <div className="login-tagline">
              A unified platform for loan collections, field recovery, legal actions
              and performance analytics — built for teams that move fast.
            </div>

            <div className="login-feature-list">
              {features.map(f => (
                <div key={f.title} className="login-feature">
                  <FeatureIcon path={f.path} path2={f.path2} />
                  <div className="login-feature-text">
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="login-bottom-badge">All systems operational</div>
        </div>

        <div className="login-right">
          <div className="login-form-box">

            {mode === 'login' ? (
              <>
                <div className="login-form-title">Sign in</div>
                <div className="login-form-sub">Enter your credentials to continue</div>

                <form onSubmit={handleLogin}>
                  <div className="login-field">
                    <label className="login-label">Email address</label>
                    <input
                      className="login-input"
                      type="email"
                      placeholder="you@collectx.in"
                      value={form.email}
                      onChange={set('email')}
                      autoFocus
                    />
                  </div>
                  <div className="login-field">
                    <label className="login-label">Password</label>
                    <input
                      className="login-input"
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={set('password')}
                    />
                  </div>
                  <button className="login-submit" type="submit" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign in →'}
                  </button>
                </form>
                <div className="login-divider">
                  No account? <a onClick={() => setMode('register')}>Register one</a>
                </div>
              </>
            ) : (
              <>
                <div className="login-form-title">Create account</div>
                <div className="login-form-sub">Register a new user in the system</div>

                <form onSubmit={handleRegister}>
                  <div className="login-field">
                    <label className="login-label">Role</label>
                    <select className="login-select" value={form.role} onChange={set('role')}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div style={{ fontSize: 11, color: '#3d5870', marginTop: 4 }}>
                      Your role access is confirmed by an administrator after registration.
                    </div>
                  </div>
                  <div className="login-field">
                    <label className="login-label">Full name</label>
                    <input className="login-input" placeholder="Riya Sharma" value={form.name} onChange={set('name')} />
                  </div>
                  <div className="login-field">
                    <label className="login-label">Email</label>
                    <input className="login-input" type="email" placeholder="riya@collectx.in" value={form.email} onChange={set('email')} />
                  </div>
                  <div className="login-field">
                    <label className="login-label">Password <span style={{ color: '#3d5870', fontWeight: 400, fontSize: 10 }}>(min. 8 characters)</span></label>
                    <input className="login-input" type="password" placeholder="••••••••" minLength={8} value={form.password} onChange={set('password')} />
                  </div>
                  <button className="login-submit" type="submit" disabled={loading}>
                    {loading ? 'Creating…' : 'Create account →'}
                  </button>
                </form>
                <div className="login-divider">
                  Already have one? <a onClick={() => setMode('login')}>Sign in</a>
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
