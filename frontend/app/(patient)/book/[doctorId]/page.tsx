'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doctorApi, availabilityApi, appointmentApi, seriesApi } from '@/lib/api'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatCurrency, formatTime } from '@/lib/utils'
import { APPOINTMENT_TYPES, RECURRENCE_TYPES, DAYS } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { DoctorPublicProfile, TimeSlot } from '@/types'

type Step = 'type' | 'date' | 'confirm'

export default function BookDoctorPage() {
  const { doctorId } = useParams<{ doctorId: string }>()
  const router = useRouter()
  const [doctor, setDoctor] = useState<DoctorPublicProfile | null>(null)
  const [step, setStep] = useState<Step>('type')
  const [apptType, setApptType] = useState('first_visit')
  const [isRecurring, setIsRecurring] = useState(false)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [recurrence, setRecurrence] = useState({ recurrence_type: 'weekly', day_of_week: 0, occurrences_total: 8 })
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    doctorApi.getProfile(doctorId).then(r => setDoctor(r.data)).finally(() => setLoading(false))
  }, [doctorId])

  const loadSlots = async (d: string) => {
    if (!d) return
    setSlotsLoading(true); setSelectedSlot(null)
    try {
      const res = await availabilityApi.getSlots(doctorId, d)
      setSlots(res.data)
    } catch { toast.error('Failed to load slots') }
    finally { setSlotsLoading(false) }
  }

  const confirm = async () => {
    if (!selectedSlot) return
    setBooking(true)
    try {
      if (isRecurring) {
        await seriesApi.create({
          doctor_id: doctorId,
          recurrence_type: recurrence.recurrence_type,
          preferred_time: selectedSlot.start_time,
          day_of_week: recurrence.day_of_week,
          start_date: date,
          occurrences_total: recurrence.occurrences_total,
        })
        toast.success('Recurring appointments booked!')
      } else {
        await appointmentApi.book({ doctor_id: doctorId, date, start_time: selectedSlot.start_time, appointment_type: apptType })
        toast.success('Appointment booked!')
      }
      router.push('/patient/appointments')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Booking failed') }
    finally { setBooking(false) }
  }

  if (loading || !doctor) return <LoadingSpinner />

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        ← Back to doctors
      </button>

      <div className="card mb-6 flex items-start gap-4">
        <Avatar name={doctor.name} size="lg" />
        <div>
          <p className="font-semibold text-gray-900 text-lg">{doctor.name}</p>
          {doctor.specialization && <p className="text-brand-600 text-sm">{doctor.specialization}</p>}
          {doctor.bio && <p className="text-sm text-gray-500 mt-1">{doctor.bio}</p>}
          <p className="text-sm font-medium text-gray-700 mt-2">{formatCurrency(doctor.consultation_fee)} · {doctor.slot_duration_minutes}min slots</p>
        </div>
      </div>

      {/* Step 1: Type */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">1. Appointment Type</h2>
        <div className="grid grid-cols-2 gap-2">
          {APPOINTMENT_TYPES.filter(t => t.value !== 'recurring' && t.value !== 'walk_in').map(t => (
            <button key={t.value} onClick={() => { setApptType(t.value); setIsRecurring(false) }}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${apptType === t.value && !isRecurring ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
          <button onClick={() => { setApptType('recurring'); setIsRecurring(true) }}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isRecurring ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Recurring Series
          </button>
        </div>

        {isRecurring && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div><label className="label">Repeat</label>
              <select className="input" value={recurrence.recurrence_type} onChange={e => setRecurrence(p => ({ ...p, recurrence_type: e.target.value }))}>
                {RECURRENCE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div><label className="label">Day of Week</label>
              <select className="input" value={recurrence.day_of_week} onChange={e => setRecurrence(p => ({ ...p, day_of_week: Number(e.target.value) }))}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div><label className="label">Number of Sessions</label>
              <input className="input" type="number" min={1} max={52} value={recurrence.occurrences_total} onChange={e => setRecurrence(p => ({ ...p, occurrences_total: Number(e.target.value) }))} />
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Date + Slot */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">2. Pick a Date & Time</h2>
        <input type="date" className="input mb-4" min={today} value={date}
          onChange={e => { setDate(e.target.value); loadSlots(e.target.value) }} />
        {slotsLoading && <p className="text-sm text-gray-400">Loading slots…</p>}
        {!slotsLoading && date && slots.length === 0 && <p className="text-sm text-gray-400">No slots available on this date.</p>}
        {slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((s, i) => (
              <button key={i} onClick={() => setSelectedSlot(s)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${selectedSlot?.start_time === s.start_time ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {formatTime(s.start_time)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Confirm */}
      {selectedSlot && date && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">3. Confirm</h2>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
            <p><span className="text-gray-500">Doctor:</span> <span className="font-medium">{doctor.name}</span></p>
            <p><span className="text-gray-500">Date:</span> <span className="font-medium">{date}</span></p>
            <p><span className="text-gray-500">Time:</span> <span className="font-medium">{formatTime(selectedSlot.start_time)}</span></p>
            <p><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{isRecurring ? `Recurring (${recurrence.recurrence_type}, ${recurrence.occurrences_total} sessions)` : apptType.replace('_', ' ')}</span></p>
            <p><span className="text-gray-500">Fee:</span> <span className="font-medium">{formatCurrency(doctor.consultation_fee)}</span></p>
          </div>
          <button onClick={confirm} disabled={booking} className="btn-primary w-full">
            {booking ? 'Booking…' : 'Confirm Appointment'}
          </button>
        </div>
      )}
    </div>
  )
}
