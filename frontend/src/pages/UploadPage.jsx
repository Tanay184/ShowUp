import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CloudinaryUpload from "../components/CloudinaryUpload";
import TechPill from "../components/TechPill";
import { projectsApi } from "../api";

const MAX_DESC = 500;

export default function UploadPage({ editMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    title: "",
    description: "",
    tech_stack: [],
    live_url: "",
    github_url: "",
    screenshot_url: "",
    show_ai_analysis: true,
  });
  const [techInput, setTechInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(editMode);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editMode && id) {
      projectsApi.getById(id)
        .then((res) => {
          const p = res.data.data;
          setForm({
            title: p.title || "",
            description: p.description || "",
            tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
            live_url: p.live_url || "",
            github_url: p.github_url || "",
            screenshot_url: p.screenshot_url || "",
            show_ai_analysis: p.show_ai_analysis ?? true,
          });
        })
        .catch(() => {
          setError("Failed to load project for editing.");
        })
        .finally(() => setLoading(false));
    }
  }, [editMode, id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleAddTag = (e) => {
    if (["Enter", ","].includes(e.key) && techInput.trim()) {
      e.preventDefault();
      const tag = techInput.trim().replace(/,$/, "");
      if (tag && !form.tech_stack.includes(tag)) {
        setForm((f) => ({ ...f, tech_stack: [...f.tech_stack, tag] }));
      }
      setTechInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    setForm((f) => ({ ...f, tech_stack: f.tech_stack.filter((t) => t !== tag) }));
  };

  const handleScreenshot = (url) => {
    setForm((f) => ({ ...f, screenshot_url: url || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Project title is required");
      return;
    }

    setSubmitting(true);
    try {
      if (editMode) {
        await projectsApi.update(id, form);
        navigate(`/project/${id}`);
      } else {
        const res = await projectsApi.create(form);
        navigate(`/project/${res.data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish project. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Navbar />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Header */}
        <div className="border-b-2 border-ink px-6 py-5 bg-surface sticky top-0 z-20">
          <h1 className="font-grotesk font-bold text-xl text-on-surface">{editMode ? "Edit Project" : "Publish Your Work"}</h1>
          <p className="label-mono text-on-surface-variant mt-0.5">{editMode ? "Update your project details" : "Share what you've built with the world"}</p>
        </div>

        <div className="max-w-2xl mx-auto p-6">
          {loading ? (
            <p className="font-mono text-sm text-on-surface-variant animate-pulse uppercase text-center mt-10">Loading project...</p>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="label-mono block mb-1.5">Project Title *</label>
              <input
                name="title"
                type="text"
                placeholder="e.g. EduTrack — Student Progress Dashboard"
                value={form.title}
                onChange={handleChange}
                className="input-brutal"
                required
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-mono">Description</label>
                <span className={`font-mono text-xs ${form.description.length > MAX_DESC ? "text-error" : "text-on-surface-variant"}`}>
                  {form.description.length}/{MAX_DESC}
                </span>
              </div>
              <textarea
                name="description"
                rows={4}
                placeholder="What does your project do? What problem does it solve? What did you learn building it?"
                value={form.description}
                onChange={handleChange}
                className="input-brutal resize-none"
                maxLength={MAX_DESC + 10}
                required
              />
            </div>

            {/* Tech Stack */}
            <div>
              <label className="label-mono block mb-1.5">Tech Stack</label>
              <div className="border-2 border-ink p-3 bg-surface min-h-[52px] flex flex-wrap gap-2 items-center focus-within:shadow-brutal-primary">
                {form.tech_stack.map((tag) => (
                  <span key={tag} className="tech-pill flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-error ml-1"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  list="tech-options"
                  placeholder={form.tech_stack.length === 0 ? "Type a tech and press Enter (e.g. React)" : "Add more..."}
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 min-w-[120px] bg-transparent outline-none font-mono text-sm placeholder-on-surface-variant"
                />
                <datalist id="tech-options">
                  <option value="React" />
                  <option value="Node.js" />
                  <option value="Python" />
                  <option value="Django" />
                  <option value="Flask" />
                  <option value="Next.js" />
                  <option value="Tailwind CSS" />
                  <option value="MongoDB" />
                  <option value="PostgreSQL" />
                  <option value="AWS" />
                  <option value="Docker" />
                  <option value="Java" />
                  <option value="Spring Boot" />
                  <option value="C++" />
                </datalist>
              </div>
              <p className="font-mono text-xs text-on-surface-variant mt-1">Type and press Enter or comma to add</p>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-mono block mb-1.5">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">open_in_new</span>
                  Live URL
                </label>
                <input
                  name="live_url"
                  type="url"
                  placeholder="https://yourproject.com"
                  value={form.live_url}
                  onChange={handleChange}
                  className="input-brutal"
                />
              </div>
              <div>
                <label className="label-mono block mb-1.5">
                  <span className="material-symbols-outlined text-sm align-middle mr-1">code</span>
                  GitHub URL
                </label>
                <input
                  name="github_url"
                  type="url"
                  placeholder="https://github.com/you/repo"
                  value={form.github_url}
                  onChange={handleChange}
                  className="input-brutal"
                />
              </div>
            </div>

            {/* Screenshot upload */}
            <div>
              <label className="label-mono block mb-1.5">Project Screenshot</label>
              <CloudinaryUpload
                onUpload={handleScreenshot}
                label="Upload Screenshot"
                currentUrl={form.screenshot_url || null}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="border border-error bg-error-container px-4 py-3">
                <p className="font-mono text-sm text-on-error-container">{error}</p>
              </div>
            )}

            {/* Privacy Toggle */}
          <div className="flex items-center gap-3 bg-surface p-4 border border-outline shadow-[2px_2px_0px_rgba(0,0,0,1)] mt-8">
            <input
              type="checkbox"
              id="show_ai_analysis"
              name="show_ai_analysis"
              checked={form.show_ai_analysis}
              onChange={handleChange}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
            <label htmlFor="show_ai_analysis" className="font-grotesk font-bold cursor-pointer select-none">
              Make AI Analysis Public
              <p className="font-mono text-xs font-normal text-on-surface-variant mt-0.5">
                If unchecked, only you will be able to see the AI feedback for this project.
              </p>
            </label>
          </div>

          <div className="pt-6">
              <button
                type="submit"
                disabled={submitting || form.description.length > MAX_DESC}
                className="btn-primary w-full justify-center py-4"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    {editMode ? "Updating..." : "Publishing..."}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">{editMode ? "save" : "rocket_launch"}</span>
                    {editMode ? "Save Changes" : "Publish Project"}
                  </>
                )}
              </button>
            </div>
          </form>
          )}
        </div>
      </main>
    </div>
  );
}
