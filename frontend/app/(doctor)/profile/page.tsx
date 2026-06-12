'use client'
import { useEffect, useState } from 'react'
import { doctorApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Avatar } from '@/components/shared/Avatar'
import toast from 'react-hot-toast'

export default function DoctorProfile() {
  const [doctor, setDoctor] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((p: any) => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    doctorApi.me().then(r => { setDoctor(r.data); setForm({ specialization: r.data.specialization || '', department: r.data.department || '', bio: r.data.bio || '', consultation_fee: r.data.consultation_fee || '', languages_spoken: (r.data.languages_spoken || []).join(', '), slot_duration_minutes: r.data.slot_duration_minutes, buffer_minutes: r.data.buffer_minutes }) }).finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null, languages_spoken: form.languages_spoken ? form.languages_spoken.split(',').map((s: string) => s.trim()) : [] }
      await doctorApi.updateProfile(payload); toast.success('Profile updated')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="card mb-6 flex items-center gap-4">
        <Avatar name={doctor?.user?.name || 'D'} size="lg" />
        <div><p className="font-semibold text-gray-900">{doctor?.user?.name}</p><p className="text-sm text-gray-500">{doctor?.user?.email}</p></div>
      </div>
      <form onSubmit={save} className="card space-y-4">
        {[['specialization','Specialization'],['department','Department'],['consultation_fee','Consultation Fee (৳)'],['languages_spoken','Languages (comma-separated)']].map(([k,l]) => (
          <div key={k}><label className="label">{l}</label><input className="input" value={form[k] || ''} onChange={set(k)} /></div>
        ))}
        <div><label className="label">Bio</label><textarea className="input" rows={3} value={form.bio || ''} onChange={set('bio')} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Slot Duration (min)</label><input className="input" type="number" min={15} max={120} value={form.slot_duration_minutes || 30} onChange={set('slot_duration_minutes')} /></div>
          <div><label className="label">Buffer (min)</label><input className="input" type="number" min={0} max={60} value={form.buffer_minutes || 0} onChange={set('buffer_minutes')} /></div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Profile'}</button>
      </form>
    </div>
  )
}
