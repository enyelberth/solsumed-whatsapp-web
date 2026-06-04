import { defineStore } from 'pinia'
import type { WhatsAppMessage, WhatsAppSendResult, WhatsAppStatus } from '~/types/whatsapp'

interface WhatsAppState {
  status: WhatsAppStatus | null
  loadingStatus: boolean
  statusError: string | null
  sending: boolean
  sendError: string | null
  lastResult: WhatsAppSendResult | null
}

export const useWhatsappStore = defineStore('whatsapp', {
  state: (): WhatsAppState => ({
    status: null,
    loadingStatus: false,
    statusError: null,
    sending: false,
    sendError: null,
    lastResult: null,
  }),

  getters: {
    isConnected: (state): boolean => !!state.status?.connected,
  },

  actions: {
    async refreshStatus() {
      this.loadingStatus = true
      this.statusError = null
      try {
        this.status = await whatsappService.getStatus()
      }
      catch (err: unknown) {
        const e = err as { message?: string }
        this.statusError = e.message ?? 'No se pudo obtener el estado'
      }
      finally {
        this.loadingStatus = false
      }
    },

    async send(payload: WhatsAppMessage): Promise<WhatsAppSendResult | null> {
      this.sending = true
      this.sendError = null
      this.lastResult = null
      try {
        const res = await whatsappService.sendMessage(payload)
        this.lastResult = res
        return res
      }
      catch (err: unknown) {
        const e = err as { message?: string }
        this.sendError = e.message ?? 'Error al enviar'
        return null
      }
      finally {
        this.sending = false
      }
    },
  },
})
