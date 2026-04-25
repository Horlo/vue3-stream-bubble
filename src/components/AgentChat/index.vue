<!-- src/components/AgentChat/index.vue -->
<template>
  <div class="agent-chat">
    <div ref="messagesRef" class="agent-chat__messages" @scroll="onScroll">
      <template v-if="messages.length > 0">
        <ChatMessage
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          @complete="(id) => emit('complete', id)"
        >
          <template v-if="$slots.avatar" #avatar="{ message }">
            <slot name="avatar" :message="message" />
          </template>
        </ChatMessage>
      </template>
      <div v-else class="agent-chat__empty">
        <slot name="empty">开始对话吧</slot>
      </div>

      <div v-if="loading" class="agent-chat__loading">
        <slot name="loading">
          <span class="agent-chat__loading-dot" />
          <span class="agent-chat__loading-dot" />
          <span class="agent-chat__loading-dot" />
        </slot>
      </div>
    </div>

    <slot name="input">
      <ChatInput
        v-if="showInput"
        :placeholder="inputPlaceholder"
        :disabled="disabled"
        @send="(content) => emit('send', content)"
      />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import type { AgentChatProps } from './types'

const props = withDefaults(defineProps<AgentChatProps>(), {
  loading: false,
  inputPlaceholder: '输入消息...',
  showInput: true,
  disabled: false
})

const emit = defineEmits<{
  send: [content: string]
  complete: [messageId: string | number]
}>()

defineSlots<{
  avatar?: (props: { message: import('./types').AgentMessage }) => any
  input?: () => any
  loading?: () => any
  empty?: () => any
}>()

const messagesRef = ref<HTMLElement>()
const isNearBottom = ref(true)

const hasStreaming = computed(() => {
  return props.messages.some(m => m.streaming)
})

function onScroll() {
  const el = messagesRef.value
  if (!el) return
  isNearBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 50
}

function scrollToBottom() {
  const el = messagesRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
}

watch(
  () => props.messages,
  () => {
    if (isNearBottom.value || hasStreaming.value) {
      scrollToBottom()
    }
  },
  { deep: true, flush: 'post' }
)

watch(
  () => props.loading,
  (val) => {
    if (val) {
      scrollToBottom()
    }
  },
  { flush: 'post' }
)
</script>

<style>
@import './style.css';
</style>
