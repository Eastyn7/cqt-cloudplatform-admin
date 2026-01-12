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
              <span class="kpi-label">较昨日</span>
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
              <el-table-column prop="date" label="日期" width="120" />
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
import {
  activityApi,
  activityParticipantApi,
  backboneMemberApi,
  honorRecordApi,
  userInfoApi,
} from '@/utils/api'
import type {
  ActivityInfo,
  HonorRecordInfo,
  StudentActivityRecord,
  UserInfo,
  BackboneMemberTreeTerm,
} from '@/utils/api/types'
import { message } from '@/utils/message'
import { useDate } from '@/utils/date'

const dateUtil = useDate

// 定义时间范围类型
type TimeRange = '30d' | '90d' | '1y'
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
  date: string
  participants: number
  status: ActivityStatus
}

// 时间选项数组
const timeOptions: { label: string; value: TimeRange }[] = [
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' },
  { label: '今年以来', value: '1y' },
]

// 当前时间范围 ref
const timeRange = ref<TimeRange>('30d')
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

// 用户数据 ref
const users = ref<UserInfo[]>([])
// 荣誉记录 ref
const honors = ref<HonorRecordInfo[]>([])
// 活动数据 ref
const activities = ref<ActivityInfo[]>([])
// 参与记录 ref
const participants = ref<StudentActivityRecord[]>([])

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
  ongoing: '执行中',
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

// 获取一天开始时间
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
// 日期偏移函数
const shiftDays = (base: Date, days: number) => {
  const shifted = new Date(base)
  shifted.setDate(shifted.getDate() + days)
  return shifted
}

// 规范化活动状态
const normalizeStatus = (status?: string | null): ActivityStatus => {
  if (!status) return 'draft'
  if (status.includes('草稿')) return 'draft'
  if (status.includes('进行')) return 'ongoing'
  if (status.includes('结束')) return 'ending'
  if (status === 'ending' || status === 'ongoing' || status === 'draft') return status
  return 'draft'
}

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

// 计算趋势元数据（当前 vs 之前的变化）
const buildTrendMeta = (
  current: number,
  previous: number
): { trend: number | null; trendDirection: TrendDirection } => {
  const safePrev = Math.max(previous, 0)
  if (safePrev === 0) {
    return { trend: current > 0 ? 100 : 0, trendDirection: current > 0 ? 'up' : null }
  }
  const diff = current - safePrev
  if (diff === 0) return { trend: 0, trendDirection: null }
  const percent = Number(((Math.abs(diff) / safePrev) * 100).toFixed(1))
  return { trend: percent, trendDirection: diff > 0 ? 'up' : 'down' }
}

