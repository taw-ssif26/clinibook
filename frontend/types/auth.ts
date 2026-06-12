export type UserRole = 'admin' | 'doctor' | 'patient'

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { name: string; email: string; phone?: string; password: string }
export interface TokenResponse { access_token: string; refresh_token: string; token_type: string; role: UserRole }
export interface AuthState { user: User | null; accessToken: string | null; role: UserRole | null; isLoading: boolean }
