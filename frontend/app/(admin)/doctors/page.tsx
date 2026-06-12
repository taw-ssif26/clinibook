'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { Avatar } from '@/components/shared/Avatar'
import { Modal } from '@/components/shared/Modal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import toast from 'react-hot-toast'
import type { Doctor } from '@/types'

const EMPTY = { name:'', email:'', phone:'', password:'', specialization:'', department:'', bio:'', consultation_fee:'', languages_spoken:'', slot_duration_minutes:30, buffer_minutes:0 }

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => { adminApi.getDoctors().then(r => setDoctors(r.data)).finally(() => setLoading(false)) }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
        languages_spoken: form.languages_spoken ? form.languages_spoken.split(',').map(s => s.trim()) : [] }
      const res = await adminApi.createDoctor(payload)
      setDoctors(p => [...p, res.data]); setShowModal(false); setForm(EMPTY); toast.success('Doctor added')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setSaving(false) }
  }

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this doctor?')) return
    await adminApi.deactivateDoctor(id)
    setDoctors(p => p.map(d => d.id === id ? { ...d, is_active: false, user: { ...d.user, is_active: false } } : d))
    toast.success('Doctor deactivated')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Doctor</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Doctor','Specialization','Department','Fee','Slot','Status',''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {doctors.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={d.user.name} size="sm" /><div><p className="text-sm font-medium text-gray-900">{d.user.name}</p><p className="text-xs text-gray-400">{d.user.email}</p></div></div></td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.specialization || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.department || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.consultation_fee ? `৳${d.consultation_fee}` : '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{d.slot_duration_minutes}min</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{d.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3">{d.is_active && <button onClick={() => deactivate(d.id)} className="text-xs text-red-500 hover:text-red-700">Deactivate</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!doctors.length && <p className="text-center text-gray-400 py-12">No doctors yet. Add one above.</p>}
      </div>

      {showModal && (
        <Modal title="Add Doctor" onClose={() => setShowModal(false)}>
          <form onSubmit={create} className="space-y-3">
            {[['name','Full name'],['email','Email'],['phone','Phone'],['password','Password'],['specialization','Specialization'],['department','Department'],['consultation_fee','Consultation Fee (৳)'],['languages_spoken','Languages (comma-separated)']].map(([k,l]) => (
              <div key={k}><label className="label">{l}</label><input className="input" type={k==='password'?'password':k==='email'?'email':'text'} value={(form as any)[k]} onChange={set(k)} required={['name','email','password'].includes(k)} /></div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Slot (min)</label><input className="input" type="number" min={15} max={120} value={form.slot_duration_minutes} onChange={set('slot_duration_minutes')} /></div>
              <div><label className="label">Buffer (min)</label><input className="input" type="number" min={0} max={60} value={form.buffer_minutes} onChange={set('buffer_minutes')} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Adding…' : 'Add Doctor'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
