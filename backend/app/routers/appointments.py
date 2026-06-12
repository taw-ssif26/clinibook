from uuid import UUID
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.doctor import Doctor
from app.models.appointment import Appointment, AppointmentStatus, BookedBy
from app.schemas.appointment import (
    AppointmentCreate, AppointmentResponse,
    CancelRequest, RescheduleRequest,
)
from app.utils.dependencies import get_current_user, get_current_patient
from app.utils.permissions import can_cancel_appointment
from app.services.conflict_checker import is_slot_available
from app.services.slot_generator import get_available_slots
from app.services.reminder_scheduler import schedule_reminders, cancel_reminders

router = APIRouter()


async def _get_doctor_and_slot(
    doctor_id: UUID, payload_date, start_time, db: AsyncSession, exclude_id=None
):
    """Helper: fetch doctor, compute end_time, check conflict."""
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id, Doctor.is_active == True))
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    from datetime import datetime, date
    end_time = (datetime.combine(date.today(), start_time) + timedelta(minutes=doctor.slot_duration_minutes)).time()

    available = await is_slot_available(str(doctor_id), payload_date, start_time, end_time, db, exclude_id)
    if not available:
        raise HTTPException(status_code=409, detail="Slot is not available")

    return doctor, end_time


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def book_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db),
):
    doctor, end_time = await _get_doctor_and_slot(
        payload.doctor_id, payload.date, payload.start_time, db
    )

    appt = Appointment(
        clinic_id=current_user.clinic_id,
        patient_id=current_user.id,
        doctor_id=doctor.id,
        appointment_type=payload.appointment_type,
        date=payload.date,
        start_time=payload.start_time,
        end_time=end_time,
        status=AppointmentStatus.pending,
        booked_by=BookedBy.patient,
        internal_notes=payload.internal_notes,
    )
    db.add(appt)
    await db.flush()
    await schedule_reminders(appt, db)
    return appt


@router.get("/my", response_model=list[AppointmentResponse])
async def my_appointments(
    current_user: User = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .where(Appointment.patient_id == current_user.id)
        .order_by(Appointment.date.desc(), Appointment.start_time.desc())
    )
    return result.scalars().all()


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Patients can only view their own
    from app.utils.permissions import is_patient, is_admin, is_doctor
    if is_patient(current_user) and str(appt.patient_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    return appt


@router.put("/{appointment_id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment(
    appointment_id: UUID,
    payload: CancelRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt.status in [AppointmentStatus.cancelled, AppointmentStatus.completed]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {appt.status} appointment")

    # Fetch clinic cutoff for patient check
    from app.models.clinic import Clinic
    clinic_result = await db.execute(select(Clinic).where(Clinic.id == appt.clinic_id))
    clinic = clinic_result.scalar_one_or_none()
    cutoff = clinic.cancellation_cutoff_hours if clinic else 2

    if not can_cancel_appointment(current_user, appt, cutoff):
        raise HTTPException(status_code=403, detail="Cannot cancel — outside cancellation window or not authorized")

    appt.status = AppointmentStatus.cancelled
    appt.cancellation_reason = payload.reason
    await cancel_reminders(str(appointment_id), db)
    return appt


@router.put("/{appointment_id}/reschedule", response_model=AppointmentResponse)
async def reschedule_appointment(
    appointment_id: UUID,
    payload: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    old_appt = result.scalar_one_or_none()
    if not old_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    from app.utils.permissions import is_patient
    if is_patient(current_user) and str(old_appt.patient_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    doctor, end_time = await _get_doctor_and_slot(
        old_appt.doctor_id, payload.new_date, payload.new_start_time, db,
        exclude_id=str(appointment_id),
    )

    # Mark old as rescheduled, create new
    old_appt.status = AppointmentStatus.rescheduled
    await cancel_reminders(str(appointment_id), db)

    new_appt = Appointment(
        clinic_id=old_appt.clinic_id,
        patient_id=old_appt.patient_id,
        doctor_id=old_appt.doctor_id,
        series_id=old_appt.series_id,
        appointment_type=old_appt.appointment_type,
        date=payload.new_date,
        start_time=payload.new_start_time,
        end_time=end_time,
        status=AppointmentStatus.pending,
        booked_by=old_appt.booked_by,
    )
    db.add(new_appt)
    old_appt.rescheduled_to_id = new_appt.id
    await db.flush()
    await schedule_reminders(new_appt, db)
    return new_appt
