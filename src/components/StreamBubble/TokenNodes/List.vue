<!-- src/components/StreamBubble/TokenNodes/List.vue -->
<template>
  <component :is="listTag" class="md-list">
    <MdListItem
      v-for="(item, i) in token.children"
      :key="i"
      :token="item"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { List } from 'mdast'
import MdListItem from './ListItem.vue'

defineOptions({
  name: 'MdList'
})

const props = defineProps<{
  token: List
}>()

const listTag = computed(() => props.token.ordered ? 'ol' : 'ul')
</script>
