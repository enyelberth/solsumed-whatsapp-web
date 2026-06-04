import { defineStore } from 'pinia'
import type { AuthSession, LoginCredentials, LoginResponse, User } from '~/types/auth'
import { clearSession, readSession, writeSession } from '~/utils/storage'

interface AuthState {
  session: AuthSession | null
  hydrated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    session: null,
    hydrated: false,
  }),

  getters: {
    user: (state): User | null => state.session?.user ?? null,
    token: (state): string | null => state.session?.token ?? null,
    isAuthenticated: (state): boolean =>
      !!state.session && state.session.expiresAt > Date.now(),
  },

  actions: {
    hydrate() {
      if (this.hydrated) return
      this.hydrated = true
      const stored = readSession<AuthSession>()
      if (stored && stored.expiresAt > Date.now()) {
        this.session = stored
      }
      else if (stored) {
        clearSession()
      }
    },

    async login(credentials: LoginCredentials): Promise<User> {
      const api = useSolsumedApi()
      const res = await api<any>('/auth/login', {
        method: 'POST',
        body: {
          identifier: credentials.email,
          password: credentials.password,
        },
      })
      const token = res.token ?? res.access_token
      const expiresAt = res.expiresAt
        ?? (res.expires_at ? Date.parse(res.expires_at) : Date.now() + 1000 * 60 * 60 * 8)
      const next: AuthSession = {
        user: res.user,
        token,
        expiresAt,
      }
      this.session = next
      writeSession(next)
      return res.user
    },

    logout() {
      this.session = null
      clearSession()
    },
  },
})
