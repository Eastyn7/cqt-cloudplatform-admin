<template>
  <div class="task-config-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">定时任务配置</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">定时任务列表</span>
            </div>
            <div class="header-right">
              <el-button
                type="info"
                link
                @click="cronHelpDialogVisible = true"
                class="help-btn"
              >
                <el-icon>
                  <InfoFilled />
                </el-icon>
                Cron规则
              </el-button>
              <el-button type="primary" @click="handleViewLogs" class="view-logs-btn">
                查看执行日志
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
            <el-table-column prop="cron_expr" label="执行频率" width="140" align="center">
              <template #default="{ row }">
                <el-tag type="info">{{ row.cron_expr }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'danger'">
                  {{ row.enabled ? '已启用' : '已禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="last_run_at" label="最后执行时间" width="180">
              <template #default="{ row }">
                <span>{{ row.last_run_at ? formatDateTime(row.last_run_at) : '未执行' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="last_result" label="执行结果" width="120" align="center">
              <template #default="{ row }">
                <span>{{ row.last_result || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  :type="row.enabled ? 'warning' : 'success'"
                  @click="handleToggleEnabled(row)"
                  :loading="loadingTaskId === row.id && toggleLoading"
                  size="small"
                >
                  {{ row.enabled ? '禁用' : '启用' }}
                </el-button>
                <el-button
                  type="primary"
                  @click="handleEditCron(row)"
                  size="small"
                >
                  修改频率
                </el-button>
                <el-button
                  type="danger"
                  @click="handleRunTask(row)"
                  :loading="loadingTaskId === row.id && runLoading"
                  size="small"
                >
                  执行
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

    <!-- Cron 表达式说明对话框 -->
    <el-dialog
      v-model="cronHelpDialogVisible"
      title="Cron 表达式规则"
      width="520px"
      class="cron-help-dialog"
      :close-on-click-modal="false"
    >
      <div class="dialog-content">
        <div class="rule-intro">
          <p>Cron 表达式是一个字符串，分为五个字段，用空格分隔：</p>
          <p class="code-text"><code>分钟 小时 天 月 星期</code></p>
          <p>每个字段支持以下语法：</p>
          <ul>
            <li><strong>*</strong> - 任意值</li>
            <li><strong>*/n</strong> - 每隔 n 个单位执行</li>
            <li><strong>a-b</strong> - 范围</li>
            <li><strong>a,b,c</strong> - 具体数值</li>
          </ul>
        </div>

        <el-divider style="margin: 12px 0">常用表达式</el-divider>

        <el-table :data="cronExamples" border stripe height="200" size="small">
          <el-table-column prop="expr" label="表达式" width="130" align="center">
            <template #default="{ row }">
              <el-tag>{{ row.expr }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="desc" label="含义" />
        </el-table>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cronHelpDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改 Cron 表达式对话框 -->
    <el-dialog
      v-model="cronDialogVisible"
      title="修改执行频率"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="cronForm" label-width="100px">
        <el-form-item label="Cron 表达式">
          <el-input
            v-model="cronForm.cron_expr"
            placeholder="例：*/10 * * * *"
            clearable
          >
            <template #prefix>
              <el-icon>
                <Timer />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input
            v-model="cronForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cronDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="saveLoading"
            @click="handleSaveCron"
          >
            保存配置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Timer, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { taskApi } from '@/utils/api'
import type { TaskConfigInfo } from '@/utils/api/types'
import { formatDateTime } from '@/utils/date'

const router = useRouter()

const loading = ref(false)
const tableData = ref<TaskConfigInfo[]>([])
const toggleLoading = ref(false)
const runLoading = ref(false)
const saveLoading = ref(false)
const loadingTaskId = ref<number | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const cronDialogVisible = ref(false)
const cronHelpDialogVisible = ref(false)
const editingTask = ref<TaskConfigInfo | null>(null)

const cronForm = reactive({
  cron_expr: '',
  remark: '',
})

// Cron 表达式示例
const cronExamples = [
  { expr: '*/5 * * * *', desc: '每 5 分钟执行一次' },
  { expr: '*/10 * * * *', desc: '每 10 分钟执行一次（推荐）' },
  { expr: '*/30 * * * *', desc: '每 30 分钟执行一次' },
  { expr: '0 * * * *', desc: '每小时执行一次（整点）' },
  { expr: '30 * * * *', desc: '每小时的第 30 分钟执行' },
  { expr: '0 */6 * * *', desc: '每 6 小时执行一次' },
  { expr: '0 0 * * *', desc: '每天午夜（00:00）执行' },
]

const handleBack = () => {
  router.push('/admin/dashboard')
}

const handleViewLogs = () => {
  router.push('/admin/task-logs')
}

const loadData = async () => {
  try {
    loading.value = true
    const res = await taskApi.getTaskConfigs({
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    if (res.data?.list) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination?.total || 0
      if (res.data.pagination?.page) {
        pagination.page = res.data.pagination.page
      }
      if (res.data.pagination?.pageSize) {
        pagination.pageSize = res.data.pagination.pageSize
      }
    }
  } catch (error) {
    console.error('加载定时任务列表失败:', error)
    ElMessage.error('加载定时任务列表失败')
  } finally {
    loading.value = false
  }
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

const handleToggleEnabled = async (task: TaskConfigInfo) => {
  loadingTaskId.value = task.id
  toggleLoading.value = true
  try {
    const newEnabled = task.enabled ? 0 : 1
    const res = await taskApi.updateTaskConfig(task.task_code, {
      enabled: newEnabled,
    })
    if (res.data) {
      const index = tableData.value.findIndex((t) => t.id === task.id)
      if (index !== -1) {
        tableData.value[index] = res.data
      }
      ElMessage.success(newEnabled ? '任务已启用' : '任务已禁用')
    }
  } catch (error) {
    console.error('更新任务状态失败:', error)
    ElMessage.error('更新任务状态失败')
  } finally {
    toggleLoading.value = false
    loadingTaskId.value = null
  }
}

const handleEditCron = (task: TaskConfigInfo) => {
  editingTask.value = task
  cronForm.cron_expr = task.cron_expr
  cronForm.remark = task.remark || ''
  cronDialogVisible.value = true
}

const handleSaveCron = async () => {
  if (!cronForm.cron_expr.trim()) {
    ElMessage.warning('请输入 Cron 表达式')
    return
  }

  if (!editingTask.value) return

  saveLoading.value = true
  try {
    const res = await taskApi.updateTaskConfig(editingTask.value.task_code, {
      cron_expr: cronForm.cron_expr.trim(),
      remark: cronForm.remark.trim() || undefined,
    })
    if (res.data) {
      const index = tableData.value.findIndex((t) => t.id === editingTask.value!.id)
      if (index !== -1) {
        tableData.value[index] = res.data
      }
      cronDialogVisible.value = false
      ElMessage.success('执行频率已更新')
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  } finally {
    saveLoading.value = false
  }
}

const handleRunTask = async (task: TaskConfigInfo) => {
  loadingTaskId.value = task.id
  runLoading.value = true
  try {
    const res = await taskApi.runTask(task.task_code)
    if (res.data) {
      ElMessage.success(`任务执行成功！受影响行数: ${res.data.affected_rows}`)
      await loadData()
    }
  } catch (error) {
    console.error('执行任务失败:', error)
    ElMessage.error('执行任务失败')
  } finally {
    runLoading.value = false
    loadingTaskId.value = null
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.task-config-management {
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

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.view-logs-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.help-btn {
  font-size: 13px;
}

.help-btn :deep(.el-icon) {
  margin-right: 4px;
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

.dialog-content {
  padding: 8px 0;
}

.cron-help-dialog :deep(.el-dialog__body) {
  max-height: calc(80vh - 150px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.dialog-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rule-intro {
  margin-bottom: 12px;
  color: #606266;
  line-height: 1.6;
  font-size: 13px;
}

.rule-intro p {
  margin: 4px 0;
}

.rule-intro .code-text {
  background-color: #f5f7fa;
  padding: 6px 10px;
  border-radius: 4px;
  margin: 6px 0;
  font-size: 12px;
}

.rule-intro code {
  color: #f56c6c;
  font-family: monospace;
  font-size: 12px;
}

.rule-intro ul {
  margin: 6px 0 0 18px;
  padding: 0;
}

.rule-intro li {
  margin: 2px 0;
  font-size: 13px;
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
}
</style>
