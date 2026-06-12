'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [form, setForm] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, [k]: e.target.value }))

  useEffect(() => { adminApi.getClinic().then(r => setForm(r.data)).finally(() => setLoading(false)) }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await adminApi.updateClinic(form)
      toast.success('Settings saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Clinic Settings</h1>
      <form onSubmit={save} className="card space-y-4">
        {[['name','Clinic Name'],['address','Address'],['phone','Phone'],['email','Email'],['logo_url','Logo URL']].map(([k,l]) => (
          <div key={k}><label className="label">{l}</label><input className="input" value={form[k] || ''} onChange={set(k)} /></div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Opening Time</label><input className="input" type="time" value={form.working_hours_start || ''} onChange={set('working_hours_start')} /></div>
          <div><label className="label">Closing Time</label><input className="input" type="time" value={form.working_hours_end || ''} onChange={set('working_hours_end')} /></div>
        </div>
        <div><label className="label">Cancellation Cutoff (hours before appointment)</label><input className="input" type="number" min={1} max={72} value={form.cancellation_cutoff_hours || 2} onChange={set('cancellation_cutoff_hours')} /></div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Settings'}</button>
      </form>
    </div>
  )
}
