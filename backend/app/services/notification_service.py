from ..extensions import db
from ..models import Notification


class NotificationService:

    @staticmethod
    def create(user_id: str, title: str, body: str, notification_type: str,
               related_id: str = None, related_type: str = None):
        notification = Notification(
            user_id=user_id,
            title=title,
            body=body,
            notification_type=notification_type,
            related_id=related_id,
            related_type=related_type,
        )
        db.session.add(notification)
        db.session.commit()
        return notification

    @staticmethod
    def notify_new_message(recipient_id: str, sender_name: str, conversation_id: str):
        return NotificationService.create(
            user_id=recipient_id,
            title="New Message",
            body=f"You have a new message from {sender_name}",
            notification_type="MESSAGE",
            related_id=conversation_id,
            related_type="Conversation",
        )

    @staticmethod
    def notify_subscription_activated(user_id: str, plan: str):
        return NotificationService.create(
            user_id=user_id,
            title="Subscription Activated",
            body=f"Your {plan} subscription is now active. Enjoy premium features!",
            notification_type="SUBSCRIPTION",
        )

    @staticmethod
    def notify_account_approved(user_id: str, account_type: str):
        return NotificationService.create(
            user_id=user_id,
            title="Account Approved",
            body=f"Your {account_type} account has been approved. Your profile is now public.",
            notification_type="ADMIN",
        )

    @staticmethod
    def notify_account_suspended(user_id: str, reason: str = None):
        return NotificationService.create(
            user_id=user_id,
            title="Account Suspended",
            body=reason or "Your account has been suspended. Contact support for assistance.",
            notification_type="ADMIN",
        )

    # ── Team / Tournament system ──

    @staticmethod
    def notify_player_invited(player_user_id: str, team_name: str, captain_name: str,
                              team_id: str):
        return NotificationService.create(
            user_id=player_user_id,
            title="You've been invited to a team",
            body=f"{captain_name} invited you to join {team_name}. Open the team to accept or decline.",
            notification_type="TEAM",
            related_id=team_id,
            related_type="Team",
        )

    @staticmethod
    def notify_invite_accepted(captain_user_id: str, player_name: str,
                               team_name: str, team_id: str):
        return NotificationService.create(
            user_id=captain_user_id,
            title="Invitation accepted",
            body=f"{player_name} accepted your invitation and joined {team_name}.",
            notification_type="TEAM",
            related_id=team_id,
            related_type="Team",
        )

    @staticmethod
    def notify_invite_rejected(captain_user_id: str, player_name: str,
                               team_name: str, team_id: str):
        return NotificationService.create(
            user_id=captain_user_id,
            title="Invitation declined",
            body=f"{player_name} declined your invitation to join {team_name}.",
            notification_type="TEAM",
            related_id=team_id,
            related_type="Team",
        )

    @staticmethod
    def notify_join_request_received(captain_user_id: str, player_name: str,
                                     team_name: str, team_id: str):
        return NotificationService.create(
            user_id=captain_user_id,
            title="New join request",
            body=f"{player_name} requested to join {team_name}.",
            notification_type="TEAM",
            related_id=team_id,
            related_type="Team",
        )

    @staticmethod
    def notify_join_request_approved(player_user_id: str, team_name: str, team_id: str):
        return NotificationService.create(
            user_id=player_user_id,
            title="Join request approved",
            body=f"You're now part of {team_name}.",
            notification_type="TEAM",
            related_id=team_id,
            related_type="Team",
        )

    @staticmethod
    def notify_join_request_rejected(player_user_id: str, team_name: str, team_id: str):
        return NotificationService.create(
            user_id=player_user_id,
            title="Join request declined",
            body=f"Your request to join {team_name} was declined.",
            notification_type="TEAM",
            related_id=team_id,
            related_type="Team",
        )