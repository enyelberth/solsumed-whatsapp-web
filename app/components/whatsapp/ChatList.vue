<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Message {
  id: string
  text: string
  sender: 'me' | 'them'
  time: string
  status: 'sent' | 'delivered' | 'read'
}

interface Chat {
  id: string
  name: string
  phone: string
  avatarColor: string
  unreadCount: number
  messages: Message[]
  isPinned?: boolean
  isArchived?: boolean
  isGroup?: boolean
}

const props = defineProps<{
  chats: Chat[]
  selectedChatId: string | null
  userEmail: string
  phoneNumber?: string
  loadingStatus: boolean
  drafts?: Record<string, string>
}>()

const emit = defineEmits<{
  'select-chat': [id: string]
  'add-chat': [payload: { name: string; phone: string }]
  'refresh-status': []
  'logout': []
  'delete-chats': [ids: string[]]
  'mark-chats-unread-status': [payload: { ids: string[]; isRead: boolean }]
  'toggle-pin-chat': [id: string]
  'toggle-archive-chat': [id: string]
  'bulk-archive-chats': [payload: { ids: string[]; isArchive: boolean }]
}>()

// ── Filter tabs ────────────────────────────────────────────────────
type FilterTab = 'all' | 'unread' | 'groups' | 'contacts'
const activeTab = ref<FilterTab>('all')

// ── Search ─────────────────────────────────────────────────────────
const searchQuery = ref('')
const isSearching = ref(false)

function openSearch() { isSearching.value = true }
function closeSearch() { isSearching.value = false; searchQuery.value = '' }

const filteredChats = computed(() => {
  let list = props.chats.filter(c => !c.isArchived)
  if (activeTab.value === 'unread') {
    list = list.filter(c => c.unreadCount > 0)
  } else if (activeTab.value === 'groups') {
    list = list.filter(c => c.isGroup)
  } else if (activeTab.value === 'contacts') {
    list = list.filter(c => !c.isGroup)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    return [...list].sort((a, b) => {
      const aPinned = a.isPinned ? 1 : 0
      const bPinned = b.isPinned ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned

      // Recientes arriba: ordenar por createdAt del último msg desc
      return getLastTimestamp(b) - getLastTimestamp(a)
    })
  }
  list = list.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.phone.includes(q) ||
    c.messages.some(m => m.text.toLowerCase().includes(q))
  )
  return [...list].sort((a, b) => {
    const aPinned = a.isPinned ? 1 : 0
    const bPinned = b.isPinned ? 1 : 0
    return bPinned - aPinned
  })
})

// ── New Chat Panel ─────────────────────────────────────────────────
const showNewChatPanel = ref(false)
const newChatName = ref('')
const newChatPhone = ref('')
const newChatError = ref('')
const useTemplate = ref(true)
const templatePreset = ref('hello_world')
const templateName = ref('hello_world')
const templateLang = ref('en_US')
const templateParams = ref('')
const initialMessage = ref('')

const TEMPLATE_PRESETS = [
  { id: 'hello_world', name: 'hello_world', lang: 'en_US', label: 'hello_world (saludo Meta, sin params)', params: '', requiredParams: 0 },
  { id: 'reposicion_inventario', name: 'reposicion_inventario', lang: 'es', label: 'reposicion_inventario (3 params: cantidad | falta | resumen)', params: '1 | 100 | Aviso de prueba', requiredParams: 3 },
  { id: 'custom', name: '', lang: 'es', label: 'Custom (definir manualmente)', params: '', requiredParams: 0 },
] as const

watch(templatePreset, (id) => {
  const p = TEMPLATE_PRESETS.find(x => x.id === id)
  if (p && p.id !== 'custom') {
    templateName.value = p.name
    templateLang.value = p.lang
    templateParams.value = p.params
  }
})

