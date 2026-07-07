import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TOKEN_KEYS } from '../api'

/* ─── Design tokens ─────────────────────────────── */
const T = {
  bg: '#0D0D0D',
  surface: '#141414',
  surfaceEl: '#1A1A1A',
  accent: '#C8FF00',
  border: '#2A2A2A',
  textPrimary: '#F0F0F0',
  textSecondary: '#666666',
  error: '#FF4444',
  mono: '"IBM Plex Mono", monospace',
  serif: '"DM Serif Display", serif',
  grotesk: '"Space Grotesk", sans-serif',
}

/* ─── Shared style fragments ─────────────────────── */
const inputStyle = {
  width: '100%',
  background: T.bg,
  border: `1.5px solid ${T.border}`,
  borderRadius: 0,
  padding: '14px 16px',
  fontFamily: T.mono,
  fontSize: 14,
  color: T.textPrimary,
  outline: 'none',
  boxSizing: 'border-box',
}

const btnAccent = {
  width: '100%',
  background: T.accent,
  color: T.bg,
  border: 'none',
  borderRadius: 2,
  padding: 14,
  fontFamily: T.mono,
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'uppercase',
  cursor: 'pointer',
  letterSpacing: '0.05em',
}

const btnDisabled = {
  ...btnAccent,
  background: T.border,
  color: T.textSecondary,
  cursor: 'not-allowed',
}

const labelStyle = {
  fontFamily: T.mono,
  fontSize: 11,
  textTransform: 'uppercase',
  color: T.textSecondary,
  display: 'block',
  marginBottom: 8,
  letterSpacing: '0.08em',
}

const errorStyle = {
  fontFamily: T.mono,
  fontSize: 12,
  color: T.error,
  marginTop: 6,
}

