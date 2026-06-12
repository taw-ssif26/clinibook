"use client";
import { LayoutDashboard, Calendar, Search } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";

const navItems = [
  { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
  { label: "Book", href: "/patient/book", icon: Search },
  { label: "Appointments", href: "/patient/appointments", icon: Calendar },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar navItems={navItems} title="CliniBook" />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
