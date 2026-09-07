from flask import request, current_app


def paginate_query(query, schema_fn=None):
    """
    Paginate a SQLAlchemy query.
    Returns dict with items, total, page, per_page, pages.
    schema_fn: optional callable to serialize each item (e.g. item.to_dict)
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', current_app.config.get('DEFAULT_PAGE_SIZE', 20), type=int)
    max_per_page = current_app.config.get('MAX_PAGE_SIZE', 100)

    # Clamp per_page
    per_page = min(per_page, max_per_page)
    per_page = max(per_page, 1)
    page = max(page, 1)

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    items = paginated.items
    if schema_fn:
        items = [schema_fn(item) for item in items]
    elif items and hasattr(items[0], 'to_dict'):
        items = [item.to_dict() for item in items]

    return {
        'items': items,
        'total': paginated.total,
        'page': page,
        'per_page': per_page,
        'pages': paginated.pages,
        'has_next': paginated.has_next,
        'has_prev': paginated.has_prev,
    }