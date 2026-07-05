from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Project, Follow, Student

feed_bp = Blueprint("feed", __name__)


def _success(data=None, message=""):
    return jsonify({"success": True, "data": data, "message": message})


def _error(message, status=400):
    return jsonify({"success": False, "data": None, "message": message}), status


@feed_bp.route("", methods=["GET"])
@jwt_required()
def personalised_feed():
    """
    Personalised feed: projects from followed students + trending (for non-followed).
    Falls back to newest feed if user follows nobody.
    """
    student_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    # Get IDs the current user follows
    following = Follow.query.filter_by(follower_id=student_id).all()
    following_ids = [f.following_id for f in following]

    if following_ids:
        # Mix: followed students' projects + some trending
        query = (
            Project.query
            .filter(
                (Project.student_id.in_(following_ids)) |
                (Project.view_count > 10)
            )
            .order_by(Project.created_at.desc())
        )
    else:
        # Fallback to global newest feed
        query = Project.query.order_by(Project.created_at.desc())

    # Exclude own projects from feed
    query = query.filter(Project.student_id != student_id)

    paginated = query.paginate(page=page, per_page=limit, error_out=False)
    projects = [p.to_dict() for p in paginated.items]

    return _success({
        "projects": projects,
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
        "has_next": paginated.has_next,
    })


@feed_bp.route("/stats", methods=["GET"])
def platform_stats():
    """Global platform stats for the landing page."""
    student_count = Student.query.count()
    project_count = Project.query.count()
    
    unique_colleges = db.session.query(Student.college).filter(
        Student.college.isnot(None),
        Student.college != "",
        Student.college != "Not set"
    ).distinct().count()

    return _success({
        "students": student_count,
        "projects": project_count,
        "colleges": unique_colleges,
    })


@feed_bp.route("/trending", methods=["GET"])
def trending():
    """Top projects by view_count in the last 7 days."""
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    week_ago = datetime.utcnow() - timedelta(days=7)
    paginated = (
        Project.query
        .filter(Project.created_at >= week_ago)
        .order_by(Project.view_count.desc())
        .paginate(page=page, per_page=limit, error_out=False)
    )
    projects = [p.to_dict() for p in paginated.items]

    # If less than 10 trending, pad with all-time most viewed
    if len(projects) < limit:
        seen_ids = {p["id"] for p in projects}
        extra = (
            Project.query
            .filter(~Project.id.in_(seen_ids))
            .order_by(Project.view_count.desc())
            .limit(limit - len(projects))
            .all()
        )
        projects += [p.to_dict() for p in extra]

    return _success({
        "projects": projects,
        "total": len(projects),
    })
