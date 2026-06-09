<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { notificationsService } from '~/services/notifications.service'
import type { BackendMessage } from '~/services/notifications.service'
import type { RealtimeMessage, RealtimeStatus, RealtimeTranscription } from '~/composables/useNotificationsSocket'
import { playNotificationSound, primeNotificationSound } from '~/composables/useNotificationSound'

const auth = useAuthStore()
const { user } = storeToRefs(auth)
const router = useRouter()
const wa = useWhatsappStore()
const { status, loadingStatus, sending } = storeToRefs(wa)

// ─── Chat State ────────────────────────────────────────────────────────────────

const selectedChatId = ref<string | null>(null)
const drafts = ref<Record<string, string>>({})
const mockChats = ref<any[]>([])

function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

async function urlToBlob(url: string, filename = 'file'): Promise<File> {
  const response = await fetch(url)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type })
}

function mapBackendMessage(bm: BackendMessage) {
  const date = new Date(bm.createdAt)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  return {
    id: bm.id,
    text: bm.message || '',
    sender: bm.direction === 'outgoing' ? ('me' as const) : ('them' as const),
    time: timeStr,
    createdAt: bm.createdAt,
    status: (bm.status as any) || 'read',
    type: (bm.messageType as any) || 'text',
    mediaUrl: bm.mediaUrl, // Relativo, resuelto en ChatWindow con auth
    mediaMimeType: bm.mediaMimeType,
    mediaFilename: bm.mediaFilename,
    transcription: bm.transcription ?? null,
    transcriptionStatus: bm.transcriptionStatus ?? null,
    transcriptionLang: bm.transcriptionLang ?? null,
    transcriptionMeta: bm.transcriptionMeta ?? null,
  }
}

const loadError = ref<string | null>(null)

async function loadRecipients() {
  loadError.value = null
  try {
    const list = await notificationsService.getRecipients()
    const colors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-teal-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-amber-600']
    
    const loaded = await Promise.all(
      list.map(async (c, idx) => {
        try {
          const history = await notificationsService.getMessages(c.id, PAGE_SIZE)
          chatPagination.value[String(c.id)] = {
            hasMore: !!history.hasMore,
            loading: false,
            oldestId: history.oldestId ?? null,
          }
          return {
            id: String(c.id),
            name: c.name,
            phone: c.phone,
            avatarColor: colors[idx % colors.length],
            unreadCount: 0,
            messages: history.messages.map(mapBackendMessage),
            isPinned: false,
            isArchived: false,
            isGroup: c.phone.includes('grupo') || !c.phone.startsWith('+')
          }
        } catch (e) {
          chatPagination.value[String(c.id)] = { hasMore: false, loading: false, oldestId: null }
          return {
            id: String(c.id),
            name: c.name,
            phone: c.phone,
            avatarColor: colors[idx % colors.length],
            unreadCount: 0,
            messages: [],
            isPinned: false,
            isArchived: false,
            isGroup: c.phone.includes('grupo') || !c.phone.startsWith('+')
          }
        }
      })
    )

    mockChats.value = loaded
  } catch (err: any) {
    console.error('Error al cargar destinatarios del backend:', err)
    const status = err?.statusCode || err?.response?.status
    const backendMsg =
      err?.data?.message ||
      err?.response?._data?.message ||
      err?.message ||
      'sin detalle'
    const detail = Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg
    loadError.value = `HTTP ${status ?? '?'}: ${detail}`
  }
}

const selectedChat = computed(() => mockChats.value.find(c => c.id === selectedChatId.value) ?? null)

function handleSelectChat(id: string) {
  selectedChatId.value = id
  const chat = mockChats.value.find(c => c.id === id)
  if (chat) chat.unreadCount = 0
}

