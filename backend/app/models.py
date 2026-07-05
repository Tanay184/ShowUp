import uuid
from datetime import datetime
from app import db


def generate_uuid():
    return str(uuid.uuid4())


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable for Google OAuth users
    is_google_auth = db.Column(db.Boolean, default=False)
    email_verified = db.Column(db.Boolean, default=False)
    college = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    credibility_score = db.Column(db.Integer, default=0)
    is_senior = db.Column(db.Boolean, default=False)
    is_verified_senior = db.Column(db.Boolean, default=False)
    college_start_year = db.Column(db.Integer, nullable=True)
    college_end_year = db.Column(db.Integer, nullable=True)
    course = db.Column(db.String(255), nullable=True)
    skills = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    projects = db.relationship("Project", backref="student", lazy=True, cascade="all, delete-orphan")
    reviews_given = db.relationship("Review", foreign_keys="Review.reviewer_id", backref="reviewer", lazy=True)
    following = db.relationship("Follow", foreign_keys="Follow.follower_id", backref="follower", lazy=True)
    followers = db.relationship("Follow", foreign_keys="Follow.following_id", backref="following_student", lazy=True)

    def to_dict(self, include_email=False):
        data = {
            "id": self.id,
            "name": self.name,
            "college": self.college,
            "bio": self.bio,
            "avatar_url": self.avatar_url,
            "credibility_score": self.credibility_score,
            "is_senior": self.is_senior,
            "is_verified_senior": self.is_verified_senior,
            "college_start_year": self.college_start_year,
            "college_end_year": self.college_end_year,
            "course": self.course,
            "skills": self.skills.split(",") if self.skills else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "project_count": len(self.projects),
            "credibility_level": self._get_credibility_level(),
        }
        if include_email:
            data["email"] = self.email
        return data

    def _get_credibility_level(self):
        score = self.credibility_score
        if score >= 100:
            return "Elite"
        elif score >= 50:
            return "Notable"
        elif score >= 20:
            return "Rising"
        else:
            return "Beginner"


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    tech_stack = db.Column(db.String(500), nullable=True)  # comma-separated
    live_url = db.Column(db.String(500), nullable=True)
    github_url = db.Column(db.String(500), nullable=True)
    screenshot_url = db.Column(db.String(500), nullable=True)
    student_id = db.Column(db.String(36), db.ForeignKey("students.id"), nullable=False)
    ai_analysis = db.Column(db.Text, nullable=True)          # JSON string of latest analysis
    ai_analysis_used = db.Column(db.Boolean, default=False)
    show_ai_analysis = db.Column(db.Boolean, default=True)
    project_hash = db.Column(db.String(64), nullable=True)    # MD5 of title+description+tech_stack at last analysis
    analysis_history = db.Column(db.Text, nullable=True)      # JSON array of all past analyses
    last_analyzed_at = db.Column(db.DateTime, nullable=True)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    reviews = db.relationship("Review", backref="project", lazy=True, cascade="all, delete-orphan")

    def to_dict(self, include_student=True, current_user_id=None):
        import json
        from app.hash_utils import can_analyze
        can, reason = can_analyze(self)
        
        is_owner = current_user_id == self.student_id
        should_show = self.show_ai_analysis or is_owner
        
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "tech_stack": self.tech_stack.split(",") if self.tech_stack else [],
            "live_url": self.live_url,
            "github_url": self.github_url,
            "screenshot_url": self.screenshot_url,
            "student_id": self.student_id,
            "ai_analysis": json.loads(self.ai_analysis) if self.ai_analysis and should_show else None,
            "ai_analysis_used": self.ai_analysis_used,
            "show_ai_analysis": self.show_ai_analysis,
            "ai_analysis_hidden": not should_show and self.ai_analysis is not None,
            "can_analyze": can,
            "can_analyze_reason": reason,
            "last_analyzed_at": self.last_analyzed_at.isoformat() if self.last_analyzed_at else None,
            "view_count": self.view_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_student and self.student:
            data["student"] = self.student.to_dict()
        return data


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=False)
    reviewer_id = db.Column(db.String(36), db.ForeignKey("students.id"), nullable=False)
    feedback = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    is_verified_review = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "reviewer_id": self.reviewer_id,
            "feedback": self.feedback,
            "rating": self.rating,
            "is_verified_review": self.is_verified_review,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "reviewer": self.reviewer.to_dict() if self.reviewer else None,
        }


class Follow(db.Model):
    __tablename__ = "follows"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    follower_id = db.Column(db.String(36), db.ForeignKey("students.id"), nullable=False)
    following_id = db.Column(db.String(36), db.ForeignKey("students.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("follower_id", "following_id", name="unique_follow"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "follower_id": self.follower_id,
            "following_id": self.following_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ExitReview(db.Model):
    __tablename__ = "exit_reviews"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(255), nullable=False)
    feedback = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "feedback": self.feedback,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