function handleCreateChat() {
  newChatError.value = ''
  const phoneVal = newChatPhone.value.replace(/\D/g, '')
  if (!newChatName.value.trim()) { newChatError.value = 'El nombre es obligatorio.'; return }
  if (!phoneVal || phoneVal.length < 8) { newChatError.value = 'Número inválido.'; return }
  if (useTemplate.value && !templateName.value.trim()) {
    newChatError.value = 'Nombre del template requerido.'; return
  }
  if (!useTemplate.value && !initialMessage.value.trim()) {
    newChatError.value = 'Escribe un mensaje inicial o usa template.'; return
  }
  const params = templateParams.value
    .split('|').map(s => s.trim()).filter(Boolean)
  if (useTemplate.value) {
    const preset = TEMPLATE_PRESETS.find(p => p.id === templatePreset.value)
    const required = preset?.requiredParams ?? 0
    if (required > 0 && params.length !== required) {
      newChatError.value = `Template "${templateName.value}" requiere ${required} parámetros (separados por |). Diste ${params.length}.`
      return
    }
  }
  emit('add-chat', {
    name: newChatName.value.trim(),
    phone: phoneVal,
    useTemplate: useTemplate.value,
    templateName: templateName.value.trim(),
    templateLang: templateLang.value.trim() || 'es',
    templateParams: params,
    initialMessage: initialMessage.value.trim(),
  })
  newChatName.value = ''; newChatPhone.value = ''
  templateParams.value = ''; initialMessage.value = ''
  showNewChatPanel.value = false
}

// ── Profile panel ────────────────────────────────────────────────
const showProfilePanel = ref(false)

// ── Settings panel ────────────────────────────────────────────────
const showSettingsPanel = ref(false)

// ── Keyboard shortcuts ────────────────────────────────────────────
const showShortcuts = ref(false)

// ── Menu dropdown ─────────────────────────────────────────────────
const showMenu = ref(false)

// ── Selection Mode ─────────────────────────────────────────────────
const isSelectionMode = ref(false)
const selectedChatIds = ref<Set<string>>(new Set())
const activeItemMenuChatId = ref<string | null>(null)
const showArchivedPanel = ref(false)

const archivedChats = computed(() => {
  return props.chats.filter(c => c.isArchived)
})

const archivedChatsCount = computed(() => {
  return archivedChats.value.length
})

function handleBulkArchive(isArchive: boolean) {
  if (selectedChatIds.value.size === 0) return
  emit('bulk-archive-chats', {
    ids: Array.from(selectedChatIds.value),
    isArchive
  })
  exitSelectionMode()
}

function toggleItemMenu(chatId: string, event?: Event) {
  if (event) event.stopPropagation()
  if (activeItemMenuChatId.value === chatId) {
    activeItemMenuChatId.value = null
  } else {
    activeItemMenuChatId.value = chatId
  }
}

function closeItemMenu() {
  activeItemMenuChatId.value = null
}

function enterSelectionMode(initialChatId?: string) {
  isSelectionMode.value = true
  selectedChatIds.value.clear()
  if (initialChatId) {
    selectedChatIds.value.add(initialChatId)
  }
  showMenu.value = false
}

function exitSelectionMode() {
  isSelectionMode.value = false
  selectedChatIds.value.clear()
}

function toggleChatSelection(chatId: string) {
  if (selectedChatIds.value.has(chatId)) {
    selectedChatIds.value.delete(chatId)
  } else {
    selectedChatIds.value.add(chatId)
  }
}

const isAllSelected = computed(() => {
  if (filteredChats.value.length === 0) return false
  return filteredChats.value.every(c => selectedChatIds.value.has(c.id))
})

function toggleSelectAll() {
  if (isAllSelected.value) {
    filteredChats.value.forEach(c => selectedChatIds.value.delete(c.id))
  } else {
    filteredChats.value.forEach(c => selectedChatIds.value.add(c.id))
  }
}

