from uuid import UUID
from datetime import date, time
from pydantic import BaseModel
from app.models.series import RecurrenceType, SeriesStatus


class SeriesCreate(BaseModel):
    doctor_id: UUID
    recurrence_type: RecurrenceType
    preferred_time: time
    day_of_week: int       # 0=Monday, 6=Sunday
    start_date: date
    end_date: date | None = None
    occurrences_total: int | None = None


class SeriesResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    clinic_id: UUID
    recurrence_type: RecurrenceType
    preferred_time: time
    day_of_week: int
    start_date: date
    end_date: date | None
    occurrences_total: int | None
    occurrences_completed: int
    status: SeriesStatus

    model_config = {"from_attributes": True}


class SeriesStatusUpdate(BaseModel):
    status: SeriesStatus
