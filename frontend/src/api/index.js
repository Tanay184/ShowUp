import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Storage keys
export const TOKEN_KEYS = {
  access: "showup_access_token",
  refresh: "showup_refresh_token",
  user: "showup_user",
};

// Base axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor — attach access token ───────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEYS.access);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — silent refresh on TOKEN_EXPIRED ──────
let _isRefreshing = false;
let _refreshQueue = []; // queued requests waiting for refresh

function _processQueue(error, token = null) {
  _refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  _refreshQueue = [];
}

function _fullLogout() {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
  localStorage.removeItem(TOKEN_KEYS.user);
  window.location.href = "/auth";
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const code = err.response?.data?.code;
    const status = err.response?.status;

    // If access token is expired → try silent refresh
    if (status === 401 && code === "TOKEN_EXPIRED" && !originalRequest._retry) {
      const refreshToken = localStorage.getItem(TOKEN_KEYS.refresh);
      if (!refreshToken) {
        _fullLogout();
        return Promise.reject(err);
      }

      if (_isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          _refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );
        const newAccessToken = res.data.data.access_token;
        localStorage.setItem(TOKEN_KEYS.access, newAccessToken);
        _processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        _processQueue(refreshErr, null);
        _fullLogout();
        return Promise.reject(refreshErr);
      } finally {
        _isRefreshing = false;
      }
    }

    // For any other 401 (TOKEN_INVALID, TOKEN_MISSING etc.) → full logout
    if (status === 401 && !originalRequest._retry) {
      _fullLogout();
    }

    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  refresh: (refreshToken) =>
    axios.post(
      `${API_URL}/api/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    ),
  sendOtp: (data) => api.post("/api/auth/send-otp", data),
  verifyOtp: (data) => api.post("/api/auth/verify-otp", data),
  logout: () => api.post("/api/auth/logout").catch(() => {}),
  googleLogin: () => {
    window.location.href = `${API_URL}/api/auth/google`;
  },
};

// ─── Projects ────────────────────────────────────────
export const projectsApi = {
  list: (params) => api.get("/api/projects", { params }),
  create: (data) => api.post("/api/projects", data),
  getById: (id) => api.get(`/api/projects/${id}`),
  recordView: (id) => api.post(`/api/projects/${id}/view`),
  update: (id, data) => api.put(`/api/projects/${id}`, data),
  delete: (id) => api.delete(`/api/projects/${id}`),
  byStudent: (studentId) => api.get(`/api/projects/student/${studentId}`),
  analyse: (id, data = {}) => api.post(`/api/projects/${id}/analyse`, data),
  queueStatus: () => api.get("/api/projects/queue/status"),
  analysisHistory: (id) => api.get(`/api/projects/${id}/analysis-history`),
};

// ─── Students ────────────────────────────────────────
export const studentsApi = {
  getById: (id) => api.get(`/api/students/${id}`),
  update: (id, data) => api.put(`/api/students/${id}`, data),
  leaderboard: () => api.get("/api/students/leaderboard"),
  delete: (id) => api.delete(`/api/students/${id}`),
  submitExitSurvey: (data) => api.post("/api/students/exit-survey", data),
};

// ─── Feed ────────────────────────────────────────────
export const feedApi = {
  personalised: (params) => api.get("/api/feed", { params }),
  trending: (params) => api.get("/api/feed/trending", { params }),
  stats: () => api.get("/api/feed/stats"),
};

export default api;
