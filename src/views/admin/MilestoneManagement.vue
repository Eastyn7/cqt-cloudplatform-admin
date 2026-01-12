<template>
  <div class="milestone-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">服务队发展历程</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">历程记录列表</span>
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
                    placeholder="标题 / 描述 / 届次"
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
              <el-button type="primary" @click="openEditDialog()">
                <el-icon>
                  <Plus />
                </el-icon>
                新增记录
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="paginatedData" v-loading="loading" border stripe table-layout="auto">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="event_date" label="事件日期" width="140">
              <template #default="{ row }">
                <span>{{ dateUtil.formatDate(row.event_date) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="event_type" label="事件类型" width="140" />
            <el-table-column
              prop="description"
              label="描述"
              min-width="280"
              show-overflow-tooltip
            />
            <el-table-column prop="term_name" label="届次" width="120" />
            <el-table-column label="操作" width="220" align="center" fixed="right">
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
      </el-card>

      <!-- 详情 Drawer -->
      <el-drawer
        v-model="detailVisible"
        title="历程详情与编辑"
        size="680px"
        :with-header="true"
        class="milestone-detail-drawer"
      >
        <el-form :model="detailForm" label-width="100px" class="detail-form">
          <el-form-item label="标题">
            <el-input v-model="detailForm.title" />
          </el-form-item>
          <el-form-item label="事件日期">
            <el-date-picker
              v-model="detailForm.event_date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择事件日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="届次">
            <el-input v-model="detailForm.term_name" disabled />
          </el-form-item>
          <el-form-item label="事件类型">
            <el-input v-model="detailForm.event_type" placeholder="如 成立 / 获奖 / 重大活动" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="detailForm.description"
              type="textarea"
              :rows="3"
              placeholder="事件详情描述"
            />
          </el-form-item>
          <el-form-item label="图片预览">
            <div class="image-preview-wrapper">
              <el-image
                v-if="detailForm.image_url"
                :preview-teleported="true"
                class="image-preview"
                :src="detailForm.image_url"
                :preview-src-list="[detailForm.image_url]"
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
              <el-empty v-else description="暂无图片" :image-size="60" />
            </div>
          </el-form-item>
          <el-form-item label="图片上传">
            <div class="image-upload">
              <el-upload
                class="image-upload-btn"
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/png,image/jpeg,image/webp"
                :disabled="imageUploading"
                @change="handleDetailImageChange"
              >
                <el-button :loading="imageUploading">上传图片</el-button>
              </el-upload>
              <el-progress
                v-if="imageUploading"
                :percentage="imageProgress"
                :stroke-width="4"
                status="success"
              />
            </div>
          </el-form-item>
          <!-- 不再手动维护图片 URL，仅展示预览和 key -->
          <el-form-item label="图片 Key">
            <el-input
              v-model="detailForm.image_key"
              placeholder="选填，OSS 图片 key（上传后自动填充）"
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

    <!-- 新增/编辑历程记录对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.milestone_id ? '编辑历程记录' : '新增历程记录'"
      :close-on-click-modal="false"
      class="milestone-edit-dialog admin-modal-large"
      @closed="resetEditForm"
    >
      <el-form :model="editForm" label-width="96px" class="edit-form">
        <el-form-item label="标题" required>
          <el-input v-model="editForm.title" placeholder="请输入里程碑标题" />
        </el-form-item>
        <el-form-item label="事件日期" required>
          <el-date-picker
            v-model="editForm.event_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择事件日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="届次">
          <el-select
            v-model="editForm.term_id"
            placeholder="选填，关联服务队届次"
            filterable
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
        </el-form-item>
        <el-form-item label="事件类型">
          <el-input v-model="editForm.event_type" placeholder="如 成立 / 获奖 / 重大活动" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="事件详情描述"
          />
        </el-form-item>
        <el-form-item label="图片">
          <div class="image-upload">
            <el-upload
              class="image-upload-btn"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/png,image/jpeg,image/webp"
              :disabled="imageUploading"
              @change="handleEditImageChange"
            >
              <el-button :loading="imageUploading">上传图片</el-button>
            </el-upload>
            <div class="image-upload-preview" v-if="editForm.image_url">
              <el-image
                :preview-teleported="true"
                class="image-preview"
                :src="editForm.image_url"
                :preview-src-list="[editForm.image_url]"
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
            </div>
            <el-progress
              v-if="imageUploading"
              :percentage="imageProgress"
              :stroke-width="4"
              status="success"
            />
          </div>
        </el-form-item>
        <!-- 不再手动维护图片 URL，仅展示预览和 key -->
        <el-form-item label="图片 Key">
          <el-input
            v-model="editForm.image_key"
            placeholder="选填，OSS 图片 key（上传后自动填充）"
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
import { teamMilestoneApi } from '@/utils/api'
import type {
  TeamMilestoneInfo,
  CreateTeamMilestoneParams,
  UpdateTeamMilestoneParams,
  TeamTermInfo,
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
const tableData = ref<TeamMilestoneInfo[]>([])
const teamTerms = ref<TeamTermInfo[]>([])

// 图片URL缓存（响应式）
const imageUrlMap = reactive<Map<string, string>>(new Map())

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const handleBack = () => {
  router.push('/admin/dashboard')
}

const buildMilestoneImageUrl = async (
  imageKey?: string | null,
  fallbackUrl = ''
): Promise<string> => {
  if (!imageKey) return fallbackUrl
  try {
    return await getSignedOssUrl(imageKey, {
      expiresInSeconds: 60 * 10,
      disposition: 'inline',
    })
  } catch (error) {
    console.error('生成历程图片预览链接失败:', error)
    return fallbackUrl
  }
}

const searchForm = reactive<{
  keyword: string
}>({
  keyword: '',
})

const appliedFilters = reactive<{
  keyword: string
}>({
  keyword: '',
})

// 移除前端过滤逻辑，现在搜索在后端进行

// 计算当前页应该显示的数据（直接使用后端分页的数据）
const paginatedData = computed(() => {
  return tableData.value
})

// 移除前端分页监听，现在分页在后端进行

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
const detailSaving = ref(false)
const detailForm = reactive({
  milestone_id: 0,
  title: '',
  event_date: null as string | null,
  term_id: null as number | null,
  term_name: '',
  description: '',
  event_type: '',
  image_url: '',
  image_key: '',
  created_at: '',
  updated_at: '',
})

const imageMimeTypes = ['image/png', 'image/jpeg', 'image/webp']
const imageUploading = ref(false)
const imageProgress = ref(0)

const resetDetailForm = () => {
  detailForm.milestone_id = 0
  detailForm.title = ''
  detailForm.event_date = null
  detailForm.term_id = null
  detailForm.term_name = ''
  detailForm.description = ''
  detailForm.event_type = ''
  detailForm.image_url = ''
  detailForm.image_key = ''
  detailForm.created_at = ''
  detailForm.updated_at = ''
}

const openDetail = async (row: TeamMilestoneInfo) => {
  detailVisible.value = true
  detailForm.milestone_id = row.milestone_id
  detailForm.title = row.title || ''
  detailForm.event_date = row.event_date || null
  detailForm.term_id = row.term_id ?? null
  detailForm.term_name = row.term_name || ''
  detailForm.description = row.description || ''
  detailForm.event_type = row.event_type || ''
  detailForm.image_key = row.image_key || ''
  if (detailForm.image_key) {
    detailForm.image_url = await buildMilestoneImageUrl(detailForm.image_key, '')
  } else {
    detailForm.image_url = ''
  }
  detailForm.created_at = (row as TeamMilestoneInfo & { created_at?: string }).created_at || ''
  detailForm.updated_at = (row as TeamMilestoneInfo & { updated_at?: string }).updated_at || ''
}

// 详情抽屉图片上传
const handleDetailImageChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  if (!validateFileType(file, imageMimeTypes)) {
    ElMessage.error('仅支持 JPG/PNG/WEBP 格式的图片')
    return
  }
  if (!validateFileSize(file)) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }
  imageUploading.value = true
  imageProgress.value = 0
  try {
    const { url, key } = await uploadToOssWithKey(file, 'uploads/milestones/', (progress) => {
      imageProgress.value = progress
    })
    // 本地预览使用 URL，后端仅存储 key
    detailForm.image_url = url
    detailForm.image_key = key
    ElMessage.success('图片已上传')
  } catch (error) {
    console.error('上传图片失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    imageUploading.value = false
    imageProgress.value = 0
  }
}

// 保存详情
const handleDetailSave = async () => {
  if (!detailForm.milestone_id) return
  detailSaving.value = true
  try {
    const payload: UpdateTeamMilestoneParams = {
      title: detailForm.title || undefined,
      event_date: detailForm.event_date || undefined,
      term_id: detailForm.term_id ?? undefined,
      description: detailForm.description || undefined,
      event_type: detailForm.event_type || undefined,
      // 只向后端提交 image_key，URL 在前端按需生成
      image_key: detailForm.image_key || undefined,
    }
    await teamMilestoneApi.update(detailForm.milestone_id, payload)
    ElMessage.success('历程记录已更新')
    detailVisible.value = false
    resetDetailForm()
    await loadData()
  } catch (error) {
    console.error('更新历程记录失败:', error)
    ElMessage.error('保存失败')
  } finally {
    detailSaving.value = false
  }
}

const handleDelete = (row: TeamMilestoneInfo) => {
  ElMessageBox.confirm('确定要删除该记录吗？', '提示', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await teamMilestoneApi.delete(row.milestone_id)
        ElMessage.success('删除成功')
        await loadData()
      } catch (error) {
        console.error('删除历程记录失败:', error)
      }
    })
    .catch(() => {})
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
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: appliedFilters.keyword || undefined,
    }
    const milestoneRes = await teamMilestoneApi.getPage(params)
    if (milestoneRes.data?.list) {
      const milestones = milestoneRes.data.list
      // 根据 image_key 生成预览 URL，并填充到imageUrlMap
      await Promise.all(
        milestones.map(async (item) => {
          if (item.image_key) {
            const url = await buildMilestoneImageUrl(item.image_key, '')
            if (url) {
              imageUrlMap.set(item.image_key, url)
            }
          }
        })
      )
      tableData.value = milestones
      pagination.total = milestoneRes.data.pagination.total
    }
  } catch (error) {
    console.error('加载历程列表失败:', error)
    ElMessage.error('加载历程列表失败')
  } finally {
    loading.value = false
  }
}

