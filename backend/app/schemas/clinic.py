from uuid import UUID
from datetime import time
from pydantic import BaseModel, EmailStr


class ClinicUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    logo_url: str | None = None
    working_hours_start: time | None = None
    working_hours_end: time | None = None
    cancellation_cutoff_hours: int | None = None


class ClinicResponse(BaseModel):
    id: UUID
    name: str
    address: str | None
    phone: str | None
    email: str | None
    logo_url: str | None
    working_hours_start: time | None
    working_hours_end: time | None
    cancellation_cutoff_hours: int

    model_config = {"from_attributes": True}
