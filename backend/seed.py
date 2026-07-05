"""
Seed script — creates 3 students, 8 projects, 2 with AI analysis.
Run: python seed.py
"""
import sys
import os
import json
import uuid
import bcrypt
from datetime import datetime, timedelta
import random

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Student, Project, Follow

app = create_app()

STUDENTS = [
    {
        "name": "Arjun Sharma",
        "email": "arjun@example.com",
        "college": "IIT Delhi",
        "bio": "Full-stack developer passionate about building products that matter. Open source contributor and hackathon junkie.",
        "avatar_url": "https://api.dicebear.com/8.x/initials/svg?seed=Arjun+Sharma&backgroundColor=4f378a",
        "credibility_score": 45,
        "is_senior": True,
    },
    {
        "name": "Priya Nair",
        "email": "priya@example.com",
        "college": "NIT Trichy",
        "bio": "ML enthusiast & UI/UX designer. I turn data into stories and wireframes into products.",
        "avatar_url": "https://api.dicebear.com/8.x/initials/svg?seed=Priya+Nair&backgroundColor=765b00",
        "credibility_score": 72,
        "is_senior": True,
        "is_verified_senior": True,
    },
    {
        "name": "Rahul Verma",
        "email": "rahul@example.com",
        "college": "BITS Pilani",
        "bio": "Competitive programmer. Building my first SaaS. Coffee-driven developer.",
        "avatar_url": "https://api.dicebear.com/8.x/initials/svg?seed=Rahul+Verma&backgroundColor=63597c",
        "credibility_score": 15,
    },
]

PROJECTS_DATA = [
    {
        "student_idx": 0,
        "title": "EduTrack — Student Progress Dashboard",
        "description": "A real-time dashboard for teachers to track student assignment submissions, quiz scores, and attendance. Built with React, Node.js, and PostgreSQL. Supports 500+ concurrent students.",
        "tech_stack": "React,Node.js,PostgreSQL,Chart.js,Socket.io",
        "live_url": "https://edutrack.demo.com",
        "github_url": "https://github.com/arjun/edutrack",
        "screenshot_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
        "view_count": 234,
        "ai_analysis": {
            "overall_score": 8,
            "summary": "A well-structured real-time educational dashboard with practical industry application.",
            "strengths": [
                "Real-time features with Socket.io show advanced technical capability",
                "PostgreSQL choice demonstrates production-ready thinking",
                "Clear problem statement targeting actual educator pain points"
            ],
            "improvements": [
                "Add authentication and role-based access control",
                "Include mobile responsiveness for tablet use in classrooms",
                "Add data export functionality (CSV/PDF reports)"
            ],
            "industry_relevance": "EdTech is a $300B market — this demonstrates full-stack skills directly applicable to companies like Byju's, Unacademy, or enterprise SaaS.",
            "suggested_next_steps": [
                "Deploy on Railway or Render with a live demo URL",
                "Add automated tests with Jest/Cypress"
            ]
        },
    },
    {
        "student_idx": 0,
        "title": "Splitwise Clone — Group Expense Tracker",
        "description": "A mobile-first web app to track shared expenses among friends. Supports groups, multiple currencies, and smart settlement suggestions to minimize transactions.",
        "tech_stack": "React,FastAPI,SQLite,TailwindCSS",
        "github_url": "https://github.com/arjun/splitwise-clone",
        "screenshot_url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
        "view_count": 189,
    },
    {
        "student_idx": 0,
        "title": "CLI Task Manager",
        "description": "A terminal-based task manager with tagging, priority levels, and due date reminders. Stores data in SQLite with Rust for blazing fast performance.",
        "tech_stack": "Rust,SQLite,CLI",
        "github_url": "https://github.com/arjun/cli-tasks",
        "screenshot_url": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800",
        "view_count": 67,
    },
    {
        "student_idx": 1,
        "title": "FakeNewsDetector — ML NLP Pipeline",
        "description": "An end-to-end machine learning pipeline to classify news articles as real or fake using BERT fine-tuning. Achieves 94.2% accuracy on the LIAR dataset. Deployed as a REST API.",
        "tech_stack": "Python,PyTorch,HuggingFace,FastAPI,Docker",
        "live_url": "https://fakenews.priya.dev",
        "github_url": "https://github.com/priya/fake-news-detector",
        "screenshot_url": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
        "view_count": 412,
        "ai_analysis": {
            "overall_score": 9,
            "summary": "A highly impressive NLP project with real-world social impact and production-grade deployment.",
            "strengths": [
                "BERT fine-tuning shows deep ML expertise beyond beginner tutorials",
                "94.2% accuracy on a benchmark dataset is publication-worthy",
                "Dockerized FastAPI deployment demonstrates DevOps awareness"
            ],
            "improvements": [
                "Add a web UI with confidence scores and source attribution",
                "Implement model versioning with MLflow or DVC",
                "Publish the model to HuggingFace Hub for visibility"
            ],
            "industry_relevance": "NLP engineers are among the most sought-after in the industry. This project alone would qualify for ML roles at startups and big tech.",
            "suggested_next_steps": [
                "Write a Medium article or arXiv paper about your methodology",
                "Add real-time news feed integration via NewsAPI"
            ]
        },
    },
    {
        "student_idx": 1,
        "title": "Portfolio Design System",
        "description": "A Figma + code design system for student portfolios with 50+ components, dark/light mode, and accessibility guidelines. Used by 200+ students.",
        "tech_stack": "Figma,React,Storybook,CSS Variables",
        "live_url": "https://design.priya.dev",
        "github_url": "https://github.com/priya/design-system",
        "screenshot_url": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
        "view_count": 298,
    },
    {
        "student_idx": 1,
        "title": "CampusEats — Food Delivery for Colleges",
        "description": "A hyperlocal food delivery app for college campuses. Students can order from campus canteens and track delivery in real-time via maps.",
        "tech_stack": "Flutter,Firebase,Google Maps API,Stripe",
        "github_url": "https://github.com/priya/campus-eats",
        "screenshot_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
        "view_count": 156,
    },
    {
        "student_idx": 2,
        "title": "AlgoViz — Algorithm Visualizer",
        "description": "Interactive visualizations for 20+ sorting and graph algorithms. Built for students to understand algorithmic complexity visually. Supports step-by-step mode and speed control.",
        "tech_stack": "React,D3.js,TypeScript",
        "live_url": "https://algoviz.rahul.dev",
        "github_url": "https://github.com/rahul/algoviz",
        "screenshot_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
        "view_count": 523,
    },
    {
        "student_idx": 2,
        "title": "CodeCollab — Pair Programming Tool",
        "description": "A real-time collaborative code editor with syntax highlighting, video call integration, and shared terminal. Built for remote pair programming interviews.",
        "tech_stack": "React,WebRTC,Monaco Editor,Node.js,Redis",
        "github_url": "https://github.com/rahul/codecollab",
        "screenshot_url": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
        "view_count": 311,
    },
]


