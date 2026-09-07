from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db
from ....models import User, Conversation, Message, Role
from ....services.notification_service import NotificationService
from ....utils.decorators import get_current_user
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query

messaging_bp = Blueprint('messaging', __name__)


def can_send_message(sender: User, recipient: User) -> tuple[bool, str]:
    """
    Messaging rules:
    - FREE PLAYER: cannot send or receive messages
    - PREMIUM PLAYER: can message scouts/institutions
    - SCOUT: can message premium players and institutions
    - INSTITUTION: can message premium players and scouts
    - ADMIN: can message anyone
    """
    if sender.is_suspended or recipient.is_suspended:
        return False, "Cannot message suspended accounts"

    if sender.is_admin():
        return True, ""

    sender_role = sender.role_name
    recipient_role = recipient.role_name

    # FREE player cannot send messages
    if sender_role == Role.PLAYER and not sender.is_premium():
        return False, "Premium subscription required to send messages"

    # Determine if the pair is allowed
    allowed_pairs = {
        (Role.PLAYER, Role.SCOUT): True,
        (Role.PLAYER, Role.INSTITUTION): True,
        (Role.SCOUT, Role.PLAYER): True,
        (Role.SCOUT, Role.INSTITUTION): True,
        (Role.INSTITUTION, Role.PLAYER): True,
        (Role.INSTITUTION, Role.SCOUT): True,
    }

    if not allowed_pairs.get((sender_role, recipient_role)):
        return False, f"{sender_role} cannot message {recipient_role}"

    # Recipient must be premium player to receive messages
    if recipient_role == Role.PLAYER and not recipient.is_premium():
        return False, "This player does not have a premium subscription to receive messages"

    return True, ""


def get_or_create_conversation(user1_id: str, user2_id: str) -> Conversation:
    """Get existing conversation or create new one. Order IDs consistently."""
    p1, p2 = sorted([user1_id, user2_id])
    conv = Conversation.query.filter_by(
        participant_one_id=p1,
        participant_two_id=p2,
    ).first()

    if not conv:
        conv = Conversation(participant_one_id=p1, participant_two_id=p2)
        db.session.add(conv)
        db.session.flush()

    return conv


@messaging_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    """Get all conversations for the current user."""
    user = get_current_user()
    query = Conversation.query.filter(
        (Conversation.participant_one_id == user.id) |
        (Conversation.participant_two_id == user.id)
    ).order_by(Conversation.last_message_at.desc().nullslast())

    result = paginate_query(query, schema_fn=lambda c: c.to_dict(current_user_id=user.id))
    return success_response(data=result)


@messaging_bp.route('/conversations/<conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    """Get a specific conversation and its messages."""
    user = get_current_user()
    conv = Conversation.query.get(conversation_id)
    if not conv:
        return error_response("Conversation not found", 404)

    # Verify user is a participant
    if conv.participant_one_id != user.id and conv.participant_two_id != user.id:
        return error_response("Access denied", 403)

    messages_query = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.asc())
    messages_result = paginate_query(messages_query, schema_fn=lambda m: m.to_dict())

    # Mark unread messages as read
    Message.query.filter_by(
        conversation_id=conv.id,
        recipient_id=user.id,
        is_read=False
    ).update({'is_read': True, 'read_at': datetime.now(timezone.utc)})
    db.session.commit()

    return success_response(data={
        'conversation': conv.to_dict(current_user_id=user.id),
        'messages': messages_result,
    })


@messaging_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message to another user."""
    user = get_current_user()
    data = request.get_json()

    if not data:
        return error_response("Request body required", 400)

    recipient_id = data.get('recipient_id')
    body = data.get('body', '').strip()

    if not recipient_id:
        return error_response("recipient_id is required", 400)
    if not body:
        return error_response("Message body is required", 400)
    if len(body) > 5000:
        return error_response("Message too long. Maximum 5000 characters.", 400)
    if recipient_id == user.id:
        return error_response("Cannot send messages to yourself", 400)

    recipient = User.query.get(recipient_id)
    if not recipient or not recipient.is_active:
        return error_response("Recipient not found", 404)

    # Check messaging permissions
    can_msg, reason = can_send_message(user, recipient)
    if not can_msg:
        return error_response(reason, 403)

    # Get or create conversation
    conv = get_or_create_conversation(user.id, recipient_id)

    message = Message(
        conversation_id=conv.id,
        sender_id=user.id,
        recipient_id=recipient_id,
        body=body,
    )
    db.session.add(message)

    # Update conversation last_message_at
    conv.last_message_at = datetime.now(timezone.utc)
    db.session.commit()

    # Create notification
    sender_name = _get_sender_name(user)
    NotificationService.notify_new_message(recipient_id, sender_name, conv.id)

    return success_response(data={
        'message': message.to_dict(),
        'conversation_id': conv.id,
    }, status_code=201)


@messaging_bp.route('/conversations/<conversation_id>/messages/<message_id>/read', methods=['PATCH'])
@jwt_required()
def mark_message_read(conversation_id, message_id):
    user = get_current_user()
    message = Message.query.filter_by(id=message_id, conversation_id=conversation_id, recipient_id=user.id).first()
    if not message:
        return error_response("Message not found", 404)

    message.is_read = True
    message.read_at = datetime.now(timezone.utc)
    db.session.commit()
    return success_response(message="Message marked as read")


@messaging_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user = get_current_user()
    count = Message.query.filter_by(recipient_id=user.id, is_read=False).count()
    return success_response(data={'unread_count': count})


def _get_sender_name(user: User) -> str:
    if user.player_profile:
        return user.player_profile.full_name
    if user.scout_profile:
        return user.scout_profile.scout_name
    if user.institution_profile:
        return user.institution_profile.institution_name
    return user.email