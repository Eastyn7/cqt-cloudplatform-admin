<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="announcement-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">公告与通知</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">公告列表</span>
              <el-form
                :model="searchForm"
                inline
                label-width="0"
                @submit.prevent
                class="search-form"
              >
                <el-form-item>
                  <el-input
                    v-model="searchForm.keyword"
                    placeholder="标题 / 届次 / 作者"
                    clearable
                    @keyup.enter="handleSearch"
                    class="search-input"
                  >
                    <template #prefix>
                      <el-icon class="el-input__icon">
                        <Search />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item>
                  <el-select
                    v-model="searchForm.status"
                    placeholder="状态"
                    clearable
                    class="search-select"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="草稿" value="草稿" />
                    <el-option label="已发布" value="已发布" />
                    <el-option label="归档" value="归档" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="handleSearch" class="search-btn">
                    <el-icon>
                      <Search />
                    </el-icon>
                    查询
                  </el-button>
                </el-form-item>

                <el-form-item>
                  <el-button @click="handleResetFilters" class="reset-btn">
                    <el-icon>
                      <Refresh />
                    </el-icon>
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
            <div class="header-right">
              <el-button type="primary" @click="openEditDialog()">
                <el-icon>
                  <Plus />
                </el-icon>
                新增公告
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="paginatedData" v-loading="loading" border stripe table-layout="auto">
            <el-table-column label="序号" width="60" align="center">
              <template #default="{ $index }">
                {{ $index + 1 + (pagination.page - 1) * pagination.pageSize }}
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="220" />
            <el-table-column prop="term_name" label="届次" width="120" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="publish_time" label="发布时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.publish_time) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="file_type" label="附件" width="100" align="center">
              <template #default="{ row }">
                <span v-if="row.file_type && row.file_type !== 'none'">{{ row.file_type }}</span>
                <span v-else>无</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openDetail(row)"
                  >查看详情</el-button
                >
                <el-button type="danger" link size="small" @click="handleDelete(row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

      <!-- 详情 Drawer -->
      <el-drawer
        v-model="detailVisible"
        title="公告详情与编辑"
        size="860px"
        :with-header="true"
        class="announcement-detail-drawer"
      >
        <el-form :model="detailForm" label-width="100px" class="detail-form">
          <el-form-item label="标题">
            <el-input v-model="detailForm.title" />
          </el-form-item>
          <el-form-item label="届次">
            <el-input v-model="detailForm.term_name" disabled />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="detailForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 100%"
            >
              <el-option label="草稿" value="草稿" />
              <el-option label="已发布" value="已发布" />
              <el-option label="归档" value="归档" />
            </el-select>
          </el-form-item>
          <el-form-item label="发布时间">
            <el-date-picker
              v-model="detailForm.publish_time"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择发布时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="正文内容" class="content-form-item">
            <div class="content-form-item-inner">
              <el-tabs v-model="detailContentEditMode" type="border-card" class="content-tabs">
                <el-tab-pane label="编辑" name="edit">
                  <div class="content-editor">
                    <el-input
                      v-model="detailForm.content"
                      type="textarea"
                      class="content-editor-input"
                      :rows="15"
                      placeholder="支持直接编辑 HTML 或纯文本内容。上传 Word 附件后，后端会自动解析内容到此处。"
                    />
                  </div>
                </el-tab-pane>
                <el-tab-pane label="预览" name="preview">
                  <!-- PDF 附件预览（使用 iframe，兼容性最佳） -->
                  <div
                    v-if="detailForm.file_type === 'pdf' && detailForm.file_url"
                    class="content-preview-pdf"
                  >
                    <iframe
                      :src="detailForm.file_url"
                      class="pdf-iframe"
                      frameborder="0"
                      width="100%"
                      height="100%"
                    ></iframe>
                    <div class="pdf-fallback" v-if="false">
                      PDF 加载失败，请
                      <el-link :href="detailForm.file_url" target="_blank" type="primary"
                        >下载查看</el-link
                      >
                    </div>
                  </div>
                  <!-- 否则显示HTML内容 -->
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div
                    v-else
                    class="content-preview"
                    v-html="
                      detailForm.content || '<p style=&quot;color: #909399;&quot;>暂无内容</p>'
                    "
                  ></div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-form-item>
          <el-form-item label="附件">
            <div class="attachment-upload">
              <el-select
                v-model="detailForm.file_type"
                placeholder="请选择附件类型"
                clearable
                style="width: 200px; margin-right: 12px"
              >
                <el-option label="无" value="none" />
                <el-option label="PDF" value="pdf" />
                <el-option label="Word" value="word" />
              </el-select>
              <el-upload
                v-if="detailForm.file_type && detailForm.file_type !== 'none'"
                class="attachment-upload-btn"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                :accept="
                  detailForm.file_type === 'pdf'
                    ? 'application/pdf'
                    : 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                "
                :disabled="fileUploading"
                @change="handleDetailFileChange"
              >
                <el-button :loading="fileUploading">上传附件</el-button>
              </el-upload>
              <div class="attachment-preview" v-if="detailForm.file_url">
                <div class="attachment-actions">
                  <el-link
                    :href="detailForm.file_url"
                    target="_blank"
                    type="primary"
                    :underline="false"
                  >
                    <el-icon style="margin-right: 4px"><Document /></el-icon>
                    查看附件
                  </el-link>
                  <el-button
                    type="danger"
                    link
                    size="small"
                    @click="handleDetailRemoveAttachment"
                    style="margin-left: 12px"
                  >
                    删除附件
                  </el-button>
                </div>
                <div v-if="detailForm.file_type === 'word'" class="word-preview-tip">
                  <el-text type="info" size="small">Word文档可在新窗口打开查看</el-text>
                </div>
              </div>
              <el-progress
                v-if="fileUploading"
                :percentage="fileProgress"
                :stroke-width="4"
                status="success"
                style="margin-top: 8px"
              />
            </div>
          </el-form-item>
        </el-form>

        <el-descriptions border :column="1" class="detail-meta" title="其他信息">
          <el-descriptions-item label="创建时间">{{
            dateUtil.format(detailForm.created_at) || '--'
          }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{
            dateUtil.format(detailForm.updated_at) || '--'
          }}</el-descriptions-item>
        </el-descriptions>

        <template #footer>
          <span class="drawer-footer">
            <el-button @click="detailVisible = false">取消</el-button>
            <el-button type="primary" :loading="detailSaving" @click="handleDetailSave"
              >保存</el-button
            >
          </span>
        </template>
      </el-drawer>
    </div>

    <!-- 新增/编辑公告对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.announcement_id ? '编辑公告' : '新增公告'"
      :close-on-click-modal="false"
      class="announcement-edit-dialog admin-modal-large"
      @closed="resetEditForm"
    >
      <el-form :model="editForm" label-width="96px" class="edit-form">
        <el-form-item label="标题" required>
          <el-input v-model="editForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="届次">
          <el-select
            v-model="editForm.term_id"
            placeholder="选填，关联服务队届次"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="term in teamTerms"
              :key="term.term_id"
              :label="term.term_name"
              :value="term.term_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="草稿" />
            <el-option label="已发布" value="已发布" />
            <el-option label="归档" value="归档" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="editForm.publish_time"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择发布时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="正文内容" class="content-form-item">
          <div class="content-form-item-inner">
            <el-tabs v-model="contentEditMode" type="border-card" class="content-tabs">
              <el-tab-pane label="编辑" name="edit">
                <div class="content-editor">
                  <el-input
                    v-model="editForm.content"
                    type="textarea"
                    class="content-editor-input"
                    :rows="15"
                    placeholder="支持直接编辑 HTML 或纯文本内容。上传 Word 附件后，后端会自动解析内容到此处。"
                  />
                </div>
              </el-tab-pane>
              <el-tab-pane label="预览" name="preview">
                <!-- PDF 附件预览（使用 iframe，兼容性最佳） -->
                <div
                  v-if="editForm.file_type === 'pdf' && editForm.file_url"
                  class="content-preview-pdf"
                >
                  <iframe
                    :src="editForm.file_url"
                    class="pdf-iframe"
                    frameborder="0"
                    width="100%"
                    height="100%"
                  ></iframe>
                  <div class="pdf-fallback" v-if="false">
                    PDF 加载失败，请
                    <el-link :href="editForm.file_url" target="_blank" type="primary"
                      >下载查看</el-link
                    >
                  </div>
                </div>
                <!-- 否则显示HTML内容 -->
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div
                  v-else
                  class="content-preview"
                  v-html="editForm.content || '<p style=&quot;color: #909399;&quot;>暂无内容</p>'"
                ></div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </el-form-item>
        <el-form-item label="附件">
          <div class="attachment-upload">
            <el-select
              v-model="editForm.file_type"
              placeholder="请选择附件类型"
              clearable
              style="width: 200px; margin-right: 12px"
            >
              <el-option label="无" value="none" />
              <el-option label="PDF" value="pdf" />
              <el-option label="Word" value="word" />
            </el-select>
            <el-upload
              v-if="editForm.file_type && editForm.file_type !== 'none'"
              class="attachment-upload-btn"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :accept="
                editForm.file_type === 'pdf'
                  ? 'application/pdf'
                  : 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              "
              :disabled="fileUploading"
              @change="handleFileChange"
            >
              <el-button :loading="fileUploading">上传附件</el-button>
            </el-upload>
            <div class="attachment-preview" v-if="editForm.file_url">
              <div class="attachment-actions">
                <el-link
                  :href="editForm.file_url"
                  target="_blank"
                  type="primary"
                  :underline="false"
                >
                  <el-icon style="margin-right: 4px"><Document /></el-icon>
                  查看附件
                </el-link>
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="handleRemoveAttachment"
                  style="margin-left: 12px"
                >
                  删除附件
                </el-button>
              </div>
              <div v-if="editForm.file_type === 'word'" class="word-preview-tip">
                <el-text type="info" size="small">Word文档可在新窗口打开查看</el-text>
              </div>
            </div>
            <el-progress
              v-if="fileUploading"
              :percentage="fileProgress"
              :stroke-width="4"
              status="success"
              style="margin-top: 8px"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="editSaving" @click="handleEditSave">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Plus, Document } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { announcementApi, teamTermApi } from '@/utils/api'
