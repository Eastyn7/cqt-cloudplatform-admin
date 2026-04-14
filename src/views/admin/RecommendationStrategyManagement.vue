<template>
  <AdminPageLayout title="推荐策略">
    <el-card class="strategy-card" v-loading="strategyLoading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">策略配置</span>
            <span class="card-subtitle">支持按类别、置顶活动和关键词进行推荐干预</span>
          </div>
          <div class="header-right">
            <el-button :loading="strategyLoading" @click="loadStrategy">
              <el-icon>
                <Refresh />
              </el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <div class="strategy-scroll">
        <el-card class="section-card" shadow="never">
          <template #header>
            <div class="section-header">
              <span>当前策略概览</span>
              <el-tag :type="strategyForm.enabled ? 'success' : 'info'">
                {{ strategyForm.enabled ? '已启用' : '已停用' }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="3" border>
            <el-descriptions-item label="策略名称">
              {{ strategyForm.strategy_name || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="类别加分">
              {{ formatNumber(strategyForm.category_boost) }}
            </el-descriptions-item>
            <el-descriptions-item label="置顶加分">
              {{ formatNumber(strategyForm.pinned_boost) }}
            </el-descriptions-item>
            <el-descriptions-item label="关键词加分">
              {{ formatNumber(strategyForm.keyword_boost) }}
            </el-descriptions-item>
            <el-descriptions-item label="时间加分">
              {{ formatNumber(strategyForm.time_boost) }}
            </el-descriptions-item>
            <el-descriptions-item label="优先类别">
              <div class="summary-tags">
                <el-tag
                  v-for="category in strategyForm.priority_categories"
                  :key="`summary-category-${category}`"
                  size="small"
                  effect="plain"
                >
                  {{ category }}
                </el-tag>
                <span v-if="!strategyForm.priority_categories.length" class="summary-empty">暂无</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="置顶活动" :span="2">
              <div class="summary-tags">
                <el-tag
                  v-for="activityId in strategyForm.pinned_activity_ids"
                  :key="`summary-activity-${activityId}`"
                  size="small"
                  type="warning"
                  effect="plain"
                >
                  {{ getActivityLabel(activityId) }}
                </el-tag>
                <span v-if="!strategyForm.pinned_activity_ids.length" class="summary-empty">暂无</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="优先关键词">
              <div class="summary-tags">
                <el-tag
                  v-for="keyword in strategyForm.priority_keywords"
                  :key="`summary-keyword-${keyword}`"
                  size="small"
                  type="success"
                  effect="plain"
                >
                  {{ keyword }}
                </el-tag>
                <span v-if="!strategyForm.priority_keywords.length" class="summary-empty">暂无</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">
              {{ strategyForm.remarks || '暂无备注' }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="overview-actions">
            <span class="overview-hint">点击编辑策略可从右侧滑出的编辑框继续调整配置。</span>
            <el-button type="primary" link class="edit-link" @click="drawerVisible = true">
              编辑策略
            </el-button>
          </div>
        </el-card>
      </div>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      title="编辑推荐策略"
      direction="rtl"
      size="52%"
      class="strategy-drawer"
      append-to-body
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="drawer-body">
        <div class="drawer-tip">右侧抽屉用于集中调整推荐策略，保存后会自动关闭。</div>

        <div class="drawer-summary">
          <div class="drawer-summary-main">
            <div class="drawer-summary-title">{{ strategyForm.strategy_name || '未命名策略' }}</div>
            <div class="drawer-summary-desc">
              {{ strategyForm.enabled ? '当前已启用' : '当前已停用' }} ·
              优先类别 {{ strategyForm.priority_categories.length }} 项 ·
              置顶活动 {{ strategyForm.pinned_activity_ids.length }} 个 ·
              关键词 {{ strategyForm.priority_keywords.length }} 个
            </div>
          </div>
          <div class="drawer-summary-tags">
            <el-tag :type="strategyForm.enabled ? 'success' : 'info'">
              {{ strategyForm.enabled ? '已启用' : '已停用' }}
            </el-tag>
            <el-tag type="warning">类别 {{ strategyForm.priority_categories.length }}</el-tag>
            <el-tag type="danger">置顶 {{ strategyForm.pinned_activity_ids.length }}</el-tag>
          </div>
        </div>

        <div class="drawer-content">
          <div class="drawer-scroll">
            <el-form :model="strategyForm" label-width="120px" class="drawer-form">
              <section class="form-section">
                <div class="form-section-header">
                  <div>
                    <span class="form-section-title">基础信息</span>
                    <span class="form-section-subtitle">策略名称、开关和备注说明</span>
                  </div>
                </div>
                <el-row :gutter="16">
                  <el-col :xs="24" :md="12">
                    <el-form-item label="策略名称">
                      <el-input v-model="strategyForm.strategy_name" placeholder="请输入策略名称" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="12">
                    <el-form-item label="启用状态">
                      <el-switch v-model="strategyForm.enabled" active-text="启用" inactive-text="停用" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24">
                    <el-form-item label="备注说明">
                      <el-input
                        v-model="strategyForm.remarks"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入策略备注"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </section>

              <section class="form-section">
                <div class="form-section-header">
                  <div>
                    <span class="form-section-title">推荐规则</span>
                    <span class="form-section-subtitle">类别、置顶活动和关键词优先级</span>
                  </div>
                </div>
                <el-row :gutter="16">
                  <el-col :xs="24" :md="12">
                    <el-form-item label="优先类别">
                      <el-select
                        v-model="strategyForm.priority_categories"
                        multiple
                        filterable
                        collapse-tags
                        collapse-tags-tooltip
                        class="full-width"
                        placeholder="请选择要优先推荐的类别"
                      >
                        <el-option
                          v-for="category in categoryOptions"
                          :key="category"
                          :label="category"
                          :value="category"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="12">
                    <el-form-item label="置顶活动">
                      <el-select
                        v-model="strategyForm.pinned_activity_ids"
                        multiple
                        filterable
                        collapse-tags
                        collapse-tags-tooltip
                        class="full-width"
                        placeholder="请选择要置顶的活动"
                      >
                        <el-option
                          v-for="activity in activityOptions"
                          :key="activity.activity_id"
                          :label="formatActivityOption(activity)"
                          :value="activity.activity_id"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="12">
                    <el-form-item label="优先关键词">
                      <el-select
                        v-model="strategyForm.priority_keywords"
                        multiple
                        filterable
                        allow-create
                        default-first-option
                        collapse-tags
                        collapse-tags-tooltip
                        class="full-width"
                        placeholder="输入关键词后回车添加"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </section>

              <section class="form-section">
                <div class="form-section-header">
                  <div>
                    <span class="form-section-title">加权配置</span>
                    <span class="form-section-subtitle">控制不同推荐干预项的加分力度</span>
                  </div>
                </div>
                <div class="section-hint">所有加分字段统一限定在 0~10，建议按 0.5 步长微调。</div>
                <el-row :gutter="16">
                  <el-col :xs="24" :md="12">
                    <el-form-item label="类别加分">
                      <el-input-number
                        v-model="strategyForm.category_boost"
                        :min="0"
                        :max="10"
                        :step="0.5"
                        :precision="1"
                        controls-position="right"
                        class="full-width"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="12">
                    <el-form-item label="置顶加分">
                      <el-input-number
                        v-model="strategyForm.pinned_boost"
                        :min="0"
                        :max="10"
                        :step="0.5"
                        :precision="1"
                        controls-position="right"
                        class="full-width"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="12">
                    <el-form-item label="关键词加分">
                      <el-input-number
                        v-model="strategyForm.keyword_boost"
                        :min="0"
                        :max="10"
                        :step="0.5"
                        :precision="1"
                        controls-position="right"
                        class="full-width"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :md="12">
                    <el-form-item label="时间加分">
                      <el-input-number
                        v-model="strategyForm.time_boost"
                        :min="0"
                        :max="10"
                        :step="0.5"
                        :precision="1"
                        controls-position="right"
                        class="full-width"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </section>
            </el-form>
          </div>

          <div class="drawer-actions">
            <span class="drawer-action-hint">保存成功后会自动关闭右侧抽屉。</span>
            <div class="drawer-action-buttons">
              <el-button @click="handleResetStrategy" :disabled="strategyLoading">恢复当前配置</el-button>
              <el-button type="primary" :loading="savingStrategy" @click="handleSaveStrategy">
                保存策略
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { activityAdminApi, activityPublicApi, recommendationsApi } from '@/utils/api'
import type { ActivityNameInfo, RecommendationStrategyInfo } from '@/utils/api/types'
import { message } from '@/utils/message'
import AdminPageLayout from '@/components/admin/AdminPageLayout.vue'

type StrategyFormState = {
  strategy_name: string
  enabled: boolean
  priority_categories: string[]
  category_boost: number
  pinned_activity_ids: number[]
  pinned_boost: number
  priority_keywords: string[]
  keyword_boost: number
  time_boost: number
  remarks: string
}

type StrategyNumberKey = 'category_boost' | 'pinned_boost' | 'keyword_boost' | 'time_boost'

const STRATEGY_MIN = 0
const STRATEGY_MAX = 10

const strategyLoading = ref(false)
const savingStrategy = ref(false)
const drawerVisible = ref(false)
const categoryOptions = ref<string[]>([])
const activityOptions = ref<ActivityNameInfo[]>([])

const createDefaultStrategyForm = (): StrategyFormState => ({
  strategy_name: '校园活动优先推荐',
  enabled: true,
  priority_categories: [],
  category_boost: 5,
  pinned_activity_ids: [],
  pinned_boost: 8,
  priority_keywords: [],
  keyword_boost: 2,
  time_boost: 1,
  remarks: '',
})

const strategyForm = reactive<StrategyFormState>(createDefaultStrategyForm())
const strategySnapshot = ref<StrategyFormState>(createDefaultStrategyForm())

const activityLabelMap = computed(() => {
  return new Map(activityOptions.value.map((item) => [item.activity_id, item.activity_name]))
})

const formatNumber = (value: number | string | null | undefined): string => {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue.toFixed(1) : '0.0'
}

const clampNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(STRATEGY_MAX, Math.max(STRATEGY_MIN, parsed))
}

const normalizeStrategyNumber = (value: unknown, fallback: number): number => {
  const clamped = clampNumber(value, fallback)
  return Math.round(clamped * 2) / 2
}

const hasStrategyNumberOutOfRange = (value: number): boolean => {
  return value < STRATEGY_MIN || value > STRATEGY_MAX
}

const sanitizeStrategyText = (value: string): string => value.trim()

const sanitizeStrategyPayload = () => {
  const strategy_name = sanitizeStrategyText(strategyForm.strategy_name)
  const remarks = sanitizeStrategyText(strategyForm.remarks)
  const priority_categories = Array.from(new Set(normalizeStringArray(strategyForm.priority_categories)))
  const pinned_activity_ids = Array.from(new Set(normalizeNumberArray(strategyForm.pinned_activity_ids).filter((item) => item > 0)))
  const priority_keywords = Array.from(new Set(normalizeStringArray(strategyForm.priority_keywords)))

  const category_boost = normalizeStrategyNumber(strategyForm.category_boost, 0)
  const pinned_boost = normalizeStrategyNumber(strategyForm.pinned_boost, 0)
  const keyword_boost = normalizeStrategyNumber(strategyForm.keyword_boost, 0)
  const time_boost = normalizeStrategyNumber(strategyForm.time_boost, 0)

  return {
    strategy_name,
    remarks,
    priority_categories,
    pinned_activity_ids,
    priority_keywords,
    category_boost,
    pinned_boost,
    keyword_boost,
    time_boost,
  }
}

const validateStrategyPayload = () => {
  const payload = sanitizeStrategyPayload()

  if (!payload.strategy_name) {
    message.warning('请先填写策略名称')
    return null
  }

  const numericEntries: Array<[StrategyNumberKey, number]> = [
    ['category_boost', payload.category_boost],
    ['pinned_boost', payload.pinned_boost],
    ['keyword_boost', payload.keyword_boost],
    ['time_boost', payload.time_boost],
  ]

  const invalidEntry = numericEntries.find(([, value]) => hasStrategyNumberOutOfRange(value))
  if (invalidEntry) {
    message.warning('加分字段必须在 0~10 之间')
    return null
  }

  return payload
}

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
      .filter((item) => item.length > 0)
  }
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return []
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return normalizeStringArray(parsed)
      }
    } catch {
      return text
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    }
  }
  return []
}

