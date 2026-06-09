import { io, Socket } from 'socket.io-client'

export interface RealtimeMessage {
  recipientId?: number | null
  phone: string
  conversationId?: string
  direction: 'incoming' | 'outgoing'
  messageType: string
  message: string | null
  mediaUrl?: string | null
  mediaMimeType?: string | null
  mediaFilename?: string | null
  status?: string | null
  createdAt: string
}

export interface RealtimeStatus {
  recipientId?: number | null
  phone: string
  conversationId?: string
  status: string
}

export interface RealtimeTranscription {
  recipientId?: number | null
  phone: string
  conversationId: string
  transcription: string
  transcriptionLang: string
  transcriptionMeta: {
    summary_short?: string
    sentiment?: string
    confidence?: number
    duration_sec?: number | null
  }
}

let _socket: Socket | null = null
let _refCount = 0

function buildWsUrl(httpBase: string): string {
  const trimmed = httpBase.replace(/\/$/, '')
  return trimmed
}

export function useNotificationsSocket() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  function ensureSocket(): Socket {
    if (_socket && _socket.connected) return _socket
    if (_socket) return _socket

    const url = buildWsUrl(config.public.solsumedApiUrl)
    _socket = io(`${url}/ws/notifications`, {
      transports: ['websocket', 'polling'],
      auth: { token: auth.token ?? '' },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    })

    _socket.on('connect', () => {
      console.log('[ws] connected', _socket?.id)
    })
    _socket.on('disconnect', (reason) => {
      console.log('[ws] disconnect', reason)
    })
    _socket.on('connect_error', (err) => {
      console.warn('[ws] connect_error', err.message)
    })

    return _socket
  }

  function connect(): Socket {
    _refCount++
    return ensureSocket()
  }

  function disconnect() {
    _refCount = Math.max(0, _refCount - 1)
    if (_refCount === 0 && _socket) {
      _socket.removeAllListeners()
      _socket.disconnect()
      _socket = null
    }
  }

  function subscribeRecipient(recipientId: number | string) {
    const s = ensureSocket()
    s.emit('subscribe:recipient', recipientId)
  }

  function subscribePhone(phone: string) {
    const s = ensureSocket()
    s.emit('subscribe:phone', phone)
  }

  function unsubscribePhone(phone: string) {
    const s = ensureSocket()
    s.emit('unsubscribe:phone', phone)
  }

  function onMessage(cb: (msg: RealtimeMessage) => void): () => void {
    const s = ensureSocket()
    s.on('message:new', cb)
    return () => s.off('message:new', cb)
  }

  function onStatus(cb: (msg: RealtimeStatus) => void): () => void {
    const s = ensureSocket()
    s.on('message:status', cb)
    return () => s.off('message:status', cb)
  }

  function onTranscription(cb: (msg: RealtimeTranscription) => void): () => void {
    const s = ensureSocket()
    s.on('message:transcribed', cb)
    return () => s.off('message:transcribed', cb)
  }

  return {
    connect,
    disconnect,
    subscribeRecipient,
    subscribePhone,
    unsubscribePhone,
    onMessage,
    onStatus,
    onTranscription,
    get socket() { return _socket },
  }
}
