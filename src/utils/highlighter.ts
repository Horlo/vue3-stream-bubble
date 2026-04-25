import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import type { HighlighterCore } from 'shiki/core'

const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'css',
  'html',
  'json',
  'bash',
  'java',
  'cpp',
  'go',
  'rust',
  'sql',
  'markdown',
] as const

type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number]

const langImportMap: Record<SupportedLang, () => Promise<any>> = {
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  python: () => import('@shikijs/langs/python'),
  css: () => import('@shikijs/langs/css'),
  html: () => import('@shikijs/langs/html'),
  json: () => import('@shikijs/langs/json'),
  bash: () => import('@shikijs/langs/bash'),
  java: () => import('@shikijs/langs/java'),
  cpp: () => import('@shikijs/langs/cpp'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  sql: () => import('@shikijs/langs/sql'),
  markdown: () => import('@shikijs/langs/markdown'),
}

let highlighterPromise: Promise<HighlighterCore> | null = null

function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import('@shikijs/themes/github-dark')],
      langs: SUPPORTED_LANGUAGES.map((lang) => langImportMap[lang]),
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}

function isSupported(lang: string | null | undefined): lang is SupportedLang {
  return !!lang && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function plainHtml(code: string): string {
  return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`
}

export async function highlightCode(code: string, lang: string | null | undefined): Promise<string> {
  if (typeof window === 'undefined') {
    return plainHtml(code)
  }

  if (!isSupported(lang)) {
    return plainHtml(code)
  }

  try {
    const shiki = await getHighlighter()
    return shiki.codeToHtml(code, {
      lang,
      theme: 'github-dark',
    })
  } catch {
    return plainHtml(code)
  }
}
