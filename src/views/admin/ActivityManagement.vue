<template>
  <div class="activity-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">志愿活动管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">活动列表</span>
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
                    placeholder="活动名称 / 部门 / 地点"
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
                    v-model="searchForm.status"
                    placeholder="状态"
                    clearable
                    class="search-select"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="草稿" value="草稿" />
                    <el-option label="进行中" value="进行中" />
                    <el-option label="已结束" value="已结束" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-input
                    v-model="searchForm.category"
                    placeholder="活动类别"
                    clearable
                    class="search-input"
                  />
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
              <el-button type="primary" @click="openEditDialog()">
                <el-icon>
                  <Plus />
                </el-icon>
                新增活动
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="paginatedData" v-loading="loading" border stripe table-layout="auto">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="封面" width="250" align="center">
              <template #default="{ row }">
                <el-image
                  v-if="row.cover_key && coverUrlMap.get(row.cover_key)"
                  :preview-teleported="true"
                  class="cover-thumb"
                  :src="coverUrlMap.get(row.cover_key)"
                  :preview-src-list="getAllCoverUrls()"
                  :lazy="true"
                  fit="cover"
                  style="width: 220px; height: 138px; border-radius: 4px; cursor: pointer"
                >
                  <template #placeholder>
                    <div class="image-skeleton">
                      <el-icon class="image-spinner"><Loading /></el-icon>
                    </div>
                  </template>
                  <template #error>
                    <div class="image-error">
                      <el-icon :size="20"><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
                <span v-else-if="row.cover_key" class="cover-loading">加载中...</span>
                <span v-else class="cover-empty">未上传</span>
              </template>
            </el-table-column>
            <el-table-column prop="activity_name" label="活动名称" min-width="200" />
            <el-table-column prop="dept_name" label="部门" width="120" />
            <el-table-column prop="category" label="类别" width="120" />
            <el-table-column prop="location" label="地点" min-width="160" />
            <el-table-column prop="service_hours" label="服务时长(h)" width="120" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="开始时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.start_time) || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="end_time" label="结束时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.end_time) || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="280" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openDetail(row)"
                  >查看详情</el-button
                >
                <el-button type="success" link size="small" @click="handleStatusChange(row)"
                  >切换状态</el-button
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
      </el-card>

      <!-- 详情 Drawer -->
      <el-drawer
        v-model="detailVisible"
        title="活动详情与编辑"
        size="680px"
        :with-header="true"
        class="activity-detail-drawer"
      >
        <el-form :model="detailForm" label-width="100px" class="detail-form">
          <el-form-item label="活动名称">
            <el-input v-model="detailForm.activity_name" />
          </el-form-item>
          <el-form-item label="部门">
            <el-input v-model="detailForm.dept_name" disabled />
          </el-form-item>
          <el-form-item label="类别">
            <el-input v-model="detailForm.category" />
          </el-form-item>
          <el-form-item label="地点">
            <el-input v-model="detailForm.location" />
          </el-form-item>
          <el-form-item label="服务时长(h)">
            <el-input-number
              v-model="detailForm.service_hours"
              :min="0"
              :step="0.5"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="detailForm.start_time"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择开始时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker
              v-model="detailForm.end_time"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择结束时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="detailForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 100%"
            >
              <el-option label="草稿" value="草稿" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已结束" value="已结束" />
            </el-select>
          </el-form-item>
          <el-form-item label="封面图片">
            <div class="cover-upload">
              <div class="cover-preview-wrapper">
                <el-image
                  v-if="detailForm.cover_url"
                  :preview-teleported="true"
                  class="cover-preview"
                  :src="detailForm.cover_url"
                  :preview-src-list="[detailForm.cover_url]"
                  :lazy="true"
                  fit="cover"
                >
                  <template #placeholder>
                    <div class="image-skeleton small">
                      <el-icon class="image-spinner"><Loading /></el-icon>
                    </div>
                  </template>
                  <template #error>
                    <div class="image-error">
                      <el-icon :size="20"><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
                <el-empty v-else description="暂无封面" :image-size="60" />
              </div>
              <div class="cover-upload-actions">
                <el-upload
                  class="cover-upload-btn"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/png,image/jpeg,image/webp"
                  :disabled="detailCoverUploading"
                  @change="handleDetailCoverChange"
                >
                  <el-button :loading="detailCoverUploading">上传封面</el-button>
                </el-upload>
                <el-button
                  v-if="detailForm.cover_url"
                  type="danger"
                  link
                  size="small"
                  @click="clearDetailCover"
                >
                  移除封面
                </el-button>
                <el-progress
                  v-if="detailCoverUploading"
                  :percentage="detailCoverProgress"
                  :stroke-width="4"
                  status="success"
                />
              </div>
            </div>
          </el-form-item>
          <!-- 不再手动维护封面 URL，仅展示封面预览和 key -->
          <el-form-item label="封面 key">
            <el-input
              v-model="detailForm.cover_key"
              placeholder="OSS 存储 key（例如 uploads/activity-covers/xxx.jpg）"
            />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="detailForm.description"
              type="textarea"
              :rows="3"
              placeholder="活动简介、招募说明等"
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
    </div>

    <!-- 新增/编辑活动对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.activity_id ? '编辑活动' : '新增活动'"
      :close-on-click-modal="false"
      class="activity-edit-dialog admin-modal-large"
      @closed="resetEditForm"
    >
      <el-form :model="editForm" label-width="96px" class="edit-form">
        <el-form-item label="活动名称" required>
          <el-input v-model="editForm.activity_name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select
            v-model="editForm.dept_id"
            placeholder="请选择部门"
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
        </el-form-item>
        <el-form-item label="类别">
          <el-input v-model="editForm.category" placeholder="如 校内活动 / 校外活动" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="editForm.location" placeholder="活动地点" />
        </el-form-item>
        <el-form-item label="服务时长(h)">
          <el-input-number
            v-model="editForm.service_hours"
            :min="0"
            :step="0.5"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="editForm.start_time"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="editForm.end_time"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="草稿" />
            <el-option label="进行中" value="进行中" />
            <el-option label="已结束" value="已结束" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图片">
          <div class="cover-upload">
            <div class="cover-preview-wrapper">
              <el-image
                v-if="editForm.cover_url"
                :preview-teleported="true"
                class="cover-preview"
                :src="editForm.cover_url"
                :preview-src-list="[editForm.cover_url]"
                :lazy="true"
                fit="cover"
              >
                <template #placeholder>
                  <div class="image-skeleton small">
                    <el-icon class="image-spinner"><Loading /></el-icon>
                  </div>
                </template>
                <template #error>
                  <div class="image-error">
                    <el-icon :size="20"><Picture /></el-icon>
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>
              <el-empty v-else description="未上传" :image-size="60" />
            </div>
            <div class="cover-upload-actions">
              <el-upload
                class="cover-upload-btn"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/png,image/jpeg,image/webp"
                :disabled="editCoverUploading"
                @change="handleEditCoverChange"
              >
                <el-button :loading="editCoverUploading">上传封面</el-button>
              </el-upload>
              <el-button
                v-if="editForm.cover_url"
                type="danger"
                link
                size="small"
                @click="clearEditCover"
              >
                移除封面
              </el-button>
              <el-progress
                v-if="editCoverUploading"
                :percentage="editCoverProgress"
                :stroke-width="4"
                status="success"
              />
            </div>
          </div>
        </el-form-item>
        <!-- 不再手动维护封面 URL，仅展示封面预览和 key -->
        <el-form-item label="封面 key">
          <el-input v-model="editForm.cover_key" placeholder="OSS 存储 key（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="活动简介、招募说明等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="editSaving" @click="handleEditSave">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Plus, Loading, Picture } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { activityApi, departmentApi } from '@/utils/api'
