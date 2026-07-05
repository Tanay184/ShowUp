# ShowUp — Build Walkthrough ✅

## What Was Built

A full-stack student portfolio platform — React + Vite frontend, Python Flask backend, PostgreSQL via Supabase.

---

## Screenshots

### Landing Page

![Landing Page Hero](C:\Users\bhatn\.gemini\antigravity-ide\brain\ceeeaf4e-5c3c-494a-b238-6bec850dea83\landing_page.png)

### How It Works Section

![How It Works](C:\Users\bhatn\.gemini\antigravity-ide\brain\ceeeaf4e-5c3c-494a-b238-6bec850dea83\landing_how_it_works.png)

### Auth Page (Login / Register)

![Auth Page](C:\Users\bhatn\.gemini\antigravity-ide\brain\ceeeaf4e-5c3c-494a-b238-6bec850dea83\auth_page.png)

### Auth Page (Register Tab)

![Register Tab](C:\Users\bhatn\.gemini\antigravity-ide\brain\ceeeaf4e-5c3c-494a-b238-6bec850dea83\auth_page_register_tab_1783011670944.png)

---

## Files Created

### Backend (`d:/NEW IDEA/backend/`)

| File | Purpose |
|------|---------|
| `app/__init__.py` | Flask app factory — CORS, JWT, SQLAlchemy, blueprints |
| `app/models.py` | Student, Project, Review, Follow models (UUID PKs) |
| `app/auth.py` | Register, login, `/me` routes |
| `app/projects.py` | Full CRUD + Gemini AI analysis endpoint |
| `app/students.py` | Public profiles, leaderboard, profile update |
| `app/feed.py` | Personalised + trending feed |
| `app/gemini.py` | Gemini Flash 1.5 AI analysis with exact prompt |
| `app/email_service.py` | Resend welcome email on registration |
| `seed.py` | 3 students, 8 projects, 2 AI-analysed |
| `run.py` | Flask entry point |
| `requirements.txt` | All pinned dependencies |
| `.env.example` | All required environment variables |

### Frontend (`d:/NEW IDEA/frontend/src/`)

| File | Purpose |
|------|---------|
| `api/index.js` | Axios with JWT interceptor + auto-logout |
| `context/AuthContext.jsx` | JWT auth state, login/register/logout |
| `components/Navbar.jsx` | Sidebar (desktop) + bottom nav (mobile) |
| `components/ProjectCard.jsx` | Card with screenshot, AI badge, tech pills |
| `components/AIAnalysisPanel.jsx` | Score bar, strengths/improvements, next steps |
| `components/CloudinaryUpload.jsx` | Unsigned direct browser upload |
| `components/CredibilityBadge.jsx` | Beginner/Rising/Notable/Elite |
| `components/AuthGuard.jsx` | Protected route wrapper |
| `pages/LandingPage.jsx` | Hero, stats, how-it-works, CTA |
| `pages/AuthPage.jsx` | Login/Register tabs |
| `pages/FeedPage.jsx` | Project grid, 3-filter bar, load more |
| `pages/UploadPage.jsx` | Form + tag input + Cloudinary upload |
| `pages/ProjectDetailPage.jsx` | Full detail + AI panel + share |
| `pages/StudentPortfolioPage.jsx` | Public portfolio (no auth needed) |
| `pages/EditProfilePage.jsx` | Avatar upload + profile edit |

---

## Next Steps to Go Live

### 1. Fill in your `.env` files

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
JWT_SECRET_KEY=make-this-a-long-random-string
GEMINI_API_KEY=AIza...
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_UPLOAD_PRESET=your_preset
RESEND_API_KEY=re_...
```

```bash
# frontend/.env
VITE_API_URL=http://localhost:5000
VITE_CLOUDINARY_CLOUD_NAME=your_cloud
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### 2. Set up backend

```powershell
cd "d:\NEW IDEA\backend"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python seed.py        # creates tables + seed data
python run.py         # starts on http://localhost:5000
```

### 3. Start frontend (already running)

```powershell
cd "d:\NEW IDEA\frontend"
npm run dev           # http://localhost:5173
```

### 4. Seed login credentials

All seed accounts use password: **`password123`**
- `arjun@example.com` — IIT Delhi (45 credibility)
- `priya@example.com` — NIT Trichy (72 credibility, Verified Senior)
- `rahul@example.com` — BITS Pilani (15 credibility)

---

## Design System

- **Font**: IBM Plex Mono (labels/brand) + DM Serif Display (hero) + Public Sans (body)
- **Brutalist borders**: `2px solid #2A2A2A` + `4px box-shadow offset`
- **Hover lift**: `translate(-2px, -2px)` + deeper shadow
- **Primary**: `#4f378a` (purple)
- **Responsive**: Fixed left sidebar on desktop, bottom nav on mobile
