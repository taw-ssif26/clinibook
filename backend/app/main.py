from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.reminder_scheduler import start_scheduler, shutdown_scheduler
from app.middleware.auth_middleware import AuthMiddleware
from app.middleware.audit_middleware import AuditMiddleware
from app.routers import auth, admin, doctors, availability, appointments, series, patients

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="CliniBook API",
    version="1.0.0",
    lifespan=lifespan,
)

# Order matters: CORS first, then auth extraction, then audit
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuditMiddleware)
app.add_middleware(AuthMiddleware)

app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(admin.router,        prefix="/admin",        tags=["Admin"])
app.include_router(doctors.router,      prefix="/doctors",      tags=["Doctors"])
app.include_router(availability.router, prefix="/availability", tags=["Availability"])
app.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
app.include_router(series.router,       prefix="/series",       tags=["Series"])
app.include_router(patients.router,     prefix="/patients",     tags=["Patients"])


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