import type {
  ActivityInfo,
  CreateActivityParams,
  UpdateActivityParams,
  DepartmentInfo,
} from '@/utils/api/types'
import { useDate } from '@/utils/date'
import {
  getSignedOssUrl,
  uploadToOssWithKey,
  validateFileSize,
  validateFileType,
} from '@/utils/oss'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<ActivityInfo[]>([])
const departments = ref<DepartmentInfo[]>([])

// 顶部搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  category: '',
})

// 实际生效的过滤条件
const appliedFilters = reactive({
  keyword: '',
  status: '',
  category: '',
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

const buildCoverPreviewUrl = async (
  coverKey?: string | null,
  fallbackUrl = ''
): Promise<string> => {
  if (!coverKey) return fallbackUrl
  try {
    return await getSignedOssUrl(coverKey, {
      expiresInSeconds: 60 * 10,
      disposition: 'inline',
    })
  } catch (error) {
    console.error('生成活动封面预览链接失败:', error)
    return fallbackUrl
  }
}

// 封面URL缓存（响应式）
const coverUrlMap = reactive<Map<string, string>>(new Map())

// 获取所有封面URL用于预览列表
const getAllCoverUrls = (): string[] => {
  return Array.from(coverUrlMap.values()).filter(Boolean)
}

const getStatusType = (
  status: string
): 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined => {
  const statusMap: Record<
    string,
    'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined
  > = {
    草稿: 'info',
    进行中: 'success',
    已结束: undefined,
  }
  return statusMap[status] || undefined
}

// 顶部搜索
const handleSearch = async () => {
  appliedFilters.keyword = searchForm.keyword
  // 注意：status和category过滤现在不在后端API中支持，仅用于前端显示
  appliedFilters.status = searchForm.status
  appliedFilters.category = searchForm.category
  pagination.page = 1
  await loadData()
}

const handleResetFilters = async () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.category = ''
  await handleSearch()
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

// 封面上传相关
const coverMimeTypes = ['image/png', 'image/jpeg', 'image/webp']
const detailCoverUploading = ref(false)
const detailCoverProgress = ref(0)
const editCoverUploading = ref(false)
const editCoverProgress = ref(0)

const handleCoverUpload = async (uploadFile: UploadFile, target: 'detail' | 'edit') => {
  const file = uploadFile.raw
  if (!file) return
  if (!validateFileType(file, coverMimeTypes)) {
    ElMessage.error('仅支持 JPG/PNG/WEBP 格式的图片')
    return
  }
  if (!validateFileSize(file)) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }

  const uploadingRef = target === 'detail' ? detailCoverUploading : editCoverUploading
  const progressRef = target === 'detail' ? detailCoverProgress : editCoverProgress

  uploadingRef.value = true
  progressRef.value = 0
  try {
    const { url, key } = await uploadToOssWithKey(file, 'uploads/activity-covers/', (progress) => {
      progressRef.value = progress
    })
    if (target === 'detail') {
      // 仅在前端本地用于预览
      detailForm.cover_url = url
      detailForm.cover_key = key
    } else {
      // 仅在前端本地用于预览
      editForm.cover_url = url
      editForm.cover_key = key
    }
    ElMessage.success('封面图片已上传')
  } catch (error) {
    console.error('上传封面失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    uploadingRef.value = false
    progressRef.value = 0
  }
}

const handleDetailCoverChange = (uploadFile: UploadFile) => handleCoverUpload(uploadFile, 'detail')
const handleEditCoverChange = (uploadFile: UploadFile) => handleCoverUpload(uploadFile, 'edit')
const clearDetailCover = () => {
  detailForm.cover_url = ''
  detailForm.cover_key = ''
}
const clearEditCover = () => {
  editForm.cover_url = ''
  editForm.cover_key = ''
}

// 新增/编辑活动
const editDialogVisible = ref(false)
const editSaving = ref(false)

const editForm = reactive<{
  activity_id: number | null
  activity_name: string
  dept_id: number | null
  dept_name: string
  category: string
  cover_url: string
  cover_key: string
  location: string
  service_hours: number | null
  start_time: string | null
  end_time: string | null
  status: '草稿' | '进行中' | '已结束' | ''
  description: string
}>({
  activity_id: null,
  activity_name: '',
  dept_id: null,
  dept_name: '',
  category: '',
  cover_url: '',
  cover_key: '',
  location: '',
  service_hours: null,
  start_time: null,
  end_time: null,
  status: '草稿',
  description: '',
})

const resetEditForm = () => {
  editForm.activity_id = null
  editForm.activity_name = ''
  editForm.dept_id = null
  editForm.dept_name = ''
  editForm.category = ''
  editForm.cover_url = ''
  editForm.cover_key = ''
  editForm.location = ''
  editForm.service_hours = null
  editForm.start_time = null
  editForm.end_time = null
  editForm.status = '草稿'
  editForm.description = ''
}

// 详情抽屉相关
const detailVisible = ref(false)
const detailSaving = ref(false)
const detailForm = reactive({
  activity_id: 0,
  activity_name: '',
  dept_name: '',
  category: '',
  cover_url: '',
  cover_key: '',
  location: '',
  service_hours: null as number | null,
  start_time: null as string | null,
  end_time: null as string | null,
  status: '' as '草稿' | '进行中' | '已结束' | '',
  description: '',
  created_at: '',
  updated_at: '',
})

const resetDetailForm = () => {
  detailForm.activity_id = 0
  detailForm.activity_name = ''
  detailForm.dept_name = ''
  detailForm.category = ''
  detailForm.cover_url = ''
  detailForm.cover_key = ''
  detailForm.location = ''
  detailForm.service_hours = null
  detailForm.start_time = null
  detailForm.end_time = null
  detailForm.status = ''
  detailForm.description = ''
  detailForm.created_at = ''
  detailForm.updated_at = ''
}

const openDetail = async (row: ActivityInfo) => {
  detailVisible.value = true
  detailForm.activity_id = row.activity_id
  detailForm.activity_name = row.activity_name || ''
  detailForm.dept_name = row.dept_name || ''
  detailForm.category = row.category || ''
  detailForm.cover_key = row.cover_key || ''
  if (detailForm.cover_key) {
    if (coverUrlMap.has(detailForm.cover_key)) {
      detailForm.cover_url = coverUrlMap.get(detailForm.cover_key) || ''
    } else {
      detailForm.cover_url = await buildCoverPreviewUrl(detailForm.cover_key, '')
      if (detailForm.cover_url) {
        coverUrlMap.set(detailForm.cover_key, detailForm.cover_url)
      }
    }
  } else {
    detailForm.cover_url = ''
  }
  detailForm.location = row.location || ''
  detailForm.service_hours = row.service_hours ?? null
  detailForm.start_time = row.start_time || null
  detailForm.end_time = row.end_time || null
  detailForm.status = (row.status as '草稿' | '进行中' | '已结束') || ''
  detailForm.description = row.description || ''

  // 尝试获取详细信息
  try {
    const res = await activityApi.getOne(row.activity_id)
    if (res.data) {
      const detail = res.data as ActivityInfo & { created_at?: string; updated_at?: string }
      detailForm.created_at = detail.created_at || ''
      detailForm.updated_at = detail.updated_at || ''
      detailForm.cover_key =
        (detail as ActivityInfo & { cover_key?: string }).cover_key || detailForm.cover_key
      detailForm.cover_url = await buildCoverPreviewUrl(
        detailForm.cover_key,
        (detail as ActivityInfo & { cover_url?: string }).cover_url || detailForm.cover_url
      )
    }
  } catch (error) {
    console.error('获取活动详情失败:', error)
  }
}

// 保存详情
const handleDetailSave = async () => {
  if (!detailForm.activity_id) return
  detailSaving.value = true
  try {
    const payload: UpdateActivityParams = {
      activity_name: detailForm.activity_name || undefined,
      category: detailForm.category || undefined,
      // 只向后端提交封面 key，URL 由前端按需生成
      cover_key: detailForm.cover_key || undefined,
      location: detailForm.location || undefined,
      service_hours: detailForm.service_hours ?? undefined,
      start_time: detailForm.start_time || undefined,
      end_time: detailForm.end_time || undefined,
      status: detailForm.status || undefined,
      description: detailForm.description || undefined,
    }
    await activityApi.update(detailForm.activity_id, payload)
    ElMessage.success('活动信息已更新')
    detailVisible.value = false
    resetDetailForm()
    await loadData()
  } catch (error) {
    console.error('更新活动信息失败:', error)
    ElMessage.error('保存失败')
  } finally {
    detailSaving.value = false
  }
}

const openEditDialog = async (row?: ActivityInfo) => {
  if (row) {
    editForm.activity_id = row.activity_id
    editForm.activity_name = row.activity_name
    editForm.dept_id = row.dept_id ?? null
    editForm.dept_name = row.dept_name || ''
    editForm.category = row.category || ''
    editForm.cover_key = row.cover_key || ''
    if (row.cover_key && coverUrlMap.has(row.cover_key)) {
      editForm.cover_url = coverUrlMap.get(row.cover_key) || ''
    } else if (row.cover_key) {
      editForm.cover_url = await buildCoverPreviewUrl(row.cover_key, '')
      if (editForm.cover_url) {
        coverUrlMap.set(row.cover_key, editForm.cover_url)
      }
    } else {
      editForm.cover_url = ''
    }
    editForm.location = row.location || ''
    editForm.service_hours = row.service_hours ?? null
    editForm.start_time = row.start_time || null
    editForm.end_time = row.end_time || null
    editForm.status = (row.status as '草稿' | '进行中' | '已结束') || '草稿'
    editForm.description = row.description || ''
  } else {
    resetEditForm()
  }
  editDialogVisible.value = true
}

const buildCreatePayload = (): CreateActivityParams => {
  const payload: CreateActivityParams = {
    activity_name: editForm.activity_name.trim(),
  }
  if (editForm.dept_id != null) payload.dept_id = editForm.dept_id
  if (editForm.category) payload.category = editForm.category
  // 只向后端提交封面 key
  if (editForm.cover_key) payload.cover_key = editForm.cover_key
  if (editForm.location) payload.location = editForm.location
  if (editForm.service_hours != null) payload.service_hours = editForm.service_hours
  if (editForm.start_time) payload.start_time = editForm.start_time
  if (editForm.end_time) payload.end_time = editForm.end_time
  if (editForm.status) payload.status = editForm.status
  if (editForm.description) payload.description = editForm.description
  return payload
}

const buildUpdatePayload = (): UpdateActivityParams => {
  const payload: UpdateActivityParams = {}
  if (editForm.activity_name) payload.activity_name = editForm.activity_name.trim()
  if (editForm.dept_id != null) payload.dept_id = editForm.dept_id
  if (editForm.category) payload.category = editForm.category
  // 只向后端提交封面 key
  if (editForm.cover_key) payload.cover_key = editForm.cover_key
  if (editForm.location) payload.location = editForm.location
  if (editForm.service_hours != null) payload.service_hours = editForm.service_hours
  if (editForm.start_time) payload.start_time = editForm.start_time
  if (editForm.end_time) payload.end_time = editForm.end_time
  if (editForm.status) payload.status = editForm.status
  if (editForm.description) payload.description = editForm.description
  return payload
}

const handleEditSave = async () => {
  if (!editForm.activity_name.trim()) {
    ElMessage.warning('请填写活动名称')
    return
  }

  editSaving.value = true
  try {
    if (editForm.activity_id) {
      const payload = buildUpdatePayload()
      await activityApi.update(editForm.activity_id, payload)
      ElMessage.success('活动已更新')
    } else {
      const payload = buildCreatePayload()
      await activityApi.create(payload)
      ElMessage.success('活动已创建')
    }
    editDialogVisible.value = false
    resetEditForm()
    await loadData()
  } catch (error) {
    console.error('保存活动失败:', error)
  } finally {
    editSaving.value = false
  }
}

const handleStatusChange = (row: ActivityInfo) => {
  const nextStatus = row.status === '草稿' ? '进行中' : row.status === '进行中' ? '已结束' : '草稿'
  ElMessageBox.confirm(`确定将活动状态切换为「${nextStatus}」吗？`, '确认', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await activityApi.changeStatus(row.activity_id, { status: nextStatus })
        ElMessage.success('状态已更新')
        await loadData()
      } catch (error) {
        console.error('切换状态失败:', error)
      }
    })
    .catch(() => {})
}

