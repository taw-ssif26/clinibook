from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus


def is_admin(user: User) -> bool:
    return user.role == UserRole.admin


def is_doctor(user: User) -> bool:
    return user.role == UserRole.doctor


def is_patient(user: User) -> bool:
    return user.role == UserRole.patient


def require_admin(user: User) -> None:
    if not is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def require_doctor(user: User) -> None:
    if not is_doctor(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")


def require_patient(user: User) -> None:
    if not is_patient(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient access required")


def can_cancel_appointment(user: User, appointment: Appointment, cutoff_hours: int = 2) -> bool:
    """Patient can cancel only within the cancellation window. Admin can always cancel."""
    if is_admin(user):
        return True
    if is_patient(user) and str(appointment.patient_id) == str(user.id):
        from datetime import datetime, timezone, timedelta
        appointment_dt = datetime.combine(appointment.date, appointment.start_time).replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        return now < (appointment_dt - timedelta(hours=cutoff_hours))
    return False


def can_update_status(user: User, appointment: Appointment, new_status: AppointmentStatus) -> bool:
    """
    Admin: can set any status.
    Doctor: can set confirmed, completed, no_show (on own appointments only).
    Patient: cannot update status.
    """
    if is_admin(user):
        return True
    if is_doctor(user) and str(appointment.doctor_id) == str(user.doctor_profile.id):
        allowed = {AppointmentStatus.confirmed, AppointmentStatus.completed, AppointmentStatus.no_show}
        return new_status in allowed
    return False
