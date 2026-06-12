"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAppointments } from "@/hooks/useAppointments";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/shared/Modal";
import type { Appointment } from "@/types/appointment";
import type { AppointmentStatus } from "@/types";

const DOCTOR_STATUSES: AppointmentStatus[] = ["confirmed", "completed", "no_show"];

export default function DoctorAppointmentsPage() {
  const { appointments, isLoading, updateAppointment } = useAppointments();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentStatus>("confirmed");
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateAppointment(selected.id, { status: newStatus });
      toast.success("Status updated");
      setSelected(null);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">My Appointments</h1>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{a.patient_name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(a.scheduled_at).toLocaleString()} · {a.duration_minutes} min
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                {a.status !== "cancelled" && a.status !== "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelected(a);
                      setNewStatus(a.status);
                    }}
                  >
                    Update
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Update Status"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2 pt-2">
          {DOCTOR_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setNewStatus(s)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium border transition-colors ${
                newStatus === s
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
