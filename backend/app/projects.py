import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Project, Student
from app.gemini_analyzer import analyze_project as run_analysis

projects_bp = Blueprint("projects", __name__)


def _success(data=None, message=""):
    return jsonify({"success": True, "data": data, "message": message})


def _error(message, status=400):
    return jsonify({"success": False, "data": None, "message": message}), status


@projects_bp.route("", methods=["GET"])
@jwt_required(optional=True)
def get_projects():
    """Public feed — newest first with pagination."""
    current_user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    filter_by = request.args.get("filter", "newest")  # newest | this_week | most_viewed

    query = Project.query

    if filter_by == "most_viewed":
        query = query.order_by(Project.view_count.desc())
    elif filter_by == "this_week":
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        query = query.filter(Project.created_at >= week_ago).order_by(Project.view_count.desc())
    else:
        query = query.order_by(Project.created_at.desc())

    paginated = query.paginate(page=page, per_page=limit, error_out=False)
    projects = [p.to_dict(current_user_id=current_user_id) for p in paginated.items]

    return _success({
        "projects": projects,
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": page,
        "has_next": paginated.has_next,
        "has_prev": paginated.has_prev,
    })


@projects_bp.route("", methods=["POST"])
@jwt_required()
def create_project():
    """Create a new project."""
    student_id = get_jwt_identity()
    body = request.get_json()
    if not body:
        return _error("Request body required")

    title = body.get("title", "").strip()
    if not title:
        return _error("title is required")

    description = body.get("description", "").strip()
    if len(description) > 500:
        return _error("description must be 500 characters or less")

    tech_tags = body.get("tech_stack", [])
    tech_stack_str = ",".join(t.strip() for t in tech_tags if t.strip()) if isinstance(tech_tags, list) else body.get("tech_stack", "")

    project = Project(
        title=title,
        description=description,
        tech_stack=tech_stack_str,
        live_url=body.get("live_url", "").strip() or None,
        github_url=body.get("github_url", "").strip() or None,
        screenshot_url=body.get("screenshot_url", "").strip() or None,
        student_id=student_id,
        show_ai_analysis=body.get("show_ai_analysis", True),
    )
    db.session.add(project)
    db.session.commit()

    return _success(project.to_dict(current_user_id=student_id), "Project published! 🚀"), 201


@projects_bp.route("/student/<string:student_id>", methods=["GET"])
@jwt_required(optional=True)
def get_student_projects(student_id):
    """All projects by one student."""
    current_user_id = get_jwt_identity()
    student = Student.query.get(student_id)
    if not student:
        return _error("Student not found", 404)

    projects = Project.query.filter_by(student_id=student_id).order_by(Project.created_at.desc()).all()
    return _success({
        "projects": [p.to_dict(include_student=False, current_user_id=current_user_id) for p in projects],
        "total": len(projects),
    })


@projects_bp.route("/<string:project_id>", methods=["GET"])
@jwt_required(optional=True)
def get_project(project_id):
    """Single project detail — does NOT increment view_count (use POST /view)."""
    current_user_id = get_jwt_identity()
    project = Project.query.get(project_id)
    if not project:
        return _error("Project not found", 404)

    return _success(project.to_dict(current_user_id=current_user_id))


@projects_bp.route("/<string:project_id>/view", methods=["POST"])
def record_view(project_id):
    """Increment view_count exactly once. Called by frontend on page load."""
    project = Project.query.get(project_id)
    if not project:
        return _error("Project not found", 404)
    project.view_count += 1
    db.session.commit()
    return _success({"view_count": project.view_count})


