'use client'
import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { tokenStore } from '@/lib/auth'
import { ROLE_HOME } from '@/lib/constants'
import type { User, UserRole, LoginRequest, RegisterRequest } from '@/types'

interface AuthCtx {
  user: User | null
  role: UserRole | null
  isLoading: boolean
  login: (d: LoginRequest) => Promise<void>
  register: (d: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

import { createContext as _createContext } from 'react'
export const AuthContext = _createContext<AuthCtx | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function useAuthState(): AuthCtx {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (data: LoginRequest) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(data)
      tokenStore.set(res.data.access_token, res.data.refresh_token)
      const me = await authApi.me()
      setUser(me.data)
      setRole(res.data.role)
      router.push(ROLE_HOME[res.data.role] || '/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterRequest) => {
    setIsLoading(true)
    try {
      const res = await authApi.register(data)
      tokenStore.set(res.data.access_token, res.data.refresh_token)
      const me = await authApi.me()
      setUser(me.data)
      setRole(res.data.role)
      router.push(ROLE_HOME[res.data.role] || '/')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    const refresh = tokenStore.getRefresh()
    if (refresh) await authApi.logout(refresh).catch(() => {})
    tokenStore.clear()
    setUser(null)
    setRole(null)
    router.push('/login')
  }

  return { user, role, isLoading, login, register, logout, isAuthenticated: !!user }
}
