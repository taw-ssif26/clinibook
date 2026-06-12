from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel
from app.schemas.user import UserResponse


class DoctorCreate(BaseModel):
    # User fields
    name: str
    email: str
    phone: str | None = None
    password: str
    # Doctor fields
    specialization: str | None = None
    department: str | None = None
    bio: str | None = None
    consultation_fee: Decimal | None = None
    languages_spoken: list[str] = []
    slot_duration_minutes: int = 30
    buffer_minutes: int = 0


class DoctorUpdate(BaseModel):
    specialization: str | None = None
    department: str | None = None
    bio: str | None = None
    consultation_fee: Decimal | None = None
    languages_spoken: list[str] | None = None
    slot_duration_minutes: int | None = None
    buffer_minutes: int | None = None


class DoctorResponse(BaseModel):
    id: UUID
    specialization: str | None
    department: str | None
    bio: str | None
    consultation_fee: Decimal | None
    languages_spoken: list[str]
    slot_duration_minutes: int
    buffer_minutes: int
    is_active: bool
    user: UserResponse

    model_config = {"from_attributes": True}


class DoctorPublicProfile(BaseModel):
    """Returned to patients browsing doctors — no internal fields."""
    id: UUID
    specialization: str | None
    department: str | None
    bio: str | None
    consultation_fee: Decimal | None
    languages_spoken: list[str]
    slot_duration_minutes: int
    name: str       # flattened from user
    avatar_url: str | None

    model_config = {"from_attributes": True}
