import enum
from sqlalchemy import Column, Integer, Boolean, Date, Time, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.mixins import UUIDMixin


class ExceptionType(str, enum.Enum):
    day_off = "day_off"
    custom_hours = "custom_hours"


class DoctorAvailability(UUIDMixin, Base):
    """Weekly repeating availability template per doctor."""
    __tablename__ = "doctor_availability"

    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    doctor = relationship("Doctor", back_populates="availability")


class AvailabilityException(UUIDMixin, Base):
    """One-time override of the weekly template (day off or custom hours)."""
    __tablename__ = "availability_exceptions"

    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=False)
    exception_date = Column(Date, nullable=False)
    type = Column(SAEnum(ExceptionType), nullable=False)
    start_time = Column(Time, nullable=True)   # null if type=day_off
    end_time = Column(Time, nullable=True)     # null if type=day_off
    reason = Column(Text, nullable=True)

    doctor = relationship("Doctor", back_populates="exceptions")
