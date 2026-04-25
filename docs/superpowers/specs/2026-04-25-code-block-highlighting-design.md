# Code Block Syntax Highlighting Design

## Overview

Add syntax highlighting to `CodeBlock.vue` using Shiki, integrated out of the box with no user configuration required.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Highlighter library | Shiki | Lightweight (~4KB gzip), VS Code quality themes, on-demand grammar loading |
| Theme | `github-dark` | Matches existing dark code block background style |
| Configuration | None exposed | Single default theme, no props — keeps API simple |
| Loading strategy | Lazy singleton | First highlight triggers `createHighlighter()`, cached thereafter |

## Scope

### Changes

1. **`package.json`** — add `shiki` to `dependencies`
2. **New file: `src/utils/highlighter.ts`** — lazy-initialized Shiki singleton
3. **`CodeBlock.vue`** — replace plain text with Shiki-highlighted HTML
4. **`style.css`** — remove hardcoded code block colors, let Shiki theme own them

### No changes

- `MdRenderer.vue`, `TokenNodes/index.ts`, other token components
- No new props exposed on `StreamBubble`
- No changes to public API

## Detailed Design

### highlighter.ts

- Exports a single `highlightCode(code: string, lang: string): Promise<string>` function
- Internally uses `createHighlighter()` with `github-dark` theme and a bundled set of common language grammars:
  - `javascript`, `typescript`, `python`, `css`, `html`, `json`, `bash`, `java`, `cpp`, `go`, `rust`, `sql`, `markdown`
- First call initializes the highlighter (async, loads wasm + grammars), subsequent calls reuse the cached instance
- If `lang` is not in the loaded set, falls back to plain text (no highlighting)

### CodeBlock.vue

- Reactive state: `highlightedHtml: Ref<string>`
- On `token.value` or `token.lang` change:
  - If the code block is actively streaming (content keeps changing), show plain text immediately
  - Once content stabilizes (debounce ~100ms), call `highlightCode()` and set `highlightedHtml`
- Template renders `v-html` with Shiki output when available, plain text otherwise
- Shiki outputs a `<pre><code>` with inline styles, so the existing `.md-code-block` wrapper remains for layout (padding, border-radius, overflow)

### style.css

- Remove `background` and `color` from `.md-code-block` — Shiki's theme handles these
- Keep: `padding`, `border-radius`, `overflow-x`, `margin`, `font-family`, `font-size`, `line-height`
- Remove `.md-code-block code` override (Shiki handles `code` styling internally)

## Streaming Behavior

During streaming, a code block's `token.value` grows character by character. Highlighting on every keystroke would be wasteful. Strategy:

1. While streaming, render plain text (instant, no async cost)
2. When the parent `MdRenderer` detects the code block is no longer receiving updates (content stabilizes), trigger highlighting
3. Alternatively: use a simple debounce on the watch — if no new character arrives within ~150ms, highlight

The debounce approach is simpler and doesn't require coordination with `MdRenderer`. It works because streaming characters arrive in rapid succession (<50ms apart), so a 150ms debounce naturally waits for the burst to end.

## Language Fallback

If `token.lang` is missing or not in the loaded grammar set, `highlightCode` returns the code wrapped in `<pre><code>` with no syntax spans — identical to current plain-text rendering.
