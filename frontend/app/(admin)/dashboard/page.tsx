'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats().then(r => setStats(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Appointments Today" value={stats?.appointments_today ?? 0} color="text-brand-600" />
        <StatCard label="Upcoming" value={stats?.upcoming_appointments ?? 0} color="text-green-600" />
        <StatCard label="No Shows" value={stats?.total_no_shows ?? 0} color="text-red-500" />
        <StatCard label="Active Doctors" value={stats?.active_doctors ?? 0} color="text-purple-600" />
        <StatCard label="Total Patients" value={stats?.total_patients ?? 0} color="text-gray-700" />
      </div>
    </div>
  )
}
