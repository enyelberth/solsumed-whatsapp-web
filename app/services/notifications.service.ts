import { useSolsumedApi } from '~/composables/useSolsumedApi'

export interface Recipient {
  id: number
  name: string
  phone: string
  notes?: string
  active: boolean
  isGroup?: boolean
}

export interface BackendMessage {
  id: string
  message: string
  direction: 'incoming' | 'outgoing'
  messageType: 'text' | 'image' | 'audio' | 'file' | string
  mediaUrl?: string
  mediaMimeType?: string
  mediaFilename?: string
  status: string
  createdAt: string
  sender: string
}

export interface ChatHistoryResponse {
  recipient: Recipient
  total: number
  messages: BackendMessage[]
}

export const notificationsService = {
  async getRecipients(): Promise<Recipient[]> {
    const api = useSolsumedApi()
    return api<Recipient[]>('/notifications/recipients')
  },

  async createRecipient(payload: { name: string; phone: string; notes?: string; active?: boolean }): Promise<Recipient> {
    const api = useSolsumedApi()
    return api<Recipient>('/notifications/recipients', {
      method: 'POST',
      body: {
        ...payload,
        phone: payload.phone.startsWith('+') ? payload.phone : `+${payload.phone}`
      }
    })
  },

  async sendText(recipientId: number | string, message: string): Promise<{ success: boolean; messageId: string }> {
    const api = useSolsumedApi()
    return api<{ success: boolean; messageId: string }>(`/notifications/recipients/${recipientId}/send`, {
      method: 'POST',
      body: { message }
    })
  },

  async sendMedia(recipientId: number | string, file: File | Blob, caption?: string): Promise<{ success: boolean; messageId: string }> {
    const api = useSolsumedApi()
    const formData = new FormData()
    formData.append('file', file)
    if (caption) {
      formData.append('caption', caption)
    }
    return api<{ success: boolean; messageId: string }>(`/notifications/recipients/${recipientId}/send-media`, {
      method: 'POST',
      body: formData,
    })
  },

  async getMessages(recipientId: number | string, limit = 50): Promise<ChatHistoryResponse> {
    const api = useSolsumedApi()
    return api<ChatHistoryResponse>(`/notifications/recipients/${recipientId}/messages?limit=${limit}`)
  },

  async updateRecipient(recipientId: number | string, data: any): Promise<Recipient> {
    const api = useSolsumedApi()
    return api<Recipient>(`/notifications/recipients/${recipientId}`, {
      method: 'PATCH',
      body: data
    })
  },

  async deleteRecipient(recipientId: number | string): Promise<void> {
    const api = useSolsumedApi()
    return api<void>(`/notifications/recipients/${recipientId}`, {
      method: 'DELETE'
    })
  }
}
