export interface ChunkedStreamOptions {
  /** chunk 缓冲字符数阈值，默认 20 */
  chunkSize?: number
}

export interface ChunkedStreamCallbacks {
  /** 每次 chunk 刷新时触发，chunk 为新片段，accumulated 为全部已接收内容 */
  onChunk?: (chunk: string, accumulated: string) => void
  /** 流结束后触发 */
  onComplete?: (accumulated: string) => void
}

/**
 * 流式文本 chunk 缓冲器
 *
 * 外部通过 push(text) 逐步喂入文本，内部按以下规则分片触发 onChunk 回调：
 * - 遇到 \n 时立即刷新（截取到 \n，含）
 * - 累积达到 chunkSize（默认 20）个字符时刷新
 * - 两个条件取先到者
 *
 * 流结束时调用 done() 刷新剩余内容并触发 onComplete。
 */
export class ChunkedStream {
  private _accumulated = ''
  private _pending = ''
  private _chunkSize: number
  private _callbacks: ChunkedStreamCallbacks
  private _done = false

  constructor(callbacks: ChunkedStreamCallbacks = {}, options: ChunkedStreamOptions = {}) {
    this._callbacks = callbacks
    this._chunkSize = options.chunkSize ?? 20
  }

  /** 全部已接收内容 */
  get accumulated(): string {
    return this._accumulated
  }

  /** 是否已结束 */
  get isDone(): boolean {
    return this._done
  }

  /** 推入新的文本片段 */
  push(text: string): void {
    if (this._done) return
    this._pending += text
    this._flush()
  }

  /** 标记流结束，刷新剩余内容 */
  done(): void {
    if (this._done) return
    this._done = true
    if (this._pending.length > 0) {
      this._emit(this._pending)
      this._pending = ''
    }
    this._callbacks.onComplete?.(this._accumulated)
  }

  /** 重置状态，可复用实例 */
  reset(): void {
    this._accumulated = ''
    this._pending = ''
    this._done = false
  }

  // --------------------------------------------------------
  // 内部逻辑
  // --------------------------------------------------------

  private _flush(): void {
    while (this._pending.length > 0) {
      const newlineIdx = this._pending.indexOf('\n')

      if (newlineIdx !== -1 && newlineIdx < this._chunkSize) {
        // 换行先到 → 截取到 \n（含）
        const chunk = this._pending.slice(0, newlineIdx + 1)
        this._pending = this._pending.slice(newlineIdx + 1)
        this._emit(chunk)
      } else if (this._pending.length >= this._chunkSize) {
        // 达到字符阈值
        const chunk = this._pending.slice(0, this._chunkSize)
        this._pending = this._pending.slice(this._chunkSize)
        this._emit(chunk)
      } else {
        break
      }
    }
  }

  private _emit(chunk: string): void {
    this._accumulated += chunk
    this._callbacks.onChunk?.(chunk, this._accumulated)
  }
}
