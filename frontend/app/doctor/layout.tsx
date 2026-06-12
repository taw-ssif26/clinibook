"use client";
import { LayoutDashboard, Calendar, Clock, UserCircle } from "lucide-react";
import { Sidebar } from "@/components/shared/Sidebar";

const navItems = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
  { label: "Schedule", href: "/doctor/schedule", icon: Clock },
  { label: "Profile", href: "/doctor/profile", icon: UserCircle },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar navItems={navItems} title="CliniBook" />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
