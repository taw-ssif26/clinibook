# Import all models here so Alembic can detect them for migrations
from app.models.clinic import Clinic
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.models.availability import DoctorAvailability, AvailabilityException, ExceptionType
from app.models.series import AppointmentSeries, RecurrenceType, SeriesStatus
from app.models.appointment import Appointment, AppointmentType, AppointmentStatus, BookedBy
from app.models.reminder import Reminder, ReminderChannel, ReminderStatus
from app.models.audit_log import AuditLog
from app.models.refresh_token import RefreshToken

__all__ = [
    "Clinic", "User", "UserRole", "Doctor",
    "DoctorAvailability", "AvailabilityException", "ExceptionType",
    "AppointmentSeries", "RecurrenceType", "SeriesStatus",
    "Appointment", "AppointmentType", "AppointmentStatus", "BookedBy",
    "Reminder", "ReminderChannel", "ReminderStatus",
    "AuditLog", "RefreshToken",
]
