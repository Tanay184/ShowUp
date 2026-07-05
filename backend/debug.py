from app import create_app, db
from app.models import Project

app = create_app()
with app.app_context():
    p = Project.query.get("d897aac3-70c8-4aa7-b2b3-3b5ad327063c")
    print(p.ai_analysis)
