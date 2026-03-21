# StreamBubble 组件库实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use @superpowers:subagent-driven-development (recommended) or @superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Vue3 流式气泡组件库，支持 Markdown Token 渲染，利用 key 驱动最小 DOM 更新

**Architecture:** 使用 remark 解析 Markdown 为 Token 列表，每个 Token 生成 line+hash 的 stable key，通过 Vue v-for 渲染。流式输入时新 Token 淡入显示，依赖 Vue 的 key diff 机制实现最小更新。

**Tech Stack:** Vue3 + TypeScript + Vite + remark + unified

---

## 文件结构

```
vue3-stream-bubble/
├── src/
│   ├── components/
│   │   └── StreamBubble/
│   │       ├── index.vue          # 主组件（入口）
│   │       ├── MdRenderer.vue     # Markdown Token 渲染器
│   │       ├── TokenNodes/        # Token 类型组件
│   │       │   ├── Paragraph.vue
│   │       │   ├── CodeBlock.vue
│   │       │   ├── Heading.vue
│   │       │   ├── List.vue       # 包含 ListItem 渲染
│   │       │   ├── Blockquote.vue
│   │       │   ├── Text.vue       # 包含 inlineCode 处理
│   │       │   └── index.ts       # 导出所有 Token 组件
│   │       ├── types.ts           # TypeScript 类型定义
│   │       └── style.css          # 组件样式
│   ├── utils/
│   │   ├── tokenParser.ts         # Markdown Token 解析器
│   │   └── keyGenerator.ts        # Token key 生成器
│   ├── index.ts                   # 组件库入口
│   └── vite-env.d.ts              # Vite 类型声明
├── docs/
│   └── demo.html                  # 演示页面
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Task 1: 项目初始化和配置

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `README.md`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "vue3-stream-bubble",
  "version": "1.0.0",
  "description": "Vue3 流式气泡组件库，支持 Markdown 渲染",
  "type": "module",
  "main": "./dist/index.umd.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.umd.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "vue-tsc && vite build",
    "dev": "vite"
  },
  "peerDependencies": {
    "vue": "^3.3.0"
  },
  "dependencies": {
    "remark": "^15.0.0",
    "unified": "^11.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-dts": "^3.0.0",
    "vue": "^3.4.0",
    "vue-tsc": "^1.8.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationDir": "./dist"
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.spec.ts']
    })
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'Vue3StreamBubble',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'umd.js'}`,
      formats: ['es', 'umd']
    },
    cssCodeSplit: true, // 提取 CSS 到单独文件
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
```

- [ ] **Step 5: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

- [ ] **Step 6: 创建基础 README.md**

```markdown
# Vue3 Stream Bubble

Vue3 流式气泡组件库，支持 Markdown 渲染。

## 安装

```bash
npm install vue3-stream-bubble
```

## 使用

```vue
<script setup>
import { StreamBubble } from 'vue3-stream-bubble'
</script>

<template>
  <StreamBubble content="Hello **world**" role="ai" />
</template>
```

## 许可证

MIT
```

- [ ] **Step 7: 安装依赖**

Run: `npm install`

Expected: 成功安装所有依赖

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts src/vite-env.d.ts README.md
git commit -m "chore: initialize project with vite + vue3 + ts"
```

---

## Task 2: 类型定义和工具函数

**Files:**
- Create: `src/components/StreamBubble/types.ts`
- Create: `src/utils/keyGenerator.ts`
- Create: `src/utils/tokenParser.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
// src/components/StreamBubble/types.ts
import type { Nodes } from 'mdast'

export interface StreamBubbleProps {
  /** 完整内容文本（支持 Markdown） */
  content: string
  /** 角色类型，决定位置和颜色 */
  role: 'ai' | 'user'
  /** 是否正在流式输出 */
  streaming?: boolean
  /** 流式输出结束时的回调 */
  onComplete?: () => void
}

export type MarkdownToken = Nodes

export interface TokenWithKey {
  token: MarkdownToken
  key: string
}
```

- [ ] **Step 2: 创建 key 生成器**

