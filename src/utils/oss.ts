import OSS from 'ali-oss'
import { ossApi } from './api'

export interface OssUploadResult {
  url: string
  key: string
}

export interface OssSignedUrlOptions {
  mimeType?: string
  disposition?: 'inline' | 'attachment'
  expiresInSeconds?: number
  responseHeaders?: Record<string, string>
}

let client: OSS | null = null
let clientExpireAt = 0

const TOKEN_SAFE_GAP = 60 * 1000 // 提前 1 分钟刷新

function extractSTSResponse(res: unknown): RawSTSData | undefined {
  if (!res || typeof res !== 'object') return undefined
  const outer = res as { data?: unknown }
  if (outer.data && typeof outer.data === 'object') {
    const inner = outer.data as { data?: unknown }
    if (inner.data && typeof inner.data === 'object') {
      return inner.data as RawSTSData
    }
    return outer.data as RawSTSData
  }
  return res as RawSTSData
}

interface RawSTSData {
  AccessKeyId?: string
  AccessKeySecret?: string
  SecurityToken?: string
  Expiration?: string
  accessKeyId?: string
  accessKeySecret?: string
  securityToken?: string
  expiration?: string
  region?: string
  bucket?: string
}

function normalizeSTSData(raw: RawSTSData) {
  const accessKeyId = raw.AccessKeyId || raw.accessKeyId
  const accessKeySecret = raw.AccessKeySecret || raw.accessKeySecret
  const securityToken = raw.SecurityToken || raw.securityToken
  const expiration = raw.Expiration || raw.expiration
  const regionRaw = raw.region || 'oss-cn-chengdu'
  const region = regionRaw.replace(/^oss-/, '')
  const bucket = raw.bucket || 'ctbu-cqt'

  if (!accessKeyId || !accessKeySecret || !securityToken) {
    throw new Error('获取 OSS STS 凭证失败：缺少必要字段')
  }

  return {
    accessKeyId,
    accessKeySecret,
    securityToken,
    expiration,
    region,
    bucket,
  }
}

/** 判断是否需要因为权限/STS 失败而刷新凭证 */
function shouldRefreshSTS(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const err = error as {
    code?: string
    name?: string
    status?: number
    response?: { status?: number }
  }
  const code = err.code || err.name
  const status = err.status || err.response?.status

  if (status === 403) return true
  if (!code) return false

  const retrySignals = [
    'SecurityTokenExpired',
    'AccessDenied',
    'InvalidAccessKeyId',
    'SignatureDoesNotMatch',
    'SessionExpired',
  ]
  return retrySignals.some((signal) => code.includes(signal))
}

/** 初始化并缓存 OSS 客户端（带过期时间） */
async function getOSSClient(forceRefresh = false): Promise<OSS> {
  const now = Date.now()
  if (!forceRefresh && client && now < clientExpireAt - TOKEN_SAFE_GAP) {
    return client
  }

  const res = await ossApi.getSTS()
  // 后端返回结构：{ code, success, data: { AccessKeyId, ... } }
  const raw = extractSTSResponse(res)
  if (!raw) {
    throw new Error('获取 OSS STS 凭证失败：响应数据为空')
  }

  const data = normalizeSTSData(raw)
  const expireTime = Date.parse(data.expiration || '')
  clientExpireAt = Number.isNaN(expireTime) ? now + 45 * 60 * 1000 : expireTime

  const refreshToken = async () => {
    const latest = await ossApi.getSTS()
    const latestRaw = extractSTSResponse(latest)
    if (!latestRaw) {
      throw new Error('刷新 OSS STS 凭证失败：响应数据为空')
    }
    const parsed = normalizeSTSData(latestRaw)
    const latestExpire = Date.parse(parsed.expiration || '')
    clientExpireAt = Number.isNaN(latestExpire) ? Date.now() + 45 * 60 * 1000 : latestExpire
    return {
      accessKeyId: parsed.accessKeyId,
      accessKeySecret: parsed.accessKeySecret,
      stsToken: parsed.securityToken,
    }
  }

  const duration = clientExpireAt - now
  // 取有效期的一半，但最短 5 分钟，最长 30 分钟
  const refreshInterval = Math.max(
    5 * 60 * 1000, // 至少 5 分钟
    Math.min(
      30 * 60 * 1000, // 最多 30 分钟
      Math.floor(duration * 0.5)
    )
  )

  client = new OSS({
    region: data.region,
    accessKeyId: data.accessKeyId,
    accessKeySecret: data.accessKeySecret,
    stsToken: data.securityToken,
    bucket: data.bucket,
    secure: true, // https
    refreshSTSToken: refreshToken,
    refreshSTSTokenInterval: refreshInterval,
  })

  return client
}

async function putObjectWithRetry(
  key: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<void> {
  const attemptUpload = async (forceRefresh = false) => {
    const oss = await getOSSClient(forceRefresh)
    const options: OSS.PutObjectOptions & {
      progress?: (
        percentage: number,
        checkpoint?: OSS.Checkpoint,
        res?: OSS.NormalSuccessResponse
      ) => void
    } = { headers }

    if (onProgress) {
      options.progress = (percentage: number) => {
        onProgress(Math.round(percentage * 100))
      }
    }

    await oss.put(key, file, options)
  }

  try {
    await attemptUpload(false)
  } catch (error) {
    if (shouldRefreshSTS(error)) {
      client = null
      clientExpireAt = 0
      await attemptUpload(true)
      return
    }
    console.error('OSS 上传失败:', error)
    throw error
  }
}

export async function getSignedOssUrl(
  key: string,
  options: OssSignedUrlOptions = {}
): Promise<string> {
  if (!key) {
    throw new Error('OSS 对象 key 不能为空')
  }

  const { disposition = 'inline', expiresInSeconds = 60 * 10, responseHeaders = {} } = options

  const oss = await getOSSClient()
  return oss.signatureUrl(key, {
    expires: expiresInSeconds,
    response: {
      'content-disposition': disposition,
      // 不再覆盖 content-type，OSS 会使用对象元数据中的 Content-Type
      ...Object.fromEntries(
        Object.entries(responseHeaders).filter(([k]) => k.toLowerCase() !== 'content-type')
      ),
    },
  })
}

/**
 * 上传文件（所有文件统一走 STS 方式）
 * 支持 PDF 内联预览、图片、Word 等一切文件
 */
export const uploadToOssWithKey = async (
  file: File,
  dir = 'uploads/announcements/',
  onProgress?: (progress: number) => void,
  extraHeaders?: Record<string, string>
): Promise<OssUploadResult> => {
  // 生成唯一 key
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'file'
  const key = `${dir}${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`

  const headers = {
    'Content-Disposition': 'inline', // 所有文件都内联（PDF 必备）
    'Content-Type': file.type || 'application/octet-stream',
    ...(extraHeaders || {}),
  }

  await putObjectWithRetry(key, file, headers, onProgress)

  const url = await getSignedOssUrl(key, {
    mimeType: file.type || 'application/octet-stream',
    disposition: 'inline',
    expiresInSeconds: 60 * 30,
  })

  return { url, key }
}

// 兼容旧代码（头像、图片上传等）
export const uploadToOss = async (
  file: File,
  dir?: string,
  onProgress?: (progress: number) => void,
  extraHeaders?: Record<string, string>
): Promise<string> => {
  const { url } = await uploadToOssWithKey(file, dir, onProgress, extraHeaders)
  return url
}

// 工具函数保持不变
export const validateFileSize = (file: File): boolean => file.size <= 10 * 1024 * 1024

export const validateFileType = (file: File, types: string[]): boolean => types.includes(file.type)

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
