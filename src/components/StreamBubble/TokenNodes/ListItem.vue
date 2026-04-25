<!-- src/components/StreamBubble/TokenNodes/ListItem.vue -->
<template>
  <li class="md-list-item">
    <component
      :is="getComponent(child.type)"
      v-for="(child, i) in token.children"
      :key="i"
      :token="child"
    />
  </li>
</template>

<script setup lang="ts">
import type { ListItem } from 'mdast'
import { tokenComponents } from './index'
import FallbackBlock from './FallbackBlock.vue'

defineOptions({
  name: 'MdListItem'
})

defineProps<{
  token: ListItem
}>()

function getComponent(type: string) {
  return tokenComponents[type] || FallbackBlock
}
</script>
