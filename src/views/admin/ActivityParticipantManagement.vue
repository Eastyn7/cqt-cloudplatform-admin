<template>
  <div class="activity-participant-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">活动参与管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">参与记录列表</span>
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
                    placeholder="活动名称 / 学生姓名 / 学号 / 学院"
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
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="paginatedData" v-loading="loading" border stripe table-layout="auto">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="activity_name" label="活动名称" min-width="200" />
            <el-table-column prop="activity_status" label="活动状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getDisplayStatusType(row)">
                  {{ getDisplayStatus(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="student_name" label="学生姓名" width="120" />
            <el-table-column prop="student_id" label="学号" width="140" />
            <el-table-column prop="college" label="学院" width="150" />
            <el-table-column prop="service_hours" label="服务时长(h)" width="120" align="center" />
            <el-table-column prop="signed_in" label="签到状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="row.signed_in ? 'success' : 'info'">
                  {{ row.signed_in ? '已签到' : '未签到' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openDetail(row)"
                  >查看详情</el-button
                >
                <el-button type="success" link size="small" @click="handleSignIn(row)"
                  >切换签到</el-button
                >
                <el-button type="warning" link size="small" @click="openHoursDialog(row)"
                  >修改时长</el-button
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
        title="参与记录详情"
        size="680px"
        :with-header="true"
        @closed="resetDetailForm"
      >
        <el-descriptions border :column="1" class="detail-descriptions">
          <el-descriptions-item label="活动名称">{{
            detailForm.activity_name || '--'
          }}</el-descriptions-item>
          <el-descriptions-item label="活动状态">
            <el-tag :type="getDisplayStatusType(detailForm)">
              {{ getDisplayStatus(detailForm) || '--' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="学生姓名">{{
            detailForm.student_name || '--'
          }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{
            detailForm.student_id || '--'
          }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{ detailForm.college || '--' }}</el-descriptions-item>
          <el-descriptions-item label="服务时长(h)">{{
            detailForm.service_hours || 0
          }}</el-descriptions-item>
          <el-descriptions-item label="签到状态">
            <el-tag :type="detailForm.signed_in ? 'success' : 'info'">
              {{ detailForm.signed_in ? '已签到' : '未签到' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

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
            <el-button @click="detailVisible = false">关闭</el-button>
          </span>
        </template>
      </el-drawer>
    </div>

    <!-- 修改服务时长对话框 -->
    <el-dialog
      v-model="hoursDialogVisible"
      title="修改服务时长"
      width="420px"
      :close-on-click-modal="false"
      class="hours-dialog"
      @closed="resetHoursForm"
    >
      <el-form :model="hoursForm" label-width="120px">
        <el-form-item label="学生">
          <span>{{ hoursForm.student_name }}（{{ hoursForm.student_id }}）</span>
        </el-form-item>
        <el-form-item label="活动名称">
          <span>{{ hoursForm.activity_name }}</span>
        </el-form-item>
        <el-form-item label="服务时长 (h)" required>
          <el-input-number
            v-model="hoursForm.service_hours"
            :min="0"
            :step="0.5"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="hoursDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="hoursSaving" @click="handleHoursSave">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh } from '@element-plus/icons-vue'
import { activityParticipantApi } from '@/utils/api'
import type { StudentActivityRecord } from '@/utils/api/types'
import { useDate } from '@/utils/date'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<StudentActivityRecord[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const handleBack = () => {
  router.push('/admin/dashboard')
}

// 搜索表单
const searchForm = reactive({
  keyword: '',
})

const appliedFilters = reactive({
  keyword: '',
})

// 移除前端过滤逻辑，现在搜索在后端进行

// 计算当前页应该显示的数据（直接使用后端分页的数据）
const paginatedData = computed(() => {
  return tableData.value
})

// 移除前端分页监听，现在分页在后端进行

const getActivityStatusType = (
  status: string
): 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined> = {
    草稿: 'info',
    进行中: 'success',
    已结束: undefined,
    draft: 'info',
    ongoing: 'success',
    ending: undefined,
  }
  return map[status] || undefined
}

const getActivityStatusLabel = (status: string): string => {
  if (!status) return ''
  const map: Record<string, string> = {
    draft: '草稿',
    ongoing: '进行中',
    ending: '已结束',
  }
  return map[status] || status
}

const getDisplayStatus = (record: {
  activity_status?: string | null
  start_time?: string | null
  end_time?: string | null
}): string => {
  // 1. 优先用后端给的状态（英文 code 或中文）
  if (record.activity_status) {
    return getActivityStatusLabel(record.activity_status)
  }

  // 2. 没有状态时，根据开始/结束时间简单推断
  const now = new Date()
  const start = dateUtil.toDate(record.start_time)
  const end = dateUtil.toDate(record.end_time)

  if (start && now < start) {
    return '草稿'
  }
  if (end && now > end) {
    return '已结束'
  }
  if (start) {
    return '进行中'
  }

  // 3. 实在推不出，就当草稿显示出来，避免整列空白
  return '草稿'
}

const getDisplayStatusType = (record: {
  activity_status?: string | null
  start_time?: string | null
  end_time?: string | null
}) => {
  return getActivityStatusType(getDisplayStatus(record))
}

// 搜索
const handleSearch = async () => {
  appliedFilters.keyword = searchForm.keyword
  pagination.page = 1
  await loadData()
}

const handleResetFilters = async () => {
  searchForm.keyword = ''
  await handleSearch()
}

// 详情抽屉相关
const detailVisible = ref(false)
const detailForm = reactive({
  record_id: 0,
  activity_name: '',
  activity_status: '',
  student_name: '',
  student_id: '',
  college: '',
  service_hours: 0,
  signed_in: 0,
  created_at: '',
  updated_at: '',
})

const resetDetailForm = () => {
  detailForm.record_id = 0
  detailForm.activity_name = ''
  detailForm.activity_status = ''
  detailForm.student_name = ''
  detailForm.student_id = ''
  detailForm.college = ''
  detailForm.service_hours = 0
  detailForm.signed_in = 0
  detailForm.created_at = ''
  detailForm.updated_at = ''
}

const openDetail = (row: StudentActivityRecord) => {
  detailVisible.value = true
  detailForm.record_id = row.record_id
  detailForm.activity_name = row.activity_name || ''
  detailForm.activity_status = row.activity_status || ''
  detailForm.student_name = row.student_name || ''
  detailForm.student_id = row.student_id || ''
  detailForm.college = row.college || ''
  detailForm.service_hours = row.service_hours || 0
  detailForm.signed_in = row.signed_in || 0
  detailForm.created_at = row.created_at || ''
  detailForm.updated_at = row.updated_at || ''
}

const handleSignIn = (row: StudentActivityRecord) => {
  const target = row.signed_in === 1 ? 0 : 1
  const label = target === 1 ? '签到' : '取消签到'
  ElMessageBox.confirm(`确定要为该记录执行「${label}」操作吗？`, '确认', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await activityParticipantApi.signIn(row.record_id, { signed_in: target })
        ElMessage.success('签到状态已更新')
        await loadData()
      } catch (error) {
        console.error('更新签到状态失败:', error)
      }
    })
    .catch(() => {})
}

// 修改服务时长
const hoursDialogVisible = ref(false)
const hoursSaving = ref(false)
const hoursForm = reactive<{
  record_id: number | null
  activity_name: string
  student_name: string
  student_id: string
  service_hours: number | null
}>({
  record_id: null,
  activity_name: '',
  student_name: '',
  student_id: '',
  service_hours: null,
})

const resetHoursForm = () => {
  hoursForm.record_id = null
  hoursForm.activity_name = ''
  hoursForm.student_name = ''
  hoursForm.student_id = ''
  hoursForm.service_hours = null
}

const openHoursDialog = (row: StudentActivityRecord) => {
  hoursForm.record_id = row.record_id
  hoursForm.activity_name = row.activity_name
  hoursForm.student_name = row.student_name
  hoursForm.student_id = row.student_id
  hoursForm.service_hours = row.service_hours
  hoursDialogVisible.value = true
}

const handleHoursSave = async () => {
  if (!hoursForm.record_id || hoursForm.service_hours == null) {
    ElMessage.warning('请填写服务时长')
    return
  }
  hoursSaving.value = true
  try {
    await activityParticipantApi.updateHours(hoursForm.record_id, {
      service_hours: hoursForm.service_hours,
    })
    ElMessage.success('服务时长已更新')
    hoursDialogVisible.value = false
    resetHoursForm()
    await loadData()
  } catch (error) {
    console.error('更新服务时长失败:', error)
  } finally {
    hoursSaving.value = false
  }
}

const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  await loadData()
}

const handlePageChange = async (page: number) => {
  pagination.page = page
  await loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: appliedFilters.keyword || undefined,
    }
    const response = await activityParticipantApi.getAllPage(params)
    if (response.data?.list) {
      tableData.value = response.data.list
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('加载参与记录失败:', error)
    ElMessage.error('加载参与记录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.activity-participant-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
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
  width: 280px !important;
  min-width: 200px;
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

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.table-wrapper :deep(.el-table__row) {
  height: 54px;
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
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  background-color: #ffffffac;
}

.detail-descriptions {
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

.hours-dialog :deep(.el-dialog__body) {
  max-height: calc(60vh - 80px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1200px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    width: 100%;
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
