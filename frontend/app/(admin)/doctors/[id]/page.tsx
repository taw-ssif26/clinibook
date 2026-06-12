'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi, availabilityApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Modal } from '@/components/shared/Modal'
import { Avatar } from '@/components/shared/Avatar'
import { DAYS, DAY_SHORT } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { Doctor, AvailabilityException } from '@/types'

export default function AdminDoctorDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [showExc, setShowExc] = useState(false)
  const [excForm, setExcForm] = useState({ exception_date: '', type: 'day_off', start_time: '', end_time: '', reason: '' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p: any) => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    Promise.all([adminApi.getDoctors(), availabilityApi.getMyExceptions()]).then(([dr]) => {
      const found = dr.data.find((d: Doctor) => d.id === id)
      if (found) {
        setDoctor(found)
        setForm({ specialization: found.specialization || '', department: found.department || '', bio: found.bio || '', consultation_fee: found.consultation_fee || '', languages_spoken: (found.languages_spoken || []).join(', '), slot_duration_minutes: found.slot_duration_minutes, buffer_minutes: found.buffer_minutes })
      }
    }).finally(() => setLoading(false))
  }, [id])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null, languages_spoken: form.languages_spoken ? form.languages_spoken.split(',').map((s: string) => s.trim()) : [] }
      const res = await adminApi.updateDoctor(id, payload)
      setDoctor(res.data); toast.success('Doctor updated')
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />
  if (!doctor) return <p className="text-center text-gray-400 py-12">Doctor not found.</p>

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">← Back to Doctors</button>
      <div className="card mb-6 flex items-center gap-4">
        <Avatar name={doctor.user.name} size="lg" />
        <div><p className="font-semibold text-gray-900 text-lg">{doctor.user.name}</p><p className="text-sm text-gray-500">{doctor.user.email}</p></div>
      </div>
      <form onSubmit={save} className="card space-y-4 mb-6">
        <h2 className="font-semibold text-gray-900">Edit Profile</h2>
        {[['specialization','Specialization'],['department','Department'],['consultation_fee','Fee (৳)'],['languages_spoken','Languages (comma-sep)']].map(([k,l]) => (
          <div key={k}><label className="label">{l}</label><input className="input" value={form[k] || ''} onChange={set(k)} /></div>
        ))}
        <div><label className="label">Bio</label><textarea className="input" rows={3} value={form.bio || ''} onChange={set('bio')} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Slot (min)</label><input className="input" type="number" min={15} max={120} value={form.slot_duration_minutes || 30} onChange={set('slot_duration_minutes')} /></div>
          <div><label className="label">Buffer (min)</label><input className="input" type="number" min={0} max={60} value={form.buffer_minutes || 0} onChange={set('buffer_minutes')} /></div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
      </form>
    </div>
  )
}
