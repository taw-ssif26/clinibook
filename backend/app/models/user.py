import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class UserRole(str, enum.Enum):
    admin = "admin"
    doctor = "doctor"
    patient = "patient"


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.patient)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    clinic = relationship("Clinic", back_populates="users")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    appointments_as_patient = relationship(
        "Appointment", back_populates="patient", foreign_keys="Appointment.patient_id"
    )
    audit_logs = relationship("AuditLog", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
