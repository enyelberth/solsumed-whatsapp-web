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

function onSubmit() {
  emit('submit', { ...form })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <div>
      <label class="block text-sm font-medium mb-1">Correo</label>
      <UInput
        v-model="form.email"
        type="email"
        placeholder="usuario@solsumed.com"
        autocomplete="email"
        required
        class="w-full"
      />
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Contraseña</label>
      <UInput
        v-model="form.password"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
        required
        class="w-full"
      />
    </div>
    <p v-if="errorMessage" class="text-sm text-red-600">
      {{ errorMessage }}
    </p>
    <UButton
      type="submit"
      block
      color="primary"
      :loading="loading"
    >
      Entrar
    </UButton>
  </form>
</template>
