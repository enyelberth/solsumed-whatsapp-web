<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'

interface Message {
  id: string
  text: string
  sender: 'me' | 'them'
  time: string
  status: 'sent' | 'delivered' | 'read'
  reaction?: string
  replyTo?: { id: string; text: string; sender: string }
  type?: 'text' | 'image' | 'file' | 'audio'
  fileSize?: number
  isStarred?: boolean
  mediaUrl?: string
}

interface Chat {
  id: string
  name: string
  phone: string
  avatarColor: string
  messages: Message[]
  isPinned?: boolean
  isArchived?: boolean
  isGroup?: boolean
}

const props = defineProps<{
  chat: Chat
  sending: boolean
  draftText?: string
}>()

const emit = defineEmits<{
  'send-message': [
    text: string,
    replyTo?: { id: string; text: string; sender: string },
    type?: 'text' | 'image' | 'file' | 'audio',
    fileSize?: number
  ]
  'update-draft': [val: string]
}>()

// ── Ref declarations ───────────────────────────────────────────────
const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const showInfoPanel = ref(false)
const showMessageSearchPanel = ref(false)
const showStarredPanel = ref(false)
const messageSearchQuery = ref('')

const showEmojiPicker = ref(false)
const emojiSearchQuery = ref('')

const showAttachMenu = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)

const activeReactionMsgId = ref<string | null>(null)
const replyingToMessage = ref<Message | null>(null)
const highlightedMessageId = ref<string | null>(null)

const activeMessageOptionsId = ref<string | null>(null)

// ── Voice recording state ─────────────────────────────────────────
const isRecording = ref(false)
const recordingDuration = ref(0)
const recordingInterval = ref<any>(null)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

// ── Voice player state ────────────────────────────────────────────
const playingAudioId = ref<string | null>(null)
const audioProgress = ref<Record<string, string>>({})
const audioDurations = ref<Record<string, string>>({})

// ── Emojis list & search ───────────────────────────────────────────
const allEmojis = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘',
  '😗', '😙', '😚', '☺️', '🙂', '🤗', '🤔', '😐', '😑', '😶', '🙄', '😏', '😣', '😥',
  '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔',
  '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧',
  '😨', '😩', '😬', '😰', '😱', '😳', '😵', '😡', '😠', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '😇', '🤠', '🤡', '🥳', '🥴', '🥺', '🕵️', '🤫', '🤭', '🧐', '🤓', '😈', '👿',
  '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀',
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
  '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠',
  '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛', '💚', '💙', '💜',
  '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘'
]

const emojiNames: Record<string, string> = {
  '😀': 'risa sonrisa feliz alegre', '😁': 'risa sonrisa feliz alegre', '😂': 'risa llorar alegria carcajada',
  '🤣': 'risa carcajada rodar suelo', '😃': 'risa sonrisa feliz', '😄': 'risa sonrisa feliz',
  '😅': 'risa sudor feliz alegre', '😆': 'risa sonrisa alegre', '😉': 'guiño ojo',
  '😊': 'feliz rubor sonrisa', '😋': 'rico delicioso lengua comida', '😎': 'lentes sol chido cool',
  '😍': 'amor ojos corazon enamorado', 'Besos': 'beso corazon amor', '❤️': 'corazon rojo amor',
  '👍': 'bien me gusta ok arriba', '👎': 'mal no me gusta abajo', '🙏': 'por favor gracias rezar'
}

const filteredEmojis = computed(() => {
  const q = emojiSearchQuery.value.trim().toLowerCase()
  if (!q) return allEmojis
  return allEmojis.filter(emoji => {
    const name = emojiNames[emoji] || ''
    return name.includes(q)
  })
})

// ── Search messages ────────────────────────────────────────────────
const searchedMessages = computed(() => {
  const q = messageSearchQuery.value.trim().toLowerCase()
  if (!q) return []
  return props.chat.messages.filter(m => m.type !== 'image' && m.type !== 'file' && m.type !== 'audio' && m.text.toLowerCase().includes(q))
})

// ── Shared media ──────────────────────────────────────────────────
const sharedMediaMessages = computed(() => {
  return props.chat.messages.filter(m => m.type === 'image')
})

// ── Starred messages ──────────────────────────────────────────────
const starredMessages = computed(() => {
  return props.chat.messages.filter(m => m.isStarred)
})

// ── Helpers & Handlers ─────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function handleSend() {
  const text = inputMessage.value.trim()
  if (!text || props.sending) return
  emit('send-message', text, replyingToMessage.value ? {
    id: replyingToMessage.value.id,
    text: replyingToMessage.value.text,
    sender: replyingToMessage.value.sender
  } : undefined)
  inputMessage.value = ''
  replyingToMessage.value = null
  nextTick(() => inputRef.value?.focus())
}

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

function toggleInfoPanel() {
  showInfoPanel.value = !showInfoPanel.value
  showMessageSearchPanel.value = false
  showStarredPanel.value = false
}

function toggleMessageSearchPanel() {
  showMessageSearchPanel.value = !showMessageSearchPanel.value
  showInfoPanel.value = false
  showStarredPanel.value = false
}

function triggerImageSelect() {
  imageInputRef.value?.click()
}

function triggerFileSelect() {
  fileInputRef.value?.click()
}

function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      emit('send-message', dataUrl, undefined, 'image')
    }
    reader.readAsDataURL(file)
    showAttachMenu.value = false
  }
}

function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    emit('send-message', file.name, undefined, 'file', file.size)
    showAttachMenu.value = false
  }
}

