<!-- src/components/AgentChat/ChatMessage.vue -->
<template>
  <div
    class="agent-chat__message"
    :class="{
      'agent-chat__message--ai': message.role === 'ai',
      'agent-chat__message--user': message.role === 'user'
    }"
  >
    <div class="agent-chat__avatar-wrapper">
      <slot name="avatar" :message="message">
        <img
          v-if="message.avatar"
          :src="message.avatar"
          :alt="message.username || message.role"
          class="agent-chat__avatar-img"
        />
        <div v-else class="agent-chat__avatar-fallback">
          {{ avatarInitial }}
        </div>
      </slot>
      <span v-if="message.username" class="agent-chat__username">
        {{ message.username }}
      </span>
    </div>
    <div class="agent-chat__bubble">
      <StreamBubble
        :content="message.content"
        :role="message.role"
        :streaming="message.streaming"
        @complete="$emit('complete', message.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StreamBubble from '../StreamBubble/index.vue'
import type { AgentMessage } from './types'

const props = defineProps<{
  message: AgentMessage
}>()

defineEmits<{
  complete: [messageId: string | number]
}>()

const avatarInitial = computed(() => {
  if (props.message.username) {
    return props.message.username.charAt(0).toUpperCase()
  }
  return props.message.role === 'ai' ? 'A' : 'U'
})
</script>
