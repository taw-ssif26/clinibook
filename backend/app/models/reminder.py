import enum
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.mixins import UUIDMixin


class ReminderChannel(str, enum.Enum):
    email = "email"
    sms = "sms"
    whatsapp = "whatsapp"


class ReminderStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


class Reminder(UUIDMixin, Base):
    __tablename__ = "reminders"

    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=False)
    channel = Column(SAEnum(ReminderChannel), default=ReminderChannel.email, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SAEnum(ReminderStatus), default=ReminderStatus.pending, nullable=False)
    retry_count = Column(Integer, default=0, nullable=False)

    appointment = relationship("Appointment", back_populates="reminders")
