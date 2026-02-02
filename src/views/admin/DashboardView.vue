<template>
  <div class="dashboard" ref="dashboardRef">
    <ChongqingDrillMap :activities="activities" @scroll-to-dashboard="scrollToDashboard" />

    <div class="dashboard-content" ref="dashboardContentRef">
      <div class="dashboard-toolbar">
        <div class="toolbar-titles">
          <h2>智慧数据驾驶舱</h2>
          <p class="toolbar-subtitle">数据更新：{{ dataTimestamp || '等待刷新' }}</p>
        </div>
        <div class="toolbar-actions">
          <el-select v-model="timeRange" size="small">
            <el-option
              v-for="option in timeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-button
            class="refresh-btn"
            type="primary"
            :loading="loading"
            @click="refreshDashboardData"
          >
            刷新数据
          </el-button>
        </div>
      </div>

      <el-row :gutter="20" class="kpi-row">
        <el-col v-for="card in kpiCards" :key="card.key" :xs="24" :sm="12" :lg="6">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-top">
              <div class="kpi-text">
                <p class="kpi-title">{{ card.title }}</p>
                <p class="kpi-value">
                  <NumberTicker
                    :key="card.key"
                    :value="card.value"
                    :decimal-places="card.key === 'hours' ? 1 : 0"
                    :duration="1800"
                    class="text-4xl lg:text-5xl text-gray-900"
                  />
                  <span class="kpi-unit ml-1 text-xl">{{ card.unit }}</span>
                </p>
              </div>
              <el-icon class="kpi-icon" :style="{ backgroundColor: card.color }">
                <component :is="card.icon" />
              </el-icon>
            </div>
            <div class="kpi-bottom">
              <span class="kpi-label">较上一时间段</span>
              <div
                class="kpi-trend"
                :class="{
                  'is-up': card.trendDirection === 'up',
                  'is-down': card.trendDirection === 'down',
                }"
              >
                <el-icon v-if="card.trendDirection === 'up'" class="trend-icon">
                  <CaretTop />
                </el-icon>
                <el-icon v-else-if="card.trendDirection === 'down'" class="trend-icon">
                  <CaretBottom />
                </el-icon>
                <span>{{ formatTrendValue(card.trend) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="16">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>志愿者活跃度趋势</span>
                <span class="card-subtitle">报名人次 vs 实际服务时长</span>
              </div>
            </template>
            <div ref="volunteerTrendRef" class="chart-panel large"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="8">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>活动类型热度</span>
                <span class="card-subtitle">最近{{ timeRangeLabel }}</span>
              </div>
            </template>
            <div ref="activityPieRef" class="chart-panel small"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>专业服务时长对比</span>
                <span class="card-subtitle">累计小时 & 志愿者数</span>
              </div>
            </template>
            <div ref="majorBarRef" class="chart-panel medium"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card shadow="hover" class="chart-card volunteer-card">
            <template #header>
              <div class="card-header">
                <span>高活跃志愿者</span>
                <span class="card-subtitle">本周期累计时长</span>
              </div>
            </template>
            <div v-if="baseVolunteers.length" class="volunteer-list" ref="volunteerListRef">
              <div
                class="volunteer-wrapper"
                :class="{ scrolling: needScroll }"
                :style="{ '--scroll-duration': `${scrollDuration}s` }"
              >
                <div
                  v-for="(profile, index) in baseVolunteers"
                  :key="`a-${index}`"
                  class="volunteer-item"
                >
                  <div class="volunteer-info">
                    <div class="volunteer-avatar">{{ profile.name.slice(-2) }}</div>
                    <div>
                      <p class="volunteer-name">{{ profile.name }}</p>
                      <p class="volunteer-meta">{{ profile.department }}</p>
                    </div>
                  </div>
                  <div class="volunteer-extra">
                    <span class="volunteer-hours">{{ profile.hours }} 小时</span>
                    <div class="tag-list">
                      <el-tag
                        v-for="tag in getDisplayTags(profile.skills)"
                        :key="tag"
                        size="small"
                        type="success"
                        effect="plain"
                      >
                        {{ tag }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无志愿者数据" :image-size="120" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="24">
          <el-card shadow="hover" class="chart-card activity-card">
            <template #header>
              <div class="card-header">
                <span>即将开展的活动</span>
                <span class="card-subtitle">智能推荐与人次目标</span>
              </div>
            </template>
            <el-table :data="upcomingActivities" border size="small">
              <el-table-column prop="title" label="活动" min-width="200" />
              <el-table-column prop="startTime" label="开始时间" width="140" />
              <el-table-column prop="endTime" label="结束时间" width="140" />
              <el-table-column prop="participants" label="目标人次" width="140" />
              <el-table-column label="状态" width="150">
                <template #default="{ row }: { row: ActivityPlan }">
                  <el-tag :type="statusTagType[row.status]" size="small">
                    {{ statusLabel[row.status] }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="24">
          <el-card shadow="hover" class="chart-card current-term-tree-card">
            <template #header>
              <div class="card-header-with-filter">
                <div class="card-header">
                  <span>当前届次骨干组织树形视图</span>
                  <span class="card-subtitle">来源：骨干成员数据，只读展示</span>
                </div>
                <div class="tree-filter-controls">
                  <span class="filter-label">显示层级：</span>
                  <el-select
                    v-model="treeFilterLevel"
                    size="small"
                    style="width: 200px"
                    placeholder="选择显示层级"
                  >
                    <el-option label="全队" value="all" />
                    <el-option label="队长" value="captain" />
                    <el-option label="部长" value="minister" />
                    <el-option
                      v-for="dept in availableDepartments"
                      :key="dept"
                      :label="dept"
                      :value="dept"
                    />
                  </el-select>
                </div>
              </div>
            </template>
            <div class="current-term-tree-wrapper">
              <BackboneTreeView
                v-if="currentTermTreeTerms.length"
                class="dashboard-backbone-tree"
                :terms="currentTermTreeTerms"
                :loading="currentTermTreeLoading"
                :active="true"
                :simple="true"
                :filter-level="treeFilterLevel"
              />
              <el-empty v-else description="暂无当前届次树形数据" :image-size="120" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { Calendar, DataLine, Trophy, UserFilled } from '@element-plus/icons-vue'
import { activityApi, backboneMemberApi, dashboardApi } from '@/utils/api'
import type {
  ActivityInfo,
  BackboneMemberTreeTerm,
  DashboardDataResponse,
  DashboardKpiBlock,
} from '@/utils/api/types'
import { message } from '@/utils/message'

// 定义时间范围类型
type TimeRange = '30d' | '90d' | '1y' | 'all'
// 定义活动状态类型
type ActivityStatus = 'draft' | 'ongoing' | 'ending'
// 定义趋势方向类型
type TrendDirection = 'up' | 'down' | null

// KPI 卡片接口定义
interface KpiCard {
  key: string
  title: string
  value: number
  unit: string
  trend: number | null
  trendDirection: TrendDirection
  color: string
  icon: Component
}

// 趋势点接口（用于志愿者趋势图）
interface TrendPoint {
  label: string
  signup: number
  attend: number
  hours: number
}

// 活动分布接口（用于饼图）
interface ActivitySlice {
  name: string
  value: number
}

// 专业统计接口（用于柱线图）
interface MajorStat {
  name: string
  hours: number
  volunteers: number
}

// 志愿者资料接口
interface VolunteerProfile {
  name: string
  department: string
  hours: number
  skills: string[]
}

// 活动计划接口（用于表格）
interface ActivityPlan {
  title: string
  startTime: string
  endTime: string
  participants: number
  status: ActivityStatus
}

// 时间选项数组
const timeOptions: { label: string; value: TimeRange }[] = [
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' },
  { label: '今年以来', value: '1y' },
  { label: '全部时间', value: 'all' },
]

// 当前时间范围 ref
const timeRange = ref<TimeRange>('all')
// 加载状态 ref
const loading = ref(false)
// 数据时间戳 ref
const dataTimestamp = ref('')

// 格式化趋势值函数
const formatTrendValue = (value: number | null) => (value === null ? '--' : `${value.toFixed(1)}%`)

// 基础 KPI 卡片配置（不含值和趋势）
const baseKpiCards: Array<Omit<KpiCard, 'value' | 'trend' | 'trendDirection'>> = [
  {
    key: 'volunteer',
    title: '志愿者总数',
    unit: '人',
    color: '#06aed5',
    icon: markRaw(UserFilled),
  },
  { key: 'hours', title: '累计服务时长', unit: '小时', color: '#5c7cfa', icon: markRaw(DataLine) },
  { key: 'honor', title: '荣誉表彰', unit: '条', color: '#f7b731', icon: markRaw(Trophy) },
  { key: 'activities', title: '进行中活动', unit: '场', color: '#f56c6c', icon: markRaw(Calendar) },
]

// KPI 卡片 ref（初始化为 0 值）
const kpiCards = ref<KpiCard[]>(
  baseKpiCards.map((card) => ({ ...card, value: 0, trend: null, trendDirection: null }))
)

// 志愿者趋势数据 ref
const volunteerTrend = ref<TrendPoint[]>([])
// 活动分布数据 ref
const activityDistribution = ref<ActivitySlice[]>([])
// 专业时长数据 ref
const majorHours = ref<MajorStat[]>([])
// 顶级志愿者 ref
const topVolunteers = ref<VolunteerProfile[]>([])
// 即将活动 ref
const upcomingActivities = ref<ActivityPlan[]>([])

// 活动数据 ref（用于地图与表格）
const activities = ref<ActivityInfo[]>([])

// 当前届次树形视图数据
const currentTermTreeLoading = ref(false)
const currentTermTreeTerms = ref<BackboneMemberTreeTerm[]>([])
// 树形图过滤层级
const treeFilterLevel = ref<string>('all')

// 计算可用的部门列表
const availableDepartments = computed(() => {
  const departments = new Set<string>()
  currentTermTreeTerms.value.forEach((term) => {
    term.managers?.forEach((manager) => {
      manager.departments?.forEach((dept) => {
        const deptName = dept.dept_name || ''
        // 排除队长团
        if (deptName && !deptName.includes('队长团')) {
          departments.add(deptName)
        }
      })
    })
  })
  return Array.from(departments).sort()
})

const dashboardRef = ref<HTMLDivElement | null>(null)
const dashboardContentRef = ref<HTMLDivElement | null>(null)
// 无缝滚动核心变量
const MAX_VOLUNTEER_DISPLAY = 10
const MAX_VOLUNTEER_TAGS = 3
const ITEM_HEIGHT = 86
const SCROLL_SPEED = 25

const baseVolunteers = ref<VolunteerProfile[]>([])
const needScroll = ref(false)
const scrollDuration = ref(0)
const volunteerListRef = ref<HTMLDivElement>()

// 状态标签映射
const statusLabel: Record<ActivityStatus, string> = {
  draft: '筹备中',
  ongoing: '进行中',
  ending: '已结束',
}

// 状态标签类型映射（用于 el-tag）
const statusTagType: Record<ActivityStatus, 'info' | 'success' | 'danger'> = {
  draft: 'info',
  ongoing: 'success',
  ending: 'danger',
}

// 计算属性：当前时间范围标签
const timeRangeLabel = computed(
  () => timeOptions.find((option) => option.value === timeRange.value)?.label || ''
)

// 图表 DOM ref
const volunteerTrendRef = ref<HTMLDivElement>()
const activityPieRef = ref<HTMLDivElement>()
const majorBarRef = ref<HTMLDivElement>()

// 图表实例变量
let volunteerChart: ECharts | null = null
let activityChart: ECharts | null = null
let majorChart: ECharts | null = null

// 初始化图表实例
const initCharts = () => {
  if (!volunteerChart && volunteerTrendRef.value) {
    volunteerChart = echarts.init(volunteerTrendRef.value)
  }
  if (!activityChart && activityPieRef.value) {
    activityChart = echarts.init(activityPieRef.value)
  }
  if (!majorChart && majorBarRef.value) {
    majorChart = echarts.init(majorBarRef.value)
  }
}

// 更新志愿者趋势图选项
const updateVolunteerChart = () => {
  if (!volunteerChart) return
  volunteerChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['报名人次', '实际出勤', '服务时长'], top: 10 },
    grid: { left: '3%', right: '4%', bottom: '4%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: volunteerTrend.value.map((item) => item.label),
    },
    yAxis: [
      { type: 'value', name: '人次' },
      { type: 'value', name: '小时' },
    ],
    series: [
      {
        name: '报名人次',
        type: 'line',
        smooth: true,
        symbolSize: 8,
        data: volunteerTrend.value.map((item) => item.signup),
      },
      {
        name: '实际出勤',
        type: 'line',
        smooth: true,
        symbolSize: 8,
        areaStyle: { opacity: 0.08 },
        data: volunteerTrend.value.map((item) => item.attend),
      },
      {
        name: '服务时长',
        type: 'bar',
        yAxisIndex: 1,
        barWidth: 18,
        data: volunteerTrend.value.map((item) => item.hours),
        itemStyle: { borderRadius: 6 },
      },
    ],
  })
}

// 更新活动饼图选项
const updateActivityChart = () => {
  if (!activityChart) return
  activityChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle' },
    series: [
      {
        name: '活动数',
        type: 'pie',
        radius: ['10%', '70%'],
        avoidLabelOverlap: false,
        padAngle: 5,
        itemStyle: {
          borderColor: '#fff',
          borderRadius: 10,
          borderWidth: 2,
        },
        label: { formatter: '{b}\n{d}%' },
        data: activityDistribution.value,
      },
    ],
  })
}

