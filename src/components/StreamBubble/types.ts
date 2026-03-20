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
