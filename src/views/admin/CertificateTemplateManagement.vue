<template>
  <AdminPageLayout title="证书模板">
      <el-card class="table-card">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="card-title">模板列表</span>
              <el-form
                :model="searchForm"
                inline
                label-width="0"
                @submit.prevent
                class="search-form"
              >
                <el-form-item>
                  <el-input
                    v-model="searchForm.keyword"
                    placeholder="模板名称"
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
                    v-model="searchForm.template_usage"
                    placeholder="模板用途"
                    clearable
                    class="search-select"
                  >
                    <el-option
                      v-for="option in templateUsageOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
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
              <el-button type="primary" @click="openEditor()">
                <el-icon>
                  <Plus />
                </el-icon>
                新建模板
              </el-button>
            </div>
          </div>
        </template>

        <div class="table-wrapper">
          <el-table v-loading="loading" :data="tableData" class="template-table" height="100%">
            <el-table-column type="index" width="60" />
            <el-table-column prop="template_name" label="模板名称" min-width="220" />
            <el-table-column label="模板用途" min-width="140">
              <template #default="{ row }">
                {{ formatTemplateUsageLabel(row.template_usage) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'">
                  {{ row.enabled ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="更新时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.updated_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="300" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openEditor(row)">编辑</el-button>
                <el-button
                  v-if="!row.enabled"
                  link
                  type="success"
                  @click="handleActivateTemplate(row)"
                >
                  设为生效
                </el-button>
                <el-button
                  link
                  :type="row.enabled ? 'warning' : 'success'"
                  @click="toggleTemplate(row)"
                >
                  {{ row.enabled ? '停用' : '启用' }}
                </el-button>
                <el-button link type="danger" @click="removeTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-container">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :total="pagination.total"
            :page-size="pagination.pageSize"
            :current-page="pagination.page"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

    <el-dialog
      v-model="editorVisible"
      :title="editorTitle"
      width="90%"
      top="6vh"
      class="template-editor-dialog"
      :close-on-click-modal="false"
      @closed="handleEditorClosed"
      destroy-on-close
    >
      <div class="editor-layout">
        <div class="editor-left">
          <div class="editor-toolbar">
            <div class="toolbar-left">
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                accept="image/png,image/jpeg,image/webp"
                :disabled="templateUploading"
                @change="handleTemplateChange"
              >
                <el-button :loading="templateUploading" type="primary">上传背景图</el-button>
              </el-upload>
              <el-progress
                v-if="templateUploading"
                :percentage="templateProgress"
                :stroke-width="4"
                status="success"
                class="upload-progress"
              />
              <el-button @click="fitToContainer" :disabled="!canvasReady">适配宽度</el-button>
            </div>
            <div class="toolbar-right">
              <el-button @click="fitToContainer" :disabled="!canvasReady">适配画布</el-button>
            </div>
          </div>

          <div class="canvas-wrapper">
            <div ref="canvasContainer" class="canvas-stage">
              <div class="canvas-container">
                <canvas ref="canvasRef" />
                <div v-if="!editorForm.template_url" class="canvas-placeholder">
                  <el-icon :size="32"><Picture /></el-icon>
                  <span>请上传证书背景图</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="editor-right">
          <el-form :model="editorForm" label-width="88px" class="editor-form">
            <el-form-item label="模板名称">
              <el-input v-model="editorForm.template_name" placeholder="请输入模板名称" />
            </el-form-item>
            <el-form-item label="模板用途">
              <el-select v-model="editorForm.template_usage" placeholder="请选择模板用途" style="width: 100%">
                <el-option
                  v-for="option in templateUsageOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <div class="form-hint">我的志愿证书默认使用 service_hours 用途模板。</div>
            </el-form-item>
            <el-form-item label="启用状态">
              <el-switch v-model="editorForm.enabled" active-text="启用" inactive-text="停用" />
            </el-form-item>
            <el-form-item label="生效策略">
              <el-switch v-model="editorForm.activate_now" active-text="设为当前生效" inactive-text="仅保存" />
              <div class="form-hint">设为生效后，会自动关闭同用途下旧模板。</div>
            </el-form-item>
            <el-form-item label="画布尺寸">
              <div class="canvas-size-readonly">A4 横版比例（3508 × 2480）</div>
              <div class="form-hint">背景图会居中铺满画布，字段坐标按图片比例计算。</div>
            </el-form-item>
          </el-form>

          <el-divider>字段设置</el-divider>

          <div class="field-actions">
            <el-select v-model="fieldPresetKey" placeholder="选择字段">
              <el-option
                v-for="field in fieldPresets"
                :key="field.key"
                :label="field.label"
                :value="field.key"
              />
              <el-option label="自定义字段" value="custom" />
            </el-select>
            <el-input
              v-if="fieldPresetKey === 'custom'"
              v-model="customFieldKey"
              placeholder="字段 key"
              class="custom-field-input"
            />
            <el-input
              v-if="fieldPresetKey === 'custom'"
              v-model="customFieldLabel"
              placeholder="显示名称"
              class="custom-field-input"
            />
            <div class="form-hint field-hint">证书编号（cert_no）和电子公章（seal）可直接添加，后端会按模板坐标自动渲染。</div>
            <div class="field-action-buttons">
              <el-button type="primary" @click="addField" :disabled="!canvasReady">添加字段</el-button>
              <el-button @click="removeSelectedField" :disabled="!selectedObject">删除字段</el-button>
            </div>
          </div>

          <div class="field-scroll">
            <el-form v-if="selectedObject" label-width="88px" class="field-form">
            <el-form-item label="字段 key">
              <el-input v-model="selectedField.key" disabled />
              <div class="form-hint">key 是后端填充数据的字段标识，例如 name / hours / date。</div>
            </el-form-item>
            <el-form-item label="字段类型">
              <el-tag :type="selectedField.fieldType === 'image' ? 'warning' : 'success'">
                {{ selectedField.fieldType === 'image' ? '图片字段' : '文本字段' }}
              </el-tag>
            </el-form-item>
            <el-form-item v-if="selectedField.fieldType !== 'image'" label="显示文本">
              <el-input v-model="selectedField.text" @change="applyFieldText" />
              <div class="form-hint">显示文本是画布上的预览内容，保存后仍以 key 匹配数据。</div>
            </el-form-item>
            <el-form-item v-else label="显示文本">
              <div class="form-readonly">电子公章</div>
              <div class="form-hint">图片字段仅保存位置、尺寸和透明度，后端会自动叠加实际公章。</div>
            </el-form-item>
            <el-form-item v-if="selectedField.fieldType !== 'image'" label="字体">
              <div class="form-readonly">思源黑体</div>
              <div class="form-hint">字体已固定为思源黑体，不可修改。</div>
            </el-form-item>
            <el-form-item v-if="selectedField.fieldType !== 'image'" label="字号">
              <el-input-number v-model="selectedField.fontSize" :min="12" :max="200" @change="applyFieldStyle" />
            </el-form-item>
            <el-form-item v-if="selectedField.fieldType !== 'image'" label="对齐">
              <el-radio-group v-model="selectedField.align" @change="applyFieldStyle">
                <el-radio-button value="left">左对齐</el-radio-button>
                <el-radio-button value="center">居中</el-radio-button>
                <el-radio-button value="right">右对齐</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="selectedField.fieldType !== 'image'" label="字重">
              <el-radio-group v-model="selectedField.fontWeight" @change="applyFieldStyle">
                <el-radio-button value="normal">常规</el-radio-button>
                <el-radio-button value="bold">加粗</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="selectedField.fieldType !== 'image'" label="颜色">
              <div class="form-readonly">黑色</div>
              <div class="form-hint">颜色已固定为黑色，不可修改。</div>
            </el-form-item>
            <el-form-item v-if="selectedField.fieldType === 'image'" label="公章尺寸">
              <div class="position-inputs">
                <el-input-number v-model="selectedField.width" :min="40" :max="600" @change="applyFieldStyle" />
                <el-input-number v-model="selectedField.height" :min="40" :max="600" @change="applyFieldStyle" />
              </div>
            </el-form-item>
            <el-form-item v-if="selectedField.fieldType === 'image'" label="透明度">
              <el-input-number
                v-model="selectedField.opacity"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                @change="applyFieldStyle"
              />
              <div class="form-hint">公章字段会在后端自动叠加，前端仅负责位置和尺寸配置。</div>
            </el-form-item>
            <el-form-item label="位置">
              <div class="position-inputs">
                <el-input-number v-model="selectedField.x" :min="0" @change="applyFieldPosition" />
                <el-input-number v-model="selectedField.y" :min="0" @change="applyFieldPosition" />
              </div>
            </el-form-item>
            </el-form>
          </div>

          <div class="editor-actions">
            <el-button @click="closeEditor">取消</el-button>
            <el-button type="primary" @click="saveTemplate" :loading="saving">保存模板</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </AdminPageLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Plus, Refresh, Search, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { fabric } from 'fabric'
import AdminPageLayout from '@/components/admin/AdminPageLayout.vue'
import {
  certificateTemplateApi,
} from '@/utils/api'
import type {
  CertificateTemplateInfo,
  CertificateTemplateField,
} from '@/utils/api/types'
import { formatDateTime } from '@/utils/date'
import {
  uploadToOssWithKey,
  validateFileSize,
  validateFileType,
  getSignedOssUrl,
} from '@/utils/oss'

interface FieldPreset {
  key: string
  label: string
  fieldType: 'text' | 'image'
}

interface CanvasSize {
  width: number
  height: number
}

interface TemplateEditorForm {
  template_id?: number
  template_name: string
  template_key: string
  template_url: string
  template_usage: string
  activate_now: boolean
  enabled: boolean
}

interface SelectedFieldForm {
  key: string
  text: string
  fieldType: 'text' | 'image'
  fontFamily: string
  fontSize: number
  align: 'left' | 'center' | 'right'
  fontWeight: 'normal' | 'bold'
  color: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
  assetKey: string
}

type FabricFieldObject = fabric.Object & {
  dataKey?: string
  displayLabel?: string
  fieldType?: 'text' | 'image'
  text?: string
  textAlign?: 'left' | 'center' | 'right'
  fontFamily?: string
  fontWeight?: 'normal' | 'bold' | string
  fontSize?: number
  fill?: string | fabric.Color
  realLeft?: number
  realTop?: number
  realFontSize?: number
  realWidth?: number
  realHeight?: number
  realOpacity?: number
  assetKey?: string
}

const loading = ref(false)
const saving = ref(false)
const editorVisible = ref(false)
const tableData = ref<CertificateTemplateInfo[]>([])

const searchForm = reactive({
  keyword: '',
  template_usage: 'service_hours',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const editorForm = reactive<TemplateEditorForm>({
  template_id: undefined,
  template_name: '',
  template_key: '',
  template_url: '',
  template_usage: 'service_hours',
  activate_now: true,
  enabled: true,
})

const templateUsageOptions = [
  { label: '服务时长证书', value: 'service_hours' },
]

const formatTemplateUsageLabel = (usage?: string) => {
  if (usage === 'service_hours') return '服务时长证书'
  return usage || '-'
}

const canvasSize = reactive<CanvasSize>({
  width: 3508,
  height: 2480,
})

const stageSize = reactive<CanvasSize>({
  width: 0,
  height: 0,
})

const imageMeta = reactive<CanvasSize>({
  width: 0,
  height: 0,
})

const imageTransform = reactive({
  scale: 1,
  offsetX: 0,
  offsetY: 0,
})

const fieldPresets: FieldPreset[] = [
  { key: 'name', label: '姓名', fieldType: 'text' },
  { key: 'hours', label: '时长', fieldType: 'text' },
  { key: 'date', label: '日期', fieldType: 'text' },
  { key: 'issuer', label: '颁发单位', fieldType: 'text' },
  { key: 'term', label: '届次', fieldType: 'text' },
  { key: 'title', label: '奖项名称', fieldType: 'text' },
  { key: 'cert_no', label: '证书编号', fieldType: 'text' },
  { key: 'seal', label: '电子公章', fieldType: 'image' },
]

const fieldPresetKey = ref<string>('name')
const customFieldKey = ref('')
const customFieldLabel = ref('')

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)
const canvasInstance = ref<fabric.Canvas | null>(null)
const backgroundImage = ref<fabric.Image | null>(null)
const canvasReady = ref(false)

const selectedObject = ref<FabricFieldObject | null>(null)
const selectedField = reactive<SelectedFieldForm>({
  key: '',
  text: '',
  fieldType: 'text',
  fontFamily: 'SimSun',
  fontSize: 30,
  align: 'center',
  fontWeight: 'normal',
  color: '#1f2d3d',
  x: 0,
  y: 0,
  width: 280,
  height: 280,
  opacity: 0.95,
  assetKey: 'official_seal',
})

const SEAL_PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#b91c1c" flood-opacity="0.22" />
    </filter>
  </defs>
  <circle cx="160" cy="160" r="124" fill="none" stroke="#c81e1e" stroke-width="18" filter="url(#shadow)"/>
  <circle cx="160" cy="160" r="86" fill="rgba(200,30,30,0.08)" stroke="#c81e1e" stroke-width="10"/>
  <text x="160" y="176" text-anchor="middle" font-size="44" font-family="SimSun, serif" fill="#c81e1e" font-weight="700">公章</text>
</svg>
`

const SEAL_PLACEHOLDER_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SEAL_PLACEHOLDER_SVG)}`

const templateUploading = ref(false)
const templateProgress = ref(0)
const templateMimeTypes = ['image/png', 'image/jpeg', 'image/webp']

const editorTitle = computed(() =>
  editorForm.template_id ? '编辑证书模板' : '新建证书模板'
)

const disposeCanvas = () => {
  if (canvasInstance.value) {
    canvasInstance.value.dispose()
    canvasInstance.value = null
  }
  canvasReady.value = false
  backgroundImage.value = null
}

const isCanvasInstanceValid = () => {
  if (!canvasInstance.value || !canvasRef.value) return false
  const boundCanvasEl = (canvasInstance.value as unknown as { lowerCanvasEl?: HTMLCanvasElement }).lowerCanvasEl
  return boundCanvasEl === canvasRef.value
}

const handleEditorClosed = () => {
  disposeCanvas()
  canvasRef.value = null
  canvasContainer.value = null
  selectedObject.value = null
  resetSelectedField()
  imageMeta.width = 0
  imageMeta.height = 0
  imageTransform.scale = 1
  imageTransform.offsetX = 0
  imageTransform.offsetY = 0
}

const handleSearch = async () => {
  pagination.page = 1
  await loadTemplates()
}

const handleReset = async () => {
  searchForm.keyword = ''
  searchForm.template_usage = 'service_hours'
  pagination.page = 1
  await loadTemplates()
}

const handleSizeChange = async (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  await loadTemplates()
}

const handlePageChange = async (page: number) => {
  pagination.page = page
  await loadTemplates()
}

const loadTemplates = async () => {
  loading.value = true
  try {
    const res = await certificateTemplateApi.page({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      template_usage: searchForm.template_usage || undefined,
    })
    if (res.data?.list) {
      tableData.value = res.data.list
      pagination.total = res.data.pagination.total
    } else {
      tableData.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('加载证书模板失败:', error)
    ElMessage.error('加载证书模板失败')
  } finally {
    loading.value = false
  }
}

const initCanvas = () => {
  if (!canvasRef.value) return
  const canvas = new fabric.Canvas(canvasRef.value, {
    selection: true,
    preserveObjectStacking: true,
  })
  canvasInstance.value = canvas

  canvas.on('selection:created', (event) => {
    const target = event.selected?.[0] as FabricFieldObject
    if (target) setSelectedObject(target)
  })
  canvas.on('selection:updated', (event) => {
    const target = event.selected?.[0] as FabricFieldObject
    if (target) setSelectedObject(target)
  })
  canvas.on('selection:cleared', () => {
    selectedObject.value = null
    resetSelectedField()
  })
  canvas.on('object:moving', (event) => {
    const target = event.target as FabricFieldObject | undefined
    if (target) syncRealFromObject(target)
  })
  canvas.on('object:modified', (event) => {
    const target = event.target as FabricFieldObject | undefined
    if (target) syncRealFromObject(target)
  })
}

const setSelectedObject = (target: FabricFieldObject) => {
  selectedObject.value = target
  selectedField.key = target.dataKey || ''
  selectedField.text = target.text || ''
  selectedField.fieldType = target.fieldType || (target.type === 'image' ? 'image' : 'text')
  selectedField.fontFamily = target.fontFamily || 'SimSun'
  selectedField.fontSize = Math.round((target.realFontSize ?? target.fontSize ?? 0) || 0)
  selectedField.align = (target.textAlign as 'left' | 'center' | 'right') || 'center'
  selectedField.fontWeight = (target.fontWeight as 'normal' | 'bold') || 'normal'
  selectedField.color = target.fill ? String(target.fill) : '#1f2d3d'
  selectedField.x = Math.round(target.realLeft ?? 0)
  selectedField.y = Math.round(target.realTop ?? 0)
  selectedField.width = Math.round(target.realWidth ?? target.getScaledWidth() ?? 0)
  selectedField.height = Math.round(target.realHeight ?? target.getScaledHeight() ?? 0)
  selectedField.opacity = Number((target.realOpacity ?? target.opacity ?? 0.95).toFixed(2))
  selectedField.assetKey = target.assetKey || 'official_seal'
}

const resetSelectedField = () => {
  selectedField.key = ''
  selectedField.text = ''
  selectedField.fieldType = 'text'
  selectedField.fontFamily = 'SimSun'
  selectedField.fontSize = 48
  selectedField.align = 'center'
  selectedField.fontWeight = 'normal'
  selectedField.color = '#1f2d3d'
  selectedField.x = 0
  selectedField.y = 0
  selectedField.width = 280
  selectedField.height = 280
  selectedField.opacity = 0.95
  selectedField.assetKey = 'official_seal'
}

const syncRealFromObject = (target: FabricFieldObject) => {
  const scale = imageTransform.scale || 1
  target.realLeft = ((target.left ?? 0) - imageTransform.offsetX) / scale
  target.realTop = ((target.top ?? 0) - imageTransform.offsetY) / scale
  if (target.type === 'text') {
    target.realFontSize = (target.realFontSize ?? (target as fabric.Text).fontSize ?? 0)
  }
  if (selectedObject.value === target) {
    selectedField.x = Math.round(target.realLeft)
    selectedField.y = Math.round(target.realTop)
    if (target.type === 'image') {
      selectedField.width = Math.round(target.realWidth ?? target.getScaledWidth() ?? 0)
      selectedField.height = Math.round(target.realHeight ?? target.getScaledHeight() ?? 0)
    }
  }
}

const updateCanvasSize = () => {
  const canvas = canvasInstance.value
  if (!canvas) return
  canvas.setWidth(stageSize.width)
  canvas.setHeight(stageSize.height)
  canvas.calcOffset()
}

const rescaleObjects = () => {
  const canvas = canvasInstance.value
  if (!canvas) return
  const scale = imageTransform.scale || 1
  canvas.getObjects().forEach((obj) => {
    const fieldObject = obj as FabricFieldObject
    if (fieldObject.type === 'text') {
      const left = imageTransform.offsetX + (fieldObject.realLeft ?? 0) * scale
      const top = imageTransform.offsetY + (fieldObject.realTop ?? 0) * scale
      const fontSize = (fieldObject.realFontSize ?? 0) * scale
      fieldObject.set({ left, top, fontSize })
    }
    if (fieldObject.type === 'image') {
      const left = imageTransform.offsetX + (fieldObject.realLeft ?? 0) * scale
      const top = imageTransform.offsetY + (fieldObject.realTop ?? 0) * scale
      const width = (fieldObject.realWidth ?? 0) * scale
      const height = (fieldObject.realHeight ?? 0) * scale
      const intrinsicWidth = fieldObject.width || fieldObject.realWidth || 1
      const intrinsicHeight = fieldObject.height || fieldObject.realHeight || 1
      fieldObject.set({
        left,
        top,
        scaleX: width / intrinsicWidth,
        scaleY: height / intrinsicHeight,
        opacity: fieldObject.realOpacity ?? 0.95,
      })
    }
  })
}

const updateImageTransform = () => {
  const canvas = canvasInstance.value
  if (!canvas) return

  const stageWidth = stageSize.width || canvas.getWidth()
  const stageHeight = stageSize.height || canvas.getHeight()

  const imageWidth = imageMeta.width || stageWidth
  const imageHeight = imageMeta.height || stageHeight

  const scale = Math.min(stageWidth / imageWidth, stageHeight / imageHeight, 1)
  const offsetX = (stageWidth - imageWidth * scale) / 2
  const offsetY = (stageHeight - imageHeight * scale) / 2

  imageTransform.scale = scale
  imageTransform.offsetX = offsetX
  imageTransform.offsetY = offsetY

  if (backgroundImage.value) {
    backgroundImage.value.set({
      originX: 'left',
      originY: 'top',
      left: offsetX,
      top: offsetY,
      scaleX: scale,
      scaleY: scale,
    })
  }
  rescaleObjects()
  canvas.renderAll()
}

const fitToContainer = () => {
  if (!canvasContainer.value) return
  const containerWidth = canvasContainer.value.clientWidth - 8
  const containerHeight = canvasContainer.value.clientHeight - 8
  if (!containerWidth || !containerHeight) return
  const a4Ratio = canvasSize.width / canvasSize.height
  const containerRatio = containerWidth / containerHeight
  if (containerRatio > a4Ratio) {
    stageSize.height = containerHeight
    stageSize.width = containerHeight * a4Ratio
  } else {
    stageSize.width = containerWidth
    stageSize.height = containerWidth / a4Ratio
  }
  updateCanvasSize()
  updateImageTransform()
}

const setBackground = async (url: string) => {
  const canvas = canvasInstance.value
  if (!canvas) return
  return new Promise<void>((resolve) => {
    fabric.Image.fromURL(
      url,
      (img) => {
        backgroundImage.value = img
        imageMeta.width = img.width || canvasSize.width
        imageMeta.height = img.height || canvasSize.height
        img.set({
          selectable: false,
          evented: false,
        })
        updateImageTransform()
        canvas.setBackgroundImage(img, () => {
          canvas.renderAll()
          resolve()
        })
      },
      { crossOrigin: 'anonymous' }
    )
  })
}

const handleTemplateChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  if (!validateFileType(file, templateMimeTypes)) {
    ElMessage.error('仅支持 JPG/PNG/WEBP 格式的图片')
    return
  }
  if (!validateFileSize(file)) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }
  templateUploading.value = true
  templateProgress.value = 0
  try {
    const { url, key } = await uploadToOssWithKey(file, 'uploads/certificate-templates/', (p) => {
      templateProgress.value = p
    })
    editorForm.template_key = key
    editorForm.template_url = url
    await nextTick()
    ensureCanvasReady()
    fitToContainer()
    await setBackground(url)
  } catch (error) {
    console.error('上传模板图片失败:', error)
    ElMessage.error('上传失败，请稍后重试')
  } finally {
    templateUploading.value = false
    templateProgress.value = 0
  }
}

const ensureCanvasReady = () => {
  if (!isCanvasInstanceValid()) {
    disposeCanvas()
    initCanvas()
  }
  canvasReady.value = !!canvasInstance.value
}

const clearCanvasObjects = () => {
  const canvas = canvasInstance.value
  if (!canvas) return
  canvas.getObjects().forEach((obj) => canvas.remove(obj))
  canvas.renderAll()
}

const createTextObject = (field: CertificateTemplateField): FabricFieldObject => {
  const scale = imageTransform.scale || 1
  const offsetX = imageTransform.offsetX
  const offsetY = imageTransform.offsetY
  const text = new fabric.Text(field.text || field.label, {
    left: offsetX + field.x * scale,
    top: offsetY + field.y * scale,
    fontSize: field.fontSize * scale,
    fontFamily: field.fontFamily,
    fill: field.color,
    backgroundColor: 'rgba(255,255,255,0.45)',
    fontWeight: field.fontWeight,
    textAlign: field.align,
    originX: field.align === 'center' ? 'center' : field.align === 'right' ? 'right' : 'left',
    originY: 'top',
    selectable: true,
    hasControls: false,
    lockScalingX: true,
    lockScalingY: true,
  }) as FabricFieldObject
  text.dataKey = field.key
  text.displayLabel = field.label
  text.fieldType = 'text'
  text.realLeft = field.x
  text.realTop = field.y
  text.realFontSize = field.fontSize
  return text
}

const createImageObject = async (field: CertificateTemplateField): Promise<FabricFieldObject> => {
  const scale = imageTransform.scale || 1
  const offsetX = imageTransform.offsetX
  const offsetY = imageTransform.offsetY
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      SEAL_PLACEHOLDER_URL,
      (img) => {
        if (!img) {
          reject(new Error('创建图片字段失败'))
          return
        }

        const baseWidth = img.width || field.width || 1
        const baseHeight = img.height || field.height || 1
        const targetWidth = field.width || baseWidth
        const targetHeight = field.height || baseHeight
        const image = img as FabricFieldObject
        image.set({
          left: offsetX + field.x * scale,
          top: offsetY + field.y * scale,
          originX: 'left',
          originY: 'top',
          selectable: true,
          hasControls: false,
          lockScalingX: true,
          lockScalingY: true,
          opacity: field.opacity ?? 0.95,
        })
        image.scaleX = (targetWidth * scale) / baseWidth
        image.scaleY = (targetHeight * scale) / baseHeight
        image.dataKey = field.key
        image.displayLabel = field.label
        image.fieldType = 'image'
        image.realLeft = field.x
        image.realTop = field.y
        image.realWidth = targetWidth
        image.realHeight = targetHeight
        image.realOpacity = field.opacity ?? 0.95
        image.assetKey = field.assetKey || 'official_seal'
        resolve(image)
      },
      { crossOrigin: 'anonymous' }
    )
  })
}

const renderFields = async (fields: CertificateTemplateField[]) => {
  const canvas = canvasInstance.value
  if (!canvas) return
  clearCanvasObjects()
  for (const rawField of fields) {
    const field = normalizeField(rawField)
    const obj = field.fieldType === 'image'
      ? await createImageObject(field)
      : createTextObject(field)
    canvas.add(obj)
  }
  canvas.renderAll()
}

const addField = async () => {
  if (!canvasInstance.value) return
  const imageWidth = imageMeta.width || canvasSize.width
  const imageHeight = imageMeta.height || canvasSize.height
  const key = fieldPresetKey.value === 'custom' ? customFieldKey.value.trim() : fieldPresetKey.value
  const preset = fieldPresets.find((item) => item.key === fieldPresetKey.value)
  const label =
    fieldPresetKey.value === 'custom' ? customFieldLabel.value.trim() : preset?.label || key

  if (!key || !label) {
    ElMessage.warning('请填写字段 key 和显示名称')
    return
  }

  const field: CertificateTemplateField = {
    key,
    label,
    fieldType: preset?.fieldType || 'text',
    x: Math.round(imageWidth / 2),
    y: Math.round(imageHeight / 2),
    fontSize: 48,
    align: 'center',
    fontFamily: 'SimSun',
    color: '#1f2d3d',
    fontWeight: 'normal',
    text: label,
    width: 280,
    height: 280,
    opacity: 0.95,
    assetKey: key === 'seal' ? 'official_seal' : undefined,
  }

  const obj = field.fieldType === 'image' ? await createImageObject(field) : createTextObject(field)
  canvasInstance.value.add(obj)
  canvasInstance.value.setActiveObject(obj)
  canvasInstance.value.bringToFront(obj)
  setSelectedObject(obj)
  canvasInstance.value.renderAll()
}

const removeSelectedField = () => {
  const canvas = canvasInstance.value
  if (!canvas || !selectedObject.value) return
  canvas.remove(selectedObject.value)
  canvas.discardActiveObject()
  selectedObject.value = null
  resetSelectedField()
  canvas.renderAll()
}

const applyFieldText = () => {
  if (!selectedObject.value) return
  selectedObject.value.set({ text: selectedField.text })
  canvasInstance.value?.renderAll()
}

const applyFieldStyle = () => {
  if (!selectedObject.value) return
  if (selectedField.fieldType === 'image') {
    const scale = imageTransform.scale || 1
    const baseWidth = selectedObject.value.width || selectedField.width || 1
    const baseHeight = selectedObject.value.height || selectedField.height || 1
    selectedObject.value.realWidth = selectedField.width
    selectedObject.value.realHeight = selectedField.height
    selectedObject.value.realOpacity = selectedField.opacity
    selectedObject.value.assetKey = selectedField.assetKey || 'official_seal'
    selectedObject.value.set({
      opacity: selectedField.opacity,
      scaleX: (selectedField.width * scale) / baseWidth,
      scaleY: (selectedField.height * scale) / baseHeight,
      left: imageTransform.offsetX + selectedField.x * scale,
      top: imageTransform.offsetY + selectedField.y * scale,
    })
  } else {
    const scale = imageTransform.scale || 1
    selectedObject.value.set({
      fontFamily: selectedField.fontFamily,
      fontWeight: selectedField.fontWeight,
      fill: selectedField.color,
      fontSize: selectedField.fontSize * scale,
      textAlign: selectedField.align,
      originX:
        selectedField.align === 'center'
          ? 'center'
          : selectedField.align === 'right'
            ? 'right'
            : 'left',
    })
    selectedObject.value.realFontSize = selectedField.fontSize
  }
  canvasInstance.value?.renderAll()
}

const applyFieldPosition = () => {
  if (!selectedObject.value) return
  const scale = imageTransform.scale || 1
  selectedObject.value.realLeft = selectedField.x
  selectedObject.value.realTop = selectedField.y
  selectedObject.value.set({
    left: imageTransform.offsetX + selectedField.x * scale,
    top: imageTransform.offsetY + selectedField.y * scale,
  })
  canvasInstance.value?.renderAll()
}

const normalizeField = (field: CertificateTemplateField): CertificateTemplateField => ({
  ...field,
  fieldType: field.fieldType || (field.key === 'seal' ? 'image' : 'text'),
  width: field.width || (field.key === 'seal' ? 280 : undefined),
  height: field.height || (field.key === 'seal' ? 280 : undefined),
  opacity: field.opacity ?? (field.key === 'seal' ? 0.95 : undefined),
  assetKey: field.assetKey || (field.key === 'seal' ? 'official_seal' : undefined),
})

const parseFields = (raw: CertificateTemplateInfo['fields_json']): CertificateTemplateField[] => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((field) => normalizeField(field))
  try {
    return (JSON.parse(raw) as CertificateTemplateField[]).map((field) => normalizeField(field))
  } catch (error) {
    console.error('解析字段配置失败:', error)
    return []
  }
}

