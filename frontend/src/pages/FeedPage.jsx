import { useState, useEffect, useCallback } from "react";
import { projectsApi, feedApi } from "../api";
import ProjectCard from "../components/ProjectCard";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const FILTERS = [
  { key: "newest", label: "Newest", icon: "schedule" },
  { key: "this_week", label: "This Week", icon: "local_fire_department" },
  { key: "most_viewed", label: "Most Viewed", icon: "trending_up" },
];

export default function FeedPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchProjects = useCallback(async (pageNum = 1, activeFilter = filter, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await projectsApi.list({ page: pageNum, limit: 12, filter: activeFilter });
      const data = res.data.data;

      if (append) {
        setProjects((prev) => [...prev, ...data.projects]);
      } else {
        setProjects(data.projects);
      }
      setHasNext(data.has_next);
      setPage(pageNum);
    } catch {
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProjects(1, filter, false);
  }, [filter]);

  const handleFilterChange = (key) => {
    if (key === filter) return;
    setFilter(key);
    setPage(1);
  };

  const handleLoadMore = () => {
    fetchProjects(page + 1, filter, true);
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Navbar />

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Page header */}
        <div className="sticky top-0 z-20 bg-surface border-b-2 border-ink px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-grotesk font-bold text-xl text-on-surface">Discovery Feed</h1>
            <span className="label-mono text-on-surface-variant">
              {user?.name?.split(" ")[0] ? `Hey, ${user.name.split(" ")[0]} 👋` : ""}
            </span>
          </div>

          {/* Filter bar */}
          <div className="flex gap-0 border-2 border-ink overflow-hidden w-fit">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className={`flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase font-bold transition-colors border-r-2 last:border-r-0 border-ink ${
                  filter === f.key
                    ? "bg-ink text-surface"
                    : "bg-surface text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border-2 border-ink animate-pulse">
                  <div className="aspect-video bg-surface-container-high" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-surface-container-high rounded w-3/4" />
                    <div className="h-3 bg-surface-container-high rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-surface-container-high rounded w-16" />
                      <div className="h-5 bg-surface-container-high rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="border-2 border-error bg-error-container p-6 text-center">
              <p className="font-mono text-sm text-on-error-container">{error}</p>
              <button onClick={() => fetchProjects(1, filter, false)} className="btn-secondary mt-4 text-xs">
                Retry
              </button>
            </div>
          )}

          {/* Projects grid */}
          {!loading && !error && (
            <>
              {projects.length === 0 ? (
                <div className="text-center py-20">
                  <span className="material-symbols-outlined text-5xl text-outline mb-4 block">folder_open</span>
                  <p className="font-grotesk font-bold text-lg text-on-surface mb-2">No projects yet</p>
                  <p className="font-mono text-sm text-on-surface-variant">Be the first to upload a project!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}

              {/* Load more */}
              {hasNext && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn-secondary"
                  >
                    {loadingMore ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                        Loading...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">expand_more</span>
                        Load More Projects
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
