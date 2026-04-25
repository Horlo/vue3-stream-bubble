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
import { tokenComponents } from './index'
import FallbackBlock from './FallbackBlock.vue'

defineProps<{
  token: Blockquote
}>()

function getComponent(type: string) {
  return tokenComponents[type] || FallbackBlock
}
</script>
