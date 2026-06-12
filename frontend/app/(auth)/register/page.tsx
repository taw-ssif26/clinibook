'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { ROLE_HOME } from '@/lib/constants'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await authApi.register({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password })
      tokenStore.set(res.data.access_token, res.data.refresh_token)
      router.push(ROLE_HOME[res.data.role] || '/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create patient account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="label">Full name</label><input className="input" value={form.name} onChange={set('name')} required /></div>
        <div><label className="label">Email address</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
        <div><label className="label">Phone <span className="text-gray-400">(optional)</span></label><input className="input" type="tel" value={form.phone} onChange={set('phone')} /></div>
        <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={set('password')} required /></div>
        <div><label className="label">Confirm password</label><input className="input" type="password" value={form.confirm} onChange={set('confirm')} required /></div>
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
      </p>
    </>
  )
}
