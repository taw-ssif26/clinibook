'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { appointmentApi } from '@/lib/api'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Appointment } from '@/types'

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    appointmentApi.get(id).then(r => setAppt(r.data)).finally(() => setLoading(false))
  }, [id])

  const cancel = async () => {
    if (!appt) return
    setSaving(true)
    try {
      await appointmentApi.cancel(appt.id, reason || undefined)
      setAppt(p => p ? { ...p, status: 'cancelled', cancellation_reason: reason } : p)
      setShowCancel(false); toast.success('Appointment cancelled')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />
  if (!appt) return <p className="text-center text-gray-400 py-12">Appointment not found.</p>

  const canAct = ['pending', 'confirmed'].includes(appt.status)

  return (
    <div className="max-w-lg">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Appointment Details</h1>

      <div className="card space-y-4">
        <div className="flex items-center justify-between"><span className="text-gray-500 text-sm">Status</span><StatusBadge status={appt.status} /></div>
        <div className="flex items-center justify-between"><span className="text-gray-500 text-sm">Date</span><span className="font-medium text-sm">{formatDate(appt.date)}</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500 text-sm">Time</span><span className="font-medium text-sm">{formatTime(appt.start_time)} – {formatTime(appt.end_time)}</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500 text-sm">Type</span><span className="text-sm capitalize">{appt.appointment_type.replace('_', ' ')}</span></div>
        <div className="flex items-center justify-between"><span className="text-gray-500 text-sm">Booked by</span><span className="text-sm capitalize">{appt.booked_by}</span></div>
        {appt.cancellation_reason && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-gray-500 text-sm">Cancellation reason</span>
            <p className="text-sm text-red-600 mt-1">{appt.cancellation_reason}</p>
          </div>
        )}
      </div>

      {canAct && (
        <div className="flex gap-3 mt-4">
          <button onClick={() => router.push('/patient/appointments')} className="btn-secondary flex-1">← Back to list</button>
          <button onClick={() => setShowCancel(true)} className="btn-danger flex-1">Cancel Appointment</button>
        </div>
      )}

      {showCancel && (
        <Modal title="Cancel Appointment" onClose={() => setShowCancel(false)}>
          <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
          <div className="mb-4"><label className="label">Reason (optional)</label><textarea className="input" rows={2} value={reason} onChange={e => setReason(e.target.value)} /></div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowCancel(false)}>Keep it</button>
            <button className="btn-danger flex-1" onClick={cancel} disabled={saving}>{saving ? 'Cancelling…' : 'Cancel'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
