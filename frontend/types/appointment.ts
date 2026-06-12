export type AppointmentType = 'first_visit' | 'follow_up' | 'recurring' | 'walk_in'
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
export type RecurrenceType = 'weekly' | 'biweekly' | 'monthly'

export interface Appointment {
  id: string
  clinic_id: string
  patient_id: string
  doctor_id: string
  series_id: string | null
  appointment_type: AppointmentType
  date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  internal_notes: string | null
  booked_by: 'patient' | 'admin'
  cancellation_reason: string | null
  rescheduled_to_id: string | null
  created_at: string
}

export interface AppointmentSeries {
  id: string
  patient_id: string
  doctor_id: string
  clinic_id: string
  recurrence_type: RecurrenceType
  preferred_time: string
  day_of_week: number
  start_date: string
  end_date: string | null
  occurrences_total: number | null
  occurrences_completed: number
  status: 'active' | 'paused' | 'cancelled'
}

export interface TimeSlot { start_time: string; end_time: string }
