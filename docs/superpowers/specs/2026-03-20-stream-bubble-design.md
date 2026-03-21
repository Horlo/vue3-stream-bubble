# StreamBubble 组件设计文档

## 概述

Vue3 流式气泡组件，用于 AI 对话场景。支持按句子/段落分批动画显示流式内容。

## 设计目标

- 简洁现代的视觉风格
- 支持 AI/用户 两种角色布局
- 纯前端实现，无需后端配合
- 易于集成到 Vue3 项目中

## 组件 Props

```typescript
interface StreamBubbleProps {
  /** 完整内容文本（支持 Markdown） */
  content: string
  /** 角色类型，决定位置和颜色 */
  role: 'ai' | 'user'
  /** 是否正在流式输出。
   * true: 新 Token 淡入显示（150ms 动画）
   * false: 所有 Token 立即显示（无动画），触发 onComplete
   */
  streaming?: boolean
  /** 流式输出结束时的回调（streaming 变为 false 时触发） */
  onComplete?: () => void
}
```

## 视觉设计

### 布局
- AI 气泡：左侧对齐，最大宽度 80%
- 用户气泡：右侧对齐，最大宽度 80%
- 气泡间距：垂直方向 8px

### 颜色方案
- AI 气泡：
  - 背景: `#f3f4f6`
  - 文字: `#1f2937`
  - 边框: 无
- 用户气泡：
  - 背景: `#3b82f6`
  - 文字: `#ffffff`
  - 边框: 无

### 圆角设计
- 全局圆角: `12px`
- AI 气泡: 左上小圆角 (`4px`)
- 用户气泡: 右上小圆角 (`4px`)

## Markdown Token 渲染架构

为避免流式数据导致的频繁 DOM 重渲染，组件采用 **Token 级渲染 + Key 驱动更新** 架构。

### 解析流程

```
content (string)
    ↓
remark-parse → Token[]
    ↓
为每个 Token 生成 stable key
    ↓
Vue v-for 渲染 (依赖 key 做最小更新)
```

### Token 类型支持

| Token 类型 | 渲染方式 | 说明 |
|-----------|---------|------|
| `paragraph` | `<p>` | 普通段落 |
| `code` | `<pre><code>` | 代码块 |
| `inlineCode` | `<code>` | 行内代码 |
| `heading` | `<h1>`-`<h6>` | 标题 |
| `list` / `listItem` | `<ul>`/`<ol>` + `<li>` | 列表 |
| `blockquote` | `<blockquote>` | 引用 |
| `strong` / `emphasis` | `<strong>` / `<em>` | 粗体/斜体 |
| `link` | `<a>` | 链接 |
| `text` | 文本节点 | 纯文本 |

### Key 生成策略

每个 Token 的 `key` 由 **行号 + Token 类型** 组合生成：

```typescript
function generateTokenKey(token: Token, index: number): string {
  const line = token.position?.start?.line ?? index
  return `${line}-${token.type}`
}
```

**设计理由：**

早期方案使用 `{line}-{hash}`（内容哈希），在流式场景下存在问题：同一个 block 的内容随字符追加不断变化，hash 随之变化，导致 key 持续变化，Vue 会频繁卸载并重建节点，动画被反复触发。

改为 `{line}-{type}` 后：
- 同一行的节点类型在流式过程中不会改变，key 保持稳定
- 节点内容更新时 Vue 只做 patch，不重建 DOM
- 淡入动画仅在真正新增 block 时触发，行为符合预期

### Diff 策略：完全替换

每次 `content` 变化时：
1. 重新解析完整 Markdown → 新 Token 列表
2. 直接用新 Token 列表替换旧列表
3. 依赖 Vue 的 `:key` 机制自动做最小 DOM 更新

### 流式输入时的 Token 稳定性

流式输入过程中，未完成的 token（如正在输入的段落）key 保持稳定（行号和类型均不变），Vue 对其做 in-place patch 而非重建：
- 已完成的 block（key 不变）保持静态，不触发动画
- 新增的 block（新 key）触发淡入动画
- 快速输入时无多余的组件重建开销

