from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db
from ....models import Notification
from ....utils.decorators import get_current_user
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def list_notifications():
    """List the current user's notifications (paginated)."""
    user = get_current_user()
    query = (
        Notification.query
        .filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
    )
    result = paginate_query(query)
    return success_response(data=result)


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    user = get_current_user()
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return success_response(data={'count': count})


@notifications_bp.route('/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_read(notification_id):
    user = get_current_user()
    n = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not n:
        return error_response("Notification not found", 404)
    n.mark_read()
    db.session.commit()
    return success_response(data={'notification': n.to_dict()})


@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    user = get_current_user()
    Notification.query.filter_by(user_id=user.id, is_read=False).update(
        {'is_read': True}
    )
    db.session.commit()
    return success_response(message="All notifications marked as read")


@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    user = get_current_user()
    n = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not n:
        return error_response("Notification not found", 404)
    db.session.delete(n)
    db.session.commit()
    return success_response(message="Notification deleted")