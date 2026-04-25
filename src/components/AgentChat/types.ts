export interface AgentMessage {
  /** 消息唯一标识 */
  id: string | number
  /** 消息内容（支持 Markdown） */
  content: string
  /** 角色类型 */
  role: 'ai' | 'user'
  /** 是否正在流式输出 */
  streaming?: boolean
  /** 头像 URL */
  avatar?: string
  /** 用户名 */
  username?: string
}

export interface AgentChatProps {
  /** 消息列表 */
  messages: AgentMessage[]
  /** 是否显示加载指示器 */
  loading?: boolean
  /** 输入框占位文本 */
  inputPlaceholder?: string
  /** 是否显示输入区 */
  showInput?: boolean
  /** 是否禁用输入 */
  disabled?: boolean
}
