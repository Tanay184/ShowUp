import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CloudinaryUpload from "../components/CloudinaryUpload";
import { studentsApi } from "../api";
import { useAuth } from "../context/AuthContext";

export default function EditProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    college: user?.college || "",
    course: user?.course || "",
    college_start_year: user?.college_start_year || "",
    college_end_year: user?.college_end_year || "",
    skills: user?.skills ? user.skills.join(", ") : "",
    bio: user?.bio || "",
    avatar_url: user?.avatar_url || "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyFeedback, setSurveyFeedback] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setSuccess("");
    setError("");
  };

  const handleAvatarUpload = (url) => {
    setForm((f) => ({ ...f, avatar_url: url || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await studentsApi.update(user.id, form);
      updateUser(res.data.data);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await studentsApi.delete(user.id);
      setShowDeleteModal(false);
      setShowSurveyModal(true);
    } catch (err) {
      alert("Failed to delete account.");
      setDeleting(false);
    }
  };

  const handleSurveySubmit = async () => {
    try {
      if (surveyFeedback.trim()) {
        await studentsApi.submitExitSurvey({ email: user.email, feedback: surveyFeedback });
      }
    } catch (err) {
      console.error(err);
    } finally {
      logout();
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <Navbar />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        {/* Header */}
        <div className="border-b-2 border-ink px-6 py-5 sticky top-0 z-20 bg-surface">
          <h1 className="font-grotesk font-bold text-xl text-on-surface">Edit Profile</h1>
          <p className="label-mono text-on-surface-variant mt-0.5">Update your public portfolio info</p>
        </div>

        <div className="max-w-xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div>
              <label className="label-mono block mb-1.5">Profile Photo</label>
              <div className="flex items-start gap-4">
                {/* Current avatar preview */}
                <div className="flex-shrink-0">
                  {form.avatar_url ? (
                    <img
                      src={form.avatar_url}
                      alt="Avatar"
                      className="w-16 h-16 border-2 border-ink object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary-container border-2 border-ink flex items-center justify-center">
                      <span className="font-mono font-black text-xl text-on-primary-container">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <CloudinaryUpload
                    onUpload={handleAvatarUpload}
                    label="Upload Photo"
                    currentUrl={form.avatar_url || null}
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="label-mono block mb-1.5">Full Name</label>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="input-brutal"
                placeholder="Your full name"
                required
              />
            </div>

            {/* College */}
            <div>
              <label className="label-mono block mb-1.5">College</label>
              <input
                name="college"
                type="text"
                value={form.college}
                onChange={handleChange}
                className="input-brutal"
                placeholder="IIT Delhi, NIT Trichy..."
                required
              />
            </div>

            {/* Course & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="label-mono block mb-1.5">Start Year</label>
                <input
                  name="college_start_year"
                  type="number"
                  min="1990"
                  max="2030"
                  value={form.college_start_year}
                  onChange={handleChange}
                  className="input-brutal w-full"
                  placeholder="2024"
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="label-mono block mb-1.5">End Year</label>
                <input
                  name="college_end_year"
                  type="number"
                  min="1990"
                  max="2035"
                  value={form.college_end_year}
                  onChange={handleChange}
                  className="input-brutal w-full"
                  placeholder="2028"
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="label-mono block mb-1.5">Course</label>
                <input
                  name="course"
                  type="text"
                  list="course-options"
                  value={form.course}
                  onChange={handleChange}
                  className="input-brutal w-full"
                  placeholder="B.Tech CS..."
                  required
                />
                <datalist id="course-options">
                  <option value="B.Tech Computer Science" />
                  <option value="B.Tech IT" />
                  <option value="B.Tech Electronics" />
                  <option value="BCA" />
                  <option value="MCA" />
                  <option value="B.Sc Computer Science" />
                  <option value="Diploma in CS" />
                </datalist>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="label-mono block mb-1.5">Skills (comma separated)</label>
              <input
                name="skills"
                type="text"
                value={form.skills}
                onChange={handleChange}
                className="input-brutal"
                placeholder="React, Python, Tailwind, UI/UX..."
              />
            </div>

            {/* Bio */}
            <div>
              <label className="label-mono block mb-1.5">Bio</label>
              <textarea
                name="bio"
                rows={4}
                value={form.bio}
                onChange={handleChange}
                className="input-brutal resize-none"
                placeholder="Tell the world what you build, what you're learning, and what you're looking for..."
              />
            </div>

            {/* Portfolio link */}
            <div className="border-2 border-ink p-4 bg-surface-container-low">
              <p className="label-mono mb-2">Your Portfolio Link</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm text-primary flex-1 truncate">
                  {window.location.origin}/u/{user?.id}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/u/${user?.id}`);
                  }}
                  className="border border-ink p-2 hover:bg-surface-container transition-colors flex-shrink-0"
                  title="Copy link"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              </div>
            </div>

            {/* Feedback */}
            {success && (
              <div className="border border-green-600 bg-green-50 px-4 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                <p className="font-mono text-sm text-green-700">{success}</p>
              </div>
            )}
            {error && (
              <div className="border border-error bg-error-container px-4 py-3">
                <p className="font-mono text-sm text-on-error-container">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 justify-center py-3.5"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/u/${user?.id}`)}
                className="btn-secondary py-3.5 px-5"
              >
                View Portfolio
              </button>
            </div>

            {/* Delete Account Section */}
            <div className="border-t-2 border-ink pt-6 mt-8">
              <h2 className="font-grotesk font-bold text-lg text-error mb-2">Danger Zone</h2>
              <p className="font-mono text-sm text-on-surface-variant mb-4">
                Once you delete your account, there is no going back. All your projects, reviews, and profile data will be permanently wiped.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="border-2 border-error text-error hover:bg-error hover:text-white px-4 py-2 font-mono text-xs uppercase font-bold transition-colors"
              >
                Delete Account
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-ink p-6 max-w-md w-full shadow-[8px_8px_0px_#111]">
            <h2 className="font-grotesk font-bold text-xl text-error mb-2">Are you absolutely sure?</h2>
            <p className="text-on-surface mb-6">
              This action cannot be undone. This will permanently delete your account, projects, and reviews from ShowUp.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary py-2"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="bg-error text-white border-2 border-ink px-4 py-2 font-mono text-xs uppercase font-bold hover:opacity-90"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Survey Modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border-4 border-ink p-6 max-w-md w-full shadow-[8px_8px_0px_#111]">
            <h2 className="font-grotesk font-bold text-xl text-on-surface mb-2">We're sorry to see you go</h2>
            <p className="text-on-surface-variant text-sm mb-4">
              Your account has been deleted. Could you tell us why you decided to leave? This helps us improve ShowUp.
            </p>
            <textarea
              className="input-brutal w-full mb-4 resize-none"
              rows={4}
              placeholder="Your feedback..."
              value={surveyFeedback}
              onChange={(e) => setSurveyFeedback(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSurveySubmit}
                className="btn-primary py-2"
              >
                Submit & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
