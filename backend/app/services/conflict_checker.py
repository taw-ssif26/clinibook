from datetime import date, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.appointment import Appointment, AppointmentStatus
from app.utils.datetime_utils import slot_overlaps


async def is_slot_available(
    doctor_id: str,
    appt_date: date,
    start_time: time,
    end_time: time,
    db: AsyncSession,
    exclude_appointment_id: str | None = None,
) -> bool:
    """
    Returns True if the slot is free.
    exclude_appointment_id is used during reschedule
    to exclude the appointment being rescheduled.
    """
    query = select(Appointment).where(
        Appointment.doctor_id == doctor_id,
        Appointment.date == appt_date,
        Appointment.status.notin_([AppointmentStatus.cancelled, AppointmentStatus.rescheduled]),
    )
    if exclude_appointment_id:
        query = query.where(Appointment.id != exclude_appointment_id)

    result = await db.execute(query)
    existing = result.scalars().all()

    for appt in existing:
        if slot_overlaps(start_time, end_time, appt.start_time, appt.end_time):
            return False
    return True
