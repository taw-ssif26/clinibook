import resend
from app.config import settings

resend.api_key = settings.RESEND_API_KEY


def _send(to: str, subject: str, html: str) -> bool:
    """Send email via Resend. Returns True on success."""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL SKIP] No API key. Would send to {to}: {subject}")
        return True
    try:
        resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": to,
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def send_booking_confirmation(patient_email: str, patient_name: str, doctor_name: str,
                               appt_date: str, start_time: str) -> bool:
    return _send(
        to=patient_email,
        subject=f"Appointment Confirmed — {appt_date}",
        html=f"""
        <h2>Appointment Confirmed</h2>
        <p>Hi {patient_name},</p>
        <p>Your appointment with <strong>Dr. {doctor_name}</strong> is confirmed.</p>
        <ul>
          <li><strong>Date:</strong> {appt_date}</li>
          <li><strong>Time:</strong> {start_time}</li>
        </ul>
        <p>We'll send you a reminder 24 hours before.</p>
        """,
    )


def send_reminder(patient_email: str, patient_name: str, doctor_name: str,
                   appt_date: str, start_time: str, hours_before: int) -> bool:
    return _send(
        to=patient_email,
        subject=f"Reminder: Appointment in {hours_before} hour(s)",
        html=f"""
        <h2>Appointment Reminder</h2>
        <p>Hi {patient_name},</p>
        <p>This is a reminder for your appointment in <strong>{hours_before} hour(s)</strong>.</p>
        <ul>
          <li><strong>Doctor:</strong> Dr. {doctor_name}</li>
          <li><strong>Date:</strong> {appt_date}</li>
          <li><strong>Time:</strong> {start_time}</li>
        </ul>
        """,
    )


def send_cancellation_confirmation(patient_email: str, patient_name: str,
                                    doctor_name: str, appt_date: str) -> bool:
    return _send(
        to=patient_email,
        subject="Appointment Cancelled",
        html=f"""
        <h2>Appointment Cancelled</h2>
        <p>Hi {patient_name},</p>
        <p>Your appointment with Dr. {doctor_name} on <strong>{appt_date}</strong> has been cancelled.</p>
        <p>You can book a new appointment anytime.</p>
        """,
    )


def send_reschedule_confirmation(patient_email: str, patient_name: str, doctor_name: str,
                                  new_date: str, new_time: str) -> bool:
    return _send(
        to=patient_email,
        subject="Appointment Rescheduled",
        html=f"""
        <h2>Appointment Rescheduled</h2>
        <p>Hi {patient_name},</p>
        <p>Your appointment with Dr. {doctor_name} has been rescheduled.</p>
        <ul>
          <li><strong>New Date:</strong> {new_date}</li>
          <li><strong>New Time:</strong> {new_time}</li>
        </ul>
        """,
    )
