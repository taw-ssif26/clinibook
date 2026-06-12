"use client";
import { use, useState } from "react";
import { toast } from "sonner";
import { useDoctor, useDoctors } from "@/hooks/useDoctors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/shared/LoadingSpinner";

export default function AdminDoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { doctor, isLoading } = useDoctor(Number(id));
  const { updateDoctor } = useDoctors();
  const [form, setForm] = useState({ full_name: "", specialization: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (!initialized && doctor) {
    setForm({
      full_name: doctor.full_name,
      specialization: doctor.specialization,
      phone: doctor.phone ?? "",
    });
    setInitialized(true);
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoctor(Number(id), form);
      toast.success("Doctor updated");
    } catch {
      toast.error("Failed to update doctor");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (!doctor) return <p className="text-slate-500">Doctor not found.</p>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Edit Doctor</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["full_name", "specialization", "phone"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={k}>
                {k.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Label>
              <Input id={k} value={form[k]} onChange={set(k)} />
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
