import { useState } from "react";
import { projectsApi } from "../api";

const DIMENSION_ICONS = {
  problem_clarity: "lightbulb",
  tech_appropriateness: "settings",
  complexity_for_year: "school",
  industry_relevance: "business_center",
  completeness: "checklist",
  code_quality_signals: "code",
  presentation: "star",
};

const scoreColor = (s) =>
  s >= 8 ? "text-green-700" : s >= 6 ? "text-tertiary" : "text-error";
const barColor = (s) =>
  s >= 8 ? "bg-green-600" : s >= 6 ? "bg-tertiary" : "bg-error";

function ScoreBar({ score, max = 10 }) {
  return (
    <div className="h-2 bg-surface-container border border-ink flex-1">
      <div
        className={`h-full ${barColor(score)} transition-all duration-700`}
        style={{ width: `${(score / max) * 100}%` }}
      />
    </div>
  );
}

function DimensionCard({ dim, data }) {
  const [open, setOpen] = useState(false);
  const icon = DIMENSION_ICONS[dim] || "analytics";

  return (
    <div className="border border-ink">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors text-left"
      >
        <span className="material-symbols-outlined text-primary text-base flex-shrink-0">{icon}</span>
        <span className="font-mono text-xs font-bold uppercase flex-1">{data.label}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreBar score={data.score} />
          <span className={`font-mono font-black text-sm ${scoreColor(data.score)} w-6 text-right`}>
            {data.score}
          </span>
        </div>
        <span className="material-symbols-outlined text-sm text-on-surface-variant">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-ink bg-surface-container-lowest">
          <p className="text-sm text-on-surface leading-relaxed pt-3">{data.feedback}</p>
        </div>
      )}
    </div>
  );
}

function HistoryMiniChart({ history }) {
  if (!history || history.length < 2) return null;
  const scores = history.map((h) => h.score ?? 0);
  const max = 10;
  const h = 40;
  const w = 160;
  const step = w / (scores.length - 1);

  const points = scores
    .map((s, i) => `${i * step},${h - (s / max) * h}`)
    .join(" ");

  return (
    <div className="mt-3">
      <p className="label-mono mb-2">Score history ({history.length} analyses)</p>
      <div className="flex items-end gap-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-40 h-10 flex-shrink-0">
          <polyline
            points={points}
            fill="none"
            stroke="#4f378a"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {scores.map((s, i) => (
            <circle key={i} cx={i * step} cy={h - (s / max) * h} r="2.5" fill="#4f378a" />
          ))}
        </svg>
        <div className="flex gap-4 font-mono text-xs text-on-surface-variant">
          <span>First: <strong className="text-on-surface">{scores[0]}</strong></span>
          <span>Latest: <strong className={`${scoreColor(scores[scores.length - 1])}`}>{scores[scores.length - 1]}</strong></span>
        </div>
      </div>
    </div>
  );
}