```typescript
// src/utils/keyGenerator.ts
import type { Nodes } from 'mdast'

/**
 * 简单 hash 函数
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * 获取 token 的文本内容
 */
function getTokenContent(token: Nodes): string {
  if ('value' in token && typeof token.value === 'string') {
    return token.value
  }
  if ('children' in token && Array.isArray(token.children)) {
    return token.children.map(getTokenContent).join('')
  }
  return ''
}

/**
 * 为 token 生成稳定的 key
 * 格式: {line}-{hash}
 */
export function generateTokenKey(token: Nodes, index: number): string {
  const line = token.position?.start?.line ?? index
  const content = getTokenContent(token)
  const hash = simpleHash(content).slice(0, 8)
  return `${line}-${hash}`
}
```

- [ ] **Step 3: 创建 token 解析器**

```typescript
// src/utils/tokenParser.ts
import { remark } from 'remark'
import type { Root, Nodes } from 'mdast'

/**
 * 解析 Markdown 文本为 token 列表
 */
export function parseMarkdown(content: string): Nodes[] {
  if (!content.trim()) return []

  const tree = remark().parse(content) as Root
  return tree.children || []
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/StreamBubble/types.ts src/utils/keyGenerator.ts src/utils/tokenParser.ts
git commit -m "feat: add types and utility functions"
```

---

## Task 3: Token 节点组件

**Files:**
- Create: `src/components/StreamBubble/TokenNodes/Text.vue`
- Create: `src/components/StreamBubble/TokenNodes/index.ts`

- [ ] **Step 1: 创建 Text 组件**

```vue
<!-- src/components/StreamBubble/TokenNodes/Text.vue -->
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
```

- [ ] **Step 2: 创建 TokenNodes 入口（临时，仅导出 Text）**

```typescript
// src/components/StreamBubble/TokenNodes/index.ts
import Text from './Text.vue'

// 临时导出，其他组件将在后续任务中添加
export const tokenComponents: Record<string, any> = {}

export { Text }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StreamBubble/TokenNodes/
git commit -m "feat: add Text and TokenNodes index"
```

---

## Task 4: 块级 Token 组件

**Files:**
- Create: `src/components/StreamBubble/TokenNodes/Paragraph.vue`
- Create: `src/components/StreamBubble/TokenNodes/CodeBlock.vue`
- Create: `src/components/StreamBubble/TokenNodes/Heading.vue`

- [ ] **Step 1: 创建 Paragraph 组件**

```vue
<!-- src/components/StreamBubble/TokenNodes/Paragraph.vue -->
<template>
  <p class="md-paragraph">
    <MdText
      v-for="(child, i) in token.children"
      :key="i"
      :token="child"
    />
  </p>
</template>

<script setup lang="ts">
import type { Paragraph } from 'mdast'
import MdText from './Text.vue'

defineProps<{
  token: Paragraph
}>()
</script>
```

- [ ] **Step 2: 创建 CodeBlock 组件**

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

- [ ] **Step 3: 创建 Heading 组件**

```vue
<!-- src/components/StreamBubble/TokenNodes/Heading.vue -->
<template>
  <component :is="tag" class="md-heading">
    <MdText
      v-for="(child, i) in token.children"
      :key="i"
      :token="child"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Heading } from 'mdast'
import MdText from './Text.vue'

const props = defineProps<{
  token: Heading
}>()

const tag = computed(() => `h${props.token.depth}` as const)
</script>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/StreamBubble/TokenNodes/
git commit -m "feat: add Paragraph, CodeBlock, Heading components"
```

---

## Task 5: List 和 Blockquote 组件

**Files:**
- Create: `src/components/StreamBubble/TokenNodes/List.vue`
- Create: `src/components/StreamBubble/TokenNodes/ListItem.vue`
- Create: `src/components/StreamBubble/TokenNodes/Blockquote.vue`
- Modify: `src/components/StreamBubble/TokenNodes/index.ts`

- [ ] **Step 1: 创建 List 组件**

```vue
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
```

- [ ] **Step 2: 创建 ListItem 组件**

```vue
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
```

- [ ] **Step 3: 创建 Blockquote 组件**

