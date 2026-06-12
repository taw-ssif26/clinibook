"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { User } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<User[]>("/admin/patients")
      .then(({ data }) => setPatients(data))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{p.full_name}</p>
                <p className="text-xs text-slate-500">{p.email}</p>
              </div>
              <Link href={`/admin/patients/${p.id}`}>
                <Button variant="outline" size="sm">View</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
