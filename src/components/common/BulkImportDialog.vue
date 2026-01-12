<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    class="bulk-import-dialog"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="dialog-body">
      <div v-if="fieldHints?.length" class="field-hints">
        <div class="field-title">字段说明</div>
        <ul>
          <li v-for="hint in fieldHints" :key="hint.key">
            <code>{{ hint.key }}</code>
            <span v-if="hint.required" class="required">*</span>
            ：{{ hint.label }}
            <span v-if="hint.description" class="hint-desc">（{{ hint.description }}）</span>
          </li>
        </ul>
      </div>

      <div v-if="example" class="field-title">JSON 示例</div>
      <pre v-if="example" class="import-example">{{ example }}</pre>

      <div class="field-title">粘贴 JSON 数据</div>
      <el-input
        v-model="importText"
        type="textarea"
        :rows="10"
        class="import-textarea"
        :placeholder="jsonPlaceholder"
        :disabled="importLoading"
      />
      <div v-if="importError" class="import-error">{{ importError }}</div>

      <div class="field-title">或导入 Excel 文件（{{ excelAccept }}）</div>
      <el-upload
        drag
        :accept="excelAccept"
        :auto-upload="false"
        :show-file-list="false"
        :before-upload="handleExcelUpload"
        :disabled="importLoading"
        class="import-upload"
      >
        <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
        <div class="upload-tip">Excel 第一行应与字段说明中的 key 对应</div>
      </el-upload>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div />
        <div class="footer-actions">
          <el-button @click="handleClose" :disabled="importLoading">取消</el-button>
          <el-button type="primary" @click="handleImportConfirm" :loading="importLoading"
            >确认导入</el-button
          >
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { UploadRawFile } from 'element-plus'
import { readExcelRows } from '@/utils/excel'
import { useJsonImportWorker } from '@/lib/utils'

// 统一定义一行导入数据的结构（按字段名索引）
type ImportRow = Record<string, string | number | boolean | null | undefined>

// 初始化 worker
const { parseJson, cleanup } = useJsonImportWorker<ImportRow>()

// 每个字段在弹窗中展示的说明配置
export interface FieldHint {
  key: string
  label: string
  required?: boolean
  description?: string
}

// 弹窗对外暴露的 props 配置
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    fieldHints?: FieldHint[]
    example?: string
    jsonPlaceholder?: string
    excelAccept?: string
    defaultValue?: string | number | boolean | null
  }>(),
  {
    title: '导入 JSON / Excel 数据',
    jsonPlaceholder: '粘贴 JSON 数组，例如：[ { "name": "张三" } ]',
    excelAccept: '.xlsx,.xls',
    defaultValue: '',
  }
)

// 对外抛出事件：关闭弹窗和导入数据
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'import', rows: ImportRow[]): void
}>()

// 弹窗内部的表单状态
const importText = ref('')
const importError = ref('')
const importLoading = ref(false)

// 当弹窗重新打开时重置输入和错误信息
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      importText.value = ''
      importError.value = ''
    }
  }
)

// 关闭弹窗
const closeDialog = () => {
  emit('update:modelValue', false)
}

// 将解析得到的多行数据抛给父组件
const emitRows = (rows: ImportRow[]) => {
  emit('import', rows)
  closeDialog()
}

// 处理 JSON 文本导入（使用 Worker 异步解析，避免页面卡顿）
const handleImportConfirm = async () => {
  importError.value = ''
  if (!importText.value.trim()) {
    importError.value = '请输入 JSON 数据'
    return
  }

  importLoading.value = true
  await nextTick()
  try {
    // 使用 Worker 异步解析 JSON，避免阻塞主线程
    const data = await parseJson(importText.value)

    if (!Array.isArray(data) || data.length === 0) {
      importError.value = '必须是非空的对象数组'
      return
    }

    emitRows(data)
  } catch (error) {
    console.error('JSON 解析失败:', error)
    importError.value = error instanceof Error ? error.message : 'JSON 格式错误，请检查'
  } finally {
    importLoading.value = false
  }
}

// 处理 Excel 文件上传并解析为行数据
const handleExcelUpload = async (file: UploadRawFile) => {
  importLoading.value = true
  try {
    const rows = await readExcelRows<ImportRow>(file, {
      defaultValue: props.defaultValue ?? '',
    })
    if (!rows.length) {
      ElMessage.warning('Excel 中没有可导入的数据')
      return false
    }
    emitRows(rows)
  } catch (error) {
    console.error('导入 Excel 失败:', error)
    ElMessage.error('导入 Excel 失败，请检查文件')
  } finally {
    importLoading.value = false
  }
  return false
}

// 统一的关闭入口（点击右上角或底部取消按钮）
const handleClose = () => {
  // 清理 worker 资源
  cleanup()
  closeDialog()
}

// 组件卸载时清理 worker
onBeforeUnmount(() => {
  cleanup()
})
</script>

<style scoped>
:global(.bulk-import-dialog) {
  width: min(80vw, 960px);
  max-width: 960px;
  height: 85vh;
  max-height: 90vh;
  margin: 0 auto !important;
  top: 50% !important;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
}

.dialog-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

:global(.bulk-import-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0px 10px 15px 10px;
}

:global(.bulk-import-dialog .el-dialog__body) {
  flex: 1;
  overflow: auto;
  padding: 10px 10px;
  padding-right: 30px;
}

:global(.bulk-import-dialog .el-dialog__footer) {
  border-top: 1px solid var(--el-border-color-light);
  padding: 16px 24px;
}

.dialog-body.loading-active {
  pointer-events: none;
}

.dialog-body.loading-active > *:not(.custom-mask) {
  opacity: 0.6;
}

.field-hints ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.field-hints li {
  margin-bottom: 4px;
  line-height: 1.6;
}

.field-title {
  font-weight: 600;
  margin-top: 8px;
}

.required {
  color: #f56c6c;
  margin-left: 4px;
}

.hint-desc {
  color: #909399;
  font-size: 12px;
}

.import-example {
  background: #1f2933;
  color: #e5e9f0;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  overflow: visible;
  white-space: pre-wrap;
}

.import-textarea {
  width: 100%;
}

.import-error {
  color: #f56c6c;
  margin-top: -8px;
}

.import-upload {
  width: 100%;
}

.upload-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