async function handleAddChat(payload: {
  name: string
  phone: string
  useTemplate?: boolean
  templateName?: string
  templateLang?: string
  templateParams?: string[]
  initialMessage?: string
}) {
  const { name, phone, useTemplate, templateName, templateLang, templateParams, initialMessage } = payload
  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
    let existing = mockChats.value.find(c => c.phone === formattedPhone)
    let recipientId: number | string
    let chat: any

    if (existing) {
      chat = existing
      recipientId = existing.id
      selectedChatId.value = existing.id
    } else {
      const recipient = await notificationsService.createRecipient({ name, phone: formattedPhone })
      recipientId = recipient.id
      const colors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-teal-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-amber-600']
      chat = {
        id: String(recipient.id),
        name: recipient.name,
        phone: recipient.phone,
        avatarColor: colors[mockChats.value.length % colors.length],
        unreadCount: 0,
        messages: [],
        isPinned: false,
        isArchived: false,
        isGroup: recipient.phone.includes('grupo') || !recipient.phone.startsWith('+')
      }
      mockChats.value.unshift(chat)
      selectedChatId.value = chat.id
    }

    // Enviar mensaje inicial (template o texto)
    let res: { success: boolean; messageId: string; error?: string } | null = null
    let sentPayload: any = null
    if (useTemplate && templateName) {
      sentPayload = { templateName, templateLang: templateLang || 'es', templateParams: templateParams || [] }
      console.log('[whatsapp] sendTemplate payload:', sentPayload)
      res = await notificationsService.sendTemplate(
        recipientId,
        templateName,
        templateLang || 'es',
        templateParams || [],
      )
    } else if (initialMessage) {
      sentPayload = { message: initialMessage }
      console.log('[whatsapp] sendText payload:', sentPayload)
      res = await notificationsService.sendText(recipientId, initialMessage)
    }

    if (res) {
      if (res.success) {
        chat.messages.push({
          id: res.messageId,
          text: useTemplate ? `[Template: ${templateName}]` : (initialMessage || ''),
          sender: 'me',
          time: getCurrentTime(),
          status: 'delivered',
          type: 'text',
        })
      } else {
        console.error('[whatsapp] envío fallido', { sentPayload, error: res.error })
        alert(
          `Contacto creado pero envío inicial falló.\n\n` +
          `Payload enviado: ${JSON.stringify(sentPayload)}\n\n` +
          `Error: ${res.error ?? 'desconocido'}\n\n` +
          `Revisa que el template "${templateName}" exista en Meta Business Manager con ese idioma + número de parámetros.`,
        )
      }
    }
  } catch (err: any) {
    console.error('Error al crear contacto:', err)
    const status = err?.statusCode || err?.response?.status
    const backendMsg =
      err?.data?.message ||
      err?.response?._data?.message ||
      err?.message ||
      'sin detalle'
    const detail = Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg
    alert(`No se pudo crear el contacto (HTTP ${status ?? '?'}): ${detail}`)
  }
}

async function handleSendMessage(
  text: string,
  replyTo?: { id: string; text: string; sender: string },
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'document' | 'sticker' | 'sticker_animated' | 'gif' = 'text',
  fileSize?: number
) {
  if (!selectedChat.value) return
  const currentChat = selectedChat.value
  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
  const timeStr = getCurrentTime()

  // Limpiar borrador
  drafts.value[currentChat.id] = ''

  currentChat.messages.push({
    id: msgId,
    text,
    sender: 'me',
    time: timeStr,
    createdAt: new Date().toISOString(),
    status: 'sent',
    replyTo: replyTo ? { ...replyTo } : undefined,
    type,
    fileSize
  })

  const queue = pendingOutgoing.get(currentChat.id) ?? []
  queue.push(msgId)
  pendingOutgoing.set(currentChat.id, queue)

  const dropFromQueue = () => {
    const q = pendingOutgoing.get(currentChat.id)
    if (!q) return
    const idx = q.indexOf(msgId)
    if (idx >= 0) q.splice(idx, 1)
  }

  try {
    const response = await chainSend(currentChat.id, async () => {
      if (type === 'text') {
        return notificationsService.sendText(currentChat.id, text)
      }
      const file = await urlToBlob(text, type === 'audio' ? 'voice_note.ogg' : text.split('/').pop() || 'media')
      return notificationsService.sendMedia(currentChat.id, file, type === 'image' ? 'Imagen adjunta' : '')
    })

    const found = currentChat.messages.find((m: any) => m.id === msgId)
    if (found && response.success) {
      found.id = response.messageId
      found.status = 'delivered'
      dropFromQueue()
      setTimeout(() => { if (found) found.status = 'read' }, 1500)
    } else if (found) {
      found.status = 'failed'
      ;(found as any).errorReason = response.error ?? 'error desconocido del agente WhatsApp'
      dropFromQueue()
      console.warn(`[send-failed] chat=${currentChat.id} reason=${response.error}`)
    } else {
      dropFromQueue()
    }
  }
  catch (err: any) {
    console.error('Error enviando mensaje al backend NestJS:', err)
    const found = currentChat.messages.find((m: any) => m.id === msgId)
    if (found) {
      found.status = 'failed'
      ;(found as any).errorReason = err?.message ?? 'error de red'
    }
    dropFromQueue()
  }
}

