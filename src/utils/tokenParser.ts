import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import type { Root, Nodes } from 'mdast'

/**
 * 解析 Markdown 文本为 token 列表
 */
export function parseMarkdown(content: string): Nodes[] {
  if (!content.trim()) return []

  try {
    const tree = remark().use(remarkGfm).parse(content) as Root
    return tree.children || []
  } catch (e) {
    console.warn('[vue3-stream-bubble] Markdown 解析失败:', e)
    return []
  }
}
