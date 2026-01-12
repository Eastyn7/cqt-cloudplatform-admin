// 将导入的任意值转换为去除首尾空格的字符串（null/undefined 统一为空串）
export const normalizeImportValue = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

// 将单行原始数据转换为目标类型的构建函数
type BuildEntry<T, R> = (raw: R) => T

// 批量导入时的一些钩子配置
interface ApplyImportedEntriesOptions {
  replace?: boolean
  onEmpty?: () => void
  onSuccess?: (count: number) => void
}

// 将导入的多行数据转换为目标数组中的实体，并支持替换/累加以及成功/空数据回调
export const applyImportedEntries = <T, R>(
  rows: R[],
  buildEntry: BuildEntry<T, R>,
  target: T[],
  options: ApplyImportedEntriesOptions = {},
) => {
  const { replace = true, onEmpty, onSuccess } = options
  if (!rows.length) {
    onEmpty?.()
    return
  }
  if (replace) {
    target.splice(0, target.length)
  }
  rows.forEach((row) => {
    target.push(buildEntry(row))
  })
  onSuccess?.(rows.length)
}

