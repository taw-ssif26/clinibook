export type ExceptionType = 'day_off' | 'custom_hours'

export interface DoctorAvailability {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export interface AvailabilityException {
  id: string
  exception_date: string
  type: ExceptionType
  start_time: string | null
  end_time: string | null
  reason: string | null
}
