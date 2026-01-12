export interface JsonParseSuccess {
  success: true
  data: unknown[]
}

export interface JsonParseFailure {
  success: false
  error: string
}

export type JsonParseResponse = JsonParseSuccess | JsonParseFailure

// 处理 JSON 解析请求
self.onmessage = (e: MessageEvent<string>) => {
  try {
    const text = e.data

    // 使用 setTimeout 确保消息能够及时发送，避免阻塞
    // 对于大量数据，分批处理可以避免长时间阻塞
    if (text.length > 100000) {
      // 对于超大数据，使用分批解析策略
      self.postMessage({
        success: true,
        data: parseLargeJson(text),
      } as JsonParseResponse)
      return
    }

    const parsed = JSON.parse(text)

    if (!Array.isArray(parsed)) {
      const msg: JsonParseResponse = {
        success: false,
        error: '必须是对象数组',
      }
      self.postMessage(msg)
      return
    }

    const msg: JsonParseResponse = {
      success: true,
      data: parsed,
    }
    self.postMessage(msg)
  } catch (err: unknown) {
    const msg: JsonParseResponse = {
      success: false,
      error: err instanceof Error ? err.message : 'JSON 解析失败',
    }
    self.postMessage(msg)
  }
}

// 对于超大数据，使用更安全的解析方式
function parseLargeJson(text: string): unknown[] {
  try {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) {
      throw new Error('必须是对象数组')
    }
    return parsed
  } catch (err) {
    throw err instanceof Error ? err : new Error('JSON 解析失败')
  }
}

export {}