import type {
  AnnouncementInfo,
  CreateAnnouncementParams,
  UpdateAnnouncementParams,
  TeamTermInfo,
} from '@/utils/api/types'
import { useDate } from '@/utils/date'
import {
  uploadToOssWithKey,
  validateFileSize,
  validateFileType,
  getSignedOssUrl,
} from '@/utils/oss'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<AnnouncementInfo[]>([])
const teamTerms = ref<TeamTermInfo[]>([])

// 正文编辑模式
const contentEditMode = ref<'edit' | 'preview'>('edit')
const detailContentEditMode = ref<'edit' | 'preview'>('edit')

// 附件上传相关
const fileUploading = ref(false)
const fileProgress = ref(0)
const fileMimeTypes = {
  pdf: ['application/pdf'],
  word: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}

const getMimeTypeByFileType = (type?: 'none' | 'pdf' | 'word' | ''): string => {
  if (type === 'pdf') return 'application/pdf'
  if (type === 'word')
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return 'application/octet-stream'
}

const buildSignedPreviewUrl = async (
  fileKey?: string,
  fileType?: 'none' | 'pdf' | 'word' | '',
  fallbackUrl = ''
): Promise<string> => {
  // 现在后端只存储 key，这里通过 key 反推出用于预览的临时 URL
  if (!fileKey) return fallbackUrl
  try {
    return await getSignedOssUrl(fileKey, {
      mimeType: getMimeTypeByFileType(fileType),
      disposition: fileType === 'pdf' ? 'inline' : 'attachment',
      expiresInSeconds: 60 * 10,
    })
  } catch (error) {
    console.error('生成签名附件链接失败:', error)
    return fallbackUrl
  }
}

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const handleBack = () => {
  router.push('/admin/dashboard')
}

