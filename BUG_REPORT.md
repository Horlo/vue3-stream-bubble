# vue3-stream-bubble Bug 审查报告

> 审查日期: 2026-04-25

---

## CRITICAL - 安全漏洞

### BUG-01: Html.vue XSS 注入漏洞

- **文件**: `src/components/StreamBubble/TokenNodes/Html.vue:2`
- **问题**: `v-html="token.value"` 直接渲染未经过滤的 HTML。若 markdown 内容包含 `<script>`、`onerror` 等恶意代码，将直接在用户浏览器中执行。
- **影响**: 任意 JavaScript 执行、Cookie 窃取、会话劫持。
- **建议**: 使用 DOMPurify 等库对 HTML 进行消毒处理后再渲染。

---

## HIGH - 严重功能缺陷

### BUG-02: CJK 输入法下 Enter 键误触发发送

- **文件**: `src/components/AgentChat/ChatInput.vue:13`
- **问题**: `@keydown.enter.exact.prevent="handleSend"` 未检查 `event.isComposing`。中文/日文/韩文输入法下按 Enter 确认候选词时会误发消息。
- **影响**: 对 CJK 用户造成严重的可用性问题。
- **修复**:
  ```vue
  @keydown.enter.exact.prevent="!$event.isComposing && handleSend()"
  ```
  或在 handler 中检查:
  ```typescript
  function handleSend(event?: KeyboardEvent) {
    if (event?.isComposing) return
    // ...
  }
  ```

### BUG-03: 流式消息 `complete` 事件可能永远不会触发

- **文件**: `src/components/StreamBubble/MdRenderer.vue:48-61`
- **问题**: `complete` 事件仅在 `!props.streaming` 分支中触发。当 `content` 和 `streaming: false` 在同一 tick 更新时，watcher 只在 `streaming` 仍为 `true` 时触发一次；之后 `streaming` 变为 `false` 但 `tokensWithKey` 未变，watcher 不再触发 → `complete` 永远不会发出。
- **影响**: 父组件 AgentChat 永远收不到流式完成通知，`onComplete` 回调不执行。

### BUG-04: MdRenderer 的 setTimeout 未在组件卸载时清理

- **文件**: `src/components/StreamBubble/MdRenderer.vue:59`
- **问题**: `setTimeout(() => { prevKeys.value = currentKeys }, 150)` 在组件卸载后仍会执行。对比 CodeBlock.vue 正确使用了 `disposed` 标志，MdRenderer 遗漏了清理逻辑。
- **影响**: 内存泄漏，虚拟列表等快速挂载/卸载场景下状态异常。

### BUG-05: Token key 生成不稳定/易碰撞

- **文件**: `src/utils/keyGenerator.ts:7-9`
- **问题**: key 格式为 `{line}-{type}`（如 `"3-heading"`）。同一行同类型节点会产生重复 key（Vue 警告）；流式更新时行号变化导致 key 不稳定，动画检测失效。
- **影响**: Vue 重复 key 警告，`isNewToken` 判断不可靠，不必要的重渲染。

---

## MEDIUM - 功能问题

### BUG-06: Text.vue 静默丢弃未知行内节点类型

- **文件**: `src/components/StreamBubble/TokenNodes/Text.vue`
- **问题**: 仅处理 `text/strong/emphasis/link/inlineCode/break`，`delete`（删除线）、`image` 等节点内容完全消失不渲染。
- **影响**: `~~删除线~~` 语法的内容被静默吞掉；图片不显示。

### BUG-07: Blockquote/ListItem 子节点类型支持不完整

- **文件**: `src/components/StreamBubble/TokenNodes/Blockquote.vue:22-28`，`ListItem.vue:26-32`
- **问题**: 仅映射 `paragraph` 和 `list`，引用块/列表项内的代码块、标题、表格、HTML 块等无法正确渲染，fallback 到空 `<div>`。
- **影响**: 嵌套内容丢失或显示异常。

### BUG-08: CodeBlock 高亮异步竞态条件

- **文件**: `src/components/StreamBubble/TokenNodes/CodeBlock.vue:28-31`
- **问题**: 快速更新时旧的高亮 Promise 可能覆盖新结果，产生内容闪烁。
- **时序**: watch 触发 → 防抖开始 → highlightCode 开始 → watch 再次触发 → `highlightedHtml = null` → 旧 highlightCode 完成 → 设置了旧的高亮结果 → 新防抖触发。
- **建议**: 使用 generation counter 或 AbortController 丢弃过期结果。

### BUG-09: `complete` 事件双重触发风险

- **文件**: `src/components/StreamBubble/index.vue:40-43`
- **问题**: 同时通过 `defineEmits`（`@complete`）和 `onComplete` prop 暴露完成事件。消费者同时使用两者时 handler 被调用两次。
- **建议**: 统一为单一模式。

### BUG-10: AgentChat 深度监听导致过多滚动调用

- **文件**: `src/components/AgentChat/index.vue:85-93`
- **问题**: 对整个 `messages` 数组使用深度监听，流式输出期间每个 token 变化都触发 `scrollToBottom()`，造成不必要的性能开销。

### BUG-11: FileChunkerVite 非 Vite 环境运行时失败

- **文件**: `src/index.ts:11`
- **问题**: 无条件导出依赖 `import.meta.url` 的 `FileChunkerVite`，webpack/esbuild 环境下导入即报错。
- **建议**: 拆分为独立入口点或使用条件导出。

### BUG-12: getComponent fallback到原生 div 导致内容丢失

- **文件**: `MdRenderer.vue:65`，`Blockquote.vue:27`，`ListItem.vue:31`
- **问题**: 未识别的 token 类型 fallback 为字符串 `'div'`，Vue 创建原生 `<div>` 元素但传入的 `:token` prop 被当作 HTML 属性，内容无法正确渲染。

---

## LOW - 次要问题

| 编号 | 问题 | 文件位置 |
|------|------|----------|
| BUG-13 | 用户气泡链接颜色对比度不足（`#bfdbfe` on `#3b82f6` ≈ 2.7:1），不满足 WCAG AA 标准（最低 4.5:1） | `style.css:147-154` |
| BUG-14 | 外部链接缺少 `rel="noreferrer"`，可能泄露用户聊天上下文 | `Text.vue:16` |
| BUG-15 | 表格未使用 `<thead>/<tbody>` 语义分组 | `Table.vue` |
| BUG-16 | 流式动画缺少 `prefers-reduced-motion` 媒体查询 | `style.css` |
| BUG-17 | `tokenComponents` 使用 `Record<string, any>` 无编译期类型校验，拼错的 key 会静默失败 | `TokenNodes/index.ts:13` |
| BUG-18 | CSS 通过非 scoped `@import` 全局注入，可能与消费方样式冲突 | `StreamBubble/index.vue:46-48` |
| BUG-19 | 空内容时气泡仍渲染（无空状态处理），显示空白气泡 | `MdRenderer.vue` |
| BUG-20 | highlighter 单例无清理/重置 API，长生命周期应用存在内存泄漏 | `highlighter.ts:39` |
| BUG-21 | 非流式消息挂载时立即触发 `complete` 事件（`immediate: true` watcher），可能产生多余的完成通知 | `MdRenderer.vue:54` |
| BUG-22 | Table.vue 假设第一行始终为表头，对无对齐行的异常表格渲染错误 | `Table.vue:8` |
