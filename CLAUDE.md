# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指引。

## 项目概述

Vue 3 流式聊天气泡组件库，支持 Markdown 渲染，发布为 `vue3-stream-bubble` npm 包。UI 文案和代码注释均使用中文。

## 常用命令

```bash
npm run build    # vue-tsc 类型检查 + Vite 库模式构建（ESM / UMD / .d.ts）
npm run dev      # Vite 开发服务器
```

未配置测试框架和代码检查工具。

## 构建与打包

Vite 库模式输出：
- `dist/index.mjs`（ESM）
- `dist/index.umd.js`（UMD，全局变量 `vue` → `Vue`）
- `dist/index.d.ts`（类型声明，由 `vite-plugin-dts` 生成）

Vue 为 peer dependency（`^3.3.0`），打包时外部化。

## 架构

### 组件层

**StreamBubble**（`src/components/StreamBubble/`）——核心组件，在聊天气泡中渲染 Markdown 内容，支持流式动画。

- `index.vue` — 入口。Props：`content`、`role`（`'ai' | 'user'`）、`streaming`、`onComplete`。用户角色不启用流式动画。
- `MdRenderer.vue` — 通过 `remark` 将内容解析为 mdast 节点，每个节点映射到对应的 TokenNode 组件。追踪已出现的 token key，对新增 token 应用淡入动画（`md-token-new` 类，150ms）。
- `TokenNodes/` — 将 mdast 节点类型映射为 Vue 组件。`index.ts` 注册：`paragraph→Paragraph`、`code→CodeBlock`、`heading→Heading`、`list→List`、`blockquote→Blockquote`。`Text.vue` 处理行内节点（text、strong、emphasis、link、inlineCode、break）。`ListItem` 仅在 `List` 内部使用，未注册。
- `types.ts` — `StreamBubbleProps`、`MarkdownToken`（= mdast `Nodes`）、`TokenWithKey`。

**AgentChat**（`src/components/AgentChat/`）——上层聊天 UI，组合 StreamBubble 与消息列表、自动滚动、头像、输入框。

- `index.vue` — 消息列表，智能自动滚动（接近底部时随新消息滚动，流式输出时始终滚动）。插槽：`avatar`、`input`、`loading`、`empty`。事件：`send`、`complete`。
- `ChatMessage.vue` — 单条消息，包裹 StreamBubble 并显示头像。
- `ChatInput.vue` — 自适应高度 textarea，回车发送。

### 工具层

**Markdown 解析管线**：`tokenParser.ts` 使用 `remark().parse()` 生成 mdast `Root`。`keyGenerator.ts` 根据节点位置生成稳定 key（`{line}-{type}`）。

**代码高亮**：`highlighter.ts` — 懒加载的 Shiki 单例，`github-dark` 主题，13 种语言通过动态 import 加载。`CodeBlock.vue` 在流式输出期间以 150ms 防抖触发高亮。

**ChunkedStream**（`streamSource.ts`）— 文本分块缓冲器，遇换行或达到字符阈值（默认 20）时刷新，用于平滑流式文本输出。

**FileChunker**（`fileChunker.ts`）— 文件分片工具，通过内联 Web Worker（SparkMD5 算法以字符串 Blob 形式内联）计算 MD5 哈希。支持 slice/hash/upload，支持 AbortSignal 和进度回调。默认分片大小：2MB。

**FileChunkerVite**（`fileChunker.vite.ts`）— Vite 原生变体，使用 `new Worker(new URL(...), { type: 'module' })` 加载独立的 `fileChunker.worker.ts`（正常 import `spark-md5`）。API 与 FileChunker 一致。

### 入口文件

`src/index.ts` 导出组件（`StreamBubble`、`AgentChat`）、工具类（`ChunkedStream`、`FileChunker`、`FileChunkerVite`）及所有公开类型。

## 核心依赖

- **remark** / **unified** — Markdown 解析为 mdast 树
- **shiki** — 代码块语法高亮
- **spark-md5** — Web Worker 中的 MD5 哈希计算，用于文件分片
- Vue 外部化处理（peer dependency）
