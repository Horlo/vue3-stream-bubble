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
import Paragraph from './Paragraph.vue'
import List from './List.vue'

defineOptions({
  name: 'MdListItem'
})

defineProps<{
  token: ListItem
}>()

function getComponent(type: string) {
  const map: Record<string, any> = {
    paragraph: Paragraph,
    list: List, // 支持嵌套列表
  }
  return map[type] || 'span'
}
</script>