// 更新 KPI 卡片数据（计算总量和趋势）
const updateKpiCards = () => {
  const todayStart = startOfDay(new Date())
  const yesterdayStart = shiftDays(todayStart, -1)

  // 志愿者相关
  const volunteerTotal = users.value.length
  const volunteerNewToday = users.value.filter((user) =>
    dateUtil.isBetween(user.account_created_at, yesterdayStart, todayStart)
  ).length
  const volunteerPrevious = volunteerTotal - volunteerNewToday

  // 服务时长相关
  const totalHours = users.value.reduce((sum, record) => sum + Number(record.total_hours ?? 0), 0)
  const hoursToday = participants.value
    .filter((record) => dateUtil.isBetween(record.created_at, yesterdayStart, todayStart))
    .reduce((sum, record) => sum + (Number(record.service_hours) || 0), 0)
  const hoursPrevious = totalHours - hoursToday

  // 荣誉相关
  const honorTotal = honors.value.length
  const honorToday = honors.value.filter((honor) =>
    dateUtil.isBetween(honor.issue_date || undefined, yesterdayStart, todayStart)
  ).length
  const honorPrevious = honorTotal - honorToday

  // 活动相关
  const ongoingActivities = activities.value.filter(
    (activity) => normalizeStatus(activity.status) === 'ongoing'
  )
  const ongoingToday = ongoingActivities.filter((activity) =>
    dateUtil.isBetween(activity.start_time || activity.created_at, yesterdayStart, todayStart)
  ).length
  const ongoingPrevious = ongoingActivities.length - ongoingToday

  // 计算环比
  const metrics: Record<
    string,
    {
      value: number
      trend: number | null
      trendDirection: TrendDirection
    }
  > = {
    volunteer: {
      value: volunteerTotal,
      ...buildTrendMeta(volunteerTotal, volunteerPrevious),
    },
    hours: {
      value: Number(totalHours.toFixed(1)),
      ...buildTrendMeta(totalHours, hoursPrevious),
    },
    honor: {
      value: honorTotal,
      ...buildTrendMeta(honorTotal, honorPrevious),
    },
    activities: {
      value: ongoingActivities.length,
      ...buildTrendMeta(ongoingActivities.length, ongoingPrevious),
    },
  }

  // 更新 KPI 卡片数据
  // kpiCards.value = baseKpiCards.map((card) => ({
  //   ...card,
  //   value: metrics[card.key]?.value ?? 0,
  //   trend: metrics[card.key]?.trend ?? null,
  //   trendDirection: metrics[card.key]?.trendDirection ?? null,
  // }))
  kpiCards.value.forEach((card) => {
    const data = metrics[card.key]
    if (data) {
      card.value = data.value
      card.trend = data.trend
      card.trendDirection = data.trendDirection
    }
  })
}

// 构建志愿者趋势数据系列（根据时间范围分桶）
const buildVolunteerTrendSeries = () => {
  if (!participants.value.length) {
    volunteerTrend.value = []
    return
  }
  const now = new Date()
  const totalDays = timeRange.value === '1y' ? 365 : timeRange.value === '90d' ? 90 : 30
  const bucketCount = timeRange.value === '1y' ? 12 : timeRange.value === '90d' ? 9 : 6
  const bucketSize = Math.ceil(totalDays / bucketCount)
  const rangeStart = shiftDays(now, -totalDays)

  const buckets = Array.from({ length: bucketCount }, (_, idx) => {
    const start = shiftDays(rangeStart, idx * bucketSize)
    const end = shiftDays(start, bucketSize)
    const label = timeRange.value === '1y' ? `${start.getMonth() + 1}月` : `第${idx + 1}段`
    return { label, start, end, signup: 0, attend: 0, hours: 0 }
  })

  participants.value.forEach((record) => {
    const createdAt = dateUtil.parseDate(record.created_at)
    const bucket = buckets.find((item) => dateUtil.isBetween(createdAt, item.start, item.end))
    if (!bucket) return
    bucket.signup += 1
    if (record.signed_in === 1) {
      bucket.attend += 1
    }
    bucket.hours += Number(record.service_hours) || 0
  })

  volunteerTrend.value = buckets.map((bucket) => ({
    label: bucket.label,
    signup: bucket.signup,
    attend: bucket.attend,
    hours: Number(bucket.hours.toFixed(1)),
  }))
}

// 构建活动分布数据（按类别计数）
const buildActivityDistribution = () => {
  if (!activities.value.length) {
    activityDistribution.value = []
    return
  }
  const distribution = new Map<string, number>()
  activities.value.forEach((activity) => {
    const category = activity.category || '未分类'
    distribution.set(category, (distribution.get(category) || 0) + 1)
  })
  activityDistribution.value = Array.from(distribution.entries()).map(([name, value]) => ({
    name,
    value,
  }))
}