const searchForm = reactive({
  keyword: '',
  status: '',
})

const appliedFilters = reactive({
  keyword: '',
  status: '',
})

// 移除前端过滤逻辑，现在搜索在后端进行

// 计算当前页应该显示的数据（直接使用后端分页的数据）
const paginatedData = computed(() => {
  return tableData.value
})

// 移除前端分页监听，现在分页在后端进行

const getStatusType = (
  status: string
): 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined => {
  const statusMap: Record<
    string,
    'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined
  > = {
    草稿: 'info',
    已发布: 'success',
    归档: undefined,
  }
  return statusMap[status] || undefined
}

const handleSearch = async () => {
  appliedFilters.keyword = searchForm.keyword
  // 注意：status过滤现在不在后端API中支持，仅用于前端显示
  appliedFilters.status = searchForm.status
  pagination.page = 1
  await loadData()
}

const handleResetFilters = async () => {
  searchForm.keyword = ''
  searchForm.status = ''
  await handleSearch()
}

// 详情抽屉相关
const detailVisible = ref(false)
const detailSaving = ref(false)
const detailForm = reactive({
  announcement_id: 0,
  title: '',
  content: '',
  term_id: null as number | null,
  term_name: '',
  status: '' as '草稿' | '已发布' | '归档' | '',
  publish_time: null as string | null,
  file_type: '' as 'none' | 'pdf' | 'word' | '',
  file_url: '',
  file_key: '',
  created_at: '',
  updated_at: '',
})

