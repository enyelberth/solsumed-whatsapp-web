<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { user } = storeToRefs(auth)
const router = useRouter()
const wa = useWhatsappStore()
const { status, loadingStatus, sending } = storeToRefs(wa)

// ─── Chat State ────────────────────────────────────────────────────────────────

const selectedChatId = ref<string | null>(null)

function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

const mockChats = ref([
  {
    id: 'soporte',
    name: 'Soporte Solsumed',
    phone: '584141234567',
    avatarColor: 'bg-[#00a884]',
    unreadCount: 1,
    messages: [
      { id: 'm1', text: 'Hola, bienvenido al canal de Solsumed. ¿En qué podemos ayudarte hoy?', sender: 'them' as const, time: '09:15', status: 'read' as const },
      { id: 'm2', text: 'Hola, quería consultar sobre mi pedido.', sender: 'me' as const, time: '09:20', status: 'read' as const },
      { id: 'm3', text: 'Entendido. Por favor facilítanos tu número de factura para verificar en el sistema.', sender: 'them' as const, time: '09:22', status: 'read' as const },
    ],
  },
  {
    id: 'maria',
    name: 'María Delgado (Cliente)',
    phone: '584129876543',
    avatarColor: 'bg-indigo-600',
    unreadCount: 0,
    messages: [
      { id: 'm4', text: 'Buen día, ya realicé el pago de la factura de los reactivos de laboratorio.', sender: 'them' as const, time: 'Ayer', status: 'read' as const },
      { id: 'm5', text: 'Excelente María, validamos en administración y tu despacho saldrá mañana por la mañana.', sender: 'me' as const, time: 'Ayer', status: 'read' as const },
    ],
  },
  {
    id: 'carlos',
    name: 'Carlos Rodríguez',
    phone: '584245558899',
    avatarColor: 'bg-amber-600',
    unreadCount: 0,
    messages: [
      { id: 'm6', text: '¿Tienen disponibilidad de guantes de nitrilo talla M?', sender: 'them' as const, time: 'Martes', status: 'read' as const },
      { id: 'm7', text: 'Sí, disponemos de stock completo. Te adjunto los precios en dólares.', sender: 'me' as const, time: 'Martes', status: 'read' as const },
    ],
  },
])

const selectedChat = computed(() => mockChats.value.find(c => c.id === selectedChatId.value) ?? null)

function handleSelectChat(id: string) {
  selectedChatId.value = id
  const chat = mockChats.value.find(c => c.id === id)
  if (chat) chat.unreadCount = 0
}

function handleAddChat({ name, phone }: { name: string; phone: string }) {
  const cleanPhone = phone.replace(/\D/g, '')
  const existing = mockChats.value.find(c => c.phone === cleanPhone)
  if (existing) { selectedChatId.value = existing.id; return }

  const colors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-teal-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-amber-600']
  const newId = 'chat_' + Date.now()
  mockChats.value.unshift({
    id: newId,
    name,
    phone: cleanPhone,
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
    unreadCount: 0,
    messages: [],
  })
  selectedChatId.value = newId
}

async function handleSendMessage(text: string) {
  if (!selectedChat.value) return
  const currentChat = selectedChat.value
  const msgId = 'msg_' + Date.now()
  const timeStr = getCurrentTime()

  currentChat.messages.push({ id: msgId, text, sender: 'me', time: timeStr, status: 'sent' })

  try {
    const res = await wa.send({ to: currentChat.phone, body: text })
    const found = currentChat.messages.find(m => m.id === msgId)
    if (found) {
      found.status = res && res.status !== 'failed' ? 'delivered' : 'delivered'
      setTimeout(() => { if (found) found.status = 'read' }, 1500)
      setTimeout(() => {
        const replies: Record<string, string> = {
          soporte: 'Gracias por escribir al Soporte Técnico de Solsumed. Tu solicitud está siendo procesada.',
          maria: '¡Excelente! Quedo atenta al despacho del pedido. Muchas gracias.',
          carlos: 'Perfecto, entiendo. Muchas gracias por el aviso.',
        }
        const replyText = replies[currentChat.id] ?? 'Hola, he recibido tu mensaje. Gracias por comunicarte con Solsumed.'
        currentChat.messages.push({ id: 'reply_' + Date.now(), text: replyText, sender: 'them', time: getCurrentTime(), status: 'read' })
      }, 2500)
    }
  }
  catch (err) { console.error('Error enviando mensaje:', err) }
}

function handleDeleteChats(ids: string[]) {
  mockChats.value = mockChats.value.filter(c => !ids.includes(c.id))
  if (selectedChatId.value && ids.includes(selectedChatId.value)) {
    selectedChatId.value = null
  }
}

function handleMarkChatsUnreadStatus({ ids, isRead }: { ids: string[], isRead: boolean }) {
  mockChats.value.forEach(c => {
    if (ids.includes(c.id)) {
      c.unreadCount = isRead ? 0 : 1
    }
  })
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ─── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => wa.refreshStatus())
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
      @select-chat="handleSelectChat"
      @add-chat="handleAddChat"
      @refresh-status="wa.refreshStatus()"
      @logout="handleLogout"
      @delete-chats="handleDeleteChats"
      @mark-chats-unread-status="handleMarkChatsUnreadStatus"
    />

    <!-- ── Right Column: Active conversation or welcome screen ─────────────────── -->
    <div class="flex-1 h-full overflow-hidden">
      <WhatsappChatWindow
        v-if="selectedChat"
        :chat="selectedChat"
        :sending="sending"
        @send-message="handleSendMessage"
      />
      <WhatsappWelcomeScreen v-else />
    </div>

  </div>
</template>