const handleDelete = (row: ActivityInfo) => {
  ElMessageBox.confirm('确定要删除该活动吗？', '提示', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await activityApi.delete(row.activity_id)
        ElMessage.success('删除成功')
        await loadData()
      } catch (error) {
        console.error('删除活动失败:', error)
      }
    })
    .catch(() => {})
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: appliedFilters.keyword || undefined,
      status: appliedFilters.status || undefined,
      category: appliedFilters.category || undefined,
    }
    const res = await activityApi.getPage(params)
    if (res.data?.list) {
      const list = res.data.list
      // 加载列表时根据封面 key 生成临时访问 URL，并填充到coverUrlMap
      await Promise.all(
        list.map(async (item) => {
          const withKey = item as ActivityInfo & { cover_key?: string }
          if (withKey.cover_key) {
            const url = await buildCoverPreviewUrl(withKey.cover_key, '')
            if (url) {
              coverUrlMap.set(withKey.cover_key, url)
            }
          }
        })
      )
      tableData.value = list
      pagination.total = res.data.pagination.total
    }
  } catch (error) {
    console.error('加载活动列表失败:', error)
    ElMessage.error('加载活动列表失败')
  } finally {
    loading.value = false
  }
}

const loadDepartments = async () => {
  if (departments.value.length) return
  try {
    const res = await departmentApi.getAll()
    departments.value = res.data?.list || []
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
.activity-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.activity-management {
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

.table-wrapper :deep(.el-table__row) {
  height: 54px;
}

.table-wrapper :deep(.el-table) {
  height: 100%;
}

.table-wrapper :deep(.el-table__body-wrapper) {
  overflow: auto;
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

.activity-detail-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-detail-drawer :deep(.el-descriptions) {
  margin-bottom: 0;
}

.activity-edit-dialog :deep(.el-dialog__body) {
  max-height: calc(80vh - 120px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.activity-edit-dialog .edit-form {
  flex: 1;
  overflow: auto;
  padding-right: 4px;
}

.cover-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.cover-thumb {
  width: 120px;
  height: 70px;
  border-radius: 6px;
  object-fit: cover;
}

.cover-meta {
  font-size: 12px;
  color: #909399;
  width: 140px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.cover-empty {
  color: #c0c4cc;
}

.cover-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cover-preview-wrapper {
  width: 260px;
  height: 150px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--el-fill-color-lighter);
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-skeleton {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  gap: 6px;
}

.image-skeleton.small {
  height: 150px;
}

.image-spinner {
  animation: spin 1s linear infinite;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #909399;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.cover-upload-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 0;
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #ebeef5;
  background-color: #ffffffac;
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
