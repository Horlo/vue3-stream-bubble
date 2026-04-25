# Code Block Syntax Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Shiki-based syntax highlighting to code blocks in the StreamBubble component, out of the box with no user configuration.

**Architecture:** A lazy-initialized Shiki singleton (`highlighter.ts`) using `shiki/core` with the JavaScript regex engine provides a `highlightCode()` function. `CodeBlock.vue` watches token changes with a 150ms debounce — plain text during streaming, highlighted HTML once content stabilizes.

**Tech Stack:** Shiki (fine-grained imports from `shiki/core`, `shiki/engine/javascript`, `@shikijs/langs-*`, `@shikijs/themes/github-dark`), Vue 3 Composition API

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `package.json` | Modify | Add `shiki` dependency |
| `src/utils/highlighter.ts` | Create | Lazy Shiki singleton, `highlightCode()` function |
| `src/components/StreamBubble/TokenNodes/CodeBlock.vue` | Modify | Replace plain text with Shiki-highlighted output |
| `src/components/StreamBubble/style.css` | Modify | Remove hardcoded code block colors |

---

### Task 1: Install Shiki dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install shiki**

Run: `cd D:/ai/project/vue3-stream-bubble && npm install shiki`

This adds `shiki` to `dependencies` in `package.json`. Shiki is a single package — fine-grained imports (`shiki/core`, `shiki/engine/javascript`, `@shikijs/langs-*`, `@shikijs/themes-*`) are all resolved from within it.

- [ ] **Step 2: Verify package.json updated**

Run: `cat D:/ai/project/vue3-stream-bubble/package.json`
Expected: `shiki` appears in `dependencies`

- [ ] **Step 3: Commit**

```bash
cd D:/ai/project/vue3-stream-bubble
git add package.json package-lock.json
git commit -m "chore: add shiki dependency for code block highlighting"
```

---

### Task 2: Create highlighter utility

**Files:**
- Create: `src/utils/highlighter.ts`

- [ ] **Step 1: Write highlighter.ts**

```typescript
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { HighlighterCore } from 'shiki/core'

const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'css',
  'html',
  'json',
  'bash',
  'java',
  'cpp',
  'go',
  'rust',
  'sql',
  'markdown',
] as const

type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number]

const langImportMap: Record<SupportedLang, () => Promise<any>> = {
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  python: () => import('@shikijs/langs/python'),
  css: () => import('@shikijs/langs/css'),
  html: () => import('@shikijs/langs/html'),
  json: () => import('@shikijs/langs/json'),
  bash: () => import('@shikijs/langs/bash'),
  java: () => import('@shikijs/langs/java'),
  cpp: () => import('@shikijs/langs/cpp'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  sql: () => import('@shikijs/langs/sql'),
  markdown: () => import('@shikijs/langs/markdown'),
}

let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('@shikijs/themes/github-dark')],
      langs: SUPPORTED_LANGUAGES.map((lang) => langImportMap[lang]),
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}

function isSupported(lang: string | null | undefined): lang is SupportedLang {
  return !!lang && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
}

function plainHtml(code: string): string {
  return `<pre class="md-code-block"><code>${escapeHtml(code)}</code></pre>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function highlightCode(code: string, lang: string | null | undefined): Promise<string> {
  if (typeof window === 'undefined') {
    return plainHtml(code)
  }

  if (!isSupported(lang)) {
    return plainHtml(code)
  }

  try {
    const shiki = await getHighlighter()
    return shiki.codeToHtml(code, {
      lang,
      theme: 'github-dark',
    })
  } catch {
    return plainHtml(code)
  }
}
```

Key points:
- `createHighlighterCore` from `shiki/core` with JS regex engine (no WASM)
- Languages imported individually from `@shikijs/langs-*` — tree-shakeable
- Theme from `@shikijs/themes/github-dark`
- SSR guard: `typeof window === 'undefined'` returns plain text
- Unsupported language → plain text
- Error fallback → plain text
- Singleton: `highlighterPromise` cached after first call

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd D:/ai/project/vue3-stream-bubble && npx vue-tsc --noEmit`
Expected: No errors related to `highlighter.ts`

- [ ] **Step 3: Commit**

```bash
cd D:/ai/project/vue3-stream-bubble
git add src/utils/highlighter.ts
git commit -m "feat: add Shiki highlighter utility with lazy singleton"
```

