'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/AuthProvider'

const navItems = [
  { href: '/patient/dashboard', label: 'Dashboard' },
  { href: '/patient/book', label: 'Book Appointment' },
  { href: '/patient/appointments', label: 'My Appointments' },
]

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout: authLogout } = useAuth()

  useEffect(() => {
    const role = localStorage.getItem('clinibook_role')
    if (!isAuthenticated || role !== 'patient') {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const logout = async () => {
    const refresh = tokenStore.getRefresh()
    if (refresh) await authApi.logout(refresh).catch(() => {})
    authLogout()
    router.push('/login')
    toast.success('Logged out')
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <span className="font-bold text-gray-900 text-sm">CliniBook</span>
            </div>
            <nav className="flex gap-1">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}
                  className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', pathname.startsWith(item.href) ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100')}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500 transition-colors">Sign out</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
