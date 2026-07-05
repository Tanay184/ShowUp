import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./components/AuthGuard";
import { useAuth } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import FeedPage from "./pages/FeedPage";
import UploadPage from "./pages/UploadPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import StudentPortfolioPage from "./pages/StudentPortfolioPage";
import EditProfilePage from "./pages/EditProfilePage";
import ComingSoonPage from "./pages/ComingSoonPage";

// Redirects logged-in users away from public-only pages (/ and /auth)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // wait for auth check
  if (user) return <Navigate to="/feed" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes — redirect to /feed if already logged in */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Always public */}
          <Route path="/u/:student_id" element={<StudentPortfolioPage />} />
          <Route path="/project/:id" element={<ProjectDetailPage />} />
          <Route path="/leaderboard" element={<ComingSoonPage />} />

          {/* Protected routes */}
          <Route path="/feed" element={<AuthGuard><FeedPage /></AuthGuard>} />
          <Route path="/upload" element={<AuthGuard><UploadPage /></AuthGuard>} />
          <Route path="/project/:id/edit" element={<AuthGuard><UploadPage editMode={true} /></AuthGuard>} />
          <Route path="/profile/edit" element={<AuthGuard><EditProfilePage /></AuthGuard>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
