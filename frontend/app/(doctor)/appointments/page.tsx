'use client'
import { useEffect, useState } from 'react'
import { doctorApi } from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Appointment, AppointmentStatus } from '@/types'

const DOCTOR_STATUSES: AppointmentStatus[] = ['confirmed', 'completed', 'no_show']

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('confirmed')
  const [saving, setSaving] = useState(false)

  useEffect(() => { doctorApi.myAppointments().then(r => setAppointments(r.data)).finally(() => setLoading(false)) }, [])

  const updateStatus = async () => {
    if (!selected) return; setSaving(true)
    try {
      const res = await doctorApi.updateStatus(selected.id, { status: newStatus })
      setAppointments(p => p.map(a => a.id === selected.id ? res.data : a))
      setSelected(null); toast.success('Status updated')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h1>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Date','Time','Type','Status',''].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appointments.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700">{formatDate(a.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatTime(a.start_time)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{a.appointment_type.replace('_',' ')}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3">
                  {['pending','confirmed'].includes(a.status) && (
                    <button onClick={() => { setSelected(a); setNewStatus(a.status === 'pending' ? 'confirmed' : 'completed') }}
                      className="text-xs text-brand-600 hover:text-brand-800 font-medium">Update</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!appointments.length && <p className="text-center text-gray-400 py-12">No appointments yet.</p>}
      </div>

      {selected && (
        <Modal title="Update Status" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{formatDate(selected.date)} at {formatTime(selected.start_time)}</p>
            <div><label className="label">New Status</label>
              <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value as AppointmentStatus)}>
                {DOCTOR_STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={updateStatus} disabled={saving}>{saving ? 'Saving…' : 'Update'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