// 更新专业柱线图选项
const updateMajorChart = () => {
  if (!majorChart) return
  majorChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { top: 10 },
    grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
    xAxis: { type: 'category', data: majorHours.value.map((item) => item.name) },
    yAxis: [
      { type: 'value', name: '小时' },
      { type: 'value', name: '人数' },
    ],
    series: [
      {
        name: '服务时长',
        type: 'bar',
        data: majorHours.value.map((item) => item.hours),
        itemStyle: { borderRadius: [6, 6, 0, 0] },
      },
      {
        name: '志愿者数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        areaStyle: { opacity: 0.05 },
        data: majorHours.value.map((item) => item.volunteers),
      },
    ],
  })
}

// 异步更新所有图表（使用 nextTick 确保 DOM 更新）
const updateCharts = async () => {
  await nextTick()
  initCharts()
  updateVolunteerChart()
  updateActivityChart()
  updateMajorChart()
}


// 限制显示标签数量
const getDisplayTags = (tags: string[]) => tags.slice(0, MAX_VOLUNTEER_TAGS)

// 终极无缝滚动核心函数
const updateVolunteerRender = async () => {
  const list = topVolunteers.value.slice(0, MAX_VOLUNTEER_DISPLAY)
  baseVolunteers.value = list

  if (!list.length) {
    needScroll.value = false
    scrollDuration.value = 0
    return
  }

  await nextTick()
  const container = volunteerListRef.value
  if (!container) return

  const containerHeight = container.clientHeight
  const totalHeight = list.length * ITEM_HEIGHT

  if (totalHeight > containerHeight) {
    needScroll.value = true
    scrollDuration.value = totalHeight / SCROLL_SPEED
  } else {
    needScroll.value = false
    scrollDuration.value = 0
  }
}

