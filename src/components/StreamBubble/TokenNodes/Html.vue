<template>
  <div class="md-html" v-html="safeHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HTML } from 'mdast'
import { sanitizeHtml } from '../../../utils/sanitizeHtml'

const props = defineProps<{
  token: HTML
}>()

const safeHtml = computed(() => sanitizeHtml(props.token.value))
</script>
