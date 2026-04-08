<template>
  <div ref="portraitPageRef" class="portrait-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ pageTitle }}</h2>
        <p class="page-subtitle">多维度展示志愿服务成长轨迹与能力画像</p>
      </div>
      <el-space>
        <el-button v-if="isViewingOthers" @click="goBack">返回</el-button>
        <el-button type="primary" :loading="loading" @click="fetchPortraitData">刷新数据</el-button>
      </el-space>
    </div>

    <el-skeleton :loading="initialLoading" animated :rows="8">
      <template #default>
        <el-result
          v-if="errorMessage"
          icon="error"
          title="画像加载失败"
          :sub-title="errorMessage"
        >
          <template #extra>
            <el-button type="primary" @click="fetchPortraitData">重试</el-button>
          </template>
        </el-result>

        <template v-else-if="portrait">
          <el-alert
            v-if="degradedNotice"
            class="mb-16"
            type="warning"
            :title="degradedNotice"
            show-icon
            :closable="false"
          />

          <el-row :gutter="16" class="mb-16">
            <el-col :xs="24" :lg="10">
              <el-card shadow="hover" class="profile-card card-equal">
                <div class="profile-main">
                  <el-avatar :size="72" :src="avatarUrl">
                    {{ profileNameInitial }}
                  </el-avatar>
                  <div class="profile-meta">
                    <h3>{{ portrait.profile.name || '未命名志愿者' }}</h3>
                    <p>{{ portrait.profile.college || '未填写学院' }} · {{ portrait.profile.major || '未填写专业' }}</p>
                    <div class="tag-list" v-if="portrait.profile.skillTags?.length">
                      <el-tag v-for="tag in portrait.profile.skillTags" :key="tag" size="small">{{ tag }}</el-tag>
                    </div>
                  </div>
                </div>
                <el-divider />
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="学号">{{ portrait.profile.studentId || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="累计时长(h)">{{ portrait.profile.totalHours }}</el-descriptions-item>
                  <el-descriptions-item label="参与活动(次)">{{ portrait.kpi.activityCount }}</el-descriptions-item>
                  <el-descriptions-item label="签到率">{{ attendanceRateText }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>

            <el-col :xs="24" :lg="14">
              <el-row :gutter="16" class="kpi-row">
                <el-col :xs="12" :md="6" v-for="item in kpiCards" :key="item.label" class="mb-16">
                  <el-card shadow="hover" class="kpi-card card-equal">
                    <div class="kpi-card-top">
                      <p class="kpi-label">{{ item.label }}</p>
                      <div class="kpi-icon-wrap">
                        <el-icon :class="['kpi-icon', item.iconClass]"><component :is="item.icon" /></el-icon>
                      </div>
                    </div>
                    <p class="kpi-value">{{ item.value }}</p>
                    <p class="kpi-sub">{{ item.subLabel }}</p>
                  </el-card>
                </el-col>
              </el-row>
              <div class="kpi-divider" />
            </el-col>
          </el-row>

          <el-row :gutter="16" class="mb-16">
            <el-col :xs="24" :lg="12" class="mb-16">
              <el-card shadow="hover" class="chart-card">
                <template #header>
                  <div class="card-title">能力雷达图</div>
                </template>
                <div ref="radarRef" class="chart-container" />
              </el-card>
            </el-col>
            <el-col :xs="24" :lg="12" class="mb-16">
              <el-card shadow="hover" class="chart-card">
                <template #header>
                  <div class="card-title">活动类别占比</div>
                </template>
                <div ref="pieRef" class="chart-container" />
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="hover" class="mb-16 chart-card">
            <template #header>
              <div class="card-title">参与热力图（按参与次数）</div>
            </template>
            <div ref="heatmapRef" class="chart-container heatmap" />
          </el-card>

          <el-card shadow="hover">
            <template #header>
              <div class="card-title">近期参与活动</div>
            </template>
            <el-table :data="portrait.recentActivities" stripe>
              <el-table-column prop="activity_name" label="活动名称" min-width="220" show-overflow-tooltip />
              <el-table-column prop="category" label="类别" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">{{ row.category || '未分类' }}</template>
              </el-table-column>
              <el-table-column prop="start_time" label="开始时间" min-width="180">
                <template #default="{ row }">{{ dateUtil.format(row.start_time) }}</template>
              </el-table-column>
              <el-table-column prop="service_hours" label="服务时长(h)" width="120" align="center">
                <template #default="{ row }">{{ normalizeHours(row.service_hours) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>

        <el-empty v-else description="暂无画像数据" />
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import type { Component } from 'vue'
import { DataLine, Flag, Histogram, TrendCharts } from '@element-plus/icons-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { portraitApi } from '@/utils/api'
import type { UserPortraitData } from '@/utils/api/types'
import { useDate } from '@/utils/date'
import { getSignedOssUrl } from '@/utils/oss'

const route = useRoute()
const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const initialLoading = ref(true)
const errorMessage = ref('')
const portrait = ref<UserPortraitData | null>(null)
const avatarUrl = ref('')

const radarRef = ref<HTMLDivElement>()
const pieRef = ref<HTMLDivElement>()
const heatmapRef = ref<HTMLDivElement>()
const portraitPageRef = ref<HTMLDivElement>()

let radarChart: ECharts | null = null
let pieChart: ECharts | null = null
let heatmapChart: ECharts | null = null
let portraitResizeObserver: ResizeObserver | null = null
const resizeTimerIds: number[] = []

const localStudentId = computed(() => localStorage.getItem('student_id') || '')
const role = computed(() => localStorage.getItem('role') || '')
const queryStudentId = computed(() => {
  const value = route.query.student_id
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] || ''
  return ''
})

const isViewingOthers = computed(
  () => !!queryStudentId.value && queryStudentId.value !== localStudentId.value
)

const pageTitle = computed(() => (isViewingOthers.value ? '志愿者人物画像' : '我的人物画像'))

const profileNameInitial = computed(() => portrait.value?.profile?.name?.charAt(0) || '青')

const attendanceRateText = computed(() => {
  const attendanceRate = portrait.value?.kpi.attendanceRate ?? 0
  return `${Math.round(attendanceRate * 100)}%`
})

const degradeReasonMap: Record<string, string> = {
  DIMENSION_QUERY_FAILED: '维度配置暂不可用，已切换默认展示',
  NO_ENABLED_DIMENSIONS: '暂无启用维度，已切换默认展示',
  INVALID_DIMENSION_CONFIG: '维度配置异常，已切换默认展示',
}

const degradedNotice = computed(() => {
  const meta = portrait.value?.portraitMeta
  if (!meta?.degraded) return ''
  const reason = meta.degradeReason || ''
  return degradeReasonMap[reason] || '当前画像维度不可用，已切换默认展示'
})

interface KpiCardItem {
  label: string
  value: string
  subLabel: string
  icon: Component
  iconClass: string
}

const kpiCards = computed(() => {
  if (!portrait.value) return [] as KpiCardItem[]
  return [
    {
      label: '总服务时长',
      value: `${portrait.value.kpi.totalHours} h`,
      subLabel: '累计服务贡献',
      icon: Histogram,
      iconClass: 'icon-blue',
    },
    {
      label: '累计参与',
      value: `${portrait.value.kpi.activityCount} 次`,
      subLabel: '活动参与总次数',
      icon: Flag,
      iconClass: 'icon-purple',
    },
    {
      label: '签到率',
      value: attendanceRateText.value,
      subLabel: '出勤稳定性表现',
      icon: TrendCharts,
      iconClass: 'icon-green',
    },
    {
      label: '记录时长',
      value: `${portrait.value.kpi.totalRecordsHours} h`,
      subLabel: '记录累计时长',
      icon: DataLine,
      iconClass: 'icon-orange',
    },
  ]
})

const normalizeHours = (value?: number | null) => {
  if (value === undefined || value === null) return '--'
  return Number(value).toFixed(1)
}

const toDateString = (value: unknown): string => {
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear()
      const month = String(parsed.getMonth() + 1).padStart(2, '0')
      const day = String(parsed.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
  return ''
}

const toNumber = (value: unknown): number => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const resolvePortraitErrorMessage = (error: unknown): string => {
  const responseStatus =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined

  if (responseStatus === 401) return '登录状态已过期，请重新登录后重试'
  if (responseStatus === 403) return '无权限查看该画像数据'
  if (responseStatus === 404) return '画像数据不存在'
  if (responseStatus === 400) return '请求参数不合法，请检查后重试'

  const fallbackMessage = error instanceof Error ? error.message : '请稍后重试'

  if (fallbackMessage.includes('无权限')) return '无权限查看该画像数据'
  if (fallbackMessage.includes('未授权') || fallbackMessage.includes('登录')) {
    return '登录状态已过期，请重新登录后重试'
  }
  if (fallbackMessage.includes('不存在')) return '画像数据不存在'
  if (fallbackMessage.includes('参数')) return '请求参数不合法，请检查后重试'

  return fallbackMessage
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  if (role.value === 'admin' || role.value === 'superadmin') {
    router.push('/admin/user')
  } else {
    router.push('/user/profile')
  }
}

const ensureAvatarUrl = async () => {
  const avatarKey = portrait.value?.profile?.avatarKey
  if (!avatarKey) {
    avatarUrl.value = ''
    return
  }
  try {
    avatarUrl.value = await getSignedOssUrl(avatarKey, {
      expiresInSeconds: 60 * 60,
      disposition: 'inline',
    })
  } catch {
    avatarUrl.value = ''
  }
}

const initCharts = () => {
  const ensureChart = (chart: ECharts | null, el?: HTMLDivElement) => {
    if (!el) return chart
    if (!chart) return echarts.init(el)
    if (chart.getDom() !== el) {
      chart.dispose()
      return echarts.init(el)
    }
    return chart
  }

  radarChart = ensureChart(radarChart, radarRef.value)
  pieChart = ensureChart(pieChart, pieRef.value)
  heatmapChart = ensureChart(heatmapChart, heatmapRef.value)
}

const setRadarOption = () => {
  if (!radarChart || !portrait.value) return
  const list = (portrait.value.radarData || []).map((item) => ({
    name: item.name,
    value: toNumber(item.value),
  }))
  const hasPositiveValue = list.some((item) => item.value > 0)

  if (!list.length || !hasPositiveValue) {
    radarChart.setOption(
      {
        title: {
          text: '暂无雷达图数据',
          left: 'center',
          top: 'middle',
          textStyle: {
            fontSize: 14,
            color: '#909399',
            fontWeight: 'normal',
          },
        },
        radar: {
          indicator: [
            { name: '组织协调', max: 100 },
            { name: '爱心奉献', max: 100 },
            { name: '专业技能', max: 100 },
            { name: '沟通表达', max: 100 },
            { name: '持续参与', max: 100 },
          ],
        },
        series: [],
      },
      true
    )
    return
  }

  const option: EChartsOption = {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: list.map((item) => ({ name: item.name, max: 100 })),
      splitNumber: 5,
      axisName: { color: '#606266' },
      splitArea: { areaStyle: { color: ['#f8fbff', '#ffffff'] } },
    },
    series: [
      {
        type: 'radar',
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 2 },
        symbolSize: 6,
        data: [{ value: list.map((item) => item.value), name: '画像得分' }],
      },
    ],
  }
  radarChart.setOption(option, true)
}

const setPieOption = () => {
  if (!pieChart || !portrait.value) return
  const pieData = (portrait.value.categoryPie || []).map((item) => ({
    name: item.name || '未分类',
    value: toNumber(item.value),
  }))
  const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0)

  if (!pieData.length || pieTotal <= 0) {
    pieChart.setOption(
      {
        title: {
          text: '暂无饼图数据',
          left: 'center',
          top: 'middle',
          textStyle: {
            fontSize: 14,
            color: '#909399',
            fontWeight: 'normal',
          },
        },
        series: [],
      },
      true
    )
    return
  }

  const option: EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['35%', '62%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        data: pieData,
      },
    ],
  }
  pieChart.setOption(option, true)
}

