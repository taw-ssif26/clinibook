"use client";
import Link from "next/link";
import { useState } from "react";
import { useDoctors } from "@/hooks/useDoctors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PatientBookPage() {
  const { doctors, isLoading } = useDoctors();
  const [search, setSearch] = useState("");

  const filtered = doctors.filter(
    (d) =>
      d.is_active &&
      (d.full_name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Book Appointment</h1>
        <p className="text-sm text-slate-500 mt-1">Choose a doctor to get started</p>
      </div>

      <Input
        placeholder="Search by name or specialization…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading doctors…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="rounded-lg border border-slate-200 bg-white p-5 space-y-3"
            >
              <div>
                <p className="font-medium text-slate-900">{d.full_name}</p>
                <Badge className="mt-1 bg-slate-100 text-slate-600 text-xs">
                  {d.specialization}
                </Badge>
              </div>
              {d.bio && <p className="text-xs text-slate-500 line-clamp-2">{d.bio}</p>}
              <Link href={`/patient/book/${d.id}`}>
                <Button size="sm" className="w-full">Select</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