const normalizeNumberArray = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item))
  }
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return []
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        return normalizeNumberArray(parsed)
      }
    } catch {
      return text
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item))
    }
  }
  return []
}

const formatActivityOption = (activity: ActivityNameInfo): string => {
  const statusText = activity.status ? ` · ${activity.status}` : ''
  return `${activity.activity_name} (#${activity.activity_id})${statusText}`
}

const getActivityLabel = (activityId: number): string => {
  return activityLabelMap.value.get(activityId) ?? `活动 #${activityId}`
}

const applyStrategyForm = (strategy?: RecommendationStrategyInfo | null) => {
  const source = strategy ?? null
  const nextForm = source
    ? {
        strategy_name: source.strategy_name || '校园活动优先推荐',
        enabled: Boolean(source.enabled),
        priority_categories: normalizeStringArray(source.priority_categories),
        category_boost: normalizeStrategyNumber(source.category_boost ?? 0, 5),
        pinned_activity_ids: normalizeNumberArray(source.pinned_activity_ids),
        pinned_boost: normalizeStrategyNumber(source.pinned_boost ?? 0, 8),
        priority_keywords: normalizeStringArray(source.priority_keywords),
        keyword_boost: normalizeStrategyNumber(source.keyword_boost ?? 0, 2),
        time_boost: normalizeStrategyNumber(source.time_boost ?? 0, 1),
        remarks: source.remarks ?? '',
      }
    : createDefaultStrategyForm()

  strategyForm.strategy_name = nextForm.strategy_name
  strategyForm.enabled = nextForm.enabled
  strategyForm.priority_categories = [...nextForm.priority_categories]
  strategyForm.category_boost = nextForm.category_boost
  strategyForm.pinned_activity_ids = [...nextForm.pinned_activity_ids]
  strategyForm.pinned_boost = nextForm.pinned_boost
  strategyForm.priority_keywords = [...nextForm.priority_keywords]
  strategyForm.keyword_boost = nextForm.keyword_boost
  strategyForm.time_boost = nextForm.time_boost
  strategyForm.remarks = nextForm.remarks

  strategySnapshot.value = {
    strategy_name: strategyForm.strategy_name,
    enabled: strategyForm.enabled,
    priority_categories: [...strategyForm.priority_categories],
    category_boost: strategyForm.category_boost,
    pinned_activity_ids: [...strategyForm.pinned_activity_ids],
    pinned_boost: strategyForm.pinned_boost,
    priority_keywords: [...strategyForm.priority_keywords],
    keyword_boost: strategyForm.keyword_boost,
    time_boost: strategyForm.time_boost,
    remarks: strategyForm.remarks,
  }
}

