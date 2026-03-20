<!-- src/components/StreamBubble/TokenNodes/Paragraph.vue -->
<template>
  <p class="md-paragraph">
    <MdText
      v-for="(child, i) in token.children"
      :key="i"
      :token="child"
    />
  </p>
</template>

<script setup lang="ts">
import type { Paragraph } from 'mdast'
import MdText from './Text.vue'

defineProps<{
  token: Paragraph
}>()
</script>