```vue
<!-- src/components/StreamBubble/TokenNodes/Blockquote.vue -->
<template>
  <blockquote class="md-blockquote">
    <component
      :is="getComponent(child.type)"
      v-for="(child, i) in token.children"
      :key="i"
      :token="child"
    />
  </blockquote>
</template>

<script setup lang="ts">
import type { Blockquote } from 'mdast'
import Paragraph from './Paragraph.vue'
import List from './List.vue'

defineProps<{
  token: Blockquote
}>()

function getComponent(type: string) {
  const map: Record<string, any> = {
    paragraph: Paragraph,
    list: List,
  }
  return map[type] || 'div'
}
</script>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/StreamBubble/TokenNodes/
git commit -m "feat: add List and Blockquote components"
```

- [ ] **Step 5: 更新 TokenNodes 入口（添加所有组件）**

```typescript
// src/components/StreamBubble/TokenNodes/index.ts
import Paragraph from './Paragraph.vue'
import CodeBlock from './CodeBlock.vue'
import Heading from './Heading.vue'
import List from './List.vue'
import ListItem from './ListItem.vue'
import Blockquote from './Blockquote.vue'
import Text from './Text.vue'

export const tokenComponents: Record<string, any> = {
  paragraph: Paragraph,
  code: CodeBlock,
  heading: Heading,
  list: List,
  blockquote: Blockquote,
}

export { Paragraph, CodeBlock, Heading, List, ListItem, Blockquote, Text }

// 注意：inlineCode 在 Text.vue 中处理；listItem 不注册为独立组件（只在 List 内部使用）
```

- [ ] **Step 6: Commit**

```bash
git add src/components/StreamBubble/TokenNodes/index.ts
git commit -m "feat: complete TokenNodes index with all components"
```

---

## Task 6: MdRenderer 和样式

**Files:**
- Create: `src/components/StreamBubble/MdRenderer.vue`
- Create: `src/components/StreamBubble/style.css`

- [ ] **Step 1: 创建 MdRenderer 组件**

```vue
<!-- src/components/StreamBubble/MdRenderer.vue -->
<template>
  <div class="md-renderer">
    <component
      :is="getComponent(token.token.type)"
      v-for="token in tokensWithKey"
      :key="token.key"
      :token="token.token"
      class="md-token"
      :class="{ 'md-token-new': isNewToken(token.key) }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { parseMarkdown } from '../../utils/tokenParser'
import { generateTokenKey } from '../../utils/keyGenerator'
import { tokenComponents } from './TokenNodes'
import type { MarkdownToken } from './types'

const props = defineProps<{
  content: string
  streaming?: boolean
}>()

const emit = defineEmits<{
  complete: []
}>()

// 记录上一次的 token keys 用于判断新 token
const prevKeys = ref<Set<string>>(new Set())

const tokensWithKey = computed(() => {
  const tokens = parseMarkdown(props.content)
  return tokens.map((token, index) => ({
    token,
    key: generateTokenKey(token as MarkdownToken, index)
  }))
})

// 判断是否是新 token（用于动画）
function isNewToken(key: string): boolean {
  return !prevKeys.value.has(key)
}

// 监听 token 变化，更新 prevKeys
watch(tokensWithKey, (newTokens) => {
  const currentKeys = new Set(newTokens.map(t => t.key))

  // 如果是非流式状态，立即显示所有（无动画）
  if (!props.streaming) {
    prevKeys.value = currentKeys
    emit('complete')
    return
  }

  // 流式状态：延迟更新 prevKeys，让新 token 先触发动画
  setTimeout(() => {
    prevKeys.value = currentKeys
  }, 150) // 匹配动画时长
}, { immediate: true })

function getComponent(type: string) {
  return tokenComponents[type] || 'div'
}
</script>
```

- [ ] **Step 2: 创建样式**

