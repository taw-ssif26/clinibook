"use client";
import { use, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Appointment } from "@/types/appointment";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageLoader } from "@/components/shared/LoadingSpinner";

export default function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<Appointment[]>(`/admin/patients/${id}/appointments`)
      .then(({ data }) => setAppointments(data))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Patient History</h1>
      {appointments.length === 0 ? (
        <p className="text-sm text-slate-500">No appointments found.</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">Dr. {a.doctor_name}</p>
                <p className="text-xs text-slate-500">{new Date(a.scheduled_at).toLocaleString()}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
