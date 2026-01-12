import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { message } from '../message'
import { formatForServer, parseFromServer } from '../date'
import type { ApiResponse, RequestConfig, RequestResponse } from './types'

/**
 * 创建 Axios 实例
 */
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 从环境变量读取 API 基础路径
  timeout: 30000, // 请求超时时间 30 秒
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

/**
 * 请求拦截器
 */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig & RequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')

    // 如果需要 token 且存在，则添加到请求头
    if (!config.skipAuth && token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 自动转换时间格式：将 Date 对象、dayjs 对象或 ISO 字符串转换为 MySQL 格式
    // 处理请求体（POST/PUT/PATCH 等）
    if (config.data && typeof config.data === 'object') {
      config.data = formatForServer(config.data)
    }
    // 处理查询参数（GET 请求等）
    if (config.params && typeof config.params === 'object') {
      config.params = formatForServer(config.params)
    }

    return config
  },
  (error: AxiosError) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  },
)

/**
 * 响应拦截器
 * 根据后端接口文档规范处理响应
 */
service.interceptors.response.use(
  (response: RequestResponse) => {
    const res = response.data
    const config = response.config as RequestConfig

    // 根据后端规范：success === true 或 code 在 2xx 范围内即为成功
    const isSuccess = res.success === true || (res.code >= 200 && res.code < 300)

    if (isSuccess) {
      // 请求成功
      // 显示成功提示（如果需要）
      if (config?.showSuccess && res.message) {
        message.success(res.message)
      }
      // 自动转换时间格式：将后端返回的 ISO 时间字符串转换为 Date 对象（用于 el-date-picker 等组件）
      if (res.data) {
        res.data = parseFromServer(res.data)
      }
      // 同时处理 meta 字段（可能包含时间字段）
      if (res.meta) {
        res.meta = parseFromServer(res.meta)
      }
      // 返回完整的响应对象
      return response
    }

    // 处理业务错误（根据后端规范的状态码）
    // 401: 未授权，需要重新登录
    if (res.code === 401) {
      const errorMsg = res.message || '未授权'
      if (config?.skipAuth) {
        // 登录等无需鉴权的接口（例如账号/密码错误），只提示即可
        if (config?.showError !== false) {
          message.error(errorMsg)
        }
        return Promise.reject(new Error(errorMsg))
      }

      if (config?.showError !== false) {
        message.warning(errorMsg || '登录状态已过期，请重新登录')
        // 清除 token 和用户信息
        localStorage.removeItem('token')
        // 延迟跳转到首页/登录页，让用户看到提示
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      }
      return Promise.reject(new Error(errorMsg))
    }

    // 400: 参数错误
    if (res.code === 400) {
      if (config?.showError !== false) {
        message.error(res.message || '请求参数错误')
      }
      return Promise.reject(new Error(res.message || '请求参数错误'))
    }

    // 403: 无权限
    if (res.code === 403) {
      if (config?.showError !== false) {
        message.error(res.message || '无权限访问')
      }
      return Promise.reject(new Error(res.message || '无权限访问'))
    }

    // 404: 资源不存在
    if (res.code === 404) {
      if (config?.showError !== false) {
        message.error(res.message || '请求的资源不存在')
      }
      return Promise.reject(new Error(res.message || '请求的资源不存在'))
    }

    // 409: 数据冲突
    if (res.code === 409) {
      if (config?.showError !== false) {
        message.error(res.message || '数据冲突')
      }
      return Promise.reject(new Error(res.message || '数据冲突'))
    }

    // 500: 内部服务器错误
    if (res.code === 500) {
      if (config?.showError !== false) {
        message.error(res.message || '服务器内部错误')
      }
      return Promise.reject(new Error(res.message || '服务器内部错误'))
    }

    // 503: 服务不可用
    if (res.code === 503) {
      if (config?.showError !== false) {
        message.error(res.message || '服务不可用')
      }
      return Promise.reject(new Error(res.message || '服务不可用'))
    }

    // 其他错误
    if (config?.showError !== false) {
      message.error(res.message || '请求失败')
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error: AxiosError<ApiResponse>) => {
    const config = error.config as RequestConfig | undefined

    // 处理网络错误或 HTTP 错误（当请求未到达服务器或服务器返回非 200 状态码时）
    let errorMessage = '请求失败'

    if (error.response) {
      // 服务器返回了响应，但状态码不在 2xx 范围内
      // 尝试从响应数据中获取错误信息
      const res = error.response.data

      if (res && res.message) {
        // 如果响应体包含后端规范的错误信息，使用它
        errorMessage = res.message

        // 处理特定的状态码
        if (error.response.status === 401) {
          const unauthorizedMsg = res.message || '未授权，请重新登录'

          if (config?.skipAuth) {
            if (config?.showError !== false) {
              message.error(unauthorizedMsg)
            }
            return Promise.reject(new Error(unauthorizedMsg))
          }

          if (config?.showError !== false) {
            message.warning(unauthorizedMsg)
            localStorage.removeItem('token')
            setTimeout(() => {
              window.location.href = '/'
            }, 1500)
          }
        } else if (config?.showError !== false) {
          message.error(errorMessage)
        }
      } else {
        // 响应体不符合后端规范，使用 HTTP 状态码判断
        const status = error.response.status
        switch (status) {
          case 400:
            errorMessage = '请求参数错误'
            break
          case 401:
            errorMessage = '未授权，请重新登录'
            localStorage.removeItem('token')
            window.location.href = '/login'
            break
          case 403:
            errorMessage = '无权限访问'
            break
          case 404:
            errorMessage = '请求的资源不存在'
            break
          case 409:
            errorMessage = '数据冲突'
            break
          case 500:
            errorMessage = '服务器内部错误'
            break
          case 502:
            errorMessage = '网关错误'
            break
          case 503:
            errorMessage = '服务不可用'
            break
          case 504:
            errorMessage = '网关超时'
            break
          default:
            errorMessage = `请求失败 (${status})`
        }

        if (config?.showError !== false) {
          message.error(errorMessage)
        }
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应（网络错误）
      errorMessage = '网络连接失败，请检查网络'
      if (config?.showError !== false) {
        message.error(errorMessage)
      }
    } else {
      // 其他错误（如请求配置错误）
      errorMessage = error.message || '请求失败'
      if (config?.showError !== false) {
        message.error(errorMessage)
      }
    }

    return Promise.reject(error)
  },
)

/**
 * 请求封装
 */
export const request = {
  /**
   * GET 请求
   */
  get<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return service.get<ApiResponse<T>>(url, config).then((res) => res.data)
  },

  /**
   * POST 请求
   */
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return service.post<ApiResponse<T>>(url, data, config).then((res) => res.data)
  },

  /**
   * PUT 请求
   */
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return service.put<ApiResponse<T>>(url, data, config).then((res) => res.data)
  },

  /**
   * DELETE 请求
   */
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return service.delete<ApiResponse<T>>(url, config).then((res) => res.data)
  },

  /**
   * PATCH 请求
   */
  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return service.patch<ApiResponse<T>>(url, data, config).then((res) => res.data)
  },
}

export default service