// 构建专业统计数据（时长和志愿者数）
const buildMajorStats = () => {
  if (!participants.value.length) {
    majorHours.value = []
    return
  }
  const stats = new Map<string, { hours: number; volunteers: Set<string> }>()
  const majorLookup = new Map(
    users.value.map((user) => [user.student_id, user.major || '未注明专业'])
  )
  participants.value.forEach((record) => {
    const major = record.major || majorLookup.get(record.student_id) || '未注明专业'
    const entry = stats.get(major) ?? { hours: 0, volunteers: new Set<string>() }
    entry.hours += Number(record.service_hours) || 0
    entry.volunteers.add(record.student_id)
    stats.set(major, entry)
  })
  majorHours.value = Array.from(stats.entries()).map(([name, data]) => ({
    name,
    hours: Number(data.hours.toFixed(1)),
    volunteers: data.volunteers.size,
  }))
}

// 构建顶级志愿者数据（聚合时长、技能，按时长排序取前10）
const buildTopVolunteers = () => {
  if (!participants.value.length) {
    topVolunteers.value = []
    return
  }
  const skillMap = new Map(users.value.map((user) => [user.student_id, user.skill_tags]))
  const majorMap = new Map(users.value.map((user) => [user.student_id, user.major || '未注明专业']))
  const stats = new Map<
    string,
    { name: string; department: string; hours: number; skills: string[] }
  >()

  participants.value.forEach((record) => {
    const existed = stats.get(record.student_id) || {
      name: record.student_name,
      department: record.major || majorMap.get(record.student_id) || '未注明专业',
      hours: 0,
      skills: [],
    }
    existed.hours += Number(record.service_hours) || 0
    const tags = skillMap.get(record.student_id)
    if (tags) {
      existed.skills = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    }
    stats.set(record.student_id, existed)
  })

  topVolunteers.value = Array.from(stats.values())
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      hours: Number(item.hours.toFixed(1)),
      skills: item.skills.length ? item.skills : ['综合服务'],
    }))
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

// 构建即将活动数据（过滤未来活动、排序、映射）
const buildUpcomingActivities = () => {
  if (!activities.value.length) {
    upcomingActivities.value = []
    return
  }
  const now = new Date()
  const participantCount = new Map<number, number>()
  participants.value.forEach((record) => {
    participantCount.set(record.activity_id, (participantCount.get(record.activity_id) || 0) + 1)
  })
  const futureList = activities.value
    .filter((activity) => {
      const start = dateUtil.parseDate(activity.start_time)
      return !!start && start >= now
    })
    .sort(
      (a, b) =>
        (dateUtil.parseDate(a.start_time)?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (dateUtil.parseDate(b.start_time)?.getTime() ?? Number.MAX_SAFE_INTEGER)
    )
    .slice(0, 4)

  upcomingActivities.value = futureList.map((activity) => ({
    title: activity.activity_name,
    date: dateUtil.formatMonthDay(activity.start_time, '待定'),
    participants: activity.recruitment_limit ?? participantCount.get(activity.activity_id) ?? 0,
    status: normalizeStatus(activity.status),
  }))
}

// 构建仪表盘视图（调用所有数据构建函数并更新图表）
const buildDashboardViews = async () => {
  updateKpiCards()
  buildVolunteerTrendSeries()
  buildActivityDistribution()
  buildMajorStats()
  buildTopVolunteers()
  buildUpcomingActivities()
  await updateCharts()
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

// 刷新仪表盘数据（异步获取 API 数据，处理错误，更新视图）
const refreshDashboardData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const [usersRes, honorsRes, activitiesRes, participantsRes] = await Promise.all([
      userInfoApi.getAllUsers(),
      honorRecordApi.getAll(),
      activityApi.getAll(),
      activityParticipantApi.getAll(),
    ])
    users.value = usersRes.data?.list ?? []
    honors.value = honorsRes.data?.list ?? []
    activities.value = activitiesRes.data?.list ?? []
    participants.value = participantsRes.data?.list ?? []
    await buildDashboardViews()
    dataTimestamp.value = new Date().toLocaleString()
  } catch (error) {
    console.error('仪表盘数据获取失败', error)
    message.error('获取仪表盘数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 监听时间范围变化，更新趋势数据和图表
watch(timeRange, async () => {
  buildVolunteerTrendSeries()
  await nextTick()
  updateVolunteerChart()
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
