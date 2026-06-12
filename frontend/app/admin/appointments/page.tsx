"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAppointments } from "@/hooks/useAppointments";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/shared/Modal";
import type { AppointmentStatus } from "@/types";

const STATUSES: AppointmentStatus[] = ["pending", "confirmed", "cancelled", "completed", "no_show"];

export default function AdminAppointmentsPage() {
  const { appointments, isLoading, updateAppointment } = useAppointments();
  const [selected, setSelected] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<AppointmentStatus>("confirmed");
  const [saving, setSaving] = useState(false);

  const handleOverride = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateAppointment(selected, { status: newStatus });
      toast.success("Status updated");
      setSelected(null);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">All Appointments</h1>

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
                  Dr. {a.doctor_name} · {new Date(a.scheduled_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelected(a.id);
                    setNewStatus(a.status);
                  }}
                >
                  Override
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Override Appointment Status"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleOverride} disabled={saving}>
              {saving ? "Saving…" : "Apply"}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="text-sm text-slate-600">Select new status:</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
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
        </div>
      </Modal>
    </div>
  );
}
