<!-- src/components/StreamBubble/TokenNodes/Heading.vue -->
<template>
  <component :is="tag" class="md-heading">
    <MdText
      v-for="(child, i) in token.children"
      :key="i"
      :token="child"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Heading } from 'mdast'
import MdText from './Text.vue'

const props = defineProps<{
  token: Heading
}>()

const tag = computed(() => `h${props.token.depth}` as const)
</script>
