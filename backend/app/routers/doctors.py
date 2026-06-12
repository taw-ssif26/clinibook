from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.schemas.doctor import DoctorUpdate, DoctorResponse, DoctorPublicProfile
from app.schemas.appointment import AppointmentResponse, StatusUpdateRequest
from app.utils.dependencies import get_current_user, get_current_doctor
from app.utils.permissions import can_update_status

router = APIRouter()


# ── Doctor-auth routes MUST come before /{doctor_id} to avoid UUID collision ──

@router.get("/me", response_model=DoctorResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Doctor).options(selectinload(Doctor.user)).where(Doctor.user_id == current_user.id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return doctor


@router.put("/me/profile", response_model=DoctorResponse)
async def update_my_profile(
    payload: DoctorUpdate,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Doctor).options(selectinload(Doctor.user)).where(Doctor.user_id == current_user.id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    for field, val in payload.model_dump(exclude_none=True).items():
        setattr(doctor, field, val)
    return doctor


@router.get("/me/appointments", response_model=list[AppointmentResponse])
async def get_my_appointments(
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    result = await db.execute(
        select(Appointment)
        .where(Appointment.doctor_id == doctor.id)
        .order_by(Appointment.date.desc(), Appointment.start_time)
    )
    return result.scalars().all()


@router.put("/me/appointments/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: UUID,
    payload: StatusUpdateRequest,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.doctor_id == doctor.id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    current_user.doctor_profile = doctor
    if not can_update_status(current_user, appt, payload.status):
        raise HTTPException(status_code=403, detail="Cannot set this status")

    appt.status = payload.status
    if payload.internal_notes:
        appt.internal_notes = payload.internal_notes
    return appt


# ── Public routes — /me routes above must be declared first ──

@router.get("", response_model=list[DoctorPublicProfile])
async def list_doctors_public(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Doctor).options(selectinload(Doctor.user))
        .where(Doctor.is_active == True).order_by(Doctor.id)
    )
    return [
        DoctorPublicProfile(
            id=d.id, specialization=d.specialization, department=d.department,
            bio=d.bio, consultation_fee=d.consultation_fee,
            languages_spoken=d.languages_spoken or [],
            slot_duration_minutes=d.slot_duration_minutes,
            name=d.user.name, avatar_url=d.user.avatar_url,
        )
        for d in result.scalars().all()
    ]


@router.get("/{doctor_id}/profile", response_model=DoctorPublicProfile)
async def get_doctor_public_profile(doctor_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Doctor).options(selectinload(Doctor.user))
        .where(Doctor.id == doctor_id, Doctor.is_active == True)
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return DoctorPublicProfile(
        id=d.id, specialization=d.specialization, department=d.department,
        bio=d.bio, consultation_fee=d.consultation_fee,
        languages_spoken=d.languages_spoken or [],
        slot_duration_minutes=d.slot_duration_minutes,
        name=d.user.name, avatar_url=d.user.avatar_url,
    )
