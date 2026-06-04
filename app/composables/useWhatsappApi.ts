import type { ApiClient } from './useApiClient'

let _client: ApiClient | null = null

export function useWhatsappApi(): ApiClient {
  if (_client) return _client
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  _client = createApiClient({
    baseURL: config.public.whatsappApiUrl,
    getToken: () => auth.token,
    onUnauthorized: async () => {
      auth.logout()
      await navigateTo('/login')
    },
  })
  return _client
}
