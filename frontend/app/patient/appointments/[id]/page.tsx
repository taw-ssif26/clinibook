"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppointment, useAppointments } from "@/hooks/useAppointments";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/LoadingSpinner";

export default function PatientAppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { appointment, isLoading } = useAppointment(Number(id));
  const { cancelAppointment } = useAppointments();

  const handleCancel = async () => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await cancelAppointment(Number(id));
      toast.success("Appointment cancelled");
      router.push("/patient/appointments");
    } catch {
      toast.error("Failed to cancel");
    }
  };

  if (isLoading) return <PageLoader />;
  if (!appointment) return <p className="text-slate-500">Appointment not found.</p>;

  const canCancel = appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Appointment Details</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Dr. {appointment.doctor_name}
            <StatusBadge status={appointment.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Date & Time" value={new Date(appointment.scheduled_at).toLocaleString()} />
          <Row label="Duration" value={`${appointment.duration_minutes} minutes`} />
          {appointment.notes && <Row label="Notes" value={appointment.notes} />}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancel} className="mt-4 w-full">
              Cancel Appointment
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}
