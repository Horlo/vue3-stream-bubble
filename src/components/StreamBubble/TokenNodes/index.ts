import Paragraph from './Paragraph.vue'
import CodeBlock from './CodeBlock.vue'
import Heading from './Heading.vue'
import List from './List.vue'
import ListItem from './ListItem.vue'
import Blockquote from './Blockquote.vue'
import Text from './Text.vue'
import Table from './Table.vue'
import TableRow from './TableRow.vue'
import TableCell from './TableCell.vue'
import Html from './Html.vue'

export const tokenComponents: Record<string, any> = {
  paragraph: Paragraph,
  code: CodeBlock,
  heading: Heading,
  list: List,
  blockquote: Blockquote,
  table: Table,
  html: Html,
}

export { Paragraph, CodeBlock, Heading, List, ListItem, Blockquote, Text, Table, TableRow, TableCell, Html }

// 注意：inlineCode 在 Text.vue 中处理；listItem/tableRow/tableCell 不注册为独立组件（只在父组件内部使用）