// 新增/编辑对话框
const editDialogVisible = ref(false)
const editSaving = ref(false)

const editForm = reactive<{
  milestone_id: number | null
  title: string
  event_date: string | null
  term_id: number | null
  description: string
  event_type: string
  image_url: string
  image_key: string
}>({
  milestone_id: null,
  title: '',
  event_date: null,
  term_id: null,
  description: '',
  event_type: '',
  image_url: '',
  image_key: '',
})

const resetEditForm = () => {
  editForm.milestone_id = null
  editForm.title = ''
  editForm.event_date = null
  editForm.term_id = null
  editForm.description = ''
  editForm.event_type = ''
  editForm.image_url = ''
  editForm.image_key = ''
}

const openEditDialog = async (row?: TeamMilestoneInfo) => {
  if (row) {
    editForm.milestone_id = row.milestone_id
    editForm.title = row.title
    editForm.event_date = row.event_date
    editForm.term_id = row.term_id ?? null
    editForm.description = row.description || ''
    editForm.event_type = row.event_type || ''
    editForm.image_key = row.image_key || ''
    if (row.image_key) {
      editForm.image_url = await buildMilestoneImageUrl(row.image_key, '')
    } else {
      editForm.image_url = ''
    }
  } else {
    resetEditForm()
  }
  editDialogVisible.value = true
}

