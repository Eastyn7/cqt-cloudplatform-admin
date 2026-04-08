<template>
  <div class="certificates">
    <el-card shadow="hover" v-loading="loadingEligibility">
      <template #header>
        <div class="card-header">
          <span>我的证书</span>
          <el-tag type="info">服务时长证明</el-tag>
        </div>
      </template>

      <div class="summary-row">
        <div class="eligibility-panel">
          <div class="eligibility-item">
            <span class="label">累计时长</span>
            <span class="value">{{ eligibility.total_hours ?? 0 }} 小时</span>
          </div>
        </div>

        <div class="action-column">
          <el-button type="primary" @click="handlePreview" :loading="previewLoading">
            预览证书
          </el-button>
          <el-button type="success" @click="handleGenerate" :loading="generateLoading">
            生成正式证书
          </el-button>
        </div>
      </div>

    </el-card>

    <el-card shadow="hover" class="list-card" v-loading="loadingList">
      <template #header>
        <div class="card-header">
          <span>证书记录</span>
          <el-button @click="loadCertificateList">刷新</el-button>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table :data="certificateList" empty-text="暂无证书记录">
          <el-table-column prop="cert_no" label="证书编号" min-width="180" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'revoked' ? 'danger' : 'success'">
                {{ formatStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="签发日期" min-width="140">
            <template #default="{ row }">{{ formatDateShort(row.issued_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleDownload(row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :current-page="pagination.page"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="previewVisible"
      title="证书预览"
      width="70%"
      align-center
      :close-on-click-modal="false"
      destroy-on-close
      class="preview-dialog"
    >
      <el-watermark :content="previewWatermarkText" :font="{ color: 'rgba(0,0,0,0.16)' }">
        <div v-loading="previewContentLoading" class="preview-content">
          <img v-if="previewImageUrl" :src="previewImageUrl" class="preview-image" alt="证书预览" />
          <el-empty v-else description="暂无预览内容" />
        </div>
      </el-watermark>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { serviceCertificateApi } from '@/utils/api'
import type { CertificateEligibilityResponse, ServiceCertificateInfo } from '@/utils/api/types'
import { formatDateShort, formatDateTime } from '@/utils/date'

const studentId = localStorage.getItem('student_id') || ''
const role = localStorage.getItem('role') || ''

const isPrivilegedRole = role === 'admin' || role === 'superadmin'

const buildScopedParams = () => ({
  student_id: isPrivilegedRole ? studentId || undefined : undefined,
})

const loadingEligibility = ref(false)
const loadingList = ref(false)
const previewLoading = ref(false)
const generateLoading = ref(false)

const previewVisible = ref(false)
const previewRawUrl = ref('')
const previewImageUrl = ref('')
const previewContentLoading = ref(false)
const previewPayload = ref<Record<string, string>>({})
const currentTemplateId = ref<number | undefined>(undefined)

const previewWatermarkText = computed(() => {
  const userLabel = studentId || '当前用户'
  return [`仅供预览`, userLabel]
})

const eligibility = reactive<CertificateEligibilityResponse>({
  eligible: false,
  total_hours: 0,
  threshold_hours: 0,
  template_id: undefined,
  reason: '',
})

const certificateList = ref<ServiceCertificateInfo[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const loadEligibility = async () => {
  loadingEligibility.value = true
  try {
    const res = await serviceCertificateApi.eligibility({
      ...buildScopedParams(),
    })
    Object.assign(eligibility, res.data || {})
    currentTemplateId.value = res.data?.template_id
  } catch (error) {
    console.error('资格校验失败:', error)
    ElMessage.error('获取证书资格失败')
  } finally {
    loadingEligibility.value = false
  }
}

const loadCertificateList = async () => {
  loadingList.value = true
  try {
    const res = await serviceCertificateApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...buildScopedParams(),
    })
    certificateList.value = res.data?.list || []
    pagination.total = res.data?.pagination?.total || 0
  } catch (error) {
    console.error('加载证书列表失败:', error)
    ElMessage.error('加载证书列表失败')
  } finally {
    loadingList.value = false
  }
}

const handlePreview = async () => {
  if (!currentTemplateId.value) {
    ElMessage.warning('暂无可用证书模板，请联系管理员配置')
    return
  }
  previewLoading.value = true
  try {
    const res = await serviceCertificateApi.preview({
      ...buildScopedParams(),
      template_id: currentTemplateId.value,
    })

    previewPayload.value = (res.data?.payload || {}) as Record<string, string>
    if (res.data?.template_id) {
      currentTemplateId.value = res.data.template_id
    }

    previewRawUrl.value = res.data?.preview_url || ''
    if (!previewRawUrl.value) {
      ElMessage.warning('后端未返回预览链接')
      return
    }

    await resolvePreviewImage(previewRawUrl.value)
    previewVisible.value = true
  } catch (error) {
    console.error('证书预览失败:', error)
    ElMessage.error('预览失败，请稍后重试')
  } finally {
    previewLoading.value = false
  }
}

const resolvePreviewImage = async (url: string) => {
  if (!url) {
    previewImageUrl.value = ''
    return
  }

  previewContentLoading.value = true
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`预览资源请求失败: ${response.status}`)
    }

    const blob = await response.blob()
    if (previewImageUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl.value)
    }
    previewImageUrl.value = URL.createObjectURL(blob)
  } finally {
    previewContentLoading.value = false
  }
}