const resetDetailForm = () => {
  detailForm.announcement_id = 0
  detailForm.title = ''
  detailForm.content = ''
  detailForm.term_id = null
  detailForm.term_name = ''
  detailForm.status = ''
  detailForm.publish_time = null
  detailForm.file_type = ''
  detailForm.file_url = ''
  detailForm.file_key = ''
  detailForm.created_at = ''
  detailForm.updated_at = ''
  detailContentEditMode.value = 'edit'
  fileUploading.value = false
  fileProgress.value = 0
}

// 简单的HTML格式化函数
const formatHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return html

  // 如果已经是格式化的（包含换行和缩进），直接返回
  if (html.includes('\n') && html.includes('  ')) {
    return html
  }

  let formatted = html
  // 在标签后添加换行
  formatted = formatted.replace(/>/g, '>\n')
  formatted = formatted.replace(/</g, '\n<')

  // 移除多余的空行
  formatted = formatted.replace(/\n\s*\n/g, '\n')

  // 添加缩进
  const lines = formatted.split('\n')
  let indent = 0
  const indentSize = 2
  const formattedLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      formattedLines.push('')
      continue
    }

    // 减少缩进（闭合标签）
    if (trimmed.startsWith('</')) {
      indent = Math.max(0, indent - indentSize)
    }

    // 添加缩进
    formattedLines.push(' '.repeat(indent) + trimmed)

    // 增加缩进（开放标签，但不是自闭合标签）
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
      // 检查是否是自闭合标签
      const tagMatch = trimmed.match(/^<(\w+)/)
      if (tagMatch && tagMatch[1]) {
        const tagName = tagMatch[1]
        // 常见的自闭合标签
        const selfClosingTags = [
          'img',
          'br',
          'hr',
          'input',
          'meta',
          'link',
          'area',
          'base',
          'col',
          'embed',
          'source',
          'track',
          'wbr',
        ]
        if (!selfClosingTags.includes(tagName.toLowerCase())) {
          indent += indentSize
        }
      }
    }
  }

  return formattedLines.join('\n').trim()
}

const openDetail = async (row: AnnouncementInfo) => {
  detailVisible.value = true
  detailForm.announcement_id = row.announcement_id
  detailForm.title = row.title || ''
  // 格式化HTML内容以便编辑
  detailForm.content = formatHtml(row.content || '')
  detailForm.term_id = row.term_id ?? null
  detailForm.term_name = row.term_name || ''
  detailForm.status = (row.status as '草稿' | '已发布' | '归档') || ''
  detailForm.publish_time = row.publish_time || null
  detailForm.file_type = (row.file_type as 'none' | 'pdf' | 'word') || 'none'
  const fileKey = (row as AnnouncementInfo & { file_key?: string }).file_key || ''
  detailForm.file_key = fileKey
  // 不再依赖后端返回的 file_url，而是统一由前端根据 key 生成临时访问地址
  detailForm.file_url = await buildSignedPreviewUrl(fileKey, detailForm.file_type, '')
  detailForm.created_at = (row as AnnouncementInfo & { created_at?: string }).created_at || ''
  detailForm.updated_at = (row as AnnouncementInfo & { updated_at?: string }).updated_at || ''
}

