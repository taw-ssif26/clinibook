from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.series import AppointmentSeries, SeriesStatus
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.series import SeriesCreate, SeriesResponse
from app.utils.dependencies import get_current_user, get_current_patient
from app.utils.permissions import is_admin
from app.services.series_manager import generate_series_instances

router = APIRouter()


@router.post("", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
async def create_series(
    payload: SeriesCreate,
    current_user: User = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db),
):
    if not payload.end_date and not payload.occurrences_total:
        raise HTTPException(status_code=400, detail="Provide end_date or occurrences_total")

    series = AppointmentSeries(
        patient_id=current_user.id,
        doctor_id=payload.doctor_id,
        clinic_id=current_user.clinic_id,
        recurrence_type=payload.recurrence_type,
        preferred_time=payload.preferred_time,
        day_of_week=payload.day_of_week,
        start_date=payload.start_date,
        end_date=payload.end_date,
        occurrences_total=payload.occurrences_total,
    )
    db.add(series)
    await db.flush()
    await generate_series_instances(series, db)
    return series


@router.get("/{series_id}", response_model=SeriesResponse)
async def get_series(
    series_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AppointmentSeries).where(AppointmentSeries.id == series_id))
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")

    if not is_admin(current_user) and str(series.patient_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    return series


@router.put("/{series_id}/pause", response_model=SeriesResponse)
async def pause_series(
    series_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AppointmentSeries).where(AppointmentSeries.id == series_id))
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    if not is_admin(current_user) and str(series.patient_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    series.status = SeriesStatus.paused
    return series


@router.put("/{series_id}/cancel", response_model=SeriesResponse)
async def cancel_series(
    series_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AppointmentSeries).where(AppointmentSeries.id == series_id))
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    if not is_admin(current_user) and str(series.patient_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    series.status = SeriesStatus.cancelled

    # Cancel all future pending/confirmed appointments in this series
    result = await db.execute(
        select(Appointment).where(
            Appointment.series_id == series_id,
            Appointment.status.in_([AppointmentStatus.pending, AppointmentStatus.confirmed]),
        )
    )
    for appt in result.scalars().all():
        appt.status = AppointmentStatus.cancelled
        appt.cancellation_reason = "Series cancelled"

    return series
