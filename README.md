# Vue3 Stream Bubble

Vue3 流式气泡组件库，支持 Markdown 渲染。

## 安装

```bash
npm install vue3-stream-bubble
```

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

## 许可证

MIT