// 加载当前届次骨干成员树形视图数据
const loadCurrentTermTree = async () => {
  currentTermTreeLoading.value = true
  try {
    const res = await backboneMemberApi.getTree()
    const allTerms: BackboneMemberTreeTerm[] = res.data?.list || []

    const currentTerms = allTerms.filter((t) => t.is_current)
    currentTermTreeTerms.value = currentTerms.length ? currentTerms : allTerms.slice(0, 1)
  } catch (error) {
    console.error('加载当前届次树形数据失败:', error)
    currentTermTreeTerms.value = []
  } finally {
    currentTermTreeLoading.value = false
  }
}

// 将 Dashboard 聚合数据应用到前端状态
const applyDashboardData = async (payload: DashboardDataResponse) => {
  const { kpiMetrics, volunteerTrend: trend, activityDistribution: pie, majorStats, topVolunteers: topList, upcomingActivities: upcomingList } = payload

  const kpiMap: Record<string, DashboardKpiBlock> = {
    volunteer: kpiMetrics.volunteerCount,
    hours: kpiMetrics.totalServiceHours,
    honor: kpiMetrics.honorCount,
    activities: kpiMetrics.ongoingActivityCount,
  }

  kpiCards.value.forEach((card) => {
    const data = kpiMap[card.key]
    if (data) {
      card.value = data.value
      card.trend = data.trend
      card.trendDirection = data.trendDirection
    }
  })

  volunteerTrend.value = trend
  activityDistribution.value = pie
  majorHours.value = majorStats.map((item) => ({
    name: item.name,
    hours: item.hours,
    volunteers: item.volunteerCount,
  }))
  topVolunteers.value = topList
  upcomingActivities.value = upcomingList

  await updateCharts()
}

