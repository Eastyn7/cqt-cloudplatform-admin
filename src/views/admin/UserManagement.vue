<template>
  <div class="user-management">
    <!-- 页面标题 -->
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">用户管理</span>
      </template>
    </el-page-header>

    <!-- 主内容区 -->
    <div class="content">
      <div class="search-bar">
        <el-form :model="searchForm" inline label-width="0" @submit.prevent class="search-form">
          <!-- 关键字搜索 -->
          <el-form-item>
            <el-input
              v-model="searchForm.keyword"
              placeholder="姓名 / 学号 / 邮箱 / 电话"
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
          <!-- 角色选择 -->
          <el-form-item>
            <el-select v-model="searchForm.role" placeholder="角色" clearable class="search-select">
              <el-option label="全部" value="" />
              <el-option label="普通用户" value="user" />
              <el-option label="管理员" value="admin" />
              <el-option label="超级管理员" value="superadmin" />
            </el-select>
          </el-form-item>
          <!-- 学院专业级联选择 -->
          <el-form-item>
            <el-cascader
              v-model="searchForm.collegeMajor"
              :options="collegeMajorOptions"
              :props="cascaderProps"
              placeholder="学院/专业"
              clearable
              class="search-cascader"
            />
          </el-form-item>

          <!-- 搜索按钮 -->
          <el-form-item>
            <el-button type="primary" @click="handleSearch" class="search-btn">
              <el-icon>
                <Search />
              </el-icon>
              查询
            </el-button>
          </el-form-item>

          <!-- 重置按钮 -->
          <el-form-item>
            <el-button @click="handleResetFilters" class="reset-btn">
              <el-icon>
                <Refresh />
              </el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 右侧操作按钮组 -->
        <div class="action-buttons">
          <el-button
            v-if="isSuperAdmin"
            type="danger"
            :disabled="selectedUsers.length === 0"
            @click="handleBatchDelete"
            class="batch-delete-btn"
          >
            <el-icon>
              <Delete />
            </el-icon>
            批量删除
          </el-button>
          <el-button type="success" @click="openAddDialog" class="add-batch-btn">
            <el-icon>
              <Upload />
            </el-icon>
            批量新增
          </el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <div class="table-container">
        <div class="card-header">
          <span>用户列表</span>
        </div>

        <div class="table-wrapper">
          <el-table
            ref="userTableRef"
            :data="tableData"
            v-loading="loading"
            border
            stripe
            row-key="student_id"
            :reserve-selection="true"
            height="100%"
            @selection-change="handleSelectionChange"
            @sort-change="handleSortChange"
          >
            <el-table-column v-if="isSuperAdmin" type="selection" width="55" align="center" />
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="头像" width="90" align="center">
              <template #default="{ row }">
                <el-avatar :size="32" :src="getAvatarUrl(row)">{{
                  row.name?.charAt(0) || ''
                }}</el-avatar>
              </template>
            </el-table-column>
            <el-table-column
              prop="student_id"
              label="学号"
              min-width="130"
              sortable
              show-overflow-tooltip
            />
            <el-table-column prop="name" label="姓名" min-width="100" />
            <el-table-column prop="gender" label="性别" min-width="80" />
            <el-table-column prop="college" label="学院" min-width="150" show-overflow-tooltip />
            <el-table-column prop="major" label="专业" min-width="150" show-overflow-tooltip />
            <el-table-column prop="phone" label="联系方式" min-width="140" show-overflow-tooltip />
            <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
            <el-table-column prop="join_date" label="加入日期" min-width="140">
              <template #default="{ row }">
                <span>{{ dateUtil.formatDate(row.join_date) || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="total_hours"
              label="总时长(h)"
              min-width="120"
              sortable="custom"
            />
            <el-table-column
              prop="skill_tags"
              label="技能特长"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column prop="role" label="角色" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getRoleType(row.role)">{{ getRoleLabel(row.role) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openDetail(row)"
                  >查看详情</el-button
                >
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
            :page-sizes="[10, 15, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            small
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 详情 Drawer -->
    <el-drawer v-model="detailVisible" title="用户详情与编辑" size="680px" :with-header="true">
      <el-form :model="detailForm" label-width="96px" class="detail-form">
        <el-form-item label="学号">
          <el-input v-model="detailForm.student_id" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="detailForm.name" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="detailForm.gender" placeholder="请选择">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="学院">
          <el-input v-model="detailForm.college" />
        </el-form-item>
        <el-form-item label="专业">
          <el-input v-model="detailForm.major" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="detailForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="detailForm.email" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-input :value="getRoleLabel(detailForm.role)" disabled />
        </el-form-item>
        <el-form-item label="加入日期">
          <el-date-picker
            v-model="detailForm.join_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 总时长只读（不可更改） -->
        <el-form-item label="总时长 (h)">
          <el-input-number
            v-model="detailFormHours"
            :min="0"
            :step="1"
            style="width: 100%"
            :disabled="true"
          />
        </el-form-item>

        <el-form-item label="技能特长">
          <el-input
            v-model="detailForm.skill_tags"
            type="textarea"
            :rows="2"
            placeholder="多个标签用逗号分隔"
          />
        </el-form-item>
      </el-form>

      <el-descriptions border :column="1" class="detail-meta" title="其他信息">
        <el-descriptions-item label="头像预览">
          <div class="avatar-edit-row">
            <el-avatar :size="40" :src="detailAvatarUrl">
              {{ detailForm.name?.charAt(0) || '' }}
            </el-avatar>
            <el-upload
              class="avatar-upload-btn"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/png,image/jpeg,image/webp"
              :disabled="detailAvatarUploading"
              @change="handleDetailAvatarChange"
            >
              <el-button size="small" :loading="detailAvatarUploading">更换头像</el-button>
            </el-upload>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="信息创建时间">{{
          dateUtil.format(detailForm.info_created_at) || '--'
        }}</el-descriptions-item>
        <el-descriptions-item label="信息更新时间">{{
          dateUtil.format(detailForm.info_updated_at) || '--'
        }}</el-descriptions-item>
        <el-descriptions-item label="账号创建时间">{{
          dateUtil.format(detailForm.account_created_at) || '--'
        }}</el-descriptions-item>
        <el-descriptions-item label="账号更新时间">{{
          dateUtil.format(detailForm.account_updated_at) || '--'
        }}</el-descriptions-item>
        <el-descriptions-item label="最后登录时间">{{
          dateUtil.format(detailForm.last_login_at) || '--'
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
      title="批量新增用户"
      class="batch-add-dialog admin-modal-large"
      :close-on-click-modal="false"
      @closed="handleAddDialogClosed"
    >
      <div class="batch-dialog-scroll">
        <div class="batch-tip">
          <div>
            支持一次录入多名用户，需填写学号、姓名、邮箱、密码。其他字段可按需补充（可留空）。
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
              <el-input v-model="row.student_id" placeholder="学号" />
            </template>
          </el-table-column>
          <el-table-column label="姓名" min-width="120">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="姓名" />
            </template>
          </el-table-column>
          <el-table-column label="邮箱" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.email" placeholder="邮箱" />
            </template>
          </el-table-column>
          <el-table-column label="密码" min-width="140">
            <template #default="{ row }">
              <el-input
                v-model="row.password"
                placeholder="初始密码"
                type="password"
                show-password
              />
            </template>
          </el-table-column>
          <el-table-column label="性别" min-width="100">
            <template #default="{ row }">
              <el-select v-model="row.gender" placeholder="性别" clearable style="width: 100%">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
                <el-option label="其他" value="其他" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="学院" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.college" placeholder="学院" />
            </template>
          </el-table-column>
          <el-table-column label="专业" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.major" placeholder="专业" />
            </template>
          </el-table-column>
          <el-table-column label="电话" min-width="140">
            <template #default="{ row }">
              <el-input v-model="row.phone" placeholder="电话" />
            </template>
          </el-table-column>
          <el-table-column label="加入日期" min-width="140">
            <template #default="{ row }">
              <el-date-picker
                v-model="row.join_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="技能特长" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.skill_tags" placeholder="多个标签用逗号分隔" />
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
          <el-checkbox v-model="onlyUpdateUserInfo" label="仅更新资料（已注册账号不再重复注册）" />
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
</template>

<script setup lang="ts">
import type { TableInstance, UploadFile } from 'element-plus'
import { Search, Refresh, Delete, Upload } from '@element-plus/icons-vue'
import { userInfoApi, userDeleteApi, authApi, collegesMajorsApi } from '@/utils/api'
import type {
  UserInfo,
  UpdateUserInfoParams,
  BatchRegisterUser,
  BatchImportUserInfoParams,
  PaginationParams,
} from '@/utils/api/types'
import {
  uploadToOssWithKey,
  validateFileSize,
  validateFileType,
  getSignedOssUrl,
} from '@/utils/oss'
import BulkImportDialog from '@/components/common/BulkImportDialog.vue'
import { normalizeImportValue, applyImportedEntries } from '@/utils/importHelpers'
import { useDate } from '@/utils/date'

const router = useRouter()
const dateUtil = useDate

// 头像URL缓存（响应式）
const avatarUrlMap = reactive<Map<string, string>>(new Map())

// 从avatar_key生成头像URL（响应式）
const getAvatarUrl = (row: UserInfo): string => {
  if (!row.avatar_key) return ''
  const cached = avatarUrlMap.get(row.avatar_key)
  if (cached) return cached
  // 异步生成URL并更新响应式Map
  getSignedOssUrl(row.avatar_key, {
    expiresInSeconds: 60 * 60,
    disposition: 'inline',
  })
    .then((url) => {
      avatarUrlMap.set(row.avatar_key!, url)
    })
    .catch((error) => {
      console.error('生成头像URL失败:', error)
    })
  return ''
}

// 学院专业选项数据
const collegeMajorOptionsData = ref<Record<string, string[]>>({})

// 表格加载状态与数据源
const loading = ref(false)
const tableData = ref<UserInfo[]>([])
const selectedUsers = ref<UserInfo[]>([])
const userTableRef = ref<TableInstance>()

// 顶部搜索表单数据
const searchForm = reactive({
  keyword: '',
  role: '',
  collegeMajor: [] as string[],
})

// 实际生效的过滤条件（点击搜索后同步）
const appliedFilters = reactive({
  keyword: '',
  role: '',
  college: '',
  major: '',
})

// 从本地存储读取当前登录用户角色
const currentRole = computed(() => localStorage.getItem('role') || '')
const isSuperAdmin = computed(() => currentRole.value === 'superadmin')

const roleLabelMap: Record<UserInfo['role'], string> = {
  user: '普通用户',
  admin: '管理员',
  superadmin: '超级管理员',
}
const getRoleLabel = (role: UserInfo['role']) => roleLabelMap[role] || ''

// 分页信息（当前页、每页条数、总数）
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 根据当前用户数据动态生成学院 / 专业级联选项
const collegeMajorOptions = computed(() => {
  return Object.entries(collegeMajorOptionsData.value).map(([college, majors]) => ({
    value: college,
    label: college,
    children: majors.map((major) => ({
      value: major,
      label: major,
    })),
  }))
})

// 级联选择器字段配置
const cascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children',
  checkStrictly: false,
  emitPath: true,
}

// el-table 触发的排序状态（列字段和顺序）
const sortState = reactive<{ prop: string | null; order: 'ascending' | 'descending' | null }>({
  prop: null,
  order: null,
})

// 根据关键字、角色、学院和专业过滤原始用户数据
// 注意：现在过滤由后端处理，此处仅保留以兼容现有代码结构
// 根据角色返回标签的展示颜色
const getRoleType = (
  role: string
): 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined => {
  const roleMap: Record<string, 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined> =
    {
      user: undefined,
      admin: 'success',
      superadmin: 'warning',
    }
  return roleMap[role] || undefined
}

// 返回到管理员仪表盘
const handleBack = () => {
  router.push('/admin/dashboard')
}

// 删除单个用户
const handleDelete = (row: UserInfo) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', { type: 'warning' })
    .then(async () => {
      try {
        await userDeleteApi.deleteUser(row.student_id)
        ElMessage.success('删除成功')
        await loadData()
      } catch (error) {
        console.error('删除用户失败:', error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// 复选框选择变化时同步选中的用户
const handleSelectionChange = (selection: UserInfo[]) => {
  selectedUsers.value = selection
}

// 批量删除已选中的多个用户
const handleBatchDelete = () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请至少选择一个用户')
    return
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复！`,
    '批量删除确认',
    {
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const studentIds = selectedUsers.value.map((user) => user.student_id)
        await userDeleteApi.batchDelete(studentIds)
        ElMessage.success('批量删除成功')
        selectedUsers.value = []
        await loadData()
        nextTick(() => userTableRef.value?.clearSelection())
      } catch (error) {
        console.error('批量删除用户失败:', error)
        ElMessage.error('批量删除失败')
      }
    })
    .catch(() => {})
}

// 修改每页条数
const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  await loadData()
}

// 切换页码
const handlePageChange = async (page: number) => {
  pagination.page = page
  await loadData()
}

// 点击搜索时同步过滤条件并重置页码和选中状态
const handleSearch = async () => {
  const [college = '', major = ''] = searchForm.collegeMajor || []

  appliedFilters.keyword = searchForm.keyword
  appliedFilters.role = searchForm.role
  appliedFilters.college = college
  appliedFilters.major = major

  pagination.page = 1
  selectedUsers.value = []
  nextTick(() => userTableRef.value?.clearSelection())
  await loadData()
}

// 重置搜索表单与过滤条件
const handleResetFilters = () => {
  searchForm.keyword = ''
  searchForm.role = ''
  searchForm.collegeMajor = []
  handleSearch()
}

// 抽屉中展示和编辑的用户详情表单
const detailVisible = ref(false)
const detailSaving = ref(false)
const detailForm = reactive({
  student_id: '',
  name: '',
  gender: '' as UserInfo['gender'] | '',
  college: '',
  major: '',
  phone: '',
  email: '',
  role: 'user' as UserInfo['role'],
  join_date: '',
  total_hours: '',
  skill_tags: '',
  avatar_key: '',
  info_created_at: '',
  info_updated_at: '',
  account_created_at: '',
  account_updated_at: '',
  last_login_at: '',
})
// 只读展示用的总时长（数字类型）
const detailFormHours = ref<number | null>(null)

// 详情抽屉中的头像URL（从avatar_key生成）
const detailAvatarUrl = ref('')

// 头像上传相关
const detailAvatarUploading = ref(false)
const avatarMimeTypes = ['image/png', 'image/jpeg', 'image/webp']

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
  try {
    const { url, key } = await uploadToOssWithKey(file, 'uploads/avatars/', undefined)
    detailForm.avatar_key = key
    detailAvatarUrl.value = url // 仅用于预览
    ElMessage.success('头像已更新，保存后将同步到数据库')
  } catch (error) {
    console.error('上传头像失败:', error)
    ElMessage.error('上传头像失败，请稍后重试')
  } finally {
    detailAvatarUploading.value = false
  }
}

// 批量新增 / 导入时使用的每一行用户数据结构
type BatchEntry = {
  student_id: string
  name: string
  email: string
  password: string
  gender: string
  college: string
  major: string
  phone: string
  join_date: string
  skill_tags: string
}

// 从导入数据中抽取出来的可选字段集合
type ImportableEntry = Partial<Record<keyof BatchEntry, string>> &
  Record<string, string | number | boolean | null | undefined>

// 创建一条空的批量录入记录
const createBatchEntry = (): BatchEntry => ({
  student_id: '',
  name: '',
  email: '',
  password: '',
  gender: '',
  college: '',
  major: '',
  phone: '',
  join_date: '',
  skill_tags: '',
})

// 批量新增弹窗状态与导入相关配置
const addDialogVisible = ref(false)
const addDialogLoading = ref(false)
const onlyUpdateUserInfo = ref(false)
const importDialogVisible = ref(false)
const importFieldHints = [
  { key: 'student_id', label: '学号', required: true },
  { key: 'name', label: '姓名', required: true },
  { key: 'email', label: '邮箱', required: true },
  { key: 'password', label: '初始密码', required: true },
  { key: 'gender', label: '性别（男 / 女 / 其他）' },
  { key: 'college', label: '学院' },
  { key: 'major', label: '专业' },
  { key: 'phone', label: '联系方式' },
  { key: 'join_date', label: '加入日期（YYYY-MM-DD）' },
  { key: 'skill_tags', label: '技能特长，多个用逗号分隔' },
]
const importExample = `[
  {
    "student_id": "2022000001",
    "name": "张三",
    "email": "zhangsan@ctbu.edu.com",
    "password": "Zs2022000001",
    "gender": "男",
    "college": "计算机学院",
    "major": "软件工程",
    "phone": "13800000000",
    "join_date": "2024-09-01",
    "skill_tags": "手工,剪视频"
  }
]`
const jsonPlaceholder = '粘贴 JSON 数组，例如上方示例'

const batchForm = reactive<{ entries: BatchEntry[] }>({
  entries: [createBatchEntry()],
})

const resetDetailForm = () => {
  detailForm.student_id = ''
  detailForm.name = ''
  detailForm.gender = ''
  detailForm.college = ''
  detailForm.major = ''
  detailForm.phone = ''
  detailForm.email = ''
  detailForm.role = 'user'
  detailForm.join_date = ''
  detailForm.total_hours = ''
  detailForm.skill_tags = ''
  detailForm.avatar_key = ''
  detailForm.info_created_at = ''
  detailForm.info_updated_at = ''
  detailForm.account_created_at = ''
  detailForm.account_updated_at = ''
  detailForm.last_login_at = ''
  detailFormHours.value = null
  detailAvatarUrl.value = ''
}

const openDetail = async (row: UserInfo) => {
  detailVisible.value = true
  detailForm.student_id = row.student_id
  detailForm.name = row.name
  detailForm.gender = row.gender || ''
  detailForm.college = row.college || ''
  detailForm.major = row.major || ''
  detailForm.phone = row.phone || ''
  detailForm.email = row.email
  detailForm.role = row.role
  detailForm.join_date = row.join_date || ''
  detailForm.total_hours = row.total_hours ?? ''
  detailForm.skill_tags = row.skill_tags || ''
  detailForm.avatar_key = row.avatar_key || ''
  detailForm.info_created_at = row.info_created_at || ''
  detailForm.info_updated_at = row.info_updated_at || ''
  detailForm.account_created_at = row.account_created_at || ''
  detailForm.account_updated_at = row.account_updated_at || ''
  detailForm.last_login_at = row.last_login_at || ''
  detailFormHours.value = row.total_hours ? Number(row.total_hours) : 0
  // 从avatar_key生成头像URL
  if (row.avatar_key) {
    try {
      detailAvatarUrl.value = await getSignedOssUrl(row.avatar_key, {
        expiresInSeconds: 60 * 60,
        disposition: 'inline',
      })
    } catch (error) {
      console.error('生成头像URL失败:', error)
      detailAvatarUrl.value = ''
    }
  } else {
    detailAvatarUrl.value = ''
  }
}

// 保存：注意总时长不由 Drawer 修改（不可改），因此 payload 不包含 total_hours
const handleDetailSave = async () => {
  if (!detailForm.student_id) return
  detailSaving.value = true
  try {
    const payload: UpdateUserInfoParams = {
      name: detailForm.name || undefined,
      gender: (detailForm.gender as UserInfo['gender']) || undefined,
      college: detailForm.college || undefined,
      major: detailForm.major || undefined,
      phone: detailForm.phone || undefined,
      join_date: detailForm.join_date || undefined,
      skill_tags: detailForm.skill_tags || undefined,
      avatar_key: detailForm.avatar_key || undefined,
    }
    await userInfoApi.updateUserInfo(detailForm.student_id, payload)
    ElMessage.success('用户信息已更新')
    detailVisible.value = false
    resetDetailForm()
    await loadData()
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error('保存失败')
  } finally {
    detailSaving.value = false
  }
}

// 打开批量新增弹窗
const openAddDialog = () => {
  addDialogVisible.value = true
}

const resetBatchForm = () => {
  batchForm.entries.splice(0, batchForm.entries.length, createBatchEntry())
}

// 关闭批量新增弹窗时重置表单与“仅更新资料”选项
const handleAddDialogClosed = () => {
  resetBatchForm()
  onlyUpdateUserInfo.value = false
}

const openImportDialog = () => {
  importDialogVisible.value = true
}

const buildEntryFromImport = (item: ImportableEntry): BatchEntry => ({
  student_id: normalizeImportValue(item.student_id),
  name: normalizeImportValue(item.name),
  email: normalizeImportValue(item.email),
  password: normalizeImportValue(item.password),
  gender: normalizeImportValue(item.gender),
  college: normalizeImportValue(item.college),
  major: normalizeImportValue(item.major),
  phone: normalizeImportValue(item.phone),
  join_date: normalizeImportValue(item.join_date),
  skill_tags: normalizeImportValue(item.skill_tags),
})

const handleImportRows = (rows: ImportableEntry[]) => {
  applyImportedEntries(rows, buildEntryFromImport, batchForm.entries, {
    onEmpty: () => ElMessage.warning('没有可导入的数据'),
    onSuccess: (count) => ElMessage.success(`成功导入 ${count} 条数据`),
  })
}

// 向批量表格中新增一行空记录
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

// 提交批量新增 / 更新用户
const submitBatchAdd = async () => {
  if (!batchForm.entries.length) {
    ElMessage.warning('请至少添加一行数据')
    throw new Error('no entries')
  }
  const invalidIndex = batchForm.entries.findIndex(
    (entry) => !entry.student_id || !entry.email || !entry.password || !entry.name
  )
  if (invalidIndex !== -1) {
    ElMessage.warning(`第 ${invalidIndex + 1} 行信息未填写完整`)
    throw new Error('invalid entries')
  }
  if (!onlyUpdateUserInfo.value) {
    const registerPayload: BatchRegisterUser[] = batchForm.entries.map((entry) => ({
      student_id: entry.student_id.trim(),
      email: entry.email.trim(),
      password: entry.password,
      name: entry.name.trim(),
    }))
    await authApi.batchRegister(registerPayload)
  }
  const infoPayload: BatchImportUserInfoParams[] = batchForm.entries.map((entry) => ({
    student_id: entry.student_id.trim(),
    name: entry.name.trim(),
    gender: (entry.gender as UserInfo['gender']) || undefined,
    college: entry.college || undefined,
    major: entry.major || undefined,
    phone: entry.phone || undefined,
    join_date: entry.join_date || undefined,
    skill_tags: entry.skill_tags || undefined,
  }))
  await userInfoApi.batchImport(infoPayload)
  ElMessage.success(onlyUpdateUserInfo.value ? '批量更新成功' : '批量新增成功')
  resetBatchForm()
  onlyUpdateUserInfo.value = false
}

// 弹窗底部“确认提交”按钮的点击处理
const handleSubmitAdd = async () => {
  addDialogLoading.value = true
  try {
    await submitBatchAdd()
    addDialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('新增用户失败:', error)
  } finally {
    addDialogLoading.value = false
  }
}

// ----- 加载数据 -----
// 加载学院专业选项
const loadCollegeMajorOptions = async () => {
  try {
    const res = await collegesMajorsApi.getAll()
    if (res.data) {
      collegeMajorOptionsData.value = res.data
    }
  } catch (error) {
    console.error('加载学院专业选项失败:', error)
  }
}

// 从后端加载全部用户数据并刷新表格
const loadData = async () => {
  loading.value = true
  try {
    const params: PaginationParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: appliedFilters.keyword || undefined,
      role: appliedFilters.role || undefined,
      college: appliedFilters.college || undefined,
      major: appliedFilters.major || undefined,
    }
    const res = await userInfoApi.getAllUsers(params)
    if (res.data) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination.total
      await nextTick()
      userTableRef.value?.clearSelection()
      selectedUsers.value = []
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 处理 el-table 触发的排序事件
const handleSortChange = (sort: {
  prop: string | null
  order: 'ascending' | 'descending' | null
}) => {
  sortState.prop = (sort.prop as keyof UserInfo | null) ?? null
  sortState.order = sort.order
  // 当排序改变，重置到第一页
  pagination.page = 1
}

// 组件挂载时初始化数据和过滤结果
onMounted(async () => {
  await loadCollegeMajorOptions()
  await loadData()
  await handleSearch()
})
</script>

<style scoped>
.user-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  gap: 10px;
}

.search-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 0;
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
  min-width: 150px;
}

.search-select {
  width: 120px !important;
  min-width: 100px;
}

.search-cascader {
  width: 200px !important;
  min-width: 150px;
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

.batch-delete-btn,
.add-batch-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.card-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid #ebeef5;
  background-color: #f5f7fa;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
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
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
  .search-select,
  .search-cascader {
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
  .search-select,
  .search-cascader {
    width: 100% !important;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .batch-delete-btn,
  .add-batch-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