const loadReferenceData = async () => {
  try {
    const [categoriesRes, activitiesRes] = await Promise.all([
      activityPublicApi.getCategories(),
      activityAdminApi.getNames(),
    ])
    categoryOptions.value = categoriesRes.data?.list || []
    activityOptions.value = activitiesRes.data?.list || []
  } catch (error) {
    console.error('加载推荐策略参考数据失败:', error)
  }
}

const loadStrategy = async () => {
  strategyLoading.value = true
  try {
    const res = await recommendationsApi.getStrategy()
    applyStrategyForm(res.data?.strategy || null)
    const firstCategory = categoryOptions.value[0]
    if (!strategyForm.priority_categories.length && firstCategory) {
      strategyForm.priority_categories = [firstCategory]
    }
  } catch (error) {
    console.error('加载推荐策略失败:', error)
    applyStrategyForm(null)
  } finally {
    strategyLoading.value = false
  }
}

const handleResetStrategy = () => {
  applyStrategyForm(strategySnapshot.value)
}

const handleSaveStrategy = async () => {
  const strategyName = strategyForm.strategy_name.trim()
  if (!strategyName) {
    message.warning('请先填写策略名称')
    return
  }

  savingStrategy.value = true
  try {
    const payload = validateStrategyPayload()
    if (!payload) {
      return
    }

    await recommendationsApi.updateStrategy({
      strategy_name: payload.strategy_name,
      enabled: strategyForm.enabled,
      priority_categories: payload.priority_categories,
      category_boost: payload.category_boost,
      pinned_activity_ids: payload.pinned_activity_ids,
      pinned_boost: payload.pinned_boost,
      priority_keywords: payload.priority_keywords,
      keyword_boost: payload.keyword_boost,
      time_boost: payload.time_boost,
      remarks: payload.remarks,
    })
    await loadStrategy()
    drawerVisible.value = false
  } catch (error) {
    console.error('保存推荐策略失败:', error)
  } finally {
    savingStrategy.value = false
  }
}