// 刷新仪表盘数据（调用后端聚合接口 + 活动列表用于地图）
const refreshDashboardData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const [dashboardRes, activitiesRes] = await Promise.all([
      dashboardApi.getDashboardData(timeRange.value),
      activityApi.getAll(),
    ])

    activities.value = activitiesRes.data?.list ?? []
    const dashboardData = dashboardRes.data
    if (!dashboardData) {
      message.error('获取仪表盘数据为空，请稍后重试')
      return
    }

    await applyDashboardData(dashboardData)
    dataTimestamp.value = new Date().toLocaleString()
  } catch (error) {
    console.error('仪表盘数据获取失败', error)
    message.error('获取仪表盘数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 监听时间范围变化，重新拉取数据
watch(timeRange, async () => {
  await refreshDashboardData()
})
watch(topVolunteers, updateVolunteerRender, { immediate: true })

// 处理窗口 resize，调整图表大小
const handleResize = () => {
  volunteerChart?.resize()
  activityChart?.resize()
  majorChart?.resize()
}

// 滚动到驾驶舱
const scrollToDashboard = () => {
  if (dashboardContentRef.value) {
    dashboardContentRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}

// 组件挂载钩子：初始化图表、刷新数据、添加 resize 监听
onMounted(() => {
  initCharts()
  refreshDashboardData()
  updateVolunteerRender()
  loadCurrentTermTree()

  // 使用 ResizeObserver 监听容器尺寸变化（包括侧边栏伸缩引起的变化）
  if ('ResizeObserver' in window && dashboardRef.value) {
    const current = dashboardRef.value as HTMLDivElement & { _observer?: ResizeObserver }
    const observer = new ResizeObserver(() => {
      handleResize()
    })
    observer.observe(current)
    current._observer = observer
  }

  window.addEventListener('resize', handleResize)
})

// 组件卸载前钩子：移除监听、销毁图表实例
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)

  const current = dashboardRef.value as (HTMLDivElement & { _observer?: ResizeObserver }) | null
  if (current && current._observer) {
    current._observer.unobserve(current)
    current._observer.disconnect()
  }

  volunteerChart?.dispose()
  activityChart?.dispose()
  majorChart?.dispose()
})
</script>