const setHeatmapOption = () => {
  if (!heatmapChart || !portrait.value) return
  const heatmapData = (portrait.value.calendarHeatmap || [])
    .map((item) => {
      const date = toDateString(item.date)
      return {
        date,
        value: toNumber(item.value),
      }
    })
    .filter((item) => !!item.date)

  const dateList = heatmapData.map((item) => item.date)
  const firstDate = dateList[0] || ''
  const year = firstDate ? firstDate.slice(0, 4) : String(new Date().getFullYear())
  const maxValue = heatmapData.length ? Math.max(...heatmapData.map((item) => item.value), 1) : 1

  if (!heatmapData.length) {
    heatmapChart.setOption(
      {
        title: {
          text: '暂无热力图数据',
          left: 'center',
          top: 'middle',
          textStyle: {
            fontSize: 14,
            color: '#909399',
            fontWeight: 'normal',
          },
        },
        series: [],
      },
      true
    )
    return
  }

  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const first = Array.isArray(params) ? params[0] : params
        const data =
          first && typeof first === 'object' && 'data' in first
            ? (first as { data?: unknown }).data
            : null
        const row = Array.isArray(data) ? data : null
        if (!row) return ''
        return `${row[0]}<br/>参与次数：${row[1]}`
      },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      },
    },
    calendar: {
      top: 30,
      left: 30,
      right: 30,
      cellSize: ['auto', 16],
      range: year,
      splitLine: {
        show: true,
        lineStyle: { color: '#f0f0f0', width: 1, type: 'solid' },
      },
      yearLabel: { show: false },
      dayLabel: { firstDay: 1, nameMap: 'ZH' },
      monthLabel: { nameMap: 'ZH' },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: heatmapData.map((item) => [item.date, item.value]),
      },
    ],
  }

  heatmapChart.setOption(option, true)
}

