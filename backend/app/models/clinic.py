from sqlalchemy import Column, String, Integer, Time, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin


class Clinic(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "clinics"

    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    working_hours_start = Column(Time, nullable=True)
    working_hours_end = Column(Time, nullable=True)
    cancellation_cutoff_hours = Column(Integer, default=2, nullable=False)

    # Relationships
    users = relationship("User", back_populates="clinic")
    doctors = relationship("Doctor", back_populates="clinic")
    appointments = relationship("Appointment", back_populates="clinic")
