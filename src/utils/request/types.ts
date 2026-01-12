import type { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * 响应数据基础结构
 * 根据后端接口文档规范定义
 */
export interface ApiResponse<T = unknown> {
  /** HTTP 状态码（如 200 / 400 / 401 / 500） */
  code: number
  /** 是否成功（code 在 2xx 范围内即为成功） */
  success: boolean
  /** 操作结果说明（如成功、错误原因等） */
  message: string
  /** 实际业务数据内容，可为空 */
  data: T | null
  /** 附加元数据（分页信息、统计信息等，可选） */
  meta?: Record<string, unknown> | null
  /** 开发模式下返回的调试信息（仅在 NODE_ENV=development 时存在） */
  debug?: Record<string, unknown> | null
}

/**
 * 扩展 Axios 请求配置
 */
export interface RequestConfig extends AxiosRequestConfig {
  /**
   * 是否显示错误提示（默认 true）
   */
  showError?: boolean
  /**
   * 是否显示成功提示（默认 false）
   */
  showSuccess?: boolean
  /**
   * 是否跳过 token 验证（默认 false）
   */
  skipAuth?: boolean
}

/**
 * 扩展 Axios 响应类型
 */
export type RequestResponse<T = unknown> = AxiosResponse<ApiResponse<T>>
