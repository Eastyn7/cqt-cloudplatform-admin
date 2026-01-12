/**
 * 消息通知封装工具
 * 统一管理所有消息提示的样式和位置
 */
import { type MessageOptions } from 'element-plus'

// 基础配置
const baseConfig: Partial<MessageOptions> = {
  offset: 80, // 距离顶部的偏移量
  duration: 3000, // 显示时长（毫秒）
  showClose: false, // 不显示关闭按钮
  customClass: 'custom-message', // 自定义类名
}

/**
 * 显示成功消息
 */
export const showSuccess = (message: string, options?: Partial<MessageOptions>) => {
  return ElMessage({
    ...baseConfig,
    ...options,
    message,
    type: 'success',
    customClass: 'custom-message custom-success-message',
  })
}

/**
 * 显示错误消息
 */
export const showError = (message: string, options?: Partial<MessageOptions>) => {
  return ElMessage({
    ...baseConfig,
    ...options,
    message,
    type: 'error',
    customClass: 'custom-message custom-error-message',
  })
}

/**
 * 显示警告消息
 */
export const showWarning = (message: string, options?: Partial<MessageOptions>) => {
  return ElMessage({
    ...baseConfig,
    ...options,
    message,
    type: 'warning',
    customClass: 'custom-message custom-warning-message',
    duration: 4000, // 警告消息显示时间稍长一些
  })
}

/**
 * 显示信息消息
 */
export const showInfo = (message: string, options?: Partial<MessageOptions>) => {
  return ElMessage({
    ...baseConfig,
    ...options,
    message,
    type: 'info',
    customClass: 'custom-message custom-info-message',
  })
}

/**
 * 消息通知对象（统一导出）
 */
export const message = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
}

export default message