const refreshCharts = async () => {
  await nextTick()
  initCharts()
  setRadarOption()
  setPieOption()
  setHeatmapOption()
}

const fetchPortraitData = async () => {
  loading.value = true
  errorMessage.value = ''
  let loadSuccess = false
  try {
    const params = queryStudentId.value ? { student_id: queryStudentId.value } : undefined
    const response = await portraitApi.getPortrait(params)
    portrait.value = response.data
    await ensureAvatarUrl()
    loadSuccess = true
  } catch (error) {
    portrait.value = null
    errorMessage.value = resolvePortraitErrorMessage(error)
  } finally {
    loading.value = false
    initialLoading.value = false
  }

  if (loadSuccess && portrait.value) {
    await refreshCharts()
  }
}

const handleWindowResize = () => {
  radarChart?.resize()
  pieChart?.resize()
  heatmapChart?.resize()
}

const clearResizeTimers = () => {
  while (resizeTimerIds.length) {
    const timerId = resizeTimerIds.pop()
    if (timerId !== undefined) {
      window.clearTimeout(timerId)
    }
  }
}

const scheduleChartResize = () => {
  clearResizeTimers()
  handleWindowResize()
  const delays = [80, 200, 320]
  delays.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      handleWindowResize()
    }, delay)
    resizeTimerIds.push(timerId)
  })
}

