<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  userEmail: string
  phoneNumber?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: []; logout: [] }>()

// ── Logout confirmation ──────────────────────────────────────────
const showLogoutConfirm = ref(false)

// ── Profile state (persisted locally in this session) ──────────────
const profileName = ref(props.userEmail.split('@')[0] ?? 'Usuario')
const profileAbout = ref('Disponible')
const profilePhoto = ref<string | null>(null)

// ── Edit modes ─────────────────────────────────────────────────────
const editingName = ref(false)
const editingAbout = ref(false)
const nameInput = ref('')
const aboutInput = ref('')

const nameInputRef = ref<HTMLInputElement | null>(null)
const aboutInputRef = ref<HTMLInputElement | null>(null)

const aboutOptions = [
  'Disponible',
  'En el trabajo',
  'Solo emergencias',
  'Durmiendo',
  'En reuniones',
  '¡Hey! Estoy usando WhatsApp',
]

function startEditName() {
  nameInput.value = profileName.value
  editingName.value = true
  nextTick(() => nameInputRef.value?.focus())
}
function saveName() {
  const v = nameInput.value.trim()
  if (v.length >= 1 && v.length <= 25) profileName.value = v
  editingName.value = false
}
function cancelName() {
  editingName.value = false
}

function startEditAbout() {
  aboutInput.value = profileAbout.value
  editingAbout.value = true
  nextTick(() => aboutInputRef.value?.focus())
}
function saveAbout() {
  const v = aboutInput.value.trim()
  if (v.length <= 139) profileAbout.value = v
  editingAbout.value = false
}
function cancelAbout() {
  editingAbout.value = false
}

// ── Photo upload ────────────────────────────────────────────────────
const photoInputRef = ref<HTMLInputElement | null>(null)

function triggerPhotoUpload() {
  photoInputRef.value?.click()
}

function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    profilePhoto.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// ── Initials fallback ───────────────────────────────────────────────
const initials = computed(() =>
  profileName.value
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
)

const nameCharCount = computed(() => nameInput.value.length)
const aboutCharCount = computed(() => aboutInput.value.length)
</script>

