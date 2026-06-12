"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWeeklyAvailability, useAvailabilityExceptions } from "@/hooks/useAvailability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAYS_OF_WEEK } from "@/lib/constants";

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const doctorId = user?.id ?? 0;
  const { availability, isLoading, updateSchedule } = useWeeklyAvailability(doctorId);
  const { exceptions, addException, deleteException } = useAvailabilityExceptions(doctorId);
  const [saving, setSaving] = useState(false);
  const [exForm, setExForm] = useState({ date: "", reason: "", is_unavailable: true });

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      await updateSchedule(availability);
      toast.success("Schedule saved");
    } catch {
      toast.error("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    try {
      await addException(exForm);
      toast.success("Exception added");
      setExForm({ date: "", reason: "", is_unavailable: true });
    } catch {
      toast.error("Failed to add exception");
    }
  };

  if (isLoading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">My Schedule</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS_OF_WEEK.map((day, i) => {
            const slot = availability.find((a) => a.day_of_week === i);
            return (
              <div key={day} className="flex items-center gap-4">
                <span className="w-24 text-sm text-slate-600">{day}</span>
                <span className="text-xs text-slate-400">{slot ? `${slot.start_time} – ${slot.end_time}` : "Not set"}</span>
              </div>
            );
          })}
          <Button onClick={handleSaveSchedule} disabled={saving} className="mt-2">
            {saving ? "Saving…" : "Save Schedule"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exceptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exceptions.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between text-sm">
              <span>{ex.date} {ex.reason ? `— ${ex.reason}` : ""}</span>
              <Button variant="ghost" size="sm" onClick={() => deleteException(ex.id)}>Remove</Button>
            </div>
          ))}
          <div className="flex gap-3 border-t pt-4">
            <Input
              type="date"
              value={exForm.date}
              onChange={(e) => setExForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Input
              placeholder="Reason (optional)"
              value={exForm.reason}
              onChange={(e) => setExForm((f) => ({ ...f, reason: e.target.value }))}
            />
            <Button onClick={handleAddException}>Add</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
