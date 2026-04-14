<template>
  <AdminPageLayout title="证书管理">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">服务时长证书记录</span>
              <el-form :model="searchForm" inline label-width="0" @submit.prevent class="search-form">
                <el-form-item>
                  <el-input
                    v-model="searchForm.student_id"
                    placeholder="学号"
                    clearable
                    @keyup.enter="handleSearch"
                    class="search-input"
                  />
                </el-form-item>
                <el-form-item>
                  <el-select v-model="searchForm.status" clearable placeholder="证书状态" class="status-select">
                    <el-option label="有效" value="generated" />
                    <el-option label="无效" value="revoked" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSearch">查询</el-button>
                </el-form-item>
                <el-form-item>
                  <el-button @click="handleReset">重置</el-button>
                </el-form-item>
              </el-form>
            </div>
            <div class="header-right">
              <el-button @click="loadList">刷新</el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="tableData" v-loading="loading" border stripe height="100%">
            <el-table-column prop="cert_no" label="证书编号" min-width="180" />
            <el-table-column prop="student_id" label="学号" width="140" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'revoked' ? 'danger' : 'success'">
                  {{ formatStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="签发日期" width="120">
              <template #default="{ row }">{{ formatDateShort(row.issued_date || row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="创建时间" min-width="180">
              <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="作废原因" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.revoked_reason || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
                <el-button link type="primary" @click="handleDownload(row)">下载</el-button>
                <el-button
                  v-if="row.status !== 'revoked'"
                  link
                  type="danger"
                  @click="handleRevoke(row)"
                >
                  作废
                </el-button>
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
        <div v-loading="previewLoading" class="preview-content">
          <img v-if="previewImageUrl" :src="previewImageUrl" class="preview-image" alt="证书预览" />
          <el-empty v-else description="暂无预览内容" />
        </div>
      </el-watermark>
    </el-dialog>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminPageLayout from '@/components/admin/AdminPageLayout.vue'
import { serviceCertificateApi } from '@/utils/api'
import type { ServiceCertificateInfo } from '@/utils/api/types'
import { formatDateShort, formatDateTime } from '@/utils/date'

const loading = ref(false)
const previewLoading = ref(false)
const previewVisible = ref(false)
const previewImageUrl = ref('')
const tableData = ref<ServiceCertificateInfo[]>([])

const searchForm = reactive({
  student_id: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const previewWatermarkText = computed(() => {
  const operator = localStorage.getItem('student_id') || 'admin'
  return ['管理员预览', operator]
})

const formatStatusLabel = (status?: string) => {
  if (status === 'generated') return '有效'
  if (status === 'revoked') return '无效'
  return status || '-'
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await serviceCertificateApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      student_id: searchForm.student_id || undefined,
      status: searchForm.status || undefined,
    })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.pagination?.total || 0
  } catch (error) {
    console.error('加载证书记录失败:', error)
    ElMessage.error('加载证书记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  pagination.page = 1
  await loadList()
}

const handleReset = async () => {
  searchForm.student_id = ''
  searchForm.status = ''
  pagination.page = 1
  await loadList()
}

const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  await loadList()
}

const handlePageChange = async (page: number) => {
  pagination.page = page
  await loadList()
}

const handlePreview = async (row: ServiceCertificateInfo) => {
  if (!row.template_id) {
    ElMessage.warning('该记录缺少 template_id，无法预览')
    return
  }
  previewLoading.value = true
  try {
    const res = await serviceCertificateApi.preview({
      student_id: row.student_id,
      template_id: row.template_id,
    })
    const url = res.data?.preview_url
    if (!url) {
      ElMessage.warning('后端未返回预览链接')
      return
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`预览资源请求失败: ${response.status}`)
    }
    const blob = await response.blob()
    if (previewImageUrl.value.startsWith('blob:')) {
      URL.revokeObjectURL(previewImageUrl.value)
    }
    previewImageUrl.value = URL.createObjectURL(blob)
    previewVisible.value = true
  } catch (error) {
    console.error('管理员证书预览失败:', error)
    ElMessage.error('预览失败，请稍后重试')
  } finally {
    previewLoading.value = false
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
    console.error('管理员下载证书失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

const handleRevoke = async (row: ServiceCertificateInfo) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入作废原因（可选）', '作废证书', {
      confirmButtonText: '确认作废',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：证书信息有误，作废后重开',
      inputType: 'textarea',
    })
    await serviceCertificateApi.revoke(row.cert_id, {
      reason: value?.trim() || undefined,
    })
    await loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('作废证书失败:', error)
      ElMessage.error('作废失败，请稍后重试')
    }
  }
}

watch(previewVisible, (visible) => {
  if (!visible && previewImageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewImageUrl.value)
    previewImageUrl.value = ''
  }
})

loadList()
</script>

<style scoped>
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
  font-weight: 700;
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

.search-input {
  width: 180px;
}

.status-select {
  width: 140px;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.table-wrapper :deep(.el-table) {
  height: 100%;
}

.table-wrapper :deep(.el-table__body-wrapper) {
  overflow: auto;
}

.pagination-container {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
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
  background: #fff;
}

:deep(.preview-dialog .el-dialog) {
  max-height: 86vh;
  margin: 0 !important;
}

:deep(.preview-dialog .el-dialog__body) {
  overflow: hidden;
}
</style>
