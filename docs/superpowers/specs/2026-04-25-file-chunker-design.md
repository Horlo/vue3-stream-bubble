# FileChunker 设计文档

## 概述

在 `src/utils/fileChunker.ts` 中实现文件切片上传工具类，提供文件 MD5 hash 计算（Web Worker）和固定大小分片能力。上传接口通过 callback 由用户实现，工具类负责编排流程。

## API 设计

### 类型定义

```ts
interface ChunkResult {
  index: number        // 分片序号 0-based
  blob: Blob           // 分片数据
  start: number        // 文件起始字节
  end: number          // 文件结束字节
}

interface UploadResult {
  fileHash: string
  totalChunks: number
  uploadedChunks: number[]    // 本次实际上传的分片序号
  skippedChunks: number[]     // 被跳过的已上传分片序号
}

interface FileChunkerOptions {
  chunkSize?: number                                             // 默认 2MB
  isUploaded?: (index: number, fileHash: string) => Promise<boolean>  // 用户实现：判断分片是否已上传
  onChunkUploaded?: (index: number, fileHash: string) => void          // 单个分片上传成功回调
  onAllUploaded?: (result: UploadResult) => void                       // 全部上传完成回调
}
```

### 类结构

```ts
class FileChunker {
  constructor(file: File, options?: FileChunkerOptions)

  hash(onProgress?: (percent: number) => void): Promise<string>
  slice(): ChunkResult[]
  hashAndSlice(onHashProgress?: (percent: number) => void): Promise<{ hash: string; chunks: ChunkResult[] }>
  upload(uploadFn: (chunk: ChunkResult, fileHash: string) => Promise<void>): Promise<UploadResult>
}
```

### 方法说明

**`hash(onProgress?)`**
- 使用 Web Worker + SparkMD5 异步计算整个文件的 MD5
- `onProgress` 报告 0~100 进度
- Worker 内部按 chunk 大小增量读取文件，避免一次性加载大文件到内存

**`slice()`**
- 同步分片，按 `chunkSize` 切割文件为 `ChunkResult[]`
- 最后一个分片可能小于 chunkSize

**`hashAndSlice(onHashProgress?)`**
- 便捷方法，内部依次调用 `hash()` → `slice()`

**`upload(uploadFn)`**
- 编排完整上传流程：
  1. 调用 `hash()` 计算 fileHash
  2. 调用 `slice()` 生成分片
  3. 顺序遍历每个分片：
     - 如果用户提供了 `isUploaded` 且返回 `true`，跳过（记入 `skippedChunks`）
     - 否则调用 `uploadFn(chunk, fileHash)` 上传
  4. 每个分片成功后触发 `onChunkUploaded`
  5. 全部完成后触发 `onAllUploaded`，返回 `UploadResult`
- 不处理并发控制，顺序上传

## Web Worker 实现

Worker 内联为 Blob URL（避免额外文件），逻辑：
1. 接收 file 引用和 chunkSize
2. 使用 FileReader 逐片读取
3. 通过 SparkMD5.ArrayBuffer() 增量计算
4. 每读一片向主线程 postMessage 报告进度
5. 完成后 postMessage 返回最终 MD5 字符串

## 依赖

- `spark-md5`：新增依赖，用于 MD5 计算

## 导出

在 `src/index.ts` 中导出：
```ts
export { FileChunker } from './utils/fileChunker'
export type { ChunkResult, UploadResult, FileChunkerOptions } from './utils/fileChunker'
```

## 文件结构

```
src/utils/fileChunker.ts    # 工具类主文件（含内联 Worker）
```
