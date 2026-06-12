from datetime import date, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.doctor import Doctor
from app.models.availability import DoctorAvailability, AvailabilityException, ExceptionType
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.availability import SlotResponse
from app.utils.datetime_utils import generate_slots, slot_overlaps


async def get_available_slots(
    doctor_id: str,
    target_date: date,
    db: AsyncSession,
) -> list[SlotResponse]:
    """
    Returns all open slots for a doctor on a given date.
    Steps:
      1. Fetch doctor slot config
      2. Check for exception on target_date
      3. Fall back to weekly availability
      4. Generate all slots
      5. Remove booked slots
    """
    result = await db.execute(select(Doctor).where(Doctor.id == doctor_id, Doctor.is_active == True))
    doctor = result.scalar_one_or_none()
    if not doctor:
        return []

    # Step 2: check exceptions
    result = await db.execute(
        select(AvailabilityException).where(
            AvailabilityException.doctor_id == doctor_id,
            AvailabilityException.exception_date == target_date,
        )
    )
    exception = result.scalar_one_or_none()

    if exception:
        if exception.type == ExceptionType.day_off:
            return []
        # custom_hours
        work_start, work_end = exception.start_time, exception.end_time
    else:
        # Step 3: weekly template
        day_of_week = target_date.weekday()  # 0=Monday
        result = await db.execute(
            select(DoctorAvailability).where(
                DoctorAvailability.doctor_id == doctor_id,
                DoctorAvailability.day_of_week == day_of_week,
                DoctorAvailability.is_active == True,
            )
        )
        availability = result.scalar_one_or_none()
        if not availability:
            return []
        work_start, work_end = availability.start_time, availability.end_time

    # Step 4: generate slots
    all_slots = generate_slots(work_start, work_end, doctor.slot_duration_minutes, doctor.buffer_minutes)

    # Step 5: fetch booked slots
    result = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == doctor_id,
            Appointment.date == target_date,
            Appointment.status.notin_([AppointmentStatus.cancelled, AppointmentStatus.rescheduled]),
        )
    )
    booked = result.scalars().all()

    available = []
    for slot_start, slot_end in all_slots:
        is_booked = any(
            slot_overlaps(slot_start, slot_end, appt.start_time, appt.end_time)
            for appt in booked
        )
        if not is_booked:
            available.append(SlotResponse(start_time=slot_start, end_time=slot_end))

    return available
