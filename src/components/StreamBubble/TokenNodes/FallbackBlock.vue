<!-- src/components/StreamBubble/TokenNodes/FallbackBlock.vue -->
<!-- 未知块级节点的 fallback 渲染：尝试递归渲染子节点或显示文本内容 -->
<template>
  <div class="md-fallback">
    <template v-if="'children' in token && Array.isArray(token.children)">
      <component
        :is="getComponent(child.type)"
        v-for="(child, i) in (token as any).children"
        :key="i"
        :token="child"
      />
    </template>
    <template v-else-if="'value' in token">
      {{ (token as any).value }}
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Nodes } from 'mdast'
import { tokenComponents } from './index'

defineOptions({
  name: 'MdFallbackBlock'
})

defineProps<{
  token: Nodes
}>()

function getComponent(type: string) {
  return tokenComponents[type] || 'MdFallbackBlock'
}
</script>
