from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.doctor import Doctor
from app.models.availability import DoctorAvailability, AvailabilityException
from app.schemas.availability import (
    AvailabilityCreate, AvailabilityResponse,
    ExceptionCreate, ExceptionResponse, SlotResponse,
)
from app.utils.dependencies import get_current_doctor
from app.services.slot_generator import get_available_slots

router = APIRouter()


# ── Doctor-auth routes MUST come before /{doctor_id} ─────────────────────────

@router.get("/me", response_model=list[AvailabilityResponse])
async def get_my_availability(
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    result = await db.execute(
        select(DoctorAvailability)
        .where(DoctorAvailability.doctor_id == doctor.id)
        .order_by(DoctorAvailability.day_of_week)
    )
    return result.scalars().all()


@router.put("/me", response_model=list[AvailabilityResponse])
async def set_my_availability(
    payload: list[AvailabilityCreate],
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    existing = await db.execute(
        select(DoctorAvailability).where(DoctorAvailability.doctor_id == doctor.id)
    )
    for row in existing.scalars().all():
        await db.delete(row)

    new_rows = [
        DoctorAvailability(
            doctor_id=doctor.id,
            day_of_week=a.day_of_week,
            start_time=a.start_time,
            end_time=a.end_time,
        )
        for a in payload
    ]
    db.add_all(new_rows)
    await db.flush()
    return new_rows


@router.get("/me/exceptions", response_model=list[ExceptionResponse])
async def get_my_exceptions(
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    result = await db.execute(
        select(AvailabilityException)
        .where(AvailabilityException.doctor_id == doctor.id)
        .order_by(AvailabilityException.exception_date)
    )
    return result.scalars().all()


@router.post("/me/exceptions", response_model=ExceptionResponse, status_code=201)
async def add_exception(
    payload: ExceptionCreate,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Doctor).where(Doctor.user_id == current_user.id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    exc = AvailabilityException(
        doctor_id=doctor.id,
        exception_date=payload.exception_date,
        type=payload.type,
        start_time=payload.start_time,
        end_time=payload.end_time,
        reason=payload.reason,
    )
    db.add(exc)
    await db.flush()
    return exc


# ── Public route ──────────────────────────────────────────────────────────────

@router.get("/{doctor_id}/slots", response_model=list[SlotResponse])
async def get_slots(
    doctor_id: UUID,
    date: date = Query(..., description="Date in YYYY-MM-DD format"),
    db: AsyncSession = Depends(get_db),
):
    return await get_available_slots(str(doctor_id), date, db)
