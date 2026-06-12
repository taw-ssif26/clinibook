"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import type { ClinicSettings } from "@/types/clinic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const [form, setForm] = useState<ClinicSettings>({
    name: "",
    address: "",
    phone: "",
    email: "",
    default_slot_duration: 30,
    opening_time: "09:00",
    closing_time: "17:00",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<ClinicSettings>("/admin/settings").then(({ data }) => setForm(data)).catch(() => {});
  }, []);

  const set = (k: keyof ClinicSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", form);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Clinic Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["name", "address", "phone", "email"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</Label>
              <Input id={k} value={form[k] ?? ""} onChange={set(k)} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="opening_time">Opening Time</Label>
              <Input id="opening_time" type="time" value={form.opening_time} onChange={set("opening_time")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="closing_time">Closing Time</Label>
              <Input id="closing_time" type="time" value={form.closing_time} onChange={set("closing_time")} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="slot_duration">Default Slot Duration (minutes)</Label>
            <Input
              id="slot_duration"
              type="number"
              value={form.default_slot_duration}
              onChange={(e) => setForm((f) => ({ ...f, default_slot_duration: Number(e.target.value) }))}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
