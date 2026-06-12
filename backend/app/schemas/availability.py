from uuid import UUID
from datetime import date, time
from pydantic import BaseModel, model_validator
from app.models.availability import ExceptionType


class AvailabilityCreate(BaseModel):
    day_of_week: int   # 0=Monday, 6=Sunday
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class AvailabilityResponse(BaseModel):
    id: UUID
    day_of_week: int
    start_time: time
    end_time: time
    is_active: bool

    model_config = {"from_attributes": True}


class ExceptionCreate(BaseModel):
    exception_date: date
    type: ExceptionType
    start_time: time | None = None
    end_time: time | None = None
    reason: str | None = None

    @model_validator(mode="after")
    def validate_custom_hours(self):
        if self.type == ExceptionType.custom_hours:
            if not self.start_time or not self.end_time:
                raise ValueError("start_time and end_time required for custom_hours")
            if self.end_time <= self.start_time:
                raise ValueError("end_time must be after start_time")
        return self


class ExceptionResponse(BaseModel):
    id: UUID
    exception_date: date
    type: ExceptionType
    start_time: time | None
    end_time: time | None
    reason: str | None

    model_config = {"from_attributes": True}


class SlotResponse(BaseModel):
    start_time: time
    end_time: time
