<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { WhatsAppMessage } from '~/types/whatsapp'

const wa = useWhatsappStore()
const { status, loadingStatus, statusError, sending, sendError, lastResult } = storeToRefs(wa)

const form = reactive<WhatsAppMessage>({ to: '', body: '' })

async function send() {
  const res = await wa.send({ ...form })
  if (res) form.body = ''
}

onMounted(() => wa.refreshStatus())
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          WhatsApp
        </h1>
        <p class="text-slate-500">
          Estado de la conexión y envío de mensajes.
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="ghost"
        :loading="loadingStatus"
        @click="wa.refreshStatus()"
      >
        Actualizar
      </UButton>
    </header>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Estado
        </h2>
      </template>
      <div v-if="statusError" class="text-sm text-red-600">
        {{ statusError }}
      </div>
      <div v-else-if="status" class="space-y-1 text-sm">
        <div>
          Conectado:
          <span :class="status.connected ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'">
            {{ status.connected ? 'Sí' : 'No' }}
          </span>
        </div>
        <div v-if="status.phoneNumber">
          Número: <span class="font-mono">{{ status.phoneNumber }}</span>
        </div>
        <div v-if="status.state">
          Estado interno: <span class="font-mono">{{ status.state }}</span>
        </div>
      </div>
      <div v-else class="text-sm text-slate-500">
        Cargando...
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Enviar mensaje
        </h2>
      </template>
      <form class="space-y-3" @submit.prevent="send">
        <div>
          <label class="block text-sm font-medium mb-1">Destinatario</label>
          <UInput
            v-model="form.to"
            placeholder="58414XXXXXXX"
            required
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Mensaje</label>
          <UTextarea
            v-model="form.body"
            placeholder="Escribe el mensaje..."
            required
            :rows="4"
            class="w-full"
          />
        </div>
        <p v-if="lastResult" class="text-sm text-emerald-600">
          Mensaje {{ lastResult.status }}{{ lastResult.id ? ` (id ${lastResult.id})` : '' }}
        </p>
        <p v-if="sendError" class="text-sm text-red-600">
          {{ sendError }}
        </p>
        <UButton
          type="submit"
          color="primary"
          :loading="sending"
          icon="i-lucide-send"
        >
          Enviar
        </UButton>
      </form>
    </UCard>
  </div>
</template>
