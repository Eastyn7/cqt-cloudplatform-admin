<template>
  <div class="operation-log-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">系统操作日志</span>
      </template>
    </el-page-header>

    <div class="content">
      <div class="search-bar">
        <el-form :model="searchForm" inline label-width="0" @submit.prevent class="search-form">
          <el-form-item>
            <el-input
              v-model="searchForm.user_id"
              placeholder="操作人 ID"
              clearable
              class="search-input"
            >
              <template #prefix>
                <el-icon class="el-input__icon">
                  <User />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="searchForm.action"
              placeholder="操作类型（如 create/update/delete）"
              clearable
              class="search-input"
            />
          </el-form-item>

          <el-form-item>
            <el-date-picker
              v-model="searchForm.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="date-range"
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

        <div class="action-buttons">
          <el-button type="info" @click="handleExport" class="export-btn">
            <el-icon>
              <Download />
            </el-icon>
            导出日志
          </el-button>
        </div>
      </div>

      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <span>操作日志列表</span>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="tableData" v-loading="loading" border stripe table-layout="fixed">
            <el-table-column type="index" label="序号" width="60" align="center">
              <template #default="{ $index }">
                {{ $index + 1 + (pagination.page - 1) * pagination.pageSize }}
              </template>
            </el-table-column>
            <el-table-column prop="user_id" label="操作人ID" min-width="120" />
            <el-table-column prop="action" label="操作类型" min-width="130" />
            <el-table-column prop="target_table" label="目标表" min-width="140" />
            <el-table-column prop="target_id" label="目标ID" min-width="100" />
            <el-table-column prop="ip_address" label="IP地址" min-width="130" />
            <el-table-column prop="created_at" label="操作时间" min-width="170">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.created_at) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="详情" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleViewDetail(row)">
                  查看
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

      <!-- 详情 Drawer -->
      <el-drawer
        v-model="detailVisible"
        title="操作日志详情"
        size="600px"
        :with-header="true"
        class="operation-log-detail-drawer"
      >
        <el-descriptions border :column="1" v-if="detailData">
          <el-descriptions-item label="操作人ID">
            {{ detailData.user_id || '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            {{ detailData.action || '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="目标表">
            {{ detailData.target_table || '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="目标ID">
            {{ detailData.target_id || '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ detailData.ip_address || '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="User-Agent">
            <div class="user-agent-text">{{ detailData.user_agent || '--' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            {{ dateUtil.formatTime(detailData.created_at) || '--' }}
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            <div class="description-text">{{ detailData.description || '无' }}</div>
          </el-descriptions-item>
        </el-descriptions>
        <template #footer>
          <span class="drawer-footer">
            <el-button @click="detailVisible = false">关闭</el-button>
          </span>
        </template>
      </el-drawer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Download, User } from '@element-plus/icons-vue'
import { operationLogApi } from '@/utils/api'
import type { OperationLogInfo, OperationLogQueryParams } from '@/utils/api/types'
import { useDate } from '@/utils/date'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<OperationLogInfo[]>([])

const handleBack = () => {
  router.push('/admin/dashboard')
}

const pagination = reactive({
  page: 1, // 后端分页页码
  pageSize: 10,
  total: 0,
})

const searchForm = reactive<{
  user_id: string
  action: string
  dateRange: string[] | null
}>({
  user_id: '',
  action: '',
  dateRange: null,
})

const buildQueryParams = (): OperationLogQueryParams => {
  const params: OperationLogQueryParams = {
    page: pagination.page,
    pageSize: pagination.pageSize,
  }
  if (searchForm.user_id) params.user_id = searchForm.user_id.trim()
  if (searchForm.action) params.action = searchForm.action.trim()
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    params.start_date = searchForm.dateRange[0]
    params.end_date = searchForm.dateRange[1]
  }
  return params
}

const detailVisible = ref(false)
const detailData = ref<OperationLogInfo | null>(null)

const handleViewDetail = (row: OperationLogInfo) => {
  detailData.value = row
  detailVisible.value = true
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleResetFilters = () => {
  searchForm.user_id = ''
  searchForm.action = ''
  searchForm.dateRange = null
  handleSearch()
}

const handleExport = () => {
  ElMessage.info('导出功能后续可接入后端导出接口，目前暂未实现')
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const params = buildQueryParams()
    const res = await operationLogApi.getList(params)
    if (res.data?.list) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination.total
      pagination.page = res.data.pagination.page
      pagination.pageSize = res.data.pagination.pageSize
    }
  } catch (error) {
    console.error('加载日志列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.operation-log-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  gap: 0;
}

.search-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 0;
  margin-bottom: 0;
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
  width: 250px !important;
  min-width: 150px;
}

.date-range {
  width: 320px !important;
}

.search-btn,
.reset-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.export-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 0;
}

.table-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.table-card :deep(.el-card__header) {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.table-wrapper :deep(.el-table) {
  height: 100%;
  width: 100%;
}

.table-wrapper :deep(.el-table__row) {
  height: 54px;
}

.table-wrapper :deep(.el-table__body-wrapper) {
  overflow: auto;
}

.table-wrapper :deep(.el-table__fixed-right) {
  right: 0 !important;
}

.table-wrapper :deep(.el-table__fixed-right-patch) {
  right: 0 !important;
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
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-form {
    width: 100%;
    justify-content: flex-start;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .search-input,
  .date-range {
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

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
  }
}

.operation-log-detail-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 90vh;
  overflow-y: auto;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.user-agent-text,
.description-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.8;
  max-width: 100%;
  overflow-wrap: break-word;
}
</style>
