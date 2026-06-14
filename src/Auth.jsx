// ---------------------------------------------------------------------------
// Auth.jsx — the Login and Signup screens (and the shared brand panel).
// Exported: <Login /> and <Signup />.
// ---------------------------------------------------------------------------
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, Coffee } from 'lucide-react'
import { useStore } from './store.jsx'
import { t, Button, Input, labelStyle, useWide } from './ui.jsx'

/* ---- Left-hand brand panel (only shown on wide screens) ---- */
function AuthHero() {
  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      overflow: 'hidden', background: t.brand600, padding: 48, color: t.white,
    }}>
      {/* Blurred brand image sitting behind the text */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/auth-bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(8px)', transform: 'scale(1.1)', opacity: 0.45,
      }} />
      {/* Brand-colour wash so the white text stays readable over the image */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${t.brand600}cc, ${t.brand600}99)`,
      }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'grid', placeItems: 'center', height: 44, width: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)' }}>
          <Coffee style={{ height: 24, width: 24 }} />
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, margin: 0 }}>BrewMatic</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>Point of Sale</p>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.15, margin: 0 }}>
          Where every sip<br />starts with a tap.
        </h1>
        <p style={{ maxWidth: 420, color: 'rgba(255,255,255,0.8)', marginTop: 24 }}>
          BrewMatic turns your café into a smart, seamless experience — lightning-fast orders,
          live kitchen sync, and rich insights that help you brew more profit every shift.
        </p>
      </div>

      <p style={{ position: 'relative', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Smart POS for modern cafés</p>
    </div>
  )
}

/* ---- Shared shell: hero on the left (wide screens) + form on the right ---- */
function AuthShell({ wide, children }) {
  return (
    <div style={{ display: 'grid', minHeight: '100vh', gridTemplateColumns: wide ? '1fr 1fr' : '1fr' }}>
      {wide && <AuthHero />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.slate50, padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 384 }}>
          {!wide && (
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coffee style={{ height: 28, width: 28, color: t.brand500 }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: t.slate800 }}>BrewMatic POS</span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}

// Input with a leading icon — used for every auth field.
function IconInput({ icon: Icon, ...props }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon style={{ position: 'absolute', left: 12, top: 10, height: 16, width: 16, color: t.slate400, pointerEvents: 'none' }} />
      <Input style={{ paddingLeft: 36 }} {...props} />
    </div>
  )
}

const errorBox = { borderRadius: 8, background: t.rose50, padding: '8px 12px', fontSize: 14, color: t.rose600, margin: 0 }
const linkStyle = { fontWeight: 600, color: t.brand600, textDecoration: 'none' }

function useRedirectAfterAuth() {
  const { state } = useStore()
  const navigate = useNavigate()
  useEffect(() => {
    const u = state.users.find((x) => x.id === state.session.currentUserId)
    if (u) navigate(u.role === 'admin' ? '/admin' : '/pos', { replace: true })
  }, [state.session.currentUserId]) // eslint-disable-line
}

export function Login() {
  const { state, dispatch } = useStore()
  const wide = useWide()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  useRedirectAfterAuth()

  const submit = (e) => {
    e.preventDefault()
    dispatch({ type: 'LOGIN', email, password })
  }
  const quick = (em, pw) => {
    setEmail(em); setPassword(pw)
    dispatch({ type: 'LOGIN', email: em, password: pw })
  }

  return (
    <AuthShell wide={wide}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: t.slate800, margin: 0 }}>Welcome back</h2>
      <p style={{ marginTop: 4, fontSize: 14, color: t.slate500 }}>Sign in to open your POS session.</p>

      <form onSubmit={submit} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <IconInput icon={Mail} type="email" placeholder="you@cafe.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <IconInput icon={Lock} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {state.session.loginError && <p style={errorBox}>{state.session.loginError}</p>}

        <Button type="submit" style={{ width: '100%' }}>Sign in <ArrowRight style={{ height: 16, width: 16 }} /></Button>
      </form>

      <div style={{ marginTop: 24, borderRadius: 12, border: `1px solid ${t.slate200}`, background: t.white, padding: 16 }}>
        <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.slate400 }}>Demo accounts — one tap</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Button variant="outline" size="sm" onClick={() => quick('admin@cafe.com', 'admin')}>👑 Admin</Button>
          <Button variant="outline" size="sm" onClick={() => quick('priya@cafe.com', 'priya')}>☕ Cashier (Priya)</Button>
        </div>
      </div>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: t.slate500 }}>
        New here? <Link to="/signup" style={linkStyle}>Create an account</Link>
      </p>
    </AuthShell>
  )
}

export function Signup() {
  const { state, dispatch } = useStore()
  const wide = useWide()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  useRedirectAfterAuth()

  const submit = (e) => {
    e.preventDefault()
    dispatch({ type: 'SIGNUP', ...form })
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <AuthShell wide={wide}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: t.slate800, margin: 0 }}>Create your account</h2>
      <p style={{ marginTop: 4, fontSize: 14, color: t.slate500 }}>Sign up as an admin to configure your cafe.</p>

      <form onSubmit={submit} style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <IconInput icon={User} placeholder="Your name" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <IconInput icon={Mail} type="email" placeholder="you@cafe.com" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <IconInput icon={Lock} type="password" placeholder="Choose a password" value={form.password} onChange={set('password')} required />
        </div>

        {state.session.loginError && <p style={errorBox}>{state.session.loginError}</p>}

        <Button type="submit" style={{ width: '100%' }}>Create account <ArrowRight style={{ height: 16, width: 16 }} /></Button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: t.slate500 }}>
        Already have an account? <Link to="/login" style={linkStyle}>Sign in</Link>
      </p>
    </AuthShell>
  )
}
