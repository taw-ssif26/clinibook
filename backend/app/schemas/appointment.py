from uuid import UUID
from datetime import date, time, datetime
from pydantic import BaseModel
from app.models.appointment import AppointmentType, AppointmentStatus, BookedBy


class AppointmentCreate(BaseModel):
    doctor_id: UUID
    date: date
    start_time: time
    appointment_type: AppointmentType = AppointmentType.first_visit
    internal_notes: str | None = None


class AdminAppointmentCreate(AppointmentCreate):
    """Admin can book on behalf of a patient."""
    patient_id: UUID


class AppointmentResponse(BaseModel):
    id: UUID
    clinic_id: UUID
    patient_id: UUID
    doctor_id: UUID
    series_id: UUID | None
    appointment_type: AppointmentType
    date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    internal_notes: str | None
    booked_by: BookedBy
    cancellation_reason: str | None
    rescheduled_to_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StatusUpdateRequest(BaseModel):
    status: AppointmentStatus
    internal_notes: str | None = None


class CancelRequest(BaseModel):
    reason: str | None = None


class RescheduleRequest(BaseModel):
    new_date: date
    new_start_time: time


class AdminOverrideRequest(BaseModel):
    status: AppointmentStatus
    internal_notes: str | None = None
    reason: str | None = None
