<template>
  <tr>
    <MdTableCell
      v-for="(cell, i) in token.children"
      :key="i"
      :token="cell"
      :is-header="isHeader"
    />
  </tr>
</template>

<script setup lang="ts">
import type { TableRow as TableRowType } from 'mdast'
import MdTableCell from './TableCell.vue'

defineProps<{
  token: TableRowType
  isHeader: boolean
}>()
</script>
