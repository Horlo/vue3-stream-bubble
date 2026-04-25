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
import { ref, watch, nextTick } from 'vue'
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

function onScroll() {
  const el = messagesRef.value
  if (!el) return
  isNearBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 50
}

/**
 * 滚动到底部
 */
function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
  nextTick(() => {
    const el = messagesRef.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  })
}

/**
 * 添加一条新消息，并在接近底部时自动滚动
 * @param message - 完整的消息对象
 */
function addMessage(message: import('./types').AgentMessage) {
  props.messages.push(message)
  if (isNearBottom.value) {
    scrollToBottom()
  }
}

/**
 * 根据消息 ID 更新消息内容，并在接近底部时自动滚动
 * 适用于流式场景：父组件每次收到新 chunk 后调用此方法
 * @param id - 消息唯一标识
 * @param patch - 需要更新的字段（支持 content、streaming 等）
 */
function updateMessage(
  id: string | number,
  patch: Partial<Omit<import('./types').AgentMessage, 'id'>>
) {
  const msg = props.messages.find((m) => m.id === id)
  if (msg) {
    Object.assign(msg, patch)
    if (isNearBottom.value) {
      scrollToBottom()
    }
  }
}

// 监听消息数量变化（新增/删除消息），自动滚动到底部
watch(
  () => props.messages.length,
  () => {
    if (isNearBottom.value) {
      scrollToBottom()
    }
  },
  { flush: 'post' }
)

// loading 状态变化时滚动
watch(
  () => props.loading,
  (val) => {
    if (val) {
      scrollToBottom()
    }
  },
  { flush: 'post' }
)

// 暴露方法供父组件调用
defineExpose({ addMessage, updateMessage, scrollToBottom })
</script>

<style>
@import './style.css';
</style>
