<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  qr: string | null
  loading: boolean
  error: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

const qrImageUrl = computed(() => {
  if (!props.qr) return null
  if (props.qr.startsWith('data:image/') || props.qr.startsWith('http')) {
    return props.qr
  }
  // Fallback using public API if it's a raw token string
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(props.qr)}&size=264x264`
})
</script>

<template>
  <div class="min-h-screen bg-[#f0f2f5] dark:bg-[#0c1317] flex flex-col relative overflow-hidden font-sans">
    <!-- Top Green Bar -->
    <div class="h-56 bg-[#00a884] dark:bg-[#00a884]/80 absolute top-0 left-0 w-full z-0" />

    <!-- Main Card Container -->
    <div class="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 mt-12 md:mt-0">
      <div class="bg-white dark:bg-[#222e35] max-w-4xl w-full rounded shadow-xl flex flex-col md:flex-row p-8 sm:p-14 gap-12 text-[#111b21] dark:text-[#e9edef]">
        
        <!-- Left Side: Instructions -->
        <div class="flex-1 space-y-8">
          <div>
            <h1 class="text-3xl font-light text-[#41525d] dark:text-[#aebac1]">
              Para usar WhatsApp en tu computadora
            </h1>
          </div>
          
          <ol class="space-y-6 text-[18px] leading-relaxed text-[#3b4a54] dark:text-[#8696a0] list-decimal pl-6">
            <li>
              Abre <span class="font-medium text-[#111b21] dark:text-[#e9edef]">WhatsApp</span> en tu teléfono.
            </li>
            <li>
              Toca el menú <span class="font-medium text-[#111b21] dark:text-[#e9edef]">Menú</span> <span class="inline-block px-1 bg-slate-100 dark:bg-slate-700 rounded text-sm border font-mono">⋮</span> o <span class="font-medium text-[#111b21] dark:text-[#e9edef]">Configuración</span> <span class="inline-block px-1 bg-slate-100 dark:bg-slate-700 rounded text-sm border font-mono">⚙️</span> y selecciona <span class="font-medium text-[#111b21] dark:text-[#e9edef]">Dispositivos vinculados</span>.
            </li>
            <li>
              Toca <span class="font-medium text-[#111b21] dark:text-[#e9edef]">Vincular un dispositivo</span>.
            </li>
            <li>
              Apunta tu teléfono hacia esta pantalla para escanear el código QR.
            </li>
          </ol>

          <div class="pt-6 border-t border-[#e9edef] dark:border-[#222d34]">
            <a href="#" class="text-[#008069] dark:text-[#00a884] font-medium hover:underline text-sm flex items-center gap-2">
              <UIcon name="i-lucide-help-circle" class="w-4 h-4" />
              ¿Necesitas ayuda para comenzar?
            </a>
          </div>
        </div>

        <!-- Right Side: QR Code Area -->
        <div class="flex flex-col items-center justify-center min-w-[280px]">
          <div class="relative w-64 h-64 bg-white p-4 rounded shadow-inner border border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <!-- Spinner / Loading State -->
            <div v-if="loading" class="flex flex-col items-center justify-center gap-2 text-slate-500">
              <UIcon name="i-lucide-refresh-cw" class="w-10 h-10 animate-spin text-[#00a884]" />
              <span class="text-xs">Generando código QR...</span>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="flex flex-col items-center text-center p-3 text-red-500 gap-2">
              <UIcon name="i-lucide-alert-triangle" class="w-8 h-8" />
              <span class="text-xs font-semibold">Error al cargar QR</span>
              <p class="text-[11px] text-slate-400">{{ error }}</p>
              <UButton size="xs" color="error" variant="soft" @click="emit('refresh')">Reintentar</UButton>
            </div>

            <!-- QR Expired or Null State -->
            <div v-else-if="!qrImageUrl" class="flex flex-col items-center text-center p-4 text-slate-400 gap-2">
              <UIcon name="i-lucide-qr-code" class="w-12 h-12 text-slate-300" />
              <span class="text-xs">Sin código activo</span>
              <UButton size="xs" color="success" variant="soft" @click="emit('refresh')">Obtener QR</UButton>
            </div>

            <!-- Display QR -->
            <div v-else class="relative w-full h-full flex items-center justify-center">
              <img :src="qrImageUrl" alt="WhatsApp QR Code" class="w-full h-full object-contain" />
              
              <!-- Subtle instructions logo overlay -->
              <div class="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                <div class="w-12 h-12 bg-white rounded-full shadow border flex items-center justify-center">
                  <UIcon name="i-lucide-message-circle" class="w-8 h-8 text-[#00a884]" />
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom controls -->
          <div class="mt-4 flex flex-col items-center gap-2 w-full">
            <div class="flex items-center gap-2 text-xs text-[#667781] dark:text-[#8696a0]">
              <input type="checkbox" id="keep-login" checked class="rounded border-slate-300 text-[#00a884] focus:ring-[#00a884]" />
              <label for="keep-login">Mantener sesión activa</label>
            </div>

            <UButton
              v-if="!loading"
              icon="i-lucide-refresh-cw"
              size="sm"
              variant="ghost"
              color="neutral"
              class="mt-2 text-xs text-[#008069] dark:text-[#00a884] hover:bg-slate-100 dark:hover:bg-slate-800"
              @click="emit('refresh')"
            >
              Actualizar código QR
            </UButton>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
