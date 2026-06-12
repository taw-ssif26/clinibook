"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api from "@/lib/api";
import type { Appointment } from "@/types/appointment";

interface Stats {
  total_doctors: number;
  total_patients: number;
  today_appointments: number;
  pending_appointments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [today, setToday] = useState<Appointment[]>([]);

  useEffect(() => {
    api.get<Stats>("/admin/stats").then(({ data }) => setStats(data)).catch(() => {});
    const date = new Date().toISOString().split("T")[0];
    api.get<Appointment[]>("/appointments", { params: { date } }).then(({ data }) => setToday(data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Doctors", value: stats?.total_doctors },
          { label: "Patients", value: stats?.total_patients },
          { label: "Today", value: stats?.today_appointments },
          { label: "Pending", value: stats?.pending_appointments },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {value ?? "—"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium text-slate-900">Today's Appointments</h2>
        {today.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments today.</p>
        ) : (
          <div className="space-y-2">
            {today.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.patient_name}</p>
                  <p className="text-xs text-slate-500">
                    Dr. {a.doctor_name} · {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
