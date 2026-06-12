"use client";
import Link from "next/link";
import { useAppointments } from "@/hooks/useAppointments";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { appointments, isLoading } = useAppointments({ status: "confirmed,pending" });

  const upcoming = appointments
    .filter((a) => new Date(a.scheduled_at) >= new Date())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Hello, {user?.full_name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your appointments</p>
        </div>
        <Link href="/patient/book">
          <Button>Book Appointment</Button>
        </Link>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium text-slate-900">Upcoming</h2>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-500">No upcoming appointments.</p>
            <Link href="/patient/book">
              <Button variant="outline" className="mt-4">Book your first appointment</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <Link key={a.id} href={`/patient/appointments/${a.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Dr. {a.doctor_name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(a.scheduled_at).toLocaleString()} · {a.duration_minutes} min
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