```typescript
// 伪代码
const tokens = computed(() => {
  return remark().parse(props.content)
})

// 模板中
<component
  v-for="(token, index) in tokens"
  :key="generateTokenKey(token, index)"
  :is="getComponent(token.type)"
  :token="token"
/>
```

### 流式显示动画

Token 渲染后，通过 CSS 控制淡入动画：
- 新出现的 Token（Vue 检测到的新 key）自动触发淡入
- 淡入时长: 150ms
- 使用 CSS `@keyframes` animation 实现，确保新 mount 的组件触发动画

### 角色行为差异

| 角色 | 流式动画 | 说明 |
|------|---------|------|
| `ai` | ✅ 支持 | 新 Token 淡入显示，streaming=false 时立即显示全部 |
| `user` | ❌ 不支持 | 用户消息通常一次性发送，无流式效果，直接显示全部内容 |

**注意：** 当 `role="user"` 且 `streaming=true` 时，组件应忽略 `streaming` 标志，按静态内容处理（直接显示全部）。这是为了处理边界情况，防止意外的动画效果。

### 流式状态切换行为

- 当 `streaming` 从 `true` 变为 `false` 时：
  - 立即显示所有剩余未显示的 Token（无动画）
  - 触发 `onComplete` 回调

## 项目结构

```
vue3-stream-bubble/
├── src/
│   ├── components/
│   │   └── StreamBubble/
│   │       ├── index.vue          # 主组件
│   │       ├── MdRenderer.vue     # Markdown Token 渲染器
│   │       ├── TokenNodes/        # Token 类型组件
│   │       │   ├── Paragraph.vue
│   │       │   ├── CodeBlock.vue
│   │       │   ├── InlineCode.vue
│   │       │   ├── Heading.vue
│   │       │   ├── List.vue
│   │       │   ├── Blockquote.vue
│   │       │   ├── Text.vue
│   │       │   └── index.ts
│   │       ├── types.ts           # TypeScript 类型定义
│   │       └── style.css          # 组件样式
│   ├── utils/
│   │   ├── tokenParser.ts         # Markdown Token 解析器
│   │   └── keyGenerator.ts        # Token key 生成器
│   ├── index.ts                   # 组件库入口
│   └── vite-env.d.ts              # Vite 类型声明
├── docs/
│   └── demo.html              # 演示页面：展示 AI 和用户气泡的流式效果，包含开始/重置控制
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 构建配置

### Vite 配置要点
- 使用 `build.lib` 模式构建组件库
- 输出格式: ESM + UMD
- 外部依赖: vue
- 生成类型声明文件

### 打包输出
- `dist/index.mjs` - ESM 格式
- `dist/index.umd.js` - UMD 格式
- `dist/index.d.ts` - 类型声明

## 使用示例

### 基础用法

```vue
<template>
  <StreamBubble
    :content="messageContent"
    role="ai"
    :streaming="isStreaming"
    @complete="onStreamComplete"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { StreamBubble } from 'vue3-stream-bubble'

const messageContent = ref('# 标题\n\n这是**粗体**和*斜体*文字。\n\n```js\nconst code = "示例"\n```')
const isStreaming = ref(true)

const onStreamComplete = () => {
  console.log('流式显示完成')
}
</script>
```

### 流式数据模拟

```vue
<script setup lang="ts">
const messageContent = ref('')
const isStreaming = ref(false)

// 模拟流式接收数据
function startStreaming() {
  isStreaming.value = true
  const fullText = '# 示例文档\n\n这是一个段落。\n\n- 列表项1\n- 列表项2'
  let index = 0

  const interval = setInterval(() => {
    if (index >= fullText.length) {
      clearInterval(interval)
      isStreaming.value = false
      return
    }
    messageContent.value += fullText[index]
    index++
  }, 50)
}
</script>
```

## 扩展性考虑（未来版本）

以下功能不在 v1.0.0 范围内，预留扩展接口：
- CSS Variables 自定义颜色
- 插槽自定义内容

## 依赖

### Peer Dependencies
- vue: ^3.3.0

### Runtime Dependencies
- remark: ^15.0.0 - Markdown 解析器（内置 remark-parse）
- unified: ^11.0.0 - 统一的文本处理接口

---

设计日期: 2026-03-20
版本: v1.0.0
