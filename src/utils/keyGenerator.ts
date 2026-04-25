import type { Nodes } from 'mdast'

/**
 * 为 token 生成稳定的 key
 * 格式: {index}-{type}-{line}
 * 使用 index 作为主要标识符，避免同行同类型节点碰撞
 * 同时保留 type 和 line 提高可读性
 */
export function generateTokenKey(token: Nodes, index: number): string {
  const line = token.position?.start?.line ?? 0
  return `${index}-${token.type}-${line}`
}
