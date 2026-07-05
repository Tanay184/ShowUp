import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, TOKEN_KEYS } from "../api";

const AuthContext = createContext(null);

// ── Helpers ──────────────────────────────────────────────────────
function _saveTokens(access_token, refresh_token, student) {
  localStorage.setItem(TOKEN_KEYS.access, access_token);
  localStorage.setItem(TOKEN_KEYS.refresh, refresh_token);
  localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(student));
}

function _clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  localStorage.removeItem(TOKEN_KEYS.user);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(TOKEN_KEYS.user);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // ── Verify access token on mount; silent refresh if expired ─────
  useEffect(() => {
    const accessToken = localStorage.getItem(TOKEN_KEYS.access);
    const refreshToken = localStorage.getItem(TOKEN_KEYS.refresh);

    if (!accessToken && !refreshToken) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((res) => {
        const student = res.data.data;
        setUser(student);
        localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(student));
      })
      .catch(async () => {
        // /me failed — try to refresh silently
        if (refreshToken) {
          try {
            const res = await authApi.refresh(refreshToken);
            const newAccess = res.data.data.access_token;
            localStorage.setItem(TOKEN_KEYS.access, newAccess);
            // Retry /me
            const meRes = await authApi.me();
            const student = meRes.data.data;
            setUser(student);
            localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(student));
          } catch {
            // Refresh also failed — clear everything
            _clearTokens();
            setUser(null);
          }
        } else {
          _clearTokens();
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ── login (email + password) ─────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { access_token, refresh_token, student } = res.data.data;
    _saveTokens(access_token, refresh_token, student);
    setUser(student);
    return student;
  }, []);

  // ── register (email + password) ──────────────────────────────────
  const register = useCallback(async (name, email, college, password) => {
    const res = await authApi.register({ name, email, college, password });
    const { access_token, refresh_token, student } = res.data.data;
    _saveTokens(access_token, refresh_token, student);
    setUser(student);
    return student;
  }, []);

  // ── verifyOtp ────────────────────────────────────────────────────
  const verifyOtp = useCallback(async (data) => {
    const res = await authApi.verifyOtp(data);
    const { access_token, refresh_token, student } = res.data.data;
    _saveTokens(access_token, refresh_token, student);
    setUser(student);
    return student;
  }, []);

  // ── logout — clears BOTH tokens + user ──────────────────────────
  const logout = useCallback(() => {
    authApi.logout(); // best-effort server notification
    _clearTokens();
    setUser(null);
    window.location.href = "/auth";
  }, []);

  // ── updateUser — used by EditProfile etc. ────────────────────────
  const updateUser = useCallback((updated) => {
    setUser(updated);
    localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
