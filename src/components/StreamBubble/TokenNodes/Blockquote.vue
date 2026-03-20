<!-- src/components/StreamBubble/TokenNodes/Blockquote.vue -->
<template>
  <blockquote class="md-blockquote">
    <component
      :is="getComponent(child.type)"
      v-for="(child, i) in token.children"
      :key="i"
      :token="child"
    />
  </blockquote>
</template>

<script setup lang="ts">
import type { Blockquote } from 'mdast'
import Paragraph from './Paragraph.vue'
import List from './List.vue'

defineProps<{
  token: Blockquote
}>()

function getComponent(type: string) {
  const map: Record<string, any> = {
    paragraph: Paragraph,
    list: List,
  }
  return map[type] || 'div'
}
</script>
