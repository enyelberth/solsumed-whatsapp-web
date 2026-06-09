<script setup lang="ts">
import type { User } from '~/types/auth'

const props = defineProps<{ user: User | null }>()
const emit = defineEmits<{ logout: [] }>()
const config = useRuntimeConfig()

const userInitial = computed(() => {
  if (!props.user) return 'U'
  const name = props.user.name || props.user.email
  return name.charAt(0).toUpperCase()
})
</script>

<template>
  <header class="h-16 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-between px-6 select-none z-10 transition-colors">
    <!-- Título / Nombre de Aplicación -->
    <div class="font-bold text-slate-800 dark:text-white text-sm tracking-tight flex items-center gap-2">
      <span class="w-1.5 h-3 bg-teal-500 rounded-full"></span>
      <span>{{ config.public.appName }}</span>
    </div>

    <!-- Acciones / Información del Usuario -->
    <div class="flex items-center gap-4">
      <!-- Perfil del usuario -->
      <div v-if="user" class="flex items-center gap-2.5">
        <div class="flex flex-col text-right">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
            {{ user.name || 'Usuario' }}
          </span>
          <span class="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {{ user.email }}
          </span>
        </div>
        
        <!-- Avatar circular con inicial -->
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-xs font-bold shadow-sm select-none">
          {{ userInitial }}
        </div>
      </div>

      <!-- Botón de Cerrar Sesión -->
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 cursor-pointer font-semibold"
        @click="emit('logout')"
        aria-label="Cerrar sesión"
      >
        <UIcon name="i-lucide-log-out" class="w-4 h-4 shrink-0 block" />
        <span class="hidden sm:inline">Salir</span>
      </button>
    </div>
  </header>
</template>

