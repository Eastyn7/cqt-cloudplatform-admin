<template>
  <div class="permission-setting-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">权限设置管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">管理员列表</span>
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
                    placeholder="搜索学号或姓名"
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
              <el-button v-if="isSuperAdmin" type="primary" @click="openSetAdminDialog">
                设置管理员
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
            height="100%"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="student_id" label="学号" min-width="120" />
            <el-table-column prop="name" label="姓名" min-width="100" />
            <el-table-column prop="email" label="邮箱" min-width="200" />
            <el-table-column prop="role" label="角色" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.role === 'superadmin' ? 'danger' : 'warning'">
                  {{ row.role === 'superadmin' ? '超级管理员' : '管理员' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="isSuperAdmin && row.role !== 'superadmin'"
                  type="danger"
                  link
                  size="small"
                  @click="handleRemoveAdmin(row)"
                >
                  取消管理员
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

      <!-- 设置管理员弹窗 -->
      <el-dialog
        v-if="isSuperAdmin"
        v-model="setAdminDialogVisible"
        title="设置管理员"
        class="set-admin-dialog admin-modal-large"
        :close-on-click-modal="false"
        @closed="handleAddDialogClosed"
      >
        <div class="set-admin-dialog-scroll">
          <el-form :model="setAdminForm" label-width="100px" class="set-admin-form" height="100%">
            <el-form-item label="搜索用户">
              <el-input
                v-model="setAdminForm.searchQuery"
                placeholder="输入学号或姓名搜索用户"
                clearable
                @input="handleSearchUsers"
                class="search-user-input"
              >
                <template #prefix>
                  <el-icon class="el-input__icon">
                    <Search />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="searchResults.length > 0" label="选择用户">
              <div class="user-table-container">
                <!-- 表头 -->
                <div class="user-table-header">
                  <div class="header-cell select-column">
                    <el-checkbox
                      :model-value="isAllSelected"
                      :indeterminate="isIndeterminate"
                      @change="handleSelectAll"
                    />
                  </div>
                  <div class="header-cell student-id-column">学号</div>
                  <div class="header-cell name-column">姓名</div>
                  <div class="header-cell email-column">邮箱</div>
                  <div class="header-cell role-column">角色</div>
                </div>

                <!-- 表格内容 -->
                <div class="user-table-body">
                  <div
                    v-for="user in searchResults"
                    :key="user.student_id"
                    class="user-row"
                    :class="{ 'selected': setAdminForm.selectedUserIds.includes(user.student_id) }"
                  >
                    <div class="body-cell select-column">
                      <el-checkbox
                        :model-value="setAdminForm.selectedUserIds.includes(user.student_id)"
                        @change="handleSelectUser(user.student_id)"
                      />
                    </div>
                    <div class="body-cell student-id-column">
                      <span class="student-id">{{ user.student_id }}</span>
                    </div>
                    <div class="body-cell name-column">
                      <span class="name">{{ user.name || '未设置姓名' }}</span>
                    </div>
                    <div class="body-cell email-column">
                      <span class="email">{{ user.email }}</span>
                    </div>
                    <div class="body-cell role-column">
                      <el-tag size="small" :type="getRoleTagType(user.role)">
                        {{ getRoleText(user.role) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </el-form-item>

            <!-- 已选择的用户 -->
            <el-form-item v-if="selectedUsers.length > 0" label="已选择用户">
              <div class="selected-users-container">
                <div class="selected-users-list">
                  <el-tag
                    v-for="user in selectedUsers"
                    :key="user.student_id"
                    closable
                    @close="removeSelectedUser(user.student_id)"
                    class="selected-user-tag"
                  >
                    {{ user.name || user.student_id }}
                  </el-tag>
                </div>
                <div class="selected-count">
                  已选择 {{ selectedUsers.length }} 个用户
                </div>
              </div>
            </el-form-item>
          </el-form>
        </div>
        
        <template #footer>
          <div class="dialog-footer">
            <div class="footer-action">
              <el-button @click="setAdminDialogVisible = false">取消</el-button>
              <el-button
                type="primary"
                :loading="setAdminLoading"
                :disabled="!setAdminForm.selectedUserIds.length"
                @click="handleSetAdmin"
              >
                确认设置 ({{ setAdminForm.selectedUserIds.length }})
              </el-button>
            </div>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Refresh } from '@element-plus/icons-vue'
import { permissionApi } from '@/utils/api'
import type { AdminInfo } from '@/utils/api/types'

const router = useRouter()

const loading = ref(false)
const tableData = ref<AdminInfo[]>([])

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

// 搜索
const handleSearch = async () => {
  appliedFilters.keyword = searchForm.keyword
  pagination.page = 1
  await fetchAdmins()
}

// 重置搜索
const handleResetFilters = async () => {
  searchForm.keyword = ''
  await handleSearch()
}

// 分页大小改变
const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  await fetchAdmins()
}

// 页码改变
const handlePageChange = async (page: number) => {
  pagination.page = page
  await fetchAdmins()
}

// 获取所有管理员
const fetchAdmins = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    const response = await permissionApi.getAllAdmins(params)
    if (response.data?.list) {
      tableData.value = response.data.list
      pagination.total = response.data.pagination.total
    }
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    ElMessage.error('获取管理员列表失败')
  } finally {
    loading.value = false
  }
}

// 设置管理员相关
const setAdminDialogVisible = ref(false)
const setAdminLoading = ref(false)
const searchResults = ref<{
  student_id: string
  email: string
  role: 'user' | 'admin' | 'superadmin'
  name: string | null
}[]>([])

