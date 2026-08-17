<script setup lang="ts">
// Keyboard shortcuts modal — identical to WhatsApp Web
const emit = defineEmits<{ close: [] }>()

const shortcuts = [
  {
    category: 'Chats',
    items: [
      { keys: ['Ctrl', 'N'], description: 'Nuevo chat' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'Nuevo grupo' },
      { keys: ['Ctrl', 'Shift', ']'], description: 'Chat siguiente' },
      { keys: ['Ctrl', 'Shift', '['], description: 'Chat anterior' },
      { keys: ['Ctrl', 'E'], description: 'Archivar chat' },
      { keys: ['Ctrl', 'Shift', 'M'], description: 'Silenciar / Activar chat' },
      { keys: ['Ctrl', 'Backspace'], description: 'Eliminar chat' },
      { keys: ['Ctrl', 'Shift', 'U'], description: 'Marcar como no leído' },
    ],
  },
  {
    category: 'Búsqueda',
    items: [
      { keys: ['Ctrl', 'Shift', 'F'], description: 'Buscar en todos los chats' },
      { keys: ['Ctrl', 'F'], description: 'Buscar en el chat actual' },
    ],
  },
  {
    category: 'Mensajes',
    items: [
      { keys: ['Enter'], description: 'Enviar mensaje' },
      { keys: ['Shift', 'Enter'], description: 'Nueva línea' },
      { keys: ['Ctrl', 'Z'], description: 'Deshacer' },
      { keys: ['Ctrl', 'B'], description: 'Negrita' },
      { keys: ['Ctrl', 'I'], description: 'Cursiva' },
      { keys: ['Ctrl', 'S'], description: 'Tachado' },
    ],
  },
  {
    category: 'Navegación',
    items: [
      { keys: ['Ctrl', 'P'], description: 'Ver perfil' },
      { keys: ['Ctrl', ','], description: 'Configuración' },
      { keys: ['Alt', 'Tab'], description: 'Siguiente elemento' },
      { keys: ['Esc'], description: 'Cerrar panel / modal' },
    ],
  },
]
</script>

<template>
  <!-- Full-screen overlay — same as WhatsApp Web keyboard shortcuts dialog -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      @click.self="emit('close')"
    >
      <div class="wa-font bg-white dark:bg-[#233138] rounded-xl shadow-2xl w-[580px] max-w-[95vw] max-h-[85vh] flex flex-col overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-7 py-5 border-b border-[#e9edef] dark:border-[#222d34] shrink-0">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-keyboard" class="w-5 h-5 text-[#54656f] dark:text-[#8696a0]" />
            <h2 class="text-[17px] font-medium text-[#111b21] dark:text-[#e9edef]">Atajos de teclado</h2>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-full text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942] transition-colors"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Shortcuts list -->
        <div class="overflow-y-auto wa-scrollbar py-4 px-7">
          <div v-for="section in shortcuts" :key="section.category" class="mb-6">
            <h3 class="text-[12px] font-semibold text-[#008069] dark:text-[#00a884] uppercase tracking-widest mb-3">
              {{ section.category }}
            </h3>
            <div class="space-y-1">
              <div
                v-for="item in section.items"
                :key="item.description"
                class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors group"
              >
                <span class="text-[14px] text-[#3b4a54] dark:text-[#e9edef]">{{ item.description }}</span>
                <div class="flex items-center gap-1.5">
                  <template v-for="(key, i) in item.keys" :key="key">
                    <span
                      class="inline-flex items-center justify-center min-w-[28px] h-[22px] px-1.5 rounded text-[11px] font-mono font-semibold text-[#3b4a54] dark:text-[#e9edef] bg-[#f0f2f5] dark:bg-[#374045] border border-[#d1d7db] dark:border-[#4a5568] shadow-[0_1px_0_rgba(0,0,0,0.15)]"
                    >
                      {{ key }}
                    </span>
                    <span v-if="i < item.keys.length - 1" class="text-[11px] text-[#8696a0]">+</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>