const handleGenerate = async () => {
  if (!currentTemplateId.value) {
    ElMessage.warning('暂无可用证书模板，请联系管理员配置')
    return
  }
  generateLoading.value = true
  try {
    if (!Object.keys(previewPayload.value).length) {
      const previewRes = await serviceCertificateApi.preview({
        ...buildScopedParams(),
        template_id: currentTemplateId.value,
      })
      previewPayload.value = (previewRes.data?.payload || {}) as Record<string, string>
    }

    await serviceCertificateApi.generate({
      ...buildScopedParams(),
      template_id: currentTemplateId.value,
      payload: previewPayload.value,
    })
    await loadCertificateList()
  } catch (error) {
    console.error('生成证书失败:', error)
    ElMessage.error('生成失败，请稍后重试')
  } finally {
    generateLoading.value = false
  }
}

const handleDownload = async (row: ServiceCertificateInfo) => {
  try {
    const res = await serviceCertificateApi.download(row.cert_id)

    const url = res.data?.download_url
    if (!url) {
      ElMessage.warning('后端未返回下载链接')
      return
    }
    window.open(url, '_blank')
  } catch (error) {
    console.error('下载证书失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  await loadCertificateList()
}

const handlePageChange = async (page: number) => {
  pagination.page = page
  await loadCertificateList()
}

const formatStatusLabel = (status?: string) => {
  if (status === 'generated') return '有效'
  if (status === 'revoked') return '无效'
  return status || '-'
}

onMounted(async () => {
  await Promise.all([loadEligibility(), loadCertificateList()])
})

const clearPreviewState = () => {
  if (previewImageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewImageUrl.value)
  }
  previewImageUrl.value = ''
  previewRawUrl.value = ''
}

watch(previewVisible, (visible) => {
  if (!visible) {
    clearPreviewState()
  }
})
</script>

<style scoped>
.certificates {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-row {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.tips {
  margin-top: 16px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.eligibility-panel {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.eligibility-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.eligibility-item .label {
  color: #64748b;
  font-size: 12px;
}

.eligibility-item .value {
  color: #0f172a;
  font-weight: 600;
}

.action-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-width: 148px;
}

.action-column .el-button {
  margin-left: 0;
}

.list-card {
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.list-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.table-wrapper :deep(.el-table) {
  height: 100%;
}

.table-wrapper :deep(.el-table__body-wrapper) {
  overflow: auto;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.preview-content {
  width: 100%;
  height: min(68vh, 760px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  max-height: 68vh;
  object-fit: contain;
  border-radius: 8px;
  background: #ffffff;
}

:deep(.preview-dialog .el-dialog) {
  max-height: 86vh;
  margin: 0 !important;
}

:deep(.preview-dialog .el-dialog__body) {
  overflow: hidden;
}

@media (max-width: 960px) {
  .summary-row {
    flex-direction: column;
  }

  .eligibility-panel {
    grid-template-columns: 1fr;
  }

  .action-column {
    min-width: 100%;
  }
}
</style>
