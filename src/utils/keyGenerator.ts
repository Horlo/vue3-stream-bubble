import type { Nodes } from 'mdast'

/**
 * 简单 hash 函数
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * 获取 token 的文本内容
 */
function getTokenContent(token: Nodes): string {
  if ('value' in token && typeof token.value === 'string') {
    return token.value
  }
  if ('children' in token && Array.isArray(token.children)) {
    return token.children.map(getTokenContent).join('')
  }
  return ''
}

/**
 * 为 token 生成稳定的 key
 * 格式: {line}-{hash}
 */
export function generateTokenKey(token: Nodes, index: number): string {
  const line = token.position?.start?.line ?? index
  const content = getTokenContent(token)
  const hash = simpleHash(content).slice(0, 8)
  return `${line}-${hash}`
}