onMounted(async () => {
  await loadReferenceData()
  await loadStrategy()
})
</script>

<style scoped>
.strategy-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 20px;
}

.strategy-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
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
  flex-wrap: wrap;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.card-subtitle {
  color: #667085;
  font-size: 13px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.strategy-scroll {
  flex: 1;
  min-height: 0;
  overflow: visible;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.strategy-drawer :deep(.el-drawer__body) {
  padding: 0;
  overflow: hidden;
}

.strategy-drawer :deep(.el-drawer) {
  max-width: 840px;
}

.drawer-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px 18px 20px;
  box-sizing: border-box;
  background: #ffffff;
}

.drawer-tip {
  color: #667085;
  font-size: 13px;
  margin-bottom: 12px;
}

.drawer-summary {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  margin-bottom: 16px;
  border: 1px solid #e6edf5;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.drawer-summary-main {
  min-width: 0;
}

.drawer-summary-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.drawer-summary-desc {
  margin-top: 6px;
  color: #667085;
  font-size: 13px;
  line-height: 1.6;
}

.drawer-summary-tags {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.drawer-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.drawer-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
  padding-bottom: 28px;
}

.strategy-drawer :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px 14px;
  border-bottom: 1px solid #ebeef5;
}

.drawer-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-section {
  padding: 16px 16px 4px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.form-section:last-child {
  margin-bottom: 12px;
}

.form-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.form-section-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
}