// 保存详情
// 处理编辑对话框的文件上传
const handleFileChange = async (file: UploadFile) => {
  if (!file.raw) return

  const fileType = editForm.file_type
  if (!fileType || fileType === 'none') {
    ElMessage.warning('请先选择附件类型')
    return
  }

  // 验证文件类型
  const allowedTypes = fileMimeTypes[fileType]
  if (!validateFileType(file.raw, allowedTypes)) {
    ElMessage.error(`请上传 ${fileType.toUpperCase()} 格式的文件`)
    return
  }

  // 验证文件大小
  if (!validateFileSize(file.raw)) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }

  fileUploading.value = true
  fileProgress.value = 0

  try {
    const isPdf =
      file.raw.type === 'application/pdf' || file.raw.name.toLowerCase().endsWith('.pdf')

    const { url, key } = await uploadToOssWithKey(
      file.raw,
      'uploads/announcements/',
      (progress) => {
        fileProgress.value = progress
      },
      isPdf
        ? {
            'Content-Disposition': 'inline; filename="' + encodeURIComponent(file.raw.name) + '"',
            'Content-Type': 'application/pdf',
          }
        : undefined
    )
    // 仅在前端本地用于预览，不再提交给后端
    editForm.file_url = url
    editForm.file_key = key
    ElMessage.success('附件上传成功')
  } catch (error) {
    console.error('上传附件失败:', error)
    ElMessage.error('上传附件失败')
  } finally {
    fileUploading.value = false
    fileProgress.value = 0
  }
}

// 处理详情抽屉的文件上传
const handleDetailFileChange = async (file: UploadFile) => {
  if (!file.raw) return

  const fileType = detailForm.file_type
  if (!fileType || fileType === 'none') {
    ElMessage.warning('请先选择附件类型')
    return
  }

  // 验证文件类型
  const allowedTypes = fileMimeTypes[fileType]
  if (!validateFileType(file.raw, allowedTypes)) {
    ElMessage.error(`请上传 ${fileType.toUpperCase()} 格式的文件`)
    return
  }

  // 验证文件大小
  if (!validateFileSize(file.raw)) {
    ElMessage.error('文件大小不能超过 10MB')
    return
  }

  fileUploading.value = true
  fileProgress.value = 0

  try {
    const isPdf =
      file.raw.type === 'application/pdf' || file.raw.name.toLowerCase().endsWith('.pdf')

    const { url, key } = await uploadToOssWithKey(
      file.raw,
      'uploads/announcements/',
      (progress) => {
        fileProgress.value = progress
      },
      isPdf
        ? {
            'Content-Disposition': 'inline; filename="' + encodeURIComponent(file.raw.name) + '"',
            'Content-Type': 'application/pdf',
          }
        : undefined
    )
    // 仅在前端本地用于预览，不再提交给后端
    detailForm.file_url = url
    detailForm.file_key = key
    ElMessage.success('附件上传成功')
  } catch (error) {
    console.error('上传附件失败:', error)
    ElMessage.error('上传附件失败')
  } finally {
    fileUploading.value = false
    fileProgress.value = 0
  }
}

// 删除编辑对话框的附件
const handleRemoveAttachment = () => {
  editForm.file_url = ''
  editForm.file_key = ''
  editForm.file_type = 'none'
  ElMessage.success('附件已删除')
}

// 删除详情抽屉的附件
const handleDetailRemoveAttachment = () => {
  detailForm.file_url = ''
  detailForm.file_key = ''
  detailForm.file_type = 'none'
  ElMessage.success('附件已删除')
}

const handleDetailSave = async () => {
  if (!detailForm.announcement_id) return
  detailSaving.value = true
  try {
    const payload: UpdateAnnouncementParams = {
      title: detailForm.title || undefined,
      content: detailForm.content || undefined,
      term_id: detailForm.term_id ?? undefined,
      status: detailForm.status || undefined,
      publish_time: detailForm.publish_time || undefined,
      file_type: detailForm.file_type === '' ? 'none' : detailForm.file_type || undefined,
      // 只向后端提交 key，URL 在前端按需生成
      file_key: detailForm.file_key || undefined,
    }
    await announcementApi.update(detailForm.announcement_id, payload)
    ElMessage.success('公告信息已更新')
    detailVisible.value = false
    resetDetailForm()
    await loadData()
  } catch (error) {
    console.error('更新公告信息失败:', error)
    ElMessage.error('保存失败')
  } finally {
    detailSaving.value = false
  }
}

