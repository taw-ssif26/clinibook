'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { authApi } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import toast from 'react-hot-toast'

interface NavItem { href: string; label: string; icon: React.ReactNode }

export function Sidebar({ items, role }: { items: NavItem[]; role: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    const refresh = tokenStore.getRefresh()
    if (refresh) await authApi.logout(refresh).catch(() => {})
    tokenStore.clear()
    toast.success('Logged out')
    router.push('/login')
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm">CliniBook</span>
            <p className="text-xs text-gray-400 capitalize">{role}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(item => (
          <Link key={item.href} href={item.href}
            className={cn('sidebar-link', pathname.startsWith(item.href) && 'active')}>
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button onClick={logout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
