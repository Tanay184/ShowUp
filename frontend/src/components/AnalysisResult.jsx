import { useState, useEffect } from 'react'

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

const DIMENSION_ORDER = [
  'problem_clarity',
  'tech_appropriateness',
  'complexity_for_year',
  'industry_relevance',
  'completeness',
  'code_quality_signals',
  'presentation',
]

/* ─── Score colour helper ───────────────────────── */
function scoreColor(s) {
  if (s >= 8) return '#4CAF50'
  if (s >= 6) return T.accent
  return T.error
}

/* ─── SVG Score history sparkline ─────────────────── */
function Sparkline({ history }) {
  if (!history || history.length < 2) return null
  const scores = history.map((h) => Number(h.score ?? 0))
  const W = 200
  const H = 48
  const step = W / (scores.length - 1)

  const pts = scores
    .map((s, i) => `${i * step},${H - (s / 10) * H}`)
    .join(' ')

  return (
    <div style={{ marginTop: 32 }}>
      <SectionLabel>PROGRESS OVER TIME</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 10 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          style={{ flexShrink: 0, overflow: 'visible' }}
        >
          {/* Grid lines */}
          {[0, 5, 10].map((v) => (
            <line
              key={v}
              x1={0} y1={H - (v / 10) * H}
              x2={W} y2={H - (v / 10) * H}
              stroke={T.border}
              strokeWidth={0.5}
            />
          ))}
          {/* Line */}
          <polyline
            points={pts}
            fill="none"
            stroke={T.accent}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Dots */}
          {scores.map((s, i) => (
            <circle
              key={i}
              cx={i * step}
              cy={H - (s / 10) * H}
              r={3}
              fill={T.accent}
              stroke={T.bg}
              strokeWidth={1}
            />
          ))}
        </svg>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSecondary }}>
          <div>{scores[0]} → {scores[scores.length - 1]}</div>
          <div style={{ marginTop: 2, color: '#444' }}>{history.length} analyses</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Section label ──────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: T.mono,
      fontSize: 11,
      color: T.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

/* ─── Dimension card ─────────────────────────────── */
function DimensionCard({ label, score, feedback }) {
  const [open, setOpen] = useState(false)
  const color = scoreColor(score)

  return (
    <div
      style={{
        border: `1.5px solid ${T.border}`,
        borderRadius: 2,
        padding: 16,
        background: T.surface,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onClick={() => setOpen(v => !v)}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = T.accent}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: T.grotesk, fontWeight: 700, fontSize: 20, color }}>{score}</span>
          <span style={{ fontFamily: T.grotesk, fontSize: 12, color: T.textSecondary }}>/ 10</span>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textSecondary, marginLeft: 8 }}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>
      {open && (
        <div style={{
          fontFamily: T.mono,
          fontSize: 13,
          color: T.textSecondary,
          lineHeight: 1.7,
          marginTop: 10,
          borderTop: `1px solid ${T.border}`,
          paddingTop: 10,
        }}>
          {feedback}
        </div>
      )}
    </div>
  )
}

/* ─── Next step checkbox (saves to localStorage) ──── */
function NextStep({ step, projectId, index }) {
  const storageKey = `showup_nextsteps_${projectId}`
  const [checked, setChecked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      return !!saved[index]
    } catch { return false }
  })

  const toggle = () => {
    const newVal = !checked
    setChecked(newVal)
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      saved[index] = newVal
      localStorage.setItem(storageKey, JSON.stringify(saved))
    } catch {}
  }

  return (
    <div
      onClick={toggle}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: 'pointer',
        padding: '6px 0',
      }}
    >
      <div style={{
        width: 14,
        height: 14,
        border: `1.5px solid ${checked ? T.accent : T.border}`,
        borderRadius: 2,
        flexShrink: 0,
        marginTop: 2,
        background: checked ? T.accent : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s, border-color 0.15s',
      }}>
        {checked && <span style={{ fontSize: 9, color: T.bg, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{
        fontFamily: T.mono,
        fontSize: 13,
        color: checked ? T.textSecondary : T.textPrimary,
        lineHeight: 1.6,
        textDecoration: checked ? 'line-through' : 'none',
      }}>
        {step}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN AnalysisResult COMPONENT
   Props:
     analysis       object   — full analysis result
     projectId      string   — for localStorage key
     analysisHistory array   — list of {score, analyzed_at}
     lastAnalyzedAt string   — ISO date string
═══════════════════════════════════════════════════ */
export default function AnalysisResult({ analysis, projectId, analysisHistory, lastAnalyzedAt }) {
  if (!analysis) return null

  const {
    overall_score,
    score_label,
    project_tagline,
    dimensions,
    brutal_honest_line,
    strengths,
    next_steps,
  } = analysis

  const scoreCol = scoreColor(Number(overall_score))

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' AT ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch { return iso }
  }

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .dim-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ fontFamily: T.mono, color: T.textPrimary }}>

        {/* ── Score header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: T.grotesk, fontWeight: 700, fontSize: 64, color: scoreCol, lineHeight: 1 }}>
              {overall_score}
            </span>
            <span style={{ fontFamily: T.grotesk, fontSize: 24, color: T.textSecondary, paddingBottom: 6 }}>
              / 10
            </span>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 13, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            {score_label}
          </div>
          {project_tagline && (
            <div style={{ fontFamily: T.serif, fontSize: 18, color: T.textPrimary, fontStyle: 'italic', lineHeight: 1.5 }}>
              "{project_tagline}"
            </div>
          )}
        </div>

        {/* ── Brutal honest line ── */}
        {brutal_honest_line && (
          <div style={{
            border: `1.5px solid ${T.accent}`,
            borderRadius: 4,
            padding: 16,
            marginBottom: 28,
          }}>
            <SectionLabel>[ SENIOR REVIEW ]</SectionLabel>
            <div style={{ fontFamily: T.mono, fontSize: 14, color: T.textPrimary, lineHeight: 1.6 }}>
              {brutal_honest_line}
            </div>
          </div>
        )}

        {/* ── 7 Dimensions ── */}
        {dimensions && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>[ 7 DIMENSIONS ]</SectionLabel>
            <div
              className="dim-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
              }}
            >
              {DIMENSION_ORDER.map((key) => {
                const dim = dimensions[key]
                if (!dim) return null
                return (
                  <DimensionCard
                    key={key}
                    label={dim.label}
                    score={dim.score}
                    feedback={dim.feedback}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ── Strengths ── */}
        {strengths && strengths.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>[ STRENGTHS ]</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {strengths.map((s, i) => (
                <div key={i} style={{ fontFamily: T.mono, fontSize: 13, color: T.textPrimary, lineHeight: 1.6 }}>
                  <span style={{ color: T.accent, marginRight: 8 }}>+</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Next steps (checkable) ── */}
        {next_steps && next_steps.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>[ NEXT STEPS ]</SectionLabel>
            <div>
              {next_steps.map((step, i) => (
                <NextStep key={i} step={step} projectId={projectId} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Score history sparkline ── */}
        <Sparkline history={analysisHistory} />

        {/* ── Analysis date ── */}
        {lastAnalyzedAt && (
          <div style={{
            fontFamily: T.mono,
            fontSize: 11,
            color: '#444',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginTop: 24,
            borderTop: `1px solid ${T.border}`,
            paddingTop: 12,
          }}>
            ANALYSED ON {formatDate(lastAnalyzedAt).toUpperCase()}
          </div>
        )}
      </div>
    </>
  )
}
