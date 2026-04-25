import type { ChunkResult, UploadResult, UploadFn, FileChunkerOptions } from './fileChunker'

const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024 // 2MB
const DESTROYED_ERROR = 'FileChunker has been destroyed'

export class FileChunkerVite {
  private readonly _file: File
  private readonly _chunkSize: number
  private readonly _options: FileChunkerOptions
  private _worker: Worker | null = null
  private _hashing = false
  private _destroyed = false

  constructor(file: File, options?: FileChunkerOptions) {
    const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE
    if (chunkSize <= 0) {
      throw new RangeError(`chunkSize must be > 0, got ${chunkSize}`)
    }
    this._file = file
    this._chunkSize = chunkSize
    this._options = options ?? {}
  }

  slice(): ChunkResult[] {
    this._assertAlive()
    const chunks: ChunkResult[] = []
    const totalChunks = Math.ceil(this._file.size / this._chunkSize)
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this._chunkSize
      const end = Math.min(start + this._chunkSize, this._file.size)
      chunks.push({ index: i, blob: this._file.slice(start, end), start, end })
    }
    return chunks
  }

  async hash(onProgress?: (percent: number) => void, signal?: AbortSignal): Promise<string> {
    this._assertAlive()
    if (this._hashing) {
      throw new Error('hash() is already in progress')
    }

    if (this._file.size === 0) {
      return 'd41d8cd98f00b204e9800998ecf8427e'
    }

    this._hashing = true

    try {
      const worker = this._getWorker()

      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      return await new Promise<string>((resolve, reject) => {
        const onAbort = () => {
          worker.terminate()
          this._worker = null
          reject(new DOMException('Aborted', 'AbortError'))
        }
        signal?.addEventListener('abort', onAbort, { once: true })

        worker.onmessage = (e: MessageEvent) => {
          const data = e.data
          if (data.type === 'progress') {
            onProgress?.(data.percent)
          } else if (data.type === 'done') {
            signal?.removeEventListener('abort', onAbort)
            resolve(data.hash)
          } else if (data.type === 'error') {
            signal?.removeEventListener('abort', onAbort)
            reject(new Error(data.message))
          }
        }

        worker.onerror = (e: ErrorEvent) => {
          signal?.removeEventListener('abort', onAbort)
          reject(new Error(e.message))
        }

        worker.postMessage({ file: this._file, chunkSize: this._chunkSize })
      })
    } finally {
      this._hashing = false
    }
  }

  async hashAndSlice(
    onHashProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<{ hash: string; chunks: ChunkResult[] }> {
    const hash = await this.hash(onHashProgress, signal)
    return { hash, chunks: this.slice() }
  }

  async upload(uploadFn: UploadFn, signal?: AbortSignal): Promise<UploadResult> {
    this._assertAlive()

    const fileHash = await this.hash(undefined, signal)
    const chunks = this.slice()

    const uploadedChunks: number[] = []
    const skippedChunks: number[] = []
    const totalChunks = chunks.length

    for (const chunk of chunks) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      const isUploaded = this._options.isUploaded
      if (isUploaded) {
        const uploaded = await isUploaded(chunk.index, fileHash)
        if (uploaded) {
          skippedChunks.push(chunk.index)
          this._options.onChunkUploaded?.(chunk.index, fileHash)
          continue
        }
      }

      await uploadFn(chunk, fileHash, totalChunks)
      uploadedChunks.push(chunk.index)
      this._options.onChunkUploaded?.(chunk.index, fileHash)
    }

    const result: UploadResult = { fileHash, totalChunks, uploadedChunks, skippedChunks }

    this._options.onAllUploaded?.(result)
    return result
  }

  destroy(): void {
    if (this._worker) {
      this._worker.terminate()
      this._worker = null
    }
    this._destroyed = true
  }

  private _getWorker(): Worker {
    if (!this._worker) {
      this._worker = new Worker(
        new URL('./fileChunker.worker.ts', import.meta.url),
        { type: 'module' },
      )
    }
    return this._worker
  }

  private _assertAlive(): void {
    if (this._destroyed) {
      throw new Error(DESTROYED_ERROR)
    }
  }
}
