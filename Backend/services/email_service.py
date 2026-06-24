from flask import current_app, render_template_string
from flask_mail import Message as MailMessage
from ..extensions import mail


class EmailService:

    @staticmethod
    def send_email(to: str, subject: str, html_body: str, text_body: str = None):
        """Send an email."""
        try:
            msg = MailMessage(
                subject=subject,
                recipients=[to],
                html=html_body,
                body=text_body or '',
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
            )
            mail.send(msg)
            return True
        except Exception as e:
            current_app.logger.error(f"Email send failed to {to}: {str(e)}")
            return False

    @staticmethod
    def send_verification_email(user_email: str, verification_token: str):
        frontend_url = current_app.config.get('FRONTEND_URL', '')
        verify_url = f"{frontend_url}/verify-email?token={verification_token}"
        html = f"""
        <h2>Welcome to Footy Scout!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{verify_url}" style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
            Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you did not create this account, please ignore this email.</p>
        """
        EmailService.send_email(user_email, "Verify Your Footy Scout Email", html)

    @staticmethod
    def send_password_reset_email(user_email: str, reset_token: str):
        frontend_url = current_app.config.get('FRONTEND_URL', '')
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        html = f"""
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your Footy Scout account.</p>
        <a href="{reset_url}" style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
            Reset Password
        </a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        """
        EmailService.send_email(user_email, "Reset Your Footy Scout Password", html)

    @staticmethod
    def send_subscription_confirmation(user_email: str, plan: str, expiry_date):
        html = f"""
        <h2>Subscription Confirmed! 🎉</h2>
        <p>Your <strong>{plan}</strong> subscription is now active.</p>
        <p>Expiry Date: <strong>{expiry_date.strftime('%B %d, %Y') if expiry_date else 'N/A'}</strong></p>
        <p>Enjoy full access to Footy Scout!</p>
        """
        EmailService.send_email(user_email, "Footy Scout Subscription Confirmed", html)

    @staticmethod
    def send_account_approved_email(user_email: str, user_type: str):
        html = f"""
        <h2>Account Approved! ✅</h2>
        <p>Your <strong>{user_type}</strong> account on Footy Scout has been approved by our admin team.</p>
        <p>Your profile is now public and visible to users on the platform.</p>
        <p>Log in now to complete your profile and start connecting!</p>
        """
        EmailService.send_email(user_email, "Your Footy Scout Account Has Been Approved", html)

    @staticmethod
    def send_account_suspended_email(user_email: str, reason: str = None):
        reason_text = f"Reason: {reason}" if reason else ""
        html = f"""
        <h2>Account Suspended</h2>
        <p>Your Footy Scout account has been suspended.</p>
        <p>{reason_text}</p>
        <p>If you believe this is an error, please contact support at support@footyscout.com</p>
        """
        EmailService.send_email(user_email, "Footy Scout Account Suspended", html)

    @staticmethod
    def send_new_message_notification(recipient_email: str, sender_name: str):
        html = f"""
        <h2>New Message on Footy Scout</h2>
        <p>You have a new message from <strong>{sender_name}</strong>.</p>
        <p>Log in to Footy Scout to read and reply.</p>
        """
        EmailService.send_email(recipient_email, f"New message from {sender_name}", html)