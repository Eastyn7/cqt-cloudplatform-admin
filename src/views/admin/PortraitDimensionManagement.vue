<template>
  <AdminPageLayout title="画像维度管理">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">维度列表</span>
              <el-form
                :model="query"
                inline
                label-width="0"
                @submit.prevent
                class="search-form"
              >
                <el-form-item>
                  <el-input
                    v-model="query.search"
                    clearable
                    placeholder="搜索维度名称/编码"
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
                    v-model="query.enabled"
                    clearable
                    placeholder="启用状态"
                    class="search-select"
                  >
                    <el-option label="启用" :value="1" />
                    <el-option label="禁用" :value="0" />
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
              <el-button type="primary" @click="openCreateDialog">
                <el-icon>
                  <Plus />
                </el-icon>
                新增维度
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="dimension_id" label="ID" width="80" />
        <el-table-column prop="dimension_name" label="维度名称" min-width="160" />
        <el-table-column prop="dimension_code" label="维度编码" min-width="160" />
        <el-table-column prop="keywords" label="关键词" min-width="220" show-overflow-tooltip />
        <el-table-column prop="weight" label="权重" width="100" align="center" />
        <el-table-column prop="sort_order" label="排序" width="100" align="center" />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link :type="row.enabled ? 'warning' : 'success'" @click="toggleEnabled(row)">
              {{ row.enabled ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
          </el-table>
        </div>

        <div class="pagination-container">
          <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.pageSize"
            :total="paginationTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="580px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="维度名称" prop="dimension_name">
          <el-input v-model="form.dimension_name" placeholder="如：组织协调" />
        </el-form-item>
        <el-form-item label="维度编码" prop="dimension_code">
          <el-input v-model="form.dimension_code" placeholder="如：organization" />
        </el-form-item>
        <el-form-item label="关键词" prop="keywords">
          <el-input
            v-model="form.keywords"
            type="textarea"
            :rows="3"
            placeholder="多个关键词用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="权重" prop="weight">
          <el-input-number v-model="form.weight" :min="0" :step="0.1" :precision="1" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import AdminPageLayout from '@/components/admin/AdminPageLayout.vue'
import { portraitDimensionsApi } from '@/utils/api'
import type { PortraitDimensionInfo, PortraitDimensionPageParams } from '@/utils/api/types'

const loading = ref(false)
const saving = ref(false)
const tableData = ref<PortraitDimensionInfo[]>([])
const paginationTotal = ref(0)

const query = reactive<PortraitDimensionPageParams>({
  page: 1,
  pageSize: 10,
  search: '',
  enabled: undefined,
})

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  dimension_name: '',
  dimension_code: '',
  keywords: '',
  weight: 1,
  sort_order: 1,
  enabled: 1,
})

const rules: FormRules = {
  dimension_name: [{ required: true, message: '请输入维度名称', trigger: 'blur' }],
  dimension_code: [{ required: true, message: '请输入维度编码', trigger: 'blur' }],
  keywords: [{ required: true, message: '请输入关键词', trigger: 'blur' }],
}

const dialogTitle = computed(() => (editingId.value ? '编辑维度' : '新增维度'))

const resetForm = () => {
  form.dimension_name = ''
  form.dimension_code = ''
  form.keywords = ''
  form.weight = 1
  form.sort_order = 1
  form.enabled = 1
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await portraitDimensionsApi.page({ ...query })
    tableData.value = res.data?.list || []
    paginationTotal.value = res.data?.pagination?.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  query.page = 1
  await loadData()
}

const handleReset = async () => {
  query.search = ''
  query.enabled = undefined
  query.page = 1
  query.pageSize = 10
  await loadData()
}

const handlePageSizeChange = async (size: number) => {
  query.pageSize = size
  query.page = 1
  await loadData()
}

const handlePageChange = async (page: number) => {
  query.page = page
  await loadData()
}

const openCreateDialog = () => {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row: PortraitDimensionInfo) => {
  editingId.value = row.dimension_id
  form.dimension_name = row.dimension_name
  form.dimension_code = row.dimension_code
  form.keywords = row.keywords
  form.weight = Number(row.weight || 1)
  form.sort_order = Number(row.sort_order || 1)
  form.enabled = Number(row.enabled ? 1 : 0)
  dialogVisible.value = true
}

const submitForm = async () => {
  const passed = await formRef.value?.validate().catch(() => false)
  if (!passed) return
  saving.value = true
  try {
    const payload = {
      dimension_name: form.dimension_name.trim(),
      dimension_code: form.dimension_code.trim(),
      keywords: form.keywords.trim(),
      weight: Number(form.weight),
      sort_order: Number(form.sort_order),
      enabled: Number(form.enabled),
    }

    if (editingId.value) {
      await portraitDimensionsApi.update(editingId.value, payload)
    } else {
      await portraitDimensionsApi.create(payload)
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

const toggleEnabled = async (row: PortraitDimensionInfo) => {
  await portraitDimensionsApi.update(row.dimension_id, {
    enabled: row.enabled ? 0 : 1,
  })
  await loadData()
}

const removeRow = async (row: PortraitDimensionInfo) => {
  await ElMessageBox.confirm(`确认删除维度「${row.dimension_name}」吗？`, '删除确认', {
    type: 'warning',
  })
  await portraitDimensionsApi.remove(row.dimension_id)
  await loadData()
}

onMounted(loadData)
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

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.table-wrapper :deep(.el-table__row) {
  height: 54px;
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
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
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
