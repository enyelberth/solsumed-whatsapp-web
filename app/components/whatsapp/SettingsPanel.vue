<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  userEmail: string
  phoneNumber?: string
}

defineProps<Props>()
const emit = defineEmits<{
  close: []
  logout: []
  'open-shortcuts': []
}>()

// ── Theme (uses Nuxt UI / @nuxt/color-mode) ────────────────────────
const colorMode = useColorMode()

type Theme = 'system' | 'light' | 'dark'
const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'system', label: 'Sistema', icon: 'i-lucide-monitor' },
  { value: 'light',  label: 'Claro',   icon: 'i-lucide-sun' },
  { value: 'dark',   label: 'Oscuro',  icon: 'i-lucide-moon' },
]

function setTheme(t: Theme) {
  colorMode.preference = t
}

// ── Enter key behavior ──────────────────────────────────────────────
const enterSends = ref(true)

// ── Notifications ───────────────────────────────────────────────────
const desktopNotifications = ref(false)
const notificationSounds = ref(true)
const messagePreviews = ref(true)

async function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') {
    desktopNotifications.value = true
    return
  }
  const permission = await Notification.requestPermission()
  desktopNotifications.value = permission === 'granted'
}

function toggleDesktopNotifications() {
  if (!desktopNotifications.value) {
    requestNotificationPermission()
  } else {
    desktopNotifications.value = false
  }
}

// ── Privacy ─────────────────────────────────────────────────────────
const readReceipts = ref(true)

// ── Logout confirmation ─────────────────────────────────────────────
const showLogoutConfirm = ref(false)

// ── Sections ────────────────────────────────────────────────────────
type Section = 'general' | 'notifications' | 'privacy' | 'help'
const activeSection = ref<Section>('general')

const sections = [
  { key: 'general' as Section,       label: 'General',        icon: 'i-lucide-settings' },
  { key: 'notifications' as Section, label: 'Notificaciones', icon: 'i-lucide-bell' },
  { key: 'privacy' as Section,       label: 'Privacidad',     icon: 'i-lucide-lock' },
  { key: 'help' as Section,          label: 'Ayuda',          icon: 'i-lucide-help-circle' },
]
</script>

