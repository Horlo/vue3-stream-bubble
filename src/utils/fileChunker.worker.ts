import SparkMD5 from 'spark-md5'

self.onmessage = function (e: MessageEvent) {
  const file: File = e.data.file
  const chunkSize: number = e.data.chunkSize
  const chunks = Math.ceil(file.size / chunkSize)
  const spark = new SparkMD5.ArrayBuffer()
  let currentChunk = 0

  function loadNext() {
    const reader = new FileReader()
    reader.onload = function (ev) {
      spark.append(ev.target!.result as ArrayBuffer)
      currentChunk++
      const percent = Math.round((currentChunk / chunks) * 100)
      self.postMessage({ type: 'progress', percent })
      if (currentChunk < chunks) {
        loadNext()
      } else {
        self.postMessage({ type: 'done', hash: spark.end() })
      }
    }
    reader.onerror = function () {
      self.postMessage({ type: 'error', message: 'FileReader error' })
    }
    const start = currentChunk * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    reader.readAsArrayBuffer(file.slice(start, end))
  }

  loadNext()
}
