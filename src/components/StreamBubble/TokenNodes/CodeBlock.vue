<!-- src/components/StreamBubble/TokenNodes/CodeBlock.vue -->
<template>
  <pre class="md-code-block"><code :class="languageClass">{{ token.value }}</code></pre>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Code } from 'mdast'

const props = defineProps<{
  token: Code
}>()

const languageClass = computed(() => {
  return props.token.lang ? `language-${props.token.lang}` : ''
})
</script>
