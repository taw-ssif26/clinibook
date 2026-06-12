from datetime import date, timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.series import AppointmentSeries, RecurrenceType
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType, BookedBy
from app.models.availability import AvailabilityException, ExceptionType
from app.models.doctor import Doctor
from app.services.conflict_checker import is_slot_available


def _advance_to_weekday(d: date, weekday: int) -> date:
    """Advance d forward until it lands on the target weekday (0=Mon)."""
    days_ahead = (weekday - d.weekday()) % 7
    return d + timedelta(days=days_ahead)


def _next_occurrence(current: date, recurrence: RecurrenceType) -> date:
    if recurrence == RecurrenceType.weekly:
        return current + timedelta(weeks=1)
    elif recurrence == RecurrenceType.biweekly:
        return current + timedelta(weeks=2)
    elif recurrence == RecurrenceType.monthly:
        # Go ~4 weeks forward, then snap to the same weekday
        candidate = current + timedelta(weeks=4)
        return _advance_to_weekday(candidate, current.weekday())
    return current + timedelta(weeks=1)


async def generate_series_instances(series: AppointmentSeries, db: AsyncSession) -> list[Appointment]:
    result = await db.execute(select(Doctor).where(Doctor.id == series.doctor_id))
    doctor = result.scalar_one_or_none()
    if not doctor:
        return []

    appointments = []
    # Fix 4: snap start_date to the desired weekday before entering loop
    current_date = _advance_to_weekday(series.start_date, series.day_of_week)
    count = 0
    max_count = series.occurrences_total or 52

    while count < max_count:
        if series.end_date and current_date > series.end_date:
            break

        # Check doctor exception
        result = await db.execute(
            select(AvailabilityException).where(
                AvailabilityException.doctor_id == series.doctor_id,
                AvailabilityException.exception_date == current_date,
            )
        )
        exception = result.scalar_one_or_none()

        if not (exception and exception.type == ExceptionType.day_off):
            start_time = series.preferred_time
            end_time = (
                datetime.combine(current_date, start_time)
                + timedelta(minutes=doctor.slot_duration_minutes)
            ).time()

            if await is_slot_available(str(series.doctor_id), current_date, start_time, end_time, db):
                appt = Appointment(
                    clinic_id=series.clinic_id,
                    patient_id=series.patient_id,
                    doctor_id=series.doctor_id,
                    series_id=series.id,
                    appointment_type=AppointmentType.recurring,
                    date=current_date,
                    start_time=start_time,
                    end_time=end_time,
                    status=AppointmentStatus.pending,
                    booked_by=BookedBy.patient,
                )
                db.add(appt)
                appointments.append(appt)
                count += 1

        current_date = _next_occurrence(current_date, series.recurrence_type)

    await db.flush()
    return appointments