function insertEmoji(emoji: string) {
  const input = inputRef.value
  if (!input) {
    inputMessage.value += emoji
    emit('update-draft', inputMessage.value)
    return
  }

  const start = input.selectionStart ?? inputMessage.value.length
  const end = input.selectionEnd ?? inputMessage.value.length
  const text = inputMessage.value

  inputMessage.value = text.substring(0, start) + emoji + text.substring(end)
  emit('update-draft', inputMessage.value)

  nextTick(() => {
    input.focus()
    const newCursorPos = start + emoji.length
    input.setSelectionRange(newCursorPos, newCursorPos)
  })
}

function toggleReactionMenu(msgId: string, event: Event) {
  event.stopPropagation()
  if (activeReactionMsgId.value === msgId) {
    activeReactionMsgId.value = null
  } else {
    activeReactionMsgId.value = msgId
  }
  activeMessageOptionsId.value = null
}

function reactToMessage(msgId: string, emoji: string) {
  const msg = props.chat.messages.find(m => m.id === msgId)
  if (msg) {
    if (msg.reaction === emoji) {
      delete msg.reaction
    } else {
      msg.reaction = emoji
    }
  }
  activeReactionMsgId.value = null
}

function startReply(msg: Message, event?: Event) {
  if (event) event.stopPropagation()
  replyingToMessage.value = msg
  activeMessageOptionsId.value = null
  nextTick(() => inputRef.value?.focus())
}

function deleteMessage(msgId: string) {
  const index = props.chat.messages.findIndex(m => m.id === msgId)
  if (index !== -1) {
    props.chat.messages.splice(index, 1)
  }
  activeMessageOptionsId.value = null
}

function toggleMessageOptions(msgId: string, event: Event) {
  event.stopPropagation()
  if (activeMessageOptionsId.value === msgId) {
    activeMessageOptionsId.value = null
  } else {
    activeMessageOptionsId.value = msgId
  }
  activeReactionMsgId.value = null
}

function scrollToMessage(msgId: string) {
  const el = document.getElementById('msg-' + msgId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightedMessageId.value = msgId
    setTimeout(() => {
      if (highlightedMessageId.value === msgId) {
        highlightedMessageId.value = null
      }
    }, 1500)
  }
}

function toggleStarMessage(msgId: string, event: Event) {
  event.stopPropagation()
  const msg = props.chat.messages.find(m => m.id === msgId)
  if (msg) {
    msg.isStarred = !msg.isStarred
  }
  activeMessageOptionsId.value = null
}

function getEmojiOnlyCount(text: string): number {
  const stripped = text.replace(/\s/g, '')
  if (!stripped) return 0

  // Extended_Pictographic standard regex
  const emojiRegex = /^\p{Extended_Pictographic}+$/u
  if (!emojiRegex.test(stripped)) return 0

  try {
    const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' })
    const segments = Array.from(segmenter.segment(stripped))
    const singleEmojiRegex = /^\p{Extended_Pictographic}$/u
    const allAreEmojis = segments.every(s => singleEmojiRegex.test(s.segment))
    if (allAreEmojis) {
      return segments.length <= 3 ? segments.length : 0
    }
  } catch (e) {
    const charCount = Array.from(stripped).length
    return charCount <= 3 ? charCount : 0
  }
  return 0
}

function selectSearchedMessage(msgId: string) {
  scrollToMessage(msgId)
  showMessageSearchPanel.value = false
}

// ── Voice recording logic ──────────────────────────────────────────
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' })
      const audioUrl = URL.createObjectURL(audioBlob)

      emit('send-message', audioUrl, undefined, 'audio')
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true
    recordingDuration.value = 0
    recordingInterval.value = setInterval(() => {
      recordingDuration.value++
    }, 1000)
  } catch (err) {
    console.error('Error al acceder al micrófono:', err)
    alert('No se pudo acceder al micrófono.')
  }
}

function cancelRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.onstop = () => {
      mediaRecorder?.stream.getTracks().forEach(track => track.stop())
    }
    mediaRecorder.stop()
  }
  stopRecordingTimer()
  isRecording.value = false
}

function stopAndSendRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  stopRecordingTimer()
  isRecording.value = false
}

