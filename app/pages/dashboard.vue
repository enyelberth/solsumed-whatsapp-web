<script setup lang="ts">
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const stats = computed(() => [
  { 
    label: 'Estado de Conexión', 
    value: 'Activo', 
    icon: 'i-lucide-activity', 
    bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    desc: 'Sesión activa con el servidor'
  },
  { 
    label: 'Usuario Actual', 
    value: user.value?.email ?? '—', 
    icon: 'i-lucide-user', 
    bg: 'bg-teal-50/60 dark:bg-teal-950/20',
    border: 'border-teal-100 dark:border-teal-900/30',
    text: 'text-teal-700 dark:text-teal-400',
    desc: 'Correo de la sesión activa'
  },
  { 
    label: 'Rol de Cuenta', 
    value: user.value?.role ?? 'usuario', 
    icon: 'i-lucide-shield', 
    bg: 'bg-blue-50/60 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    desc: 'Nivel de permisos asignado'
  },
])
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto">
    <!-- Header con Saludo Personalizado -->
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          ¡Hola, {{ user?.name || 'Usuario' }}!
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bienvenido al centro de administración de Solsumed WhatsApp.
        </p>
      </div>
      <div class="flex items-center space-x-2 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full w-fit">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Servicios en línea</span>
      </div>
    </header>

    <!-- Tarjetas de Estadísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div 
        v-for="s in stats" 
        :key="s.label" 
        :class="[
          'p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300',
          s.border
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {{ s.label }}
            </span>
            <span class="text-xl font-bold text-slate-950 dark:text-white block truncate">
              {{ s.value }}
            </span>
          </div>
          <div :class="['p-3 rounded-xl', s.bg, s.text]">
            <UIcon :name="s.icon" class="w-6 h-6 block" />
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <UIcon name="i-lucide-info" class="w-3.5 h-3.5" />
          <span>{{ s.desc }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

