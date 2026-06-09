<script setup lang="ts">
interface NavItem {
  label: string
  icon: string
  to: string
}

defineProps<{ items: NavItem[] }>()
</script>

<template>
  <aside class="w-64 shrink-0 bg-slate-950 border-r border-slate-900 flex flex-col z-20 text-slate-300">
    <!-- Logotipo Corporativo Superior -->
    <div class="h-16 flex items-center px-6 border-b border-slate-900 gap-3">
      <div class="flex items-center justify-center p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 10.5V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9.5M12 4v16m8-8H4" />
        </svg>
      </div>
      <div>
        <span class="font-black tracking-wider text-sm text-white uppercase block leading-none">
          SOLSUMED
        </span>
      </div>
    </div>

    <!-- Menú de Navegación -->
    <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto wa-scrollbar">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-slate-400 hover:text-white hover:bg-slate-900/60 transition-all duration-200 group"
        active-class="bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold shadow-md shadow-teal-600/15"
      >
        <UIcon 
          :name="item.icon" 
          class="w-5 h-5 shrink-0 block transition-transform group-hover:scale-110" 
        />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Footer de Sidebar -->
    <div class="p-4 border-t border-slate-900 text-[10px] text-slate-500 text-center font-light">
      © 2026 Grupo Solsumed
    </div>
  </aside>
</template>