@projects_bp.route("/<string:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    """Update project — owner only."""
    student_id = get_jwt_identity()
    project = Project.query.get(project_id)
    if not project:
        return _error("Project not found", 404)
    if project.student_id != student_id:
        return _error("You can only edit your own projects", 403)

    body = request.get_json() or {}

    if "title" in body:
        project.title = body["title"].strip()
    if "description" in body:
        desc = body["description"].strip()
        if len(desc) > 500:
            return _error("description must be 500 characters or less")
        project.description = desc
    if "tech_stack" in body:
        tech_tags = body["tech_stack"]
        if isinstance(tech_tags, list):
            project.tech_stack = ",".join(t.strip() for t in tech_tags if t.strip())
        else:
            project.tech_stack = tech_tags
    if "live_url" in body:
        project.live_url = body["live_url"].strip() or None
    if "github_url" in body:
        project.github_url = body["github_url"].strip() or None
    if "screenshot_url" in body:
        project.screenshot_url = body["screenshot_url"].strip() or None
    if "show_ai_analysis" in body:
        project.show_ai_analysis = bool(body["show_ai_analysis"])

    db.session.commit()
    return _success(project.to_dict(current_user_id=student_id), "Project updated!")


@projects_bp.route("/<string:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    """Delete project — owner only."""
    student_id = get_jwt_identity()
    project = Project.query.get(project_id)
    if not project:
        return _error("Project not found", 404)
    if project.student_id != student_id:
        return _error("You can only delete your own projects", 403)

    db.session.delete(project)
    db.session.commit()
    return _success(None, "Project deleted")


@projects_bp.route("/<string:project_id>/analyse", methods=["POST"])
@jwt_required()
def analyse_project(project_id):
    """Run Gemini 2.5 Flash analysis via queue — respects 8-slot concurrency limit."""
    student_id = get_jwt_identity()
    project = Project.query.get(project_id)
    if not project:
        return _error("Project not found", 404)
    if project.student_id != student_id:
        return _error("You can only analyse your own projects", 403)

    # Gate: block re-analysis if content hasn't changed
    from app.hash_utils import can_analyze, compute_project_hash, save_analysis_to_history
    allowed, reason = can_analyze(project)
    if not allowed:
        return _error(reason, 400)

    # Optional: accept year_of_study from request body
    body = request.get_json() or {}
    year_of_study = body.get("year_of_study", 2)

    try:
        from app.queue_manager import process_analysis

        result = process_analysis(
            str(project_id),
            run_analysis,
            title=project.title,
            description=project.description or "",
            tech_stack=project.tech_stack or "",
            year_of_study=year_of_study,
            has_live_url=bool(project.live_url),
            has_github_url=bool(project.github_url),
            has_readme=False,
        )
    except Exception as e:
        return _error(f"AI analysis failed: {str(e)}", 500)

    from datetime import datetime
    new_hash = compute_project_hash(
        project.title or "",
        project.description or "",
        project.tech_stack or "",
    )

    project.ai_analysis = json.dumps(result)
    project.ai_analysis_used = True
    project.project_hash = new_hash
    project.last_analyzed_at = datetime.utcnow()
    project.analysis_history = save_analysis_to_history(project, result)

    # +5 credibility
    student = Student.query.get(student_id)
    if student:
        student.credibility_score += 5

    db.session.commit()

    return _success({
        "analysis": result,
        "project": project.to_dict(),
        "credibility_score": student.credibility_score if student else None,
    }, "Analysis complete! Credibility score +5 🎯")


@projects_bp.route("/queue/status", methods=["GET"])
def queue_status():
    """Public endpoint — check how busy the analysis queue is."""
    from app.queue_manager import get_queue_status
    return _success(get_queue_status())


@projects_bp.route("/<string:project_id>/analysis-history", methods=["GET"])
@jwt_required()
def get_analysis_history(project_id):
    """Return full analysis history for a project (owner only)."""
    student_id = get_jwt_identity()
    project = Project.query.get(project_id)
    if not project:
        return _error("Project not found", 404)
    if project.student_id != student_id:
        return _error("Unauthorized", 403)

    from app.hash_utils import can_analyze
    history = []
    if project.analysis_history:
        try:
            history = json.loads(project.analysis_history)
        except Exception:
            history = []

    allowed, reason = can_analyze(project)

    return _success({
        "history": history,
        "total_analyses": len(history),
        "can_analyze": allowed,
        "can_analyze_reason": reason,
        "last_analyzed_at": project.last_analyzed_at.isoformat() if project.last_analyzed_at else None,
    })