<template>
  <div class="wa-font absolute inset-0 z-40 flex flex-col bg-[#ffffff] dark:bg-[#111b21]">

    <!-- ══ HEADER ════════════════════════════════════════════════════ -->
    <div class="h-[114px] bg-[#008069] dark:bg-[#202c33] flex flex-col justify-end px-5 pb-5 shrink-0">
      <div class="flex items-center gap-6">
        <button
          @click="emit('close')"
          class="text-white hover:bg-white/10 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
        </button>
        <span class="text-white text-[19px] font-medium">Configuración</span>
      </div>
    </div>

    <!-- ══ BODY ══════════════════════════════════════════════════════ -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Left nav tabs -->
      <nav class="w-[190px] shrink-0 border-r border-[#e9edef] dark:border-[#222d34] bg-[#f8f9fa] dark:bg-[#111b21] py-2 flex flex-col">
        <button
          v-for="s in sections"
          :key="s.key"
          @click="activeSection = s.key"
          class="flex items-center gap-3 px-5 py-3 text-[14px] transition-colors text-left"
          :class="activeSection === s.key
            ? 'bg-[#e7f8f3] dark:bg-[#005c4b]/30 text-[#008069] dark:text-[#00a884] font-medium border-r-2 border-[#00a884]'
            : 'text-[#3b4a54] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33]'"
        >
          <UIcon :name="s.icon" class="w-4 h-4 shrink-0" />
          {{ s.label }}
        </button>

        <!-- Keyboard shortcuts -->
        <button
          @click="emit('open-shortcuts')"
          class="flex items-center gap-3 px-5 py-3 text-[14px] text-[#3b4a54] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition-colors text-left mt-auto"
        >
          <UIcon name="i-lucide-keyboard" class="w-4 h-4 shrink-0" />
          Atajos de teclado
        </button>

        <!-- Logout -->
        <button
          @click="showLogoutConfirm = true"
          class="flex items-center gap-3 px-5 py-3 text-[14px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
        >
          <UIcon name="i-lucide-log-out" class="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </nav>

      <!-- Right content -->
      <div class="flex-1 overflow-y-auto wa-scrollbar bg-[#f8f9fa] dark:bg-[#0b141a] p-6 space-y-5">

        <!-- ─ GENERAL ─────────────────────────────────────────────── -->
        <template v-if="activeSection === 'general'">

          <!-- Theme -->
          <div class="bg-white dark:bg-[#111b21] rounded-xl overflow-hidden shadow-sm">
            <div class="px-5 py-3 border-b border-[#f0f2f5] dark:border-[#222d34]">
              <p class="text-[13px] font-semibold text-[#008069] dark:text-[#00a884] uppercase tracking-wide">Tema</p>
            </div>
            <div class="p-4 flex gap-3">
              <button
                v-for="t in themes"
                :key="t.value"
                @click="setTheme(t.value)"
                class="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all"
                :class="colorMode.preference === t.value
                  ? 'border-[#00a884] bg-[#e7f8f3] dark:bg-[#005c4b]/20 text-[#008069] dark:text-[#00a884]'
                  : 'border-[#e9edef] dark:border-[#222d34] text-[#54656f] dark:text-[#8696a0] hover:border-[#8696a0] hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'"
              >
                <UIcon :name="t.icon" class="w-6 h-6" />
                <span class="text-[13px] font-medium">{{ t.label }}</span>
                <div
                  class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  :class="colorMode.preference === t.value
                    ? 'border-[#00a884] bg-[#00a884]'
                    : 'border-[#d1d7db] dark:border-[#8696a0]'"
                >
                  <div v-if="colorMode.preference === t.value" class="w-2 h-2 rounded-full bg-white" />
                </div>
              </button>
            </div>
          </div>

          <!-- Enter key -->
          <div class="bg-white dark:bg-[#111b21] rounded-xl shadow-sm overflow-hidden">
            <div class="px-5 py-3 border-b border-[#f0f2f5] dark:border-[#222d34]">
              <p class="text-[13px] font-semibold text-[#008069] dark:text-[#00a884] uppercase tracking-wide">Tecla Enter</p>
            </div>
            <div class="divide-y divide-[#f0f2f5] dark:divide-[#222d34]">
              <label class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-[#202c33] transition-colors">
                <div>
                  <p class="text-[14px] text-[#111b21] dark:text-[#e9edef] font-medium">Enviar mensajes</p>
                  <p class="text-[12px] text-[#8696a0] mt-0.5">Presiona Enter para enviar, Shift+Enter para nueva línea</p>
                </div>
                <input type="radio" :checked="enterSends" @change="enterSends = true"
                  class="w-4 h-4 text-[#00a884] border-[#d1d7db] focus:ring-[#00a884]" />
              </label>
              <label class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#f8f9fa] dark:hover:bg-[#202c33] transition-colors">
                <div>
                  <p class="text-[14px] text-[#111b21] dark:text-[#e9edef] font-medium">Nueva línea</p>
                  <p class="text-[12px] text-[#8696a0] mt-0.5">Presiona Enter para nueva línea, Ctrl+Enter para enviar</p>
                </div>
                <input type="radio" :checked="!enterSends" @change="enterSends = false"
                  class="w-4 h-4 text-[#00a884] border-[#d1d7db] focus:ring-[#00a884]" />
              </label>
            </div>
          </div>

        </template>

        <!-- ─ NOTIFICATIONS ──────────────────────────────────────── -->
        <template v-else-if="activeSection === 'notifications'">
          <div class="bg-white dark:bg-[#111b21] rounded-xl shadow-sm overflow-hidden">
            <div class="px-5 py-3 border-b border-[#f0f2f5] dark:border-[#222d34]">
              <p class="text-[13px] font-semibold text-[#008069] dark:text-[#00a884] uppercase tracking-wide">Notificaciones de escritorio</p>
            </div>
            <div class="divide-y divide-[#f0f2f5] dark:divide-[#222d34]">
              <!-- Desktop notifications toggle -->
              <div class="flex items-center justify-between px-5 py-4">
                <div>
                  <p class="text-[14px] text-[#111b21] dark:text-[#e9edef] font-medium">Notificaciones</p>
                  <p class="text-[12px] text-[#8696a0] mt-0.5">
                    {{ desktopNotifications ? 'Activadas' : 'Desactivadas — haz clic para activar' }}
                  </p>
                </div>
                <button
                  @click="toggleDesktopNotifications"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="desktopNotifications ? 'bg-[#00a884]' : 'bg-[#d1d7db] dark:bg-[#374045]'"
                >
                  <span
                    class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform"
                    :class="desktopNotifications ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
              <!-- Sounds toggle -->
              <div class="flex items-center justify-between px-5 py-4">
                <div>
                  <p class="text-[14px] text-[#111b21] dark:text-[#e9edef] font-medium">Sonidos</p>
                  <p class="text-[12px] text-[#8696a0] mt-0.5">Sonido al recibir nuevos mensajes</p>
                </div>
                <button
                  @click="notificationSounds = !notificationSounds"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="notificationSounds ? 'bg-[#00a884]' : 'bg-[#d1d7db] dark:bg-[#374045]'"
                >
                  <span
                    class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform"
                    :class="notificationSounds ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
              <!-- Message preview toggle -->
              <div class="flex items-center justify-between px-5 py-4">
                <div>
                  <p class="text-[14px] text-[#111b21] dark:text-[#e9edef] font-medium">Vista previa del mensaje</p>
                  <p class="text-[12px] text-[#8696a0] mt-0.5">Muestra el contenido del mensaje en la notificación</p>
                </div>
                <button
                  @click="messagePreviews = !messagePreviews"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="messagePreviews ? 'bg-[#00a884]' : 'bg-[#d1d7db] dark:bg-[#374045]'"
                >
                  <span
                    class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform"
                    :class="messagePreviews ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- ─ PRIVACY ─────────────────────────────────────────────── -->
        <template v-else-if="activeSection === 'privacy'">
          <div class="bg-white dark:bg-[#111b21] rounded-xl shadow-sm overflow-hidden">
            <div class="px-5 py-3 border-b border-[#f0f2f5] dark:border-[#222d34]">
              <p class="text-[13px] font-semibold text-[#008069] dark:text-[#00a884] uppercase tracking-wide">Privacidad</p>
            </div>
            <div class="divide-y divide-[#f0f2f5] dark:divide-[#222d34]">
              <div class="flex items-center justify-between px-5 py-4">
                <div>
                  <p class="text-[14px] text-[#111b21] dark:text-[#e9edef] font-medium">Confirmaciones de lectura</p>
                  <p class="text-[12px] text-[#8696a0] mt-0.5 max-w-[220px] leading-relaxed">
                    Si desactivas esto, no podrás ver las confirmaciones de lectura de otras personas.
                  </p>
                </div>
                <button
                  @click="readReceipts = !readReceipts"
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                  :class="readReceipts ? 'bg-[#00a884]' : 'bg-[#d1d7db] dark:bg-[#374045]'"
                >
                  <span
                    class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform"
                    :class="readReceipts ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- Security info card -->
          <div class="bg-white dark:bg-[#111b21] rounded-xl shadow-sm p-5 flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-[#e7f8f3] dark:bg-[#005c4b]/30 flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-[#00a884]" />
            </div>
            <div>
              <p class="text-[14px] font-medium text-[#111b21] dark:text-[#e9edef]">Cifrado de extremo a extremo</p>
              <p class="text-[13px] text-[#8696a0] mt-1 leading-relaxed">
                Tus mensajes y llamadas están protegidos con cifrado de extremo a extremo.
                Nadie fuera de este chat puede leer o escuchar tus mensajes o llamadas, ni siquiera WhatsApp.
              </p>
            </div>
          </div>
        </template>

        <!-- ─ HELP ───────────────────────────────────────────────── -->
        <template v-else-if="activeSection === 'help'">
          <div class="bg-white dark:bg-[#111b21] rounded-xl shadow-sm overflow-hidden">
            <div class="px-5 py-3 border-b border-[#f0f2f5] dark:border-[#222d34]">
              <p class="text-[13px] font-semibold text-[#008069] dark:text-[#00a884] uppercase tracking-wide">Ayuda</p>
            </div>
            <div class="divide-y divide-[#f0f2f5] dark:divide-[#222d34]">
              <a
                href="https://faq.whatsapp.com" target="_blank" rel="noopener"
                class="flex items-center justify-between px-5 py-4 hover:bg-[#f8f9fa] dark:hover:bg-[#202c33] transition-colors cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-help-circle" class="w-5 h-5 text-[#54656f] dark:text-[#8696a0] shrink-0" />
                  <span class="text-[14px] text-[#111b21] dark:text-[#e9edef]">Centro de ayuda</span>
                </div>
                <UIcon name="i-lucide-external-link" class="w-4 h-4 text-[#8696a0]" />
              </a>
              <div class="flex items-center justify-between px-5 py-4 hover:bg-[#f8f9fa] dark:hover:bg-[#202c33] transition-colors cursor-pointer">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-message-circle" class="w-5 h-5 text-[#54656f] dark:text-[#8696a0] shrink-0" />
                  <span class="text-[14px] text-[#111b21] dark:text-[#e9edef]">Contáctanos</span>
                </div>
                <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-[#8696a0]" />
              </div>
              <a
                href="https://www.whatsapp.com/legal/terms-of-service" target="_blank" rel="noopener"
                class="flex items-center justify-between px-5 py-4 hover:bg-[#f8f9fa] dark:hover:bg-[#202c33] transition-colors cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-file-text" class="w-5 h-5 text-[#54656f] dark:text-[#8696a0] shrink-0" />
                  <span class="text-[14px] text-[#111b21] dark:text-[#e9edef]">Términos y política de privacidad</span>
                </div>
                <UIcon name="i-lucide-external-link" class="w-4 h-4 text-[#8696a0]" />
              </a>
            </div>
          </div>

          <!-- App info -->
          <div class="bg-white dark:bg-[#111b21] rounded-xl shadow-sm px-5 py-4 space-y-3">
            <p class="text-[13px] font-semibold text-[#008069] dark:text-[#00a884] uppercase tracking-wide">Acerca de</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                <UIcon name="i-lucide-message-circle" class="w-5 h-5 text-white" />
              </div>
              <div>
                <p class="text-[14px] font-semibold text-[#111b21] dark:text-[#e9edef]">Solsumed WhatsApp Web</p>
                <p class="text-[12px] text-[#8696a0]">Versión 1.0.0</p>
              </div>
            </div>
            <p class="text-[12px] text-[#8696a0] leading-relaxed">
              Plataforma de mensajería integrada con WhatsApp para la gestión de comunicaciones de Solsumed.
            </p>
          </div>
        </template>

      </div>
    </div>

    <!-- ══ LOGOUT CONFIRMATION DIALOG ════════════════════════════════ -->
    <Teleport to="body">
      <div
        v-if="showLogoutConfirm"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        @click.self="showLogoutConfirm = false"
      >
        <div class="wa-font bg-white dark:bg-[#233138] rounded-xl shadow-2xl w-[380px] mx-4 overflow-hidden">
          <div class="px-6 pt-6 pb-2">
            <h3 class="text-[17px] font-medium text-[#111b21] dark:text-[#e9edef] mb-2">Cerrar sesión</h3>
            <p class="text-[14px] text-[#667781] dark:text-[#8696a0] leading-relaxed">
              ¿Seguro que quieres cerrar sesión? Tendrás que iniciar sesión nuevamente para acceder a tus chats.
            </p>
          </div>
          <div class="flex items-center justify-end gap-2 px-6 py-4">
            <button
              @click="showLogoutConfirm = false"
              class="px-5 py-2 text-[14px] text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942] rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              @click="emit('logout')"
              class="px-5 py-2 text-[14px] text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
