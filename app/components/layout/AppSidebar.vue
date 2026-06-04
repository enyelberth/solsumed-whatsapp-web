<script setup lang="ts">
interface NavItem {
  label: string
  icon: string
  to: string
}

defineProps<{ items: NavItem[] }>()
</script>

<template>
  <aside class="w-60 shrink-0 border-r bg-white dark:bg-slate-800 flex flex-col">
    <div class="h-14 flex items-center justify-center border-b font-bold text-emerald-600">
      Solsumed
    </div>
    <nav class="flex-1 p-3 space-y-1">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        active-class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium"
      >
        <UIcon :name="item.icon" class="w-4 h-4" />
        {{ item.label }}
      </NuxtLink>
    </nav>
  </aside>
</template>