```css
/* src/components/StreamBubble/style.css */

/* ========== StreamBubble 主容器 ========== */
.stream-bubble {
  display: flex;
  width: 100%;
  margin-bottom: 8px;
}

.stream-bubble--ai {
  justify-content: flex-start;
}

.stream-bubble--user {
  justify-content: flex-end;
}

/* ========== 气泡内容区 ========== */
.stream-bubble__content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.stream-bubble--ai .stream-bubble__content {
  background: #f3f4f6;
  color: #1f2937;
  border-top-left-radius: 4px;
}

.stream-bubble--user .stream-bubble__content {
  background: #3b82f6;
  color: #ffffff;
  border-top-right-radius: 4px;
}

/* ========== Markdown 渲染器 ========== */
.md-renderer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ========== Token 淡入动画 ========== */
@keyframes md-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.md-token-new {
  animation: md-fade-in 150ms ease-out;
}

/* ========== 段落 ========== */
.md-paragraph {
  margin: 0;
}

/* ========== 代码块 ========== */
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

/* ========== 行内代码 ========== */
.md-inline-code {
  background: rgba(0, 0, 0, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
}

.stream-bubble--user .md-inline-code {
  background: rgba(255, 255, 255, 0.2);
}

/* ========== 标题 ========== */
h1.md-heading, h2.md-heading, h3.md-heading,
h4.md-heading, h5.md-heading, h6.md-heading {
  margin: 0;
  font-weight: 600;
}

h1.md-heading { font-size: 1.5em; }
h2.md-heading { font-size: 1.3em; }
h3.md-heading { font-size: 1.15em; }
h4.md-heading, h5.md-heading, h6.md-heading { font-size: 1em; }

/* ========== 列表 ========== */
.md-list {
  margin: 0;
  padding-left: 20px;
}

.md-list-item {
  margin: 4px 0;
}

/* ========== 引用块 ========== */
.md-blockquote {
  margin: 0;
  padding-left: 12px;
  border-left: 3px solid #d1d5db;
  color: #6b7280;
}

.stream-bubble--user .md-blockquote {
  border-left-color: rgba(255, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.8);
}

/* ========== 链接 ========== */
.md-renderer a {
  color: #3b82f6;
  text-decoration: underline;
}

.stream-bubble--user .md-renderer a {
  color: #bfdbfe;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StreamBubble/MdRenderer.vue src/components/StreamBubble/style.css
git commit -m "feat: add MdRenderer and styles"
```

---

## Task 7: StreamBubble 主组件

**Files:**
- Create: `src/components/StreamBubble/index.vue`

- [ ] **Step 1: 创建主组件**

```vue
<!-- src/components/StreamBubble/index.vue -->
<template>
  <div
    class="stream-bubble"
    :class="bubbleClass"
  >
    <div class="stream-bubble__content">
      <MdRenderer
        :content="content"
        :streaming="effectiveStreaming"
        @complete="onComplete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MdRenderer from './MdRenderer.vue'
import type { StreamBubbleProps } from './types'

const props = withDefaults(defineProps<StreamBubbleProps>(), {
  streaming: false
})

const emit = defineEmits<{
  complete: []
}>()

// 用户角色不支持流式动画
const effectiveStreaming = computed(() => {
  return props.role === 'ai' && props.streaming
})

const bubbleClass = computed(() => ({
  'stream-bubble--ai': props.role === 'ai',
  'stream-bubble--user': props.role === 'user'
}))

function onComplete() {
  emit('complete')
  props.onComplete?.()
}
</script>

<style>
@import './style.css';
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StreamBubble/index.vue
git commit -m "feat: add StreamBubble main component"
```

---

## Task 8: 组件库入口

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: 创建入口文件**

```typescript
// src/index.ts
import StreamBubble from './components/StreamBubble/index.vue'

export { StreamBubble }
export default StreamBubble

// 类型导出
export type { StreamBubbleProps, MarkdownToken, TokenWithKey } from './components/StreamBubble/types'
```

- [ ] **Step 2: Commit**

```bash
git add src/index.ts
git commit -m "feat: add library entry point"
```

---

## Task 9: 演示页面

**Files:**
- Create: `docs/demo.html`

- [ ] **Step 1: 创建演示页面**

```html
<!-- docs/demo.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue3 Stream Bubble Demo</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="../dist/index.umd.js"></script>
  <link rel="stylesheet" href="../dist/style.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f9fafb;
    }
    .chat-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      min-height: 400px;
    }
    .controls {
      margin: 20px 0;
      display: flex;
      gap: 10px;
    }
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      background: #3b82f6;
      color: white;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover {
      background: #2563eb;
    }
    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    h1 {
      text-align: center;
      color: #1f2937;
    }
  </style>
</head>
<body>
  <div id="app">
    <h1>Vue3 Stream Bubble Demo</h1>

    <div class="controls">
      <button @click="startAI" :disabled="isStreaming">开始 AI 回复</button>
      <button @click="addUser">添加用户消息</button>
      <button @click="reset">重置</button>
    </div>

    <div class="chat-container">
      <stream-bubble
        v-for="(msg, i) in messages"
        :key="i"
        :content="msg.content"
        :role="msg.role"
        :streaming="msg.streaming"
        @complete="onComplete(i)"
      />
    </div>
  </div>

  <script>
    const { createApp, ref } = Vue

    // UMD 构建的组件挂载到全局
    const StreamBubble = window.Vue3StreamBubble?.default || window.Vue3StreamBubble

    const sampleMarkdown = `# 欢迎使用 StreamBubble

