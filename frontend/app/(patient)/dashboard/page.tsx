'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { appointmentApi } from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate, formatTime } from '@/lib/utils'
import type { Appointment } from '@/types'

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { appointmentApi.my().then(r => setAppointments(r.data)).finally(() => setLoading(false)) }, [])

  const upcoming = appointments.filter(a => a.date >= new Date().toISOString().split('T')[0] && !['cancelled','rescheduled'].includes(a.status))
  const past = appointments.filter(a => a.date < new Date().toISOString().split('T')[0]).slice(0, 5)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <Link href="/patient/book" className="btn-primary">+ Book Appointment</Link>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Appointments</h2>
      {upcoming.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400 mb-3">No upcoming appointments.</p>
          <Link href="/patient/book" className="btn-primary inline-flex">Book one now</Link>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {upcoming.map(a => (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{formatDate(a.date)}</p>
                <p className="text-sm text-gray-500">{formatTime(a.start_time)} · {a.appointment_type.replace('_',' ')}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                <Link href={`/patient/appointments/${a.id}`} className="text-sm text-brand-600 hover:underline">View</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent History</h2>
          <div className="space-y-2">
            {past.map(a => (
              <div key={a.id} className="card flex items-center justify-between py-3 opacity-70">
                <div><p className="text-sm text-gray-700">{formatDate(a.date)} · {formatTime(a.start_time)}</p></div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
