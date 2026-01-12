import * as XLSX from 'xlsx'

// 通用的 Excel 行数据结构，按列名映射到对应的单元格值
export type ExcelRow = Record<string, string | number | boolean | null | undefined>

// 读取 Excel 时的一些可选配置
export interface ReadExcelOptions {
  // 要读取的工作表索引（从 0 开始）
  sheetIndex?: number
  // 空单元格填充的默认值
  defaultValue?: string | number | boolean | null
  // 透传给 sheet_to_json 的高级配置
  jsonOptions?: XLSX.Sheet2JSONOpts
}

// 支持的文件输入类型：File / Blob / ArrayBuffer 等
type SupportedFile = File | Blob | ArrayBuffer | ArrayBufferView

// 将各种输入统一转换为 ArrayBuffer，方便交给 xlsx 解析
const toArrayBuffer = async (file: SupportedFile): Promise<ArrayBuffer> => {
  if (file instanceof ArrayBuffer) return file
  if (ArrayBuffer.isView(file)) {
    // ArrayBufferView 需要转换为新的 ArrayBuffer
    const view = file as ArrayBufferView
    const buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)
    // 确保返回的是 ArrayBuffer 而不是 SharedArrayBuffer
    if (buffer instanceof SharedArrayBuffer) {
      // 将 SharedArrayBuffer 转换为 ArrayBuffer
      const uint8Array = new Uint8Array(buffer)
      return uint8Array.buffer as unknown as ArrayBuffer
    }
    return buffer as ArrayBuffer
  }
  if (file instanceof Blob) return await file.arrayBuffer()
  throw new Error('不支持的文件类型')
}

// 读取 Excel 文件并返回按行组织的 JSON 数据
export const readExcelRows = async <T extends ExcelRow = ExcelRow>(
  file: SupportedFile,
  options: ReadExcelOptions = {}
): Promise<T[]> => {
  const buffer = await toArrayBuffer(file)
  const workbook = XLSX.read(buffer, { type: 'array' })
  const { sheetIndex = 0, defaultValue = '', jsonOptions } = options
  const sheetName = workbook.SheetNames?.[sheetIndex]
  if (!sheetName) {
    throw new Error('Excel 文件中未找到有效的工作表')
  }
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error('目标工作表不存在或为空')
  }
  return XLSX.utils.sheet_to_json<T>(sheet, {
    defval: defaultValue,
    raw: false,
    ...jsonOptions,
  })
}