const setAdminForm = reactive({
  searchQuery: '',
  selectedUserIds: [] as string[],
})

// 计算属性：已选择的用户
const selectedUsers = computed(() => {
  return searchResults.value.filter(user => setAdminForm.selectedUserIds.includes(user.student_id))
})

// 全选状态
const isAllSelected = computed(() => {
  return searchResults.value.length > 0 && setAdminForm.selectedUserIds.length === searchResults.value.length
})

const isIndeterminate = computed(() => {
  return setAdminForm.selectedUserIds.length > 0 && setAdminForm.selectedUserIds.length < searchResults.value.length
})

const openSetAdminDialog = () => {
  setAdminDialogVisible.value = true
  setAdminForm.searchQuery = ''
  setAdminForm.selectedUserIds = []
  searchResults.value = []
}

const handleAddDialogClosed = () => {
  setAdminForm.searchQuery = ''
  setAdminForm.selectedUserIds = []
  searchResults.value = []
}

// 处理全选
const handleSelectAll = (val: boolean | string | number) => {
  const checked = Boolean(val)
  if (checked) {
    setAdminForm.selectedUserIds = searchResults.value.map(user => user.student_id)
  } else {
    setAdminForm.selectedUserIds = []
  }
}

// 处理单个用户选择
const handleSelectUser = (studentId: string) => {
  const index = setAdminForm.selectedUserIds.indexOf(studentId)
  if (index > -1) {
    setAdminForm.selectedUserIds.splice(index, 1)
  } else {
    setAdminForm.selectedUserIds.push(studentId)
  }
}

// 移除已选择的用户
const removeSelectedUser = (studentId: string) => {
  const index = setAdminForm.selectedUserIds.indexOf(studentId)
  if (index > -1) {
    setAdminForm.selectedUserIds.splice(index, 1)
  }
}

// 搜索用户
const handleSearchUsers = async () => {
  const query = setAdminForm.searchQuery.trim()
  if (query.length < 2) {
    searchResults.value = []
    return
  }

  try {
    const response = await permissionApi.searchUsers(query)
    searchResults.value = response.data?.list || []
  } catch (error) {
    console.error('搜索用户失败:', error)
    searchResults.value = []
  }
}

// 设置管理员
const handleSetAdmin = async () => {
  if (!setAdminForm.selectedUserIds.length) {
    ElMessage.warning('请选择要设置的用户')
    return
  }

  setAdminLoading.value = true
  try {
    // 批量设置管理员
    for (const studentId of setAdminForm.selectedUserIds) {
      await permissionApi.setAdmin({ student_id: studentId })
    }
    ElMessage.success(`成功设置 ${setAdminForm.selectedUserIds.length} 个用户为管理员`)
    setAdminDialogVisible.value = false
    await fetchAdmins() // 刷新列表
  } catch (error) {
    console.error('设置管理员失败:', error)
  } finally {
    setAdminLoading.value = false
  }
}

// 取消管理员
const handleRemoveAdmin = async (row: AdminInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消用户 ${row.name || row.student_id} 的管理员身份吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await permissionApi.removeAdmin({ student_id: row.student_id })
    ElMessage.success('取消管理员成功')
    await fetchAdmins() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消管理员失败:', error)
    }
  }
}

// 获取角色标签类型
const getRoleTagType = (role: string) => {
  switch (role) {
    case 'superadmin':
      return 'danger'
    case 'admin':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取角色文本
const getRoleText = (role: string) => {
  switch (role) {
    case 'superadmin':
      return '超级管理员'
    case 'admin':
      return '管理员'
    default:
      return '普通用户'
  }
}

onMounted(() => {
  fetchAdmins()
})
</script>

<style scoped>
.permission-setting-management {
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

.set-admin-dialog :deep(.el-dialog__body) {
  max-height: calc(80vh - 120px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.set-admin-dialog-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.set-admin-form {
  flex: 1;
  overflow: hidden;
}

.set-admin-form :deep(.el-form-item__content) {
  width: 100%;
  margin-left: 0 !important;
}

.set-admin-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.search-user-input {
  width: 100%;
}

.user-list {
  width: 100%;
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
  margin-top: 0;
}

.user-table-container {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
  overflow: hidden;
}

.user-table-header {
  display: flex;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}

.header-cell {
  padding: 12px 16px;
  text-align: left;
  border-right: 1px solid #ebeef5;
}

.header-cell:last-child {
  border-right: none;
}

.select-column {
  width: 80px;
  text-align: center;
}

.student-id-column {
  width: 140px;
}

.name-column {
  width: 120px;
}

.email-column {
  flex: 1;
  min-width: 200px;
}

.role-column {
  width: 100px;
  text-align: center;
}

.user-table-body {
  max-height: 300px;
  overflow-y: auto;
}

.user-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.user-row:hover {
  background-color: #f5f7fa;
}

.user-row.selected {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.user-row:last-child {
  border-bottom: none;
}

.body-cell {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  border-right: 1px solid #f0f0f0;
  font-size: 14px;
}

.body-cell:last-child {
  border-right: none;
}

.select-column .body-cell {
  justify-content: center;
}

.role-column .body-cell {
  justify-content: center;
}

.selected-users-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
}

.selected-users-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.selected-user-tag {
  margin: 0;
}

.selected-count {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.student-id {
  font-weight: 600;
  color: #303133;
}

.name {
  color: #606266;
}

.email {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
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