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
