// utils/date.ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

export type DateInput = string | number | Date | dayjs.Dayjs | null | undefined

const MYSQL_FORMAT = 'YYYY-MM-DD HH:mm:ss'

/**
 * 核心：安全把任何东西转成 dayjs 对象（比 new Date 更强大、更安全）
 */
export const toDayjs = (value: DateInput): dayjs.Dayjs | null => {
  if (!value) return null
  const d = dayjs(value)
  return d.isValid() ? d : null
}

/**
 * 安全转成原生 Date 对象（el-date-picker 必须的）
 */
export const toDate = (value: DateInput): Date | null => {
  const d = toDayjs(value)
  return d ? d.toDate() : null
}

/**
 * 格式化展示用（默认中文风格）
 */
export const formatDate = (
  value: DateInput,
  pattern = 'YYYY/MM/DD HH:mm',
  fallback = '-'
): string => {
  const d = toDayjs(value)
  return d ? d.format(pattern) : fallback
}

// 常用快捷格式
export const formatDateTime = (value: DateInput) => formatDate(value, 'YYYY-MM-DD HH:mm:ss')
export const formatDateShort = (value: DateInput) => formatDate(value, 'YYYY-MM-DD')
export const formatMonthDay = (value: DateInput, fallback?: string) => formatDate(value, 'MM-DD', fallback)
export const formatTime = (value: DateInput) => formatDate(value, 'HH:mm')

/**
 * 解析日期（兼容旧代码，实际使用 toDate）
 */
export const parseDate = (value: DateInput): Date | null => {
  return toDate(value)
}

/**
 * 判断日期是否在指定范围内（包含边界）
 * 判断 value 是否在 [start, end) 范围内（包含 start，不包含 end）
 */
export const isBetween = (
  value: DateInput,
  start: DateInput,
  end: DateInput,
): boolean => {
  if (!value) return false
  const d = toDayjs(value)
  const startD = toDayjs(start)
  const endD = toDayjs(end)
  if (!d || !startD || !endD) return false
  // 判断是否在 [start, end) 范围内
  return (d.isAfter(startD) || d.isSame(startD)) && d.isBefore(endD)
}

/**
 * 后端 → 前端：自动把所有 ISO 字符串转成 Date 对象（回显
 * 支持单个对象或数组，零配置
 */
export const parseFromServer = <T>(data: T): T => {
  if (!data || typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map(item => parseFromServer(item)) as T
  }

  const result = { ...data } as Record<string, unknown>
  Object.keys(result).forEach(key => {
    const value = result[key]

    // 跳过 null / undefined / 数字 / 布尔
    if (value == null || typeof value !== 'string') return

    // 匹配任何 ISO 时间字符串（带 T 和 Z/+08:00 都行）
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const d = toDate(value)
      if (d) result[key] = d // 转成原生 Date，el-date-picker 完美识别
    }
  })

  return result as T
}

/**
 * 前端 → 后端：把所有可能的日期类型统一转成 MySQL 最爱的字符串
 * 支持 Date / dayjs / ISO字符串 / 正常字符串
 * 支持单个对象或数组，递归处理嵌套结构
 */
export const formatForServer = <T>(data: T): T => {
  if (!data || typeof data !== 'object') return data

  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => formatForServer(item)) as T
  }

  // 处理对象
  const result = { ...data } as Record<string, unknown>

  Object.keys(result).forEach(key => {
    const value = result[key]

    // 递归处理嵌套对象或数组
    if (value && typeof value === 'object') {
      result[key] = formatForServer(value)
      return
    }

    // 处理日期类型
    if (value instanceof Date || dayjs.isDayjs(value) || (typeof value === 'string' && value.includes('T'))) {
      const d = toDayjs(value as DateInput)
      if (d) {
        result[key] = d.format(MYSQL_FORMAT) // 永远是 2025-11-30 13:35:00
      }
    }
    // 已经是 YYYY-MM-DD HH:mm:ss 格式的就不动，避免重复转换
  })

  return result as T
}

/**
 * 超级好用的全局工具对象（推荐全项目这样用）
 */
export const useDate = {
  toDate,
  toDayjs,
  format: formatDate,
  formatTime: formatDateTime,
  formatDate: formatDateShort,
  formatMonthDay,
  formatTimeOnly: formatTime,

  // 兼容旧代码的方法
  parseDate,
  isBetween,

  // 最重要的两个：前后端桥接
  parseFromServer,
  formatForServer,
} as const