export default function AIAnalysisPanel({
  analysis,
  onAnalyse,
  loading,
  canAnalyse,
  canAnalyzeResult,   // {can_analyze, can_analyze_reason}
  queueMessage,
  analysisHistory,
  aiAnalysisHidden,
}) {
  if (aiAnalysisHidden) {
    return (
      <div className="border border-outline bg-surface-container-low p-8 text-center rounded-sm">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 block">lock</span>
        <h3 className="font-grotesk font-bold text-base text-on-surface mb-1">Analysis Hidden</h3>
        <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
          The author has chosen to keep the AI feedback for this project private.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="border-2 border-ink p-6 text-center" style={{ boxShadow: "4px 4px 0 #4f378a" }}>
        <span className="material-symbols-outlined text-5xl text-primary mb-3 block">psychology</span>
        <h3 className="font-grotesk font-bold text-lg text-on-surface mb-2">Get AI Feedback</h3>
        <p className="text-sm text-on-surface-variant mb-4 max-w-sm mx-auto">
          AI will review your project across 7 dimensions and give you a brutally honest score.
        </p>

        {canAnalyse ? (
          <>
            {queueMessage && (
              <div className="border border-primary bg-primary-container px-3 py-2 mb-3 text-left">
                <p className="font-mono text-xs text-on-primary-container flex items-start gap-1">
                  <span className="material-symbols-outlined text-sm flex-shrink-0">queue</span>
                  {queueMessage}
                </p>
              </div>
            )}
            <button onClick={onAnalyse} disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  Analysing... (30–60s)
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  Analyse with AI →
                </>
              )}
            </button>
          </>
        ) : (
          <p className="label-mono text-on-surface-variant">
            {canAnalyzeResult?.can_analyze_reason || "Sign in as the project owner to analyse"}
          </p>
        )}
      </div>
    );
  }

  const {
    overall_score,
    score_label,
    project_tagline,
    dimensions,
    next_steps,
    brutal_honest_line,
    strengths,
  } = analysis;

  const canReanalyze = canAnalyzeResult?.can_analyze;
  const reanalyzeReason = canAnalyzeResult?.can_analyze_reason;

  return (
    <div className="border-2 border-ink" style={{ boxShadow: "4px 4px 0 #4f378a" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink bg-surface-container-high">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
          <span className="font-mono font-bold uppercase text-sm text-on-surface">AI Analysis</span>
        </div>
        <span className="label-mono text-on-surface-variant">Gemini 2.5 Flash</span>
      </div>

      <div className="p-5 space-y-6">
        {/* Score + label */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-5">
          <div>
            <div className={`font-mono font-black text-5xl ${scoreColor(overall_score)}`}>
              {overall_score}
              <span className="text-lg text-on-surface-variant">/10</span>
            </div>
            <div className="font-mono text-xs uppercase text-on-surface-variant mt-1">{score_label}</div>
            {project_tagline && (
              <p className="text-sm italic text-on-surface mt-2 max-w-sm">"{project_tagline}"</p>
            )}
          </div>
          <div className="text-right">
            <div className="h-20 w-20 flex items-center justify-center border-2 border-ink"
              style={{ boxShadow: `3px 3px 0 ${overall_score >= 8 ? "#16a34a" : overall_score >= 6 ? "#7965af" : "#b3261e"}` }}>
              <span className={`font-mono font-black text-3xl ${scoreColor(overall_score)}`}>{overall_score}</span>
            </div>
          </div>
        </div>

        {/* History sparkline */}
        {analysisHistory && <HistoryMiniChart history={analysisHistory} />}

        {/* 7 Dimensions */}
        {dimensions && (
          <div>
            <p className="label-mono mb-3">7 Dimensions</p>
            <div className="space-y-1">
              {Object.entries(dimensions).map(([key, val]) => (
                <DimensionCard key={key} dim={key} data={val} />
              ))}
            </div>
          </div>
        )}

        {/* Brutal honest line */}
        {brutal_honest_line && (
          <div className="border-2 border-ink bg-ink text-surface px-4 py-4">
            <p className="label-mono text-surface-variant mb-2">Honest take</p>
            <p className="font-grotesk font-bold text-base leading-snug">"{brutal_honest_line}"</p>
          </div>
        )}

        {/* Strengths */}
        {strengths && strengths.length > 0 && (
          <div>
            <p className="label-mono mb-2">Genuine Strengths</p>
            <ul className="space-y-1.5">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                  <span className="material-symbols-outlined text-green-600 text-base mt-0.5 flex-shrink-0">check_circle</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next steps */}
        {next_steps && next_steps.length > 0 && (
          <div>
            <p className="label-mono mb-2">Next Steps</p>
            <ol className="space-y-2">
              {next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-on-surface">
                  <span className="font-mono font-bold text-primary flex-shrink-0 mt-0.5">0{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Re-analyse */}
        {canAnalyse && (
          <div className="border-t-2 border-ink pt-4">
            {canReanalyze ? (
              <>
                {queueMessage && (
                  <p className="font-mono text-xs text-primary mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">queue</span>
                    {queueMessage}
                  </p>
                )}
                <button onClick={onAnalyse} disabled={loading} className="btn-secondary w-full justify-center">
                  {loading ? (
                    <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Re-analysing...</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">refresh</span>Re-analyse</>
                  )}
                </button>
              </>
            ) : (
              <p className="font-mono text-xs text-on-surface-variant text-center">
                <span className="material-symbols-outlined text-sm align-middle mr-1">lock</span>
                {reanalyzeReason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
