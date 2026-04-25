/**
 * 轻量级 HTML 消毒工具，防止 XSS 注入
 * 移除 script 标签、事件处理器属性、危险协议等
 */

/** 允许的 HTML 标签白名单 */
const ALLOWED_TAGS = new Set([
  // 文本格式
  'p', 'br', 'hr', 'span', 'div',
  'b', 'i', 'u', 's', 'em', 'strong', 'small', 'sub', 'sup', 'mark',
  // 标题
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // 列表
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // 表格
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // 引用与代码
  'blockquote', 'pre', 'code', 'kbd', 'samp', 'var',
  // 链接与媒体
  'a', 'img',
  // 其他
  'details', 'summary', 'abbr', 'address', 'cite', 'del', 'ins', 'q', 'dfn',
  'figure', 'figcaption', 'time', 'ruby', 'rt', 'rp',
])

/** 允许的属性白名单 */
const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'width', 'height',
  'class', 'id', 'name',
  'target', 'rel',
  'colspan', 'rowspan', 'scope', 'align', 'valign',
  'start', 'type', 'reversed',
  'open', 'datetime', 'cite',
])

/** 危险协议（用于 href/src 属性检查） */
const DANGEROUS_PROTOCOL_RE = /^\s*(javascript|vbscript|data)\s*:/i

/** 匹配事件处理器属性名 */
const EVENT_HANDLER_RE = /^on/i

/**
 * 对 HTML 字符串进行消毒处理
 * @param html 原始 HTML 字符串
 * @returns 安全的 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    // SSR 环境下直接转义
    return escapeHtml(html)
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  sanitizeNode(doc.body)
  return doc.body.innerHTML
}

function sanitizeNode(node: Node): void {
  // 使用 while + 实时索引遍历，确保被提升的子节点也会被处理
  let i = 0
  while (i < node.childNodes.length) {
    const child = node.childNodes[i]

    if (child.nodeType === Node.TEXT_NODE) {
      i++
      continue
    }

    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child)
      continue // 移除后不递增，下一个节点自动补位
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      node.removeChild(child)
      continue
    }

    const el = child as Element
    const tagName = el.tagName.toLowerCase()

    // 移除不允许的标签
    if (!ALLOWED_TAGS.has(tagName)) {
      // 保留子节点文本内容（非 script/style）
      if (tagName === 'script' || tagName === 'style') {
        node.removeChild(el)
      } else {
        // 将子节点提升到父级，提升后的节点从当前索引开始
        while (el.firstChild) {
          node.insertBefore(el.firstChild, el)
        }
        node.removeChild(el)
      }
      continue // 不递增 i，下次迭代处理提升上来的节点
    }

    // 清理属性
    const attrs = Array.from(el.attributes)
    for (const attr of attrs) {
      const attrName = attr.name.toLowerCase()

      if (EVENT_HANDLER_RE.test(attrName) || !ALLOWED_ATTRS.has(attrName)) {
        el.removeAttribute(attr.name)
        continue
      }

      // 检查 href/src 的危险协议
      if ((attrName === 'href' || attrName === 'src') && DANGEROUS_PROTOCOL_RE.test(attr.value)) {
        el.removeAttribute(attr.name)
      }
    }

    // 为外部链接添加安全属性
    if (tagName === 'a') {
      el.setAttribute('rel', 'noopener noreferrer')
    }

    // 递归处理子节点
    sanitizeNode(el)
    i++
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
