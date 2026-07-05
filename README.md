# ShowUp — Student Portfolio & Credibility Platform

> **Your Work Speaks First.** A portfolio platform for Indian college students to upload projects, get AI-powered feedback via Gemini, and share a public portfolio link.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite, React Router v6, Tailwind CSS v3, Axios |
| Backend | Python Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS |
| Database | PostgreSQL via Supabase |
| AI | Google Gemini Flash 1.5 |
| Images | Cloudinary (unsigned upload preset) |
| Email | Resend |

---

## Project Structure

```
showup/
├── backend/           # Flask API
│   ├── app/
│   │   ├── __init__.py     # App factory
│   │   ├── models.py       # DB models
│   │   ├── auth.py         # Auth routes
│   │   ├── projects.py     # Project routes
│   │   ├── students.py     # Student routes
│   │   ├── feed.py         # Feed routes
│   │   ├── gemini.py       # Gemini AI
│   │   └── email_service.py # Resend emails
│   ├── seed.py
│   ├── run.py
│   └── requirements.txt
└── frontend/          # React + Vite
    ├── src/
    │   ├── api/         # Axios API layer
    │   ├── components/  # Reusable UI
    │   ├── context/     # Auth context
    │   └── pages/       # Route pages
    └── tailwind.config.js
```

---

## Setup: Supabase (PostgreSQL)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `showup`, choose a region close to India (e.g. Singapore)
3. Go to **Settings → Database → Connection string → URI**
4. Copy the connection string (replace `[YOUR-PASSWORD]` with your DB password)
5. Paste into `backend/.env` as `DATABASE_URL`

---

## Setup: Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → Sign up / Login
2. From the **Dashboard**, note your **Cloud Name**
3. Go to **Settings → Upload → Upload presets → Add upload preset**
   - Signing Mode: **Unsigned**
   - Give it a name (e.g. `showup_preset`)
4. Add to both `backend/.env` and `frontend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_UPLOAD_PRESET=showup_preset
   ```

---

## Setup: Google Gemini

1. Go to [aistudio.google.com](https://aistudio.google.com) → **Get API Key**
2. Create a new API key
3. Add to `backend/.env`: `GEMINI_API_KEY=your_key`

---

## Setup: Resend (Email)

1. Go to [resend.com](https://resend.com) → Sign up
2. Go to **API Keys → Create API Key**
3. Add to `backend/.env`: `RESEND_API_KEY=re_...`

---

## Local Development

### Backend

```bash
cd backend

# 1. Create virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and fill .env
cp .env.example .env
# Edit .env with your Supabase, Gemini, Cloudinary, Resend keys

# 4. Create tables and seed data
python seed.py

# 5. Start the Flask server
python run.py
# API running at http://localhost:5000
```

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Copy and fill .env
cp .env.example .env
# Edit .env:
# VITE_API_URL=http://localhost:5000
# VITE_CLOUDINARY_CLOUD_NAME=...
# VITE_CLOUDINARY_UPLOAD_PRESET=...

# 3. Start dev server
npm run dev
# App running at http://localhost:5173
```

---

## Environment Variables Reference

### `backend/.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET_KEY` | Long random secret for signing JWTs |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset name |
| `RESEND_API_KEY` | Resend transactional email API key |

### `frontend/.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:5000`) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset |

---

## API Endpoints

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register + returns JWT |
| POST | `/api/auth/login` | — | Login + returns JWT |
| GET | `/api/auth/me` | ✅ | Current user info |

### Projects
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/projects` | — | Public feed (paginated) |
| POST | `/api/projects` | ✅ | Create project |
| GET | `/api/projects/:id` | — | Project detail (increments views) |
| PUT | `/api/projects/:id` | ✅ | Update (owner only) |
| DELETE | `/api/projects/:id` | ✅ | Delete (owner only) |
| GET | `/api/projects/student/:id` | — | Student's projects |
| POST | `/api/projects/:id/analyse` | ✅ | Gemini AI analysis |

### Students
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/students/leaderboard` | — | Top 10 by credibility |
| GET | `/api/students/:id` | — | Public portfolio |
| PUT | `/api/students/:id` | ✅ | Update profile (owner) |

### Feed
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/feed` | ✅ | Personalised feed |
| GET | `/api/feed/trending` | — | Trending projects (7 days) |

---

## Seed Data

The seed script creates:
- **3 students**: Arjun (IIT Delhi), Priya (NIT Trichy), Rahul (BITS Pilani)
- **8 projects** across all 3 students
- **2 projects** with full AI analysis pre-populated
- **3 follow** relationships

All seed passwords: `password123`

---

## Credibility Levels

| Level | Score Range |
|-------|-------------|
| 🌱 Beginner | 0 – 19 |
| ⚡ Rising | 20 – 49 |
| 🔥 Notable | 50 – 99 |
| 👑 Elite | 100+ |

Each AI analysis adds +5 to credibility score.

---

## Frontend Pages

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing Page | Public |
| `/auth` | Login / Register | Public |
| `/feed` | Discovery Feed | 🔒 |
| `/upload` | Upload Project | 🔒 |
| `/project/:id` | Project Detail | Public |
| `/u/:id` | Student Portfolio | Public |
| `/profile/edit` | Edit Profile | 🔒 |
