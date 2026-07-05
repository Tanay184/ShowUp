import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";

// ─── Modes ────────────────────────────────────────────
// "choose"   → landing: Google btn + "Email OTP" + "Password" toggle
// "otp-email"→ enter email
// "otp-code" → enter 6-digit OTP (+ name/college if new user)
// "password" → classic email + password login
// "register" → classic email + password register

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, verifyOtp } = useAuth();

  const [mode, setMode] = useState("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP state
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [requiresProfile, setRequiresProfile] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: "", college: "" });
  const otpRefs = useRef([]);

  // Password state
  const [pwForm, setPwForm] = useState({ name: "", email: "", college: "", password: "" });
  const [pwTab, setPwTab] = useState("login");

  const clearError = () => setError("");

  // ─── Google OAuth ─────────────────────────────────
  const handleGoogle = () => {
    authApi.googleLogin(); // triggers full-page redirect
  };

  // ─── OTP: step 1 — send OTP ──────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail.trim() || !otpEmail.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.sendOtp({ email: otpEmail.trim().toLowerCase() });
      setOtpSent(true);
      setMode("otp-code");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP digit input ─────────────────────────────
  const handleOtpDigit = (i, val) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otpCode];
    next[i] = digit;
    setOtpCode(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otpCode[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtpCode(text.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ─── OTP: step 2 — verify ────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyOtp({
        email: otpEmail,
        otp: code,
        name: newUserForm.name,
        college: newUserForm.college,
      });
      navigate("/feed", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Verification failed";
      if (err.response?.data?.requires_profile) {
        setRequiresProfile(true);
        setError("Please enter your name and college to create your account.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Password auth ────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (pwTab === "login") {
        await login(pwForm.email, pwForm.password);
      } else {
        if (!pwForm.name || !pwForm.email || !pwForm.college || !pwForm.password) {
          setError("All fields are required");
          return;
        }
        await register(pwForm.name, pwForm.email, pwForm.college, pwForm.password);
      }
      navigate("/feed");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="border-b-2 border-ink px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-mono font-black text-xl uppercase text-on-surface">ShowUp</a>
        <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">Auth</span>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="border-2 border-ink bg-surface" style={{ boxShadow: "6px 6px 0 #4f378a" }}>

            {/* ── CHOOSE MODE ── */}
            {mode === "choose" && (
              <div className="p-8">
                <h1 className="font-grotesk font-bold text-2xl text-on-surface mb-1">
                  Welcome to ShowUp.
                </h1>
                <p className="font-mono text-xs text-on-surface-variant uppercase mb-8">
                  Your work speaks first.
                </p>

                {/* Google */}
                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center gap-3 border-2 border-ink px-4 py-3.5 font-mono font-bold text-sm uppercase hover:bg-surface-container transition-colors mb-3"
                  style={{ boxShadow: "3px 3px 0 #2A2A2A" }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-outline-variant" />
                  <span className="font-mono text-xs text-on-surface-variant uppercase">or</span>
                  <div className="flex-1 h-px bg-outline-variant" />
                </div>

                {/* OTP */}
                <button
                  onClick={() => { setMode("otp-email"); clearError(); }}
                  className="btn-primary w-full justify-center py-3.5 mb-3"
                >
                  <span className="material-symbols-outlined text-base">mail</span>
                  Continue with Email OTP
                </button>

                {/* Password */}
                <button
                  onClick={() => { setMode("password"); clearError(); }}
                  className="btn-secondary w-full justify-center py-3.5"
                >
                  <span className="material-symbols-outlined text-base">lock</span>
                  Sign in with Password
                </button>

                {error && (
                  <p className="font-mono text-xs text-error mt-4 text-center">{error}</p>
                )}
              </div>
            )}

            {/* ── OTP: ENTER EMAIL ── */}
            {mode === "otp-email" && (
              <div className="p-8">
                <button
                  onClick={() => { setMode("choose"); clearError(); }}
                  className="flex items-center gap-1 font-mono text-xs text-on-surface-variant uppercase mb-6 hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
                </button>
                <h2 className="font-grotesk font-bold text-xl text-on-surface mb-1">Enter your email</h2>
                <p className="font-mono text-xs text-on-surface-variant uppercase mb-6">
                  We'll send a 6-digit code — no password needed
                </p>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="label-mono block mb-1.5">Email address</label>
                    <input
                      type="email"
                      placeholder="you@college.edu"
                      value={otpEmail}
                      onChange={(e) => { setOtpEmail(e.target.value); clearError(); }}
                      className="input-brutal"
                      autoFocus
                      required
                    />
                  </div>
                  {error && <p className="font-mono text-xs text-error">{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4">
                    {loading ? (
                      <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Sending...</>
                    ) : (
                      <><span className="material-symbols-outlined text-base">send</span>Send Verification Code</>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── OTP: ENTER CODE ── */}
            {mode === "otp-code" && (
              <div className="p-8">
                <button
                  onClick={() => { setMode("otp-email"); setOtpCode(["","","","","",""]); clearError(); }}
                  className="flex items-center gap-1 font-mono text-xs text-on-surface-variant uppercase mb-6 hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
                </button>

                <h2 className="font-grotesk font-bold text-xl text-on-surface mb-1">Check your email</h2>
                <p className="font-mono text-xs text-on-surface-variant uppercase mb-6">
                  Code sent to <span className="text-primary">{otpEmail}</span>
                </p>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  {/* 6-box OTP input */}
                  <div>
                    <label className="label-mono block mb-2">Verification Code</label>
                    <div className="flex gap-2" onPaste={handleOtpPaste}>
                      {otpCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigit(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-full aspect-square text-center font-mono font-black text-xl border-2 border-ink bg-surface focus:outline-none focus:shadow-brutal-primary transition-shadow"
                          style={digit ? { boxShadow: "3px 3px 0 #4f378a" } : {}}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {/* New user: name + college */}
                  {requiresProfile && (
                    <div className="space-y-3 border-t-2 border-ink pt-4">
                      <p className="label-mono text-on-surface-variant">Create your profile</p>
                      <div>
                        <label className="label-mono block mb-1.5">Full Name</label>
                        <input
                          type="text"
                          placeholder="Arjun Sharma"
                          value={newUserForm.name}
                          onChange={(e) => setNewUserForm(f => ({ ...f, name: e.target.value }))}
                          className="input-brutal"
                          required
                        />
                      </div>
                      <div>
                        <label className="label-mono block mb-1.5">College</label>
                        <input
                          type="text"
                          placeholder="IIT Delhi, NIT Trichy..."
                          value={newUserForm.college}
                          onChange={(e) => setNewUserForm(f => ({ ...f, college: e.target.value }))}
                          className="input-brutal"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="font-mono text-xs text-error">{error}</p>}

                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4">
                    {loading ? (
                      <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Verifying...</>
                    ) : (
                      <><span className="material-symbols-outlined text-base">verified</span>Verify & Sign In</>
                    )}
                  </button>

                  <p className="text-center font-mono text-xs text-on-surface-variant">
                    Didn't receive it?{" "}
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-primary underline"
                    >
                      Resend code
                    </button>
                  </p>
                </form>
              </div>
            )}

            {/* ── PASSWORD AUTH ── */}
            {(mode === "password" || mode === "register") && (
              <>
                {/* Tabs */}
                <div className="grid grid-cols-2 border-b-2 border-ink">
                  <button
                    onClick={() => { setPwTab("login"); clearError(); }}
                    className={`py-4 font-mono font-bold text-sm uppercase tracking-wider transition-colors border-r-2 border-ink ${
                      pwTab === "login" ? "bg-ink text-surface" : "bg-surface text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setPwTab("register"); clearError(); }}
                    className={`py-4 font-mono font-bold text-sm uppercase tracking-wider transition-colors ${
                      pwTab === "register" ? "bg-ink text-surface" : "bg-surface text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    Register
                  </button>
                </div>

                <div className="p-8">
                  <button
                    onClick={() => { setMode("choose"); clearError(); }}
                    className="flex items-center gap-1 font-mono text-xs text-on-surface-variant uppercase mb-5 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Other sign-in options
                  </button>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {pwTab === "register" && (
                      <div>
                        <label className="label-mono block mb-1.5">Full Name</label>
                        <input name="name" type="text" placeholder="Arjun Sharma"
                          value={pwForm.name}
                          onChange={(e) => { setPwForm(f => ({ ...f, name: e.target.value })); clearError(); }}
                          className="input-brutal" required />
                      </div>
                    )}
                    <div>
                      <label className="label-mono block mb-1.5">Email</label>
                      <input name="email" type="email" placeholder="you@college.edu"
                        value={pwForm.email}
                        onChange={(e) => { setPwForm(f => ({ ...f, email: e.target.value })); clearError(); }}
                        className="input-brutal" required />
                    </div>
                    {pwTab === "register" && (
                      <div>
                        <label className="label-mono block mb-1.5">College</label>
                        <input name="college" type="text" placeholder="IIT Delhi, NIT Trichy..."
                          value={pwForm.college}
                          onChange={(e) => { setPwForm(f => ({ ...f, college: e.target.value })); clearError(); }}
                          className="input-brutal" required />
                      </div>
                    )}
                    <div>
                      <label className="label-mono block mb-1.5">Password</label>
                      <input name="password" type="password" placeholder="Min. 6 characters"
                        value={pwForm.password}
                        onChange={(e) => { setPwForm(f => ({ ...f, password: e.target.value })); clearError(); }}
                        className="input-brutal" required />
                    </div>

                    {error && (
                      <div className="border border-error bg-error-container px-3 py-2">
                        <p className="font-mono text-xs text-on-error-container">{error}</p>
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4 mt-2">
                      {loading ? (
                        <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          {pwTab === "login" ? "Signing in..." : "Creating account..."}</>
                      ) : (
                        <><span className="material-symbols-outlined text-base">
                          {pwTab === "login" ? "login" : "person_add"}
                        </span>
                          {pwTab === "login" ? "Sign In" : "Create Account"}</>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
