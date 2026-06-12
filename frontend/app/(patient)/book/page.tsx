'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { doctorApi } from '@/lib/api'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import type { DoctorPublicProfile } from '@/types'

export default function BookPage() {
  const [doctors, setDoctors] = useState<DoctorPublicProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { doctorApi.list().then(r => setDoctors(r.data)).finally(() => setLoading(false)) }, [])

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.department || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
      <p className="text-gray-500 mb-6">Choose a doctor to see their available slots.</p>
      <input className="input max-w-sm mb-6" placeholder="Search by name or specialization…" value={search} onChange={e => setSearch(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(d => (
          <Link key={d.id} href={`/patient/book/${d.id}`}
            className="card hover:border-brand-200 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <Avatar name={d.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-brand-700">{d.name}</p>
                {d.specialization && <p className="text-sm text-brand-600">{d.specialization}</p>}
                {d.department && <p className="text-xs text-gray-400">{d.department}</p>}
                {d.bio && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{d.bio}</p>}
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm font-medium text-gray-700">{formatCurrency(d.consultation_fee)}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{d.slot_duration_minutes}min slots</span>
                </div>
                {d.languages_spoken?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {d.languages_spoken.map(l => <span key={l} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l}</span>)}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && <p className="text-center text-gray-400 py-12">No doctors found.</p>}
    </div>
  )
}
