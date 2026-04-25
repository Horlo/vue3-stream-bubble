// ---- Types ----

export interface ChunkResult {
  index: number
  blob: Blob
  start: number
  end: number
}

export interface UploadResult {
  fileHash: string
  totalChunks: number
  uploadedChunks: number[]
  skippedChunks: number[]
}

export type UploadFn = (chunk: ChunkResult, fileHash: string, totalChunks: number) => Promise<void>

export interface FileChunkerOptions {
  chunkSize?: number
  isUploaded?: (index: number, fileHash: string) => Promise<boolean>
  onChunkUploaded?: (index: number, fileHash: string) => void
  onAllUploaded?: (result: UploadResult) => void
}

// ---- Constants ----

const DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024 // 2MB
const DESTROYED_ERROR = 'FileChunker has been destroyed'

// ---- Inline Worker code for MD5 computation ----

const WORKER_CODE = `
// Inlined SparkMD5 ArrayBuffer incremental MD5
// Source: spark-md5 (MIT License) - closely following the original implementation.
// Processes data in 64-byte blocks through md5cycle, uses proper MD5 padding.

var md5cycle = function(x, k) {
  var a = x[0], b = x[1], c = x[2], d = x[3];
  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);
  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);
  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);
  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);
  x[0] = add32(a, x[0]);
  x[1] = add32(b, x[1]);
  x[2] = add32(c, x[2]);
  x[3] = add32(d, x[3]);
};

var cmn = function(q, a, b, x, s, t) {
  a = add32(add32(a, q), add32(x, t));
  return add32((a << s) | (a >>> (32 - s)), b);
};

var ff = function(a, b, c, d, x, s, t) {
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
};

var gg = function(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
};

var hh = function(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
};

var ii = function(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
};

var add32 = function(a, b) {
  return (a + b) & 0xFFFFFFFF;
};

var hex_chr = '0123456789abcdef'.split('');

var rhex = function(n) {
  var s = '', j;
  for (j = 0; j < 4; j++)
    s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
  return s;
};

var hex = function(x) {
  return x.map(rhex).join('');
};

var md5blk_array = function(a) {
  var bl = [];
  for (var i = 0; i < 64; i += 4) {
    bl.push(a[i] | (a[i + 1] << 8) | (a[i + 2] << 16) | (a[i + 3] << 24));
  }
  return bl;
};

var SparkArrayBuffer = function() {
  this._hash = [1732584193, -271733879, -1732584194, 271733878];
  this._buff = new Uint8Array(0);
  this._length = 0;
};

SparkArrayBuffer.prototype.append = function(arr) {
  var buff = this._concatUint8Array(this._buff, new Uint8Array(arr));
  var length = buff.length;
  var i;
  for (i = 64; i <= length; i += 64) {
    md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
  }
  this._buff = (i - 64) < length ? buff.subarray(i - 64) : new Uint8Array(0);
  this._length += arr.byteLength;
  return this;
};

SparkArrayBuffer.prototype.end = function(raw) {
  var hash = this._hash;
  var buff = this._buff;
  var length = buff.length;
  var i;
  var tail = new Uint8Array(length < 56 ? 64 : 128);
  for (i = 0; i < length; i++) {
    tail[i] = buff[i];
  }
  tail[i] = 0x80;
  var tmp = this._length * 8;
  tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
  var lo = parseInt(tmp[2], 16);
  var hi = parseInt(tmp[1], 16) || 0;
  var tailWords = [];
  for (var j = 0; j < tail.length; j += 4) {
    tailWords.push(tail[j] | (tail[j + 1] << 8) | (tail[j + 2] << 16) | (tail[j + 3] << 24));
  }
  tailWords[14] = lo;
  tailWords[15] = hi;
  if (length > 55) {
    md5cycle(hash, tailWords.slice(0, 16));
    md5cycle(hash, tailWords.slice(16, 32));
  } else {
    md5cycle(hash, tailWords.slice(0, 16));
  }
  var result = raw ? hash : hex(hash);
  this._hash = [1732584193, -271733879, -1732584194, 271733878];
  this._buff = new Uint8Array(0);
  this._length = 0;
  return result;
};

SparkArrayBuffer.prototype._concatUint8Array = function(first, second) {
  var result = new Uint8Array(first.length + second.length);
  result.set(first);
  result.set(second, first.length);
  return result;
};

self.onmessage = function(e) {
  var file = e.data.file;
  var chunkSize = e.data.chunkSize;
  var chunks = Math.ceil(file.size / chunkSize);
  var spark = new SparkArrayBuffer();
  var currentChunk = 0;

  function loadNext() {
    var reader = new FileReader();
    reader.onload = function(e) {
      spark.append(e.target.result);
      currentChunk++;
      var percent = Math.round((currentChunk / chunks) * 100);
      self.postMessage({ type: 'progress', percent: percent });
      if (currentChunk < chunks) {
        loadNext();
      } else {
        var hash = spark.end();
        self.postMessage({ type: 'done', hash: hash });
      }
    };
    reader.onerror = function() {
      self.postMessage({ type: 'error', message: 'FileReader error' });
    };
    var start = currentChunk * chunkSize;
    var end = Math.min(start + chunkSize, file.size);
    reader.readAsArrayBuffer(file.slice(start, end));
  }

  loadNext();
};
`

// ---- Main-thread FileChunker ----

export class FileChunker {
  private readonly _file: File
  private readonly _chunkSize: number
  private readonly _options: FileChunkerOptions
  private _worker: Worker | null = null
  private _workerUrl: string | null = null
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
      chunks.push({
        index: i,
        blob: this._file.slice(start, end),
        start,
        end,
      })
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

        worker.postMessage({
          file: this._file,
          chunkSize: this._chunkSize,
        })
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

    const result: UploadResult = {
      fileHash,
      totalChunks,
      uploadedChunks,
      skippedChunks,
    }

    this._options.onAllUploaded?.(result)
    return result
  }

  destroy(): void {
    if (this._worker) {
      this._worker.terminate()
      this._worker = null
    }
    if (this._workerUrl) {
      URL.revokeObjectURL(this._workerUrl)
      this._workerUrl = null
    }
    this._destroyed = true
  }

  private _getWorker(): Worker {
    if (!this._worker) {
      const blob = new Blob([WORKER_CODE], { type: 'application/javascript' })
      this._workerUrl = URL.createObjectURL(blob)
      this._worker = new Worker(this._workerUrl)
    }
    return this._worker
  }

  private _assertAlive(): void {
    if (this._destroyed) {
      throw new Error(DESTROYED_ERROR)
    }
  }
}
