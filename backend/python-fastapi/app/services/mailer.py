"""Outgoing email over SMTP (password reset). Configured with SMTP_* settings."""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

log = logging.getLogger("agrioptima.mail")


class MailNotConfiguredError(RuntimeError):
    pass


def mail_configured() -> bool:
    s = get_settings()
    return bool(s.smtp_host and s.smtp_from)


def send_mail(to: str, subject: str, body: str) -> None:
    s = get_settings()
    if not mail_configured():
        raise MailNotConfiguredError("SMTP is not configured")
    msg = EmailMessage()
    msg["From"] = s.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15) as smtp:
        if s.smtp_starttls:
            smtp.starttls()
        if s.smtp_user and s.smtp_password:
            smtp.login(s.smtp_user, s.smtp_password)
        smtp.send_message(msg)
    log.info("mail sent subject=%r", subject)
