'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Appointment, AppointmentStatus } from '@/types'

const STATUSES: AppointmentStatus[] = ['pending','confirmed','completed','cancelled','no_show','rescheduled']

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('confirmed')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { adminApi.getAppointments().then(r => setAppointments(r.data)).finally(() => setLoading(false)) }, [])

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  const override = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await adminApi.overrideAppt(selected.id, { status: newStatus, internal_notes: notes })
      setAppointments(p => p.map(a => a.id === selected.id ? res.data : a))
      setSelected(null); toast.success('Status updated')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Appointments</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Patient ID','Doctor ID','Date','Time','Type','Status',''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{a.patient_id.slice(0,8)}…</td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{a.doctor_id.slice(0,8)}…</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatDate(a.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatTime(a.start_time)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{a.appointment_type.replace('_',' ')}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => { setSelected(a); setNewStatus(a.status); setNotes(a.internal_notes || '') }}
                    className="text-xs text-brand-600 hover:text-brand-800 font-medium">Override</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="text-center text-gray-400 py-12">No appointments found.</p>}
      </div>

      {selected && (
        <Modal title="Override Appointment" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formatDate(selected.date)} at {formatTime(selected.start_time)}</p></div>
            <div><label className="label">New Status</label>
              <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value as AppointmentStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div><label className="label">Internal Notes (optional)</label><textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={override} disabled={saving}>{saving ? 'Saving…' : 'Apply Override'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
