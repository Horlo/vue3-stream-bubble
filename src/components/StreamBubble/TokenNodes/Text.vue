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
    <a :href="token.url" :title="token.title || undefined" target="_blank" rel="noopener noreferrer">
      <MdText v-for="(child, i) in token.children" :key="i" :token="child" />
    </a>
  </template>
  <template v-else-if="token.type === 'inlineCode'">
    <code class="md-inline-code">{{ token.value }}</code>
  </template>
  <template v-else-if="token.type === 'break'">
    <br />
  </template>
  <template v-else-if="token.type === 'delete'">
    <del>
      <MdText v-for="(child, i) in token.children" :key="i" :token="child" />
    </del>
  </template>
  <template v-else-if="token.type === 'image'">
    <img :src="token.url" :alt="token.alt || ''" :title="token.title || undefined" class="md-image" />
  </template>
  <template v-else-if="token.type === 'html'">
    <span class="md-inline-html" v-html="safeInlineHtml" />
  </template>
  <!-- 未知行内节点 fallback：尝试渲染子节点或文本内容 -->
  <template v-else>
    <template v-if="'children' in token && token.children">
      <MdText v-for="(child, i) in (token as any).children" :key="i" :token="child" />
    </template>
    <template v-else-if="'value' in token">
      {{ (token as any).value }}
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Nodes } from 'mdast'
import MdText from './Text.vue'
import { sanitizeHtml } from '../../../utils/sanitizeHtml'

const props = defineProps<{
  token: Nodes
}>()

const safeInlineHtml = computed(() => {
  if (props.token.type === 'html' && 'value' in props.token) {
    return sanitizeHtml((props.token as any).value)
  }
  return ''
})
</script>
