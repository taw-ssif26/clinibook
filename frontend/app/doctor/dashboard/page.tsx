"use client";
import { useEffect, useState } from "react";
import { useAppointments } from "@/hooks/useAppointments";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const { appointments, isLoading } = useAppointments({ date: today });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Good {getGreeting()}, Dr. {user?.full_name?.split(" ")[1] ?? user?.full_name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here's your schedule for today.</p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-medium text-slate-900">Today's Appointments</h2>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments today.</p>
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
                    {new Date(a.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {a.duration_minutes} min
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
