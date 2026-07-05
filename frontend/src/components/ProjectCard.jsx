import { Link } from "react-router-dom";
import TechPill from "./TechPill";

export default function ProjectCard({ project }) {
  const { id, title, description, tech_stack, screenshot_url, view_count, ai_analysis, ai_analysis_used, student, created_at } = project;

  const score = ai_analysis?.overall_score;
  const scoreColor = score >= 8 ? "text-green-700 bg-green-50 border-green-700" : score >= 6 ? "text-tertiary bg-tertiary-fixed border-tertiary" : "text-error bg-error-container border-error";

  return (
    <Link to={`/project/${id}`} className="block group">
      <article className="card-brutal bg-surface h-full flex flex-col">
        {/* Screenshot */}
        <div className="relative overflow-hidden border-b-2 border-ink aspect-video bg-surface-container">
          {screenshot_url ? (
            <img
              src={screenshot_url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
              <span className="material-symbols-outlined text-5xl text-outline">image</span>
            </div>
          )}

          {/* AI Score Badge */}
          {ai_analysis_used && score !== undefined && (
            <div className={`absolute top-2 right-2 border font-mono font-bold text-xs px-2 py-1 ${scoreColor}`}>
              AI {score}/10
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Student info */}
          {student && (
            <div className="flex items-center gap-2">
              {student.avatar_url ? (
                <img
                  src={student.avatar_url}
                  alt={student.name}
                  className="w-6 h-6 brutalist-border object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-6 h-6 bg-primary-container border border-ink flex items-center justify-center flex-shrink-0">
                  <span className="font-mono font-bold text-[10px] text-on-primary-container">
                    {student.name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <span className="font-semibold text-xs text-on-surface truncate block">{student.name}</span>
                <span className="font-mono text-[10px] text-on-surface-variant truncate block">{student.college}</span>
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="font-grotesk font-bold text-base text-on-surface leading-tight line-clamp-2">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-on-surface-variant line-clamp-2 flex-1">
              {description}
            </p>
          )}

          {/* Tech stack */}
          {tech_stack && tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tech_stack.slice(0, 4).map((tag) => (
                <TechPill key={tag} tag={tag} />
              ))}
              {tech_stack.length > 4 && (
                <span className="tech-pill text-on-surface-variant">+{tech_stack.length - 4}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
            <span className="flex items-center gap-1 font-mono text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">visibility</span>
              {view_count?.toLocaleString() || 0}
            </span>
            <span className="font-mono text-xs text-on-surface-variant">
              {created_at ? new Date(created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