const openEditor = async (template?: CertificateTemplateInfo) => {
  editorVisible.value = true
  await nextTick()
  ensureCanvasReady()
  resetSelectedField()
  selectedObject.value = null

  if (template) {
    // 调用接口获取完整的模板数据（包括字段信息）
    try {
      const apiResponse = await certificateTemplateApi.get(template.template_id)
      const fullTemplate = apiResponse.data as CertificateTemplateInfo
      editorForm.template_id = fullTemplate.template_id
      editorForm.template_name = fullTemplate.template_name
      editorForm.enabled = Boolean(fullTemplate.enabled)
      editorForm.template_key = fullTemplate.template_key
      editorForm.template_usage = fullTemplate.template_usage || 'service_hours'
      editorForm.activate_now = false
      editorForm.template_url = ''
      canvasSize.width = fullTemplate.canvas_width
      canvasSize.height = fullTemplate.canvas_height

      if (fullTemplate.template_key) {
        editorForm.template_url = await getSignedOssUrl(fullTemplate.template_key, {
          expiresInSeconds: 60 * 10,
          disposition: 'inline',
        })
      }

      fitToContainer()

      if (editorForm.template_url) {
        await setBackground(editorForm.template_url)
      } else if (canvasInstance.value) {
        canvasInstance.value.backgroundImage = undefined
        canvasInstance.value.renderAll()
      }

      await renderFields(parseFields(fullTemplate.fields_json))
    } catch (error) {
      console.error('获取模板数据失败:', error)
      ElMessage.error('获取模板数据失败，请稍后重试')
      editorVisible.value = false
    }
  } else {
    editorForm.template_id = undefined
    editorForm.template_name = ''
    editorForm.template_key = ''
    editorForm.template_url = ''
    editorForm.template_usage = 'service_hours'
    editorForm.activate_now = true
    editorForm.enabled = true
    canvasSize.width = 3508
    canvasSize.height = 2480
    clearCanvasObjects()
    fitToContainer()
    backgroundImage.value = null
    imageMeta.width = 0
    imageMeta.height = 0
    if (canvasInstance.value) {
      canvasInstance.value.backgroundImage = undefined
      canvasInstance.value.renderAll()
    }
  }
}

