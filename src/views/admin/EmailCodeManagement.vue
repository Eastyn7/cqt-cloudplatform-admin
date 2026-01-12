<template>
  <div class="email-code-management">
    <el-page-header @back="handleBack">
      <template #content>
        <span class="page-title">邮箱验证码管理</span>
      </template>
    </el-page-header>

    <div class="content">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">验证码列表</span>
              <el-form
                :model="searchForm"
                inline
                label-width="0"
                @submit.prevent
                class="search-form"
              >
                <el-form-item>
                  <el-input
                    v-model="searchForm.email"
                    placeholder="邮箱地址"
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
                    v-model="searchForm.type"
                    placeholder="验证码类型"
                    clearable
                    class="search-select"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="注册" value="register" />
                    <el-option label="登录" value="login" />
                    <el-option label="重置密码" value="reset_password" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-select
                    v-model="searchForm.verified"
                    placeholder="验证状态"
                    clearable
                    class="search-select"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="未验证" :value="0" />
                    <el-option label="已验证" :value="1" />
                  </el-select>
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
              <el-button type="warning" @click="handleCleanup" class="cleanup-btn">
                <el-icon>
                  <Delete />
                </el-icon>
                清理验证码
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table :data="tableData" v-loading="loading" border stripe table-layout="auto">
            <el-table-column type="index" label="序号" width="60" align="center">
              <template #default="{ $index }">
                {{ $index + 1 + (pagination.page - 1) * pagination.pageSize }}
              </template>
            </el-table-column>
            <el-table-column prop="email" label="邮箱地址" min-width="200" />
            <el-table-column prop="code" label="验证码" width="120" align="center" />
            <el-table-column prop="type" label="类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getTypeTagType(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="verified" label="验证状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.verified === 1 ? 'success' : 'info'">
                  {{ row.verified === 1 ? '已验证' : '未验证' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="expires_at" label="过期时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.expires_at) || '--' }}</span>
                <el-tag
                  v-if="isExpired(row.expires_at)"
                  type="danger"
                  size="small"
                  style="margin-left: 8px"
                >
                  已过期
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                <span>{{ dateUtil.formatTime(row.created_at) || '--' }}</span>
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
    </div>

    <!-- 清理验证码对话框 -->
    <el-dialog
      v-model="cleanupDialogVisible"
      title="清理验证码"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="cleanup-dialog-content">
        <div class="cleanup-mode-select">
          <el-radio-group v-model="cleanupMode">
            <el-radio label="all">清理所有过期或已验证的记录</el-radio>
            <el-radio label="days">清理指定天数前的记录</el-radio>
          </el-radio-group>
        </div>

        <div v-if="cleanupMode === 'days'" class="cleanup-days-input">
          <el-form-item label="天数" label-width="80px">
            <el-input-number
              v-model="cleanupDays"
              :min="1"
              :max="365"
              placeholder="请输入天数"
              style="width: 100%"
            />
          </el-form-item>
          <div class="cleanup-tip">将删除 {{ cleanupDays }} 天前创建的所有验证码记录</div>
        </div>

        <div v-else class="cleanup-tip">
          将删除所有已过期（expires_at &lt; NOW()）或已验证（verified = 1）的记录
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cleanupDialogVisible = false">取消</el-button>
          <el-button type="warning" :loading="cleanupLoading" @click="handleConfirmCleanup">
            确定清理
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import { emailApi } from '@/utils/api'
import type { EmailCodeInfo, GetEmailCodeListParams } from '@/utils/api/types'
import { useDate } from '@/utils/date'
import dayjs from 'dayjs'

const router = useRouter()
const dateUtil = useDate

const loading = ref(false)
const tableData = ref<EmailCodeInfo[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const searchForm = reactive({
  email: '',
  type: '',
  verified: '' as '' | 0 | 1,
})

const cleanupDialogVisible = ref(false)
const cleanupMode = ref<'all' | 'days'>('all')
const cleanupDays = ref<number>(1)
const cleanupLoading = ref(false)

const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    register: '注册',
    login: '登录',
    reset_password: '重置密码',
  }
  return typeMap[type] || type
}

const getTypeTagType = (
  type: string
): 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined => {
  const typeMap: Record<string, 'success' | 'warning' | 'primary' | 'info' | 'danger' | undefined> =
    {
      register: 'primary',
      login: 'success',
      reset_password: 'warning',
    }
  return typeMap[type] || undefined
}

const isExpired = (expiresAt: string): boolean => {
  if (!expiresAt) return false
  return dayjs(expiresAt).isBefore(dayjs())
}

const handleBack = () => {
  router.push('/admin/dashboard')
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleResetFilters = () => {
  searchForm.email = ''
  searchForm.type = ''
  searchForm.verified = ''
  handleSearch()
}

const handleCleanup = () => {
  cleanupMode.value = 'all'
  cleanupDays.value = 1
  cleanupDialogVisible.value = true
}

const handleConfirmCleanup = async () => {
  if (cleanupMode.value === 'days' && (!cleanupDays.value || cleanupDays.value < 1)) {
    ElMessage.warning('请输入有效的天数（1-365）')
    return
  }

  try {
    cleanupLoading.value = true
    const daysBefore = cleanupMode.value === 'days' ? cleanupDays.value : undefined
    const res = await emailApi.cleanup(daysBefore)
    if (res.data?.deleted !== undefined) {
      const message =
        cleanupMode.value === 'days'
          ? `已清理 ${res.data.deleted} 条 ${cleanupDays.value} 天前的验证码记录`
          : `已清理 ${res.data.deleted} 条过期或已验证的验证码记录`
      ElMessage.success(message)
      cleanupDialogVisible.value = false
      await loadData()
    }
  } catch (error) {
    console.error('清理验证码失败:', error)
    ElMessage.error('清理验证码失败')
  } finally {
    cleanupLoading.value = false
  }
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

const loadData = async () => {
  try {
    loading.value = true
    const params: GetEmailCodeListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.email) {
      params.email = searchForm.email
    }
    if (searchForm.type) {
      params.type = searchForm.type
    }
    if (searchForm.verified !== '') {
      params.verified = searchForm.verified
    }
    const res = await emailApi.getAll(params)
    if (res.data?.list) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination.total || 0
      if (res.data.pagination.page) {
        pagination.page = res.data.pagination.page
      }
      if (res.data.pagination.pageSize) {
        pagination.pageSize = res.data.pagination.pageSize
      }
    }
  } catch (error) {
    console.error('加载验证码列表失败:', error)
    ElMessage.error('加载验证码列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.email-code-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cleanup-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.table-wrapper :deep(.el-table) {
  height: 100%;
}

.table-wrapper :deep(.el-table__body-wrapper) {
  overflow: auto;
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

.cleanup-dialog-content {
  padding: 8px 0;
}

.cleanup-mode-select {
  margin-bottom: 20px;
}

.cleanup-mode-select :deep(.el-radio-group) {
  gap: 12px;
}

.cleanup-days-input {
  margin-top: 16px;
}

.cleanup-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 12px;
  line-height: 1.6;
}
</style>