.form-section-subtitle {
  display: block;
  margin-top: 4px;
  color: #667085;
  font-size: 12px;
}

.section-hint {
  margin: -4px 0 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px dashed #d0d5dd;
  color: #667085;
  font-size: 12px;
}

.drawer-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.drawer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.drawer-action-hint {
  color: #667085;
  font-size: 12px;
}

.drawer-action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.section-card {
  border: 1px solid #ebeef5;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-tip {
  color: #909399;
  font-size: 12px;
}

.strategy-card :deep(.el-descriptions) {
  font-size: 15px;
}

.strategy-card :deep(.el-descriptions__label) {
  font-size: 14px;
  color: #667085;
}

.strategy-card :deep(.el-descriptions__content) {
  font-size: 16px;
  line-height: 1.7;
}

.strategy-card :deep(.el-descriptions__cell) {
  padding-top: 16px;
  padding-bottom: 16px;
}

.overview-actions {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px dashed #d0d5dd;
  border-radius: 10px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.overview-hint {
  color: #667085;
  font-size: 13px;
}

.edit-link {
  padding-left: 0;
  padding-right: 0;
  font-weight: 600;
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.summary-empty {
  color: #909399;
  font-size: 13px;
}

.full-width {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

@media (max-width: 768px) {
  .strategy-drawer :deep(.el-drawer) {
    max-width: 100vw;
  }

  .drawer-summary,
  .card-header,
  .header-right,
  .overview-actions,
  .drawer-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .header-right > *,
  .overview-actions > *,
  .drawer-action-buttons > * {
    width: 100%;
  }

  .drawer-actions {
    align-items: stretch;
  }
}
</style>