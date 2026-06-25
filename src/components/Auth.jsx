// Victory GamePlan V3 — Authentication screen
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [tab, setTab] = useState('signin') // 'signin' | 'signup'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Sign in
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')

  // Sign up
  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suConfirm, setSuConfirm] = useState('')

  const clearMessages = () => { setError(null); setMessage(null) }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearMessages()
    const { error } = await supabase.auth.signInWithPassword({ email: siEmail, password: siPassword })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    clearMessages()
    if (suPassword !== suConfirm) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPassword,
      options: { data: { full_name: suName } },
    })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email to confirm your account, then sign in.')
      setTab('signin')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    clearMessages()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleForgotPassword = async () => {
    if (!siEmail) { setError('Enter your email address above first.'); return }
    setLoading(true)
    clearMessages()
    const { error } = await supabase.auth.resetPasswordForEmail(siEmail, {
      redirectTo: `${window.location.origin}`,
    })
    if (error) setError(error.message)
    else setMessage('Password reset email sent. Check your inbox.')
    setLoading(false)
  }

  return (
    <div style={overlay}>
      <div style={card}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🎳</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#F9FAFB', letterSpacing: '0.02em' }}>
            Victory GamePlan™
          </div>
          <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
            Performance Journal
          </div>
        </div>

        {/* Tabs */}
        <div style={tabRow}>
          {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); clearMessages() }}
              style={{ ...tabBtn, ...(tab === id ? tabBtnActive : {}) }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {message && <div style={messageBox}>{message}</div>}

        {/* Sign In */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} style={formStyle}>
            <Field label="Email">
              <input type="email" value={siEmail} onChange={e => setSiEmail(e.target.value)}
                placeholder="you@example.com" required style={input} />
            </Field>
            <Field label="Password">
              <input type="password" value={siPassword} onChange={e => setSiPassword(e.target.value)}
                placeholder="••••••••" required style={input} />
            </Field>
            <button type="button" onClick={handleForgotPassword} style={forgotLink}>
              Forgot password?
            </button>
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Sign Up */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} style={formStyle}>
            <Field label="Full Name">
              <input type="text" value={suName} onChange={e => setSuName(e.target.value)}
                placeholder="Your name" style={input} />
            </Field>
            <Field label="Email">
              <input type="email" value={suEmail} onChange={e => setSuEmail(e.target.value)}
                placeholder="you@example.com" required style={input} />
            </Field>
            <Field label="Password">
              <input type="password" value={suPassword} onChange={e => setSuPassword(e.target.value)}
                placeholder="At least 8 characters" required minLength={8} style={input} />
            </Field>
            <Field label="Confirm Password">
              <input type="password" value={suConfirm} onChange={e => setSuConfirm(e.target.value)}
                placeholder="Re-enter password" required style={input} />
            </Field>
            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={divider}>
          <div style={divLine} />
          <span style={{ color: '#4B5563', fontSize: 12, padding: '0 12px', whiteSpace: 'nowrap' }}>or</span>
          <div style={divLine} />
        </div>

        {/* Google OAuth */}
        <button onClick={handleGoogle} disabled={loading} style={btnGoogle}>
          <GoogleIcon />
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#4B5563', margin: '24px 0 0' }}>
          Victory Bowling Services · Grand Sierra Resort, Reno NV
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlay = {
  minHeight: '100vh',
  background: '#0B1220',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 16px',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
}

const card = {
  background: '#111827',
  border: '1px solid #1E293B',
  borderRadius: 16,
  padding: '32px 28px',
  width: '100%',
  maxWidth: 400,
}

const tabRow = {
  display: 'flex',
  background: '#0B1220',
  borderRadius: 8,
  padding: 4,
  marginBottom: 20,
  gap: 4,
}

const tabBtn = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: '#6B7280',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
}

const tabBtnActive = {
  background: '#1E293B',
  color: '#F9FAFB',
}

const errorBox = {
  background: '#7F1D1D33',
  border: '1px solid #EF444466',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#FCA5A5',
  fontSize: 13,
  marginBottom: 16,
}

const messageBox = {
  background: '#064E3B33',
  border: '1px solid #10B98166',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#6EE7B7',
  fontSize: 13,
  marginBottom: 16,
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const input = {
  background: '#0B1220',
  border: '1px solid #374151',
  borderRadius: 8,
  color: '#F9FAFB',
  fontSize: 15,
  padding: '10px 12px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
}

const forgotLink = {
  background: 'none',
  border: 'none',
  color: '#F59E0B',
  fontSize: 12,
  cursor: 'pointer',
  textAlign: 'right',
  padding: 0,
  marginTop: -8,
  fontFamily: 'inherit',
}

const btnPrimary = {
  background: '#F59E0B',
  color: '#0B1220',
  border: 'none',
  borderRadius: 8,
  padding: '12px 20px',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  width: '100%',
  marginTop: 4,
  fontFamily: 'inherit',
}

const divider = {
  display: 'flex',
  alignItems: 'center',
  margin: '20px 0',
}

const divLine = {
  flex: 1,
  height: 1,
  background: '#1E293B',
}

const btnGoogle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  padding: '11px 20px',
  background: '#1E293B',
  border: '1px solid #374151',
  borderRadius: 8,
  color: '#F9FAFB',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
