import os
import time
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import bcrypt
from flask import Blueprint, request, jsonify, redirect, url_for, session, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity,
)
from app import db
from app.models import Student

auth_bp = Blueprint("auth", __name__)

# ─── In-memory OTP store {email: {otp, expires_at, attempts, last_sent_at}} ─
# Fine for v1 — replace with Redis in production
_otp_store: dict = {}

# ─── In-memory IP rate-limit store {ip: [timestamps]} ────────────────────────
_ip_send_log: dict = {}

IP_LIMIT_COUNT = 5       # max OTP sends per IP per window
IP_LIMIT_WINDOW = 600    # 10 minutes in seconds
OTP_RESEND_COOLDOWN = 60 # seconds between resends for same email


def _success(data=None, message=""):
    return jsonify({"success": True, "data": data, "message": message})


def _error(message, status=400, code=None):
    body = {"success": False, "data": None, "message": message}
    if code:
        body["code"] = code
    return jsonify(body), status


def _make_tokens(student_id: str):
    """Return (access_token, refresh_token) pair for a student id."""
    access_token = create_access_token(identity=str(student_id))
    refresh_token = create_refresh_token(identity=str(student_id))
    return access_token, refresh_token


# ═══════════════════════════════════════════════════════════════════
# EMAIL / PASSWORD AUTH
# ═══════════════════════════════════════════════════════════════════

