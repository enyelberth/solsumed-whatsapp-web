import type { $Fetch, FetchOptions } from 'ofetch'

interface CreateClientOptions {
  baseURL: string
  getToken?: () => string | null | undefined
  onUnauthorized?: () => void | Promise<void>
}

export function createApiClient({ baseURL, getToken, onUnauthorized }: CreateClientOptions): $Fetch {
  return $fetch.create({
    baseURL,
    onRequest({ options }) {
      const token = getToken?.()
      if (token) {
        const headers = new Headers(options.headers)
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`)
        }
        options.headers = headers
      }
    },
    async onResponseError({ response }) {
      if (response.status === 401) {
        await onUnauthorized?.()
      }
    },
  })
}

export type ApiClient = $Fetch
export type ApiClientOptions = FetchOptions
