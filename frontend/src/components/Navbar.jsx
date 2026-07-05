import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/feed", icon: "home", label: "FEED" },
  { to: "/upload", icon: "add_circle", label: "UPLOAD" },
  { to: "/", icon: "rocket_launch", label: "EXPLORE", end: true },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen flex-col z-40 w-64 border-r-2 border-ink bg-surface">
        {/* Brand */}
        <div className="p-8 border-b-2 border-ink">
          <NavLink to="/">
            <h1 className="font-mono font-black text-2xl uppercase text-on-surface tracking-tight">
              ShowUp
            </h1>
            <p className="font-mono uppercase tracking-tighter text-xs text-on-surface-variant mt-1">
              PORTFOLIO V1.0
            </p>
          </NavLink>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto py-4">
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all duration-75 active:translate-x-0.5 active:translate-y-0.5 border-l-4 ${
                isActive
                  ? "border-tertiary-container text-on-surface font-bold bg-surface-container-high"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">home</span>
            <span className="font-mono uppercase tracking-tighter text-sm">FEED</span>
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all duration-75 active:translate-x-0.5 active:translate-y-0.5 border-l-4 ${
                isActive
                  ? "border-tertiary-container text-on-surface font-bold bg-surface-container-high"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span className="font-mono uppercase tracking-tighter text-sm">UPLOAD</span>
          </NavLink>

          <NavLink
            to="/leaderboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all duration-75 active:translate-x-0.5 active:translate-y-0.5 border-l-4 ${
                isActive
                  ? "border-tertiary-container text-on-surface font-bold bg-surface-container-high"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">leaderboard</span>
            <span className="font-mono uppercase tracking-tighter text-sm">TOP DEVS</span>
          </NavLink>

          {user && (
            <NavLink
              to={`/u/${user.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-4 transition-all duration-75 active:translate-x-0.5 active:translate-y-0.5 border-l-4 ${
                  isActive
                    ? "border-tertiary-container text-on-surface font-bold bg-surface-container-high"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">person</span>
              <span className="font-mono uppercase tracking-tighter text-sm">PORTFOLIO</span>
            </NavLink>
          )}

          <NavLink
            to="/profile/edit"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 transition-all duration-75 active:translate-x-0.5 active:translate-y-0.5 border-l-4 ${
                isActive
                  ? "border-tertiary-container text-on-surface font-bold bg-surface-container-high"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="font-mono uppercase tracking-tighter text-sm">SETTINGS</span>
          </NavLink>
        </div>

        {/* User + Logout */}
        {user && (
          <div className="p-4 border-t-2 border-ink">
            <div className="flex items-center gap-3 mb-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-9 h-9 brutalist-border object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-primary-container border-2 border-ink flex items-center justify-center flex-shrink-0">
                  <span className="font-mono font-bold text-sm text-on-primary-container">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-on-surface truncate">{user.name}</p>
                <p className="font-mono text-xs text-on-surface-variant truncate">{user.college}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-on-surface-variant hover:text-error hover:bg-error-container transition-colors font-mono text-xs uppercase"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              SIGN OUT
            </button>
          </div>
        )}
      </nav>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t-2 border-ink flex">
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-on-surface bg-surface-container-high" : "text-on-surface-variant"
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">home</span>
          <span className="font-mono text-[10px] uppercase">Feed</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-on-surface bg-surface-container-high" : "text-on-surface-variant"
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          <span className="font-mono text-[10px] uppercase">Upload</span>
        </NavLink>

        {user ? (
          <NavLink
            to={`/u/${user.id}`}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? "text-on-surface bg-surface-container-high" : "text-on-surface-variant"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">person</span>
            <span className="font-mono text-[10px] uppercase">Me</span>
          </NavLink>
        ) : (
          <NavLink
            to="/auth"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? "text-on-surface bg-surface-container-high" : "text-on-surface-variant"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">login</span>
            <span className="font-mono text-[10px] uppercase">Login</span>
          </NavLink>
        )}
      </nav>
    </>
  );
}
