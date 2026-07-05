import os
from datetime import timedelta
from flask import Flask, jsonify
# pyrefly: ignore [missing-import]
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)

    # Config
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    app.secret_key = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")  # Required by flask-dance

    # Allow OAuth over HTTP in local dev (remove in production with HTTPS)
    if os.getenv("FLASK_ENV") == "development":
        os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
    
    os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"], supports_credentials=True)

    # ── Consistent JWT error codes for frontend ─────────────────────
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({"success": False, "code": "TOKEN_EXPIRED", "message": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"success": False, "code": "TOKEN_INVALID", "message": "Token is invalid"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"success": False, "code": "TOKEN_MISSING", "message": "Authorization token is missing"}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_data):
        return jsonify({"success": False, "code": "TOKEN_REVOKED", "message": "Token has been revoked"}), 401

    # Register blueprints
    from app.auth import auth_bp
    from app.projects import projects_bp
    from app.students import students_bp
    from app.feed import feed_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(students_bp, url_prefix="/api/students")
    app.register_blueprint(feed_bp, url_prefix="/api/feed")

    # Google OAuth blueprint (flask-dance) — only if credentials are set
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if google_client_id and google_client_secret:
        from flask_dance.contrib.google import make_google_blueprint
        google_bp = make_google_blueprint(
            client_id=google_client_id,
            client_secret=google_client_secret,
            scope=["openid", "email", "profile"],
            redirect_url="/api/auth/google/callback",
            reprompt_select_account=True,
        )
        app.register_blueprint(google_bp, url_prefix="/api/auth/google-oauth")

    # Health check
    @app.route("/api/health")
    def health():
        return {"success": True, "message": "ShowUp API is running 🚀"}

    return app

