<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { notificationsService } from '~/services/notifications.service'
import type { BackendMessage } from '~/services/notifications.service'

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
    status: (bm.status as any) || 'read',
    type: (bm.messageType as any) || 'text',
    mediaUrl: bm.mediaUrl, // Relativo, resuelto en ChatWindow con auth
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
          const history = await notificationsService.getMessages(c.id, 50)
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
  type: 'text' | 'image' | 'file' | 'audio' = 'text',
  fileSize?: number
) {
  if (!selectedChat.value) return
  const currentChat = selectedChat.value
  const msgId = 'msg_' + Date.now()
  const timeStr = getCurrentTime()

  // Limpiar borrador
  drafts.value[currentChat.id] = ''

  currentChat.messages.push({
    id: msgId,
    text,
    sender: 'me',
    time: timeStr,
    status: 'sent',
    replyTo: replyTo ? { ...replyTo } : undefined,
    type,
    fileSize
  })

  try {
    let response: { success: boolean; messageId: string; error?: string }
    if (type === 'text') {
      response = await notificationsService.sendText(currentChat.id, text)
    } else {
      const file = await urlToBlob(text, type === 'audio' ? 'voice_note.ogg' : text.split('/').pop() || 'media')
      response = await notificationsService.sendMedia(currentChat.id, file, type === 'image' ? 'Imagen adjunta' : '')
    }

    const found = currentChat.messages.find((m: any) => m.id === msgId)
    if (found && response.success) {
      found.id = response.messageId
      found.status = 'delivered'
      setTimeout(() => { if (found) found.status = 'read' }, 1500)
    } else if (found) {
      found.status = 'failed'
      alert(`No se pudo enviar el mensaje: ${response.error ?? 'error desconocido del agente WhatsApp'}`)
    }
  }
  catch (err: any) {
    console.error('Error enviando mensaje al backend NestJS:', err)
    const found = currentChat.messages.find((m: any) => m.id === msgId)
    if (found) found.status = 'failed'
    const status = err?.statusCode || err?.response?.status
    const backendMsg =
      err?.data?.message ||
      err?.response?._data?.message ||
      err?.message ||
      'sin detalle'
    const detail = Array.isArray(backendMsg) ? backendMsg.join(', ') : backendMsg
    alert(`No se pudo enviar el mensaje (HTTP ${status ?? '?'}): ${detail}`)
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

// ─── Polling de mensajes (Real-time sync) ──────────────────────────────────
const pollInterval = ref<any>(null)

function startPollingMessages() {
  stopPollingMessages()
  pollInterval.value = setInterval(async () => {
    if (!selectedChat.value) return
    const currentChat = selectedChat.value
    try {
      const history = await notificationsService.getMessages(currentChat.id, 50)
      currentChat.messages = history.messages.map(mapBackendMessage)
    } catch (e) {
      console.error('Error polling messages:', e)
    }
  }, 5000)
}

function stopPollingMessages() {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

watch(selectedChatId, (newId) => {
  if (newId) {
    const chat = mockChats.value.find(c => c.id === newId)
    if (chat) {
      notificationsService.getMessages(newId, 50).then(history => {
        chat.messages = history.messages.map(mapBackendMessage)
      }).catch(e => console.error('Error loading initial messages:', e))
    }
    startPollingMessages()
  } else {
    stopPollingMessages()
  }
})

// ─── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  wa.refreshStatus()
  await loadRecipients()
})

onBeforeUnmount(() => {
  stopPollingMessages()
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
        @send-message="handleSendMessage"
        @update-draft="(val) => drafts[selectedChat.id] = val"
      />
      <WhatsappWelcomeScreen v-else />
    </div>

  </div>
</template>
