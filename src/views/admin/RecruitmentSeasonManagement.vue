<template>
  <div class="recruitment-season-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">报名通道管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">报名通道列表</span>
            </div>
            <div class="header-right">
              <el-button type="primary" @click="openAddDialog">开启新通道</el-button>
              <el-button
                v-if="isSuperAdmin"
                type="warning"
                @click="handleCloseAll"
                :loading="closeAllLoading"
              >
                关闭所有通道
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
            <el-table-column prop="year" label="年份" width="100" align="center" />
            <el-table-column prop="type" label="报名类型" width="140" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === 'new_student' ? 'primary' : 'success'">
                  {{ row.type === 'new_student' ? '新生纳新' : '换届竞选' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="is_open" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.is_open === 1 ? 'success' : 'info'">
                  {{ row.is_open === 1 ? '已开启' : '已关闭' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="开始时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.start_time) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="end_time" label="结束时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.end_time) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.created_at) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="row.is_open === 1"
                  type="warning"
                  link
                  @click="handleClose(row)"
                >
                  关闭
                </el-button>
                <el-button
                  v-if="row.is_open === 0"
                  type="danger"
                  link
                  @click="handleDelete(row)"
                >
                  删除
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

    <!-- 开启新通道对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="开启新报名通道"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" :rules="addFormRules" ref="addFormRef" label-width="120px">
        <el-form-item label="年份" prop="year">
          <el-input-number
            v-model="addForm.year"
            :min="2020"
            :max="2100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="报名类型" prop="type">
          <el-radio-group v-model="addForm.type">
            <el-radio label="new_student">新生纳新</el-radio>
            <el-radio label="internal_election">内部换届竞选</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="addForm.title"
            placeholder="如：2025级新生纳新"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="addForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="addForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="addLoading" @click="handleConfirmAdd">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { recruitmentSeasonApi } from '@/utils/api'
import type {
  RecruitmentSeasonInfo,
  OpenSeasonParams,
  CloseSeasonParams,
  DeleteSeasonParams,
} from '@/utils/api/types'
import { useDate } from '@/utils/date'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<RecruitmentSeasonInfo[]>([])
const addDialogVisible = ref(false)
const addLoading = ref(false)
const closeAllLoading = ref(false)
const addFormRef = ref<FormInstance>()

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

// 获取当前用户角色
const currentRole = computed(() => localStorage.getItem('role') || '')
const isSuperAdmin = computed(() => currentRole.value === 'superadmin')

const addForm = reactive<OpenSeasonParams & { start_time?: string | null; end_time?: string | null }>({
  year: new Date().getFullYear(),
  type: 'new_student',
  title: '',
  start_time: null,
  end_time: null,
})

const addFormRules: FormRules = {
  year: [{ required: true, message: '请选择年份', trigger: 'blur' }],
  type: [{ required: true, message: '请选择报名类型', trigger: 'change' }],
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 4, max: 100, message: '标题长度在 4 到 100 个字符', trigger: 'blur' },
  ],
}

const handleBack = () => {
  router.push('/admin/dashboard')
}

const openAddDialog = () => {
  addForm.year = new Date().getFullYear()
  addForm.type = 'new_student'
  addForm.title = ''
  addForm.start_time = null
  addForm.end_time = null
  addDialogVisible.value = true
}

const handleConfirmAdd = async () => {
  if (!addFormRef.value) return

  await addFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      addLoading.value = true
      const params: OpenSeasonParams = {
        year: addForm.year,
        type: addForm.type,
        title: addForm.title,
        start_time: addForm.start_time || null,
        end_time: addForm.end_time || null,
      }
      await recruitmentSeasonApi.open(params)
      addDialogVisible.value = false
      await loadData()
    } catch (error) {
      console.error('开启报名通道失败:', error)
    } finally {
      addLoading.value = false
    }
  })
}

const handleClose = async (row: RecruitmentSeasonInfo) => {
  try {
    await ElMessageBox.confirm('确定要关闭该报名通道吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const params: CloseSeasonParams = {
      year: row.year,
      type: row.type,
    }
    await recruitmentSeasonApi.close(params)
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('关闭报名通道失败:', error)
    }
  }
}

const handleCloseAll = async () => {
  try {
    await ElMessageBox.confirm('确定要关闭所有报名通道吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    closeAllLoading.value = true
    await recruitmentSeasonApi.closeAll()
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('关闭所有报名通道失败:', error)
    }
  } finally {
    closeAllLoading.value = false
  }
}

const handleDelete = async (row: RecruitmentSeasonInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.year} 年 ${row.type === 'new_student' ? '新生纳新' : '换届竞选'} 的报名通道吗？删除后无法恢复。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const params: DeleteSeasonParams = {
      year: row.year,
      type: row.type,
    }
    await recruitmentSeasonApi.delete(params)
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除报名通道失败:', error)
    }
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

const loadData = async () => {
  try {
    loading.value = true
    const res = await recruitmentSeasonApi.getList()
    if (res.data?.list) {
      tableData.value = res.data.list
      pagination.total = res.data.list.length
    }
  } catch (error) {
    console.error('加载报名通道列表失败:', error)
    ElMessage.error('加载报名通道列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.recruitment-season-management {
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
</style>