const closeEditor = () => {
  editorVisible.value = false
  resetSelectedField()
  selectedObject.value = null
}

const collectFields = (): CertificateTemplateField[] => {
  const canvas = canvasInstance.value
  if (!canvas) return []
  return canvas
    .getObjects()
    .filter((obj) => obj.type === 'text' || obj.type === 'image')
    .map((obj): CertificateTemplateField => {
      const fieldObject = obj as FabricFieldObject
      if (fieldObject.type === 'image') {
        return {
          key: fieldObject.dataKey || '',
          label: fieldObject.displayLabel || '',
          fieldType: 'image' as const,
          x: Math.round(fieldObject.realLeft ?? 0),
          y: Math.round(fieldObject.realTop ?? 0),
          fontSize: 0,
          align: 'left',
          fontFamily: 'SimSun',
          color: '#1f2d3d',
          fontWeight: 'normal',
          text: fieldObject.displayLabel || '',
          width: Math.round(fieldObject.realWidth ?? fieldObject.getScaledWidth() ?? 0),
          height: Math.round(fieldObject.realHeight ?? fieldObject.getScaledHeight() ?? 0),
          opacity: Number((fieldObject.realOpacity ?? fieldObject.opacity ?? 1).toFixed(2)),
          assetKey: fieldObject.assetKey || 'official_seal',
        }
      }
      return {
        key: fieldObject.dataKey || '',
        label: fieldObject.displayLabel || fieldObject.text || '',
        fieldType: 'text' as const,
        x: Math.round(fieldObject.realLeft ?? 0),
        y: Math.round(fieldObject.realTop ?? 0),
        fontSize: Math.round(fieldObject.realFontSize ?? 0),
        align: (fieldObject.textAlign as 'left' | 'center' | 'right') || 'center',
        fontFamily: fieldObject.fontFamily || 'SimSun',
        color: fieldObject.fill ? String(fieldObject.fill) : '#1f2d3d',
        fontWeight: (fieldObject.fontWeight as 'normal' | 'bold') || 'normal',
        text: fieldObject.text || '',
      }
    })
    .filter((field) => field.key)
}