def seed():
    with app.app_context():
        print("🌱 Dropping and recreating tables...")
        db.drop_all()
        db.create_all()

        password = "password123"
        pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        print("👤 Creating students...")
        students = []
        for data in STUDENTS:
            s = Student(
                id=str(uuid.uuid4()),
                name=data["name"],
                email=data["email"],
                password_hash=pw_hash,
                college=data["college"],
                bio=data.get("bio"),
                avatar_url=data.get("avatar_url"),
                credibility_score=data.get("credibility_score", 0),
                is_senior=data.get("is_senior", False),
                is_verified_senior=data.get("is_verified_senior", False),
                created_at=datetime.utcnow() - timedelta(days=random.randint(30, 120)),
            )
            db.session.add(s)
            students.append(s)

        db.session.flush()

        print("📁 Creating projects...")
        for pdata in PROJECTS_DATA:
            sidx = pdata["student_idx"]
            ai = pdata.get("ai_analysis")
            p = Project(
                id=str(uuid.uuid4()),
                title=pdata["title"],
                description=pdata["description"],
                tech_stack=pdata["tech_stack"],
                live_url=pdata.get("live_url"),
                github_url=pdata.get("github_url"),
                screenshot_url=pdata.get("screenshot_url"),
                student_id=students[sidx].id,
                ai_analysis=json.dumps(ai) if ai else None,
                ai_analysis_used=bool(ai),
                view_count=pdata.get("view_count", 0),
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
            )
            db.session.add(p)

        print("🤝 Creating follows...")
        # Arjun follows Priya, Rahul follows Priya, Rahul follows Arjun
        follows = [
            (0, 1), (2, 1), (2, 0)
        ]
        for fi, ti in follows:
            f = Follow(
                id=str(uuid.uuid4()),
                follower_id=students[fi].id,
                following_id=students[ti].id,
            )
            db.session.add(f)

        db.session.commit()
        print("✅ Seed complete!")
        print(f"   Students: {len(STUDENTS)}")
        print(f"   Projects: {len(PROJECTS_DATA)} (2 with AI analysis)")
        print(f"\n🔑 All passwords: {password}")
        for s in STUDENTS:
            print(f"   {s['email']}")


if __name__ == "__main__":
    seed()
