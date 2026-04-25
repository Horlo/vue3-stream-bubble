<template>
  <!-- Highlighted output from Shiki -->
  <div v-if="highlightedHtml" class="md-code-block" v-html="highlightedHtml" />
  <!-- Plain text fallback during streaming or before highlighter loads -->
  <pre v-else class="md-code-block"><code>{{ token.value }}</code></pre>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { Code } from 'mdast'
import { highlightCode } from '../../../utils/highlighter'

const HIGHLIGHT_DEBOUNCE_MS = 150

const props = defineProps<{
  token: Code
}>()

const highlightedHtml = ref<string | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let disposed = false

watch(
  () => [props.token.value, props.token.lang],
  () => {
    highlightedHtml.value = null
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (disposed) return
      highlightedHtml.value = await highlightCode(props.token.value, props.token.lang)
    }, HIGHLIGHT_DEBOUNCE_MS)
  },
  { immediate: true }
)

onUnmounted(() => {
  disposed = true
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
