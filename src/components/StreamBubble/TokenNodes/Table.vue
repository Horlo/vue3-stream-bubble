<template>
  <div class="md-table-wrapper">
    <table class="md-table">
      <thead v-if="token.children.length > 0">
        <MdTableRow
          :token="token.children[0]"
          :is-header="true"
        />
      </thead>
      <tbody v-if="token.children.length > 1">
        <MdTableRow
          v-for="(row, i) in token.children.slice(1)"
          :key="i"
          :token="row"
          :is-header="false"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Table } from 'mdast'
import MdTableRow from './TableRow.vue'

defineProps<{
  token: Table
}>()
</script>
