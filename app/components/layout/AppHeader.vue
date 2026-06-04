<script setup lang="ts">
import type { User } from '~/types/auth'

defineProps<{ user: User | null }>()
const emit = defineEmits<{ logout: [] }>()
const config = useRuntimeConfig()
</script>

<template>
  <header class="h-14 border-b bg-white dark:bg-slate-800 flex items-center justify-between px-6">
    <div class="font-semibold text-slate-700 dark:text-slate-100">
      {{ config.public.appName }}
    </div>
    <div class="flex items-center gap-3">
      <span v-if="user" class="text-sm text-slate-500 dark:text-slate-300">
        {{ user.name ?? user.email }}
      </span>
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-log-out"
        size="sm"
        @click="emit('logout')"
      >
        Salir
      </UButton>
    </div>
  </header>
</template>
