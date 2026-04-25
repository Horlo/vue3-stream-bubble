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
import { computed, ref, watch, onUnmounted } from 'vue'
import { parseMarkdown } from '../../utils/tokenParser'
import { generateTokenKey } from '../../utils/keyGenerator'
import { tokenComponents } from './TokenNodes'
import FallbackBlock from './TokenNodes/FallbackBlock.vue'
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
let animationTimer: ReturnType<typeof setTimeout> | null = null
let disposed = false

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

// 监听 token 变化，更新 prevKeys（仅负责动画逻辑，不触发 complete）
watch(tokensWithKey, (newTokens) => {
  const currentKeys = new Set(newTokens.map(t => t.key))

  // 如果是非流式状态，立即显示所有（无动画）
  if (!props.streaming) {
    prevKeys.value = currentKeys
    return
  }

  // 流式状态：延迟更新 prevKeys，让新 token 先触发动画
  if (animationTimer) clearTimeout(animationTimer)
  animationTimer = setTimeout(() => {
    if (disposed) return
    prevKeys.value = currentKeys
    animationTimer = null
  }, 150) // 匹配动画时长
}, { immediate: true })

// 统一在 streaming watcher 中触发 complete，避免双重/过度触发
watch(
  () => props.streaming,
  (newVal) => {
    if (newVal === false) {
      // 非流式初始渲染 或 streaming 结束，同步 keys 并触发 complete
      prevKeys.value = new Set(tokensWithKey.value.map(t => t.key))
      emit('complete')
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  disposed = true
  if (animationTimer) {
    clearTimeout(animationTimer)
    animationTimer = null
  }
})

function getComponent(type: string) {
  return tokenComponents[type] || FallbackBlock
}
</script>
