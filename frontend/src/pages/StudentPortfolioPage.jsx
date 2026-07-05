import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { studentsApi, projectsApi } from "../api";
import ProjectCard from "../components/ProjectCard";
import CredibilityBadge from "../components/CredibilityBadge";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function StudentPortfolioPage() {
  const { student_id } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentRes, projectsRes] = await Promise.all([
          studentsApi.getById(student_id),
          projectsApi.byStudent(student_id),
        ]);
        setStudent(studentRes.data.data);
        setProjects(projectsRes.data.data.projects);
      } catch {
        setError("Student not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student_id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-mono text-sm text-on-surface-variant animate-pulse uppercase">Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4 block">error</span>
          <p className="font-grotesk font-bold text-xl">{error}</p>
        </div>
      </div>
    );
  }

  const isOwn = user?.id === student_id;

  return (
    <div className="flex min-h-screen bg-surface">
      <Navbar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen flex flex-col">
        <div className="flex-1 w-full">
          {/* Nav bar (Mobile top, desktop handled by sidebar but we need a share/edit header) */}
        <header className="sticky top-0 z-20 border-b-2 border-ink bg-surface flex items-center justify-between px-6 py-4">
          <div className="md:hidden">
            <Link to="/feed" className="font-mono font-black text-lg uppercase text-on-surface tracking-tight">ShowUp</Link>
          </div>
          <div className="hidden md:block">
            <h1 className="font-grotesk font-bold text-xl text-on-surface">Student Portfolio</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="flex items-center gap-1.5 border border-ink px-3 py-1.5 font-mono text-xs uppercase hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-sm">{copied ? "check" : "share"}</span>
              {copied ? "Copied!" : "Share"}
            </button>
            {isOwn && (
              <Link to="/profile/edit" className="btn-primary py-1.5 px-3 text-xs">
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Profile
              </Link>
            )}
            {!user && (
              <Link to="/auth" className="btn-primary py-1.5 px-3 text-xs">Join ShowUp</Link>
            )}
          </div>
        </header>

        {/* Profile header */}
        <div className="border-b-2 border-ink bg-surface-container-low px-6 py-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {student.avatar_url ? (
                  <img
                    src={student.avatar_url}
                    alt={student.name}
                    className="w-24 h-24 border-2 border-ink object-cover"
                    style={{ boxShadow: "4px 4px 0 #4f378a" }}
                  />
                ) : (
                  <div
                    className="w-24 h-24 bg-primary-container border-2 border-ink flex items-center justify-center"
                    style={{ boxShadow: "4px 4px 0 #4f378a" }}
                  >
                    <span className="font-mono font-black text-3xl text-on-primary-container">
                      {student.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="font-grotesk font-bold text-3xl text-on-surface">{student.name}</h1>
                  <CredibilityBadge score={student.credibility_score} level={student.credibility_level} />
                  {student.is_verified_senior && (
                    <span className="inline-flex items-center gap-1 border border-primary bg-primary-fixed px-2 py-0.5 font-mono text-xs text-on-primary-fixed">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Verified Senior
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 mb-4 text-on-surface-variant font-mono text-sm">
                  <p>
                    <span className="material-symbols-outlined text-sm align-middle mr-2">school</span>
                    {student.college}
                  </p>
                  {(student.course || student.college_start_year) && (
                    <p>
                      <span className="material-symbols-outlined text-sm align-middle mr-2">menu_book</span>
                      {student.course} {student.college_start_year && student.college_end_year ? `(${student.college_start_year} - ${student.college_end_year})` : ""}
                    </p>
                  )}
                </div>

                {student.skills && student.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {student.skills.map((skill, idx) => (
                      <span key={idx} className="bg-surface-container border border-ink px-2 py-0.5 font-mono text-xs text-on-surface">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {student.bio && (
                  <p className="text-on-surface leading-relaxed max-w-2xl">{student.bio}</p>
                )}

                {/* Stats row */}
                <div className="flex gap-6 mt-4">
                  <div>
                    <p className="font-mono font-bold text-xl text-on-surface">{projects.length}</p>
                    <p className="font-mono text-xs text-on-surface-variant uppercase">Projects</p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-xl text-on-surface">{student.credibility_score}</p>
                    <p className="font-mono text-xs text-on-surface-variant uppercase">Credibility</p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-xl text-on-surface">
                      {projects.filter((p) => p.ai_analysis_used).length}
                    </p>
                    <p className="font-mono text-xs text-on-surface-variant uppercase">AI Reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects grid */}
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-grotesk font-bold text-xl text-on-surface">
              Projects <span className="text-on-surface-variant font-normal">({projects.length})</span>
            </h2>
            {isOwn && (
              <Link to="/upload" className="btn-primary text-sm py-2">
                <span className="material-symbols-outlined text-sm">add</span>
                Add Project
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-5xl text-outline mb-4 block">folder_open</span>
              <p className="font-grotesk font-bold text-lg text-on-surface mb-2">No projects yet</p>
              {isOwn && (
                <Link to="/upload" className="btn-primary text-sm mt-4 inline-flex">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Upload First Project
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={{ ...project, student }}
                />
              ))}
            </div>
          )}
        </div>
        </div>

        {/* Footer */}
        <footer className="border-t-2 border-ink py-6 px-6 text-center mt-auto">
          <p className="font-mono text-xs text-on-surface-variant">
            <span className="font-bold text-on-surface">{student.name}</span>'s portfolio on ShowUp — built for Indian students 🇮🇳
          </p>
        </footer>
      </main>
    </div>
  );
}
