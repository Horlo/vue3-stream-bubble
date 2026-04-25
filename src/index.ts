// src/index.ts
import StreamBubble from './components/StreamBubble/index.vue'
import AgentChat from './components/AgentChat/index.vue'

export { StreamBubble, AgentChat }
export default StreamBubble

// 工具类导出
export { ChunkedStream } from './utils/streamSource'
export { FileChunker } from './utils/fileChunker'

// 类型导出
export type { StreamBubbleProps, MarkdownToken, TokenWithKey } from './components/StreamBubble/types'
export type { AgentChatProps, AgentMessage } from './components/AgentChat/types'
export type { ChunkedStreamOptions, ChunkedStreamCallbacks } from './utils/streamSource'
export type { ChunkResult, UploadResult, FileChunkerOptions, UploadFn } from './utils/fileChunker'

