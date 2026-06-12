import asyncio
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.appointment import Appointment
from app.models.reminder import Reminder, ReminderChannel, ReminderStatus

scheduler = AsyncIOScheduler(
    jobstores={"default": MemoryJobStore()},
    job_defaults={"misfire_grace_time": 3600},
)

def _job_wrapper(appointment_id: str, hours_before: int):
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # Schedule the coroutine in the existing loop
        asyncio.create_task(_send_reminder_job(appointment_id, hours_before))
    else:
        # Fallback if no loop is running (though it should be)
        asyncio.run(_send_reminder_job(appointment_id, hours_before))

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        print("[Scheduler] Started")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[Scheduler] Stopped")


async def _send_reminder_job(appointment_id: str, hours_before: int):
    from app.database import AsyncSessionLocal
    from app.models.user import User
    from app.models.doctor import Doctor
    from app.services.email_service import send_reminder

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
        appt = result.scalar_one_or_none()
        if not appt or appt.status in ["cancelled", "rescheduled", "completed"]:
            return

        patient = await db.get(User, appt.patient_id)
        doctor = await db.get(Doctor, appt.doctor_id)
        doctor_user = await db.get(User, doctor.user_id) if doctor else None
        if not patient or not doctor_user:
            return

        success = send_reminder(
            patient_email=patient.email, patient_name=patient.name,
            doctor_name=doctor_user.name, appt_date=str(appt.date),
            start_time=str(appt.start_time), hours_before=hours_before,
        )

        result = await db.execute(
            select(Reminder).where(
                Reminder.appointment_id == appointment_id,
                Reminder.status == ReminderStatus.pending,
            )
        )
        reminder = result.scalars().first()
        if reminder:
            reminder.status = ReminderStatus.sent if success else ReminderStatus.failed
            reminder.sent_at = datetime.now(timezone.utc)
            if not success:
                reminder.retry_count += 1
        await db.commit()


async def schedule_reminders(appointment: Appointment, db: AsyncSession):
    appt_dt = datetime.combine(appointment.date, appointment.start_time).replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)

    for hours_before in [24, 1]:
        fire_at = appt_dt - timedelta(hours=hours_before)
        if fire_at <= now:
            continue

        job_id = f"reminder_{appointment.id}_{hours_before}h"
        scheduler.add_job(
            _job_wrapper, "date", run_date=fire_at,
            args=[str(appointment.id), hours_before],
            id=job_id, replace_existing=True,
        )

        db.add(Reminder(
            appointment_id=appointment.id,
            channel=ReminderChannel.email,
            scheduled_at=fire_at,
            status=ReminderStatus.pending,
        ))


async def cancel_reminders(appointment_id: str, db: AsyncSession):
    for hours_before in [24, 1]:
        try:
            scheduler.remove_job(f"reminder_{appointment_id}_{hours_before}h")
        except Exception:
            pass

    result = await db.execute(
        select(Reminder).where(
            Reminder.appointment_id == appointment_id,
            Reminder.status == ReminderStatus.pending,
        )
    )
    for reminder in result.scalars().all():
        reminder.status = ReminderStatus.failed