const handleDelete = (row: AnnouncementInfo) => {
  ElMessageBox.confirm('确定要删除该公告吗？', '提示', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await announcementApi.delete(row.announcement_id)
        ElMessage.success('删除成功')
        await loadData()
      } catch (error) {
        console.error('删除公告失败:', error)
      }
    })
    .catch(() => {})
}

const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  pagination.page = 1 // 重置到第一页
  await loadData()
}

const handlePageChange = async (page: number) => {
  pagination.page = page
  await loadData()
}

const loadData = async () => {
  try {
    loading.value = true
    const announcementParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: appliedFilters.keyword || undefined,
      status: appliedFilters.status || undefined,
    }
    const [announcementRes, termRes] = await Promise.all([
      announcementApi.getPage(announcementParams),
      teamTermApi.getAll(),
    ])
    if (announcementRes.data?.list) {
      tableData.value = announcementRes.data.list
      pagination.total = announcementRes.data.pagination.total
    }
    if (termRes.data?.list) {
      teamTerms.value = termRes.data.list
    }
  } catch (error) {
    console.error('加载公告列表失败:', error)
    ElMessage.error('加载公告列表失败')
  } finally {
    loading.value = false
  }
}

// 新增/编辑
const editDialogVisible = ref(false)
const editSaving = ref(false)

const editForm = reactive<{
  announcement_id: number | null
  title: string
  content: string
  term_id: number | null
  status: '草稿' | '已发布' | '归档' | ''
  publish_time: string | null
  file_type: 'none' | 'pdf' | 'word' | ''
  file_url: string
  file_key: string
}>({
  announcement_id: null,
  title: '',
  content: '',
  term_id: null,
  status: '草稿',
  publish_time: null,
  file_type: 'none',
  file_url: '',
  file_key: '',
})

const resetEditForm = () => {
  editForm.announcement_id = null
  editForm.title = ''
  editForm.content = ''
  editForm.term_id = null
  editForm.status = '草稿'
  editForm.publish_time = null
  editForm.file_type = 'none'
  editForm.file_url = ''
  editForm.file_key = ''
  contentEditMode.value = 'edit'
  fileUploading.value = false
  fileProgress.value = 0
}

const openEditDialog = async (row?: AnnouncementInfo) => {
  if (row) {
    editForm.announcement_id = row.announcement_id
    editForm.title = row.title
    // 格式化HTML内容以便编辑
    editForm.content = formatHtml(row.content || '')
    editForm.term_id = row.term_id ?? null
    editForm.status = (row.status as '草稿' | '已发布' | '归档') || '草稿'
    editForm.publish_time = row.publish_time || null
    editForm.file_type = (row.file_type as 'none' | 'pdf' | 'word') || 'none'
    const fileKey = (row as AnnouncementInfo & { file_key?: string }).file_key || ''
    editForm.file_key = fileKey
    editForm.file_url = await buildSignedPreviewUrl(fileKey, editForm.file_type, '')
  } else {
    resetEditForm()
  }
  editDialogVisible.value = true
}

const buildCreatePayload = (): CreateAnnouncementParams => {
  const payload: CreateAnnouncementParams = {
    title: editForm.title.trim(),
    content: editForm.content,
  }
  if (editForm.term_id != null) payload.term_id = editForm.term_id
  if (editForm.status) payload.status = editForm.status
  if (editForm.publish_time) payload.publish_time = editForm.publish_time
  if (editForm.file_type) payload.file_type = editForm.file_type
  // 不再向后端提交 file_url，只提交 file_key
  if (editForm.file_key) payload.file_key = editForm.file_key
  return payload
}

