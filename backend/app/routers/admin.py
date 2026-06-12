from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentStatus, BookedBy
from app.models.clinic import Clinic
from app.models.audit_log import AuditLog
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse
from app.schemas.clinic import ClinicUpdate, ClinicResponse
from app.schemas.appointment import AppointmentResponse, AdminOverrideRequest, AdminAppointmentCreate
from app.schemas.user import UserResponse
from app.utils.dependencies import get_current_admin
from app.routers.auth import hash_password

router = APIRouter()


@router.get("/dashboard/stats")
async def dashboard_stats(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    today = date.today()
    total_today = (await db.execute(select(func.count(Appointment.id)).where(Appointment.date == today))).scalar()
    upcoming = (await db.execute(select(func.count(Appointment.id)).where(
        Appointment.date >= today,
        Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed])
    ))).scalar()
    no_shows = (await db.execute(select(func.count(Appointment.id)).where(Appointment.status == AppointmentStatus.no_show))).scalar()
    active_doctors = (await db.execute(select(func.count(Doctor.id)).where(Doctor.is_active == True))).scalar()
    total_patients = (await db.execute(select(func.count(User.id)).where(User.role == UserRole.patient))).scalar()
    return {
        "appointments_today": total_today,
        "upcoming_appointments": upcoming,
        "total_no_shows": no_shows,
        "active_doctors": active_doctors,
        "total_patients": total_patients,
    }


@router.get("/doctors", response_model=list[DoctorResponse])
async def list_doctors(current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Doctor).options(selectinload(Doctor.user)).order_by(Doctor.id))
    return result.scalars().all()


@router.post("/doctors", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(payload: DoctorCreate, current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    if (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already in use")

    user = User(clinic_id=current_user.clinic_id, name=payload.name, email=payload.email,
                phone=payload.phone, password_hash=hash_password(payload.password), role=UserRole.doctor)
    db.add(user)
    await db.flush()

    doctor = Doctor(user_id=user.id, clinic_id=current_user.clinic_id,
                    specialization=payload.specialization, department=payload.department,
                    bio=payload.bio, consultation_fee=payload.consultation_fee,
                    languages_spoken=payload.languages_spoken,
                    slot_duration_minutes=payload.slot_duration_minutes,
                    buffer_minutes=payload.buffer_minutes)
    db.add(doctor)
    await db.flush()
    await db.refresh(doctor, ["user"])
    return doctor


@router.put("/doctors/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(doctor_id: UUID, payload: DoctorUpdate,
                         current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Doctor).options(selectinload(Doctor.user)).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(doctor, field, val)
    return doctor


@router.delete("/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_doctor(doctor_id: UUID, current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    # Fix 3: eager load user so we can set is_active on it
    result = await db.execute(select(Doctor).options(selectinload(Doctor.user)).where(Doctor.id == doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.is_active = False
    doctor.user.is_active = False


@router.get("/patients", response_model=list[UserResponse])
async def list_patients(current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.role == UserRole.patient).order_by(User.name))
    return result.scalars().all()


@router.get("/patients/{patient_id}", response_model=UserResponse)
async def get_patient(patient_id: UUID, current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == patient_id, User.role == UserRole.patient))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.get("/patients/{patient_id}/appointments", response_model=list[AppointmentResponse])
async def get_patient_appointments(patient_id: UUID, current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Appointment).where(Appointment.patient_id == patient_id)
        .order_by(Appointment.date.desc(), Appointment.start_time.desc())
    )
    return result.scalars().all()


@router.get("/appointments", response_model=list[AppointmentResponse])
async def list_all_appointments(current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Appointment).order_by(Appointment.date.desc(), Appointment.start_time.desc()))
    return result.scalars().all()


# Fix 7: Admin booking on behalf of patient
@router.post("/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def admin_book_appointment(
    payload: AdminAppointmentCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from datetime import timedelta, datetime, date
    from app.services.conflict_checker import is_slot_available
    from app.services.reminder_scheduler import schedule_reminders

    result = await db.execute(select(Doctor).where(Doctor.id == payload.doctor_id, Doctor.is_active == True))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    end_time = (datetime.combine(date.today(), payload.start_time) + timedelta(minutes=doctor.slot_duration_minutes)).time()
    if not await is_slot_available(str(payload.doctor_id), payload.date, payload.start_time, end_time, db):
        raise HTTPException(status_code=409, detail="Slot is not available")

    appt = Appointment(
        clinic_id=current_user.clinic_id,
        patient_id=payload.patient_id,
        doctor_id=doctor.id,
        appointment_type=payload.appointment_type,
        date=payload.date,
        start_time=payload.start_time,
        end_time=end_time,
        status=AppointmentStatus.confirmed,  # Admin-booked = auto confirmed
        booked_by=BookedBy.admin,
        internal_notes=payload.internal_notes,
    )
    db.add(appt)
    await db.flush()
    await schedule_reminders(appt, db)
    return appt


@router.put("/appointments/{appointment_id}/override", response_model=AppointmentResponse)
async def override_appointment(
    appointment_id: UUID, payload: AdminOverrideRequest,
    current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = payload.status
    if payload.internal_notes:
        appt.internal_notes = payload.internal_notes
    if payload.reason:
        appt.cancellation_reason = payload.reason

    db.add(AuditLog(
        user_id=current_user.id, clinic_id=current_user.clinic_id,
        action=f"Admin overrode appointment {appointment_id} to {payload.status}",
        target_table="appointments", target_id=str(appointment_id),
    ))
    return appt


@router.get("/clinic", response_model=ClinicResponse)
async def get_clinic(current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Clinic).where(Clinic.id == current_user.clinic_id))
    clinic = result.scalar_one_or_none()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return clinic


@router.put("/clinic/settings", response_model=ClinicResponse)
async def update_clinic(payload: ClinicUpdate, current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Clinic).where(Clinic.id == current_user.clinic_id))
    clinic = result.scalar_one_or_none()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(clinic, field, val)
    return clinic


@router.get("/audit-log")
async def get_audit_log(current_user: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditLog).where(AuditLog.clinic_id == current_user.clinic_id)
        .order_by(AuditLog.timestamp.desc()).limit(500)
    )
    return [{"id": str(l.id), "action": l.action, "target_table": l.target_table,
             "target_id": l.target_id, "timestamp": l.timestamp,
             "user_id": str(l.user_id) if l.user_id else None} for l in result.scalars().all()]
