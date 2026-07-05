import { useState, useEffect, useRef, useCallback } from 'react'

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
  grotesk: '"Space Grotesk", sans-serif',
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function triggerAnalysis(projectId, yearOfStudy, token) {
  const res = await fetch(`${API}/api/projects/${projectId}/analyse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ year_of_study: yearOfStudy }),
  })
  const json = await res.json()
  if (!res.ok) throw json
  return json
}

async function fetchQueueStatus(token) {
  const res = await fetch(`${API}/api/projects/queue/status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return res.json()
}

/**
 * AnalyseButton
 *
 * Props:
 *   projectId       string
 *   canAnalyze      boolean   — from project.can_analyze
 *   canAnalyzeReason string  — from project.can_analyze_reason
 *   yearOfStudy     number   — passed from parent
 *   onDone          fn(analysis) — called with full analysis result
 */
export default function AnalyseButton({ projectId, canAnalyze, canAnalyzeReason, yearOfStudy = 2, onDone }) {
  // state: 'locked' | 'ready' | 'queued' | 'running' | 'error'
  const [state, setState] = useState(canAnalyze ? 'ready' : 'locked')
  const [queuePos, setQueuePos] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const elapsedRef = useRef(null)
  const token = localStorage.getItem('showup_token') || ''

  // Sync locked/ready if prop changes
  useEffect(() => {
    if (state === 'locked' || state === 'ready') {
      setState(canAnalyze ? 'ready' : 'locked')
    }
  }, [canAnalyze]) // eslint-disable-line react-hooks/exhaustive-deps

  const startElapsedTimer = useCallback(() => {
    clearInterval(elapsedRef.current)
    setElapsed(0)
    let e = 0
    elapsedRef.current = setInterval(() => {
      e += 1
      setElapsed(e)
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(elapsedRef.current), [])

  const formatElapsed = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const handleAnalyse = async () => {
    setErrorMsg('')
    // Check queue first
    try {
      const qs = await fetchQueueStatus(token)
      const { slots_available, active } = qs.data || {}
      if (slots_available === 0) {
        setState('queued')
        setQueuePos(active || 8)
      } else {
        setState('running')
      }
    } catch {
      setState('running')
    }

    startElapsedTimer()

    try {
      const res = await triggerAnalysis(projectId, yearOfStudy, token)
      clearInterval(elapsedRef.current)
      if (onDone) onDone(res.data)
    } catch (err) {
      clearInterval(elapsedRef.current)
      setState('error')
      setErrorMsg(err?.message || 'Analysis failed. Please try again.')
    }
  }

  const handleRetry = () => {
    setState('ready')
    setErrorMsg('')
    setElapsed(0)
  }

  /* ── CSS injected once ── */
  const borderPulseCSS = `
    @keyframes borderPulse {
      0%, 100% { border-color: #2A2A2A; }
      50% { border-color: #C8FF00; }
    }
    .analyse-queued-box {
      animation: borderPulse 2s ease-in-out infinite;
    }
    .analyse-accent-btn:hover {
      transform: translate(2px, 2px);
    }
    .analyse-retry-btn:hover {
      transform: translate(2px, 2px);
    }
  `

  /* ── Shared box wrapper ── */
  const Box = ({ children, borderColor = T.border, className = '' }) => (
    <div
      className={className}
      style={{
        border: `1.5px solid ${borderColor}`,
        borderRadius: 4,
        padding: 16,
        background: T.surface,
      }}
    >
      {children}
    </div>
  )

  return (
    <>
      <style>{borderPulseCSS}</style>

      {/* ── LOCKED ── */}
      {state === 'locked' && (
        <Box>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            [ ANALYSIS LOCKED ]
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: '#444', marginTop: 6 }}>
            {canAnalyzeReason || 'Update your project to analyse again'}
          </div>
        </Box>
      )}

      {/* ── READY ── */}
      {state === 'ready' && (
        <button
          className="analyse-accent-btn"
          onClick={handleAnalyse}
          style={{
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
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'transform 0.1s',
          }}
        >
          ANALYSE WITH AI →
        </button>
      )}

      {/* ── QUEUED ── */}
      {state === 'queued' && (
        <Box borderColor={T.border} className="analyse-queued-box">
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            [ QUEUED — POSITION {queuePos} ]
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: '#444', marginTop: 6 }}>
            We'll run your analysis automatically. Don't close this page.
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSecondary, marginTop: 8 }}>
            {formatElapsed(elapsed)} elapsed
          </div>
        </Box>
      )}

      {/* ── RUNNING ── */}
      {state === 'running' && (
        <Box borderColor={T.accent}>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.textPrimary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            [ ANALYSING... ]
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSecondary, marginTop: 6 }}>
            Gemini 2.5 Flash is reviewing your project
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSecondary, marginTop: 8 }}>
            {formatElapsed(elapsed)} elapsed
          </div>
        </Box>
      )}

      {/* ── ERROR ── */}
      {state === 'error' && (
        <Box borderColor={T.error}>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.error, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            ANALYSIS FAILED
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSecondary, marginBottom: 12 }}>
            {errorMsg}
          </div>
          <button
            className="analyse-retry-btn"
            onClick={handleRetry}
            style={{
              background: 'none',
              border: `1.5px solid ${T.accent}`,
              borderRadius: 2,
              padding: '8px 14px',
              fontFamily: T.mono,
              fontSize: 12,
              color: T.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
          >
            TRY AGAIN →
          </button>
        </Box>
      )}
    </>
  )
}
