<!-- src/components/AgentChat/ChatInput.vue -->
<template>
  <div class="agent-chat__input-area">
    <div class="agent-chat__input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="agent-chat__textarea"
        :placeholder="placeholder"
        :disabled="disabled"
        rows="1"
        @input="autoResize"
        @keydown.enter.exact.prevent="handleSend"
      />
      <button
        class="agent-chat__send-btn"
        :disabled="disabled || !inputText.trim()"
        @click="handleSend"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: '输入消息...',
  disabled: false
})

const emit = defineEmits<{
  send: [content: string]
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function resetHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text || props.disabled) return
  emit('send', text)
  inputText.value = ''
  resetHeight()
}
</script>
