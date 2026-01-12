<template>
  <div class="backbone-member-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">骨干成员管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">骨干成员列表</span>
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
                    placeholder="学号 / 姓名 / 部门 / 职位 / 届次"
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
              <el-button type="primary" @click="openAddDialog">新增成员</el-button>
            </div>
          </div>
        </template>

        <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="main-tabs">
          <el-tab-pane label="列表视图" name="list">
            <div class="tab-content-wrapper">
              <div class="table-wrapper">
                <el-table :data="paginatedData" v-loading="loading" border stripe height="100%">
                  <el-table-column type="index" label="序号" width="60" align="center" />
                  <el-table-column label="展示照片" width="110" align="center">
                    <template #default="{ row }">
                      <el-avatar :size="40" :src="getMemberAvatar(row)">
                        {{ getMemberInitial(row) }}
                      </el-avatar>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="student_id"
                    label="学号"
                    min-width="120"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    prop="student_name"
                    label="姓名"
                    min-width="120"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    prop="dept_name"
                    label="部门"
                    min-width="120"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    prop="term_name"
                    label="届次"
                    min-width="120"
                    show-overflow-tooltip
                  />
                  <el-table-column prop="position" label="职位" width="100" show-overflow-tooltip />
                  <el-table-column label="任期状态" width="120" align="center">
                    <template #default="{ row }">
                      <el-tag :type="isMemberCurrent(row) ? 'success' : 'info'" effect="plain">
                        {{ isMemberCurrent(row) ? '当前任期' : '往届' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip>
                    <template #default="{ row }">
                      {{ row.remark || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="{ row }">
                      <el-button type="primary" link size="small" @click="openDetail(row)"
                        >查看详情</el-button
                      >
                      <el-button type="danger" link size="small" @click="handleDelete(row)"
                        >删除</el-button
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
            </div>
          </el-tab-pane>

          <el-tab-pane label="树形视图" name="tree">
            <BackboneTreeView
              :terms="treeTerms"
              :loading="treeLoading"
              :active="activeTab === 'tree'"
              @view-member="openMemberDetailById"
              @delete-member="deleteMemberById"
            />
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <el-drawer
        v-model="detailVisible"
        title="骨干成员详情与编辑"
        size="680px"
        :with-header="true"
      >
        <el-form :model="detailForm" label-width="100px" class="detail-form">
          <el-form-item label="学号">
            <el-input v-model="detailForm.student_id" />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="detailForm.student_name" disabled />
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="detailForm.dept_id" placeholder="请选择部门" style="width: 100%">
              <el-option
                v-for="dept in departments"
                :key="dept.dept_id"
                :label="dept.dept_name"
                :value="dept.dept_id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="届次">
            <el-select v-model="detailForm.term_id" placeholder="请选择届次" style="width: 100%">
              <el-option
                v-for="term in teamTerms"
                :key="term.term_id"
                :label="term.term_name"
                :value="term.term_id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="职位">
            <el-select v-model="detailForm.position" placeholder="请选择职位" style="width: 100%">
              <el-option label="队长" value="队长" />
              <el-option label="部长" value="部长" />
              <el-option label="副部长" value="副部长" />
              <el-option label="部员" value="部员" />
            </el-select>
          </el-form-item>
          <el-form-item label="展示照片">
            <div class="detail-avatar">
              <el-upload
                class="avatar-upload"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/png,image/jpeg,image/webp"
                :disabled="detailAvatarUploading"
                @change="handleDetailAvatarChange"
              >
                <div class="avatar-preview" :class="{ uploading: detailAvatarUploading }">
                  <img v-if="detailAvatarUrl" :src="detailAvatarUrl" alt="avatar preview" />
                  <el-icon v-else>
                    <Picture />
                  </el-icon>
                  <div class="avatar-mask">
                    <el-icon>
                      <Camera />
                    </el-icon>
                    <span>{{ detailAvatarUrl ? '更换照片' : '上传照片' }}</span>
                  </div>
                </div>
              </el-upload>
              <div class="avatar-actions">
                <el-button
                  v-if="detailAvatarUrl"
                  text
                  type="danger"
                  :disabled="detailAvatarUploading"
                  @click="handleRemoveDetailAvatar"
                >
                  移除照片
                </el-button>
                <el-progress
                  v-if="detailAvatarUploading"
                  :percentage="detailAvatarProgress"
                  :stroke-width="4"
                  status="success"
                />
              </div>
            </div>
          </el-form-item>
          <el-form-item label="任期开始">
            <el-date-picker
              v-model="detailForm.term_start"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="任期结束">
            <el-date-picker
              v-model="detailForm.term_end"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
              style="width: 100%"
            />
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
          <el-descriptions-item label="任期状态">
            <el-tag :type="isMemberCurrent(detailForm) ? 'success' : 'info'" size="small">
              {{ isMemberCurrent(detailForm) ? '当前任期' : '往届' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任期开始">{{
            dateUtil.format(detailForm.term_start) || '--'
          }}</el-descriptions-item>
          <el-descriptions-item label="任期结束">{{
            dateUtil.format(detailForm.term_end) || '--'
          }}</el-descriptions-item>
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

      <el-dialog
        v-model="addDialogVisible"
        title="新增骨干成员"
        class="batch-add-dialog admin-modal-large"
        :close-on-click-modal="false"
        @closed="handleAddDialogClosed"
      >
        <div class="batch-dialog-scroll">
          <div class="batch-tip">
            <div>
              支持一次录入多个骨干成员，需填写学号、部门、届次、职位。其他字段可按需补充（可留空）。
            </div>
            <div class="import-section">
              <el-button type="primary" @click="openImportDialog">导入数据</el-button>
              <span class="import-tip">支持导入 JSON 对象数组或 Excel 文件，一键填充到表单</span>
            </div>
          </div>
          <div class="batch-actions">
            <el-button type="primary" link @click="handleAddBatchRow">新增一行</el-button>
          </div>
          <el-table :data="batchForm.entries" border size="small" class="batch-table" height="100%">
            <el-table-column label="学号" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.student_id" placeholder="学号（必填）" />
              </template>
            </el-table-column>
            <el-table-column label="部门" min-width="150">
              <template #default="{ row }">
                <el-select
                  v-model="row.dept_id"
                  placeholder="选择部门"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="dept in departments"
                    :key="dept.dept_id"
                    :label="dept.dept_name"
                    :value="dept.dept_id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="届次" min-width="150">
              <template #default="{ row }">
                <el-select
                  v-model="row.term_id"
                  placeholder="选择届次"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="term in teamTerms"
                    :key="term.term_id"
                    :label="term.term_name"
                    :value="term.term_id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="职位" min-width="120">
              <template #default="{ row }">
                <el-select
                  v-model="row.position"
                  placeholder="选择职位"
                  clearable
                  style="width: 100%"
                >
                  <el-option label="队长" value="队长" />
                  <el-option label="部长" value="部长" />
                  <el-option label="副部长" value="副部长" />
                  <el-option label="部员" value="部员" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="展示照片 Key" min-width="220">
              <template #default="{ row }">
                <el-input v-model="row.photo_key" placeholder="uploads/backbone-members/xxx.jpg" />
              </template>
            </el-table-column>
            <el-table-column label="任期开始" min-width="140">
              <template #default="{ row }">
                <el-date-picker
                  v-model="row.term_start"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="任期结束" min-width="140">
              <template #default="{ row }">
                <el-date-picker
                  v-model="row.term_end"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  style="width: 100%"
                />
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="150">
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
              <el-button type="primary" :loading="addDialogLoading" @click="handleSubmitAdd"
                >确认提交</el-button
              >
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
import { Camera, Picture, Refresh, Search } from '@element-plus/icons-vue'
import type { TabPaneName, UploadFile } from 'element-plus'
import { backboneMemberApi, departmentApi, teamTermApi } from '@/utils/api'
import type {
  BackboneMemberInfo,
  BackboneMemberTreeTerm,
  BatchCreateBackboneMemberParams,
  CreateBackboneMemberParams,
  UpdateBackboneMemberParams,
  BatchCreateBackboneMemberResponse,
  DepartmentInfo,
  TeamTermInfo,
} from '@/utils/api/types'
import { useDate } from '@/utils/date'
import BulkImportDialog from '@/components/common/BulkImportDialog.vue'
import { normalizeImportValue, applyImportedEntries } from '@/utils/importHelpers'
import BackboneTreeView from '@/components/admin/BackboneTreeView.vue'
import {
  uploadToOssWithKey,
  validateFileSize,
  validateFileType,
  getSignedOssUrl,
} from '@/utils/oss'

const dateUtil = useDate

type PositionOption = '队长' | '部长' | '副部长' | '部员'

const router = useRouter()

const loading = ref(false)
const treeLoading = ref(false)
const tableData = ref<BackboneMemberInfo[]>([])
const treeTerms = ref<BackboneMemberTreeTerm[]>([])
const activeTab = ref<TabPaneName>('list')
const departments = ref<DepartmentInfo[]>([])
const teamTerms = ref<TeamTermInfo[]>([])
const positionOptions: PositionOption[] = ['队长', '部长', '副部长', '部员']
const avatarMimeTypes = ['image/png', 'image/jpeg', 'image/webp']

const normalizePositionValue = (value: string | null | undefined): PositionOption | '' => {
  return positionOptions.includes(value as PositionOption) ? (value as PositionOption) : ''
}

const isMemberCurrent = (member: { is_current?: boolean | number | null | undefined }) => {
  return member.is_current === true || member.is_current === 1
}

// 成员头像URL缓存（响应式）
const memberAvatarUrlMap = reactive<Map<string, string>>(new Map())

const getMemberAvatar = (member: BackboneMemberInfo): string => {
  if (!member.photo_key) return ''
  const cached = memberAvatarUrlMap.get(member.photo_key)
  if (cached) return cached
  // 异步生成URL并更新响应式Map
  getSignedOssUrl(member.photo_key, {
    expiresInSeconds: 60 * 60,
    disposition: 'inline',
  })
    .then((url) => {
      memberAvatarUrlMap.set(member.photo_key!, url)
    })
    .catch((error) => {
      console.error('生成成员头像URL失败:', error)
    })
  return ''
}

const getMemberInitial = (member: BackboneMemberInfo) => {
  return member.student_name?.charAt(0) || member.student_id?.charAt(0) || ''
}

const searchForm = reactive({
  keyword: '',
})

const appliedFilters = reactive({
  keyword: '',
})

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

const handleBack = () => {
  router.push('/admin/dashboard')
}

type BatchEntry = {
  student_id: string
  dept_id: number | null
  term_id: number | null              
  position: PositionOption | ''
  photo_key: string
  term_start: string
  term_end: string
  remark: string
}

const createBatchEntry = (): BatchEntry => ({
  student_id: '',
  dept_id: null,
  term_id: null,
  position: '部员',
  photo_key: '',
  term_start: '',
  term_end: '',
  remark: '',
})

const addDialogVisible = ref(false)
const addDialogLoading = ref(false)
const batchForm = reactive<{ entries: BatchEntry[] }>({
  entries: [createBatchEntry()],
})

const openAddDialog = async () => {
  addDialogVisible.value = true
  await loadDepartmentsAndTerms()
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

const detailVisible = ref(false)
const detailSaving = ref(false)
const detailForm = reactive({
  member_id: 0,
  student_id: '',
  student_name: '',
  dept_id: null as number | null,
  term_id: null as number | null,
  position: '' as PositionOption | '',
  term_start: '',
  term_end: '',
  remark: '',
  photo_key: '',
  is_current: 0 as number | boolean,
  created_at: '',
  updated_at: '',
})

const detailAvatarUploading = ref(false)
const detailAvatarProgress = ref(0)
const detailAvatarUrl = ref('')

// 从photo_key生成详情头像URL
const updateDetailAvatarUrl = async () => {
  if (detailForm.photo_key) {
    try {
      detailAvatarUrl.value = await getSignedOssUrl(detailForm.photo_key, {
        expiresInSeconds: 60 * 60,
        disposition: 'inline',
      })
    } catch (error) {
      console.error('生成详情头像URL失败:', error)
      detailAvatarUrl.value = ''
    }
  } else {
    detailAvatarUrl.value = ''
  }
}

const handleRemoveDetailAvatar = () => {
  detailForm.photo_key = ''
  detailAvatarUrl.value = ''
}

const handleDetailAvatarChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  if (!validateFileType(file, avatarMimeTypes)) {
    ElMessage.error('仅支持 JPG/PNG/WEBP 格式的图片')
    return
  }
  if (!validateFileSize(file)) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }
  detailAvatarUploading.value = true
  detailAvatarProgress.value = 0
  try {
    const { url, key } = await uploadToOssWithKey(file, 'uploads/backbone-members/', (progress) => {
      detailAvatarProgress.value = progress
    })
    detailForm.photo_key = key
    detailAvatarUrl.value = url // 仅用于预览
    ElMessage.success('展示照片已更新')
  } catch (error) {
    console.error('上传展示照片失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    detailAvatarUploading.value = false
    detailAvatarProgress.value = 0
  }
}

const resetDetailForm = () => {
  detailForm.member_id = 0
  detailForm.student_id = ''
  detailForm.student_name = ''
  detailForm.dept_id = null
  detailForm.term_id = null
  detailForm.position = ''
  detailForm.term_start = ''
  detailForm.term_end = ''
  detailForm.remark = ''
  detailForm.photo_key = ''
  detailForm.is_current = 0
  detailForm.created_at = ''
  detailForm.updated_at = ''
  detailAvatarUrl.value = ''
}

const openDetail = async (row: BackboneMemberInfo) => {
  detailVisible.value = true
  await loadDepartmentsAndTerms()
  detailForm.member_id = row.member_id
  detailForm.student_id = row.student_id || ''
  detailForm.student_name = row.student_name || ''
  detailForm.dept_id = row.dept_id || null
  detailForm.term_id = row.term_id || null
  detailForm.position = normalizePositionValue(row.position) || ''
  detailForm.term_start = row.term_start || ''
  detailForm.term_end = row.term_end || ''
  detailForm.remark = row.remark || ''
  detailForm.is_current = row.is_current ?? 0
  detailForm.created_at = row.created_at || ''
  detailForm.updated_at = row.updated_at || ''
  detailForm.photo_key = row.photo_key || ''
  await updateDetailAvatarUrl()
}

const handleDetailSave = async () => {
  if (!detailForm.member_id) return
  detailSaving.value = true
  try {
    const payload: UpdateBackboneMemberParams = {
      student_id: detailForm.student_id || undefined,
      dept_id: detailForm.dept_id || undefined,
      term_id: detailForm.term_id || undefined,
      position: detailForm.position || undefined,
      term_start: detailForm.term_start || undefined,
      term_end: detailForm.term_end || undefined,
      remark: detailForm.remark || undefined,
    }
    // 只提交photo_key，不再提交url
    if (detailForm.photo_key) {
      payload.photo_key = detailForm.photo_key
    } else {
      payload.photo_key = ''
    }
    await backboneMemberApi.update(detailForm.member_id, payload)
    ElMessage.success('骨干成员信息已更新')
    detailVisible.value = false
    resetDetailForm()
    await loadData()
    if (activeTab.value === 'tree') {
      await loadTreeData()
    }
  } catch (error) {
    console.error('更新骨干成员信息失败:', error)
    ElMessage.error('保存失败')
  } finally {
    detailSaving.value = false
  }
}

const handleSearch = async () => {
  appliedFilters.keyword = searchForm.keyword
  pagination.page = 1
  await loadData()
}

const handleResetFilters = async () => {
  searchForm.keyword = ''
  await handleSearch()
}

const handleDelete = (row: BackboneMemberInfo) => {
  ElMessageBox.confirm('确定要删除该成员吗？', '提示', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await backboneMemberApi.delete(row.member_id)
        ElMessage.success('删除成功')
        loadData()
        if (activeTab.value === 'tree') {
          loadTreeData()
        }
      } catch (error) {
        console.error('删除成员失败:', error)
      }
    })
    .catch(() => {})
}

const findMemberById = (memberId: number) => tableData.value.find((m) => m.member_id === memberId)

const openMemberDetailById = (memberId: number) => {
  const member = findMemberById(memberId)
  if (member) {
    openDetail(member)
  } else {
    ElMessage.warning('未找到该成员信息，请刷新列表')
  }
}

const deleteMemberById = (memberId: number) => {
  const member = findMemberById(memberId)
  if (member) {
    handleDelete(member)
  } else {
    ElMessage.warning('未找到该成员记录，已刷新列表')
    loadData()
  }
}

const handleTabChange = (tabName: TabPaneName) => {
  if (tabName === 'tree' && !treeTerms.value.length) {
    loadTreeData()
  }
}

const importDialogVisible = ref(false)
const importFieldHints = [
  { key: 'student_id', label: '学号', required: true },
  { key: 'dept_name', label: '部门名称（需与系统部门一致）', required: true },
  { key: 'term_name', label: '届次名称（需与系统届次一致）', required: true },
  { key: 'position', label: '职位', required: true },
  { key: 'photo_key', label: '展示照片 Key（可选）', required: false },
]
const importExample = `[
  {
    "student_id": "2022000001",
    "dept_name": "秘书处",
    "term_name": "2024-2025",
    "position": "部长",
    "photo_key": "uploads/backbone-members/20240001.jpg"
  }
]`
const jsonPlaceholder = '粘贴 JSON 数组，例如上方示例'

type ImportableEntry = Partial<
  Record<'student_id' | 'dept_name' | 'term_name' | 'position', string>
> &
  Record<string, string | number | boolean | null | undefined>

const openImportDialog = async () => {
  await loadDepartmentsAndTerms()
  importDialogVisible.value = true
}

const loadDepartmentsAndTerms = async () => {
  if (departments.value.length === 0) {
    try {
      const deptRes = await departmentApi.getAll()
      departments.value = deptRes.data?.list || []
    } catch (error) {
      console.error('加载部门列表失败:', error)
    }
  }
  if (teamTerms.value.length === 0) {
    try {
      const termRes = await teamTermApi.getAll()
      teamTerms.value = termRes.data?.list || []
    } catch (error) {
      console.error('加载届次列表失败:', error)
    }
  }
}

const handleImportRows = async (rows: ImportableEntry[]) => {
  await loadDepartmentsAndTerms()
  const deptsByName = new Map(departments.value.map((d) => [d.dept_name, d.dept_id]))
  const termsByName = new Map(teamTerms.value.map((t) => [t.term_name, t.term_id]))

  applyImportedEntries(
    rows,
    (item) => {
      const deptName = normalizeImportValue(item.dept_name)
      const termName = normalizeImportValue(item.term_name)
      const deptId = deptName ? deptsByName.get(deptName) || null : null
      const termId = termName ? termsByName.get(termName) || null : null

      const normalizedPosition = normalizePositionValue(normalizeImportValue(item.position))
      const importedKey = normalizeImportValue(item.photo_key ?? item.avatar_key)
      const entry: BatchEntry = {
        student_id: normalizeImportValue(item.student_id) || '',
        dept_id: deptId,
        term_id: termId,
        position: normalizedPosition || '部员',
        photo_key: importedKey || '',
        term_start: '',
        term_end: '',
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

const submitBatchAdd = async () => {
  if (!batchForm.entries.length) {
    ElMessage.warning('请至少添加一行数据')
    throw new Error('no entries')
  }

  const invalidIndex = batchForm.entries.findIndex(
    (entry) => !entry.student_id?.trim() || !entry.dept_id || !entry.term_id
  )
  if (invalidIndex !== -1) {
    ElMessage.warning(`第 ${invalidIndex + 1} 行信息未填写完整`)
    throw new Error('invalid entries')
  }

  const validEntries = batchForm.entries.filter(
    (entry) => entry.student_id?.trim() && entry.dept_id && entry.term_id
  )
  if (!validEntries.length) {
    ElMessage.warning('没有有效的骨干成员记录可提交')
    throw new Error('no valid entries')
  }

  if (validEntries.length === 1) {
    const entry = validEntries[0]
    if (!entry) {
      throw new Error('no valid entry')
    }
    const normalizedPosition = normalizePositionValue(entry.position)
    const photoKey = entry.photo_key?.trim()
    const payload: CreateBackboneMemberParams = {
      student_id: entry.student_id.trim(),
      dept_id: entry.dept_id!,
      term_id: entry.term_id!,
      position: normalizedPosition || undefined,
      photo_key: photoKey || undefined,
      term_start: entry.term_start?.trim() || undefined,
      term_end: entry.term_end?.trim() || undefined,
      remark: entry.remark?.trim() || undefined,
    }
    await backboneMemberApi.create(payload)
    ElMessage.success('骨干成员创建成功')
    return
  }

  const batchPayload: BatchCreateBackboneMemberParams[] = validEntries.map((entry) => {
    const normalizedPosition = normalizePositionValue(entry.position)
    const photoKey = entry.photo_key?.trim()
    return {
      student_id: entry.student_id.trim(),
      dept_id: entry.dept_id!,
      term_id: entry.term_id!,
      position: normalizedPosition || undefined,
      photo_key: photoKey || undefined,
      term_start: entry.term_start?.trim() || undefined,
      term_end: entry.term_end?.trim() || undefined,
      remark: entry.remark?.trim() || undefined,
    }
  })

  const res = await backboneMemberApi.batchCreate(batchPayload)

  if (res.data) {
    const result: BatchCreateBackboneMemberResponse = res.data
    const { total, created, failed, createdList, failedList } = result

    let message = `批量创建完成：总计 ${total} 条`
    const messages: string[] = []

    if (created > 0) {
      messages.push(`成功创建 ${created} 条`)
      if (createdList && createdList.length > 0) {
        const createdNames = createdList.map((d) => d.student_id).join('、')
        messages.push(`已创建：${createdNames}`)
      }
    }

    if (failed > 0) {
      messages.push(`失败 ${failed} 条`)
      if (failedList && failedList.length > 0) {
        const failedDetails = failedList
          .map((d) => `${d.student_id}（${d.reason || '未知原因'}）`)
          .join('、')
        messages.push(`已失败：${failedDetails}`)
      }
    }

    if (messages.length > 0) {
      message = messages.join('；')
    }

    if (failed === 0) {
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

const handleSubmitAdd = async () => {
  addDialogLoading.value = true
  try {
    await submitBatchAdd()
    addDialogVisible.value = false
    resetBatchForm()
    await loadData()
    if (activeTab.value === 'tree') {
      await loadTreeData()
    }
  } catch (error) {
    console.error('创建骨干成员失败:', error)
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

const loadTreeData = async () => {
  treeLoading.value = true
  try {
    const res = await backboneMemberApi.getTree()
    treeTerms.value = res.data?.list || []
  } catch (error) {
    console.error('加载树形数据失败:', error)
    treeTerms.value = []
  } finally {
    treeLoading.value = false
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
    const res = await backboneMemberApi.getPage(params)
    if (res.data?.list) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination.total
    } else {
      tableData.value = []
    }
  } catch (error) {
    console.error('加载成员列表失败:', error)
    ElMessage.error('加载成员列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  loadDepartmentsAndTerms()
})
</script>

<style scoped>
.backbone-member-management {
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
  height: 100%;
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

.main-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.main-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  padding: 10px 16px 0;
  flex-shrink: 0;
}

.main-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.main-tabs :deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 12px;
}

.table-wrapper :deep(.el-table__row) {
  height: 80px !important;
}

.pagination-container {
  margin-top: 0;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  background-color: #ffffffac;
  flex-shrink: 0;
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

.position-select {
  min-width: 150px;
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

.detail-avatar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-avatar .avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
  background-color: #f5f7fa;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.detail-avatar .avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-avatar .avatar-preview .avatar-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 12px;
}

.detail-avatar .avatar-preview:hover .avatar-mask {
  opacity: 1;
}

.detail-avatar .avatar-preview.uploading {
  opacity: 0.7;
}

.detail-avatar .avatar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-avatar :deep(.el-progress) {
  width: 120px;
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