这是一个**流式气泡组件**，支持 Markdown 渲染。

## 功能特点

- 支持 *斜体* 和 **粗体**
- 支持 \`inline code\`
- 支持代码块：

\`\`\`javascript
const greeting = "Hello World";
console.log(greeting);
\`\`\`

> 这是一个引用块

1. 有序列表项 1
2. 有序列表项 2

- 无序列表项
- 另一个列表项

[链接示例](https://example.com)`

    createApp({
      setup() {
        const messages = ref([])
        const isStreaming = ref(false)

        function startAI() {
          isStreaming.value = true
          messages.value.push({
            role: 'ai',
            content: '',
            streaming: true
          })

          let index = 0
          const interval = setInterval(() => {
            if (index >= sampleMarkdown.length) {
              clearInterval(interval)
              const lastMsg = messages.value[messages.value.length - 1]
              if (lastMsg.role === 'ai') {
                lastMsg.streaming = false
              }
              isStreaming.value = false
              return
            }

            const lastMsg = messages.value[messages.value.length - 1]
            lastMsg.content += sampleMarkdown[index]
            index++
          }, 30)
        }

        function addUser() {
          messages.value.push({
            role: 'user',
            content: '你好！请介绍一下这个功能。',
            streaming: false
          })
        }

        function reset() {
          messages.value = []
          isStreaming.value = false
        }

        function onComplete(index) {
          console.log('消息', index, '流式显示完成')
        }

        return {
          messages,
          isStreaming,
          startAI,
          addUser,
          reset,
          onComplete
        }
      },
      components: { StreamBubble }
    }).mount('#app')
  </script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add docs/demo.html
git commit -m "feat: add demo page"
```

---

## Task 10: 构建和验证

**Files:**
- Build output: `dist/`

- [ ] **Step 1: 构建组件库**

Run: `npm run build`

Expected: 成功生成 `dist/` 目录，包含:
- `index.mjs`
- `index.umd.js`
- `index.d.ts`
- `style.css` (由 vite.config.ts 中的 cssCodeSplit: true 确保生成)

- [ ] **Step 2: 验证构建输出**

Run: `ls -la dist/`

Expected: 显示所有构建产物

- [ ] **Step 3: 更新 README**

更新 README.md 的 ## 使用 部分为：

```markdown
## 使用

### 基础用法

```vue
<script setup>
import { StreamBubble } from 'vue3-stream-bubble'
</script>

<template>
  <StreamBubble content="Hello **world**" role="ai" />
</template>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| content | string | - | Markdown 内容 |
| role | 'ai' \| 'user' | - | 气泡角色 |
| streaming | boolean | false | 是否流式显示 |
| onComplete | () => void | - | 流式结束回调 |

### 角色说明

- **ai**: 左侧灰色气泡，支持流式动画
- **user**: 右侧蓝色气泡，直接显示全部内容

### 流式数据示例

```vue
<script setup>
import { ref } from 'vue'
const content = ref('')
const streaming = ref(true)

// 模拟流式接收
const interval = setInterval(() => {
  content.value += '新内容 '
  if (content.value.length > 100) {
    streaming.value = false
    clearInterval(interval)
  }
}, 100)
</script>

<template>
  <StreamBubble :content="content" role="ai" :streaming="streaming" />
</template>
```
```

- [ ] **Step 4: Final Commit**

```bash
git add README.md
git commit -m "docs: update README with API docs"
```

注意：dist/ 目录应在 .gitignore 中，不提交到版本控制。

---

## 实施检查清单

- [ ] 所有 TypeScript 类型正确
- [ ] 构建成功无警告
- [ ] 演示页面正常工作
- [ ] AI 气泡流式动画正常
- [ ] 用户气泡无动画直接显示
- [ ] Markdown 渲染正确
- [ ] Key 生成稳定
