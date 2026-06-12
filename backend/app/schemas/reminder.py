from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from app.models.reminder import ReminderChannel, ReminderStatus


class ReminderResponse(BaseModel):
    id: UUID
    appointment_id: UUID
    channel: ReminderChannel
    scheduled_at: datetime
    sent_at: datetime | None
    status: ReminderStatus
    retry_count: int

    model_config = {"from_attributes": True}
