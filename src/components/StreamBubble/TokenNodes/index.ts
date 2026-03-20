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
