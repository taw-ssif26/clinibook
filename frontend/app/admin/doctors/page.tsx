"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useDoctors } from "@/hooks/useDoctors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DoctorCreate } from "@/types/doctor";

export default function AdminDoctorsPage() {
  const { doctors, isLoading, createDoctor, deactivateDoctor } = useDoctors();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<DoctorCreate>({
    email: "",
    password: "",
    full_name: "",
    specialization: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof DoctorCreate) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAdd = async () => {
    setSaving(true);
    try {
      await createDoctor(form);
      toast.success("Doctor added");
      setShowAdd(false);
      setForm({ email: "", password: "", full_name: "", specialization: "", phone: "" });
    } catch {
      toast.error("Failed to add doctor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!confirm(`Deactivate ${name}?`)) return;
    try {
      await deactivateDoctor(id);
      toast.success("Doctor deactivated");
    } catch {
      toast.error("Failed to deactivate doctor");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Doctors</h1>
        <Button onClick={() => setShowAdd(true)}>Add Doctor</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-2">
          {doctors.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{d.full_name}</p>
                <p className="text-xs text-slate-500">{d.specialization}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={d.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}>
                  {d.is_active ? "Active" : "Inactive"}
                </Badge>
                <Link href={`/admin/doctors/${d.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                {d.is_active && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeactivate(d.id, d.full_name)}
                  >
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Doctor"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add Doctor"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          {(["full_name", "email", "password", "specialization", "phone"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={k}>{k.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Label>
              <Input
                id={k}
                type={k === "password" ? "password" : "text"}
                value={form[k] ?? ""}
                onChange={set(k)}
              />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
