export interface Doctor {
  id: string
  specialization: string | null
  department: string | null
  bio: string | null
  consultation_fee: number | null
  languages_spoken: string[]
  slot_duration_minutes: number
  buffer_minutes: number
  is_active: boolean
  user: { id: string; name: string; email: string; phone: string | null; avatar_url: string | null; role: string; is_active: boolean; created_at: string }
}

export interface DoctorPublicProfile {
  id: string
  specialization: string | null
  department: string | null
  bio: string | null
  consultation_fee: number | null
  languages_spoken: string[]
  slot_duration_minutes: number
  name: string
  avatar_url: string | null
}

export interface DoctorUpdate {
  specialization?: string
  department?: string
  bio?: string
  consultation_fee?: number
  languages_spoken?: string[]
  slot_duration_minutes?: number
  buffer_minutes?: number
}
