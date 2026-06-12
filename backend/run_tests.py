import httpx
import asyncio

BASE_URL = "http://localhost:8000"

async def test_backend():
    async with httpx.AsyncClient() as client:
        print("\n--- Testing Auth ---")
        # 1. Login as Patient
        login_res = await client.post(f"{BASE_URL}/auth/login", json={
            "email": "john@example.com",
            "password": "patient123"
        })
        if login_res.status_code != 200:
            print(f"Login Failed: {login_res.text}")
            return
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Patient login successful.")

        # 2. Browse Doctors
        docs_res = await client.get(f"{BASE_URL}/patients/doctors", headers=headers)
        print(f"Browse Doctors: {docs_res.status_code}")
        doctors = docs_res.json()
        doc_id = doctors[0]["id"]
        clinic_id = doctors[0]["clinic_id"]

        # 3. Check Availability (Monday, 2026-06-15)
        slots_res = await client.get(f"{BASE_URL}/availability/{doc_id}/slots?date=2026-06-15", headers=headers)
        print(f"Availability Slots: {slots_res.status_code}")
        slots = slots_res.json()
        print(f"Found {len(slots)} slots.")

        # 4. Book Appointment
        if slots:
            book_res = await client.post(f"{BASE_URL}/appointments", headers=headers, json={
                "doctor_id": doc_id,
                "clinic_id": clinic_id,
                "appointment_type": "first_visit",
                "date": "2026-06-15",
                "start_time": slots[0]["start_time"],
                "end_time": slots[0]["end_time"]
            })
            print(f"Book Appointment: {book_res.status_code}")
            if book_res.status_code == 201:
                appt_id = book_res.json()["id"]
                
                # 5. View My Appointments
                my_res = await client.get(f"{BASE_URL}/appointments/my", headers=headers)
                print(f"My Appointments: {my_res.status_code} (Count: {len(my_res.json())})")

                # 6. Cancel Appointment
                can_res = await client.put(f"{BASE_URL}/appointments/{appt_id}/cancel", headers=headers, json={
                    "cancellation_reason": "Testing"
                })
                print(f"Cancel Appointment: {can_res.status_code}")

        print("\n--- Testing Admin ---")
        admin_login = await client.post(f"{BASE_URL}/auth/login", json={
            "email": "admin@clinibook.com",
            "password": "admin123"
        })
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        stats_res = await client.get(f"{BASE_URL}/admin/dashboard/stats", headers=admin_headers)
        print(f"Admin Stats: {stats_res.json()}")

if __name__ == "__main__":
    asyncio.run(test_backend())