onMounted(async () => {
  await fetchPortraitData()
  window.addEventListener('resize', handleWindowResize)

  if ('ResizeObserver' in window && portraitPageRef.value) {
    portraitResizeObserver = new ResizeObserver(() => {
      scheduleChartResize()
    })
    portraitResizeObserver.observe(portraitPageRef.value)
  }
})

watch(
  () => route.query.student_id,
  async () => {
    await fetchPortraitData()
  }
)

onBeforeUnmount(() => {
  clearResizeTimers()
  window.removeEventListener('resize', handleWindowResize)
  portraitResizeObserver?.disconnect()
  portraitResizeObserver = null
  radarChart?.dispose()
  pieChart?.dispose()
  heatmapChart?.dispose()
  radarChart = null
  pieChart = null
  heatmapChart = null
})
</script>

<style scoped>
.portrait-page {
  padding: 2px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #1f2d3d;
}

.page-subtitle {
  margin: 6px 0 0;
  color: #909399;
  font-size: 13px;
}

.mb-16 {
  margin-bottom: 16px;
}

.profile-card,
.kpi-card,
.chart-card {
  border-radius: 12px;
}

.card-equal {
  min-height: 170px;
}

.profile-main {
  display: flex;
  gap: 14px;
  align-items: center;
}

.profile-meta h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.profile-meta p {
  margin: 6px 0 8px;
  color: #606266;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kpi-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease;
  border: 1px solid #edf0f5;
  background: #ffffff;
}

.kpi-card:hover {
  transform: translateY(-3px);
}

.kpi-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.kpi-icon-wrap {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #eef2f7;
}

.kpi-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-blue {
  color: #2f78ff;
}

.icon-purple {
  color: #7c4dff;
}

.icon-green {
  color: #1f9d62;
}

.icon-orange {
  color: #f08a24;
}

.kpi-row {
  margin-bottom: 4px;
}

.kpi-value {
  margin: 10px 0 8px;
  font-size: 27px;
  color: #303133;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.kpi-sub {
  margin: 0;
  color: #8a94a6;
  font-size: 13px;
}

.kpi-label {
  margin: 0;
  color: #4f5d75;
  font-size: 15px;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}

.kpi-divider {
  height: 12px;
  margin: 2px 6px 0;
  border-top: 2px dashed #e5ebf5;
  opacity: 0.9;
}

.card-title {
  font-weight: 600;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 320px;
}

.chart-container.heatmap {
  height: 260px;
}

@media (max-width: 1200px) {
  .card-equal {
    min-height: auto;
  }
}
</style>
