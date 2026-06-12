"use client";
import Link from "next/link";
import { toast } from "sonner";
import { useAppointments } from "@/hooks/useAppointments";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

export default function PatientAppointmentsPage() {
  const { appointments, isLoading, cancelAppointment } = useAppointments();

  const handleCancel = async (id: number) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await cancelAppointment(id);
      toast.success("Appointment cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const sorted = [...appointments].sort(
    (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">My Appointments</h1>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-500">No appointments found.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">Dr. {a.doctor_name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(a.scheduled_at).toLocaleString()} · {a.duration_minutes} min
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                <Link href={`/patient/appointments/${a.id}`}>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
                {(a.status === "pending" || a.status === "confirmed") && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(a.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
