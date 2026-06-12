'use client'
import { useEffect, useState } from 'react'
import { doctorApi } from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate, formatTime } from '@/lib/utils'
import type { Appointment } from '@/types'

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { doctorApi.myAppointments().then(r => setAppointments(r.data)).finally(() => setLoading(false)) }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => a.date === today && !['cancelled','rescheduled'].includes(a.status))
  const upcoming = appointments.filter(a => a.date > today && !['cancelled','rescheduled'].includes(a.status)).slice(0, 5)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Schedule</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card"><p className="text-sm text-gray-500">Today</p><p className="text-3xl font-bold text-brand-600">{todayAppts.length}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Upcoming</p><p className="text-3xl font-bold text-green-600">{upcoming.length}</p></div>
        <div className="card"><p className="text-sm text-gray-500">Total</p><p className="text-3xl font-bold text-gray-700">{appointments.length}</p></div>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Today's Appointments</h2>
      {todayAppts.length === 0 ? (
        <div className="card text-center text-gray-400 py-10">No appointments today.</div>
      ) : (
        <div className="space-y-2">
          {todayAppts.map(a => (
            <div key={a.id} className="card flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{formatTime(a.start_time)} – {formatTime(a.end_time)}</p>
                <p className="text-xs text-gray-500 capitalize">{a.appointment_type.replace('_',' ')}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