/* ─── InputField ─────────────────────────────────── */
function InputField({ label, value, onChange, placeholder, type = 'text', autoFocus }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          ...inputStyle,
          borderColor: focused ? T.accent : T.border,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

/* ─── OTP boxes ──────────────────────────────────── */
function OTPInput({ value, onChange }) {
  const refs = useRef([])

  const handleChange = (i, e) => {
    const digit = e.target.value.replace(/\D/, '').slice(-1)
    const next = [...value]
    next[i] = digit
    onChange(next)
    if (digit && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    const next = [...value]
    text.split('').forEach((d, i) => { next[i] = d })
    onChange(next)
    const focusIdx = Math.min(text.length, 5)
    setTimeout(() => refs.current[focusIdx]?.focus(), 0)
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {value.map((digit, i) => (
        <OTPBox
          key={i}
          innerRef={(el) => (refs.current[i] = el)}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

function OTPBox({ innerRef, value, onChange, onKeyDown, onPaste, autoFocus }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      ref={innerRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      autoFocus={autoFocus}
      style={{
        width: 52,
        height: 60,
        flexShrink: 0,
        background: T.bg,
        border: `1.5px solid ${focused ? T.accent : T.border}`,
        borderRadius: 2,
        fontFamily: T.grotesk,
        fontSize: 24,
        fontWeight: 700,
        textAlign: 'center',
        color: T.accent,
        outline: 'none',
        cursor: 'text',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

/* ─── Countdown timer ────────────────────────────── */
function Countdown({ secondsLeft, onExpire }) {
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const expired = secondsLeft <= 0
  const urgent = secondsLeft <= 60

  return (
    <div style={{ fontFamily: T.mono, fontSize: 11, color: expired || urgent ? T.error : T.textSecondary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {expired ? 'CODE EXPIRED' : `CODE EXPIRES IN ${mins}:${secs}`}
    </div>
  )
}

/* ─── Divider ─────────────────────────────────────── */
function OrDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        or continue with email
      </span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  )
}

/* ─── Google SVG icon ────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

/* ─── API helpers ─────────────────────────────────── */
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function apiFetch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw json
  return json
}

/* ═══════════════════════════════════════════════════
   MAIN AUTH PAGE
═══════════════════════════════════════════════════ */
export default function Auth() {
  const navigate = useNavigate()
  const { updateUser } = useAuth()

  // step: 'choose' | 'otp-email' | 'otp-code' | 'otp-profile' | 'success'
  const [step, setStep] = useState('choose')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // OTP state
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [secondsLeft, setSecondsLeft] = useState(600) // 10 min
  const [resendVisible, setResendVisible] = useState(false)
  const timerRef = useRef(null)

  // Profile state (new users)
  const [name, setName] = useState('')
  const [college, setCollege] = useState('')

  /* ── Timer ── */
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current)
    setSecondsLeft(600)
    setResendVisible(false)
    let s = 600
    timerRef.current = setInterval(() => {
      s -= 1
      setSecondsLeft(s)
      if (s === 540) setResendVisible(true) // show resend after 60s
      if (s <= 0) clearInterval(timerRef.current)
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(timerRef.current), [])

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Invalid email address')
      return
    }
    setLoading(true)
    setError('')
    try {
      await apiFetch('/api/auth/send-otp', { email: trimmed })
      setOtpDigits(['', '', '', '', '', ''])
      startTimer()
      setStep('otp-code')
    } catch (err) {
      setError(err?.message || 'Failed to send code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const code = otpDigits.join('')
    if (code.length < 6) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: code,
      })
      // Returning user
      const { access_token, refresh_token, student } = res.data
      localStorage.setItem(TOKEN_KEYS.access, access_token)
      localStorage.setItem(TOKEN_KEYS.refresh, refresh_token)
      localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(student))
      updateUser(student)
      clearInterval(timerRef.current)
      setSuccessMsg('VERIFIED ✓')
      setStep('success')
      setTimeout(() => navigate('/feed', { replace: true }), 800)
    } catch (err) {
      if (err?.requires_profile) {
        // New user — go to profile step
        setStep('otp-profile')
        setError('')
      } else {
        setError(err?.message || 'Incorrect code. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 3: Create profile (new user) ── */
  const handleCreateAccount = async (e) => {
    e?.preventDefault()
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!college.trim()) { setError('Please enter your college'); return }
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: otpDigits.join(''),
        name: name.trim(),
        college: college.trim(),
      })
      const { access_token, refresh_token, student } = res.data
      localStorage.setItem(TOKEN_KEYS.access, access_token)
      localStorage.setItem(TOKEN_KEYS.refresh, refresh_token)
      localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(student))
      updateUser(student)
      clearInterval(timerRef.current)
      setSuccessMsg('VERIFIED ✓')
      setStep('success')
      setTimeout(() => navigate('/profile/edit', { replace: true }), 800)
    } catch (err) {
      setError(err?.message || 'Account creation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Resend ── */
  const handleResend = async () => {
    setOtpDigits(['', '', '', '', '', ''])
    setError('')
    setLoading(true)
    try {
      await apiFetch('/api/auth/send-otp', { email: email.trim().toLowerCase() })
      startTimer()
    } catch (err) {
      setError(err?.message || 'Failed to resend.')
    } finally {
      setLoading(false)
    }
  }

  const otpComplete = otpDigits.join('').length === 6

  /* ─── Render ─────────────────────────────────── */
  return (
    <>
      {/* Inject keyframe for pulse on border — plain CSS */}
      <style>{`
        @keyframes borderPulse {
          0%, 100% { border-color: #2A2A2A; }
          50% { border-color: #C8FF00; }
        }
        .google-btn:hover {
          border-color: #C8FF00 !important;
          transform: translate(2px, 2px);
        }
        .accent-btn:hover:not(:disabled) {
          transform: translate(2px, 2px);
        }
        .resend-link:hover {
          text-decoration: underline;
        }
        input::placeholder {
          color: #444;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: T.mono,
      }}>
        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: 420,
          border: `1.5px solid ${T.border}`,
          borderRadius: 4,
          padding: 40,
          background: T.surface,
          boxSizing: 'border-box',
        }}>
          {/* Logo + tagline */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontFamily: T.serif, fontSize: 28, color: T.textPrimary, marginBottom: 8 }}>
              ShowUp.
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Your work speaks first.
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: T.border, marginBottom: 28 }} />

          {/* ══ SUCCESS ══ */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontFamily: T.mono, fontSize: 20, color: T.accent, letterSpacing: '0.1em' }}>
                {successMsg}
              </div>
            </div>
          )}

          {/* ══ CHOOSE ══ */}
          {step === 'choose' && (
            <div>
              {/* Google button */}
              <button
                className="google-btn"
                onClick={() => { window.location.href = `${API}/api/auth/google` }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: T.surfaceEl,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 2,
                  padding: 14,
                  fontFamily: T.mono,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  color: T.textPrimary,
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  transition: 'border-color 0.15s, transform 0.1s',
                }}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <OrDivider />

              {/* Email OTP entry */}
              <form onSubmit={(e) => { e.preventDefault(); setStep('otp-email') }}>
                <div style={{ marginBottom: 16 }}>
                  <InputField
                    label="Email Address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="your@college.edu"
                    type="email"
                  />
                </div>
                {error && <div style={errorStyle}>{error}</div>}
                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="accent-btn"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={loading ? btnDisabled : btnAccent}
                  >
                    {loading ? 'SENDING...' : 'SEND CODE →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══ OTP-EMAIL (back state, if user clicks back) ══ */}
          {step === 'otp-email' && (
            <div>
              <BackLink onClick={() => setStep('choose')} />
              <div style={{ marginBottom: 20 }}>
                <InputField
                  label="Email Address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="your@college.edu"
                  type="email"
                  autoFocus
                />
                {error && <div style={errorStyle}>{error}</div>}
              </div>
              <button
                className="accent-btn"
                onClick={handleSendOtp}
                disabled={loading}
                style={loading ? btnDisabled : btnAccent}
              >
                {loading ? 'SENDING...' : 'SEND CODE →'}
              </button>
            </div>
          )}

          {/* ══ OTP CODE ══ */}
          {step === 'otp-code' && (
            <div>
              <BackLink onClick={() => { setStep('choose'); clearInterval(timerRef.current) }} />
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textSecondary, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Code sent to <span style={{ color: T.textPrimary }}>{email}</span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Verification Code</label>
                <OTPInput value={otpDigits} onChange={setOtpDigits} />
              </div>

              {/* Timer + Resend */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <Countdown secondsLeft={secondsLeft} />
                {(resendVisible || secondsLeft <= 0) && (
                  <button
                    className="resend-link"
                    onClick={handleResend}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: T.mono,
                      fontSize: 12,
                      color: T.accent,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: 0,
                    }}
                  >
                    RESEND CODE
                  </button>
                )}
              </div>

              {error && <div style={{ ...errorStyle, marginBottom: 12 }}>{error}</div>}


              <button
                className="accent-btn"
                onClick={handleVerifyOtp}
                disabled={!otpComplete || loading}
                style={(!otpComplete || loading) ? btnDisabled : btnAccent}
              >
                {loading ? 'VERIFYING...' : 'VERIFY →'}
              </button>
            </div>
          )}

          {/* ══ OTP PROFILE (new users) ══ */}
          {step === 'otp-profile' && (
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textSecondary, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                One last thing — set up your profile
              </div>

              <form onSubmit={handleCreateAccount}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                  <div>
                    <InputField
                      label="Your Name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError('') }}
                      placeholder="Arjun Sharma"
                      autoFocus
                    />
                  </div>
                  <div>
                    <InputField
                      label="Your College"
                      value={college}
                      onChange={(e) => { setCollege(e.target.value); setError('') }}
                      placeholder="IIT Delhi, NIT Trichy..."
                    />
                  </div>
                </div>

                {error && <div style={{ ...errorStyle, marginBottom: 12 }}>{error}</div>}

                <button
                  type="submit"
                  className="accent-btn"
                  disabled={loading}
                  style={loading ? btnDisabled : btnAccent}
                >
                  {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── Back link ──────────────────────────────────── */
function BackLink({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        fontFamily: T.mono,
        fontSize: 11,
        color: T.textSecondary,
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: 0,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      ← BACK
    </button>
  )
}
