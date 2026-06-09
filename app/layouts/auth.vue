<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8 relative overflow-hidden wa-font selection:bg-teal-500 selection:text-white">
    <!-- Fondo decorativo con círculos difuminados de color corporativo -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
    
    <div class="w-full max-w-5xl z-10">
      <slot />
    </div>
  </div>
</template>
