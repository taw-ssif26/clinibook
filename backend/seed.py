"""
Seed script — creates demo data for development/testing.
Run: python seed.py
Requires DB to be running and migrations applied.
"""
import asyncio
from datetime import time
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.models.clinic import Clinic
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.models.availability import DoctorAvailability
from app.routers.auth import hash_password


async def seed():
    async with AsyncSessionLocal() as db:
        # Clinic
        clinic = Clinic(
            name="CliniBook Demo Clinic",
            address="123 Health Street, Dhaka",
            phone="+8801700000000",
            email="clinic@demo.com",
            working_hours_start=time(9, 0),
            working_hours_end=time(17, 0),
            cancellation_cutoff_hours=2,
        )
        db.add(clinic)
        await db.flush()

        # Admin user
        admin_user = User(
            clinic_id=clinic.id,
            name="Admin User",
            email="admin@demo.com",
            password_hash=hash_password("admin123"),
            role=UserRole.admin,
        )
        db.add(admin_user)

        # Doctor 1
        doc1_user = User(
            clinic_id=clinic.id,
            name="Dr. Sarah Ahmed",
            email="sarah@demo.com",
            password_hash=hash_password("doctor123"),
            role=UserRole.doctor,
        )
        db.add(doc1_user)
        await db.flush()

        doc1 = Doctor(
            user_id=doc1_user.id,
            clinic_id=clinic.id,
            specialization="General Medicine",
            department="General",
            bio="10 years of experience in general medicine.",
            consultation_fee=500,
            languages_spoken=["English", "Bengali"],
            slot_duration_minutes=30,
        )
        db.add(doc1)
        await db.flush()

        # Doctor 1 availability: Mon-Fri 9-17
        for day in range(5):
            db.add(DoctorAvailability(
                doctor_id=doc1.id,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
            ))

        # Doctor 2
        doc2_user = User(
            clinic_id=clinic.id,
            name="Dr. Rahim Khan",
            email="rahim@demo.com",
            password_hash=hash_password("doctor123"),
            role=UserRole.doctor,
        )
        db.add(doc2_user)
        await db.flush()

        doc2 = Doctor(
            user_id=doc2_user.id,
            clinic_id=clinic.id,
            specialization="Physiotherapy",
            department="Rehab",
            bio="Specialist in sports injuries and rehabilitation.",
            consultation_fee=700,
            languages_spoken=["Bengali", "English"],
            slot_duration_minutes=45,
        )
        db.add(doc2)
        await db.flush()

        for day in range(6):  # Mon-Sat
            db.add(DoctorAvailability(
                doctor_id=doc2.id,
                day_of_week=day,
                start_time=time(10, 0),
                end_time=time(16, 0),
            ))

        # Patient
        patient = User(
            clinic_id=clinic.id,
            name="Test Patient",
            email="patient@demo.com",
            password_hash=hash_password("patient123"),
            role=UserRole.patient,
        )
        db.add(patient)

        await db.commit()
        print("✅ Seed complete")
        print("  admin@demo.com    / admin123")
        print("  sarah@demo.com    / doctor123")
        print("  rahim@demo.com    / doctor123")
        print("  patient@demo.com  / patient123")


if __name__ == "__main__":
    asyncio.run(seed())
