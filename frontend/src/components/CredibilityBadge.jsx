const LEVELS = {
  Beginner: { color: "bg-surface-container text-on-surface-variant border-outline", icon: "🌱" },
  Rising: { color: "bg-secondary-fixed text-on-secondary-fixed border-ink", icon: "⚡" },
  Notable: { color: "bg-tertiary-fixed text-on-tertiary-fixed border-ink", icon: "🔥" },
  Elite: { color: "bg-primary text-on-primary border-ink", icon: "👑" },
};

export default function CredibilityBadge({ score, level, showScore = true }) {
  const lvl = level || getLevel(score);
  const style = LEVELS[lvl] || LEVELS["Beginner"];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 border font-mono text-xs font-bold uppercase ${style.color}`}
    >
      <span>{style.icon}</span>
      <span>{lvl}</span>
      {showScore && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

function getLevel(score) {
  if (score >= 100) return "Elite";
  if (score >= 50) return "Notable";
  if (score >= 20) return "Rising";
  return "Beginner";
}
