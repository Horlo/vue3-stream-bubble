<template>
  <component :is="isHeader ? 'th' : 'td'">
    <MdText v-for="(child, i) in token.children" :key="i" :token="child" />
  </component>
</template>

<script setup lang="ts">
import type { TableCell as TableCellType } from 'mdast'
import MdText from './Text.vue'

defineProps<{
  token: TableCellType
  isHeader: boolean
}>()
</script>
