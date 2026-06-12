"use client";
import { LayoutDashboard, Users, Calendar, UserCircle, Settings } from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Doctors", href: "/admin/doctors", icon: UserCircle },
  { label: "Appointments", href: "/admin/appointments", icon: Calendar },
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar navItems={navItems} title="CliniBook Admin" />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
