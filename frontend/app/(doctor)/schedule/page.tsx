'use client'
import { useEffect, useState } from 'react'
import { availabilityApi } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Modal } from '@/components/shared/Modal'
import { DAYS, DAY_SHORT } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { DoctorAvailability, AvailabilityException } from '@/types'

const emptySchedule = () => Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, start_time: '09:00', end_time: '17:00', enabled: false }))

export default function DoctorSchedule() {
  const [schedule, setSchedule] = useState(emptySchedule())
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showExc, setShowExc] = useState(false)
  const [excForm, setExcForm] = useState({ exception_date: '', type: 'day_off', start_time: '', end_time: '', reason: '' })

  useEffect(() => {
    Promise.all([availabilityApi.getMine(), availabilityApi.getMyExceptions()]).then(([av, ex]) => {
      const avData: DoctorAvailability[] = av.data
      setSchedule(prev => prev.map(row => {
        const found = avData.find(a => a.day_of_week === row.day_of_week)
        return found ? { ...row, start_time: found.start_time.slice(0,5), end_time: found.end_time.slice(0,5), enabled: found.is_active } : row
      }))
      setExceptions(ex.data)
    }).finally(() => setLoading(false))
  }, [])

  const toggle = (i: number) => setSchedule(p => p.map((r, j) => j === i ? { ...r, enabled: !r.enabled } : r))
  const setTime = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSchedule(p => p.map((r, j) => j === i ? { ...r, [k]: e.target.value } : r))

  const saveSchedule = async () => {
    setSaving(true)
    try {
      const payload = schedule.filter(r => r.enabled).map(r => ({ day_of_week: r.day_of_week, start_time: r.start_time + ':00', end_time: r.end_time + ':00' }))
      await availabilityApi.setMine(payload)
      toast.success('Schedule saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const addException = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = { ...excForm }
      if (excForm.type === 'day_off') { delete payload.start_time; delete payload.end_time }
      else { payload.start_time += ':00'; payload.end_time += ':00' }
      const res = await availabilityApi.addException(payload)
      setExceptions(p => [...p, res.data]); setShowExc(false)
      toast.success('Exception added')
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Availability</h1>
        <button className="btn-primary" onClick={saveSchedule} disabled={saving}>{saving ? 'Saving…' : 'Save Schedule'}</button>
      </div>

      <div className="card mb-6 space-y-3">
        {schedule.map((row, i) => (
          <div key={i} className="flex items-center gap-4">
            <label className="flex items-center gap-2 w-28 cursor-pointer">
              <input type="checkbox" checked={row.enabled} onChange={() => toggle(i)} className="w-4 h-4 text-brand-600 rounded" />
              <span className="text-sm font-medium text-gray-700">{DAY_SHORT[i]}</span>
            </label>
            {row.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input type="time" className="input flex-1" value={row.start_time} onChange={setTime(i, 'start_time')} />
                <span className="text-gray-400 text-sm">to</span>
                <input type="time" className="input flex-1" value={row.end_time} onChange={setTime(i, 'end_time')} />
              </div>
            ) : (
              <span className="text-sm text-gray-400">Not available</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Exceptions</h2>
        <button className="btn-secondary text-sm" onClick={() => setShowExc(true)}>+ Add Exception</button>
      </div>

      <div className="card p-0 overflow-hidden">
        {exceptions.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No exceptions set.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Date','Type','Hours','Reason'].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {exceptions.map(ex => (
                <tr key={ex.id}>
                  <td className="px-4 py-3 text-sm">{ex.exception_date}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ex.type === 'day_off' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{ex.type.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{ex.start_time && ex.end_time ? `${ex.start_time.slice(0,5)} – ${ex.end_time.slice(0,5)}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{ex.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showExc && (
        <Modal title="Add Exception" onClose={() => setShowExc(false)}>
          <form onSubmit={addException} className="space-y-3">
            <div><label className="label">Date</label><input className="input" type="date" value={excForm.exception_date} onChange={e => setExcForm(p => ({ ...p, exception_date: e.target.value }))} required /></div>
            <div><label className="label">Type</label>
              <select className="input" value={excForm.type} onChange={e => setExcForm(p => ({ ...p, type: e.target.value }))}>
                <option value="day_off">Day Off</option>
                <option value="custom_hours">Custom Hours</option>
              </select>
            </div>
            {excForm.type === 'custom_hours' && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">From</label><input className="input" type="time" value={excForm.start_time} onChange={e => setExcForm(p => ({ ...p, start_time: e.target.value }))} required /></div>
                <div><label className="label">To</label><input className="input" type="time" value={excForm.end_time} onChange={e => setExcForm(p => ({ ...p, end_time: e.target.value }))} required /></div>
              </div>
            )}
            <div><label className="label">Reason (optional)</label><input className="input" value={excForm.reason} onChange={e => setExcForm(p => ({ ...p, reason: e.target.value }))} /></div>
            <div className="flex gap-3 pt-1"><button type="button" className="btn-secondary flex-1" onClick={() => setShowExc(false)}>Cancel</button><button type="submit" className="btn-primary flex-1">Add</button></div>
          </form>
        </Modal>
      )}
    </div>
  )
}