const saveTemplate = async () => {
  if (!editorForm.template_name.trim()) {
    ElMessage.warning('请填写模板名称')
    return
  }
  if (!editorForm.template_key) {
    ElMessage.warning('请上传模板背景图')
    return
  }

  const fields = collectFields()
  if (fields.length === 0) {
    ElMessage.warning('请至少添加一个字段')
    return
  }

  saving.value = true
  try {
    const payload = {
      template_name: editorForm.template_name.trim(),
      template_key: editorForm.template_key,
      template_usage: editorForm.template_usage || 'service_hours',
      activate_now: editorForm.activate_now,
      canvas_width: canvasSize.width,
      canvas_height: canvasSize.height,
      fields_json: fields,
      enabled: editorForm.enabled ? 1 : 0,
    }

    if (editorForm.template_id) {
      await certificateTemplateApi.update(editorForm.template_id, payload)
    } else {
      await certificateTemplateApi.create(payload)
    }
    await loadTemplates()
    closeEditor()
  } catch (error) {
    console.error('保存证书模板失败:', error)
    ElMessage.error('保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

const toggleTemplate = async (template: CertificateTemplateInfo) => {
  const nextEnabled = template.enabled ? 0 : 1
  try {
    if (nextEnabled === 1) {
      await certificateTemplateApi.activate(template.template_id)
    } else {
      await certificateTemplateApi.update(template.template_id, {
        enabled: 0,
        activate_now: false,
      })
    }
    await loadTemplates()
    ElMessage.success('状态已更新')
  } catch (error) {
    console.error('更新模板状态失败:', error)
    ElMessage.error('更新失败')
  }
}

const handleActivateTemplate = async (template: CertificateTemplateInfo) => {
  try {
    await certificateTemplateApi.activate(template.template_id)
    await loadTemplates()
    ElMessage.success('已设为当前生效模板')
  } catch (error) {
    console.error('设为生效模板失败:', error)
    ElMessage.error('设置失败')
  }
}

const removeTemplate = async (template: CertificateTemplateInfo) => {
  try {
    await ElMessageBox.confirm(
      `确认删除模板“${template.template_name}”吗？删除后不可恢复。`,
      '删除确认',
      {
        type: 'warning',
      }
    )
    await certificateTemplateApi.remove(template.template_id)
    await loadTemplates()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadTemplates()
})

onBeforeUnmount(() => {
  disposeCanvas()
})
</script>

<style scoped>
.search-input {
  width: 220px !important;
  min-width: 160px;
}

.search-select {
  width: 220px !important;
  min-width: 160px;
}

.search-btn,
.reset-btn {
  display: flex;
  align-items: center;
  white-space: nowrap;
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
  font-weight: 700;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.template-table {
  flex: 1;
  overflow: hidden;
}

.template-table :deep(.el-table__body-wrapper) {
  overflow: auto;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.table-wrapper :deep(.el-table) {
  height: 100%;
}

.table-wrapper :deep(.el-table__row) {
  height: 54px;
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

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background-color: #ffffffac;
  flex-shrink: 0;
}

.form-readonly {
  font-weight: 500;
  color: #303133;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

:global(.template-editor-dialog) {
  width: min(94vw, 1320px);
  max-width: 1320px;
  height: 88vh;
  max-height: 92vh;
  margin: 0 auto !important;
  top: 50% !important;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
}

:global(.template-editor-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0px 10px 15px 10px;
}

:global(.template-editor-dialog .el-dialog__body) {
  padding: 8px 10px 10px;
  flex: 1;
  overflow: hidden;
}

:global(.template-editor-dialog .el-dialog__footer) {
  border-top: 1px solid var(--el-border-color-light);
  padding: 12px 16px;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(360px, 1fr) minmax(280px, 0.6fr);
  gap: 10px;
  height: 100%;
  overflow: hidden;
}

.editor-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-progress {
  width: 140px;
}

.canvas-size-readonly {
  font-weight: 600;
  color: #303133;
}

.canvas-wrapper {
  flex: 1;
  background: #f6f8fc;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 8px;
  position: relative;
  overflow: hidden;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-stage {
  height: 100%;
  aspect-ratio: 1.414;
  width: auto;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(25, 137, 250, 0.12);
}

.canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 8px;
}

.canvas-container canvas {
  background: transparent;
  border-radius: 8px;
  display: block;
}

.canvas-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #909399;
  pointer-events: none;
}

.editor-right {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.editor-right :deep(.el-divider--horizontal) {
  margin: 8px 0;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.field-action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.editor-form .el-form-item {
  margin-bottom: 8px;
}

.field-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.custom-field-input {
  width: 100%;
}

.field-scroll {
  flex: 0 0 auto;
  min-height: 0;
  overflow: visible;
  padding-right: 0;
}

.field-form {
  margin-top: 4px;
}

.position-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.editor-actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  padding-bottom: 2px;
  border-top: 1px solid #ebeef5;
  background: #fff;
  position: sticky;
  bottom: 0;
  z-index: 2;
}

@media (max-width: 1200px) {
  .editor-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  .editor-right {
    height: auto;
  }
}
</style>