function stopRecordingTimer() {
  if (recordingInterval.value) {
    clearInterval(recordingInterval.value)
    recordingInterval.value = null
  }
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function togglePlayAudio(msgId: string) {
  const audioEl = document.getElementById('audio-' + msgId) as HTMLAudioElement
  if (!audioEl) return

  if (playingAudioId.value === msgId) {
    audioEl.pause()
    playingAudioId.value = null
  } else {
    if (playingAudioId.value) {
      const otherAudio = document.getElementById('audio-' + playingAudioId.value) as HTMLAudioElement
      if (otherAudio) otherAudio.pause()
    }
    audioEl.play()
    playingAudioId.value = msgId
  }
}

function updateAudioProgress(msgId: string) {
  const audioEl = document.getElementById('audio-' + msgId) as HTMLAudioElement
  if (!audioEl) return
  const progress = (audioEl.currentTime / audioEl.duration) * 100
  audioProgress.value[msgId] = progress + '%'

  const duration = audioEl.duration || 0
  const curTime = audioEl.currentTime || 0
  const timeToShow = curTime > 0 ? curTime : duration
  audioDurations.value[msgId] = formatDuration(Math.floor(timeToShow))
}

function audioEnded(msgId: string) {
  playingAudioId.value = null
  audioProgress.value[msgId] = '0%'
}

// ── Media Download Logic ──────────────────────────────────────────
const resolvedMediaUrls = ref<Record<string, string>>({})

async function loadMedia(msgId: string, url: string) {
  if (resolvedMediaUrls.value[msgId]) return
  
  try {
    const config = useRuntimeConfig()
    const auth = useAuthStore()
    const response = await fetch(config.public.solsumedApiUrl + url, {
      headers: {
        'Authorization': `Bearer ${auth.token}`
      }
    })
    if (!response.ok) throw new Error('Fetch status error')
    const blob = await response.blob()
    resolvedMediaUrls.value[msgId] = URL.createObjectURL(blob)
  } catch (err) {
    console.error('Error fetching authenticated media:', err)
    resolvedMediaUrls.value[msgId] = useRuntimeConfig().public.solsumedApiUrl + url
  }
}

function downloadResolvedFile(msg: Message) {
  const url = resolvedMediaUrls.value[msg.id] || msg.text
  const a = document.createElement('a')
  a.href = url
  a.download = msg.text || 'archivo'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function openUrl(url: string) {
  window.open(url, '_blank')
}

watch(() => props.chat.messages, (newMsgs) => {
  if (!newMsgs) return
  newMsgs.forEach(msg => {
    if (msg.mediaUrl && !resolvedMediaUrls.value[msg.id]) {
      loadMedia(msg.id, msg.mediaUrl)
    }
  })
}, { immediate: true, deep: true })

// ── Watchers & Hooks ──────────────────────────────────────────────
watch(() => props.chat.id, () => {
  showInfoPanel.value = false
  showMessageSearchPanel.value = false
  showStarredPanel.value = false
  replyingToMessage.value = null
  inputMessage.value = props.draftText || ''
  scrollToBottom()
})

watch(inputMessage, (newVal) => {
  emit('update-draft', newVal)
})

watch(() => props.chat.messages.length, scrollToBottom)
onMounted(scrollToBottom)
</script>

<template>
  <div class="wa-font flex w-full h-full overflow-hidden relative">
    <!-- File inputs for attachments -->
    <input type="file" ref="fileInputRef" class="hidden" @change="handleFileSelected" />
    <input type="file" accept="image/*" ref="imageInputRef" class="hidden" @change="handleImageSelected" />

    <!-- ── LEFT COLUMN: MAIN CONVERSATION ──────────────────────────── -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">

      <!-- ══ HEADER (59px — exact WhatsApp Web) ══════════════════════ -->
      <div class="h-[59px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 shrink-0 border-b border-[#e9edef] dark:border-[#222d34]">
        <!-- Left: avatar + contact info (click opens Info panel) -->
        <div @click="toggleInfoPanel" class="flex items-center gap-3 cursor-pointer group">
          <div :class="['w-[40px] h-[40px] rounded-full flex items-center justify-center font-semibold text-[15px] text-white shrink-0 select-none', chat.avatarColor]">
            {{ getInitials(chat.name) }}
          </div>
          <div class="flex flex-col justify-center leading-tight">
            <span class="text-[15px] font-normal text-[#111b21] dark:text-[#e9edef] group-hover:text-[#111b21] dark:group-hover:text-white">
              {{ chat.name }}
            </span>
            <span class="text-[13px] text-[#667781] dark:text-[#8696a0]">
              <span v-if="chat.isGroup">Grupo • {{ chat.messages.length }} mensajes</span>
              <span v-else>+{{ chat.phone }}</span>
            </span>
          </div>
        </div>

        <!-- Right: action icons -->
        <div class="flex items-center text-[#54656f] dark:text-[#aebac1]">
          <button class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors" title="Videollamada">
            <UIcon name="i-lucide-video" class="w-[22px] h-[22px]" />
          </button>
          <button class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors" title="Llamar">
            <UIcon name="i-lucide-phone" class="w-[22px] h-[22px]" />
          </button>
          <button @click="toggleMessageSearchPanel" class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors" title="Buscar mensajes">
            <UIcon name="i-lucide-search" class="w-[22px] h-[22px]" :class="{ 'text-[#00a884]': showMessageSearchPanel }" />
          </button>
          <button @click="toggleInfoPanel" class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors" title="Más opciones">
            <UIcon name="i-lucide-ellipsis-vertical" class="w-[22px] h-[22px]" :class="{ 'text-[#00a884]': showInfoPanel }" />
          </button>
        </div>
      </div>

      <!-- ══ MESSAGES AREA ════════════════════════════════════════════ -->
      <div
        ref="messageContainer"
        class="flex-1 overflow-y-auto wa-scrollbar wa-chat-bg"
      >
        <div class="flex flex-col py-4 px-3 gap-[2px]">
          <!-- Date stamp -->
          <div class="flex justify-center my-3">
            <span class="text-[12px] text-[#54656f] dark:text-[#8696a0] bg-[#ffffff] dark:bg-[#182229] rounded-lg px-3 py-[5px] shadow-sm font-normal tracking-wide">
              HOY
            </span>
          </div>

          <!-- ── Messages Loop ──────────────────────────────────────── -->
          <div
            v-for="(msg, index) in chat.messages"
            :key="msg.id"
            :id="'msg-' + msg.id"
            class="flex w-full group relative animate-fade-in"
            :class="msg.sender === 'me' ? 'justify-end' : 'justify-start'"
            :style="index > 0 && chat.messages[index - 1]?.sender === msg.sender ? 'margin-top: 2px' : 'margin-top: 6px'"
          >
            <!-- Bubble and Controls Wrapper -->
            <div class="relative max-w-[65%] flex" :class="[
              msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row',
              getEmojiOnlyCount(msg.text) > 0 ? 'items-end' : ''
            ]">
              <!-- Bubble -->
              <div
                class="relative transition-all"
                :class="[
                  getEmojiOnlyCount(msg.text) > 0
                    ? 'bg-transparent shadow-none px-2 py-1'
                    : 'min-w-[90px] rounded-[7.5px] shadow-sm px-[9px] pt-[6px] pb-[8px]',
                  msg.sender === 'me' && getEmojiOnlyCount(msg.text) === 0
                    ? 'wa-bubble-out bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-[0]'
                    : '',
                  msg.sender === 'them' && getEmojiOnlyCount(msg.text) === 0
                    ? 'wa-bubble-in bg-[#ffffff] dark:bg-[#202c33] rounded-tl-[0]'
                    : '',
                  highlightedMessageId === msg.id ? 'ring-2 ring-amber-400 dark:ring-amber-500 scale-[1.02]' : ''
                ]"
              >
                <!-- Cited Reply Box -->
                <div v-if="msg.replyTo"
                  @click="scrollToMessage(msg.replyTo.id)"
                  class="mb-1.5 border-l-4 border-[#00a884] bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-r cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <div class="text-[11px] font-medium text-[#00a884]">
                    {{ msg.replyTo.sender === 'me' ? 'Tú' : chat.name }}
                  </div>
                  <div class="text-[12px] text-[#667781] dark:text-[#8696a0] truncate leading-none">
                    {{ msg.replyTo.text }}
                  </div>
                </div>

                <!-- Media: Image -->
                <div v-if="msg.type === 'image'" class="mb-1 rounded overflow-hidden max-w-[280px]">
                  <img :src="resolvedMediaUrls[msg.id] || msg.text" class="w-full h-auto object-contain cursor-pointer hover:opacity-95" @click="openUrl(resolvedMediaUrls[msg.id] || msg.text)" />
                </div>

                <!-- Media: File -->
                <div v-else-if="msg.type === 'file'" class="mb-1 p-2 rounded bg-black/5 dark:bg-white/5 flex items-center gap-2 border border-[#e9edef] dark:border-[#222d34] text-[13px] select-none">
                  <UIcon name="i-lucide-file-text" class="w-8 h-8 text-[#7f66ff] shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-[#111b21] dark:text-[#e9edef] truncate leading-tight">{{ msg.text }}</div>
                    <div class="text-[10px] text-[#667781] dark:text-[#8696a0] mt-0.5">{{ (msg.fileSize || 0) > 1024 * 1024 ? ((msg.fileSize || 0)/(1024*1024)).toFixed(1) + ' MB' : ((msg.fileSize || 0)/1024).toFixed(0) + ' KB' }}</div>
                  </div>
                  <button @click="downloadResolvedFile(msg)" class="text-[#8696a0] hover:text-[#54656f] p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5" title="Descargar">
                    <UIcon name="i-lucide-download" class="w-4 h-4" />
                  </button>
                </div>

                <!-- Media: Custom Audio Player -->
                <div v-else-if="msg.type === 'audio'" class="mb-1 py-1.5 px-0.5 flex items-center gap-3 w-64 select-none">
                  <button @click="togglePlayAudio(msg.id)"
                    class="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
                    title="Reproducir audio"
                  >
                    <UIcon :name="playingAudioId === msg.id ? 'i-lucide-pause' : 'i-lucide-play'" class="w-5 h-5 fill-current" :class="playingAudioId === msg.id ? 'ml-0' : 'ml-0.5'" />
                  </button>
                  <div class="flex-1 flex flex-col gap-1 min-w-0">
                    <!-- Progress bar -->
                    <div class="h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden relative">
                      <div class="absolute left-0 top-0 h-full bg-[#00a884]" :style="{ width: audioProgress[msg.id] || '0%' }" />
                    </div>
                    <!-- Audio HTML tag in background -->
                    <audio :id="'audio-' + msg.id" :src="resolvedMediaUrls[msg.id] || msg.text" @timeupdate="updateAudioProgress(msg.id)" @ended="audioEnded(msg.id)" class="hidden" />
                    <!-- Subtext -->
                    <div class="flex justify-between items-center text-[10px] text-[#667781] dark:text-[#8696a0]">
                      <span class="truncate">Nota de voz</span>
                      <span>{{ audioDurations[msg.id] || '0:00' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Message text -->
                <template v-else>
                  <!-- Emoji Only (1 to 3 emojis) -->
                  <div v-if="getEmojiOnlyCount(msg.text) > 0" class="flex flex-col gap-1.5">
                    <div
                      class="break-words whitespace-pre-wrap select-text tracking-wide"
                      :class="[
                        getEmojiOnlyCount(msg.text) === 1 ? 'text-[48px] leading-none' : '',
                        getEmojiOnlyCount(msg.text) === 2 ? 'text-[36px] leading-none' : '',
                        getEmojiOnlyCount(msg.text) === 3 ? 'text-[28px] leading-none' : '',
                      ]"
                    >
                      {{ msg.text }}
                    </div>
                    <!-- Time below emojis -->
                    <div class="flex items-center justify-end gap-[3px] select-none text-[11px] text-[#667781] dark:text-[#8696a0]">
                      <UIcon v-if="msg.isStarred" name="i-lucide-star" class="w-3 h-3 text-[#8696a0] shrink-0 fill-current" />
                      <span>{{ msg.time }}</span>
                      <template v-if="msg.sender === 'me'">
                        <svg v-if="msg.status === 'sent'" viewBox="0 0 16 15" width="16" height="15" class="text-[#667781] dark:text-[#8696a0]">
                          <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z"/>
                        </svg>
                        <svg v-else-if="msg.status === 'delivered'" viewBox="0 0 16 15" width="16" height="15" class="text-[#667781] dark:text-[#8696a0]">
                          <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                        </svg>
                        <svg v-else-if="msg.status === 'read'" viewBox="0 0 16 15" width="16" height="15" class="text-[#53bdeb]">
                          <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                        </svg>
                      </template>
                    </div>
                  </div>

                  <!-- Standard text message -->
                  <p v-else class="text-[14.2px] text-[#111b21] dark:text-[#e9edef] leading-[19px] break-words whitespace-pre-wrap"
                    style="padding-right: 60px;">
                    {{ msg.text }}
                  </p>
                </template>

                <!-- Time + status ticks (only for non-emoji messages) -->
                <div v-if="getEmojiOnlyCount(msg.text) === 0" class="absolute bottom-[5px] right-[8px] flex items-center gap-[3px] select-none">
                  <UIcon v-if="msg.isStarred" name="i-lucide-star" class="w-3 h-3 text-[#8696a0] shrink-0 fill-current" />
                  <span class="text-[11px] text-[#667781] dark:text-[#8696a0] leading-none whitespace-nowrap">
                    {{ msg.time }}
                  </span>
                  <template v-if="msg.sender === 'me'">
                    <svg v-if="msg.status === 'sent'" viewBox="0 0 16 15" width="16" height="15" class="text-[#667781] dark:text-[#8696a0]">
                      <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z"/>
                    </svg>
                    <svg v-else-if="msg.status === 'delivered'" viewBox="0 0 16 15" width="16" height="15" class="text-[#667781] dark:text-[#8696a0]">
                      <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                    </svg>
                    <svg v-else-if="msg.status === 'read'" viewBox="0 0 16 15" width="16" height="15" class="text-[#53bdeb]">
                      <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                    </svg>
                  </template>
                </div>

                <!-- Message reaction bubble -->
                <div v-if="msg.reaction"
                  class="absolute -bottom-2.5 right-3 bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] rounded-full px-1.5 py-0.5 text-[14px] flex items-center justify-center shadow-sm select-none"
                >
                  {{ msg.reaction }}
                </div>
              </div>

              <!-- Hover reactions/options triggers -->
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0 self-center px-2 relative">
                <button @click="toggleReactionMenu(msg.id, $event)"
                  class="w-7 h-7 rounded-full bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] shadow flex items-center justify-center text-[#667781] hover:text-[#111b21] dark:hover:text-white hover:scale-105 transition-transform"
                  title="Reaccionar"
                >
                  <UIcon name="i-lucide-smile" class="w-4 h-4" />
                </button>
                <button @click="toggleMessageOptions(msg.id, $event)"
                  class="w-7 h-7 rounded-full bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] shadow flex items-center justify-center text-[#667781] hover:text-[#111b21] dark:hover:text-white hover:scale-105 transition-transform"
                  title="Opciones"
                >
                  <UIcon name="i-lucide-chevron-down" class="w-4 h-4" />
                </button>

                <!-- Reactions Popover -->
                <div v-if="activeReactionMsgId === msg.id" v-click-outside="() => activeReactionMsgId = null"
                  class="absolute bottom-9 z-20 flex items-center gap-2 bg-white dark:bg-[#233138] shadow-lg rounded-full px-3 py-1.5 border border-[#e9edef] dark:border-[#222d34] animate-bounce-short"
                  :class="msg.sender === 'me' ? 'right-0' : 'left-0'"
                >
                  <button
                    v-for="emoji in ['👍', '❤️', '😂', '😮', '😢', '🙏']"
                    :key="emoji"
                    @click="reactToMessage(msg.id, emoji)"
                    class="text-[26px] hover:scale-130 transition-transform duration-100 ease-out origin-bottom"
                  >
                    {{ emoji }}
                  </button>
                </div>

                <!-- Message Options Dropdown -->
                <div v-if="activeMessageOptionsId === msg.id" v-click-outside="() => activeMessageOptionsId = null"
                  class="absolute z-20 w-36 bg-white dark:bg-[#233138] shadow-lg border border-[#e9edef] dark:border-[#222d34] rounded-md py-1 text-[12px] text-[#3b4a54] dark:text-[#e9edef] bottom-9"
                  :class="msg.sender === 'me' ? 'right-0' : 'left-0'"
                >
                  <button @click="startReply(msg, $event)" class="w-full text-left px-3 py-1.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                    Responder
                  </button>
                  <button @click="toggleStarMessage(msg.id, $event)" class="w-full text-left px-3 py-1.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                    {{ msg.isStarred ? 'Quitar destacado' : 'Destacar' }}
                  </button>
                  <button @click="deleteMessage(msg.id)" class="w-full text-left px-3 py-1.5 text-red-500 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty chat hint -->
        <div v-if="chat.messages.length === 0" class="flex justify-center mt-8">
          <div class="bg-[#fffde7] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-[13px] px-4 py-2 rounded-lg shadow-sm text-center max-w-xs leading-relaxed">
            🔒 Los mensajes están cifrados de extremo a extremo. Nadie fuera de este chat puede leerlos.
          </div>
        </div>
      </div>

      <!-- ══ REPLY CITATION PREVIEW BAR ═══════════════════════════════ -->
      <div v-if="replyingToMessage" class="px-4 py-2 bg-[#f0f2f5] dark:bg-[#2a3942]/40 border-t border-[#e9edef] dark:border-[#222d34] flex items-center justify-between shrink-0">
        <div class="flex-1 border-l-4 border-[#00a884] bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-r min-w-0">
          <div class="text-[12px] font-medium text-[#00a884]">
            {{ replyingToMessage.sender === 'me' ? 'Tú' : chat.name }}
          </div>
          <div class="text-[13px] text-[#667781] dark:text-[#8696a0] truncate leading-normal">
            {{ replyingToMessage.text }}
          </div>
        </div>
        <button @click="replyingToMessage = null" class="text-[#667781] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-white ml-3">
          <UIcon name="i-lucide-x" class="w-5 h-5" />
        </button>
      </div>

      <!-- ══ INPUT BAR (62px — exact WhatsApp Web) ═══════════════════ -->
      <div class="h-[62px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2 px-4 shrink-0 relative">
        <!-- Recording overlay -->
        <div v-if="isRecording" class="absolute inset-0 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 z-40 select-none">
          <div class="flex items-center gap-3">
            <button @click="cancelRecording" class="text-red-500 hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-full transition-colors" title="Descartar nota de voz">
              <UIcon name="i-lucide-trash-2" class="w-5 h-5" />
            </button>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span class="text-[14px] font-medium text-[#111b21] dark:text-[#e9edef]">
                {{ formatDuration(recordingDuration) }}
              </span>
            </div>
            <!-- Waves -->
            <div class="flex items-center gap-0.5 h-4 px-2">
              <span class="w-0.5 h-2 bg-red-500 rounded-full animate-bounce-short" style="animation-delay: 0.1s" />
              <span class="w-0.5 h-4 bg-red-500 rounded-full animate-bounce-short" style="animation-delay: 0.2s" />
              <span class="w-0.5 h-3 bg-red-500 rounded-full animate-bounce-short" style="animation-delay: 0.3s" />
              <span class="w-0.5 h-1 bg-red-500 rounded-full animate-bounce-short" style="animation-delay: 0.4s" />
              <span class="w-0.5 h-3 bg-red-500 rounded-full animate-bounce-short" style="animation-delay: 0.5s" />
            </div>
          </div>
          
          <button @click="stopAndSendRecording" class="w-10 h-10 bg-[#00a884] hover:bg-[#008f72] text-white flex items-center justify-center rounded-full shadow-sm transition-colors" title="Enviar nota de voz">
            <UIcon name="i-lucide-check" class="w-5 h-5" />
          </button>
        </div>

        <!-- Emoji button -->
        <button
          @click="showEmojiPicker = !showEmojiPicker; showAttachMenu = false"
          class="w-[40px] h-[40px] flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors shrink-0"
          :class="{ 'text-[#00a884]': showEmojiPicker }"
          title="Emoji"
        >
          <UIcon name="i-lucide-smile" class="w-[24px] h-[24px]" />
        </button>

        <!-- Emoji Popover -->
        <div v-if="showEmojiPicker" v-click-outside="() => showEmojiPicker = false"
          class="absolute bottom-16 left-4 z-30 w-[340px] h-[320px] bg-white dark:bg-[#233138] border border-[#e9edef] dark:border-[#222d34] shadow-xl rounded-lg flex flex-col overflow-hidden"
        >
          <div class="p-2 border-b border-[#e9edef] dark:border-[#222d34] flex items-center gap-2">
            <input v-model="emojiSearchQuery" type="text" placeholder="Buscar emoji"
              class="w-full h-8 px-2 text-[13px] rounded bg-[#f0f2f5] dark:bg-[#2a3942] border-none text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none"
            />
          </div>
          <div class="flex-1 overflow-y-auto wa-scrollbar p-3">
            <div v-if="filteredEmojis.length === 0" class="text-center text-[12px] text-[#8696a0] py-4">No se encontraron emojis</div>
            <div v-else class="grid grid-cols-9 gap-1">
              <button
                v-for="emoji in filteredEmojis"
                :key="emoji"
                @click="insertEmoji(emoji)"
                class="text-[22px] hover:bg-black/5 dark:hover:bg-white/5 rounded-md p-1 transition-colors flex items-center justify-center select-none"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </div>

        <!-- Attach button -->
        <button
          @click="showAttachMenu = !showAttachMenu; showEmojiPicker = false"
          class="w-[40px] h-[40px] flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors shrink-0"
          :class="{ 'text-[#00a884]': showAttachMenu }"
          title="Adjuntar"
        >
          <UIcon name="i-lucide-paperclip" class="w-[24px] h-[24px]" />
        </button>

        <!-- Attach Popover -->
        <div v-if="showAttachMenu" v-click-outside="() => showAttachMenu = false"
          class="absolute bottom-16 left-12 z-30 flex flex-col bg-white dark:bg-[#233138] border border-[#e9edef] dark:border-[#222d34] shadow-xl rounded-lg py-1.5 w-44 text-[14px] text-[#3b4a54] dark:text-[#e9edef]"
        >
          <button @click="triggerImageSelect" class="w-full text-left px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] flex items-center gap-3 transition-colors">
            <UIcon name="i-lucide-image" class="w-5 h-5 text-[#007bec]" />
            Fotos y videos
          </button>
          <button @click="triggerFileSelect" class="w-full text-left px-4 py-2.5 hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942] flex items-center gap-3 transition-colors">
            <UIcon name="i-lucide-file" class="w-5 h-5 text-[#7f66ff]" />
            Documento
          </button>
        </div>

        <!-- Text input -->
        <div class="flex-1">
          <input
            ref="inputRef"
            v-model="inputMessage"
            type="text"
            placeholder="Escribe un mensaje aquí"
            :disabled="sending"
            @keydown.enter.prevent="handleSend"
            class="w-full h-[42px] px-4 rounded-[21px] bg-[#ffffff] dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] text-[15px] placeholder-[#667781] dark:placeholder-[#8696a0] border-none focus:outline-none focus:ring-0"
          />
        </div>

        <!-- Send / Mic button -->
        <button
          @click="inputMessage.trim() ? handleSend() : startRecording()"
          class="w-[40px] h-[40px] flex items-center justify-center rounded-full transition-colors shrink-0"
          :class="inputMessage.trim()
            ? 'bg-[#00a884] hover:bg-[#008f72] text-white'
            : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54]'"
          :title="inputMessage.trim() ? 'Enviar' : 'Nota de voz'"
        >
          <UIcon v-if="sending" name="i-lucide-refresh-cw" class="w-[22px] h-[22px] animate-spin" />
          <UIcon v-else-if="inputMessage.trim()" name="i-lucide-send" class="w-[20px] h-[20px]" />
          <UIcon v-else name="i-lucide-mic" class="w-[22px] h-[22px]" />
        </button>
      </div>

    </div>

    <!-- ── RIGHT COLUMN: INFO PANEL ────────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="w-0 opacity-0"
      enter-to-class="w-[30%] min-w-[320px] opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="w-[30%] min-w-[320px] opacity-100"
      leave-to-class="w-0 opacity-0"
    >
      <div v-if="showInfoPanel" class="w-[30%] min-w-[320px] max-w-[400px] h-full flex flex-col bg-[#ffffff] dark:bg-[#111b21] shrink-0 border-l border-[#e9edef] dark:border-[#222d34]">
        <!-- Panel Header -->
        <div class="h-[59px] bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center gap-6 border-b border-[#e9edef] dark:border-[#222d34]">
          <button @click="showInfoPanel = false" class="text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] p-1 rounded-full transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
          <span class="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef]">Info. del contacto</span>
        </div>
        <!-- Panel Content -->
        <div class="flex-1 overflow-y-auto wa-scrollbar bg-[#f0f2f5] dark:bg-[#0c1317] flex flex-col gap-2.5">
          <!-- Card 1: Main Info -->
          <div class="bg-white dark:bg-[#111b21] px-6 py-7 flex flex-col items-center text-center shadow-sm">
            <div :class="['w-28 h-28 rounded-full flex items-center justify-center font-bold text-[36px] text-white select-none shadow-sm mb-4', chat.avatarColor]">
              {{ getInitials(chat.name) }}
            </div>
            <h2 class="text-[19px] font-normal text-[#111b21] dark:text-[#e9edef]">{{ chat.name }}</h2>
            <div class="text-[14px] text-[#667781] dark:text-[#8696a0] mt-1">
              <span v-if="chat.isGroup">Grupo de Solsumed</span>
              <span v-else>+{{ chat.phone }}</span>
            </div>
          </div>

          <!-- Card 2: About / Bio -->
          <div class="bg-white dark:bg-[#111b21] px-6 py-4.5 shadow-sm">
            <div class="text-[13px] text-[#667781] dark:text-[#8696a0] leading-none mb-2 select-none">Info.</div>
            <div class="text-[14.2px] text-[#111b21] dark:text-[#e9edef] leading-snug">
              <span v-if="chat.isGroup">Grupo creado para coordinar actividades internas.</span>
              <span v-else>Disponible • Trabajando en Solsumed</span>
            </div>
          </div>

          <!-- Card 3: Shared Media (if exists) -->
          <div v-if="sharedMediaMessages.length > 0" class="bg-white dark:bg-[#111b21] px-6 py-4 shadow-sm flex flex-col">
            <div class="text-[13px] text-[#667781] dark:text-[#8696a0] mb-2 flex justify-between items-center select-none">
              <span>Archivos, enlaces y docs.</span>
              <span class="text-[#00a884] font-medium cursor-pointer text-[12px] hover:underline">{{ sharedMediaMessages.length }}</span>
            </div>
            <div class="grid grid-cols-3 gap-1.5 mt-1">
              <div v-for="media in sharedMediaMessages.slice(0, 3)" :key="media.id" class="aspect-square rounded overflow-hidden border border-black/5 dark:border-white/5">
                <img :src="resolvedMediaUrls[media.id] || media.text" class="w-full h-full object-cover cursor-pointer hover:opacity-90" @click="openUrl(resolvedMediaUrls[media.id] || media.text)" />
              </div>
            </div>
          </div>

          <!-- Card 4: Action Toggles -->
          <div class="bg-white dark:bg-[#111b21] py-1 shadow-sm flex flex-col text-[14px] text-[#111b21] dark:text-[#e9edef]">
            <div class="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors">
              <div class="flex items-center gap-4">
                <UIcon name="i-lucide-bell" class="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
                <span>Silenciar notificaciones</span>
              </div>
              <UIcon name="i-lucide-toggle-left" class="w-7 h-7 text-[#8696a0]" />
            </div>
            <div @click="showStarredPanel = true; showInfoPanel = false" class="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors">
              <div class="flex items-center gap-4">
                <UIcon name="i-lucide-star" class="w-5 h-5 text-[#54656f] dark:text-[#aebac1]" />
                <span>Mensajes destacados</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span v-if="starredMessages.length > 0" class="text-[12px] text-[#8696a0]">{{ starredMessages.length }}</span>
                <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-[#8696a0]" />
              </div>
            </div>
          </div>

          <!-- Card 5: Danger Actions -->
          <div class="bg-white dark:bg-[#111b21] py-1 shadow-sm flex flex-col text-[14px] text-red-500 mb-6">
            <button class="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] flex items-center gap-4 transition-colors">
              <UIcon name="i-lucide-ban" class="w-5 h-5" />
              <span>Bloquear a {{ chat.name }}</span>
            </button>
            <button class="w-full text-left px-6 py-3 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] flex items-center gap-4 transition-colors">
              <UIcon name="i-lucide-thumbs-down" class="w-5 h-5" />
              <span>Reportar a {{ chat.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── RIGHT COLUMN: MESSAGE SEARCH PANEL ──────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="w-0 opacity-0"
      enter-to-class="w-[30%] min-w-[320px] opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="w-[30%] min-w-[320px] opacity-100"
      leave-to-class="w-0 opacity-0"
    >
      <div v-if="showMessageSearchPanel" class="w-[30%] min-w-[320px] max-w-[400px] h-full flex flex-col bg-[#ffffff] dark:bg-[#111b21] shrink-0 border-l border-[#e9edef] dark:border-[#222d34]">
        <!-- Panel Header -->
        <div class="h-[59px] bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center gap-6 border-b border-[#e9edef] dark:border-[#222d34]">
          <button @click="showMessageSearchPanel = false" class="text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] p-1 rounded-full transition-colors">
            <UIcon name="i-lucide-x" class="w-5 h-5" />
          </button>
          <span class="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef]">Buscar mensajes</span>
        </div>
        <!-- Search bar -->
        <div class="px-3 py-2 bg-[#ffffff] dark:bg-[#111b21] border-b border-[#e9edef] dark:border-[#222d34]">
          <div class="flex items-center h-[35px] rounded-lg bg-[#f0f2f5] dark:bg-[#202c33] px-4 gap-3">
            <UIcon name="i-lucide-search" class="w-[15px] h-[15px] text-[#8696a0]" />
            <input v-model="messageSearchQuery" type="text" placeholder="Buscar..."
              class="flex-1 bg-transparent border-none text-[14px] text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-0 leading-none"
            />
            <button v-if="messageSearchQuery" @click="messageSearchQuery = ''" class="text-[#8696a0] hover:text-[#54656f]">
              <UIcon name="i-lucide-x" class="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>
        <!-- Search results list -->
        <div class="flex-1 overflow-y-auto wa-scrollbar bg-[#ffffff] dark:bg-[#111b21]">
          <div v-if="!messageSearchQuery" class="text-center text-[13px] text-[#8696a0] px-8 py-10 leading-relaxed">
            Busca mensajes de este chat introduciendo palabras clave arriba.
          </div>
          <div v-else-if="searchedMessages.length === 0" class="text-center text-[13px] text-[#8696a0] px-8 py-10">
            No se encontraron mensajes.
          </div>
          <div v-else class="flex flex-col">
            <div v-for="msg in searchedMessages" :key="msg.id"
              @click="selectSearchedMessage(msg.id)"
              class="px-5 py-4 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] border-b border-[#e9edef] dark:border-[#222d34] flex flex-col gap-1 transition-colors"
            >
              <div class="flex justify-between items-center text-[11px] text-[#8696a0]">
                <span>{{ msg.time }}</span>
                <span class="font-medium text-[#00a884]">{{ msg.sender === 'me' ? 'Tú' : chat.name }}</span>
              </div>
              <div class="text-[13.5px] text-[#111b21] dark:text-[#e9edef] break-words line-clamp-2">
                {{ msg.text }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── RIGHT COLUMN: STARRED MESSAGES PANEL ────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="w-0 opacity-0"
      enter-to-class="w-[30%] min-w-[320px] opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="w-[30%] min-w-[320px] opacity-100"
      leave-to-class="w-0 opacity-0"
    >
      <div v-if="showStarredPanel" class="w-[30%] min-w-[320px] max-w-[400px] h-full flex flex-col bg-[#ffffff] dark:bg-[#111b21] shrink-0 border-l border-[#e9edef] dark:border-[#222d34]">
        <!-- Panel Header -->
        <div class="h-[59px] bg-[#f0f2f5] dark:bg-[#202c33] px-4 flex items-center gap-6 border-b border-[#e9edef] dark:border-[#222d34]">
          <button @click="showStarredPanel = false; showInfoPanel = true" class="text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] p-1 rounded-full transition-colors">
            <UIcon name="i-lucide-arrow-left" class="w-5 h-5" />
          </button>
          <span class="text-[16px] font-medium text-[#111b21] dark:text-[#e9edef]">Mensajes destacados</span>
        </div>
        <!-- List -->
        <div class="flex-1 overflow-y-auto wa-scrollbar bg-[#f0f2f5] dark:bg-[#0c1317] p-4 flex flex-col gap-3">
          <div v-if="starredMessages.length === 0" class="text-center text-[13px] text-[#8696a0] px-8 py-10">
            No hay mensajes destacados en este chat.
          </div>
          <div v-else v-for="msg in starredMessages" :key="msg.id"
            @click="scrollToMessage(msg.id)"
            class="p-3 bg-white dark:bg-[#111b21] rounded-lg shadow-sm border border-[#e9edef] dark:border-[#222d34] cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors flex flex-col gap-1.5"
          >
            <div class="flex justify-between items-center text-[11px] text-[#8696a0]">
              <span class="font-medium text-[#00a884]">{{ msg.sender === 'me' ? 'Tú' : chat.name }}</span>
              <span>{{ msg.time }}</span>
            </div>
            <div class="text-[13.5px] text-[#111b21] dark:text-[#e9edef] break-words">
              {{ msg.text }}
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style>
@keyframes messageFlash {
  0% { background-color: rgba(245, 158, 11, 0.35); }
  100% { background-color: transparent; }
}
.wa-message-flash {
  animation: messageFlash 1.5s ease-out;
}
@keyframes bounceShort {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce-short {
  animation: bounceShort 0.4s ease-out;
}
</style>
