export interface WhatsAppStatus {
  connected: boolean
  phoneNumber?: string
  state?: string
}

export interface WhatsAppMessage {
  to: string
  body: string
}

export interface WhatsAppSendResult {
  id?: string
  status: 'sent' | 'queued' | 'failed'
  message?: string
}