// 新增/编辑对话框图片上传
const handleEditImageChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  if (!validateFileType(file, imageMimeTypes)) {
    ElMessage.error('仅支持 JPG/PNG/WEBP 格式的图片')
    return
  }
  if (!validateFileSize(file)) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }
  imageUploading.value = true
  imageProgress.value = 0
  try {
    const { url, key } = await uploadToOssWithKey(file, 'uploads/milestones/', (progress) => {
      imageProgress.value = progress
    })
    // 本地预览使用 URL，后端仅存储 key
    editForm.image_url = url
    editForm.image_key = key
    ElMessage.success('图片已上传')
  } catch (error) {
    console.error('上传图片失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    imageUploading.value = false
    imageProgress.value = 0
  }
}

const buildCreatePayload = (): CreateTeamMilestoneParams => {
  const payload: CreateTeamMilestoneParams = {
    title: editForm.title.trim(),
    event_date: editForm.event_date || '',
  }
  if (editForm.term_id != null) payload.term_id = editForm.term_id
  if (editForm.description) payload.description = editForm.description
  if (editForm.event_type) payload.event_type = editForm.event_type
  // 只向后端提交 image_key
  if (editForm.image_key) payload.image_key = editForm.image_key
  return payload
}

const buildUpdatePayload = (): UpdateTeamMilestoneParams => {
  const payload: UpdateTeamMilestoneParams = {}
  if (editForm.title) payload.title = editForm.title.trim()
  if (editForm.event_date) payload.event_date = editForm.event_date
  if (editForm.term_id != null) payload.term_id = editForm.term_id
  if (editForm.description) payload.description = editForm.description
  if (editForm.event_type) payload.event_type = editForm.event_type
  // 只向后端提交 image_key
  if (editForm.image_key) payload.image_key = editForm.image_key
  return payload
}

const handleEditSave = async () => {
  if (!editForm.title.trim() || !editForm.event_date) {
    ElMessage.warning('请填写标题和事件日期')
    return
  }
  editSaving.value = true
  try {
    if (editForm.milestone_id) {
      const payload = buildUpdatePayload()
      await teamMilestoneApi.update(editForm.milestone_id, payload)
      ElMessage.success('历程记录已更新')
    } else {
      const payload = buildCreatePayload()
      await teamMilestoneApi.create(payload)
      ElMessage.success('历程记录已创建')
    }
    editDialogVisible.value = false
    resetEditForm()
    await loadData()
  } catch (error) {
    console.error('保存历程记录失败:', error)
  } finally {
    editSaving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.milestone-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.milestone-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
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

.date-range {
  width: 260px !important;
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

.table-wrapper :deep(.el-table) {
  height: 100%;
}

.table-wrapper :deep(.el-table__row) {
  height: 54px;
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

.image-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-upload-preview,
.image-preview-wrapper {
  width: 200px;
  height: 200px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
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
  height: 200px;
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

.milestone-edit-dialog :deep(.el-dialog__body) {
  max-height: calc(80vh - 120px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.milestone-edit-dialog .edit-form {
  flex: 1;
  overflow: auto;
  padding-right: 4px;
}

.milestone-detail-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-detail-drawer :deep(.el-descriptions) {
  margin-bottom: 0;
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
  .date-range {
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
  .date-range {
    width: 100% !important;
  }
}
</style>
