<template>
  <div class="honor-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">荣誉管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">荣誉记录列表</span>
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
                    placeholder="荣誉名称 / 学生姓名 / 学号 / 颁发单位"
                    clearable
                    @keyup.enter="handleSearch"
                    class="search-input search-input-large"
                  >
                    <template #prefix>
                      <el-icon class="el-input__icon">
                        <Search />
                      </el-icon>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item>
                  <el-input
                    v-model="searchForm.honor_level"
                    placeholder="荣誉等级（如 国家级 / 省级 / 校级）"
                    clearable
                    class="search-input"
                  />
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
              <el-button type="primary" @click="openAddDialog">新增荣誉</el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table
            :data="paginatedData"
            v-loading="loading"
            border
            stripe
            table-layout="auto"
            height="100%"
          >
            <el-table-column label="序号" width="60" align="center">
              <template #default="{ $index }">
                {{ $index + 1 + (pagination.page - 1) * pagination.pageSize }}
              </template>
            </el-table-column>
            <el-table-column label="证书" width="250" align="center">
              <template #default="{ row }">
                <el-image
                  v-if="getCertificateUrl(row)"
                  :preview-teleported="true"
                  class="certificate-thumb"
                  :src="getCertificateUrl(row)"
                  :preview-src-list="[getCertificateUrl(row)]"
                  :lazy="true"
                  fit="cover"
                  style="width: 220px; height: 138px; border-radius: 4px; cursor: pointer"
                >
                  <template #placeholder>
                    <div class="image-skeleton">
                      <el-icon class="image-spinner"><Loading /></el-icon>
                    </div>
                  </template>
                  <template #error>
                    <div class="image-error">
                      <el-icon :size="20"><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
                <span v-else-if="row.certificate_key" class="certificate-loading">加载中...</span>
                <span v-else class="certificate-empty">未上传</span>
              </template>
            </el-table-column>
            <el-table-column prop="honor_title" label="荣誉名称" min-width="200" />
            <el-table-column prop="student_name" label="获奖学生" width="120" />
            <el-table-column prop="student_id" label="学号" width="140" />
            <el-table-column prop="honor_level" label="荣誉等级" width="120" />
            <el-table-column prop="issue_date" label="颁发日期" width="140">
              <template #default="{ row }">
                <span>{{ dateUtil.formatDate(row.issue_date) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="issuer" label="颁发单位" min-width="160" show-overflow-tooltip />
            <el-table-column prop="term_name" label="届次" width="120" />
            <el-table-column label="当前届" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.is_current ? 'success' : 'info'" size="small">
                  {{ row.is_current ? '当前届' : '往届' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
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
      <el-drawer v-model="detailVisible" title="荣誉详情与编辑" size="680px" :with-header="true">
        <el-form :model="detailForm" label-width="100px" class="detail-form">
          <el-form-item label="荣誉名称">
            <el-input v-model="detailForm.honor_title" />
          </el-form-item>
          <el-form-item label="学生学号">
            <el-input v-model="detailForm.student_id" placeholder="用于关联学生信息（可选）" />
          </el-form-item>
          <el-form-item label="学生姓名">
            <el-input v-model="detailForm.student_name" disabled />
          </el-form-item>
          <el-form-item label="届次">
            <el-select
              v-model="detailForm.term_id"
              placeholder="选填，关联服务队届次"
              filterable
              clearable
            >
              <el-option
                v-for="term in teamTerms"
                :key="term.term_id"
                :label="term.term_name"
                :value="term.term_id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="荣誉等级">
            <el-input v-model="detailForm.honor_level" placeholder="如 国家级 / 省级 / 校级" />
          </el-form-item>
          <el-form-item label="颁发日期">
            <el-date-picker
              v-model="detailForm.issue_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择颁发日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="颁发单位">
            <el-input v-model="detailForm.issuer" placeholder="如 学校名称 / 组织名称" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="detailForm.description"
              type="textarea"
              :rows="3"
              placeholder="荣誉说明、获奖背景等"
            />
          </el-form-item>
          <el-form-item label="证书图片">
            <div class="certificate-upload">
              <div class="certificate-preview-wrapper">
                <el-image
                  v-if="detailForm.certificate_url"
                  :preview-teleported="true"
                  class="certificate-preview"
                  :src="detailForm.certificate_url"
                  :preview-src-list="[detailForm.certificate_url]"
                  :lazy="true"
                  fit="cover"
                >
                  <template #placeholder>
                    <div class="image-skeleton small">
                      <el-icon class="image-spinner"><Loading /></el-icon>
                    </div>
                  </template>
                  <template #error>
                    <div class="image-error">
                      <el-icon :size="20"><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
                <el-empty v-else description="暂无证书图片" :image-size="60" />
              </div>
              <div class="certificate-upload-actions">
                <el-upload
                  class="certificate-upload-btn"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/png,image/jpeg,image/webp"
                  :disabled="certificateUploading"
                  @change="handleDetailCertificateChange"
                >
                  <el-button :loading="certificateUploading">上传证书图片</el-button>
                </el-upload>
                <el-progress
                  v-if="certificateUploading"
                  :percentage="certificateProgress"
                  :stroke-width="4"
                  status="success"
                />
              </div>
            </div>
          </el-form-item>
          <!-- 不再手动维护证书 URL，仅展示预览和 key -->
          <el-form-item label="证书 key">
            <el-input
              v-model="detailForm.certificate_key"
              placeholder="OSS 存储 key（例如 oss/certs/xxx.jpg）"
            />
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

      <!-- 批量新增弹窗 -->
      <el-dialog
        v-model="addDialogVisible"
        title="新增荣誉"
        class="batch-add-dialog admin-modal-large"
        :close-on-click-modal="false"
        @closed="handleAddDialogClosed"
      >
        <div class="batch-dialog-scroll">
          <div class="batch-tip">
            <div>支持一次录入多个荣誉记录，需填写荣誉名称。其他字段可按需补充（可留空）。</div>
            <div class="import-section">
              <el-button type="primary" @click="openImportDialog">导入数据</el-button>
              <span class="import-tip">支持导入 JSON 对象数组或 Excel 文件，一键填充到表单</span>
            </div>
          </div>
          <div class="batch-actions">
            <el-button type="primary" link @click="handleAddBatchRow">新增一行</el-button>
          </div>
          <el-table :data="batchForm.entries" border size="small" class="batch-table" height="100%">
            <el-table-column label="荣誉名称" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.honor_title" placeholder="荣誉名称（必填）" />
              </template>
            </el-table-column>
            <el-table-column label="学生学号" min-width="140">
              <template #default="{ row }">
                <el-input v-model="row.student_id" placeholder="学生学号" />
              </template>
            </el-table-column>
            <el-table-column label="届次" min-width="140">
              <template #default="{ row }">
                <el-select
                  v-model="row.term_id"
                  placeholder="请选择届次"
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
              </template>
            </el-table-column>
            <el-table-column label="荣誉等级" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.honor_level" placeholder="如 国家级 / 省级 / 校级" />
              </template>
            </el-table-column>
            <el-table-column label="颁发日期" min-width="140">
              <template #default="{ row }">
                <el-date-picker
                  v-model="row.issue_date"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="颁发单位" min-width="180">
              <template #default="{ row }">
                <el-input v-model="row.issuer" placeholder="颁发单位" />
              </template>
            </el-table-column>
            <el-table-column label="描述" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.description" placeholder="描述" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" align="center" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link @click="handleRemoveBatchRow($index)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <div class="footer-actions">
              <el-button @click="addDialogVisible = false">取消</el-button>
              <el-button type="primary" :loading="addDialogLoading" @click="handleSubmitAdd"
                >确认提交</el-button
              >
            </div>
          </div>
        </template>
      </el-dialog>

      <BulkImportDialog
        v-model="importDialogVisible"
        :field-hints="importFieldHints"
        :example="importExample"
        :json-placeholder="jsonPlaceholder"
        @import="handleImportRows"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Loading, Picture } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { honorRecordApi, teamTermApi } from '@/utils/api'
import type {
  HonorRecordInfo,
  BatchCreateHonorRecordParams,
  CreateHonorRecordParams,
  UpdateHonorRecordParams,
  BatchCreateHonorRecordResponse,
  TeamTermInfo,
} from '@/utils/api/types'
import { useDate } from '@/utils/date'
import BulkImportDialog from '@/components/common/BulkImportDialog.vue'
import { normalizeImportValue, applyImportedEntries } from '@/utils/importHelpers'
import {
  getSignedOssUrl,
  uploadToOssWithKey,
  validateFileSize,
  validateFileType,
} from '@/utils/oss'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<HonorRecordInfo[]>([])
const teamTerms = ref<TeamTermInfo[]>([])

// 证书URL缓存（响应式）
const certificateUrlMap = reactive<Map<string, string>>(new Map())

// 获取证书URL（从certificate_key生成）
const getCertificateUrl = (honor: HonorRecordInfo): string => {
  if (!honor.certificate_key) return ''
  const cached = certificateUrlMap.get(honor.certificate_key)
  if (cached) return cached
  // 异步生成URL并更新响应式Map
  buildCertificatePreviewUrl(honor.certificate_key, '')
    .then((url) => {
      if (url) {
        certificateUrlMap.set(honor.certificate_key!, url)
      }
    })
    .catch((error) => {
      console.error('生成证书URL失败:', error)
    })
  return ''
}

// 顶部搜索表单
const searchForm = reactive({
  keyword: '',
  honor_level: '',
})

// 生效中的筛选条件
const appliedFilters = reactive({
  keyword: '',
  honor_level: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const handleBack = () => {
  router.push('/admin/dashboard')
}

const buildCertificatePreviewUrl = async (
  key?: string | null,
  fallbackUrl = ''
): Promise<string> => {
  if (!key) return fallbackUrl
  try {
    return await getSignedOssUrl(key, {
      expiresInSeconds: 60 * 10,
      disposition: 'inline',
    })
  } catch (error) {
    console.error('生成证书预览链接失败:', error)
    return fallbackUrl
  }
}

// 获取所有证书URL用于预览列表
// const getAllCertificateUrls = (): string[] => {
//   return Array.from(certificateUrlMap.values()).filter(Boolean)
// }

// 证书上传相关
const certificateUploading = ref(false)
const certificateProgress = ref(0)
const certificateMimeTypes = ['image/png', 'image/jpeg', 'image/webp']

const handleDetailCertificateChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  if (!validateFileType(file, certificateMimeTypes)) {
    ElMessage.error('仅支持 JPG/PNG/WEBP 格式的图片')
    return
  }
  if (!validateFileSize(file)) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }
  certificateUploading.value = true
  certificateProgress.value = 0
  try {
    const { url, key } = await uploadToOssWithKey(
      file,
      'uploads/honor-certificates/',
      (progress) => {
        certificateProgress.value = progress
      }
    )
    // 本地预览使用 URL，后端仅存储 key
    detailForm.certificate_url = url
    detailForm.certificate_key = key
    ElMessage.success('证书图片已上传')
  } catch (error) {
    console.error('上传证书图片失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    certificateUploading.value = false
    certificateProgress.value = 0
  }
}

// 批量导入弹窗配置
const importDialogVisible = ref(false)
const importFieldHints = [
  { key: 'honor_title', label: '荣誉名称', required: true },
  { key: 'student_name', label: '获奖学生姓名', required: true },
  { key: 'student_id', label: '学号（可选，用于精确匹配）' },
  { key: 'term_name', label: '届次名称（可选，将自动匹配为届次 ID）' },
  { key: 'honor_level', label: '荣誉等级，例如 校级/市级/国家级' },
  { key: 'issue_date', label: '颁发日期（YYYY-MM-DD）' },
]
const importExample = `[
  {
    "honor_title": "优秀志愿者",
    "student_name": "李四",
    "student_id": "2022000002",
    "term_name": "第十届",
    "honor_level": "校级",
    "issue_date": "2024-06-01",
    "issuer": "重庆工商大学",
    "description": "在志愿服务中表现突出"
  }
]`
const jsonPlaceholder = '粘贴 JSON 数组，例如上方示例'

type ImportableEntry = Partial<
  Record<
    | 'honor_title'
    | 'student_name'
    | 'student_id'
    | 'term_name'
    | 'honor_level'
    | 'issue_date'
    | 'issuer'
    | 'description',
    string
  >
> &
  Record<string, string | number | boolean | null | undefined>

// 移除前端过滤逻辑，现在搜索在后端进行

// 计算当前页应该显示的数据（直接使用后端分页的数据）
const paginatedData = computed(() => {
  return tableData.value
})

// 移除前端分页监听，现在分页在后端进行

// 搜索
const handleSearch = async () => {
  appliedFilters.keyword = searchForm.keyword
  // 注意：honor_level过滤现在不在后端API中支持，仅用于前端显示
  appliedFilters.honor_level = searchForm.honor_level
  pagination.page = 1
  await loadData()
}

const handleResetFilters = async () => {
  searchForm.keyword = ''
  searchForm.honor_level = ''
  await handleSearch()
}

// 删除单条
const handleDelete = (row: HonorRecordInfo) => {
  ElMessageBox.confirm('确定要删除该荣誉记录吗？', '提示', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await honorRecordApi.delete(row.honor_id)
        ElMessage.success('删除成功')
        await loadData()
      } catch (error) {
        console.error('删除荣誉记录失败:', error)
      }
    })
    .catch(() => {})
}

// 批量新增相关
type BatchEntry = {
  honor_title: string
  student_id: string
  term_id: number | null
  honor_level: string
  issue_date: string
  issuer: string
  description: string
}

const createBatchEntry = (): BatchEntry => ({
  honor_title: '',
  student_id: '',
  term_id: null,
  honor_level: '',
  issue_date: '',
  issuer: '',
  description: '',
})

const addDialogVisible = ref(false)
const addDialogLoading = ref(false)
const batchForm = reactive<{ entries: BatchEntry[] }>({
  entries: [createBatchEntry()],
})

const openAddDialog = () => {
  addDialogVisible.value = true
}

const resetBatchForm = () => {
  batchForm.entries.splice(0, batchForm.entries.length, createBatchEntry())
}

const handleAddDialogClosed = () => {
  resetBatchForm()
}

const handleAddBatchRow = () => {
  batchForm.entries.push(createBatchEntry())
}

const handleRemoveBatchRow = (index: number) => {
  if (batchForm.entries.length === 1) {
    ElMessage.warning('请至少保留一行数据')
    return
  }
  batchForm.entries.splice(index, 1)
}

// 详情抽屉相关
const detailVisible = ref(false)
const detailSaving = ref(false)
const detailForm = reactive({
  honor_id: 0,
  honor_title: '',
  student_id: '',
  student_name: '',
  term_id: null as number | null,
  term_name: '' as string | null,
  is_current: 0 as number | boolean,
  honor_level: '',
  issue_date: null as string | null,
  issuer: '',
  description: '',
  certificate_url: '',
  certificate_key: '',
  created_at: '',
  updated_at: '',
})

const resetDetailForm = () => {
  detailForm.honor_id = 0
  detailForm.honor_title = ''
  detailForm.student_id = ''
  detailForm.student_name = ''
  detailForm.term_id = null
  detailForm.term_name = ''
  detailForm.is_current = 0
  detailForm.honor_level = ''
  detailForm.issue_date = null
  detailForm.issuer = ''
  detailForm.description = ''
  detailForm.certificate_url = ''
  detailForm.certificate_key = ''
  detailForm.created_at = ''
  detailForm.updated_at = ''
}

const openDetail = async (row: HonorRecordInfo) => {
  detailVisible.value = true
  detailForm.honor_id = row.honor_id
  detailForm.honor_title = row.honor_title || ''
  detailForm.student_id = row.student_id || ''
  detailForm.student_name = row.student_name || ''
  detailForm.term_id = row.term_id ?? null
  detailForm.term_name = row.term_name || ''
  detailForm.is_current = row.is_current ?? 0
  detailForm.honor_level = row.honor_level || ''
  detailForm.issue_date = row.issue_date || null
  detailForm.issuer = row.issuer || ''
  detailForm.description = row.description || ''
  detailForm.certificate_key = row.certificate_key || ''
  if (detailForm.certificate_key) {
    if (certificateUrlMap.has(detailForm.certificate_key)) {
      detailForm.certificate_url = certificateUrlMap.get(detailForm.certificate_key) || ''
    } else {
      detailForm.certificate_url = await buildCertificatePreviewUrl(detailForm.certificate_key, '')
      if (detailForm.certificate_url) {
        certificateUrlMap.set(detailForm.certificate_key, detailForm.certificate_url)
      }
    }
  } else {
    detailForm.certificate_url = ''
  }
  detailForm.created_at = (row as HonorRecordInfo & { created_at?: string }).created_at || ''
  detailForm.updated_at = (row as HonorRecordInfo & { updated_at?: string }).updated_at || ''
}

// 保存详情
const handleDetailSave = async () => {
  if (!detailForm.honor_id) return
  detailSaving.value = true
  try {
    const payload: UpdateHonorRecordParams = {
      honor_title: detailForm.honor_title || undefined,
      student_id: detailForm.student_id || undefined,
      term_id: detailForm.term_id ?? undefined,
      honor_level: detailForm.honor_level || undefined,
      issue_date: detailForm.issue_date || undefined,
      issuer: detailForm.issuer || undefined,
      description: detailForm.description || undefined,
      // 只向后端提交 key，URL 在前端按需生成
      certificate_key: detailForm.certificate_key || undefined,
    }
    await honorRecordApi.update(detailForm.honor_id, payload)
    ElMessage.success('荣誉记录已更新')
    detailVisible.value = false
    resetDetailForm()
    await loadData()
  } catch (error) {
    console.error('更新荣誉记录失败:', error)
    ElMessage.error('保存失败')
  } finally {
    detailSaving.value = false
  }
}

// 加载届次列表
const loadTeamTerms = async () => {
  if (teamTerms.value.length === 0) {
    try {
      const res = await teamTermApi.getAll()
      teamTerms.value = res.data?.list || []
    } catch (error) {
      console.error('加载届次列表失败:', error)
    }
  }
}

// 打开导入弹窗
const openImportDialog = async () => {
  await loadTeamTerms()
  importDialogVisible.value = true
}

// 处理批量导入的荣誉数据：填充到表单
const handleImportRows = async (rows: ImportableEntry[]) => {
  await loadTeamTerms()
  const termsByName = new Map(teamTerms.value.map((t) => [t.term_name, t.term_id]))

  applyImportedEntries(
    rows,
    (item) => {
      const termName = normalizeImportValue(item.term_name)
      const fromName = termName ? (termsByName.get(termName) ?? null) : null
      const fromId = item.term_id ? Number(item.term_id) : null

      const entry: BatchEntry = {
        honor_title: normalizeImportValue(item.honor_title) || '',
        student_id: normalizeImportValue(item.student_id) || '',
        term_id: fromId ?? fromName,
        honor_level: normalizeImportValue(item.honor_level) || '',
        issue_date: normalizeImportValue(item.issue_date) || '',
        issuer: normalizeImportValue(item.issuer) || '',
        description: normalizeImportValue(item.description) || '',
      }
      return entry
    },
    batchForm.entries,
    {
      onEmpty: () => ElMessage.warning('没有可导入的数据'),
      onSuccess: (count) => {
        ElMessage.success(`成功导入 ${count} 条数据`)
        importDialogVisible.value = false
      },
    }
  )
}

// 提交批量新增
const submitBatchAdd = async () => {
  if (!batchForm.entries.length) {
    ElMessage.warning('请至少添加一行数据')
    throw new Error('no entries')
  }

  // 验证必填字段
  const invalidIndex = batchForm.entries.findIndex((entry) => !entry.honor_title?.trim())
  if (invalidIndex !== -1) {
    ElMessage.warning(`第 ${invalidIndex + 1} 行荣誉名称未填写`)
    throw new Error('invalid entries')
  }

  // 过滤有效数据
  const validEntries = batchForm.entries.filter((entry) => entry.honor_title?.trim())
  if (!validEntries.length) {
    ElMessage.warning('没有有效的荣誉记录可提交')
    throw new Error('no valid entries')
  }

  // 如果只有一条，调用单独创建接口
  if (validEntries.length === 1) {
    const entry = validEntries[0]
    if (!entry) {
      throw new Error('no valid entry')
    }
    const payload: CreateHonorRecordParams = {
      honor_title: entry.honor_title.trim(),
      student_id: entry.student_id?.trim() || undefined,
      term_id: entry.term_id ?? undefined,
      honor_level: entry.honor_level?.trim() || undefined,
      issue_date: entry.issue_date?.trim() || undefined,
      issuer: entry.issuer?.trim() || undefined,
      description: entry.description?.trim() || undefined,
    }
    await honorRecordApi.create(payload)
    ElMessage.success('荣誉记录创建成功')
    return
  }

  // 多条数据，调用批量创建接口
  const batchPayload: BatchCreateHonorRecordParams[] = validEntries.map((entry) => ({
    honor_title: entry.honor_title.trim(),
    student_id: entry.student_id?.trim() || undefined,
    term_id: entry.term_id ?? undefined,
    honor_level: entry.honor_level?.trim() || undefined,
    issue_date: entry.issue_date?.trim() || undefined,
    issuer: entry.issuer?.trim() || undefined,
    description: entry.description?.trim() || undefined,
  }))

  const res = await honorRecordApi.batchCreate(batchPayload)

  // 处理详细的返回信息
  if (res.data) {
    const result: BatchCreateHonorRecordResponse = res.data
    const { total, created, failed, createdList, failedList } = result

    // 构建详细消息
    let message = `批量创建完成：总计 ${total} 条`
    const messages: string[] = []

    if (created > 0) {
      messages.push(`成功创建 ${created} 条`)
      if (createdList && createdList.length > 0) {
        const createdNames = createdList.map((d) => d.honor_title).join('、')
        messages.push(`已创建：${createdNames}`)
      }
    }

    if (failed > 0) {
      messages.push(`失败 ${failed} 条`)
      if (failedList && failedList.length > 0) {
        const failedDetails = failedList
          .map((d) => `${d.honor_title || '未知'}（${d.reason || '未知原因'}）`)
          .join('、')
        messages.push(`已失败：${failedDetails}`)
      }
    }

    if (messages.length > 0) {
      message = messages.join('；')
    }

    // 根据结果显示不同类型的消息
    if (failed === 0) {
      ElMessage.success(message)
    } else if (created === 0) {
      ElMessage.warning(message)
    } else {
      ElMessage({
        message,
        type: 'success',
        duration: 6000,
        showClose: true,
      })
    }
  } else {
    ElMessage.success('批量创建成功')
  }
}

// 弹窗底部"确认提交"按钮的点击处理
const handleSubmitAdd = async () => {
  addDialogLoading.value = true
  try {
    await submitBatchAdd()
    addDialogVisible.value = false
    resetBatchForm()
    await loadData()
  } catch (error) {
    console.error('创建荣誉记录失败:', error)
    if (
      error instanceof Error &&
      error.message !== 'no entries' &&
      error.message !== 'invalid entries' &&
      error.message !== 'no valid entries'
    ) {
      ElMessage.error('创建失败')
    }
  } finally {
    addDialogLoading.value = false
  }
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
    const honorParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: appliedFilters.keyword || undefined,
      honor_level: appliedFilters.honor_level || undefined,
    }
    const [honorRes, termRes] = await Promise.all([
      honorRecordApi.getPage(honorParams),
      teamTermApi.getAll()
    ])
    if (honorRes.data?.list) {
      const honorsData = honorRes.data.list
      // 根据 certificate_key 生成预览 URL，并填充到certificateUrlMap
      await Promise.all(
        honorsData.map(async (item) => {
          if (item.certificate_key) {
            const url = await buildCertificatePreviewUrl(item.certificate_key, '')
            if (url) {
              certificateUrlMap.set(item.certificate_key, url)
            }
          }
        })
      )
      tableData.value = honorsData
      pagination.total = honorRes.data.pagination.total
    }
    if (termRes.data?.list) {
      teamTerms.value = termRes.data.list
    }
  } catch (error) {
    console.error('加载荣誉列表失败:', error)
    ElMessage.error('加载荣誉列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.honor-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.honor-management {
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

.search-input-large {
  width: 280px !important;
  max-width: 480px;
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

.batch-tip {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
}

.import-section {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.import-tip {
  color: #909399;
  font-size: 12px;
}

.batch-actions {
  margin-bottom: 12px;
}

.batch-add-dialog :deep(.el-dialog__body) {
  max-height: calc(80vh - 120px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.batch-dialog-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.batch-table {
  flex: 1;
  overflow: hidden;
}

.batch-table :deep(.el-table__body-wrapper) {
  max-height: 100%;
  overflow: auto;
}

.image-skeleton {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  gap: 6px;
}

.image-skeleton.small {
  height: 138px;
}

.image-spinner {
  animation: spin 1s linear infinite;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #909399;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

  .search-input {
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

  .search-input {
    width: 100% !important;
  }
}
</style>
