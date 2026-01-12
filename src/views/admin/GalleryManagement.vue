<template>
  <div class="gallery-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">团队相册</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">相册列表</span>
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
                    placeholder="标题 / 描述"
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
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button value="list">列表视图</el-radio-button>
                <el-radio-button value="group">分组视图</el-radio-button>
              </el-radio-group>
              <el-button
                v-if="selectedPhotos.length > 0"
                type="success"
                @click="handleBatchDownload"
                :disabled="downloading"
              >
                <el-icon>
                  <Download />
                </el-icon>
                批量下载 ({{ selectedPhotos.length }})
              </el-button>
              <el-button type="primary" @click="openEditDialog()">
                <el-icon>
                  <Plus />
                </el-icon>
                新增照片
              </el-button>
            </div>
          </div>
        </template>

        <div class="gallery-wrapper" v-loading="loading">
          <!-- 列表视图 -->
          <div class="gallery-grid" v-if="viewMode === 'list' && paginatedData.length > 0">
            <div v-for="item in paginatedData" :key="item.photo_id" class="gallery-card">
              <div class="gallery-card-image">
                <el-image
                  v-if="getImageUrl(item)"
                  :preview-teleported="true"
                  :src="getImageUrl(item)"
                  :preview-src-list="
                    paginatedData.filter((p) => getImageUrl(p)).map((p) => getImageUrl(p))
                  "
                  :lazy="true"
                  fit="cover"
                  class="photo-image"
                >
                  <template #placeholder>
                    <div class="image-skeleton">
                      <el-icon class="image-spinner"><Loading /></el-icon>
                    </div>
                  </template>
                  <template #error>
                    <div class="image-error">
                      <el-icon :size="24"><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
                <div v-else class="photo-placeholder">
                  <el-icon :size="40"><Picture /></el-icon>
                  <span>无照片</span>
                </div>
                <div class="gallery-card-overlay">
                  <el-button type="primary" size="small" @click="openDetail(item)"
                    >查看详情</el-button
                  >
                  <el-button
                    type="success"
                    size="small"
                    @click.stop="handleDownloadPhoto(item)"
                    :disabled="downloading"
                  >
                    <el-icon><Download /></el-icon>
                    下载
                  </el-button>
                  <el-button type="danger" size="small" @click="handleDelete(item)">删除</el-button>
                </div>
                <div class="gallery-card-checkbox">
                  <el-checkbox
                    :model-value="isPhotoSelected(item)"
                    @change="togglePhotoSelection(item)"
                    @click.stop
                  />
                </div>
              </div>
              <div class="gallery-card-content">
                <div class="gallery-card-title" :title="item.title || '无标题'">
                  {{ item.title || '无标题' }}
                </div>
                <div class="gallery-card-meta">
                  <span class="gallery-meta-item" v-if="item.term_name">
                    <el-icon><Calendar /></el-icon>
                    {{ item.term_name }}
                  </span>
                  <span class="gallery-meta-item" v-if="item.uploaded_at">
                    <el-icon><Clock /></el-icon>
                    {{ dateUtil.formatDate(item.uploaded_at) }}
                  </span>
                </div>
                <div
                  class="gallery-card-description"
                  v-if="item.description"
                  :title="item.description"
                >
                  {{ item.description }}
                </div>
              </div>
            </div>
          </div>
          <!-- 分组视图 -->
          <div class="gallery-group-view" v-else-if="viewMode === 'group'">
            <div class="group-search-bar" v-if="viewMode === 'group'">
              <el-input
                v-model="activitySearchKeyword"
                placeholder="搜索活动名称"
                clearable
                style="width: 300px"
                @input="handleActivitySearch"
              >
                <template #prefix>
                  <el-icon class="el-input__icon">
                    <Search />
                  </el-icon>
                </template>
              </el-input>
            </div>
            <el-collapse v-model="activeCollapseGroups" class="activity-collapse">
              <el-collapse-item
                v-for="group in filteredGroupedByActivity"
                :key="group.activity_id || 'no-activity'"
                :name="group.activity_id || 'no-activity'"
                class="activity-group-item"
              >
                <template #title>
                  <div class="activity-group-header">
                    <el-icon><Folder /></el-icon>
                    <span class="activity-group-title">
                      {{ group.activity_name || '未关联活动' }}
                    </span>
                    <span class="activity-group-count">({{ group.photos.length }} 张)</span>
                    <div class="group-actions">
                      <el-checkbox
                        :indeterminate="isGroupIndeterminate(group)"
                        :model-value="isGroupAllSelected(group)"
                        @change="() => toggleGroupSelection(group)"
                        @click.stop
                      >
                        全选本组
                      </el-checkbox>
                      <el-button
                        type="success"
                        link
                        size="small"
                        @click.stop="handleGroupDownload(group)"
                        :disabled="downloading || group.photos.length === 0"
                      >
                        下载本组
                      </el-button>
                    </div>
                  </div>
                </template>
                <div class="gallery-grid">
                  <div v-for="item in group.photos" :key="item.photo_id" class="gallery-card">
                    <div class="gallery-card-image">
                      <el-image
                        v-if="getImageUrl(item)"
                        :preview-teleported="true"
                        :src="getImageUrl(item)"
                        :preview-src-list="
                          group.photos.filter((p) => getImageUrl(p)).map((p) => getImageUrl(p))
                        "
                        :lazy="true"
                        fit="cover"
                        class="photo-image"
                      >
                        <template #placeholder>
                          <div class="image-skeleton">
                            <el-icon class="image-spinner"><Loading /></el-icon>
                          </div>
                        </template>
                        <template #error>
                          <div class="image-error">
                            <el-icon :size="24"><Picture /></el-icon>
                            <span>加载失败</span>
                          </div>
                        </template>
                      </el-image>
                      <div v-else class="photo-placeholder">
                        <el-icon :size="40"><Picture /></el-icon>
                        <span>无照片</span>
                      </div>
                      <div class="gallery-card-overlay">
                        <el-button type="primary" size="small" @click="openDetail(item)"
                          >查看详情</el-button
                        >
                        <el-button
                          type="success"
                          size="small"
                          @click.stop="handleDownloadPhoto(item)"
                          :disabled="downloading"
                        >
                          <el-icon><Download /></el-icon>
                          下载
                        </el-button>
                        <el-button type="danger" size="small" @click="handleDelete(item)"
                          >删除</el-button
                        >
                      </div>
                    </div>
                    <div class="gallery-card-checkbox">
                      <el-checkbox
                        :model-value="isPhotoSelected(item)"
                        @change="togglePhotoSelection(item)"
                        @click.stop
                      />
                    </div>
                    <div class="gallery-card-content">
                      <div class="gallery-card-title" :title="item.title || '无标题'">
                        {{ item.title || '无标题' }}
                      </div>
                      <div class="gallery-card-meta">
                        <span class="gallery-meta-item" v-if="item.term_name">
                          <el-icon><Calendar /></el-icon>
                          {{ item.term_name }}
                        </span>
                        <span class="gallery-meta-item" v-if="item.uploaded_at">
                          <el-icon><Clock /></el-icon>
                          {{ dateUtil.formatDate(item.uploaded_at) }}
                        </span>
                      </div>
                      <div
                        class="gallery-card-description"
                        v-if="item.description"
                        :title="item.description"
                      >
                        {{ item.description }}
                      </div>
                    </div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
            <el-empty
              v-if="filteredGroupedByActivity.length === 0"
              description="暂无照片"
              :image-size="120"
            />
          </div>
          <el-empty
            v-else-if="viewMode === 'list' && paginatedData.length === 0"
            description="暂无照片"
            :image-size="120"
          />
        </div>

        <div class="pagination-container" v-if="viewMode === 'list'">
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
        title="照片详情与编辑"
        size="680px"
        :with-header="true"
        class="gallery-detail-drawer"
      >
        <el-form :model="detailForm" label-width="100px" class="detail-form">
          <el-form-item label="图片预览">
            <el-image
              v-if="detailForm.image_url"
              :preview-teleported="true"
              :src="detailForm.image_url"
              :preview-src-list="[detailForm.image_url]"
              :lazy="true"
              style="width: 220px; height: 138px"
              fit="cover"
            >
              <template #placeholder>
                <div class="image-skeleton small">
                  <el-icon class="image-spinner"><Loading /></el-icon>
                </div>
              </template>
              <template #error>
                <div class="image-error">
                  <el-icon :size="24"><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
            <span v-else>无图片</span>
          </el-form-item>
          <!-- 不再手动维护图片 URL，仅展示预览和 key -->
          <el-form-item label="图片 Key">
            <el-input v-model="detailForm.image_key" placeholder="OSS 存储 key（需与后台一致）" />
          </el-form-item>
          <el-form-item label="届次">
            <el-input v-model="detailForm.term_name" disabled />
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="detailForm.title" placeholder="照片标题（可选）" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="detailForm.description"
              type="textarea"
              :rows="3"
              placeholder="照片描述（可选）"
            />
          </el-form-item>
          <el-form-item label="排序值">
            <el-input-number
              v-model="detailForm.sort_order"
              :min="0"
              :step="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>

        <el-descriptions border :column="1" class="detail-meta" title="其他信息">
          <el-descriptions-item label="上传时间">
            {{ dateUtil.format(detailForm.uploaded_at) || '--' }}
          </el-descriptions-item>
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

    <!-- 新增/编辑照片对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.photo_id ? '编辑照片' : '新增照片'"
      :close-on-click-modal="false"
      class="gallery-edit-dialog admin-modal-large"
      @closed="resetEditForm"
    >
      <el-form :model="editForm" label-width="96px" class="edit-form">
        <el-form-item label="照片图片">
          <div class="image-upload">
            <el-upload
              class="image-upload-btn"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/png,image/jpeg,image/webp"
              :disabled="imageUploading"
              @change="handleImageChange"
            >
              <el-button :loading="imageUploading">上传照片</el-button>
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
          <el-input v-model="editForm.image_key" placeholder="OSS 存储 key（上传后自动填充）" />
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
        <el-form-item label="活动">
          <el-select
            v-model="editForm.activity_id"
            placeholder="选填，关联具体活动"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="activity in activities"
              :key="activity.activity_id"
              :label="activity.activity_name"
              :value="activity.activity_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="editForm.title" placeholder="照片标题（可选）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="照片描述（可选）"
          />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="editForm.sort_order" :min="0" :step="1" style="width: 100%" />
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
import {
  Search,
  Refresh,
  Plus,
  Picture,
  Calendar,
  Clock,
  Folder,
  Download,
  Loading,
} from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { galleryPhotoApi } from '@/utils/api'
import type {
  GalleryPhotoInfo,
  CreateGalleryPhotoParams,
  UpdateGalleryPhotoParams,
  TeamTermInfo,
  ActivityInfo,
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
const tableData = ref<GalleryPhotoInfo[]>([])
const teamTerms = ref<TeamTermInfo[]>([])
const activities = ref<ActivityInfo[]>([])
const viewMode = ref<'list' | 'group'>('list')
const imageUploading = ref(false)
const imageProgress = ref(0)
const imageMimeTypes = ['image/png', 'image/jpeg', 'image/webp']
const selectedPhotos = ref<GalleryPhotoInfo[]>([])
const downloading = ref(false)

// 分组视图相关
const activitySearchKeyword = ref('')
const activeCollapseGroups = ref<(number | string)[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const handleBack = () => {
  router.push('/admin/dashboard')
}

const buildImagePreviewUrl = async (
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
    console.error('生成相册图片预览链接失败:', error)
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
  photo_id: 0,
  image_url: '',
  image_key: '',
  term_id: null as number | null,
  term_name: '',
  activity_id: null as number | null,
  title: '',
  description: '',
  sort_order: null as number | null,
  uploaded_at: '',
})

const resetDetailForm = () => {
  detailForm.photo_id = 0
  detailForm.image_url = ''
  detailForm.image_key = ''
  detailForm.term_id = null
  detailForm.term_name = ''
  detailForm.activity_id = null
  detailForm.title = ''
  detailForm.description = ''
  detailForm.sort_order = null
  detailForm.uploaded_at = ''
}

const openDetail = async (row: GalleryPhotoInfo) => {
  detailVisible.value = true
  detailForm.photo_id = row.photo_id
  detailForm.image_key = row.image_key || ''
  if (detailForm.image_key) {
    if (imageUrlMap.has(detailForm.image_key)) {
      detailForm.image_url = imageUrlMap.get(detailForm.image_key) || ''
    } else {
      detailForm.image_url = await buildImagePreviewUrl(detailForm.image_key, '')
      if (detailForm.image_url) {
        imageUrlMap.set(detailForm.image_key, detailForm.image_url)
      }
    }
  } else {
    detailForm.image_url = ''
  }
  detailForm.term_id = row.term_id ?? null
  detailForm.term_name = row.term_name || ''
  detailForm.activity_id = row.activity_id ?? null
  detailForm.title = row.title || ''
  detailForm.description = row.description || ''
  detailForm.sort_order = row.sort_order ?? null
  detailForm.uploaded_at = row.uploaded_at || ''
}

// 保存详情
const handleDetailSave = async () => {
  if (!detailForm.photo_id) return
  detailSaving.value = true
  try {
    const payload: UpdateGalleryPhotoParams = {
      term_id: detailForm.term_id ?? undefined,
      activity_id: detailForm.activity_id ?? undefined,
      title: detailForm.title || undefined,
      description: detailForm.description || undefined,
      // 只向后端提交 image_key，URL 在前端按需生成
      image_key: detailForm.image_key || undefined,
      sort_order: detailForm.sort_order ?? undefined,
    }
    await galleryPhotoApi.update(detailForm.photo_id, payload)
    ElMessage.success('照片信息已更新')
    detailVisible.value = false
    resetDetailForm()
    await loadData()
  } catch (error) {
    console.error('更新照片信息失败:', error)
    ElMessage.error('保存失败')
  } finally {
    detailSaving.value = false
  }
}

const handleDelete = (row: GalleryPhotoInfo) => {
  ElMessageBox.confirm('确定要删除该照片吗？', '提示', {
    type: 'warning',
  })
    .then(async () => {
      try {
        await galleryPhotoApi.delete(row.photo_id)
        ElMessage.success('删除成功')
        await loadData()
      } catch (error) {
        console.error('删除照片失败:', error)
      }
    })
    .catch(() => {})
}

// 图片URL缓存（响应式）
const imageUrlMap = reactive<Map<string, string>>(new Map())

// 获取图片URL（从image_key生成）
const getImageUrl = (photo: GalleryPhotoInfo): string => {
  if (!photo.image_key) return ''
  const cached = imageUrlMap.get(photo.image_key)
  if (cached) return cached
  // 异步生成URL并更新响应式Map
  buildImagePreviewUrl(photo.image_key, '')
    .then((url) => {
      if (url) {
        imageUrlMap.set(photo.image_key!, url)
      }
    })
    .catch((error) => {
      console.error('生成图片URL失败:', error)
    })
  return ''
}

// 下载单张照片
const handleDownloadPhoto = async (photo: GalleryPhotoInfo) => {
  if (!photo.image_key) {
    ElMessage.warning('该照片没有可下载的图片')
    return
  }
  downloading.value = true
  try {
    let downloadUrl = imageUrlMap.get(photo.image_key) || ''
    if (!downloadUrl) {
      downloadUrl = await buildImagePreviewUrl(photo.image_key, '')
      if (downloadUrl) {
        imageUrlMap.set(photo.image_key, downloadUrl)
      }
    }
    if (!downloadUrl) {
      ElMessage.error('无法获取下载链接')
      return
    }
    // 创建下载链接
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = photo.title || `photo_${photo.photo_id}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('下载开始')
  } catch (error) {
    console.error('下载照片失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  } finally {
    downloading.value = false
  }
}

// 批量下载照片
const handleBatchDownload = async () => {
  if (selectedPhotos.value.length === 0) {
    ElMessage.warning('请先选择要下载的照片')
    return
  }
  downloading.value = true
  try {
    const photosToDownload = selectedPhotos.value.filter((p) => p.image_key)
    if (photosToDownload.length === 0) {
      ElMessage.warning('选中的照片中没有可下载的图片')
      downloading.value = false
      return
    }
    // 逐个下载，添加延迟避免浏览器阻止
    for (let i = 0; i < photosToDownload.length; i++) {
      const photo = photosToDownload[i]
      if (!photo || !photo.image_key) continue
      let downloadUrl = imageUrlMap.get(photo.image_key) || ''
      if (!downloadUrl) {
        downloadUrl = await buildImagePreviewUrl(photo.image_key, '')
        if (downloadUrl) {
          imageUrlMap.set(photo.image_key, downloadUrl)
        }
      }
      if (downloadUrl) {
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = photo.title || `photo_${photo.photo_id}.jpg`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // 延迟一下，避免浏览器阻止多个下载
        if (i < photosToDownload.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }
    }
    ElMessage.success(`已开始下载 ${photosToDownload.length} 张照片`)
    selectedPhotos.value = []
  } catch (error) {
    console.error('批量下载照片失败:', error)
    ElMessage.error('批量下载失败，请稍后重试')
  } finally {
    downloading.value = false
  }
}

// 检查照片是否被选中
const isPhotoSelected = (photo: GalleryPhotoInfo): boolean => {
  return selectedPhotos.value.some((p) => p.photo_id === photo.photo_id)
}

// 切换照片选中状态
const togglePhotoSelection = (photo: GalleryPhotoInfo) => {
  const index = selectedPhotos.value.findIndex((p) => p.photo_id === photo.photo_id)
  if (index > -1) {
    selectedPhotos.value.splice(index, 1)
  } else {
    selectedPhotos.value.push(photo)
  }
}

const isGroupAllSelected = (group: { photos: GalleryPhotoInfo[] }): boolean => {
  return group.photos.length > 0 && group.photos.every((p) => isPhotoSelected(p))
}

const isGroupIndeterminate = (group: { photos: GalleryPhotoInfo[] }): boolean => {
  const count = group.photos.filter((p) => isPhotoSelected(p)).length
  return count > 0 && count < group.photos.length
}

const toggleGroupSelection = (group: { photos: GalleryPhotoInfo[] }) => {
  const shouldSelectAll = !isGroupAllSelected(group)
  group.photos.forEach((photo) => {
    const selected = isPhotoSelected(photo)
    if (shouldSelectAll && !selected) {
      selectedPhotos.value.push(photo)
    }
    if (!shouldSelectAll && selected) {
      const index = selectedPhotos.value.findIndex((p) => p.photo_id === photo.photo_id)
      if (index > -1) selectedPhotos.value.splice(index, 1)
    }
  })
}

const handleGroupDownload = async (group: { photos: GalleryPhotoInfo[] }) => {
  group.photos.forEach((photo) => {
    if (!isPhotoSelected(photo)) {
      selectedPhotos.value.push(photo)
    }
  })
  await handleBatchDownload()
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
    const photoRes = await galleryPhotoApi.getAll(params)
    if (photoRes.data?.list) {
      const photos = photoRes.data.list
      // 根据 image_key 生成预览 URL，并填充到imageUrlMap
      await Promise.all(
        photos.map(async (item) => {
          if (item.image_key) {
            const url = await buildImagePreviewUrl(item.image_key, '')
            if (url) {
              imageUrlMap.set(item.image_key, url)
            }
          }
        })
      )
      tableData.value = photos
      pagination.total = photoRes.data.pagination.total
    }
  } catch (error) {
    console.error('加载相册列表失败:', error)
    ElMessage.error('加载相册列表失败')
  } finally {
    loading.value = false
  }
}

// 按活动分组
const groupedByActivity = computed(() => {
  const groups = new Map<
    number | null,
    { activity_id: number | null; activity_name: string; photos: GalleryPhotoInfo[] }
  >()

  tableData.value.forEach((photo) => {
    const activityId = photo.activity_id ?? null
    const activityName =
      activities.value.find((a) => a.activity_id === activityId)?.activity_name || '未关联活动'

    if (!groups.has(activityId)) {
      groups.set(activityId, {
        activity_id: activityId,
        activity_name: activityName,
        photos: [],
      })
    }
    groups.get(activityId)!.photos.push(photo)
  })

  return Array.from(groups.values()).sort((a, b) => {
    if (a.activity_id === null) return 1
    if (b.activity_id === null) return -1
    return (b.activity_id || 0) - (a.activity_id || 0)
  })
})

// 过滤后的分组（根据活动名称搜索）
const filteredGroupedByActivity = computed(() => {
  if (!activitySearchKeyword.value.trim()) {
    return groupedByActivity.value
  }
  const keyword = activitySearchKeyword.value.trim().toLowerCase()
  return groupedByActivity.value.filter((group) =>
    group.activity_name.toLowerCase().includes(keyword)
  )
})

// 活动搜索处理
const handleActivitySearch = () => {
  // 如果搜索到结果，自动展开匹配的分组
  if (filteredGroupedByActivity.value.length > 0) {
    activeCollapseGroups.value = filteredGroupedByActivity.value.map(
      (g) => g.activity_id || 'no-activity'
    )
  }
}

// 图片上传处理
const handleImageChange = async (uploadFile: UploadFile) => {
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
    const { url, key } = await uploadToOssWithKey(file, 'uploads/gallery-photos/', (progress) => {
      imageProgress.value = progress
    })
    // 本地预览使用 URL，后端仅存储 key
    editForm.image_url = url
    editForm.image_key = key
    ElMessage.success('照片已上传')
  } catch (error) {
    console.error('上传照片失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    imageUploading.value = false
    imageProgress.value = 0
  }
}

// 新增/编辑对话框
const editDialogVisible = ref(false)
const editSaving = ref(false)

const editForm = reactive<{
  photo_id: number | null
  image_url: string
  image_key: string
  term_id: number | null
  activity_id: number | null
  title: string
  description: string
  sort_order: number | null
}>({
  photo_id: null,
  image_url: '',
  image_key: '',
  term_id: null,
  activity_id: null,
  title: '',
  description: '',
  sort_order: null,
})

const resetEditForm = () => {
  editForm.photo_id = null
  editForm.image_url = ''
  editForm.image_key = ''
  editForm.term_id = null
  editForm.activity_id = null
  editForm.title = ''
  editForm.description = ''
  editForm.sort_order = null
}

const openEditDialog = async (row?: GalleryPhotoInfo) => {
  if (row) {
    editForm.photo_id = row.photo_id
    editForm.image_key = row.image_key
    if (row.image_key) {
      if (imageUrlMap.has(row.image_key)) {
        editForm.image_url = imageUrlMap.get(row.image_key) || ''
      } else {
        editForm.image_url = await buildImagePreviewUrl(row.image_key, '')
        if (editForm.image_url) {
          imageUrlMap.set(row.image_key, editForm.image_url)
        }
      }
    } else {
      editForm.image_url = ''
    }
    editForm.term_id = row.term_id ?? null
    editForm.activity_id = row.activity_id ?? null
    editForm.title = row.title || ''
    editForm.description = row.description || ''
    editForm.sort_order = row.sort_order ?? null
  } else {
    resetEditForm()
  }
  editDialogVisible.value = true
}

const buildCreatePayload = (): CreateGalleryPhotoParams => {
  const payload: CreateGalleryPhotoParams = {
    // 后端只关心 image_key
    image_key: editForm.image_key.trim(),
  }
  if (editForm.term_id != null) payload.term_id = editForm.term_id
  if (editForm.activity_id != null) payload.activity_id = editForm.activity_id
  if (editForm.title) payload.title = editForm.title
  if (editForm.description) payload.description = editForm.description
  if (editForm.sort_order != null) payload.sort_order = editForm.sort_order
  return payload
}

const buildUpdatePayload = (): UpdateGalleryPhotoParams => {
  const payload: UpdateGalleryPhotoParams = {}
  if (editForm.term_id != null) payload.term_id = editForm.term_id
  if (editForm.activity_id != null) payload.activity_id = editForm.activity_id
  if (editForm.title) payload.title = editForm.title
  if (editForm.description) payload.description = editForm.description
  // 只向后端提交 image_key
  if (editForm.image_key) payload.image_key = editForm.image_key.trim()
  if (editForm.sort_order != null) payload.sort_order = editForm.sort_order
  return payload
}

const handleEditSave = async () => {
  if (!editForm.image_key?.trim()) {
    ElMessage.warning('请上传照片或填写图片 Key')
    return
  }
  editSaving.value = true
  try {
    if (editForm.photo_id) {
      const payload = buildUpdatePayload()
      await galleryPhotoApi.update(editForm.photo_id, payload)
      ElMessage.success('照片信息已更新')
    } else {
      const payload = buildCreatePayload()
      await galleryPhotoApi.create(payload)
      ElMessage.success('照片已创建')
    }
    editDialogVisible.value = false
    resetEditForm()
    await loadData()
  } catch (error) {
    console.error('保存照片失败:', error)
  } finally {
    editSaving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.gallery-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.gallery-management {
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

.search-select {
  width: 160px !important;
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

.gallery-wrapper {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.gallery-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.gallery-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.gallery-card-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f7fa;
}

.photo-image {
  width: 100%;
  height: 100%;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 8px;
}

.gallery-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.gallery-card:hover .gallery-card-overlay {
  opacity: 1;
  pointer-events: auto;
}

.gallery-card-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gallery-card-content {
  padding: 12px;
}

.gallery-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.gallery-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.gallery-card-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.gallery-group-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-search-bar {
  margin-bottom: 8px;
}

.activity-collapse {
  border: none;
}

.activity-group-item {
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.activity-group-item :deep(.el-collapse-item__header) {
  background-color: #f5f7fa;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.activity-group-item :deep(.el-collapse-item__content) {
  padding: 16px;
  background-color: #fff;
}

.activity-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.group-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-group-title {
  flex: 1;
}

.activity-group-count {
  color: #909399;
  font-size: 14px;
  font-weight: normal;
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
  height: 138px;
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

.image-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-upload-preview {
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

.gallery-edit-dialog :deep(.el-dialog__body) {
  max-height: calc(80vh - 120px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.gallery-edit-dialog .edit-form {
  flex: 1;
  overflow: auto;
  padding-right: 4px;
}

.gallery-detail-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gallery-detail-drawer :deep(.el-descriptions) {
  margin-bottom: 0;
}

.gallery-detail-drawer :deep(.el-descriptions__body) {
  --el-descriptions-item-bordered-label-width: 110px;
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
