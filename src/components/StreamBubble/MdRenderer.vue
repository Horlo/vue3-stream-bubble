<!-- src/components/StreamBubble/MdRenderer.vue -->
<template>
  <div class="md-renderer">
    <component
      :is="getComponent(token.token.type)"
      v-for="token in tokensWithKey"
      :key="token.key"
      :token="token.token"
      class="md-token"
      :class="{ 'md-token-new': isNewToken(token.key) }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { parseMarkdown } from '../../utils/tokenParser'
import { generateTokenKey } from '../../utils/keyGenerator'
import { tokenComponents } from './TokenNodes'
import type { MarkdownToken } from './types'

const props = defineProps<{
  content: string
  streaming?: boolean
}>()

const emit = defineEmits<{
  complete: []
}>()

// 记录上一次的 token keys 用于判断新 token
const prevKeys = ref<Set<string>>(new Set())

const tokensWithKey = computed(() => {
  const tokens = parseMarkdown(props.content)
  return tokens.map((token, index) => ({
    token,
    key: generateTokenKey(token as MarkdownToken, index)
  }))
})

// 判断是否是新 token（用于动画）
function isNewToken(key: string): boolean {
  return !prevKeys.value.has(key)
}

// 监听 token 变化，更新 prevKeys
watch(tokensWithKey, (newTokens) => {
  const currentKeys = new Set(newTokens.map(t => t.key))

  // 如果是非流式状态，立即显示所有（无动画）
  if (!props.streaming) {
    prevKeys.value = currentKeys
    emit('complete')
    return
  }

  // 流式状态：延迟更新 prevKeys，让新 token 先触发动画
  setTimeout(() => {
    prevKeys.value = currentKeys
  }, 150) // 匹配动画时长
}, { immediate: true })

function getComponent(type: string) {
  return tokenComponents[type] || 'div'
}
</script>