---

### Task 3: Update CodeBlock.vue to use highlighter

**Files:**
- Modify: `src/components/StreamBubble/TokenNodes/CodeBlock.vue`

- [ ] **Step 1: Rewrite CodeBlock.vue**

Current file content (to be replaced):

```vue
<!-- src/components/StreamBubble/TokenNodes/CodeBlock.vue -->
<template>
  <pre class="md-code-block"><code :class="languageClass">{{ token.value }}</code></pre>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Code } from 'mdast'

const props = defineProps<{
  token: Code
}>()

const languageClass = computed(() => {
  return props.token.lang ? `language-${props.token.lang}` : ''
})
</script>
```

Replace with:

```vue
<template>
  <!-- Highlighted output from Shiki -->
  <div v-if="highlightedHtml" class="md-code-block" v-html="highlightedHtml" />
  <!-- Plain text fallback during streaming or before highlighter loads -->
  <pre v-else class="md-code-block"><code>{{ token.value }}</code></pre>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { Code } from 'mdast'
import { highlightCode } from '../../../utils/highlighter'

const HIGHLIGHT_DEBOUNCE_MS = 150

const props = defineProps<{
  token: Code
}>()

const highlightedHtml = ref<string | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let disposed = false

watch(
  () => [props.token.value, props.token.lang],
  () => {
    highlightedHtml.value = null
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (disposed) return
      highlightedHtml.value = await highlightCode(props.token.value, props.token.lang)
    }, HIGHLIGHT_DEBOUNCE_MS)
  },
  { immediate: true }
)

onUnmounted(() => {
  disposed = true
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
```

Key points:
- `highlightedHtml` starts as `null` → plain text shows immediately
- Watch on `[token.value, token.lang]` with `immediate: true`
- On any change: reset `highlightedHtml` to null, debounce 150ms, then highlight
- Shiki output is a complete `<pre><code>...</code></pre>` — wrapped in a `<div>` with `v-html` for the highlighted case; plain `<pre>` for the fallback
- `disposed` flag prevents state updates after unmount

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd D:/ai/project/vue3-stream-bubble && npx vue-tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd D:/ai/project/vue3-stream-bubble
git add src/components/StreamBubble/TokenNodes/CodeBlock.vue
git commit -m "feat: integrate Shiki highlighting into CodeBlock component"
```

---

### Task 4: Update CSS for Shiki output

**Files:**
- Modify: `src/components/StreamBubble/style.css`

- [ ] **Step 1: Update .md-code-block styles**

In `style.css`, find the `.md-code-block` rule (lines 69-79) and the `.md-code-block code` rule (lines 81-85).

Current:
```css
.md-code-block {
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.md-code-block code {
  background: none;
  padding: 0;
  font-family: inherit;
}
```

Replace with:
```css
.md-code-block {
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #1f2937;
  color: #e5e7eb;
}

.md-code-block pre {
  margin: 0;
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.md-code-block code {
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}
```

Changes:
- Moved `background` and `color` to end of `.md-code-block` as fallback defaults — Shiki's inline styles override them when highlighted; plain text fallback still gets dark styling
- Added `.md-code-block pre` rule to reset Shiki's inner `<pre>` (Shiki generates its own `<pre>` with background/padding that we want to neutralize so the outer wrapper controls layout)
- `.md-code-block code` now also inherits `font-size` and `line-height`

- [ ] **Step 2: Verify build succeeds**

Run: `cd D:/ai/project/vue3-stream-bubble && npm run build`
Expected: Build completes without errors

- [ ] **Step 3: Commit**

```bash
cd D:/ai/project/vue3-stream-bubble
git add src/components/StreamBubble/style.css
git commit -m "style: update code block CSS for Shiki compatibility"
```

---

### Task 5: Build verification and final commit

- [ ] **Step 1: Run full build**

Run: `cd D:/ai/project/vue3-stream-bubble && npm run build`
Expected: Build succeeds, `dist/` contains updated files

- [ ] **Step 2: Verify dist output includes shiki**

Run: `ls -la D:/ai/project/vue3-stream-bubble/dist/`
Expected: `index.mjs`, `index.umd.js`, `style.css` all present

- [ ] **Step 3: Verify no type errors**

Run: `cd D:/ai/project/vue3-stream-bubble && npx vue-tsc --noEmit`
Expected: No errors
