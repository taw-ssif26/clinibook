import enum
from sqlalchemy import Column, String, Date, Time, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class AppointmentType(str, enum.Enum):
    first_visit = "first_visit"
    follow_up = "follow_up"
    recurring = "recurring"
    walk_in = "walk_in"


class AppointmentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"
    rescheduled = "rescheduled"


class BookedBy(str, enum.Enum):
    patient = "patient"
    admin = "admin"


class Appointment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "appointments"

    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    series_id = Column(UUID(as_uuid=True), ForeignKey("appointment_series.id"), nullable=True)

    appointment_type = Column(SAEnum(AppointmentType), nullable=False, default=AppointmentType.first_visit)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(SAEnum(AppointmentStatus), default=AppointmentStatus.pending, nullable=False)

    internal_notes = Column(Text, nullable=True)       # Visible to admin + doctor only
    booked_by = Column(SAEnum(BookedBy), default=BookedBy.patient, nullable=False)
    cancellation_reason = Column(Text, nullable=True)
    rescheduled_to_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)

    # Relationships
    clinic = relationship("Clinic", back_populates="appointments")
    patient = relationship("User", back_populates="appointments_as_patient", foreign_keys=[patient_id])
    doctor = relationship("Doctor", back_populates="appointments", foreign_keys=[doctor_id])
    series = relationship("AppointmentSeries", back_populates="appointments")
    reminders = relationship("Reminder", back_populates="appointment", cascade="all, delete-orphan")
    rescheduled_to = relationship("Appointment", remote_side="Appointment.id", foreign_keys=[rescheduled_to_id])
