<template>
  <div class="task-logs-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">定时任务执行日志</span>
      </template>
    </el-page-header>

    <div class="content">
      <!-- 执行日志卡片（含统计和表格） -->
      <el-card class="table-card">
        <!-- 统计信息部分 -->
        <div class="stats-section">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-item">
                <div class="stat-label">总执行次数</div>
                <div class="stat-value" style="color: #1989fa">{{ pagination.total }}</div>
                <div class="stat-unit">次</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-item">
                <div class="stat-label">成功次数</div>
                <div class="stat-value" style="color: #67c23a">{{ successCount }}</div>
                <div class="stat-unit">次</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-item">
                <div class="stat-label">失败次数</div>
                <div class="stat-value" style="color: #ff0000">{{ failCount }}</div>
                <div class="stat-unit">次</div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-item">
                <div class="stat-label">成功率</div>
                <div class="stat-value" style="color: #1989fa">{{ successRate.toFixed(2) }}</div>
                <div class="stat-unit">%</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 分隔线 -->
        <div class="stats-divider"></div>

        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">执行日志列表</span>
              <el-form
                :model="searchForm"
                inline
                label-width="0"
                @submit.prevent
                class="search-form"
              >
                <el-form-item>
                  <el-input
                    v-model="searchForm.task_code"
                    placeholder="任务代码"
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
                  <el-input
                    v-model="searchForm.task_name"
                    placeholder="任务名称"
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
              <el-button type="primary" @click="handleViewConfig" class="view-config-btn">
                返回配置
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="tableData" v-loading="loading" border stripe table-layout="auto">
            <el-table-column type="index" label="序号" width="60" align="center">
              <template #default="{ $index }">
                {{ $index + 1 + (pagination.page - 1) * pagination.pageSize }}
              </template>
            </el-table-column>
            <el-table-column prop="task_name" label="任务名称" min-width="150" />
            <el-table-column prop="task_code" label="任务代码" width="150" align="center" />
            <el-table-column prop="started_at" label="开始时间" width="180">
              <template #default="{ row }">
                <span>{{ formatDateTime(row.started_at) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="success" label="执行状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.success === 1 ? 'success' : 'danger'">
                  {{ row.success === 1 ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="affected_rows" label="受影响行数" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="info">{{ row.affected_rows }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="exec_ms" label="执行耗时" width="120" align="center">
              <template #default="{ row }">
                <span>{{ row.exec_ms }} ms</span>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="执行信息" min-width="200">
              <template #default="{ row }">
                <el-text :type="row.success === 1 ? 'success' : 'danger'" truncated>
                  {{ row.message }}
                </el-text>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  @click="handleViewDetail(row)"
                >
                  查看详情
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
    </div>

    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="执行日志详情"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="selectedLog" :column="1" border>
        <el-descriptions-item label="日志ID">
          {{ selectedLog.id }}
        </el-descriptions-item>
        <el-descriptions-item label="任务名称">
          {{ selectedLog.task_name }}
        </el-descriptions-item>
        <el-descriptions-item label="任务代码">
          <el-tag>{{ selectedLog.task_code }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag :type="selectedLog.success === 1 ? 'success' : 'danger'">
            {{ selectedLog.success === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatDateTime(selectedLog.started_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="完成时间">
          {{ formatDateTime(selectedLog.finished_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="执行耗时">
          {{ selectedLog.exec_ms }} 毫秒
        </el-descriptions-item>
        <el-descriptions-item label="受影响行数">
          <el-tag type="info">{{ selectedLog.affected_rows }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="执行信息">
          <div style="white-space: pre-wrap; word-break: break-all">
            {{ selectedLog.message }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="记录创建时间">
          {{ formatDateTime(selectedLog.created_at) }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false">
            关闭
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { taskApi } from '@/utils/api'
import type { TaskLogInfo } from '@/utils/api/types'
import { formatDateTime } from '@/utils/date'

const router = useRouter()

const loading = ref(false)
const tableData = ref<TaskLogInfo[]>([])
const detailDialogVisible = ref(false)
const selectedLog = ref<TaskLogInfo | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const searchForm = reactive({
  task_code: '',
  task_name: '',
})

// 计算统计信息
const successCount = computed(() => {
  return tableData.value.filter((log) => log.success === 1).length
})

const failCount = computed(() => {
  return tableData.value.filter((log) => log.success === 0).length
})

const successRate = computed(() => {
  if (pagination.total === 0) return 0
  // 基于当前页的成功率
  const currentPageTotal = tableData.value.length
  if (currentPageTotal === 0) return 0
  return (successCount.value / currentPageTotal) * 100
})

const handleBack = () => {
  router.back()
}

const handleViewConfig = () => {
  router.push('/admin/task-config')
}

const loadData = async () => {
  try {
    loading.value = true
    const params: Record<string, number | string> = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.task_code) {
      params.task_code = searchForm.task_code
    }
    if (searchForm.task_name) {
      params.task_name = searchForm.task_name
    }
    const res = await taskApi.getTaskLogs(params)
    if (res.data) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination.total || 0
      if (res.data.pagination.page) {
        pagination.page = res.data.pagination.page
      }
      if (res.data.pagination.pageSize) {
        pagination.pageSize = res.data.pagination.pageSize
      }
    }
  } catch (error) {
    console.error('加载执行日志失败:', error)
    ElMessage.error('加载执行日志失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleResetFilters = () => {
  searchForm.task_code = ''
  searchForm.task_name = ''
  handleSearch()
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

const handleViewDetail = (row: TaskLogInfo) => {
  selectedLog.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.task-logs-management {
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
  gap: 10px;
}

.stats-section {
  padding: 0px 16px 0 16px;
  border-bottom: 1px solid #ebeef5;
}

.stat-item {
  text-align: center;
  padding: 8px 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2px;
}

.stat-unit {
  font-size: 12px;
  color: #909399;
}

.stats-divider {
  display: none;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 20px;
}

.table-card :deep(.el-card__header) {
  padding: 16px 16px 12px 16px;
  border-bottom: 1px solid #ebeef5;
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

.search-input {
  width: 220px !important;
  min-width: 160px;
}

.search-btn,
.reset-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.view-config-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
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
  margin-top: 0;
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  background-color: #ffffffac;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
