import type { LoginCredentials, LoginResponse, User } from '~/types/auth'

export const authService = {
  async me(): Promise<User> {
    const api = useSolsumedApi()
    return api<User>('/auth/me')
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const api = useSolsumedApi()
    return api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: {
        identifier: credentials.email,
        password: credentials.password,
      },
    })
  },

  async logout(): Promise<void> {
    const api = useSolsumedApi()
    await api('/auth/logout', { method: 'POST' }).catch(() => null)
  },
}
