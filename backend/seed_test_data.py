import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.clinic import Clinic
from app.models.doctor import Doctor
from app.models.availability import DoctorAvailability
from app.utils.auth import get_password_hash
from datetime import time

async def seed_data():
    async with AsyncSessionLocal() as db:
        # 1. Create a Clinic
        clinic = Clinic(
            name="City Health Clinic",
            address="123 Main St, Metro City",
            phone="555-0199",
            email="contact@cityhealth.com",
            working_hours_start="09:00",
            working_hours_end="17:00"
        )
        db.add(clinic)
        await db.flush()

        # 2. Create Admin
        admin = User(
            name="Super Admin",
            email="admin@clinibook.com",
            phone="555-1111",
            password_hash=get_password_hash("admin123"),
            role=UserRole.admin,
            clinic_id=clinic.id
        )
        db.add(admin)

        # 3. Create Doctor
        doc_user = User(
            name="Dr. Smith",
            email="smith@clinibook.com",
            phone="555-2222",
            password_hash=get_password_hash("doctor123"),
            role=UserRole.doctor,
            clinic_id=clinic.id
        )
        db.add(doc_user)
        await db.flush()

        doctor = Doctor(
            user_id=doc_user.id,
            clinic_id=clinic.id,
            specialization="Cardiology",
            department="Heart Center",
            bio="Experienced cardiologist.",
            consultation_fee=100,
            slot_duration_minutes=30
        )
        db.add(doctor)
        await db.flush()

        # 4. Create Availability for Doctor (Monday)
        avail = DoctorAvailability(
            doctor_id=doctor.id,
            day_of_week=0, # Monday
            start_time=time(9, 0),
            end_time=time(12, 0)
        )
        db.add(avail)

        # 5. Create Patient
        patient = User(
            name="John Doe",
            email="john@example.com",
            phone="555-3333",
            password_hash=get_password_hash("patient123"),
            role=UserRole.patient,
            clinic_id=clinic.id
        )
        db.add(patient)

        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
