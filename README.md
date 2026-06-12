# CliniBook

A full-stack clinic management system with Admin, Doctor, and Patient panels.

## Stack
- **Backend**: FastAPI (Python 3.11) + PostgreSQL + SQLAlchemy
- **Frontend**: Next.js 14 + Tailwind CSS
- **Email**: Resend.com
- **Scheduler**: APScheduler

---

## Backend Setup

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 15 running locally (or use Docker)

### 2. Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials and Resend API key
```

### 4. Run migrations
```bash
alembic upgrade head
```

### 5. Seed demo data
```bash
python seed.py
```

### 6. Start server
```bash
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

---

## With Docker
```bash
docker-compose up --build
```
Then run migrations inside the container:
```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python seed.py
```

---

## Demo Accounts (after seeding)
| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@demo.com      | admin123   |
| Doctor  | sarah@demo.com      | doctor123  |
| Doctor  | rahim@demo.com      | doctor123  |
| Patient | patient@demo.com    | patient123 |

---

## API Reference
Full interactive docs at: http://localhost:8000/docs

### Key endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Patient registration |
| POST | /auth/login | All roles login |
| GET | /doctors | Browse doctors (public) |
| GET | /availability/{id}/slots?date=YYYY-MM-DD | Available slots |
| POST | /appointments | Book appointment |
| PUT | /appointments/{id}/cancel | Cancel appointment |
| PUT | /appointments/{id}/reschedule | Reschedule |
| POST | /series | Create recurring series |
| GET | /admin/dashboard/stats | Admin stats |

---

## Running Tests
```bash
cd backend
pytest tests/ -v
```
# clinibook
