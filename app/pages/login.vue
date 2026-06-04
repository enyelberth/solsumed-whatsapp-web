<script setup lang="ts">
import type { LoginCredentials } from '~/types/auth'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function handleLogin(credentials: LoginCredentials) {
  loading.value = true
  errorMessage.value = null
  try {
    await auth.login(credentials)
    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirect)
  }
  catch (err: unknown) {
    const e = err as { data?: { message?: string }, message?: string }
    errorMessage.value = e?.data?.message || e?.message || 'Error al iniciar sesión'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UCard class="w-full max-w-sm">
    <template #header>
      <div class="text-center">
        <h1 class="text-xl font-bold text-emerald-600">
          Solsumed WhatsApp
        </h1>
        <p class="text-sm text-slate-500">
          Inicia sesión para continuar
        </p>
      </div>
    </template>

    <AuthLoginForm
      :loading="loading"
      :error-message="errorMessage"
      @submit="handleLogin"
    />
  </UCard>
</template>
