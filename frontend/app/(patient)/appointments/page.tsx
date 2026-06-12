'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { appointmentApi, seriesApi } from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Appointment } from '@/types'

type Tab = 'upcoming' | 'past'

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('upcoming')
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { appointmentApi.my().then(r => setAppointments(r.data)).finally(() => setLoading(false)) }, [])

  const today = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter(a => a.date >= today && !['cancelled', 'rescheduled'].includes(a.status))
  const past = appointments.filter(a => a.date < today || ['cancelled', 'rescheduled', 'completed', 'no_show'].includes(a.status))
  const shown = tab === 'upcoming' ? upcoming : past

  const doCancel = async () => {
    if (!cancelTarget) return
    setSaving(true)
    try {
      await appointmentApi.cancel(cancelTarget.id, cancelReason || undefined)
      setAppointments(p => p.map(a => a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a))
      setCancelTarget(null); setCancelReason(''); toast.success('Appointment cancelled')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to cancel') }
    finally { setSaving(false) }
  }

  const doReschedule = async () => {
    if (!rescheduleTarget || !newDate || !newTime) return
    setSaving(true)
    try {
      const res = await appointmentApi.reschedule(rescheduleTarget.id, { new_date: newDate, new_start_time: newTime + ':00' })
      setAppointments(p => p.map(a => a.id === rescheduleTarget.id ? { ...a, status: 'rescheduled' } : a).concat([res.data]))
      setRescheduleTarget(null); setNewDate(''); setNewTime(''); toast.success('Appointment rescheduled')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed to reschedule') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <Link href="/patient/book" className="btn-primary">+ Book New</Link>
      </div>

      <div className="flex gap-1 mb-4 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {(['upcoming', 'past'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            {t} ({t === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          {tab === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments.'}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map(a => (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{formatDate(a.date)}</p>
                <p className="text-sm text-gray-500">{formatTime(a.start_time)} · <span className="capitalize">{a.appointment_type.replace('_', ' ')}</span></p>
                {a.cancellation_reason && <p className="text-xs text-red-500 mt-1">Reason: {a.cancellation_reason}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                {['pending', 'confirmed'].includes(a.status) && (
                  <div className="flex gap-2">
                    <button onClick={() => setRescheduleTarget(a)}
                      className="text-xs text-brand-600 hover:text-brand-800 font-medium">Reschedule</button>
                    <button onClick={() => setCancelTarget(a)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelTarget && (
        <Modal title="Cancel Appointment" onClose={() => setCancelTarget(null)}>
          <p className="text-sm text-gray-600 mb-4">
            Cancel appointment on <strong>{formatDate(cancelTarget.date)}</strong> at <strong>{formatTime(cancelTarget.start_time)}</strong>?
          </p>
          <div className="mb-4">
            <label className="label">Reason (optional)</label>
            <textarea className="input" rows={2} value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setCancelTarget(null)}>Keep it</button>
            <button className="btn-danger flex-1" onClick={doCancel} disabled={saving}>{saving ? 'Cancelling…' : 'Yes, Cancel'}</button>
          </div>
        </Modal>
      )}

      {rescheduleTarget && (
        <Modal title="Reschedule Appointment" onClose={() => setRescheduleTarget(null)}>
          <p className="text-sm text-gray-600 mb-4">
            Reschedule from <strong>{formatDate(rescheduleTarget.date)}</strong> at <strong>{formatTime(rescheduleTarget.start_time)}</strong>
          </p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="label">New Date</label>
              <input className="input" type="date" min={new Date().toISOString().split('T')[0]} value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div>
              <label className="label">New Time (HH:MM)</label>
              <input className="input" type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setRescheduleTarget(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={doReschedule} disabled={saving || !newDate || !newTime}>
              {saving ? 'Rescheduling…' : 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
