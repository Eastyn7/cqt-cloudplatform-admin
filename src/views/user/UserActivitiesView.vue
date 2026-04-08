<template>
  <div class="user-activities">
    <el-card shadow="hover" class="activity-card">
      <template #header>
        <div class="card-header">
          <span>活动报名</span>
          <div class="filters">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索活动名称"
              clearable
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <el-select v-model="category" placeholder="活动类别" clearable class="filter-select">
              <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
            </el-select>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-switch
              v-model="recommendOnly"
              inline-prompt
              active-text="仅看推荐"
              inactive-text="全部活动"
            />
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="activity-tabs">
        <el-tab-pane label="活动广场" name="all">
          <div class="activity-list-header">
            <div class="activity-list-title-row">
              <div class="activity-list-title">当前进行中的活动</div>
              <div class="activity-list-note">
                <el-tag type="warning" effect="dark" size="small">推荐</el-tag>
                <span>带“推荐”标签的活动即为推荐活动，已自动置顶</span>
                <span v-if="recommendedInCurrentCount > 0">（当前页 {{ recommendedInCurrentCount }} 条）</span>
              </div>
            </div>
          </div>

          <div class="activity-grid-wrapper" v-loading="loading">
            <el-empty
              v-if="!displayActivityCards.length"
              :description="showRecommendOnlyEffect ? '暂无推荐活动' : '暂无可报名活动'"
            />
            <div v-else class="activity-grid">
              <div
                v-for="item in displayActivityCards"
                :key="item.activity_id"
                class="activity-grid-card"
                :class="{ 'is-recommended-card': isRecommended(item.activity_id) }"
              >
                <div class="activity-cover" @click="showActivityDetail(item)">
                  <div v-if="isRecommended(item.activity_id)" class="recommended-ribbon">⭐ 推荐活动</div>
                  <el-image
                    v-if="getActivityCoverUrl(item)"
                    :src="getActivityCoverUrl(item)"
                    fit="cover"
                    class="activity-cover-image"
                  />
                  <div v-else class="activity-cover-empty">暂无封面</div>
                  <div class="cover-tags">
                    <el-tag v-if="isRecommended(item.activity_id)" type="warning" effect="dark" size="small">推荐</el-tag>
                    <el-tag v-if="isJoined(item.activity_id)" type="success" size="small">已报名</el-tag>
                  </div>
                </div>

                <div class="activity-content">
                  <div class="activity-name-row">
                    <el-button link type="primary" class="activity-name-btn" @click="showActivityDetail(item)">
                      {{ item.activity_name }}
                    </el-button>
                    <div class="activity-title-tags">
                      <el-tag v-if="isRecommended(item.activity_id)" type="warning" effect="dark" size="small">推荐</el-tag>
                      <el-tag :type="statusTagType[item.status] || 'info'" size="small">{{ item.status || '-' }}</el-tag>
                    </div>
                  </div>

                  <div class="activity-meta-row">
                    <span>{{ item.category || '未分类' }}</span>
                    <span>{{ item.location || '地点待定' }}</span>
                    <span>{{ item.service_hours ?? '--' }}h</span>
                    <span>招募：{{ item.recruitment_limit ?? '--' }}人</span>
                  </div>
                  <div class="activity-time-row">
                    <span>报名：{{ formatDateTime(item.signup_start_time) }} ~ {{ formatDateTime(item.signup_end_time) }}</span>
                  </div>
                  <div class="activity-time-row">
                    <span>活动：{{ formatDateTime(item.start_time) }} ~ {{ formatDateTime(item.end_time) }}</span>
                  </div>

                  <div class="activity-desc">
                    {{ item.description || '暂无活动描述' }}
                  </div>

                  <div class="activity-actions">
                    <el-button link type="primary" @click="showActivityDetail(item)">查看详情</el-button>
                    <el-button
                      type="primary"
                      size="small"
                      :disabled="item.status === '已结束' || isSignupClosed(item) || isJoined(item.activity_id)"
                      @click="handleJoin(item)"
                    >
                      {{
                        item.status === '已结束'
                          ? '已结束'
                          : isSignupClosed(item)
                            ? '报名已截止'
                            : isJoined(item.activity_id)
                              ? '已报名'
                              : '立即报名'
                      }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="loadActivities"
              @size-change="handleSizeChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的报名" name="mine">
          <div class="table-wrapper">
            <el-table :data="myRecords" v-loading="myLoading" border stripe>
              <el-table-column prop="activity_name" label="活动名称" min-width="200" />
              <el-table-column prop="category" label="类别" width="120" />
              <el-table-column label="开始时间" width="170">
                <template #default="{ row }">
                  <span>{{ formatDateTime(row.start_time) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="结束时间" width="170">
                <template #default="{ row }">
                  <span>{{ formatDateTime(row.end_time) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="service_hours" label="时长" width="90" />
              <el-table-column prop="status" label="报名状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="recordStatusTag[row.status || ''] || 'info'">
                    {{ row.status || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" fixed="right">
                <template #default="{ row }">
                  <el-button type="danger" link @click="handleCancel(row)">取消报名</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="pagination">
            <el-pagination
              v-model:current-page="myPagination.page"
              v-model:page-size="myPagination.pageSize"
              :total="myPagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="loadMyRecords"
              @size-change="handleMySizeChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-drawer
      v-model="detailVisible"
      title="活动详情"
      size="760px"
      :with-header="true"
      destroy-on-close
    >
      <el-descriptions border :column="1" :label-width="120" v-if="currentActivity" class="activity-detail-descriptions">
        <el-descriptions-item label="活动名称">{{ currentActivity.activity_name }}</el-descriptions-item>
        <el-descriptions-item label="活动封面">
          <el-image
            v-if="getActivityCoverUrl(currentActivity)"
            :src="getActivityCoverUrl(currentActivity)"
            fit="cover"
            style="width: 100%; max-width: 320px; border-radius: 8px"
            :preview-src-list="[getActivityCoverUrl(currentActivity)]"
            :preview-teleported="true"
          />
          <span v-else>暂无封面</span>
        </el-descriptions-item>
        <el-descriptions-item label="活动类别">{{ currentActivity.category || '--' }}</el-descriptions-item>
        <el-descriptions-item label="活动地点">{{ currentActivity.location || '--' }}</el-descriptions-item>
        <el-descriptions-item label="活动描述">
          <div class="activity-description">{{ getActivityDescription(currentActivity) }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="报名开始">{{ formatDateTime(currentActivity.signup_start_time) }}</el-descriptions-item>
        <el-descriptions-item label="报名截止">{{ formatDateTime(currentActivity.signup_end_time) }}</el-descriptions-item>
        <el-descriptions-item label="活动开始">{{ formatDateTime(currentActivity.start_time) }}</el-descriptions-item>
        <el-descriptions-item label="活动结束">{{ formatDateTime(currentActivity.end_time) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentActivityStatus" label="活动状态">
          <el-tag :type="statusTagType[currentActivityStatus] || 'info'">
            {{ currentActivityStatus || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标招募人数">
          {{ getRecruitmentLimit(currentActivity) ?? '--' }} 人
        </el-descriptions-item>
        <el-descriptions-item label="服务时长">{{ currentActivity.service_hours ?? '--' }}h</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button
            v-if="currentActivity && currentActivityStatus !== '已结束'"
            type="primary"
            :disabled="isAlreadyJoined || isSignupClosed(currentActivity)"
            @click="handleJoinCurrentActivity"
          >
            {{ isAlreadyJoined ? '已报名' : isSignupClosed(currentActivity) ? '报名已截止' : '立即报名' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { activityPublicApi, activityParticipantApi, recommendationsApi } from '@/utils/api'
import type { ActivityInfo, RecommendationItem, StudentActivityRecord } from '@/utils/api/types'
import { message } from '@/utils/message'
import { useDate } from '@/utils/date'
import { getSignedOssUrl } from '@/utils/oss'

const searchKeyword = ref('')
const category = ref<string | undefined>(undefined)
const categories = ref<string[]>([])
const loading = ref(false)
const myLoading = ref(false)
const recommendLoading = ref(false)
const activeTab = ref<'all' | 'mine'>('all')
const recommendOnly = ref(false)
const detailVisible = ref(false)
const currentActivity = ref<ActivityInfo | RecommendationItem | null>(null)

const activities = ref<ActivityInfo[]>([])
const myRecords = ref<StudentActivityRecord[]>([])
const recommendations = ref<RecommendationItem[]>([])
const coverUrlMap = ref<Record<string, string>>({})

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const myPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const statusTagType: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  草稿: 'info',
  进行中: 'success',
  已结束: 'warning',
}

const dateUtil = useDate
const RECOMMEND_CACHE_MS = 60 * 1000
let lastRecommendFetchedAt = 0

const formatDateTime = (value?: string | null) => (value ? dateUtil.formatTime(value) : '--')

const isSignupClosed = (activity: ActivityInfo | RecommendationItem | null): boolean => {
  if (!activity?.signup_end_time) return false
  const deadline = dateUtil.toDayjs(activity.signup_end_time)
  const now = dateUtil.toDayjs(new Date())
  if (!deadline || !now) return false
  return now.isAfter(deadline)
}

const recommendedActivityIdSet = computed(
  () => new Set(recommendations.value.map((item) => item.activity_id))
)

const recommendationScoreMap = computed(() => {
  const scoreMap = new Map<number, number>()
  recommendations.value.forEach((item) => {
    scoreMap.set(item.activity_id, item.score || 0)
  })
  return scoreMap
})

const isRecommended = (activityId: number) => recommendedActivityIdSet.value.has(activityId)

const recommendedInCurrentCount = computed(() =>
  displayActivityCards.value.filter((item) => isRecommended(item.activity_id)).length
)

const showRecommendOnlyEffect = computed(() => recommendOnly.value)

const resolveActivityTimePriority = (activity: ActivityInfo): number => {
  const start = activity.start_time ? new Date(activity.start_time).getTime() : Number.POSITIVE_INFINITY
  const signupEnd = activity.signup_end_time
    ? new Date(activity.signup_end_time).getTime()
    : Number.POSITIVE_INFINITY
  const value = Number.isFinite(start) ? start : signupEnd
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY
}

const displayActivityCards = computed(() => {
  const list = [...displayActivities.value]
  list.sort((left, right) => {
    const leftJoined = myRecords.value.some((record) => record.activity_id === left.activity_id) ? 1 : 0
    const rightJoined = myRecords.value.some((record) => record.activity_id === right.activity_id) ? 1 : 0
    return leftJoined - rightJoined
  })
  return list
})

const displayActivities = computed(() => {
  const list = [...activities.value]
  const idSet = recommendedActivityIdSet.value
  const scoreMap = recommendationScoreMap.value
  list.sort((left, right) => {
    const leftTime = resolveActivityTimePriority(left)
    const rightTime = resolveActivityTimePriority(right)
    if (leftTime !== rightTime) {
      return leftTime - rightTime
    }
    const leftPriority = idSet.has(left.activity_id) ? 1 : 0
    const rightPriority = idSet.has(right.activity_id) ? 1 : 0
    if (rightPriority !== leftPriority) {
      return rightPriority - leftPriority
    }
    const leftScore = scoreMap.get(left.activity_id) || 0
    const rightScore = scoreMap.get(right.activity_id) || 0
    return rightScore - leftScore
  })
  return showRecommendOnlyEffect.value
    ? list.filter((item) => idSet.has(item.activity_id))
    : list
})

const recordStatusTag: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  已报名: 'info',
  已通过: 'success',
  已拒绝: 'danger',
  已取消: 'warning',
}

const hasActivityStatus = (
  activity: ActivityInfo | RecommendationItem | null
): activity is ActivityInfo => {
  return !!activity && 'status' in activity
}

const currentActivityStatus = computed(() => {
  if (!currentActivity.value) return ''
  return hasActivityStatus(currentActivity.value) ? currentActivity.value.status || '' : ''
})

const isAlreadyJoined = computed(() => {
  if (!currentActivity.value) return false
  return myRecords.value.some(
    (record) => record.activity_id === currentActivity.value?.activity_id
  )
})

const loadCategories = async () => {
  try {
    const res = await activityPublicApi.getCategories()
    if (res.data?.list) {
      categories.value = res.data.list
    }
  } catch (error) {
    console.error('加载活动类别失败:', error)
  }
}

const loadActivities = async () => {
  loading.value = true
  try {
    const res = await activityPublicApi.getPage({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value || undefined,
      status: '进行中',
      category: category.value || undefined,
    })
    if (res.data?.list) {
      activities.value = res.data.list
      pagination.total = res.data.pagination.total
      const nextMap: Record<string, string> = {}
      await Promise.all(
        activities.value.map(async (item) => {
          if (item.cover_key) {
            try {
              nextMap[item.cover_key] = await getSignedOssUrl(item.cover_key, {
                expiresInSeconds: 60 * 30,
                disposition: 'inline',
              })
            } catch {
              nextMap[item.cover_key] = ''
            }
          }
        })
      )
      coverUrlMap.value = nextMap
    } else {
      activities.value = []
      pagination.total = 0
      coverUrlMap.value = {}
    }
  } catch (error) {
    console.error('加载活动列表失败:', error)
  } finally {
    loading.value = false
  }
}

const normalizeReasons = (reasons: unknown): string[] => {
  if (Array.isArray(reasons)) {
    return reasons.filter((item): item is string => typeof item === 'string' && item.length > 0)
  }
  if (typeof reasons === 'string') {
    const text = reasons.trim()
    if (!text) return []
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
      }
    } catch {
      return [text]
    }
  }
  return []
}

const loadRecommendations = async (force = false) => {
  const now = Date.now()
  if (!force && now - lastRecommendFetchedAt < RECOMMEND_CACHE_MS) return

  recommendLoading.value = true
  try {
    const res = await recommendationsApi.getMine({ limit: 8 })
    const list = res.data?.list || []
    recommendations.value = list.map((item) => ({
      ...item,
      reasons: normalizeReasons(item.reasons),
    }))
    lastRecommendFetchedAt = now
  } catch {
    recommendations.value = []
  } finally {
    recommendLoading.value = false
  }
}

const refreshRecommendationsThenLoad = async () => {
  const studentId = localStorage.getItem('student_id') || ''
  if (!studentId) {
    await loadRecommendations(true)
    return
  }
  try {
    await recommendationsApi.refresh(
      {
        student_id: studentId,
        limit: 8,
      },
      {
        showSuccess: false,
        showError: false,
      }
    )
  } catch {
  }
  await loadRecommendations(true)
}

const loadMyRecords = async () => {
  const studentId = localStorage.getItem('student_id') || ''
  if (!studentId) return
  myLoading.value = true
  try {
    const res = await activityParticipantApi.getStudentRecordsPage(studentId, {
      page: myPagination.page,
      pageSize: myPagination.pageSize,
    })
    if (res.data?.list) {
      myRecords.value = res.data.list
      myPagination.total = res.data.pagination.total
    }
  } catch (error) {
    console.error('加载我的报名失败:', error)
  } finally {
    myLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadActivities()
}

const handleReset = () => {
  searchKeyword.value = ''
  category.value = undefined
  recommendOnly.value = false
  pagination.page = 1
  loadActivities()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadActivities()
}

const handleMySizeChange = (size: number) => {
  myPagination.pageSize = size
  myPagination.page = 1
  loadMyRecords()
}

const handleJoin = async (row: ActivityInfo) => {
  const studentId = localStorage.getItem('student_id') || ''
  if (!studentId) {
    message.warning('请先完善学号信息')
    return
  }
  if (row.status === '已结束') {
    message.warning('活动已结束，无法报名')
    return
  }
  if (isSignupClosed(row)) {
    message.warning('报名时间已截止，无法报名')
    return
  }
  try {
    await ElMessageBox.confirm('确定报名该活动吗？', '确认报名', {
      type: 'warning',
      confirmButtonText: '确认报名',
      cancelButtonText: '取消',
    })
    await activityParticipantApi.join({
      activity_id: row.activity_id,
      student_id: studentId,
    })
    message.success('报名成功')
    loadMyRecords()
    refreshRecommendationsThenLoad()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('报名失败:', error)
    }
  }
}

const handleCancel = async (record: StudentActivityRecord) => {
  const studentId = localStorage.getItem('student_id') || ''
  if (!studentId) return
  try {
    await activityParticipantApi.cancel(record.activity_id, studentId)
    message.success('已取消报名')
    loadMyRecords()
    refreshRecommendationsThenLoad()
  } catch (error) {
    console.error('取消报名失败:', error)
  }
}

const showActivityDetail = (activity: ActivityInfo | RecommendationItem) => {
  currentActivity.value = activity
  detailVisible.value = true
}

const getActivityCoverUrl = (activity: ActivityInfo | RecommendationItem): string => {
  if ('cover_key' in activity && activity.cover_key) {
    return coverUrlMap.value[activity.cover_key] || ''
  }
  return ''
}

const getActivityDescription = (activity: ActivityInfo | RecommendationItem | null): string => {
  if (!activity) return '暂无活动描述'
  if ('description' in activity && activity.description) {
    return activity.description
  }
  return '暂无活动描述'
}

const getRecruitmentLimit = (activity: ActivityInfo | RecommendationItem | null): number | null => {
  if (!activity) return null
  return 'recruitment_limit' in activity ? activity.recruitment_limit ?? null : null
}

const isJoined = (activityId: number): boolean => {
  return myRecords.value.some((record) => record.activity_id === activityId)
}

const handleJoinCurrentActivity = async () => {
  if (!currentActivity.value) return
  if (hasActivityStatus(currentActivity.value)) {
    await handleJoin(currentActivity.value)
    return
  }
  const target = activities.value.find((item) => item.activity_id === currentActivity.value?.activity_id)
  if (!target) {
    message.warning('活动详情不完整，请在活动列表中报名')
    return
  }
  await handleJoin(target)
}

watch(activeTab, (tab) => {
  if (tab === 'mine') {
    loadMyRecords()
  }
})

onMounted(() => {
  loadCategories()
  loadActivities()
  refreshRecommendationsThenLoad()
})
</script>

<style scoped>
.user-activities {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 20px;
}

.activity-card {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.activity-card :deep(.el-card__body) {
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

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 240px;
}

.filter-select {
  width: 160px;
}

.activity-tabs {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.activity-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
}

.activity-tabs :deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
}

.table-wrapper {
  flex: 1;
  min-height: 320px;
  overflow: auto;
}

.activity-grid-wrapper {
  flex: 1;
  min-height: 320px;
  overflow: auto;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 4px;
}

.activity-grid-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.activity-grid-card.is-recommended-card {
  border-color: #f0b44c;
  box-shadow: 0 2px 12px rgba(240, 180, 76, 0.25);
}

.activity-cover {
  position: relative;
  height: 180px;
  cursor: pointer;
  background: #f5f7fa;
}

.recommended-ribbon {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 2;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 999px;
  color: #7a3e00;
  background: linear-gradient(135deg, #ffe2a8, #ffc566);
}

.activity-cover-image {
  width: 100%;
  height: 100%;
}

.activity-cover-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.cover-tags {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
}

.activity-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.activity-list-header {
  margin-bottom: 10px;
}

.activity-list-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.activity-list-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.activity-list-note {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px 10px;
  border-radius: 8px;
  background: #fff9ec;
  color: #8a5a00;
  font-size: 12px;
}

.activity-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.activity-title-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.activity-name-btn {
  font-weight: 600;
  max-width: calc(100% - 80px);
  justify-content: flex-start;
  padding: 0;
}

.activity-meta-row,
.activity-time-row {
  font-size: 12px;
  color: #606266;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.activity-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  height: 36px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommend-card {
  margin-bottom: 12px;
  border-radius: 10px;
}

.recommend-card :deep(.el-card__body) {
  overflow: visible;
}

.recommend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.recommend-header h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.recommend-header p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}

.recommend-count {
  color: #e6a23c;
}

.recommend-name-list {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recommend-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  min-height: 80px;
}

.recommend-item {
  border: 1px solid #edf2f7;
  border-radius: 10px;
  padding: 12px;
  background: #fafcff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recommend-item:hover {
  background: #f0f7ff;
  border-color: #1989fa;
  box-shadow: 0 2px 12px rgba(25, 137, 250, 0.1);
}

.recommend-item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.recommend-name {
  font-weight: 600;
  color: #303133;
}

.recommend-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.recommend-reasons {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recommend-action {
  margin-top: 10px;
  text-align: right;
}

.activity-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1200px) {
  .recommend-list {
    grid-template-columns: 1fr;
  }

  .activity-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .activity-grid {
    grid-template-columns: 1fr;
  }
}

.table-wrapper :deep(.el-table) {
  height: 100%;
  min-height: 320px;
}

.table-wrapper :deep(.el-table__body-wrapper) {
  overflow: auto;
}

.pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.table-wrapper :deep(.el-table .is-recommended-row) {
  --el-table-tr-bg-color: #fffbf2;
}

.activity-description {
  white-space: pre-wrap;
  word-break: break-word;
  color: #606266;
  line-height: 1.6;
}

.activity-detail-descriptions :deep(.el-descriptions__label) {
  width: 120px;
  min-width: 120px;
  white-space: nowrap;
  vertical-align: top;
}

.activity-detail-descriptions :deep(.el-descriptions__content) {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}
</style>
