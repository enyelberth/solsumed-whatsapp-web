<script setup lang="ts">
import { storeToRefs } from 'pinia'

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const stats = computed(() => [
  { label: 'Estado', value: 'Activo', icon: 'i-lucide-activity', color: 'text-emerald-600' },
  { label: 'Sesión', value: user.value?.email ?? '—', icon: 'i-lucide-user', color: 'text-blue-600' },
  { label: 'Rol', value: user.value?.role ?? 'usuario', icon: 'i-lucide-shield', color: 'text-amber-600' },
])
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Dashboard
      </h1>
      <p class="text-slate-500">
        Resumen de tu cuenta Solsumed.
      </p>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard v-for="s in stats" :key="s.label">
        <div class="flex items-center gap-3">
          <UIcon :name="s.icon" :class="['w-8 h-8', s.color]" />
          <div>
            <div class="text-xs uppercase text-slate-500">
              {{ s.label }}
            </div>
            <div class="font-semibold text-slate-800 dark:text-slate-100">
              {{ s.value }}
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Próximos pasos
        </h2>
      </template>
      <ul class="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5">
        <li>Conecta la sesión de WhatsApp desde la página WhatsApp.</li>
        <li>Agrega lógica de dominio dentro de <code>app/stores/&lt;feature&gt;.ts</code>.</li>
        <li>Llama servicios desde los stores; los componentes solo consumen estado.</li>
      </ul>
    </UCard>
  </div>
</template>