<template>
  <!-- Full-height slide-in profile panel — identical to WhatsApp Web -->
  <div class="wa-font absolute inset-0 z-40 flex flex-col bg-[#ffffff] dark:bg-[#111b21]">

    <!-- ══ HEADER (114px tall — matching WhatsApp Web profile header) -->
    <div class="h-[114px] bg-[#008069] dark:bg-[#202c33] flex flex-col justify-end px-5 pb-5 shrink-0">
      <div class="flex items-center gap-6">
        <button
          @click="emit('close')"
          class="text-white hover:bg-white/10 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
        >
          <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
        </button>
        <span class="text-white text-[19px] font-medium tracking-wide">Perfil</span>
      </div>
    </div>

    <!-- ══ SCROLLABLE BODY ═══════════════════════════════════════════ -->
    <div class="flex-1 overflow-y-auto wa-scrollbar bg-[#f8f9fa] dark:bg-[#0b141a]">

      <!-- ── Profile Photo Section ───────────────────────────────── -->
      <div class="bg-white dark:bg-[#111b21] pb-6 flex flex-col items-center pt-8 gap-4">

        <!-- Photo container with camera overlay -->
        <div class="relative group cursor-pointer" @click="triggerPhotoUpload">
          <!-- Avatar / Photo -->
          <div class="w-[200px] h-[200px] rounded-full overflow-hidden shadow-lg">
            <img
              v-if="profilePhoto"
              :src="profilePhoto"
              alt="Foto de perfil"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full bg-[#dfe5e7] dark:bg-[#374045] flex items-center justify-center text-[#8696a0] text-[64px] font-semibold select-none"
            >
              {{ initials }}
            </div>
          </div>

          <!-- Camera overlay on hover -->
          <div class="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
            <UIcon name="i-lucide-camera" class="w-8 h-8 text-white" />
            <span class="text-white text-[11px] font-medium uppercase tracking-widest text-center px-4 leading-tight">
              Cambiar<br>foto de perfil
            </span>
          </div>
        </div>

        <!-- Hidden file input -->
        <input
          ref="photoInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onPhotoSelected"
        />

        <!-- Photo action buttons -->
        <div class="flex items-center gap-3">
          <button
            @click="triggerPhotoUpload"
            class="flex items-center gap-2 text-[13px] text-[#008069] dark:text-[#00a884] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942] px-3 py-1.5 rounded-full transition-colors font-medium"
          >
            <UIcon name="i-lucide-camera" class="w-4 h-4" />
            Cambiar foto
          </button>
          <button
            v-if="profilePhoto"
            @click="profilePhoto = null"
            class="flex items-center gap-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-full transition-colors font-medium"
          >
            <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>

      <!-- Spacer -->
      <div class="h-2 bg-[#f0f2f5] dark:bg-[#0b141a]" />

      <!-- ── Name Section ─────────────────────────────────────────── -->
      <div class="bg-white dark:bg-[#111b21] px-5 py-4">
        <p class="text-[13px] text-[#008069] dark:text-[#00a884] font-medium mb-3">Tu nombre</p>

        <!-- View mode -->
        <div v-if="!editingName" class="flex items-center justify-between group">
          <span class="text-[17px] text-[#111b21] dark:text-[#e9edef] flex-1">
            {{ profileName }}
          </span>
          <button
            @click="startEditName"
            class="w-9 h-9 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942] transition-colors opacity-0 group-hover:opacity-100"
          >
            <UIcon name="i-lucide-pencil" class="w-4 h-4" />
          </button>
        </div>

        <!-- Edit mode -->
        <div v-else>
          <input
            ref="nameInputRef"
            v-model="nameInput"
            type="text"
            maxlength="25"
            @keydown.enter="saveName"
            @keydown.escape="cancelName"
            class="w-full text-[17px] text-[#111b21] dark:text-[#e9edef] bg-transparent border-b-2 border-[#00a884] outline-none py-1 pb-2"
          />
          <div class="flex items-center justify-between mt-3">
            <span class="text-[12px]" :class="nameCharCount > 20 ? 'text-red-500' : 'text-[#8696a0]'">
              {{ nameCharCount }} / 25
            </span>
            <div class="flex items-center gap-3">
              <button @click="cancelName" class="text-[#8696a0] hover:text-[#54656f] transition-colors">
                <UIcon name="i-lucide-x" class="w-5 h-5" />
              </button>
              <button
                @click="saveName"
                :disabled="nameInput.trim().length === 0"
                class="text-[#00a884] hover:text-[#008069] disabled:opacity-40 transition-colors"
              >
                <UIcon name="i-lucide-check" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Helper text -->
        <p class="text-[13px] text-[#8696a0] mt-3 leading-relaxed">
          Este es tu nombre de perfil. Tus contactos lo verán si no tienes guardado tu número en su agenda.
        </p>
      </div>

      <!-- Spacer -->
      <div class="h-2 bg-[#f0f2f5] dark:bg-[#0b141a]" />

      <!-- ── About / Status Section ───────────────────────────────── -->
      <div class="bg-white dark:bg-[#111b21] px-5 py-4">
        <p class="text-[13px] text-[#008069] dark:text-[#00a884] font-medium mb-3">Info.</p>

        <!-- View mode -->
        <div v-if="!editingAbout" class="flex items-center justify-between group">
          <span class="text-[17px] text-[#111b21] dark:text-[#e9edef] flex-1">
            {{ profileAbout }}
          </span>
          <button
            @click="startEditAbout"
            class="w-9 h-9 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942] transition-colors opacity-0 group-hover:opacity-100"
          >
            <UIcon name="i-lucide-pencil" class="w-4 h-4" />
          </button>
        </div>

        <!-- Edit mode -->
        <div v-else class="space-y-3">
          <textarea
            ref="aboutInputRef"
            v-model="aboutInput"
            maxlength="139"
            rows="3"
            @keydown.escape="cancelAbout"
            class="w-full text-[16px] text-[#111b21] dark:text-[#e9edef] bg-transparent border-b-2 border-[#00a884] outline-none py-1 resize-none"
          />
          <div class="flex items-center justify-between">
            <span class="text-[12px]" :class="aboutCharCount > 120 ? 'text-red-500' : 'text-[#8696a0]'">
              {{ aboutCharCount }} / 139
            </span>
            <div class="flex gap-3">
              <button @click="cancelAbout" class="text-[#8696a0] hover:text-[#54656f]">
                <UIcon name="i-lucide-x" class="w-5 h-5" />
              </button>
              <button @click="saveAbout" class="text-[#00a884] hover:text-[#008069]">
                <UIcon name="i-lucide-check" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Quick-pick options -->
          <p class="text-[12px] text-[#8696a0] mt-2 mb-1">Opciones rápidas</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in aboutOptions"
              :key="opt"
              @click="aboutInput = opt"
              class="text-[12px] text-[#008069] dark:text-[#00a884] border border-[#00a884]/40 px-2.5 py-1 rounded-full hover:bg-[#e7f8f3] dark:hover:bg-[#005c4b]/30 transition-colors"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <!-- Spacer -->
      <div class="h-2 bg-[#f0f2f5] dark:bg-[#0b141a]" />

      <!-- ── Phone number (read-only) ────────────────────────────── -->
      <div class="bg-white dark:bg-[#111b21] px-5 py-4">
        <p class="text-[13px] text-[#008069] dark:text-[#00a884] font-medium mb-3">Teléfono</p>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-phone" class="w-5 h-5 text-[#54656f] dark:text-[#8696a0] shrink-0" />
          <span class="text-[17px] text-[#111b21] dark:text-[#e9edef]">
            {{ phoneNumber ? `+${phoneNumber}` : 'No vinculado' }}
          </span>
        </div>
      </div>

      <!-- Spacer -->
      <div class="h-2 bg-[#f0f2f5] dark:bg-[#0b141a]" />

      <!-- ── Logout button ─────────────────────────────────────────── -->
      <div class="bg-white dark:bg-[#111b21] px-5 py-2">
        <button
          @click="showLogoutConfirm = true"
          class="w-full flex items-center gap-4 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl px-3 transition-colors group"
        >
          <div class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-log-out" class="w-4 h-4 text-red-500" />
          </div>
          <span class="text-[15px] font-medium">Cerrar sesión</span>
        </button>
      </div>

      <!-- Bottom safe area -->
      <div class="h-6" />
    </div>

    <!-- ══ LOGOUT CONFIRMATION DIALOG ═══════════════════════════════════ -->
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
