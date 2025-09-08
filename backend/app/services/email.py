import os
import smtplib
from email.message import EmailMessage
from typing import Optional


SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
MAIL_FROM = os.getenv("MAIL_FROM", SMTP_USER or "no-reply@example.com")
DEV_MODE = os.getenv("AUTH_DEV_MODE", "true").lower() in ("1","true","yes")


def send_email(to: str, subject: str, html: str, text: Optional[str] = None) -> bool:
    """Send an email. Falls back to console log if SMTP not configured.

    Returns True if 'sent' (either actually via SMTP or logged in dev mode).
    Returns False only if a configured send fails.
    """
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        # Development fallback: print to stdout so logs show the content
        print("[email:FALLBACK] To=", to, "Subject=", subject)
        print(html)
        return True

    msg = EmailMessage()
    msg["From"] = MAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    if text:
        msg.set_content(text)
    # Add HTML alternative
    msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as smtp:
            # STARTTLS
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASS)
            smtp.send_message(msg)
        return True
    except Exception as e:
        # Do not raise inside auth flows; just log
        print("[email:ERROR]", e)
        return False


def build_reset_link(token: str) -> str:
    base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip('/')
    return f"{base}/reset-password?token={token}"  # front-end page will parse ?token
