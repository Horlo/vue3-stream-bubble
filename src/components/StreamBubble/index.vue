<!-- src/components/StreamBubble/index.vue -->
<template>
  <div
    class="stream-bubble"
    :class="bubbleClass"
  >
    <div class="stream-bubble__content">
      <MdRenderer
        :content="content"
        :streaming="effectiveStreaming"
        @complete="onComplete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MdRenderer from './MdRenderer.vue'
import type { StreamBubbleProps } from './types'

const props = withDefaults(defineProps<StreamBubbleProps>(), {
  streaming: false
})

const emit = defineEmits<{
  complete: []
}>()

// 用户角色不支持流式动画
const effectiveStreaming = computed(() => {
  return props.role === 'ai' && props.streaming
})

const bubbleClass = computed(() => ({
  'stream-bubble--ai': props.role === 'ai',
  'stream-bubble--user': props.role === 'user'
}))

function onComplete() {
  emit('complete')
  props.onComplete?.()
}
</script>

<style>
@import './style.css';
</style>