@auth_bp.route("/register", methods=["POST"])
def register():
    body = request.get_json()
    if not body:
        return _error("Request body required")

    name = body.get("name", "").strip()
    email = body.get("email", "").strip().lower()
    college = body.get("college", "").strip()
    password = body.get("password", "")

    if not all([name, email, college, password]):
        return _error("name, email, college, and password are required")

    if len(password) < 6:
        return _error("Password must be at least 6 characters")

    if Student.query.filter_by(email=email).first():
        return _error("An account with this email already exists")

    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    student = Student(
        name=name,
        email=email,
        college=college,
        password_hash=pw_hash,
    )
    db.session.add(student)
    db.session.commit()

    try:
        from app.email_service import send_welcome_email
        send_welcome_email(name, email)
    except Exception:
        pass

    access_token, refresh_token = _make_tokens(student.id)
    return _success(
        {"access_token": access_token, "refresh_token": refresh_token,
         "student": student.to_dict(include_email=True)},
        "Account created successfully! 🎉"
    ), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json()
    if not body:
        return _error("Request body required")

    email = body.get("email", "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return _error("email and password are required")

    student = Student.query.filter_by(email=email).first()
    if not student:
        return _error("Invalid email or password", 401)

    if not student.password_hash:
        return _error("This account uses Google Sign-In. Please log in with Google.", 401)

    if not bcrypt.checkpw(password.encode("utf-8"), student.password_hash.encode("utf-8")):
        return _error("Invalid email or password", 401)

    access_token, refresh_token = _make_tokens(student.id)
    return _success(
        {"access_token": access_token, "refresh_token": refresh_token,
         "student": student.to_dict(include_email=True)},
        "Welcome back! 👋"
    )


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    student_id = get_jwt_identity()
    student = Student.query.get(student_id)
    if not student:
        return _error("Student not found", 404)
    return _success(student.to_dict(include_email=True))


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Issue a new access token using a valid refresh token."""
    student_id = get_jwt_identity()
    student = Student.query.get(student_id)
    if not student:
        return _error("Student not found", 404)
    new_access_token = create_access_token(identity=str(student_id))
    return _success(
        {"access_token": new_access_token},
        "Token refreshed"
    )


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Client-side logout endpoint — no server state needed for stateless JWTs."""
    return _success(None, "Logged out successfully")


# ═══════════════════════════════════════════════════════════════════
# GOOGLE OAUTH
# ═══════════════════════════════════════════════════════════════════

@auth_bp.route("/google")
def google_login():
    """Redirect to Google OAuth consent screen via flask-dance."""
    try:
        from flask import session
        # Always clear any stale flask-dance token to force fresh account selection
        session.pop("google_oauth_token", None)
        return redirect(url_for("google.login"))
    except Exception as e:
        return _error(f"Google OAuth not configured: {str(e)}", 500)


@auth_bp.route("/google/callback")
def google_callback():
    """Handle Google OAuth callback — create/find user, return JWTs via redirect."""
    try:
        from flask_dance.contrib.google import google
        if not google.authorized:
            return _error("Google auth failed — not authorised", 401)

        resp = google.get("/oauth2/v2/userinfo")
        if not resp.ok:
            return _error("Failed to fetch Google profile", 401)

        info = resp.json()
        email = info["email"].lower()
        name = info.get("name", email.split("@")[0])
        avatar_url = info.get("picture")

        student = Student.query.filter_by(email=email).first()
        if not student:
            student = Student(
                name=name,
                email=email,
                avatar_url=avatar_url,
                college="Not set",
                is_google_auth=True,
                email_verified=True,
            )
            db.session.add(student)
            db.session.commit()
        else:
            if avatar_url and not student.avatar_url:
                student.avatar_url = avatar_url
                db.session.commit()

        access_token, refresh_token = _make_tokens(student.id)
        is_new = not student.college or student.college == "Not set"
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return redirect(
            f"{frontend_url}/auth/callback"
            f"?access_token={access_token}"
            f"&refresh_token={refresh_token}"
            f"&is_new={str(is_new).lower()}"
        )

    except Exception as e:
        error_msg = str(e)
        if "token_expired" in error_msg.lower() or "expired" in error_msg.lower():
            session.pop("google_oauth_token", None)
            session.clear()
            return redirect(url_for("google.login"))
        return _error(f"Google auth error: {error_msg}", 500)


# ═══════════════════════════════════════════════════════════════════
# EMAIL OTP AUTH
# ═══════════════════════════════════════════════════════════════════

def _generate_otp(email: str) -> str:
    """Create a 6-digit numeric OTP, store with 10-min TTL."""
    otp = str(random.randint(100000, 999999))
    existing = _otp_store.get(email, {})
    _otp_store[email] = {
        "otp": otp,
        "expires_at": time.time() + 600,   # 10 minutes
        "attempts": 0,
        "last_sent_at": time.time(),
        # Preserve block if it was already set
        "blocked": existing.get("blocked", False),
        "block_until": existing.get("block_until", 0),
    }
    return otp


def _send_otp_email(email: str, otp: str, name: str = "there"):
    """Dispatch OTP email via Gmail SMTP."""
    gmail_address = os.getenv("GMAIL_ADDRESS", "")
    gmail_password = os.getenv("GMAIL_APP_PASSWORD", "")

    if not gmail_address or not gmail_password:
        raise RuntimeError("GMAIL_ADDRESS or GMAIL_APP_PASSWORD not set in environment")

    html_content = f"""
    <div style="font-family:'IBM Plex Mono',monospace;background:#fdf7ff;color:#1d1b20;padding:40px;max-width:480px;margin:0 auto;">
      <h1 style="font-size:22px;font-weight:900;text-transform:uppercase;border-bottom:3px solid #2A2A2A;padding-bottom:12px;">ShowUp</h1>
      <p style="margin-top:24px;">Hey {name},</p>
      <p>Your verification code is:</p>
      <div style="background:#e8def8;padding:24px;text-align:center;font-size:32px;font-weight:900;letter-spacing:8px;border:2px solid #2A2A2A;box-shadow:4px 4px 0 #4f378a;margin:32px 0;">
        {otp}
      </div>
      <p style="font-size:14px;color:#49454f;">Enter this code within 10 minutes to verify your account.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp} is your ShowUp verification code"
    msg["From"] = f"ShowUp <{gmail_address}>"
    msg["To"] = email

    msg.attach(MIMEText(html_content, "html"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(gmail_address, gmail_password)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        raise RuntimeError(f"Failed to send email via Gmail SMTP: {str(e)}")


def _check_ip_rate_limit(ip: str) -> bool:
    """Return True if the IP is within the allowed limit, False if exceeded."""
    now = time.time()
    timestamps = _ip_send_log.get(ip, [])
    # Purge entries older than the window
    timestamps = [t for t in timestamps if now - t < IP_LIMIT_WINDOW]
    _ip_send_log[ip] = timestamps
    if len(timestamps) >= IP_LIMIT_COUNT:
        return False
    timestamps.append(now)
    _ip_send_log[ip] = timestamps
    return True


@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():
    """Send OTP to the given email with rate-limiting."""
    ip = request.remote_addr or "unknown"

    # IP-level rate limit: 5 sends per 10 min per IP
    if not _check_ip_rate_limit(ip):
        return _error(
            "Too many OTP requests from this device. Please wait 10 minutes.",
            429
        )

    body = request.get_json() or {}
    email = body.get("email", "").strip().lower()
    name = body.get("name", "there")

    if not email or "@" not in email:
        return _error("Valid email required")

    now = time.time()
    existing = _otp_store.get(email, {})

    # Block if account is locked after 5 wrong attempts
    if existing.get("blocked") and now < existing.get("block_until", 0):
        wait = int(existing["block_until"] - now)
        return _error(
            f"Account temporarily blocked. Try again in {wait} seconds.",
            429
        )

    # Resend cooldown: 60 seconds between sends for same email
    last_sent = existing.get("last_sent_at", 0)
    if now - last_sent < OTP_RESEND_COOLDOWN:
        wait = int(OTP_RESEND_COOLDOWN - (now - last_sent))
        return _error(
            f"Please wait {wait} seconds before requesting a new code.",
            429
        )

    otp = _generate_otp(email)
    print(f"\n[DEV / LOCAL] Your OTP for {email} is: {otp}\n")
    try:
        _send_otp_email(email, otp, name)
        return _success({"email": email}, f"Verification code sent to {email}")
    except Exception:
        return _success({"email": email, "dev_otp": otp}, "OTP generated (check console in dev)")


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """Verify OTP and return JWTs. Creates account if new user."""
    body = request.get_json() or {}
    email = body.get("email", "").strip().lower()
    otp = body.get("otp", "").strip()
    name = body.get("name", "").strip()
    college = body.get("college", "").strip()

    if not email or not otp:
        return _error("email and otp are required")

    now = time.time()
    stored = _otp_store.get(email)

    if not stored:
        return _error("No OTP found for this email. Request a new one.")

    # Check if blocked
    if stored.get("blocked") and now < stored.get("block_until", 0):
        wait = int(stored["block_until"] - now)
        return _error(
            f"Too many wrong attempts. Try again in {wait} seconds.",
            429
        )

    if now > stored["expires_at"]:
        _otp_store.pop(email, None)
        return _error("OTP expired. Request a new one.")

    if stored["otp"] != otp:
        attempts = stored.get("attempts", 0) + 1
        _otp_store[email]["attempts"] = attempts
        remaining = max(0, 5 - attempts)
        if attempts >= 5:
            # Block for 10 minutes
            _otp_store[email]["blocked"] = True
            _otp_store[email]["block_until"] = now + 600
            return _error(
                "Too many wrong attempts. Please wait 10 minutes before requesting a new code.",
                429
            )
        return _error(f"Incorrect code. {remaining} attempt(s) remaining.")

    # ── OTP is correct ───────────────────────────────────────────────
    student = Student.query.filter_by(email=email).first()
    if not student:
        # New user — need name + college
        if not name or not college:
            return jsonify({
                "success": False,
                "data": None,
                "message": "Name and college are required to create your account.",
                "requires_profile": True,
            }), 400

        # OTP valid and profile info present — consume it
        _otp_store.pop(email, None)

        student = Student(
            name=name,
            email=email,
            college=college,
            email_verified=True,
            is_google_auth=False,
        )
        db.session.add(student)
        db.session.commit()

        try:
            from app.email_service import send_welcome_email
            send_welcome_email(name, email)
        except Exception:
            pass
    else:
        student.email_verified = True
        db.session.commit()

    # Consume OTP
    _otp_store.pop(email, None)

    access_token, refresh_token = _make_tokens(student.id)
    return _success(
        {"access_token": access_token, "refresh_token": refresh_token,
         "student": student.to_dict(include_email=True)},
        "Verified! Welcome to ShowUp 🎉"
    )
