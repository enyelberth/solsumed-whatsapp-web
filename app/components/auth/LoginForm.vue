<script setup lang="ts">
import type { LoginCredentials } from '~/types/auth'

const emit = defineEmits<{
  submit: [credentials: LoginCredentials]
}>()
defineProps<{ loading?: boolean, errorMessage?: string | null }>()

const form = reactive<LoginCredentials>({
  email: '',
  password: '',
})

const rememberMe = ref(false)
const showPassword = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}

function onSubmit() {
  emit('submit', { ...form })
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <!-- Campo Usuario/Cliente -->
    <div class="space-y-2">
      <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-left">
        Usuario / Cliente
      </label>
      <div class="relative group">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm0 0v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-9 9m4.5-1.206a8.959 8.959 0 0 1-4.5 1.206" />
          </svg>
        </div>
        <input
          v-model="form.email"
          type="email"
          placeholder="usuario@solsumed.com"
          autocomplete="email"
          required
          class="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500"
        />
      </div>
    </div>

    <!-- Campo Contraseña -->
    <div class="space-y-2">
      <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-left">
        Contraseña
      </label>
      <div class="relative group">
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <input
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          autocomplete="current-password"
          required
          class="block w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500"
        />
        <!-- Botón para ver/ocultar contraseña -->
        <button
          type="button"
          class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          @click="togglePassword"
        >
          <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Controles de Recuérdame y Recuperar Contraseña -->
    <div class="flex items-center justify-between text-sm">
      <label class="flex items-center space-x-2.5 text-slate-600 dark:text-slate-400 select-none cursor-pointer">
        <input
          v-model="rememberMe"
          type="checkbox"
          class="rounded-md border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500/20 w-4.5 h-4.5 transition-colors cursor-pointer accent-teal-600"
        />
        <span>Recuérdame</span>
      </label>
      <a
        href="#"
        class="text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 hover:underline transition-colors font-medium"
        @click.prevent
      >
        ¿Olvidaste tu contraseña?
      </a>
    </div>

    <!-- Mensaje de Error -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-[-10px]"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div v-if="errorMessage" class="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start space-x-2.5">
        <svg class="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p class="text-xs text-red-600 dark:text-red-400 leading-normal text-left">
          {{ errorMessage }}
        </p>
      </div>
    </transition>

    <!-- Botón de Envío -->
    <button
      type="submit"
      :disabled="loading"
      class="w-full flex items-center justify-center py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-600/60 text-white font-semibold rounded-2xl shadow-lg shadow-teal-600/10 hover:shadow-teal-600/20 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all cursor-pointer text-center relative overflow-hidden"
    >
      <!-- Animación de carga -->
      <svg
        v-if="loading"
        class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm tracking-wide">{{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}</span>
    </button>
  </form>
</template>

