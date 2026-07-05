import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TechPill from "../components/TechPill";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import CredibilityBadge from "../components/CredibilityBadge";
import { projectsApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState("");
  const [queueMessage, setQueueMessage] = useState("");
  const [analysisHistory, setAnalysisHistory] = useState(null);
  const [yearOfStudy, setYearOfStudy] = useState(2);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const viewRecorded = useRef(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await projectsApi.getById(id);
        setProject(res.data.data);
      } catch {
        setError("Project not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();

    if (!viewRecorded.current) {
      projectsApi.recordView(id).catch(() => {});
      viewRecorded.current = true;
    }
  }, [id]);

  const handleAnalyse = async () => {
    setAnalysing(true);
    setAnalyseError("");
    setQueueMessage("");

    try {
      // Check queue before submitting
      try {
        const qRes = await projectsApi.queueStatus();
        const { slots_available, active } = qRes.data.data;
        if (slots_available === 0) {
          setQueueMessage(`All ${active} slots busy — your request is queued and will run automatically.`);
        }
      } catch { /* queue check is non-critical */ }

      const res = await projectsApi.analyse(id, { year_of_study: yearOfStudy });
      setProject(res.data.data.project);

      // Refresh history after analysis
      try {
        const hRes = await projectsApi.analysisHistory(id);
        setAnalysisHistory(hRes.data.data.history);
      } catch { /* non-critical */ }
    } catch (err) {
      setAnalyseError(err.response?.data?.message || "Analysis failed. Try again.");
    } finally {
      setAnalysing(false);
      setQueueMessage("");
    }
  };

  // Fetch history once project owner is confirmed
  useEffect(() => {
    if (!project || !user) return;
    const isOwner = user.id === project.student_id;
    if (!isOwner || !project.ai_analysis_used) return;
    projectsApi.analysisHistory(id)
      .then(r => setAnalysisHistory(r.data.data.history))
      .catch(() => {});
  }, [project?.id, user?.id]);

  const handleShare = () => {
    const url = `${window.location.origin}/u/${project.student_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await projectsApi.delete(id);
      navigate(`/u/${user.id}`);
    } catch {
      setDeleting(false);
    }
  };

  const isOwner = user && project && user.id === project.student_id;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface">
        <Navbar />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <p className="font-mono text-sm text-on-surface-variant animate-pulse uppercase">Loading project...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-surface">
        <Navbar />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-error mb-4 block">error</span>
            <p className="font-grotesk font-bold text-xl mb-2">{error}</p>
            <Link to="/feed" className="btn-primary text-sm">← Back to Feed</Link>
          </div>
        </main>
      </div>
    );
  }

  const { title, description, tech_stack, live_url, github_url, screenshot_url, view_count, ai_analysis, ai_analysis_used, student, created_at } = project;

  return (
    <div className="flex min-h-screen bg-surface">
      <Navbar />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Breadcrumb */}
        <div className="border-b-2 border-ink px-6 py-3 flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
            <Link to="/feed" className="hover:text-on-surface transition-colors uppercase">Feed</Link>
            <span>/</span>
            <span className="text-on-surface uppercase truncate max-w-[200px]">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share button */}
            <button onClick={handleShare} className="btn-secondary py-2 px-3 text-xs">
              <span className="material-symbols-outlined text-sm">{copied ? "check" : "share"}</span>
              {copied ? "Copied!" : "Share Portfolio"}
            </button>

            {/* Owner actions */}
            {isOwner && (
              <>
                <Link to={`/project/${id}/edit`} className="btn-secondary py-2 px-3 text-xs">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </Link>
                <button onClick={handleDelete} disabled={deleting} className="btn-danger py-2 px-3 text-xs">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Project title & meta */}
          <div className="border-b-2 border-ink pb-6">
            <h1 className="font-grotesk font-bold text-3xl md:text-4xl text-on-surface mb-1 leading-tight">
              {title}
            </h1>
            {/* AI-generated tagline */}
            {ai_analysis?.project_tagline && (
              <p className="font-mono text-sm italic text-primary mb-3">"{ai_analysis.project_tagline}"</p>
            )}

            {/* Student info */}
            {student && (
              <Link to={`/u/${student.id}`} className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity mb-4 group">
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} className="w-10 h-10 brutalist-border object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-primary-container border-2 border-ink flex items-center justify-center">
                    <span className="font-mono font-bold text-sm text-on-primary-container">
                      {student.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                    {student.name}
                  </p>
                  <p className="font-mono text-xs text-on-surface-variant">{student.college}</p>
                </div>
                {student.credibility_score !== undefined && (
                  <CredibilityBadge score={student.credibility_score} level={student.credibility_level} />
                )}
              </Link>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1 font-mono text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">visibility</span>
                {view_count?.toLocaleString()} views
              </span>
              <span className="flex items-center gap-1 font-mono text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {created_at ? new Date(created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
              </span>
              {ai_analysis_used && ai_analysis && (
                <span className="flex items-center gap-1 font-mono text-xs text-primary border border-primary px-2 py-0.5">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  AI Score: {ai_analysis.overall_score}/10
                </span>
              )}
            </div>
          </div>

          {/* Screenshot */}
          {screenshot_url && (
            <div className="border-2 border-ink overflow-hidden" style={{ boxShadow: "4px 4px 0 #2A2A2A" }}>
              <img src={screenshot_url} alt={`${title} screenshot`} className="w-full" />
            </div>
          )}

          {/* Description */}
          {description && (
            <div>
              <p className="label-mono mb-3">About this project</p>
              <p className="text-on-surface leading-relaxed">{description}</p>
            </div>
          )}

          {/* Tech stack */}
          {tech_stack && tech_stack.length > 0 && (
            <div>
              <p className="label-mono mb-3">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {tech_stack.map((tag) => (
                  <TechPill key={tag} tag={tag} />
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(live_url || github_url) && (
            <div>
              <p className="label-mono mb-3">Project Links</p>
              <div className="flex flex-wrap gap-3">
                {live_url && (
                  <a
                    href={live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm py-2.5 px-5"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    Live Demo
                  </a>
                )}
                {github_url && (
                  <a
                    href={github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm py-2.5 px-5"
                  >
                    <span className="material-symbols-outlined text-base">code</span>
                    View Code
                  </a>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="label-mono">AI Feedback</p>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <label className="font-mono text-xs text-on-surface-variant">Year of study:</label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(Number(e.target.value))}
                    className="border border-ink font-mono text-xs px-2 py-1 bg-surface focus:outline-none"
                  >
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {analyseError && (
              <div className="border border-error bg-error-container px-4 py-2 mb-4">
                <p className="font-mono text-xs text-on-error-container">{analyseError}</p>
              </div>
            )}
            <AIAnalysisPanel
              analysis={project?.ai_analysis}
              aiAnalysisHidden={project?.ai_analysis_hidden}
              onAnalyse={handleAnalyse}
              loading={analysing}
              canAnalyse={isOwner}
              canAnalyzeResult={{ can_analyze: project?.can_analyze, can_analyze_reason: project?.can_analyze_reason }}
              queueMessage={queueMessage}
              analysisHistory={analysisHistory}
            />
          </div>

          {/* Back to portfolio */}
          {student && (
            <div className="pt-4 border-t-2 border-ink">
              <Link to={`/u/${student.id}`} className="btn-secondary text-sm">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to {student.name}'s Portfolio
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