<style scoped>
/* 布局与容器 */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 25px;
  overflow-x: hidden;
}

/* 正式内容 */
.dashboard-content {
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  gap: 20px;
}

/* 顶部工具栏 */
.dashboard-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background-color: #ffffff;
  border-radius: 20px;
  border: 1px solid #e1ecfc;
  box-shadow: 0 10px 30px rgba(25, 137, 250, 0.08);
}

.toolbar-titles h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.toolbar-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #909399;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  font-size: 14px;
  font-weight: 600;
  padding: 0 20px;
}

/* KPI 卡片 */
.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-radius: 18px;
  padding: 20px 22px;
  border: 1px solid #eff4ff;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kpi-title {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.kpi-value {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  color: #1f2d3d;
}

.kpi-unit {
  font-size: 14px;
  color: #606266;
  margin-left: 4px;
}

.kpi-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px dashed #e5e9f2;
  padding-top: 10px;
}

.kpi-label {
  font-size: 13px;
  color: #909399;
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.kpi-trend.is-up {
  color: #30b39c;
}

.kpi-trend.is-down {
  color: #f56c6c;
}

.trend-icon {
  font-size: 16px;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.chart-row {
  margin-top: 8px;
}

.chart-row .el-col {
  display: flex;
}

.chart-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 600;
  font-size: 16px;
}

.card-subtitle {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
}

.chart-panel {
  width: 100%;
  height: 320px;
  flex: 1;
}

.chart-panel.large,
.chart-panel.small,
.chart-panel.medium {
  height: 320px;
}

.legend-row {
  margin-top: 12px;
}

.legend-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
  padding: 6px 0;
  border-bottom: 1px dashed #ebeef5;
}

.legend-item:last-child {
  border-bottom: none;
}

.volunteer-card .el-card__body {
  padding: 0 20px 20px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.volunteer-list {
  height: 320px;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.volunteer-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.volunteer-wrapper.scrolling {
  animation: seamlessScroll linear infinite var(--scroll-duration, 0s);
}

.volunteer-list:hover .volunteer-wrapper.scrolling {
  animation-play-state: paused;
}

@keyframes seamlessScroll {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-100%);
  }
}

.volunteer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f2f5;
  padding-bottom: 12px;
  min-height: 70px;
  flex-shrink: 0;
}

.volunteer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volunteer-avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #409eff, #7aa6ff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}

.volunteer-name {
  margin: 0;
  font-weight: 600;
  color: #1f2d3d;
}

.volunteer-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.volunteer-extra {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.volunteer-hours {
  font-weight: 600;
  color: #303133;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.activity-card .el-card__body {
  padding: 0 20px 24px;
  min-height: 320px;
  display: flex;
  flex-direction: column;
}

.activity-card .el-table {
  font-size: 14px;
  flex: 1;
}

.current-term-tree-card :deep(.el-card__body) {
  padding: 0;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.card-header-with-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.tree-filter-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.current-term-tree-wrapper {
  flex: 1;
  height: 100%;
  padding: 0 10px;
  overflow: auto;
}

.dashboard-backbone-tree {
  width: 100%;
  height: 100%;
}

@media (max-width: 992px) {
  .dashboard-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