const buildUpdatePayload = (): UpdateAnnouncementParams => {
  const payload: UpdateAnnouncementParams = {}
  if (editForm.title) payload.title = editForm.title.trim()
  if (editForm.content) payload.content = editForm.content
  if (editForm.term_id != null) payload.term_id = editForm.term_id
  if (editForm.status) payload.status = editForm.status
  if (editForm.publish_time) payload.publish_time = editForm.publish_time
  if (editForm.file_type) payload.file_type = editForm.file_type
  // 不再向后端提交 file_url，只提交 file_key
  if (editForm.file_key) payload.file_key = editForm.file_key
  return payload
}

const handleEditSave = async () => {
  if (!editForm.title.trim()) {
    ElMessage.warning('请填写公告标题')
    return
  }
  editSaving.value = true
  try {
    if (editForm.announcement_id) {
      const payload = buildUpdatePayload()
      await announcementApi.update(editForm.announcement_id, payload)
      ElMessage.success('公告已更新')
    } else {
      const payload = buildCreatePayload()
      await announcementApi.create(payload)
      ElMessage.success('公告已创建')
    }
    editDialogVisible.value = false
    resetEditForm()
    await loadData()
  } catch (error) {
    console.error('保存公告失败:', error)
  } finally {
    editSaving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.announcement-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.announcement-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  gap: 10px;
}

.search-input {
  width: 240px !important;
  min-width: 160px;
}

.search-select {
  width: 140px !important;
  min-width: 120px;
}

.search-btn,
.reset-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 20px;
}

.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
  white-space: nowrap;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.search-form :deep(.el-form-item) {
  margin: 0;
  padding: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.table-wrapper :deep(.el-table) {
  height: 100%;
}

.table-wrapper :deep(.el-table__row) {
  height: 54px;
}

.table-wrapper :deep(.el-table__body-wrapper) {
  overflow: auto;
}

.detail-form {
  margin-bottom: 20px;
}

.detail-meta {
  margin-top: 20px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.announcement-edit-dialog .edit-form {
  flex: 1;
  overflow: auto;
  padding-right: 4px;
}

.announcement-detail-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 90vh;
}

.content-form-item :deep(.el-form-item__content) {
  width: 100%;
}

.content-form-item-inner {
  width: 100%;
}

.content-tabs {
  width: 100%;
}

.content-tabs :deep(.el-tabs__header),
.content-tabs :deep(.el-tabs__nav),
.content-tabs :deep(.el-tabs__content),
.content-tabs :deep(.el-tab-pane) {
  width: 100%;
}

.content-editor {
  width: 100%;
  height: 420px;
}

.content-editor-input :deep(.el-textarea__inner) {
  height: 100%;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  tab-size: 2;
}

.content-editor-input textarea {
  height: 100% !important;
  width: 100% !important;
  resize: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  tab-size: 2;
}

.content-preview {
  width: 100% !important;
  height: 420px;
  overflow: auto;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background-color: var(--el-bg-color-page);
  line-height: 1.7;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.content-preview :deep(p) {
  margin: 8px 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.content-preview :deep(div) {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.content-preview :deep(img) {
  max-width: 100%;
  height: auto;
}

/* PDF预览样式 */
.content-preview-pdf {
  width: 100%;
  height: 420px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background-color: var(--el-bg-color-page);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.pdf-preview-object {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.pdf-preview-embed {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.pdf-fallback {
  padding: 40px;
  text-align: center;
  color: #909399;
  margin: 0;
}

.attachment-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-upload-btn {
  display: inline-block;
}

.attachment-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.attachment-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.word-preview-tip {
  margin-top: 4px;
}

.pdf-preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 80vh;
  position: relative;
}

.pdf-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  position: relative;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: none;
  display: block;
}

/* PDF预览失败时的提示 */
.pdf-preview-error {
  padding: 40px;
  text-align: center;
  color: #909399;
}

.pdf-preview-error .el-link {
  margin-top: 16px;
}

.announcement-detail-drawer :deep(.el-descriptions) {
  margin-bottom: 0;
}

.pagination-container {
  margin-top: 0;
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  background-color: #ffffffac;
}

@media (max-width: 1200px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    width: 100%;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .search-input,
  .search-select {
    width: 100% !important;
    max-width: 100%;
    flex: 1;
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .search-form :deep(.el-form-item) {
    width: 100%;
    margin-bottom: 8px;
  }

  .search-input,
  .search-select {
    width: 100% !important;
  }
}
</style>
