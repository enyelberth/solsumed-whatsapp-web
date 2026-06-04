import type { WhatsAppMessage, WhatsAppSendResult, WhatsAppStatus } from '~/types/whatsapp'

export const whatsappService = {
  async getStatus(): Promise<WhatsAppStatus> {
    const api = useWhatsappApi()
    return api<WhatsAppStatus>('/status')
  },

  async sendMessage(payload: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const api = useWhatsappApi()
    return api<WhatsAppSendResult>('/messages', {
      method: 'POST',
      body: payload,
    })
  },

  async getQrCode(): Promise<{ qr: string | null }> {
    const api = useWhatsappApi()
    return api<{ qr: string | null }>('/qr')
  },
}
