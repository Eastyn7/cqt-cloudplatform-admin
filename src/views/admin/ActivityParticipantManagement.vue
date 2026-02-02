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
                    placeholder="姓名 / 学号 / 学院"
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
                    v-model="searchForm.activity_id"
                    placeholder="按活动筛选"
                    clearable
                    filterable
                    class="search-select"
                  >
                    <el-option
                      v-for="act in activityOptions"
                      :key="act.activity_id"
                      :label="act.activity_name"
                      :value="act.activity_id"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-select
                    v-model="searchForm.status"
                    placeholder="报名状态"
                    clearable
                    class="search-select"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="待审核" value="待审核" />
                    <el-option label="已同意" value="已同意" />
                    <el-option label="已拒绝" value="已拒绝" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-select
                    v-model="searchForm.signed_in"
                    placeholder="签到状态"
                    clearable
                    class="search-select"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="已签到" :value="1" />
                    <el-option label="未签到" :value="0" />
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
              <el-button
                type="success"
                :disabled="approveDisabled"
                @click="handleBulkApprove(true)"
              >
                同意所选
              </el-button>
              <el-button
                type="danger"
                :disabled="approveDisabled"
                @click="handleBulkApprove(false)"
              >
                拒绝所选
              </el-button>
              <el-divider direction="vertical" />
              <el-button
                type="info"
                :disabled="signInDisabled"
                @click="handleBulkSignIn"
              >
                批量签到
              </el-button>
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
              @selection-change="handleSelectionChange"
            >
            <el-table-column type="selection" width="50" align="center" fixed="left" />
            <el-table-column label="序号" width="60" align="center">
              <template #default="{ $index }">
                {{ $index + 1 + (pagination.page - 1) * pagination.pageSize }}
              </template>
            </el-table-column>
            <el-table-column prop="activity_name" label="活动名称" min-width="200" />
            <el-table-column prop="activity_status" label="活动状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getDisplayStatusType(row)">
                  {{ getDisplayStatus(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="报名状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getSignupStatusType(row.status)">{{ row.status || '待审核' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="approval_reason" label="审核备注" min-width="160">
              <template #default="{ row }">
                <span>{{ row.approval_reason || '--' }}</span>
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
            <el-table-column label="操作" width="220" align="center" fixed="right">
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
          <el-descriptions-item label="报名状态">
            <el-tag :type="getSignupStatusType(detailForm.status)">
              {{ detailForm.status || '待审核' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核备注">{{ detailForm.approval_reason || '--' }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ detailForm.approved_by || '--' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{
            dateUtil.format(detailForm.approved_at) || '--'
          }}</el-descriptions-item>
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
import { activityApi, activityParticipantApi } from '@/utils/api'
import type { ActivityNameInfo, StudentActivityRecord } from '@/utils/api/types'
import { useDate } from '@/utils/date'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<StudentActivityRecord[]>([])
const selectedRows = ref<StudentActivityRecord[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const activityOptions = ref<ActivityNameInfo[]>([])

const handleBack = () => {
  router.push('/admin/dashboard')
}

// 搜索表单
const searchForm = reactive({
  keyword: '',
  activity_id: '' as number | '',
  status: '',
  signed_in: '' as number | '',
})

const appliedFilters = reactive({
  keyword: '',
  activity_id: '' as number | '',
  activity_name: '',
  status: '',
  signed_in: '' as number | '',
})

// 移除前端过滤逻辑，现在搜索在后端进行

// 计算当前页应该显示的数据（直接使用后端分页的数据）
const paginatedData = computed(() => {
  return tableData.value
})

const approveDisabled = computed(() => {
  if (!selectedRows.value.length) return true
  const hasInvalid = selectedRows.value.some((row) => row.status && row.status !== '待审核')
  return hasInvalid
})

const signInDisabled = computed(() => {
  if (!selectedRows.value.length) return true
  // 只要有至少一条记录可以签到就启用按钮
  return false
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

const getSignupStatusType = (
  status?: string | null
): 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined> = {
    待审核: 'warning',
    已同意: 'success',
    已拒绝: 'danger',
  }
  return status ? map[status] : 'warning'
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
  appliedFilters.activity_id = searchForm.activity_id
  appliedFilters.status = searchForm.status
  appliedFilters.signed_in = searchForm.signed_in
  const target = activityOptions.value.find((a) => a.activity_id === searchForm.activity_id)
  appliedFilters.activity_name = target?.activity_name || ''
  pagination.page = 1
  await loadData()
}

const handleResetFilters = async () => {
  searchForm.keyword = ''
  searchForm.activity_id = ''
  searchForm.status = ''
  searchForm.signed_in = ''
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
  status: '',
  approval_reason: '',
  approved_by: '',
  approved_at: '',
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
  detailForm.status = row.status || '待审核'
  detailForm.approval_reason = row.approval_reason || ''
  detailForm.approved_by = row.approved_by || ''
  detailForm.approved_at = row.approved_at || ''
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

const handleSelectionChange = (rows: StudentActivityRecord[]) => {
  selectedRows.value = rows
}

const submitApprovals = async (
  rows: StudentActivityRecord[],
  approved: boolean,
  reason?: string
) => {
  if (!rows.length) return
  const approval_reason = (reason || '').trim() || undefined

  try {
    if (rows.length === 1 && rows[0]) {
      await activityParticipantApi.approve(rows[0].record_id, {
        approved,
        approval_reason,
      })
    } else {
      const approvals = rows.map((row) => ({
        record_id: row.record_id,
        approved,
        approval_reason,
      }))
      await activityParticipantApi.batchApprove({ approvals })
    }
    ElMessage.success(approved ? '已同意所选报名' : '已拒绝所选报名')
    await loadData()
    selectedRows.value = []
  } catch (error) {
    console.error('审批失败:', error)
  }
}

const handleBulkApprove = (approved: boolean) => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择待审核记录')
    return
  }

  const invalid = selectedRows.value.filter((row) => row.status && row.status !== '待审核')
  if (invalid.length) {
    ElMessage.warning('仅可操作待审核记录，请重新选择')
    return
  }

  const targetRows = [...selectedRows.value]

  if (approved) {
    ElMessageBox.confirm(`确认同意选中的 ${targetRows.length} 条报名吗？`, '审核确认', {
      type: 'warning',
    })
      .then(async () => {
        await submitApprovals(targetRows, true)
      })
      .catch(() => {})
  } else {
    ElMessageBox.prompt('请输入拒绝原因（可选）', '拒绝所选', {
      inputType: 'textarea',
      confirmButtonText: '提交',
      cancelButtonText: '取消',
    })
      .then(async ({ value }) => {
        await submitApprovals(targetRows, false, value)
      })
      .catch(() => {})
  }
}

const handleBulkSignIn = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择要签到的记录')
    return
  }

  // 统计已签到和未签到的记录
  const signedIn = selectedRows.value.filter((row) => row.signed_in === 1)
  const notSignedIn = selectedRows.value.filter((row) => row.signed_in !== 1)

  let message = ''
  if (signedIn.length > 0 && notSignedIn.length > 0) {
    message = `选中 ${selectedRows.value.length} 条记录：${signedIn.length} 条已签到，${notSignedIn.length} 条未签到。\n确认将未签到的记录改为已签到吗？`
  } else if (notSignedIn.length > 0) {
    message = `确认将选中的 ${notSignedIn.length} 条记录改为已签到吗？`
  } else {
    ElMessage.info('选中的记录均已签到')
    return
  }

  ElMessageBox.confirm(message, '批量签到确认', {
    type: 'warning',
  })
    .then(async () => {
      try {
        // 调用后端的批量签到接口
        // 预留接口：activityParticipantApi.batchSignIn({ records: notSignedIn.map(r => ({ record_id: r.record_id, signed_in: 1 })) })
        
        // 临时方案：逐条调用单个签到接口（等后端提供批量签到接口后替换）
        const promises = notSignedIn.map((row) =>
          activityParticipantApi.signIn(row.record_id, { signed_in: 1 })
        )
        await Promise.all(promises)
        
        ElMessage.success(`已将 ${notSignedIn.length} 条记录改为已签到`)
        selectedRows.value = []
        await loadData()
      } catch (error) {
        console.error('批量签到失败:', error)
        ElMessage.error('批量签到失败')
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
      activity_name: appliedFilters.activity_name || undefined,
      status: appliedFilters.status || undefined,
      signed_in: appliedFilters.signed_in !== '' ? appliedFilters.signed_in : undefined,
    }
    const response = await activityParticipantApi.getAllPage(params)
    if (response.data?.list) {
      tableData.value = response.data.list
      pagination.total = response.data.pagination.total
      selectedRows.value = []
    }
  } catch (error) {
    console.error('加载参与记录失败:', error)
    ElMessage.error('加载参与记录失败')
  } finally {
    loading.value = false
  }
}

const loadActivities = async () => {
  try {
    const res = await activityApi.getNames()
    activityOptions.value = res.data?.list || []
  } catch (error) {
    console.error('加载活动列表失败:', error)
  }
}

onMounted(() => {
  loadData()
  loadActivities()
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
  width: 200px !important;
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
