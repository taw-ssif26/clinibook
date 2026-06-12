"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useDoctors } from "@/hooks/useDoctors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const { updateDoctor } = useDoctors();
  const [form, setForm] = useState({ full_name: user?.full_name ?? "", specialization: "", phone: "", bio: "" });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoctor(user.id, form);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {(["full_name", "specialization", "phone", "bio"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={k}>{k.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</Label>
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
