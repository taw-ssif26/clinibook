import enum
from sqlalchemy import Column, Integer, Date, Time, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class RecurrenceType(str, enum.Enum):
    weekly = "weekly"
    biweekly = "biweekly"
    monthly = "monthly"


class SeriesStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    cancelled = "cancelled"


class AppointmentSeries(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "appointment_series"

    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    recurrence_type = Column(SAEnum(RecurrenceType), nullable=False)
    preferred_time = Column(Time, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    occurrences_total = Column(Integer, nullable=True)
    occurrences_completed = Column(Integer, default=0, nullable=False)
    status = Column(SAEnum(SeriesStatus), default=SeriesStatus.active, nullable=False)

    # Relationships
    doctor = relationship("Doctor", back_populates="series")
    appointments = relationship("Appointment", back_populates="series")
