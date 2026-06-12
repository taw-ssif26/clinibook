export interface ClinicSettings {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  default_slot_duration: number;
  opening_time: string;
  closing_time: string;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  target_type: string;
  target_id: number;
  detail?: string;
  created_at: string;
}

export interface AppointmentSeries {
  id: number;
  patient_id: number;
  doctor_id: number;
  recurrence_rule: string;
  start_date: string;
  end_date?: string;
  total_instances: number;
  status: "active" | "paused" | "cancelled";
}
