"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDoctor } from "@/hooks/useDoctors";
import { useAvailableSlots } from "@/hooks/useAvailability";
import { useAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader } from "@/components/shared/LoadingSpinner";

export default function BookDoctorPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { doctorId } = use(params);
  const router = useRouter();
  const { doctor, isLoading } = useDoctor(Number(doctorId));
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const { slots, isLoading: slotsLoading } = useAvailableSlots(Number(doctorId), date);
  const { bookAppointment } = useAppointments();

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      await bookAppointment({
        doctor_id: Number(doctorId),
        scheduled_at: selectedSlot,
        duration_minutes: 30,
        notes,
      });
      toast.success("Appointment booked!");
      router.push("/patient/appointments");
    } catch {
      toast.error("Booking failed. Slot may no longer be available.");
    } finally {
      setBooking(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (!doctor) return <p className="text-slate-500">Doctor not found.</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Book with Dr. {doctor.full_name}</h1>
        <p className="text-sm text-slate-500">{doctor.specialization}</p>
      </div>

      {/* Step 1: Pick date */}
      <div className="space-y-1">
        <Label>Select Date</Label>
        <Input
          type="date"
          value={date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => { setDate(e.target.value); setSelectedSlot(""); }}
        />
      </div>

      {/* Step 2: Pick slot */}
      {date && (
        <div className="space-y-2">
          <Label>Available Slots</Label>
          {slotsLoading ? (
            <p className="text-sm text-slate-500">Loading slots…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-slate-500">No slots available on this date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const time = new Date(slot.datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const active = selectedSlot === slot.datetime;
                return (
                  <button
                    key={slot.datetime}
                    onClick={() => setSelectedSlot(slot.datetime)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium border transition-colors ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Notes */}
      {selectedSlot && (
        <div className="space-y-1">
          <Label>Notes (optional)</Label>
          <Input
            placeholder="Reason for visit…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {/* Step 4: Confirm */}
      {selectedSlot && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1">
          <p className="text-sm font-medium text-slate-900">Booking Summary</p>
          <p className="text-sm text-slate-600">Dr. {doctor.full_name}</p>
          <p className="text-sm text-slate-600">{new Date(selectedSlot).toLocaleString()}</p>
          <Button onClick={handleBook} disabled={booking} className="mt-3 w-full">
            {booking ? "Booking…" : "Confirm Booking"}
          </Button>
        </div>
      )}
    </div>
  );
}
