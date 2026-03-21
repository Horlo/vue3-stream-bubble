import type { Nodes } from 'mdast'

/**
 * 为 token 生成稳定的 key
 * 格式: {line}-{type}
 */
export function generateTokenKey(token: Nodes, index: number): string {
  const line = token.position?.start?.line ?? index
  return `${line}-${token.type}`
}