async function handleDeleteChats(ids: string[]) {
  const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar los ${ids.length} chats seleccionados?`)
  if (!confirmed) return

  try {
    await Promise.all(ids.map(id => notificationsService.deleteRecipient(id)))
    mockChats.value = mockChats.value.filter(c => !ids.includes(c.id))
    if (selectedChatId.value && ids.includes(selectedChatId.value)) {
      selectedChatId.value = null
    }
  } catch (err) {
    console.error('Error al eliminar contacto(s):', err)
    alert('No se pudo eliminar el contacto del backend.')
  }
}

function handleMarkChatsUnreadStatus({ ids, isRead }: { ids: string[], isRead: boolean }) {
  mockChats.value.forEach(c => {
    if (ids.includes(c.id)) {
      c.unreadCount = isRead ? 0 : 1
    }
  })
}

function handleTogglePinChat(id: string) {
  const chat = mockChats.value.find(c => c.id === id)
  if (chat) {
    chat.isPinned = !chat.isPinned
  }
}

function handleToggleArchiveChat(id: string) {
  const chat = mockChats.value.find(c => c.id === id)
  if (chat) {
    chat.isArchived = !chat.isArchived
    if (chat.isArchived && selectedChatId.value === id) {
      selectedChatId.value = null
    }
  }
}

function handleBulkArchiveChats({ ids, isArchive }: { ids: string[], isArchive: boolean }) {
  mockChats.value.forEach(c => {
    if (ids.includes(c.id)) {
      c.isArchived = isArchive
      if (isArchive && selectedChatId.value === c.id) {
        selectedChatId.value = null
      }
    }
  })
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ─── Real-time (WebSocket) ──────────────────────────────────────────────────
const wsClient = useNotificationsSocket()
let offMessage: (() => void) | null = null
let offStatus: (() => void) | null = null
let offTranscription: (() => void) | null = null
const subscribedRecipients = new Set<string>()
const pendingOutgoing = new Map<string, string[]>()
const sendChain = new Map<string, Promise<unknown>>()
const chatPagination = ref<Record<string, { hasMore: boolean; loading: boolean; oldestId: string | null }>>({})
const PAGE_SIZE = 30
const SEND_THROTTLE_MS = 300

function chainSend<T>(chatId: string, fn: () => Promise<T>): Promise<T> {
  const prev = sendChain.get(chatId) ?? Promise.resolve()
  const next = prev
    .catch(() => undefined)
    .then(async () => {
      const out = await fn()
      await new Promise(r => setTimeout(r, SEND_THROTTLE_MS))
      return out
    })
  sendChain.set(chatId, next)
  return next as Promise<T>
}

function pushIncomingMessage(msg: RealtimeMessage) {
  const rid = msg.recipientId != null ? String(msg.recipientId) : null
  if (!rid) return
  const chat = mockChats.value.find(c => c.id === rid)
  if (!chat) return

  const incomingId = msg.conversationId || (msg as any).id || null

  if (incomingId && chat.messages?.some((m: any) => m.id === incomingId)) {
    return
  }

  if (msg.direction === 'outgoing' && incomingId) {
    const queue = pendingOutgoing.get(rid)
    if (queue && queue.length) {
      const localId = queue.shift()!
      const optimistic = (chat.messages || []).find((m: any) => m.id === localId)
      if (optimistic) {
        optimistic.id = incomingId
        optimistic.status = msg.status ?? optimistic.status ?? 'sent'
        return
      }
    }
    const text = msg.message ?? ''
    const optimistic = (chat.messages || []).find((m: any) =>
      m.sender === 'me'
      && typeof m.id === 'string'
      && m.id.startsWith('msg_')
      && (m.text ?? '') === text,
    )
    if (optimistic) {
      optimistic.id = incomingId
      optimistic.status = msg.status ?? optimistic.status ?? 'sent'
      return
    }
  }

  const mapped = mapBackendMessage({
    id: incomingId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: msg.message ?? '',
    direction: msg.direction,
    messageType: msg.messageType,
    mediaUrl: msg.mediaUrl ?? undefined,
    mediaMimeType: msg.mediaMimeType ?? undefined,
    mediaFilename: msg.mediaFilename ?? undefined,
    status: msg.status ?? 'sent',
    createdAt: msg.createdAt,
    sender: msg.direction === 'outgoing' ? 'me' : 'them',
  } as any)
  chat.messages = [...(chat.messages || []), mapped]
  if (msg.direction === 'incoming') {
    if (selectedChatId.value !== rid) {
      chat.unreadCount = (chat.unreadCount || 0) + 1
    }
    playNotificationSound()
  }
}

function applyTranscription(payload: RealtimeTranscription) {
  const rid = payload.recipientId != null ? String(payload.recipientId) : null
  if (!rid) return
  const chat = mockChats.value.find(c => c.id === rid)
  if (!chat?.messages?.length) return
  const target = chat.messages.find((m: any) => m.id === payload.conversationId)
  if (!target) return
  target.transcription = payload.transcription
  target.transcriptionLang = payload.transcriptionLang
  target.transcriptionMeta = payload.transcriptionMeta
  target.transcriptionStatus = 'done'
}

function applyStatusUpdate(payload: RealtimeStatus) {
  const rid = payload.recipientId != null ? String(payload.recipientId) : null
  if (!rid) return
  const chat = mockChats.value.find(c => c.id === rid)
  if (!chat?.messages?.length) return
  const last = chat.messages[chat.messages.length - 1]
  if (last && last.sender === 'me') last.status = payload.status
}

function subscribeAllRecipients() {
  mockChats.value.forEach(c => {
    if (subscribedRecipients.has(c.id)) return
    wsClient.subscribeRecipient(c.id)
    if (c.phone) wsClient.subscribePhone(c.phone)
    subscribedRecipients.add(c.id)
  })
}

function mergeHistoryWithLocal(existing: any[], remote: any[]): any[] {
  const byId = new Map<string, any>()
  for (const m of remote) byId.set(m.id, m)
  // Preserva locales que no llegaron en remote (pending optimistic + WS que aún no persistió backend)
  for (const m of existing || []) {
    if (!m || !m.id) continue
    if (!byId.has(m.id)) byId.set(m.id, m)
  }
  // Orden cronológico por createdAt (fallback time si no hay)
  return Array.from(byId.values()).sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0
    if (ta && tb) return ta - tb
    return 0
  })
}

watch(selectedChatId, (newId) => {
  if (!newId) return
  const chat = mockChats.value.find(c => c.id === newId)
  if (chat) {
    chat.unreadCount = 0
    notificationsService.getMessages(newId, PAGE_SIZE).then(history => {
      const remote = history.messages.map(mapBackendMessage)
      chat.messages = mergeHistoryWithLocal(chat.messages || [], remote)
      chatPagination.value[newId] = {
        hasMore: !!history.hasMore,
        loading: false,
        oldestId: history.oldestId ?? null,
      }
    }).catch(e => console.error('Error loading initial messages:', e))
  }
})

async function handleLoadMoreMessages(chatId: string) {
  const state = chatPagination.value[chatId]
  if (!state || !state.hasMore || state.loading || !state.oldestId) return
  state.loading = true
  try {
    const history = await notificationsService.getMessages(chatId, PAGE_SIZE, state.oldestId)
    const chat = mockChats.value.find(c => c.id === chatId)
    if (!chat) return
    const older = history.messages.map(mapBackendMessage)
    // Merge older en cabeza preservando posteriores
    const existingIds = new Set((chat.messages || []).map((m: any) => m.id))
    const prepend = older.filter(m => !existingIds.has(m.id))
    chat.messages = [...prepend, ...(chat.messages || [])]
    chatPagination.value[chatId] = {
      hasMore: !!history.hasMore,
      loading: false,
      oldestId: history.oldestId ?? state.oldestId,
    }
  }
  catch (e) {
    console.error('Error cargando mensajes previos:', e)
    state.loading = false
  }
}

watch(() => mockChats.value.length, () => {
  if (wsClient.socket?.connected) subscribeAllRecipients()
})

// ─── Init ──────────────────────────────────────────────────────────────────────
function handleFirstGesture() {
  primeNotificationSound()
  window.removeEventListener('pointerdown', handleFirstGesture)
  window.removeEventListener('keydown', handleFirstGesture)
}

onMounted(async () => {
  wa.refreshStatus()
  wsClient.connect()
  offMessage = wsClient.onMessage(pushIncomingMessage)
  offStatus = wsClient.onStatus(applyStatusUpdate)
  offTranscription = wsClient.onTranscription(applyTranscription)
  window.addEventListener('pointerdown', handleFirstGesture, { once: false })
  window.addEventListener('keydown', handleFirstGesture, { once: false })
  await loadRecipients()
  subscribeAllRecipients()
})

onBeforeUnmount(() => {
  offMessage?.()
  offStatus?.()
  offTranscription?.()
  window.removeEventListener('pointerdown', handleFirstGesture)
  window.removeEventListener('keydown', handleFirstGesture)
  wsClient.disconnect()
})
</script>

<template>
  <!-- Full-screen WhatsApp Web wrapper — no header, no external sidebar -->
  <div class="w-screen h-screen overflow-hidden flex bg-[#f0f2f5] dark:bg-[#0c1317]">

    <!-- ── Left Column: Chat sidebar ───────────────────────────────────────────── -->
    <WhatsappChatList
      :chats="mockChats"
      :selected-chat-id="selectedChatId"
      :user-email="user?.email ?? 'admin@solsumed.com'"
      :phone-number="status?.phoneNumber"
      :loading-status="loadingStatus"
      :drafts="drafts"
      @select-chat="handleSelectChat"
      @add-chat="handleAddChat"
      @refresh-status="wa.refreshStatus()"
      @logout="handleLogout"
      @delete-chats="handleDeleteChats"
      @mark-chats-unread-status="handleMarkChatsUnreadStatus"
      @toggle-pin-chat="handleTogglePinChat"
      @toggle-archive-chat="handleToggleArchiveChat"
      @bulk-archive-chats="handleBulkArchiveChats"
    />

    <!-- ── Right Column: Active conversation or welcome screen ─────────────────── -->
    <div class="flex-1 h-full overflow-hidden">
      <WhatsappChatWindow
        v-if="selectedChat"
        :chat="selectedChat"
        :sending="sending"
        :draft-text="drafts[selectedChat.id]"
        :has-more-messages="chatPagination[selectedChat.id]?.hasMore ?? false"
        :loading-older="chatPagination[selectedChat.id]?.loading ?? false"
        @send-message="handleSendMessage"
        @update-draft="(val) => drafts[selectedChat.id] = val"
        @load-more="handleLoadMoreMessages(selectedChat.id)"
      />
      <WhatsappWelcomeScreen v-else />
    </div>

  </div>
</template>
