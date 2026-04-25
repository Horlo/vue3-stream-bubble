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

type UploadFn = (chunk: ChunkResult, fileHash: string, totalChunks: number) => Promise<void>

interface FileChunkerOptions {
  chunkSize?: number                                             // 默认 2MB，必须 > 0
  isUploaded?: (index: number, fileHash: string) => Promise<boolean>  // 用户实现：判断分片是否已上传
  onChunkUploaded?: (index: number, fileHash: string) => void          // 单个分片上传成功回调
  onAllUploaded?: (result: UploadResult) => void                       // 全部上传完成回调（仅成功时触发）
}
```

### 类结构

```ts
class FileChunker {
  constructor(file: File, options?: FileChunkerOptions)

  hash(onProgress?: (percent: number) => void, signal?: AbortSignal): Promise<string>
  slice(): ChunkResult[]
  hashAndSlice(onHashProgress?: (percent: number) => void, signal?: AbortSignal): Promise<{ hash: string; chunks: ChunkResult[] }>
  upload(uploadFn: UploadFn, signal?: AbortSignal): Promise<UploadResult>
  destroy(): void
}
```

### 方法说明

**`hash(onProgress?, signal?)`**
- 使用 Web Worker + SparkMD5 异步计算整个文件的 MD5
- `onProgress` 报告 0~100 进度
- Worker 内部按 chunkSize 增量读取文件，避免一次性加载大文件到内存
- `signal` 支持 AbortSignal，触发时 Worker 终止，Promise reject 并抛出 AbortError
- 重复调用 `hash()` 时复用同一个 Worker 实例；如果上一次 hash 尚未完成再次调用，直接 reject

**`slice()`**
- 同步分片，按 `chunkSize` 切割文件为 `ChunkResult[]`
- 最后一个分片可能小于 chunkSize
- 空文件返回空数组

**`hashAndSlice(onHashProgress?, signal?)`**
- 便捷方法，内部依次调用 `hash()` → `slice()`

**`upload(uploadFn, signal?)`**
- 编排完整上传流程：
  1. 调用 `hash()` 计算 fileHash
  2. 调用 `slice()` 生成分片
  3. 顺序遍历每个分片：
     - 如果用户提供了 `isUploaded` 且返回 `true`，跳过（记入 `skippedChunks`）
     - 否则调用 `uploadFn(chunk, fileHash, totalChunks)` 上传
  4. 每个分片成功后触发 `onChunkUploaded`
  5. 全部完成后触发 `onAllUploaded`（仅成功时触发），返回 `UploadResult`
- 不处理并发控制，顺序上传
- `signal` 支持 AbortSignal，触发时停止后续分片上传，Promise reject 并抛出 AbortError

**`destroy()`**
- 终止 Worker 并 revoke Blob URL
- 实例销毁后调用异步方法会 reject

## 错误处理

| 场景 | 行为 |
|------|------|
| `chunkSize <= 0` | 构造时抛出 `RangeError` |
| `hash()` Worker 内部出错 | Promise reject，透传 Worker 错误 |
| `uploadFn` reject | 立即停止后续分片，Promise reject 透传该错误 |
| `isUploaded` reject | 立即停止后续分片，Promise reject 透传该错误 |
| `signal` abort | Worker 终止或上传停止，Promise reject 抛出 AbortError |
| 销毁后调用方法 | Promise reject，抛出 "FileChunker has been destroyed" |
| 空文件 | `hash()` 返回空文件 MD5，`slice()` 返回空数组，`upload()` 返回零分片结果 |

## Web Worker 实现

Worker 内联为 Blob URL，逻辑：
1. 接收 file 引用和 chunkSize
2. 使用 FileReader 逐片读取
3. 通过 SparkMD5.ArrayBuffer() 增量计算
4. 每读一片向主线程 postMessage 报告进度
5. 完成后 postMessage 返回最终 MD5 字符串

Worker 生命周期：
- 懒创建：首次调用 `hash()` 时创建，后续复用
- `destroy()` 时终止并 revoke Blob URL
- Worker 内部需要内联 SparkMD5 库代码（通过 Vite 构建时将 spark-md5 源码作为字符串内联到 Worker 代码中）

## Worker 中 spark-md5 的打包策略

由于 Web Worker 运行在独立作用域，无法访问主 bundle 的模块。采用以下策略：
- 将 spark-md5 的核心计算逻辑（ArrayBuffer 增量计算部分）直接内联到 Worker 代码字符串中
- 不依赖 importScripts，保持 Worker 完全自包含
- 需要的只是 `SparkMD5.ArrayBuffer` 的增量更新和 end 方法，体积很小

## 依赖

- `spark-md5`：新增依赖，用于 MD5 计算（自带 TypeScript 类型定义）

## 导出

在 `src/index.ts` 中导出：
```ts
export { FileChunker } from './utils/fileChunker'
export type { ChunkResult, UploadResult, FileChunkerOptions, UploadFn } from './utils/fileChunker'
```

## 文件结构

```
src/utils/fileChunker.ts    # 工具类主文件（含内联 Worker）
```
