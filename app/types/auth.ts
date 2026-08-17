export interface User {
  id: string | number
  email: string
  name?: string
  role?: 'admin' | 'client' | string
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  expiresAt?: number
}
