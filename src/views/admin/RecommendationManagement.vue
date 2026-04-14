<template>
  <AdminPageLayout title="推荐审计">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">推荐记录</span>
            <el-form
              :model="searchForm"
              inline
              label-width="0"
              @submit.prevent
              class="search-form"
            >
              <el-form-item>
                <el-input
                  v-model="searchForm.student_id"
                  placeholder="按学号筛选"
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
                <el-input-number
                  v-model="searchForm.activity_id"
                  placeholder="活动ID"
                  :min="1"
                  controls-position="right"
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
                <el-button @click="handleReset" class="reset-btn">
                  <el-icon>
                    <Refresh />
                  </el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          <div class="header-right">
            <el-input
              v-model="refreshForm.student_id"
              placeholder="输入学号后刷新推荐"
              clearable
              class="refresh-input"
            />
            <el-input-number
              v-model="refreshForm.limit"
              :min="1"
              :max="50"
              controls-position="right"
              class="refresh-limit"
            />
            <el-button type="success" :loading="refreshLoading" @click="handleRefreshByStudent">
              手动刷新
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table :data="tableData" v-loading="loading" border stripe>
          <el-table-column type="index" label="序号" width="70" align="center">
            <template #default="{ $index }">
              {{ $index + 1 + (pagination.page - 1) * pagination.pageSize }}
            </template>
          </el-table-column>
          <el-table-column prop="student_id" label="学号" width="140" />
          <el-table-column prop="activity_id" label="活动ID" width="100" align="center" />
          <el-table-column prop="activity_name" label="活动名称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="category" label="类别" width="120" align="center">
            <template #default="{ row }">
              {{ row.category || '未分类' }}
            </template>
          </el-table-column>
          <el-table-column prop="score" label="评分" width="100" align="center">
            <template #default="{ row }">
              {{ Number(row.score || 0).toFixed(1) }}
            </template>
          </el-table-column>
          <el-table-column label="推荐理由" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="reason-tags">
                <el-tag
                  v-for="reason in parseReasons(row.reasons)"
                  :key="`${row.recommendation_id}-${reason}`"
                  size="small"
                  effect="plain"
                >
                  {{ reason }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="updated_at" label="更新时间" width="180">
            <template #default="{ row }">
              {{ dateUtil.formatTime(row.updated_at) || '--' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :loading="refreshRowLoading === row.student_id"
                @click="handleRefreshSingle(row.student_id)"
              >
                刷新该用户
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
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { recommendationsApi } from '@/utils/api'
import type { RecommendationRecord } from '@/utils/api/types'
import { message } from '@/utils/message'
import { useDate } from '@/utils/date'
import AdminPageLayout from '@/components/admin/AdminPageLayout.vue'

const dateUtil = useDate

const loading = ref(false)
const refreshLoading = ref(false)
const refreshRowLoading = ref('')
const tableData = ref<RecommendationRecord[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const searchForm = reactive({
  student_id: '',
  activity_id: undefined as number | undefined,
})

const refreshForm = reactive({
  student_id: '',
  limit: 10,
})

const parseReasons = (value: RecommendationRecord['reasons']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  }
  if (typeof value === 'string') {
    const text = value.trim()
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

const loadData = async () => {
  loading.value = true
  try {
    const res = await recommendationsApi.page({
      page: pagination.page,
      pageSize: pagination.pageSize,
      student_id: searchForm.student_id || undefined,
      activity_id: searchForm.activity_id,
    })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.pagination.total || 0
  } catch (error) {
    console.error('加载推荐记录失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.student_id = ''
  searchForm.activity_id = undefined
  handleSearch()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleRefreshSingle = async (studentId: string) => {
  if (!studentId) return
  refreshRowLoading.value = studentId
  try {
    await recommendationsApi.refresh({ student_id: studentId, limit: refreshForm.limit || 10 })
    await loadData()
  } catch (error) {
    console.error('刷新推荐失败:', error)
  } finally {
    refreshRowLoading.value = ''
  }
}

const handleRefreshByStudent = async () => {
  if (!refreshForm.student_id.trim()) {
    message.warning('请先输入要刷新的学号')
    return
  }

  refreshLoading.value = true
  try {
    await recommendationsApi.refresh({
      student_id: refreshForm.student_id.trim(),
      limit: refreshForm.limit || 10,
    })
    await loadData()
  } catch (error) {
    console.error('刷新推荐失败:', error)
  } finally {
    refreshLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: 20px;
}

.table-card :deep(.el-card__body) {
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

.search-input {
  width: 200px !important;
  min-width: 200px;
}

.search-btn,
.reset-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.refresh-input {
  width: 200px !important;
  min-width: 200px;
}

.refresh-limit {
  width: 120px !important;
  min-width: 100px;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

.table-wrapper :deep(.el-table__row) {
  height: 54px;
}

.table-wrapper :deep(.el-table) {
  min-height: 100%;
}

.pagination-container {
  margin-top: 0;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
  background-color: #ffffffac;
}

.reason-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

@media (max-width: 1200px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left,
  .header-right {
    width: 100%;
  }

  .search-input,
  .refresh-input {
    width: 100% !important;
    max-width: 100%;
    flex: 1;
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .search-form,
  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .search-form :deep(.el-form-item),
  .header-right > * {
    width: 100%;
    margin-bottom: 8px;
  }

  .search-input,
  .refresh-input {
    width: 100% !important;
  }
}
</style>