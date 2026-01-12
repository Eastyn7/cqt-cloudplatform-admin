/**
 * 合并 class 名称的工具函数
 * 类似于 clsx 或 classnames
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 使用 Web Worker 解析 JSON 数据的 Hook
 * 避免在主线程中解析大量 JSON 数据导致页面卡顿
 */
import JsonParserWorker from '@/workers/jsonParserWorker.ts?worker'
import type { JsonParseResponse } from '@/workers/jsonParserWorker'

export function useJsonImportWorker<T = unknown>() {
  let workerInstance: Worker | null = null

  const parseJson = (text: string): Promise<T[]> => {
    return new Promise<T[]>((resolve, reject) => {
      // 清理之前的 worker 实例
      if (workerInstance) {
        workerInstance.terminate()
        workerInstance = null
      }

      // 创建新的 worker 实例
      workerInstance = new JsonParserWorker()

      // 设置超时处理，避免 worker 挂起
      const timeoutId = setTimeout(() => {
        if (workerInstance) {
          workerInstance.terminate()
          workerInstance = null
          reject(new Error('JSON 解析超时，请检查数据大小'))
        }
      }, 30000) // 30秒超时

      workerInstance.onmessage = (e: MessageEvent<JsonParseResponse>) => {
        clearTimeout(timeoutId)
        if (workerInstance) {
          workerInstance.terminate()
          workerInstance = null
        }

        if (!e.data.success) {
          reject(new Error(e.data.error))
          return
        }
        resolve(e.data.data as T[])
      }

      workerInstance.onerror = (error) => {
        clearTimeout(timeoutId)
        if (workerInstance) {
          workerInstance.terminate()
          workerInstance = null
        }
        reject(new Error(`Worker 错误: ${error.message || '未知错误'}`))
      }

      // 发送数据到 worker
      workerInstance.postMessage(text)
    })
  }

  // 清理函数
  const cleanup = () => {
    if (workerInstance) {
      workerInstance.terminate()
      workerInstance = null
    }
  }

  return {
    parseJson,
    cleanup,
  }
}
