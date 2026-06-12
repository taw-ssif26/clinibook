from sqlalchemy import Column, String, Integer, Boolean, Numeric, ForeignKey, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class Doctor(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "doctors"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    specialization = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Numeric(10, 2), nullable=True)
    languages_spoken = Column(ARRAY(String), default=[], nullable=True)
    slot_duration_minutes = Column(Integer, default=30, nullable=False)
    buffer_minutes = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    clinic = relationship("Clinic", back_populates="doctors")
    availability = relationship("DoctorAvailability", back_populates="doctor", cascade="all, delete-orphan")
    exceptions = relationship("AvailabilityException", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")
    series = relationship("AppointmentSeries", back_populates="doctor")
