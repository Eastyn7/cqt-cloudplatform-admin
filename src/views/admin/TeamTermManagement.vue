<template>
  <div class="team-term-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">届次管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">届次列表</span>
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
                    placeholder="届次名称"
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
              <el-button v-if="isSuperAdmin" type="primary" @click="openAddDialog"
                >新增届次</el-button
              >
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
            <el-table-column prop="term_name" label="届次名称" min-width="150" />
            <el-table-column prop="start_date" label="开始日期" width="120">
              <template #default="{ row }">
                <span>{{ dateUtil.formatDate(row.start_date) || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="end_date" label="结束日期" width="120">
              <template #default="{ row }">
                <span>{{ dateUtil.formatDate(row.end_date) || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="is_current" label="当前届" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.is_current ? 'success' : 'info'">
                  {{ row.is_current ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="isSuperAdmin"
                  type="primary"
                  link
                  size="small"
                  @click="openDetail(row)"
                >
                  查看详情
                </el-button>
                <el-button
                  v-if="isSuperAdmin"
                  type="danger"
                  link
                  size="small"
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

      <!-- 详情 Drawer -->
      <el-drawer
        v-if="isSuperAdmin"
        v-model="detailVisible"
        title="届次详情与编辑"
        size="680px"
        :with-header="true"
      >
        <el-form :model="detailForm" label-width="100px" class="detail-form">
          <el-form-item label="届次名称">
            <el-input v-model="detailForm.term_name" />
          </el-form-item>
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="detailForm.start_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="detailForm.end_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="是否当前届">
            <el-switch v-model="detailForm.is_current" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="detailForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
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
        v-if="isSuperAdmin"
        v-model="addDialogVisible"
        title="新增届次"
        class="batch-add-dialog admin-modal-large"
        :close-on-click-modal="false"
        @closed="handleAddDialogClosed"
      >
        <div class="batch-dialog-scroll">
          <div class="batch-tip">
            <div>支持一次录入多个届次，需填写届次名称。其他字段可按需补充（可留空）。</div>
            <div class="import-section">
              <el-button type="primary" @click="openImportDialog">导入数据</el-button>
              <span class="import-tip">支持导入 JSON 对象数组或 Excel 文件，一键填充到表单</span>
            </div>
          </div>
          <div class="batch-actions">
            <el-button type="primary" link @click="handleAddBatchRow">新增一行</el-button>
          </div>
          <el-table :data="batchForm.entries" border size="small" class="batch-table" height="100%">
            <el-table-column label="届次名称" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.term_name" placeholder="届次名称（必填）" />
              </template>
            </el-table-column>
            <el-table-column label="开始日期" min-width="140">
              <template #default="{ row }">
                <el-date-picker
                  v-model="row.start_date"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="结束日期" min-width="140">
              <template #default="{ row }">
                <el-date-picker
                  v-model="row.end_date"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="是否当前届" min-width="120">
              <template #default="{ row }">
                <el-switch v-model="row.is_current" :active-value="1" :inactive-value="0" />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.remark" placeholder="备注" />
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
              <el-button 
                type="primary" 
                :loading="addDialogLoading" @click="handleSubmitAdd"
              >
                确认提交
              </el-button>
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
import { Search, Refresh } from '@element-plus/icons-vue'
import { teamTermApi } from '@/utils/api'
import type {
  TeamTermInfo,
  BatchCreateTeamTermParams,
  UpdateTeamTermParams,
  CreateTeamTermParams,
  BatchCreateTeamTermResponse,
} from '@/utils/api/types'
import { useDate } from '@/utils/date'
import BulkImportDialog from '@/components/common/BulkImportDialog.vue'
import { normalizeImportValue, applyImportedEntries } from '@/utils/importHelpers'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<TeamTermInfo[]>([])

const searchForm = reactive({
  keyword: '',
})

const appliedFilters = reactive({
  keyword: '',
})

// 获取当前用户角色
const currentRole = computed(() => localStorage.getItem('role') || '')
const isSuperAdmin = computed(() => currentRole.value === 'superadmin')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 移除前端过滤逻辑，现在搜索在后端进行

// 计算当前页应该显示的数据（直接使用后端分页的数据）
const paginatedData = computed(() => {
  return tableData.value
})

// 移除前端分页监听，现在分页在后端进行

// 返回上一页或仪表盘
const handleBack = () => {
  router.push('/admin/dashboard')
}

// 批量新增相关
type BatchEntry = {
  term_name: string
  start_date: string
  end_date: string
  is_current: number
  remark: string
}

const createBatchEntry = (): BatchEntry => ({
  term_name: '',
  start_date: '',
  end_date: '',
  is_current: 0,
  remark: '',
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
  term_id: 0,
  term_name: '',
  start_date: '',
  end_date: '',
  is_current: 0,
  remark: '',
  created_at: '',
  updated_at: '',
})

const resetDetailForm = () => {
  detailForm.term_id = 0
  detailForm.term_name = ''
  detailForm.start_date = ''
  detailForm.end_date = ''
  detailForm.is_current = 0
  detailForm.remark = ''
  detailForm.created_at = ''
  detailForm.updated_at = ''
}

const openDetail = async (row: TeamTermInfo) => {
  detailVisible.value = true
  detailForm.term_id = row.term_id
  detailForm.term_name = row.term_name || ''
  detailForm.start_date = row.start_date || ''
  detailForm.end_date = row.end_date || ''
  detailForm.is_current = row.is_current || 0
  detailForm.remark = row.remark ?? ''

  // 尝试获取详细信息
  try {
    const res = await teamTermApi.getOne(row.term_id)
    if (res.data) {
      const detail = res.data as TeamTermInfo & {
        created_at?: string
        updated_at?: string
        remark?: string
      }
      detailForm.created_at = detail.created_at || ''
      detailForm.updated_at = detail.updated_at || ''
      if (detail.remark !== undefined) detailForm.remark = detail.remark || ''
    }
  } catch (error) {
    console.error('获取届次详情失败:', error)
  }
}

// 保存详情
const handleDetailSave = async () => {
  if (!detailForm.term_id) return
  detailSaving.value = true
  try {
    const payload: UpdateTeamTermParams = {
      term_name: detailForm.term_name || undefined,
      start_date: detailForm.start_date || undefined,
      end_date: detailForm.end_date || undefined,
      is_current: detailForm.is_current || undefined,
      remark: detailForm.remark || undefined,
    }
    await teamTermApi.update(detailForm.term_id, payload)
    ElMessage.success('届次信息已更新')
    detailVisible.value = false
    resetDetailForm()
    await loadData()
  } catch (error) {
    console.error('更新届次信息失败:', error)
    ElMessage.error('保存失败')
  } finally {
    detailSaving.value = false
  }
}

// 搜索和重置
const handleSearch = async () => {
  appliedFilters.keyword = searchForm.keyword
  pagination.page = 1
  await loadData()
}

const handleResetFilters = async () => {
  searchForm.keyword = ''
  await handleSearch()
}

const handleDelete = (row: TeamTermInfo) => {
  ElMessageBox.confirm('确定要删除该届次吗？', '提示', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await teamTermApi.delete(row.term_id)
        ElMessage.success('删除成功')
        loadData()
      } catch (error) {
        console.error('删除届次失败:', error)
      }
    })
    .catch(() => {})
}

// 批量导入弹窗配置
const importDialogVisible = ref(false)
const importFieldHints = [
  { key: 'term_name', label: '届次名称，例如 2024-2025', required: true },
  { key: 'start_date', label: '开始日期（YYYY-MM-DD）', required: true },
  { key: 'end_date', label: '结束日期（YYYY-MM-DD）', required: true },
  { key: 'is_current', label: '是否当前届（true/false）' },
]
const importExample = `[
  {
    "term_name": "2024-2025",
    "start_date": "2024-09-01",
    "end_date": "2025-07-01",
    "is_current": true
  }
]`
const jsonPlaceholder = '粘贴 JSON 数组，例如上方示例'

type ImportableEntry = Partial<
  Record<'term_name' | 'start_date' | 'end_date' | 'is_current', string>
> &
  Record<string, string | number | boolean | null | undefined>

// 打开导入弹窗
const openImportDialog = () => {
  importDialogVisible.value = true
}

// 处理批量导入的届次数据：填充到表单
const handleImportRows = (rows: ImportableEntry[]) => {
  applyImportedEntries(
    rows,
    (item) => {
      const entry: BatchEntry = {
        term_name: normalizeImportValue(item.term_name) || '',
        start_date: normalizeImportValue(item.start_date) || '',
        end_date: normalizeImportValue(item.end_date) || '',
        is_current: normalizeImportValue(item.is_current).toLowerCase() === 'true' ? 1 : 0,
        remark: '',
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
  const invalidIndex = batchForm.entries.findIndex((entry) => !entry.term_name?.trim())
  if (invalidIndex !== -1) {
    ElMessage.warning(`第 ${invalidIndex + 1} 行届次名称未填写`)
    throw new Error('invalid entries')
  }

  // 过滤有效数据
  const validEntries = batchForm.entries.filter((entry) => entry.term_name?.trim())
  if (!validEntries.length) {
    ElMessage.warning('没有有效的届次记录可提交')
    throw new Error('no valid entries')
  }

  // 如果只有一条，调用单独创建接口
  if (validEntries.length === 1) {
    const entry = validEntries[0]
    if (!entry) {
      throw new Error('no valid entry')
    }
    const payload: CreateTeamTermParams = {
      term_name: entry.term_name.trim(),
      start_date: entry.start_date?.trim() || undefined,
      end_date: entry.end_date?.trim() || undefined,
      is_current: entry.is_current || undefined,
      remark: entry.remark?.trim() || undefined,
    }
    await teamTermApi.create(payload)
    ElMessage.success('届次创建成功')
    return
  }

  // 多条数据，调用批量创建接口
  const batchPayload: BatchCreateTeamTermParams[] = validEntries.map((entry) => ({
    term_name: entry.term_name.trim(),
    start_date: entry.start_date?.trim() || undefined,
    end_date: entry.end_date?.trim() || undefined,
    is_current: entry.is_current || undefined,
    remark: entry.remark?.trim() || undefined,
  }))

  const res = await teamTermApi.batchCreate(batchPayload)

  // 处理详细的返回信息
  if (res.data) {
    const result: BatchCreateTeamTermResponse = res.data
    const { total, created, skipped, details } = result

    // 构建详细消息
    let message = `批量创建完成：总计 ${total} 条`
    const messages: string[] = []

    if (created > 0) {
      messages.push(`成功创建 ${created} 条`)
      if (details.created && details.created.length > 0) {
        const createdNames = details.created.map((d) => d.term_name).join('、')
        messages.push(`已创建：${createdNames}`)
      }
    }

    if (skipped > 0) {
      messages.push(`跳过 ${skipped} 条`)
      if (details.skipped && details.skipped.length > 0) {
        const skippedDetails = details.skipped
          .map((d) => `${d.term_name}（${d.reason || '未知原因'}）`)
          .join('、')
        messages.push(`已跳过：${skippedDetails}`)
      }
    }

    if (messages.length > 0) {
      message = messages.join('；')
    }

    // 根据结果显示不同类型的消息
    if (skipped === 0) {
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
    console.error('创建届次失败:', error)
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
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: appliedFilters.keyword || undefined,
    }
    const res = await teamTermApi.getPage(params)
    if (res.data?.list) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination.total
    }
  } catch (error) {
    console.error('加载届次列表失败:', error)
    ElMessage.error('加载届次列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.team-term-management {
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

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 21px;
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
