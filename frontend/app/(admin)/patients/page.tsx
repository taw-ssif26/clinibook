'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { Avatar } from '@/components/shared/Avatar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { User } from '@/types'

export default function AdminPatients() {
  const [patients, setPatients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { adminApi.getPatients().then(r => setPatients(r.data)).finally(() => setLoading(false)) }, [])

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Patients</h1>
      <input className="input max-w-sm mb-4" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Patient','Email','Phone','Joined'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={p.name} size="sm" /><span className="text-sm font-medium text-gray-900">{p.name}</span></div></td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.phone || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="text-center text-gray-400 py-12">No patients found.</p>}
      </div>
    </div>
  )
}