function handleBulkDelete() {
  if (selectedChatIds.value.size === 0) return
  const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar los ${selectedChatIds.value.size} chats seleccionados?`)
  if (confirmed) {
    emit('delete-chats', Array.from(selectedChatIds.value))
    exitSelectionMode()
  }
}

function handleBulkMarkRead(isRead: boolean) {
  if (selectedChatIds.value.size === 0) return
  emit('mark-chats-unread-status', {
    ids: Array.from(selectedChatIds.value),
    isRead
  })
  exitSelectionMode()
}

// ── Helpers ────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
function getLastMessage(chat: Chat) {
  return chat.messages.length ? chat.messages[chat.messages.length - 1] : null
}
function getLastTime(chat: Chat) {
  const msg = getLastMessage(chat)
  return msg?.time ?? ''
}
function getLastTimestamp(chat: Chat): number {
  const msg = getLastMessage(chat) as any
  if (!msg) return 0
  if (msg.createdAt) {
    const t = Date.parse(msg.createdAt)
    if (!Number.isNaN(t)) return t
  }
  return 0
}
function isUnreadTime(chat: Chat) {
  return chat.unreadCount > 0
}
</script>

<template>
  <!-- Sidebar: fixed width matching WhatsApp Web -->
  <div
    class="wa-font relative flex flex-col shrink-0 h-full bg-[#ffffff] dark:bg-[#111b21] border-r border-[#e9edef] dark:border-[#222d34] overflow-hidden"
    style="width: 30%; min-width: 340px; max-width: 420px;"
  >

    <!-- ══ PROFILE PANEL ════════════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-150 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <WhatsappProfilePanel
        v-if="showProfilePanel"
        :user-email="userEmail"
        :phone-number="phoneNumber"
        @close="showProfilePanel = false"
        @logout="emit('logout')"
      />
    </Transition>

    <!-- ══ SETTINGS PANEL ═══════════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-150 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <WhatsappSettingsPanel
        v-if="showSettingsPanel"
        :user-email="userEmail"
        :phone-number="phoneNumber"
        @close="showSettingsPanel = false"
        @logout="emit('logout')"
        @open-shortcuts="showSettingsPanel = false; showShortcuts = true"
      />
    </Transition>

    <!-- ══ KEYBOARD SHORTCUTS OVERLAY ══════════════════════════════ -->
    <WhatsappKeyboardShortcuts
      v-if="showShortcuts"
      @close="showShortcuts = false"
    />

    <!-- ══ NEW CHAT SLIDE PANEL ══════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-150 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <div v-if="showNewChatPanel" class="absolute inset-0 z-40 flex flex-col bg-[#ffffff] dark:bg-[#111b21]">
        <!-- Panel Header -->
        <div class="h-[114px] bg-[#008069] dark:bg-[#202c33] flex flex-col justify-end px-5 pb-4 shrink-0">
          <div class="flex items-center gap-6">
            <button @click="showNewChatPanel = false"
              class="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
              <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            </button>
            <span class="text-white text-[19px] font-medium">Nuevo chat</span>
          </div>
        </div>
        <!-- Form -->
        <div class="flex-1 overflow-y-auto wa-scrollbar px-6 py-5 space-y-4">
          <p class="text-[13px] text-[#667781] dark:text-[#8696a0] leading-relaxed">
            Ingresa los datos del destinatario para iniciar una conversación.
          </p>
          <div class="space-y-1.5">
            <label class="text-[12px] font-medium text-[#008069] dark:text-[#00a884]">Nombre</label>
            <input v-model="newChatName" type="text" placeholder="Ej. Juan Pérez"
              @keyup.enter="handleCreateChat"
              class="w-full h-10 px-3 text-[14px] rounded-lg border border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-colors" />
          </div>
          <div class="space-y-1.5">
            <label class="text-[12px] font-medium text-[#008069] dark:text-[#00a884]">Teléfono (con código de país)</label>
            <input v-model="newChatPhone" type="text" placeholder="Ej. 584141234567"
              @keyup.enter="handleCreateChat"
              class="w-full h-10 px-3 text-[14px] rounded-lg border border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-colors" />
          </div>

          <div class="rounded-lg bg-[#f0f2f5] dark:bg-[#2a3942] px-3 py-2.5 space-y-2">
            <label class="flex items-center gap-2 text-[13px] text-[#3b4a54] dark:text-[#e9edef] cursor-pointer">
              <input v-model="useTemplate" type="checkbox" class="w-4 h-4 accent-[#00a884]" />
              <span>Usar template aprobado <span class="text-[#8696a0]">(requerido si el contacto no te escribió en 24h)</span></span>
            </label>
          </div>

          <template v-if="useTemplate">
            <div class="space-y-1.5">
              <label class="text-[12px] font-medium text-[#008069] dark:text-[#00a884]">Plantilla aprobada</label>
              <select v-model="templatePreset"
                class="w-full h-10 px-3 text-[14px] rounded-lg border border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-colors">
                <option v-for="p in TEMPLATE_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
            </div>
            <div v-if="templatePreset === 'custom'" class="grid grid-cols-2 gap-2">
              <div class="space-y-1.5">
                <label class="text-[12px] font-medium text-[#008069] dark:text-[#00a884]">Template</label>
                <input v-model="templateName" type="text" placeholder="nombre_template"
                  class="w-full h-10 px-3 text-[14px] rounded-lg border border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-colors" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[12px] font-medium text-[#008069] dark:text-[#00a884]">Idioma</label>
                <input v-model="templateLang" type="text" placeholder="en_US / es"
                  class="w-full h-10 px-3 text-[14px] rounded-lg border border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-colors" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="text-[12px] font-medium text-[#008069] dark:text-[#00a884]">Parámetros body (separa con |)</label>
              <input v-model="templateParams" type="text" placeholder="valor1 | valor2"
                class="w-full h-10 px-3 text-[14px] rounded-lg border border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-colors" />
            </div>
          </template>

          <template v-else>
            <div class="space-y-1.5">
              <label class="text-[12px] font-medium text-[#008069] dark:text-[#00a884]">Mensaje inicial</label>
              <textarea v-model="initialMessage" placeholder="Escribe el primer mensaje..." rows="3"
                class="w-full px-3 py-2 text-[14px] rounded-lg border border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-colors resize-none"></textarea>
              <p class="text-[11px] text-amber-600">⚠️ Solo funciona si el contacto te escribió en las últimas 24h. Sino usa template.</p>
            </div>
          </template>

          <p v-if="newChatError" class="text-[12px] text-red-500">{{ newChatError }}</p>
          <button @click="handleCreateChat"
            class="w-full h-10 rounded-lg bg-[#00a884] hover:bg-[#008f72] text-white text-[14px] font-medium transition-colors">
            Iniciar conversación
          </button>
        </div>
      </div>
    </Transition>

    <!-- ══ ARCHIVED CHATS PANEL ══════════════════════════════════════ -->
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-150 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <div v-if="showArchivedPanel" class="absolute inset-0 z-40 flex flex-col bg-[#ffffff] dark:bg-[#111b21]">
        <!-- Panel Header -->
        <div class="h-[114px] bg-[#008069] dark:bg-[#202c33] flex flex-col justify-end px-5 pb-4 shrink-0">
          <div class="flex items-center gap-6">
            <button @click="showArchivedPanel = false"
              class="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
              <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
            </button>
            <span class="text-white text-[19px] font-medium">Archivados</span>
          </div>
        </div>
        <!-- List -->
        <div class="flex-1 overflow-y-auto wa-scrollbar">
          <div v-if="archivedChats.length === 0" class="flex flex-col items-center justify-center h-full text-center px-6">
            <UIcon name="i-lucide-archive" class="w-12 h-12 text-[#8696a0] mb-2" />
            <p class="text-[14px] text-[#8696a0]">No hay chats archivados</p>
          </div>
          <div
            v-for="chat in archivedChats"
            :key="chat.id"
            @click="emit('select-chat', chat.id); showArchivedPanel = false"
            class="h-[72px] flex items-center pl-3 pr-4 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] group relative select-none"
          >
            <div :class="['w-[49px] h-[49px] rounded-full flex items-center justify-center font-semibold text-white text-[18px] shrink-0', chat.avatarColor]">
              {{ getInitials(chat.name) }}
            </div>
            <div class="flex-1 min-w-0 ml-3 border-b border-[#e9edef] dark:border-[#222d34] h-full flex flex-col justify-center relative">
              <div class="flex items-center justify-between">
                <span class="text-[16px] font-normal text-[#111b21] dark:text-[#e9edef] truncate leading-snug">
                  {{ chat.name }}
                </span>
                <span class="shrink-0 ml-2 text-[12px] text-[#667781] dark:text-[#8696a0]">
                  {{ getLastTime(chat) }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-[3px] relative">
                <span class="text-[13px] text-[#667781] dark:text-[#8696a0] truncate leading-snug">
                  {{ getLastMessage(chat)?.text ?? 'Sin mensajes' }}
                </span>
                <div class="relative flex items-center">
                  <button
                    @click.stop="toggleItemMenu(chat.id, $event)"
                    class="opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#8696a0] hover:text-[#54656f] dark:hover:text-[#e9edef] transition-opacity p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <UIcon name="i-lucide-chevron-down" class="w-5 h-5" />
                  </button>
                  <Transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-75 ease-in"
                    leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95"
                  >
                    <div
                      v-if="activeItemMenuChatId === chat.id"
                      v-click-outside="closeItemMenu"
                      class="absolute right-0 top-6 z-50 w-44 bg-white dark:bg-[#233138] shadow-lg rounded-md py-1 text-[13px] text-[#3b4a54] dark:text-[#e9edef] border border-[#e9edef] dark:border-[#222d34]"
                    >
                      <button
                        @click.stop="closeItemMenu(); emit('toggle-archive-chat', chat.id)"
                        class="w-full text-left px-4 py-2 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors"
                      >
                        Desarchivar chat
                      </button>
                      <button
                        @click.stop="closeItemMenu(); emit('delete-chats', [chat.id])"
                        class="w-full text-left px-4 py-2 text-red-500 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors"
                      >
                        Eliminar chat
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ══ SELECTION HEADER ════════════════════════════════════════ -->
    <div v-if="isSelectionMode" class="h-[59px] px-4 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between shrink-0 border-b border-[#e9edef] dark:border-[#222d34] relative">
      <div class="flex items-center gap-4">
        <!-- Close button -->
        <button @click="exitSelectionMode" class="text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] p-1.5 rounded-full transition-colors" title="Cancelar selección">
          <UIcon name="i-lucide-x" class="w-5 h-5" />
        </button>
        <!-- Selection count -->
        <span class="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef] select-none">
          {{ selectedChatIds.size }} seleccionados
        </span>
      </div>

      <div class="flex items-center gap-1 text-[#54656f] dark:text-[#aebac1]">
        <!-- Select all toggle -->
        <button @click="toggleSelectAll" :title="isAllSelected ? 'Deseleccionar todos' : 'Seleccionar todos'" class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors">
          <UIcon :name="isAllSelected ? 'i-lucide-check-square' : 'i-lucide-square'" class="w-5 h-5" />
        </button>
        <!-- Mark as read -->
        <button @click="handleBulkMarkRead(true)" title="Marcar como leídos" :disabled="selectedChatIds.size === 0" class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] disabled:opacity-40 transition-colors">
          <UIcon name="i-lucide-check-check" class="w-5 h-5" />
        </button>
        <!-- Mark as unread -->
        <button @click="handleBulkMarkRead(false)" title="Marcar como no leídos" :disabled="selectedChatIds.size === 0" class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] disabled:opacity-40 transition-colors">
          <UIcon name="i-lucide-mail" class="w-5 h-5" />
        </button>
        <!-- Archive selected -->
        <button @click="handleBulkArchive(true)" title="Archivar chats" :disabled="selectedChatIds.size === 0" class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] disabled:opacity-40 transition-colors">
          <UIcon name="i-lucide-archive" class="w-5 h-5" />
        </button>
        <!-- Delete -->
        <button @click="handleBulkDelete" title="Eliminar chats" :disabled="selectedChatIds.size === 0" class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] text-red-500 disabled:opacity-40 transition-colors">
          <UIcon name="i-lucide-trash-2" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- ══ HEADER (59px — exact WhatsApp measurement) ══════════════ -->
    <div v-else class="h-[59px] px-4 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between shrink-0 relative">

      <!-- Left: User avatar — click opens profile panel -->
      <button
        class="flex items-center rounded-full transition-opacity hover:opacity-80 active:opacity-60"
        title="Ver perfil"
        @click="showProfilePanel = true"
      >
        <div class="w-[40px] h-[40px] rounded-full bg-[#dfe5e7] dark:bg-[#374045] flex items-center justify-center text-[#54656f] dark:text-[#aebac1] font-semibold text-[15px] select-none overflow-hidden">
          <span>{{ getInitials(userEmail) }}</span>
        </div>
      </button>

      <!-- Right: Action icons -->
      <div class="flex items-center gap-0.5 text-[#54656f] dark:text-[#aebac1]">
        <!-- Status indicator -->
        <button
          @click="emit('refresh-status')"
          title="Estado WhatsApp"
          class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors"
        >
          <UIcon name="i-lucide-circle-dot" class="w-[22px] h-[22px]" :class="phoneNumber ? 'text-[#00a884]' : 'text-[#54656f] dark:text-[#aebac1]'" />
        </button>

        <!-- New Chat -->
        <button
          @click="showNewChatPanel = true"
          title="Nuevo chat"
          class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors"
        >
          <UIcon name="i-lucide-message-square-plus" class="w-[22px] h-[22px]" />
        </button>

        <!-- More options (3 dots) -->
        <div class="relative">
          <button
            @click="showMenu = !showMenu"
            title="Opciones"
            class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors"
          >
            <UIcon name="i-lucide-ellipsis-vertical" class="w-[22px] h-[22px]" />
          </button>
          <!-- Dropdown Menu -->
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
          >
            <div v-if="showMenu" v-click-outside="() => showMenu = false"
              class="absolute right-0 top-11 z-50 w-56 bg-white dark:bg-[#233138] shadow-xl rounded-lg py-1.5 text-[14px] text-[#3b4a54] dark:text-[#e9edef]">
              <button @click="showMenu = false; showNewChatPanel = true"
                class="w-full text-left px-5 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                Nuevo chat
              </button>
              <button @click="showMenu = false; showProfilePanel = true"
                class="w-full text-left px-5 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                Perfil
              </button>
              <button @click="showMenu = false; enterSelectionMode()"
                class="w-full text-left px-5 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                Seleccionar chats
              </button>
              <button @click="showMenu = false; showSettingsPanel = true"
                class="w-full text-left px-5 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                Configuración
              </button>
              <button @click="showMenu = false; showShortcuts = true"
                class="w-full text-left px-5 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                Atajos de teclado
              </button>
              <div class="border-t border-[#e9edef] dark:border-[#222d34] my-1" />
              <button @click="showMenu = false; emit('logout')"
                class="w-full text-left px-5 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] text-red-500 transition-colors">
                Cerrar sesión
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- ══ SEARCH BAR ════════════════════════════════════════════════ -->
    <div class="px-3 py-2 bg-[#ffffff] dark:bg-[#111b21] shrink-0">
      <div
        class="flex items-center h-[35px] rounded-full bg-[#f0f2f5] dark:bg-[#202c33] px-4 gap-3"
        :class="{ 'ring-1 ring-[#00a884]': isSearching }"
      >
        <UIcon
          v-if="!isSearching"
          name="i-lucide-search"
          class="w-[15px] h-[15px] shrink-0 text-[#54656f] dark:text-[#8696a0]"
        />
        <button v-else @click="closeSearch" class="shrink-0 text-[#00a884]">
          <UIcon name="i-lucide-arrow-left" class="w-[15px] h-[15px]" />
        </button>

        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar o empezar un chat nuevo"
          class="flex-1 bg-transparent border-none text-[14px] text-[#111b21] dark:text-[#e9edef] placeholder-[#667781] dark:placeholder-[#8696a0] focus:outline-none focus:ring-0 leading-none"
          @focus="openSearch"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="shrink-0 text-[#8696a0] hover:text-[#54656f]">
          <UIcon name="i-lucide-x" class="w-[15px] h-[15px]" />
        </button>
      </div>
    </div>

    <!-- ══ FILTER TABS ═══════════════════════════════════════════════ -->
    <div class="flex items-center px-3 pb-1 gap-2 shrink-0 bg-[#ffffff] dark:bg-[#111b21] overflow-x-auto">
      <button
        v-for="tab in ([{ key: 'all', label: 'Todos' }, { key: 'unread', label: 'No leídos' }, { key: 'contacts', label: 'Contactos' }, { key: 'groups', label: 'Grupos' }] as const)"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="shrink-0 px-3 h-7 rounded-full text-[12px] font-medium transition-all select-none"
        :class="activeTab === tab.key
          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#008069] dark:text-[#00a884]'
          : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#3b4a54] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ══ PHONE NUMBER BANNER ════════════════════════════════════════ -->
    <div v-if="phoneNumber"
      class="mx-3 mb-1 px-3 py-2 rounded-lg bg-[#dcf8c6] dark:bg-[#005c4b]/30 flex items-center gap-2 shrink-0">
      <div class="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
        <UIcon name="i-lucide-phone" class="w-3.5 h-3.5 text-white" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[11px] text-[#667781] dark:text-[#8696a0] leading-none">Número activo</div>
        <div class="text-[12px] font-semibold text-[#111b21] dark:text-[#e9edef] truncate">+{{ phoneNumber }}</div>
      </div>
    </div>

    <!-- ══ CHAT LIST ══════════════════════════════════════════════════ -->
    <div class="flex-1 overflow-y-auto wa-scrollbar">

      <!-- Archived Chats Row Trigger -->
      <div v-if="archivedChatsCount > 0 && !isSelectionMode"
        @click="showArchivedPanel = true"
        class="h-[49px] flex items-center px-4 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] border-b border-[#e9edef] dark:border-[#222d34] select-none text-[#54656f] dark:text-[#aebac1] shrink-0"
      >
        <div class="flex items-center gap-6 flex-1">
          <UIcon name="i-lucide-archive" class="w-5 h-5 text-[#00a884]" />
          <span class="text-[15px] font-normal text-[#111b21] dark:text-[#e9edef]">Archivados</span>
        </div>
        <span class="text-[12px] font-semibold text-[#00a884]">{{ archivedChatsCount }}</span>
      </div>

      <!-- Empty state -->
      <div v-if="filteredChats.length === 0"
        class="flex flex-col items-center justify-center h-full gap-3 text-center px-8 pb-12">
        <div class="w-14 h-14 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-center">
          <UIcon name="i-lucide-message-circle" class="w-7 h-7 text-[#8696a0]" />
        </div>
        <p class="text-[14px] font-medium text-[#3b4a54] dark:text-[#e9edef]">Sin conversaciones</p>
        <p class="text-[13px] text-[#8696a0]">Haz clic en el icono de chat para empezar.</p>
      </div>

      <!-- Chat items — 72px height matching WhatsApp Web exactly -->
      <div
        v-for="chat in filteredChats"
        :key="chat.id"
        @click="isSelectionMode ? toggleChatSelection(chat.id) : emit('select-chat', chat.id)"
        class="h-[72px] flex items-center pl-3 pr-4 cursor-pointer transition-colors group relative select-none"
        :class="[
          selectedChatId === chat.id && !isSelectionMode
            ? 'bg-[#eae6df] dark:bg-[#2a3942]'
            : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]',
          isSelectionMode && selectedChatIds.has(chat.id) ? 'bg-[#f0f2f5] dark:bg-[#2a3942]/60' : ''
        ]"
      >
        <!-- Selection Checkbox -->
        <div v-if="isSelectionMode" class="mr-3 shrink-0 flex items-center justify-center transition-all duration-200">
          <div
            class="w-5 h-5 rounded-full flex items-center justify-center transition-all border"
            :class="selectedChatIds.has(chat.id)
              ? 'bg-[#00a884] border-[#00a884] text-white'
              : 'border-[#b1b9be] dark:border-[#54656f] text-transparent'"
          >
            <UIcon name="i-lucide-check" class="w-3.5 h-3.5 stroke-[3px]" />
          </div>
        </div>

        <!-- Avatar (49px — exact WhatsApp measurement) -->
        <div :class="['w-[49px] h-[49px] rounded-full flex items-center justify-center font-semibold text-white text-[18px] shrink-0 select-none', chat.avatarColor]">
          {{ getInitials(chat.name) }}
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 ml-3 border-b border-[#e9edef] dark:border-[#222d34] h-full flex flex-col justify-center relative">
          <!-- Top row: Name + Time -->
          <div class="flex items-center justify-between">
            <span class="text-[16px] font-normal text-[#111b21] dark:text-[#e9edef] truncate leading-snug">
              {{ chat.name }}
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
              <UIcon v-if="chat.isPinned" name="i-lucide-pin" class="w-3.5 h-3.5 text-[#8696a0] rotate-45" />
              <span v-if="!isSelectionMode" class="text-[12px] leading-none"
                :class="isUnreadTime(chat) ? 'text-[#00a884]' : 'text-[#667781] dark:text-[#8696a0]'">
                {{ getLastTime(chat) }}
              </span>
            </div>
          </div>

          <!-- Bottom row: Message preview + Badge -->
          <div class="flex items-center justify-between mt-[3px] relative">
            <div class="flex items-center gap-1 min-w-0 flex-1">
              <!-- Sent status ticks -->
              <span v-if="!drafts?.[chat.id] && getLastMessage(chat)?.sender === 'me'" class="shrink-0 flex items-center">
                <UIcon
                  v-if="getLastMessage(chat)?.status === 'read'"
                  name="i-lucide-check-check"
                  class="w-[14px] h-[14px] text-[#53bdeb]"
                />
                <UIcon
                  v-else
                  name="i-lucide-check-check"
                  class="w-[14px] h-[14px] text-[#667781] dark:text-[#8696a0]"
                />
              </span>
              
              <!-- Preview text OR Draft -->
              <span class="text-[13px] truncate leading-snug">
                <template v-if="drafts?.[chat.id]">
                  <span class="text-[#00a884] font-medium mr-1 select-none">Borrador:</span>
                  <span class="text-[#667781] dark:text-[#8696a0]">{{ drafts[chat.id] }}</span>
                </template>
                <template v-else>
                  <span class="text-[#667781] dark:text-[#8696a0]">
                    {{ getLastMessage(chat)?.text ?? 'Sin mensajes' }}
                  </span>
                </template>
              </span>
            </div>
            
            <!-- Badges and Hover Chevron -->
            <div class="flex items-center gap-1.5 ml-2 shrink-0 relative">
              <!-- Unread badge -->
              <span v-if="chat.unreadCount > 0 && !isSelectionMode"
                class="min-w-[18px] h-[18px] rounded-full bg-[#00a884] text-white text-[11px] font-semibold flex items-center justify-center px-1.5 leading-none">
                {{ chat.unreadCount }}
              </span>

              <!-- Hover Chevron for individual options menu -->
              <div v-if="!isSelectionMode" class="relative flex items-center">
                <button
                  @click.stop="toggleItemMenu(chat.id, $event)"
                  class="opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#8696a0] hover:text-[#54656f] dark:hover:text-[#e9edef] transition-opacity duration-150 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                  title="Opciones de chat"
                >
                  <UIcon name="i-lucide-chevron-down" class="w-5 h-5" />
                </button>

                <!-- Individual Chat Context Menu (Dropdown) -->
                <Transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="opacity-0 scale-95"
                  enter-to-class="opacity-100 scale-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-if="activeItemMenuChatId === chat.id"
                    v-click-outside="closeItemMenu"
                    class="absolute right-0 top-6 z-30 w-48 bg-white dark:bg-[#233138] shadow-lg rounded-md py-1 text-[13px] text-[#3b4a54] dark:text-[#e9edef] border border-[#e9edef] dark:border-[#222d34]"
                  >
                    <button
                      @click.stop="closeItemMenu(); enterSelectionMode(chat.id)"
                      class="w-full text-left px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors"
                    >
                      Seleccionar chat
                    </button>
                    <button
                      @click.stop="closeItemMenu(); emit('toggle-pin-chat', chat.id)"
                      class="w-full text-left px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors"
                    >
                      {{ chat.isPinned ? 'Desfijar chat' : 'Fijar chat' }}
                    </button>
                    <button
                      @click.stop="closeItemMenu(); emit('toggle-archive-chat', chat.id)"
                      class="w-full text-left px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors"
                    >
                      {{ chat.isArchived ? 'Desarchivar chat' : 'Archivar chat' }}
                    </button>
                    <button
                      @click.stop="closeItemMenu(); emit('mark-chats-unread-status', { ids: [chat.id], isRead: chat.unreadCount > 0 })"
                      class="w-full text-left px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors"
                    >
                      {{ chat.unreadCount > 0 ? 'Marcar como leído' : 'Marcar como no leído' }}
                    </button>
                    <div class="border-t border-[#e9edef] dark:border-[#222d34] my-1" />
                    <button
                      @click.stop="closeItemMenu(); emit('delete-chats', [chat.id])"
                      class="w-full text-left px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] text-red-500 transition-colors"
                    >
                      Eliminar chat
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
