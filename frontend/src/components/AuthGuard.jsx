import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center">
          <p className="font-mono font-bold uppercase text-sm text-on-surface-variant animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only redirect Google OAuth users who haven't completed their profile yet.
  // OTP/password users always have college set at signup, so we skip them.
  const isGoogleUserMissingCollege =
    user.is_google_auth &&
    (!user.college || user.college === "Not set" || user.college.trim() === "");

  if (isGoogleUserMissingCollege && location.pathname !== "/profile/edit") {
    return <Navigate to="/profile/edit" replace />;
  }

  return children;
}
