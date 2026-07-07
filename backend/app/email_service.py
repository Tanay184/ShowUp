import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def _gmail_credentials():
    addr = os.getenv("GMAIL_ADDRESS", "")
    pwd  = os.getenv("GMAIL_APP_PASSWORD", "")
    return addr, pwd


def send_otp_email(name: str, email: str, otp: str):
    """Send OTP email via Gmail SMTP SSL (port 465) — works on Render."""
    gmail_address, gmail_password = _gmail_credentials()
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
    msg["From"]    = f"ShowUp <{gmail_address}>"
    msg["To"]      = email
    msg.attach(MIMEText(html_content, "html"))

    # Use SSL on port 465 — faster and more reliable on cloud hosts than STARTTLS/587
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(gmail_address, gmail_password)
        server.send_message(msg)


def send_welcome_email(name: str, email: str):
    """Send welcome email via Gmail SMTP SSL on new registration."""
    gmail_address, gmail_password = _gmail_credentials()
    if not gmail_address or not gmail_password:
        return  # Skip silently if not configured

    html_content = f"""
    <div style="font-family:'IBM Plex Mono',monospace;background:#fdf7ff;padding:40px;max-width:600px;margin:0 auto;">
        <h1 style="font-size:24px;font-weight:900;text-transform:uppercase;border-bottom:3px solid #2A2A2A;padding-bottom:16px;">
            ShowUp
        </h1>
        <p style="font-size:18px;margin-top:24px;">Hey {name} 👋</p>
        <p style="font-size:16px;line-height:1.6;color:#494551;">
            Your portfolio is live. Now it's time to <strong>show up</strong>.
        </p>
        <p style="font-size:16px;line-height:1.6;color:#494551;">
            Upload your first project, get AI-powered feedback, and start building credibility — one project at a time.
        </p>
        <a href="https://show-up-ashy.vercel.app/upload"
           style="display:inline-block;background:#2A2A2A;color:#fff;padding:14px 28px;text-decoration:none;
                  font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-top:24px;
                  border:2px solid #2A2A2A;box-shadow:4px 4px 0 #4f378a;">
            Upload Your First Project →
        </a>
        <p style="margin-top:40px;font-size:12px;color:#7a7582;">
            You're registered on ShowUp — the student portfolio platform.
        </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome to ShowUp 🎉 — Your Work Speaks First"
    msg["From"]    = f"ShowUp <{gmail_address}>"
    msg["To"]      = email
    msg.attach(MIMEText(html_content, "html"))

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(gmail_address, gmail_password)
            server.send_message(msg)
    except Exception:
        pass  # Never crash registration due to welcome email failure
