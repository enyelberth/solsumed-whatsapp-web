const SESSION_KEY = 'solsumed.session'

export function readSession<T>(): T | null {
  if (import.meta.server) return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  }
  catch {
    return null
  }
}

export function writeSession<T>(value: T): void {
  if (import.meta.server) return
  localStorage.setItem(SESSION_KEY, JSON.stringify(value))
}

export function clearSession(): void {
  if (import.meta.server) return
  localStorage.removeItem(SESSION_KEY)
}
