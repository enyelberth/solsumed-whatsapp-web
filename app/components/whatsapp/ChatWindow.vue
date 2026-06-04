<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'

interface Message {
  id: string
  text: string
  sender: 'me' | 'them'
  time: string
  status: 'sent' | 'delivered' | 'read'
}

interface Chat {
  id: string
  name: string
  phone: string
  avatarColor: string
  messages: Message[]
}

const props = defineProps<{
  chat: Chat
  sending: boolean
}>()

const emit = defineEmits<{
  'send-message': [text: string]
}>()

const inputMessage = ref('')
const messageContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function handleSend() {
  const text = inputMessage.value.trim()
  if (!text || props.sending) return
  emit('send-message', text)
  inputMessage.value = ''
  nextTick(() => inputRef.value?.focus())
}

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

watch(() => props.chat.id, scrollToBottom)
watch(() => props.chat.messages.length, scrollToBottom)
onMounted(scrollToBottom)
</script>

<template>
  <div class="wa-font flex flex-col w-full h-full overflow-hidden">

    <!-- ══ HEADER (59px — exact WhatsApp Web) ══════════════════════ -->
    <div class="h-[59px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 shrink-0 border-b border-[#e9edef] dark:border-[#222d34]">
      <!-- Left: avatar + contact info -->
      <div class="flex items-center gap-3 cursor-pointer group">
        <div :class="['w-[40px] h-[40px] rounded-full flex items-center justify-center font-semibold text-[15px] text-white shrink-0 select-none', chat.avatarColor]">
          {{ getInitials(chat.name) }}
        </div>
        <div class="flex flex-col justify-center leading-tight">
          <span class="text-[15px] font-normal text-[#111b21] dark:text-[#e9edef] group-hover:text-[#111b21] dark:group-hover:text-white">
            {{ chat.name }}
          </span>
          <span class="text-[13px] text-[#667781] dark:text-[#8696a0]">
            +{{ chat.phone }}
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
        <button class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors" title="Buscar">
          <UIcon name="i-lucide-search" class="w-[22px] h-[22px]" />
        </button>
        <button class="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors" title="Más opciones">
          <UIcon name="i-lucide-ellipsis-vertical" class="w-[22px] h-[22px]" />
        </button>
      </div>
    </div>

    <!-- ══ MESSAGES AREA ════════════════════════════════════════════ -->
    <!--
      CRITICAL: No max-w, no mx-auto — messages must reach the edges
      just like WhatsApp Web. Bubbles sit left/right with px-[65px] padding
      to leave room for the tail + small breathing room from the walls.
    -->
    <div
      ref="messageContainer"
      class="flex-1 overflow-y-auto wa-scrollbar wa-chat-bg"
    >
      <!-- Inner wrapper: vertical padding only, NO max-width constraint -->
      <div class="flex flex-col py-4 px-3 gap-[2px]">

        <!-- Date stamp -->
        <div class="flex justify-center my-3">
          <span class="text-[12px] text-[#54656f] dark:text-[#8696a0] bg-[#ffffff] dark:bg-[#182229] rounded-lg px-3 py-[5px] shadow-sm font-normal tracking-wide">
            HOY
          </span>
        </div>

        <!-- ── Messages ──────────────────────────────────────────── -->
        <template v-for="(msg, index) in chat.messages" :key="msg.id">
          <!--
            Each message row:
            - 'me'   → justify-end,  margin-left auto  (push right)
            - 'them' → justify-start, margin-right auto (push left)
            No centering. Bubbles hug their side.
          -->
          <div
            class="flex w-full"
            :class="msg.sender === 'me' ? 'justify-end' : 'justify-start'"
            :style="index > 0 && chat.messages[index - 1]?.sender === msg.sender ? 'margin-top: 2px' : 'margin-top: 6px'"
          >
            <!-- Bubble -->
            <div
              class="relative max-w-[65%] min-w-[80px] rounded-[7.5px] shadow-sm px-[9px] pt-[6px] pb-[8px]"
              :class="[
                msg.sender === 'me'
                  ? 'wa-bubble-out bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-[0]'
                  : 'wa-bubble-in bg-[#ffffff] dark:bg-[#202c33] rounded-tl-[0]'
              ]"
            >
              <!-- Text — padding-right reserves space for time+ticks -->
              <p class="text-[14.2px] text-[#111b21] dark:text-[#e9edef] leading-[19px] break-words whitespace-pre-wrap"
                style="padding-right: 60px;">
                {{ msg.text }}
              </p>

              <!-- Time + status ticks — floated to bottom-right -->
              <div class="absolute bottom-[5px] right-[8px] flex items-center gap-[3px] select-none">
                <span class="text-[11px] text-[#667781] dark:text-[#8696a0] leading-none whitespace-nowrap">
                  {{ msg.time }}
                </span>
                <!-- Ticks (only for sent messages) -->
                <template v-if="msg.sender === 'me'">
                  <!-- Single check: sent -->
                  <svg v-if="msg.status === 'sent'" viewBox="0 0 16 15" width="16" height="15" class="text-[#667781] dark:text-[#8696a0]">
                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z"/>
                  </svg>
                  <!-- Double check: delivered (grey) -->
                  <svg v-else-if="msg.status === 'delivered'" viewBox="0 0 16 15" width="16" height="15" class="text-[#667781] dark:text-[#8696a0]">
                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                  </svg>
                  <!-- Double check: read (blue) -->
                  <svg v-else-if="msg.status === 'read'" viewBox="0 0 16 15" width="16" height="15" class="text-[#53bdeb]">
                    <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                  </svg>
                </template>
              </div>
            </div>
          </div>
        </template>

        <!-- Empty chat hint -->
        <div v-if="chat.messages.length === 0" class="flex justify-center mt-8">
          <div class="bg-[#fffde7] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-[13px] px-4 py-2 rounded-lg shadow-sm text-center max-w-xs leading-relaxed">
            🔒 Los mensajes están cifrados de extremo a extremo. Nadie fuera de este chat puede leerlos.
          </div>
        </div>

      </div>
    </div>

    <!-- ══ INPUT BAR (62px — exact WhatsApp Web) ═══════════════════ -->
    <div class="h-[62px] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2 px-4 shrink-0">

      <!-- Emoji button -->
      <button
        class="w-[40px] h-[40px] flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors shrink-0"
        title="Emoji"
      >
        <UIcon name="i-lucide-smile" class="w-[24px] h-[24px]" />
      </button>

      <!-- Attach button -->
      <button
        class="w-[40px] h-[40px] flex items-center justify-center rounded-full text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54] transition-colors shrink-0"
        title="Adjuntar"
      >
        <UIcon name="i-lucide-paperclip" class="w-[24px] h-[24px]" />
      </button>

      <!-- Text input (pill shape matching WhatsApp Web) -->
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
        @click="handleSend"
        class="w-[40px] h-[40px] flex items-center justify-center rounded-full transition-colors shrink-0"
        :class="inputMessage.trim()
          ? 'bg-[#00a884] hover:bg-[#008f72] text-white'
          : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#d9dbdf] dark:hover:bg-[#3b4a54]'"
        :title="inputMessage.trim() ? 'Enviar' : 'Nota de voz'"
      >
        <UIcon
          v-if="sending"
          name="i-lucide-refresh-cw"
          class="w-[22px] h-[22px] animate-spin"
        />
        <UIcon
          v-else-if="inputMessage.trim()"
          name="i-lucide-send"
          class="w-[20px] h-[20px]"
        />
        <UIcon
          v-else
          name="i-lucide-mic"
          class="w-[22px] h-[22px]"
        />
      </button>
    </div>

  </div>
</template>
