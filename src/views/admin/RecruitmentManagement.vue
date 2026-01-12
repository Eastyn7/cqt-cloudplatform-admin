<template>
  <div class="recruitment-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">报名管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">报名列表</span>
              <el-form
                :model="searchForm"
                inline
                label-width="0"
                @submit.prevent
                class="search-form"
              >
                <el-form-item v-if="isSuperAdmin">
                  <el-input-number
                    v-model="searchForm.year"
                    placeholder="年份"
                    :min="2020"
                    :max="2100"
                    clearable
                    class="search-input"
                    style="width: 120px"
                  />
                </el-form-item>

                <el-form-item>
                  <el-select
                    v-model="searchForm.type"
                    placeholder="报名类型"
                    clearable
                    class="search-select"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="新生纳新" value="new_student" />
                    <el-option label="内部换届竞选" value="internal_election" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-select
                    v-model="searchForm.status"
                    placeholder="状态"
                    clearable
                    class="search-select"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="待审核" value="pending_review" />
                    <el-option label="一轮通过" value="interview1_passed" />
                    <el-option label="一轮未通过" value="interview1_failed" />
                    <el-option label="二轮通过" value="interview2_passed" />
                    <el-option label="二轮未通过" value="interview2_failed" />
                    <el-option label="待分配" value="pending_assignment" />
                    <el-option label="已录取" value="assigned" />
                    <el-option label="已拒绝" value="rejected" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-input
                    v-model="searchForm.search"
                    placeholder="学号 / 姓名"
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
              <el-button
                v-if="selectedRows.length > 0"
                type="success"
                @click="openReviewDialog"
                class="action-btn"
              >
                批量审核
              </el-button>
              <el-button
                v-if="selectedRows.length > 0 && canAssign"
                type="warning"
                @click="openAssignDialog"
                class="action-btn"
              >
                批量分配
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table
            :data="tableData"
            v-loading="loading"
            border
            stripe
            table-layout="auto"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column type="index" label="序号" width="60" align="center">
              <template #default="{ $index }">
                {{ $index + 1 + (pagination.page - 1) * pagination.pageSize }}
              </template>
            </el-table-column>
            <el-table-column prop="student_id" label="学号" width="140" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="recruitment_type" label="类型" width="160" align="center">
              <template #default="{ row }">
                <el-tag :type="row.recruitment_type === 'new_student' ? 'primary' : 'success'">
                  {{ row.recruitment_type === 'new_student' ? '新生纳新' : '换届竞选' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="intention_dept1" label="第一志愿/竞选部门" width="160" />
            <el-table-column prop="intention_dept2" label="第二志愿" width="160">
              <template #default="{ row }">
                {{ row.intention_dept2 || '--' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="160" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isSuperAdmin"
              prop="final_department"
              label="最终部门"
              width="160"
            >
              <template #default="{ row }">
                {{ row.final_department || '--' }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="提交时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.created_at) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link @click="openDetailDialog(row)">详情</el-button>
                <el-button
                  v-if="canReview(row)"
                  type="success"
                  link
                  @click="openSingleReviewDialog(row)"
                >
                  审核
                </el-button>
                <el-button
                  v-if="canAssignSingle(row)"
                  type="warning"
                  link
                  @click="openSingleAssignDialog(row)"
                >
                  分配
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="报名详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学号">{{ currentDetail.student_id }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ currentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ currentDetail.gender }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{ currentDetail.college }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ currentDetail.major }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ currentDetail.grade }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentDetail.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentDetail.email }}</el-descriptions-item>
          <el-descriptions-item label="QQ">{{ currentDetail.qq || '--' }}</el-descriptions-item>
          <el-descriptions-item label="宿舍">{{
            currentDetail.dormitory || '--'
          }}</el-descriptions-item>
          <el-descriptions-item label="报名类型">
            <el-tag
              :type="currentDetail.recruitment_type === 'new_student' ? 'primary' : 'success'"
            >
              {{ currentDetail.recruitment_type === 'new_student' ? '新生纳新' : '换届竞选' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentDetail.status)">
              {{ getStatusLabel(currentDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="第一志愿/竞选部门" :span="2">
            {{ currentDetail.intention_dept1 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.intention_dept2" label="第二志愿" :span="2">
            {{ currentDetail.intention_dept2 }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.current_position" label="当前职务" :span="2">
            {{ currentDetail.current_position }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.election_position" label="竞选职务" :span="2">
            {{ currentDetail.election_position }}
          </el-descriptions-item>
          <el-descriptions-item label="自我介绍" :span="2">
            <div class="text-content">{{ currentDetail.self_intro || '--' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="过往经历" :span="2">
            <div class="text-content">{{ currentDetail.past_experience || '--' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="加入动机/竞选理由" :span="2">
            <div class="text-content">{{ currentDetail.reason_for_joining || '--' }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.work_plan" label="工作计划" :span="2">
            <div class="text-content">{{ currentDetail.work_plan }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.skill_tags" label="技能标签" :span="2">
            <el-tag
              v-for="tag in parseSkillTags(currentDetail.skill_tags)"
              :key="tag"
              style="margin-right: 8px"
            >
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.final_department" label="最终部门" :span="2">
            {{ currentDetail.final_department }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentDetail.final_position" label="最终职务" :span="2">
            {{ currentDetail.final_position }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">
            {{ dateUtil.formatTime(currentDetail.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      :title="isBatchReview ? '批量审核' : '审核'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="面试轮次" required>
          <el-radio-group v-model="reviewForm.stage">
            <el-radio label="1">一轮面试</el-radio>
            <el-radio label="2">二轮面试</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="reviewForm.pass">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">淘汰</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="reviewForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入审核备注或淘汰原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="reviewLoading" @click="handleConfirmReview">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      :title="isBatchAssign ? '批量分配' : '分配部门'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="部门" required>
          <el-select
            v-model="assignForm.department"
            placeholder="请选择部门"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.dept_name"
              :label="dept.dept_name"
              :value="dept.dept_name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职务">
          <el-select v-model="assignForm.position" placeholder="请选择职务" style="width: 100%">
            <el-option label="队员" value="队员" />
            <el-option label="干事" value="干事" />
            <el-option label="副部长" value="副部长" />
            <el-option label="部长" value="部长" />
            <el-option label="队长" value="队长" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="assignLoading" @click="handleConfirmAssign">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Search, Refresh } from '@element-plus/icons-vue'
import { recruitmentApi, departmentApi } from '@/utils/api'
import type {
  TeamRecruitmentInfo,
  GetRecruitmentListParams,
  RecruitmentStatus,
  ReviewStageParams,
  AssignFinalParams,
  DepartmentInfo,
} from '@/utils/api/types'
import { useDate } from '@/utils/date'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<TeamRecruitmentInfo[]>([])
const selectedRows = ref<TeamRecruitmentInfo[]>([])
const departmentList = ref<DepartmentInfo[]>([])

// 获取当前用户角色
const currentRole = computed(() => localStorage.getItem('role') || '')
const isSuperAdmin = computed(() => currentRole.value === 'superadmin')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  year: new Date().getFullYear(),
})

const searchForm = reactive({
  year: new Date().getFullYear(),
  type: '' as '' | 'new_student' | 'internal_election',
  status: '' as '' | RecruitmentStatus,
  search: '',
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentDetail = ref<TeamRecruitmentInfo | null>(null)

// 审核对话框
const reviewDialogVisible = ref(false)
const reviewLoading = ref(false)
const isBatchReview = ref(false)
const reviewForm = reactive({
  stage: '1' as '1' | '2',
  pass: true,
  remark: '',
})

// 分配对话框
const assignDialogVisible = ref(false)
const assignLoading = ref(false)
const isBatchAssign = ref(false)
const assignForm = reactive({
  department: '',
  position: '队员',
})

// 判断是否可以审核
const canReview = (row: TeamRecruitmentInfo): boolean => {
  if (row.status === 'assigned' || row.status === 'rejected') return false
  if (row.recruitment_type === 'internal_election') {
    // 换届竞选只有一轮面试
    return row.status === 'pending_review'
  } else {
    // 新生纳新有两轮面试
    if (row.status === 'pending_review') return true
    if (row.status === 'interview1_passed') return true
    return false
  }
}

// 判断是否可以分配（批量）
const canAssign = computed(() => {
  return selectedRows.value.some((row) => row.status === 'pending_assignment')
})

// 判断是否可以单个分配
const canAssignSingle = (row: TeamRecruitmentInfo): boolean => {
  return row.status === 'pending_assignment'
}

const getStatusLabel = (status: RecruitmentStatus): string => {
  const statusMap: Record<RecruitmentStatus, string> = {
    pending_review: '待审核',
    interview1_passed: '一轮通过',
    interview1_failed: '一轮未通过',
    interview2_passed: '二轮通过',
    interview2_failed: '二轮未通过',
    pending_assignment: '待分配',
    assigned: '已录取',
    rejected: '已拒绝',
  }
  return statusMap[status] || status
}

const getStatusTagType = (
  status: RecruitmentStatus
): 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined => {
  const typeMap: Record<
    RecruitmentStatus,
    'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined
  > = {
    pending_review: 'info',
    interview1_passed: 'success',
    interview1_failed: 'danger',
    interview2_passed: 'success',
    interview2_failed: 'danger',
    pending_assignment: 'warning',
    assigned: 'success',
    rejected: 'danger',
  }
  return typeMap[status] || undefined
}

const parseSkillTags = (tags: string | null): string[] => {
  if (!tags) return []
  try {
    return JSON.parse(tags)
  } catch {
    return tags.split(',').map((t) => t.trim())
  }
}

const handleBack = () => {
  router.push('/admin/dashboard')
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleResetFilters = () => {
  searchForm.year = new Date().getFullYear()
  searchForm.type = ''
  searchForm.status = ''
  searchForm.search = ''
  handleSearch()
}

const handleSelectionChange = (selection: TeamRecruitmentInfo[]) => {
  selectedRows.value = selection
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

const openDetailDialog = (row: TeamRecruitmentInfo) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

const openReviewDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要审核的记录')
    return
  }
  isBatchReview.value = true
  reviewForm.stage = '1'
  reviewForm.pass = true
  reviewForm.remark = ''
  reviewDialogVisible.value = true
}

const openSingleReviewDialog = (row: TeamRecruitmentInfo) => {
  selectedRows.value = [row]
  isBatchReview.value = false
  // 根据当前状态自动设置面试轮次
  if (row.status === 'pending_review') {
    reviewForm.stage = '1'
  } else if (row.status === 'interview1_passed') {
    reviewForm.stage = '2'
  } else {
    reviewForm.stage = '1'
  }
  reviewForm.pass = true
  reviewForm.remark = ''
  reviewDialogVisible.value = true
}

const handleConfirmReview = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要审核的记录')
    return
  }

  try {
    reviewLoading.value = true
    const studentIds = selectedRows.value.map((row) => row.student_id)
    const params: ReviewStageParams = {
      year: pagination.year,
      student_ids: studentIds,
      stage: reviewForm.stage,
      pass: reviewForm.pass,
      remark: reviewForm.remark || null,
    }
    await recruitmentApi.reviewStage(params)
    reviewDialogVisible.value = false
    selectedRows.value = []
    await loadData()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    reviewLoading.value = false
  }
}

const openAssignDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要分配的记录')
    return
  }
  const canAssignRows = selectedRows.value.filter((row) => row.status === 'pending_assignment')
  if (canAssignRows.length === 0) {
    ElMessage.warning('所选记录中没有待分配状态的记录')
    return
  }
  isBatchAssign.value = true
  assignForm.department = ''
  assignForm.position = '队员'
  assignDialogVisible.value = true
}

const openSingleAssignDialog = (row: TeamRecruitmentInfo) => {
  if (row.status !== 'pending_assignment') {
    ElMessage.warning('该记录不是待分配状态')
    return
  }
  selectedRows.value = [row]
  isBatchAssign.value = false
  assignForm.department = ''
  assignForm.position = '队员'
  assignDialogVisible.value = true
}

const handleConfirmAssign = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要分配的记录')
    return
  }

  if (!assignForm.department) {
    ElMessage.warning('请选择部门')
    return
  }

  try {
    assignLoading.value = true
    const studentIds = selectedRows.value.map((row) => row.student_id)
    const params: AssignFinalParams = {
      year: pagination.year,
      student_ids: studentIds,
      department: assignForm.department,
      position: assignForm.position || '队员',
    }
    await recruitmentApi.assignFinal(params)
    assignDialogVisible.value = false
    selectedRows.value = []
    await loadData()
  } catch (error) {
    console.error('分配失败:', error)
  } finally {
    assignLoading.value = false
  }
}

const loadData = async () => {
  try {
    loading.value = true
    const params: GetRecruitmentListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      year: searchForm.year || undefined,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined,
      search: searchForm.search || undefined,
    }

    const res = await recruitmentApi.getAdminList(params)
    if (res.data) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination.total
      pagination.page = res.data.pagination.page
      pagination.pageSize = res.data.pagination.pageSize
      if (res.data.year) {
        pagination.year = res.data.year
        searchForm.year = res.data.year
      }
    }
  } catch (error) {
    console.error('加载报名列表失败:', error)
    ElMessage.error('加载报名列表失败')
  } finally {
    loading.value = false
  }
}

const loadDepartments = async () => {
  try {
    const res = await departmentApi.getAll()
    if (res.data?.list) {
      departmentList.value = res.data.list
    }
  } catch (error) {
    console.error('加载部门列表失败:', error)
  }
}

onMounted(() => {
  loadData()
  loadDepartments()
})
</script>

<style scoped>
.recruitment-management {
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

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
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

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.text-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
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
