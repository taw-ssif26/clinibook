'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { formatDate, formatTime } from '@/lib/utils'
import type { User, Appointment } from '@/types'

export default function AdminPatientDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [patient, setPatient] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getPatient(id), adminApi.getAppointments()]).then(([p, a]) => {
      setPatient(p.data)
      setAppointments(a.data.filter((appt: Appointment) => appt.patient_id === id))
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!patient) return <p className="text-center text-gray-400 py-12">Patient not found.</p>

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Back to Patients</button>
      <div className="card mb-6 flex items-center gap-4">
        <Avatar name={patient.name} size="lg" />
        <div>
          <p className="font-semibold text-gray-900 text-lg">{patient.name}</p>
          <p className="text-sm text-gray-500">{patient.email}</p>
          {patient.phone && <p className="text-sm text-gray-500">{patient.phone}</p>}
          <p className="text-xs text-gray-400 mt-1">Joined {new Date(patient.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Appointment History ({appointments.length})</h2>
      <div className="card p-0 overflow-hidden">
        {appointments.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">No appointments yet.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Date','Time','Type','Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDate(a.date)}</td>
                  <td className="px-4 py-3 text-sm">{formatTime(a.start_time)}</td>
                  <td className="px-4 py-3 text-sm capitalize">{a.appointment_type.replace('_',' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
