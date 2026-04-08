<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="announcements">
    <el-card shadow="hover" class="announcement-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>公告通知</span>
            <p class="subtitle">展示已发布公告（只读）</p>
          </div>
          <el-button type="primary" @click="loadData" :loading="loading">刷新</el-button>
        </div>
      </template>

      <el-empty v-if="!list.length && !loading" description="暂无公告" :image-size="120" />

      <el-skeleton v-else :loading="loading" :rows="5" animated>
        <div class="announcement-list">
          <el-card
            v-for="item in list"
            :key="item.announcement_id"
            shadow="never"
            class="announcement-item"
            @click="openDetail(item)"
          >
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span>{{ item.term_name || '未分届次' }}</span>
              <span>{{ formatTime(item.publish_time || item.created_at) }}</span>
            </div>
          </el-card>
        </div>
      </el-skeleton>
    </el-card>

    <el-dialog v-model="detailVisible" :title="activeTitle" width="720px" top="8vh">
      <div class="detail-meta">
        <span>{{ activeTerm }}</span>
        <span>{{ activeTime }}</span>
      </div>
      <div v-loading="detailLoading" class="detail-body">
        <div v-if="isPdfAnnouncement && activeFilePreviewUrl" class="detail-pdf-preview">
          <object :data="activeFilePreviewUrl" type="application/pdf" class="pdf-object">
            <iframe :src="activeFilePreviewUrl" class="pdf-iframe" frameborder="0"></iframe>
          </object>
        </div>
        <el-alert
          v-else-if="isPdfAnnouncement && !detailLoading"
          title="当前 PDF 预览地址不可用"
          type="warning"
          :closable="false"
          show-icon
        />
        <div
          v-else-if="activeContentHtml"
          class="detail-content rich-doc-content"
          v-html="activeContentHtml"
        ></div>
        <el-empty
          v-else
          description="暂无可预览内容"
          :image-size="90"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { announcementApi } from '@/utils/api'
import type { AnnouncementInfo } from '@/utils/api/types'
import { message } from '@/utils/message'
import { useDate } from '@/utils/date'
import { getSignedOssUrl } from '@/utils/oss'

const dateUtil = useDate

const list = ref<AnnouncementInfo[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const activeItem = ref<AnnouncementInfo | null>(null)
const activeFilePreviewUrl = ref('')
const pdfBlobPreviewUrl = ref('')

const activeTitle = computed(() => activeItem.value?.title || '公告详情')
const activeTerm = computed(() => activeItem.value?.term_name || '未分届次')
const activeTime = computed(() =>
  formatTime(activeItem.value?.publish_time || activeItem.value?.created_at)
)

const isPdfAnnouncement = computed(() => (activeItem.value?.file_type || '').toLowerCase() === 'pdf')

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const sanitizeAnnouncementHtml = (html: string): string => {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')
}

const activeContentHtml = computed(() => {
  const raw = (activeItem.value?.content || '').trim()
  if (!raw) return ''
  const hasHtmlTag = /<[^>]+>/.test(raw)
  if (!hasHtmlTag) {
    return `<p style="white-space: pre-wrap;">${escapeHtml(raw)}</p>`
  }
  return sanitizeAnnouncementHtml(raw)
})

const formatTime = (value?: string | null) => (value ? dateUtil.format(value) : '--')

const forceInlineDisposition = (url: string): string => {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('response-content-disposition', 'inline')
    return parsed.toString()
  } catch {
    const hasQuery = url.includes('?')
    const separator = hasQuery ? '&' : '?'
    return `${url}${separator}response-content-disposition=inline`
  }
}

const getLegacyFileUrl = (item: AnnouncementInfo): string => {
  const legacy = (item as AnnouncementInfo & { file_url?: string | null }).file_url
  return typeof legacy === 'string' ? legacy : ''
}

const revokePdfBlobUrl = () => {
  if (pdfBlobPreviewUrl.value) {
    URL.revokeObjectURL(pdfBlobPreviewUrl.value)
    pdfBlobPreviewUrl.value = ''
  }
}

const buildPdfBlobPreviewUrl = async (sourceUrl: string): Promise<string> => {
  if (!sourceUrl) return ''
  try {
    const response = await fetch(sourceUrl, { method: 'GET' })
    if (!response.ok) {
      throw new Error(`PDF 下载失败: ${response.status}`)
    }
    const buffer = await response.arrayBuffer()
    const blobUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
    return blobUrl
  } catch (error) {
    console.error('构建 PDF Blob 预览失败:', error)
    return ''
  }
}

const buildInlinePreviewUrl = async (item: AnnouncementInfo): Promise<string> => {
  if (!item.file_key) {
    return forceInlineDisposition(getLegacyFileUrl(item))
  }
  try {
    const signed = await getSignedOssUrl(item.file_key, {
      disposition: 'inline',
      expiresInSeconds: 60 * 10,
    })
    return forceInlineDisposition(signed)
  } catch (error) {
    console.error('生成公告附件预览链接失败:', error)
    return forceInlineDisposition(getLegacyFileUrl(item))
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await announcementApi.getPublished()
    list.value = res.data?.list || []
  } catch (error) {
    console.error('加载公告失败:', error)
    message.error('加载公告失败')
  } finally {
    loading.value = false
  }
}

const openDetail = async (item: AnnouncementInfo) => {
  detailLoading.value = true
  revokePdfBlobUrl()
  activeItem.value = item
  activeFilePreviewUrl.value = ''
  if (isPdfAnnouncement.value) {
    const signedUrl = await buildInlinePreviewUrl(item)
    const blobUrl = await buildPdfBlobPreviewUrl(signedUrl)
    activeFilePreviewUrl.value = blobUrl || signedUrl
    pdfBlobPreviewUrl.value = blobUrl
  }
  detailVisible.value = true
  detailLoading.value = false
}

watch(detailVisible, (visible) => {
  if (!visible) {
    revokePdfBlobUrl()
  }
})

onBeforeUnmount(() => {
  revokePdfBlobUrl()
})

loadData()
</script>

<style scoped>
.announcements {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 16px;
}

.announcement-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.announcement-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.announcement-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  flex: 1;
  overflow: auto;
  align-content: flex-start;
}

.announcement-item {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.announcement-item {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.announcement-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
}

.item-title {
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-size: 13px;
  margin-bottom: 16px;
}

.detail-content {
  line-height: 1.8;
  color: #1f2d3d;
}

.detail-body {
  min-height: 280px;
}

.detail-pdf-preview {
  height: 70vh;
  min-height: 420px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-object {
  width: 100%;
  height: 100%;
}

.rich-doc-content {
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  overflow: auto;
  max-height: 70vh;
}

.rich-doc-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.rich-doc-content :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
