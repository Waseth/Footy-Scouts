from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ....extensions import db
from ....models import Player, Scout, Institution, User, Subscription
from ....utils.helpers import success_response, error_response
from ....utils.pagination import paginate_query

search_bp = Blueprint('search', __name__)


@search_bp.route('/players', methods=['GET'])
def search_players():
    """
    Advanced player search with filtering, sorting, and pagination.
    Public endpoint — contact details only shown per player's settings.
    """
    query = Player.query.join(User, Player.user_id == User.id).filter(
        User.is_active == True,
        User.is_suspended == False,
    )

    # ── Filters ───────────────────────────────────────────────────────────────
    country = request.args.get('country', '').strip()
    position = request.args.get('position', '').strip()
    gender = request.args.get('gender', '').strip()
    current_team = request.args.get('current_team', '').strip()
    school = request.args.get('school', '').strip()
    is_featured = request.args.get('is_featured')
    is_premium = request.args.get('is_premium')

    # Age range
    age_min = request.args.get('age_min', type=int)
    age_max = request.args.get('age_max', type=int)

    # Name search
    name = request.args.get('name', '').strip()

    if country:
        query = query.filter(Player.nationality.ilike(f'%{country}%'))
    if position:
        query = query.filter(Player.position.ilike(f'%{position}%'))
    if gender:
        query = query.filter(Player.gender.ilike(f'%{gender}%'))
    if current_team:
        query = query.filter(Player.current_team.ilike(f'%{current_team}%'))
    if school:
        query = query.filter(Player.school.ilike(f'%{school}%'))
    if name:
        query = query.filter(Player.full_name.ilike(f'%{name}%'))
    if is_featured is not None:
        query = query.filter(Player.is_featured == (is_featured.lower() == 'true'))

    # Age filter — calculated from date_of_birth
    if age_min is not None:
        from sqlalchemy import func, extract
        from datetime import date
        max_dob = date.today().replace(year=date.today().year - age_min)
        query = query.filter(Player.date_of_birth <= max_dob)
    if age_max is not None:
        from datetime import date
        min_dob = date.today().replace(year=date.today().year - age_max)
        query = query.filter(Player.date_of_birth >= min_dob)

    # Premium filter — join subscriptions
    if is_premium is not None:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if is_premium.lower() == 'true':
            query = query.join(Subscription, Subscription.user_id == User.id).filter(
                Subscription.plan.in_(['MONTHLY', 'ANNUAL']),
                Subscription.status == 'ACTIVE',
                (Subscription.end_date == None) | (Subscription.end_date > now),
            )
        else:
            query = query.outerjoin(Subscription, Subscription.user_id == User.id).filter(
                (Subscription.plan == 'FREE') | (Subscription.id == None)
            )

    # ── Sorting ───────────────────────────────────────────────────────────────
    sort = request.args.get('sort', 'newest')
    if sort == 'newest':
        query = query.order_by(Player.created_at.desc())
    elif sort == 'oldest':
        query = query.order_by(Player.created_at.asc())
    elif sort == 'name_asc':
        query = query.order_by(Player.full_name.asc())
    elif sort == 'name_desc':
        query = query.order_by(Player.full_name.desc())
    elif sort == 'most_viewed':
        query = query.order_by(Player.profile_views.desc())
    elif sort == 'featured':
        query = query.order_by(Player.is_featured.desc(), Player.created_at.desc())

    result = paginate_query(query, schema_fn=lambda p: p.to_dict(include_contact=False))
    return success_response(data=result)


@search_bp.route('/scouts', methods=['GET'])
def search_scouts():
    """Search verified scouts."""
    query = Scout.query.join(User, Scout.user_id == User.id).filter(
        Scout.is_verified == True,
        User.is_active == True,
        User.is_suspended == False,
    )

    country = request.args.get('country', '').strip()
    scout_type = request.args.get('scout_type', '').strip()
    name = request.args.get('name', '').strip()

    if country:
        query = query.filter(Scout.country.ilike(f'%{country}%'))
    if scout_type:
        query = query.filter(Scout.scout_type.ilike(f'%{scout_type}%'))
    if name:
        query = query.filter(
            (Scout.scout_name.ilike(f'%{name}%')) |
            (Scout.agency_name.ilike(f'%{name}%'))
        )

    sort = request.args.get('sort', 'newest')
    if sort == 'newest':
        query = query.order_by(Scout.created_at.desc())
    elif sort == 'name_asc':
        query = query.order_by(Scout.scout_name.asc())

    result = paginate_query(query, schema_fn=lambda s: s.to_dict(public=True))
    return success_response(data=result)


@search_bp.route('/institutions', methods=['GET'])
def search_institutions():
    """Search verified institutions."""
    query = Institution.query.join(User, Institution.user_id == User.id).filter(
        Institution.is_verified == True,
        User.is_active == True,
        User.is_suspended == False,
    )

    country = request.args.get('country', '').strip()
    institution_type = request.args.get('type', '').strip()
    name = request.args.get('name', '').strip()
    city = request.args.get('city', '').strip()

    if country:
        query = query.filter(Institution.country.ilike(f'%{country}%'))
    if institution_type:
        query = query.filter(Institution.institution_type.ilike(f'%{institution_type}%'))
    if name:
        query = query.filter(Institution.institution_name.ilike(f'%{name}%'))
    if city:
        query = query.filter(Institution.city.ilike(f'%{city}%'))

    sort = request.args.get('sort', 'newest')
    if sort == 'newest':
        query = query.order_by(Institution.created_at.desc())
    elif sort == 'name_asc':
        query = query.order_by(Institution.institution_name.asc())

    result = paginate_query(query, schema_fn=lambda i: i.to_dict(public=True))
    return success_response(data=result)