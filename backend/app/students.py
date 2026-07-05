import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Student, ExitReview

students_bp = Blueprint("students", __name__)


def _success(data=None, message=""):
    return jsonify({"success": True, "data": data, "message": message})


def _error(message, status=400):
    return jsonify({"success": False, "data": None, "message": message}), status


@students_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    """Top 10 students by credibility_score."""
    top_students = (
        Student.query
        .order_by(Student.credibility_score.desc())
        .limit(10)
        .all()
    )
    return _success([s.to_dict() for s in top_students])


@students_bp.route("/<string:student_id>", methods=["GET"])
def get_student(student_id):
    """Public student portfolio — no auth required."""
    student = Student.query.get(student_id)
    if not student:
        return _error("Student not found", 404)
    return _success(student.to_dict(include_email=False))


@students_bp.route("/<string:student_id>", methods=["PUT"])
@jwt_required()
def update_student(student_id):
    """Update profile — owner only."""
    current_id = get_jwt_identity()
    if current_id != student_id:
        return _error("You can only update your own profile", 403)

    student = Student.query.get(student_id)
    if not student:
        return _error("Student not found", 404)

    body = request.get_json() or {}

    if "name" in body:
        student.name = body["name"].strip()
    if "college" in body:
        student.college = body["college"].strip()
    if "bio" in body:
        student.bio = body["bio"].strip() or None
    if "avatar_url" in body:
        student.avatar_url = body["avatar_url"].strip() or None
    if "college_start_year" in body:
        student.college_start_year = body.get("college_start_year")
    if "college_end_year" in body:
        student.college_end_year = body.get("college_end_year")
    if "course" in body:
        student.course = body.get("course", "").strip() or None
    if "skills" in body:
        skills = body.get("skills")
        if isinstance(skills, list):
            student.skills = ",".join(s.strip() for s in skills if s.strip())
        else:
            student.skills = skills.strip() if skills else None
    if "password" in body:
        pw = body["password"]
        if len(pw) < 6:
            return _error("Password must be at least 6 characters")
        student.password_hash = bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    db.session.commit()
    return _success(student.to_dict(include_email=True), "Profile updated!")


@students_bp.route("/<string:student_id>", methods=["DELETE"])
@jwt_required()
def delete_student(student_id):
    """Delete student account — cascade deletes projects & reviews."""
    current_id = get_jwt_identity()
    if current_id != student_id:
        return _error("You can only delete your own account", 403)

    student = Student.query.get(student_id)
    if not student:
        return _error("Student not found", 404)

    db.session.delete(student)
    db.session.commit()
    return _success(None, "Account successfully deleted.")


@students_bp.route("/exit-survey", methods=["POST"])
def submit_exit_survey():
    """Submit exit survey after account deletion."""
    body = request.get_json() or {}
    email = body.get("email", "").strip()
    feedback = body.get("feedback", "").strip()

    if not email or not feedback:
        return _error("Email and feedback are required", 400)

    review = ExitReview(email=email, feedback=feedback)
    db.session.add(review)
    db.session.commit()
    return _success(None, "Thank you for your feedback.")
