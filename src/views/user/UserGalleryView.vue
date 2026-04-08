<template>
  <div class="gallery">
    <el-card shadow="hover" class="gallery-card">
      <template #header>
        <div class="card-header">
          <div>
            <span>团队相册</span>
            <p class="subtitle">展示公开相册图片（只读）</p>
          </div>
          <div class="filters">
            <el-select
              v-model="activeTerm"
              placeholder="选择届次"
              size="small"
              style="width: 200px"
              @change="loadPhotos"
            >
              <el-option
                v-for="term in termOptions"
                :key="term.term_id"
                :label="term.term_name"
                :value="term.term_id"
              />
            </el-select>
            <el-button type="primary" size="small" @click="loadPhotos" :loading="loading">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-empty v-if="!photos.length && !loading" description="暂无相册图片" :image-size="120" />

      <el-skeleton v-else :loading="loading" :rows="4" animated>
        <div class="gallery-grid">
          <div v-for="item in photos" :key="item.photo_id" class="gallery-card">
            <div class="gallery-card-image">
              <el-image
                v-if="imageMap[item.image_key]"
                :src="imageMap[item.image_key]"
                :preview-src-list="previewList"
                :initial-index="getPreviewIndex(item.image_key)"
                :lazy="true"
                fit="cover"
                class="photo-image"
              >
                <template #placeholder>
                  <div class="image-skeleton"></div>
                </template>
                <template #error>
                  <div class="image-error">加载失败</div>
                </template>
              </el-image>
              <div v-else class="photo-placeholder">暂无图片</div>
              <div class="gallery-card-actions" v-if="imageMap[item.image_key]">
                <el-button type="primary" size="small" @click.stop="handleDownload(item)">
                  下载
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-skeleton>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { galleryPhotoApi, teamTermApi } from '@/utils/api'
import type { GalleryPhotoInfo, TeamTermInfo } from '@/utils/api/types'
import { getSignedOssUrl } from '@/utils/oss'
import { message } from '@/utils/message'

const termOptions = ref<TeamTermInfo[]>([])
const activeTerm = ref<number | null>(null)
const photos = ref<GalleryPhotoInfo[]>([])
const imageMap = ref<Record<string, string>>({})
const loading = ref(false)

const previewList = computed<string[]>(() =>
  photos.value
    .map((item) => imageMap.value[item.image_key])
    .filter((url): url is string => Boolean(url))
)

const getPreviewIndex = (key: string) => {
  const url = imageMap.value[key]
  return previewList.value.findIndex((item) => item === url)
}

const loadTerms = async () => {
  try {
    const res = await teamTermApi.getAll()
    termOptions.value = res.data?.list || []
    if (!activeTerm.value && termOptions.value.length) {
      const current = termOptions.value.find((term) => term.is_current)
      activeTerm.value = current?.term_id ?? termOptions.value[0]?.term_id ?? null
    }
  } catch (error) {
    console.error('加载届次失败:', error)
    message.error('加载届次失败')
  }
}

const loadPhotos = async () => {
  if (!activeTerm.value) return
  loading.value = true
  try {
    const res = await galleryPhotoApi.getByTerm(activeTerm.value)
    photos.value = res.data?.list || []
    const map: Record<string, string> = {}
    await Promise.all(
      photos.value.map(async (item) => {
        if (item.image_key) {
          try {
            map[item.image_key] = await getSignedOssUrl(item.image_key, {
              expiresInSeconds: 60 * 30,
              disposition: 'inline',
            })
          } catch (error) {
            console.error('生成图片链接失败:', error)
          }
        }
      })
    )
    imageMap.value = map
  } catch (error) {
    console.error('加载相册失败:', error)
    message.error('加载相册失败')
  } finally {
    loading.value = false
  }
}

const handleDownload = (item: GalleryPhotoInfo) => {
  const url = imageMap.value[item.image_key]
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = item.title ? `${item.title}.jpg` : `photo-${item.photo_id}.jpg`
  link.click()
}

const init = async () => {
  await loadTerms()
  await loadPhotos()
}

init()
</script>

<style scoped>
.gallery {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 16px;
}

.gallery-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.gallery-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.subtitle {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  flex: 1;
  overflow: auto;
  align-content: flex-start;
}

.gallery-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  height: 260px;
}

.gallery-card-image {
  width: 100%;
  height: 260px;
  position: relative;
  background: #f8fafc;
}

.photo-image {
  width: 100%;
  height: 100%;
}

.gallery-card-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 8px;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
}


.image-skeleton {
  width: 100%;
  height: 160px;
  background: #f1f5f9;
  border-radius: 8px;
}

.image-error {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 8px;
}
</style>
