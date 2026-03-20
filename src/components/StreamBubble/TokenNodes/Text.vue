<template>
  <template v-if="token.type === 'text'">
    {{ token.value }}
  </template>
  <template v-else-if="token.type === 'strong'">
    <strong>
      <MdText v-for="(child, i) in token.children" :key="i" :token="child" />
    </strong>
  </template>
  <template v-else-if="token.type === 'emphasis'">
    <em>
      <MdText v-for="(child, i) in token.children" :key="i" :token="child" />
    </em>
  </template>
  <template v-else-if="token.type === 'link'">
    <a :href="token.url" :title="token.title || undefined" target="_blank" rel="noopener">
      <MdText v-for="(child, i) in token.children" :key="i" :token="child" />
    </a>
  </template>
  <template v-else-if="token.type === 'inlineCode'">
    <code class="md-inline-code">{{ token.value }}</code>
  </template>
  <template v-else-if="token.type === 'break'">
    <br />
  </template>
</template>

<script setup lang="ts">
import type { Nodes } from 'mdast'
import MdText from './Text.vue'

defineProps<{
  token: Nodes
}>()
</script>
