<template>
  <div class="application-page" v-loading="pageLoading || identityLoading">
    <el-card v-if="canViewPage" class="page-card" shadow="never">
      <el-alert
        v-if="hasSubmitted"
        type="warning"
        title="已提交"
        description="您已提交过本年度报名申请，下方为您的已填写内容，如需修改请联系管理员。"
        :closable="false"
        class="season-alert"
      />
      <template #header>
        <div class="page-header">
          <div class="page-header-left">
            <div class="page-title-row">
              <h2 class="page-title">{{ modeConfig.title }}</h2>
              <el-tag :type="seasonTagType" effect="dark">{{ seasonTagText }}</el-tag>
            </div>
            <p class="page-subtitle">{{ modeConfig.subtitle }}</p>
          </div>
          <div class="page-header-right">
            <div class="header-summary">
              <div class="header-summary-item">
                <span class="header-summary-label">报名年度</span>
                <span class="header-summary-value">{{ submitYear }}</span>
              </div>
              <div class="header-summary-item">
                <span class="header-summary-label">通道标题</span>
                <span class="header-summary-value">{{ channelTitleText }}</span>
              </div>
              <div class="header-summary-item">
                <span class="header-summary-label">开放状态</span>
                <el-tag :type="seasonTagType" effect="plain" size="small">{{ seasonTagText }}</el-tag>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="page-body">
        <div class="sidebar-panel">
          <el-card class="info-card process-card" shadow="never">
            <template #header>
              <div class="section-header">
                <span>流程信息</span>
              </div>
            </template>

            <el-timeline class="flow-timeline">
              <el-timeline-item
                v-for="step in flowSteps"
                :key="step.title"
                :color="step.color"
                placement="top"
              >
                <div class="flow-step-card">
                  <div class="flow-step-title">{{ step.title }}</div>
                  <div class="flow-step-desc">{{ step.description }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </el-card>
        </div>

        <div class="form-panel">
          <el-card class="form-card" shadow="never">
            <template #header>
              <div class="section-header">
                <span>报名表单</span>
                <el-tag type="primary" effect="plain" size="small">
                  {{ modeConfig.formHint }}
                </el-tag>
              </div>
            </template>

            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-width="110px"
              class="application-form"
              :disabled="formDisabled"
              @submit.prevent
            >
              <div class="form-section">
                <div class="form-section-title">基础信息</div>
                <div class="form-grid">
                  <el-form-item label="学号" prop="student_id">
                    <el-input v-model="form.student_id" placeholder="自动同步当前账号学号" disabled />
                  </el-form-item>
                  <el-form-item label="姓名" prop="name">
                    <el-input v-model="form.name" placeholder="请输入姓名" />
                  </el-form-item>
                  <el-form-item label="性别" prop="gender">
                    <el-select v-model="form.gender" placeholder="请选择性别">
                      <el-option label="男" value="男" />
                      <el-option label="女" value="女" />
                      <el-option label="其他" value="其他" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="联系电话" prop="phone">
                    <el-input v-model="form.phone" placeholder="请输入手机号" />
                  </el-form-item>
                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="form.email" placeholder="请输入邮箱" />
                  </el-form-item>
                  <el-form-item label="年级" prop="grade">
                    <el-input v-model="form.grade" placeholder="如：2024级" />
                  </el-form-item>
                  <el-form-item label="学院" prop="college">
                    <el-input v-model="form.college" placeholder="请输入学院" />
                  </el-form-item>
                  <el-form-item label="专业" prop="major">
                    <el-input v-model="form.major" placeholder="请输入专业" />
                  </el-form-item>
                  <el-form-item label="QQ" prop="qq">
                    <el-input v-model="form.qq" placeholder="请输入QQ（可选）" />
                  </el-form-item>
                  <el-form-item label="宿舍" prop="dormitory">
                    <el-input v-model="form.dormitory" placeholder="请输入宿舍（可选）" />
                  </el-form-item>
                  <el-form-item label="技能标签" prop="skillTags">
                    <el-select
                      v-model="skillTags"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      :reserve-keyword="false"
                      placeholder="输入后回车，可填写多个标签"
                    />
                  </el-form-item>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-title">报名信息</div>

                <div v-if="props.mode === 'new_student'" class="form-grid">
                  <el-form-item label="第一志愿" prop="intention_dept1">
                    <el-select
                      v-model="form.intention_dept1"
                      placeholder="请选择第一志愿部门"
                      filterable
                    >
                      <el-option
                        v-for="dept in departmentOptions"
                        :key="dept.dept_id"
                        :label="dept.dept_name"
                        :value="dept.dept_name"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="第二志愿" prop="intention_dept2">
                    <el-select
                      v-model="form.intention_dept2"
                      placeholder="请选择第二志愿部门（可选）"
                      clearable
                      filterable
                    >
                      <el-option
                        v-for="dept in departmentOptions"
                        :key="dept.dept_id"
                        :label="dept.dept_name"
                        :value="dept.dept_name"
                      />
                    </el-select>
                  </el-form-item>
                </div>

                <div v-else class="form-grid">
                  <el-form-item label="竞选部门" prop="intention_dept1">
                    <el-select
                      v-model="form.intention_dept1"
                      placeholder="请选择竞选部门"
                      filterable
                    >
                      <el-option
                        v-for="dept in departmentOptions"
                        :key="dept.dept_id"
                        :label="dept.dept_name"
                        :value="dept.dept_name"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="当前职务" prop="current_position">
                    <el-input v-model="form.current_position" placeholder="请输入当前职务" />
                  </el-form-item>
                  <el-form-item label="竞选职务" prop="election_position">
                    <el-select v-model="form.election_position" placeholder="请选择竞选职务">
                      <el-option label="队长" value="队长" />
                      <el-option label="部长" value="部长" />
                      <el-option label="副部长" value="副部长" />
                      <el-option label="部员" value="部员" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="工作计划" prop="work_plan" class="form-span-2">
                    <el-input
                      v-model="form.work_plan"
                      type="textarea"
                      :rows="4"
                      placeholder="请简要说明你对竞选岗位的工作设想"
                    />
                  </el-form-item>
                </div>
              </div>

              <div class="form-section">
                <div class="form-section-title">申请说明</div>
                <div class="form-grid">
                  <el-form-item label="自我介绍" prop="self_intro" class="form-span-2">
                    <el-input
                      v-model="form.self_intro"
                      type="textarea"
                      :rows="4"
                      placeholder="请简要介绍自己"
                    />
                  </el-form-item>
                  <el-form-item label="过往经历" prop="past_experience" class="form-span-2">
                    <el-input
                      v-model="form.past_experience"
                      type="textarea"
                      :rows="4"
                      placeholder="可填写过往志愿经历、校园活动经历等（可选）"
                    />
                  </el-form-item>
                  <el-form-item :label="reasonLabel" prop="reason_for_joining" class="form-span-2">
                    <el-input
                      v-model="form.reason_for_joining"
                      type="textarea"
                      :rows="5"
                      :placeholder="reasonPlaceholder"
                    />
                  </el-form-item>
                </div>
              </div>

              <div class="form-actions">
                <el-button :disabled="formDisabled" @click="handleReset">重置</el-button>
                <el-button
                  type="primary"
                  :loading="submitLoading"
                  :disabled="!canSubmit || formDisabled"
                  @click="handleSubmit"
                >
                  {{ submitButtonText }}
                </el-button>
              </div>
            </el-form>
          </el-card>
        </div>
      </div>
    </el-card>

    <el-card v-else-if="showAccessDenied" class="page-card access-card" shadow="never">
      <el-result
        icon="info"
        :title="accessDeniedTitle"
        :sub-title="accessDeniedDescription"
      >
        <template #extra>
          <el-button type="primary" @click="router.push(backDashboardRoute)">
            返回数据驾驶舱
          </el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { departmentApi, recruitmentApi } from '@/utils/api'
import type {
  DepartmentInfo,
  RecruitmentType,
  RecruitmentMyApplicationRecord,
  SubmitRecruitmentParams,
  UserInfo,
} from '@/utils/api/types'
import { useUserStore } from '@/stores/user'
import { message } from '@/utils/message'

const props = defineProps<{
  mode: RecruitmentType
}>()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pageLoading = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const myApplication = ref<RecruitmentMyApplicationRecord | null>(null)
const userStatusLoading = ref(false)
const bootstrapReady = ref(false)
const departmentOptions = ref<DepartmentInfo[]>([])
const hasSubmitted = ref(false)

const skillTags = ref<string[]>([])

// 使用 userStore 中已加载的 recruitmentUserStatus，避免重复调用
const userStatus = computed(() => userStore.recruitmentUserStatus)
const identityLoading = computed(() => userStatusLoading.value || userStore.recruitmentUserStatusLoading || userStore.loading)
const backDashboardRoute = computed(() => (route.path.startsWith('/admin') ? '/admin/dashboard' : '/user/dashboard'))

const currentSeason = computed(() => {
  return userStatus.value?.open_channels.find((channel) => channel.type === props.mode) || null
})

const submitYear = computed(() => currentSeason.value?.year || new Date().getFullYear())

const form = reactive<SubmitRecruitmentParams>({
  year: new Date().getFullYear(),
  type: props.mode,
  student_id: '',
  name: '',
  gender: '其他',
  college: '',
  major: '',
  grade: '',
  phone: '',
  email: '',
  qq: '',
  dormitory: '',
  intention_dept1: '',
  intention_dept2: '',
  current_position: '',
  election_position: '',
  work_plan: '',
  self_intro: '',
  past_experience: '',
  reason_for_joining: '',
  skill_tags: [],
})

const modeConfig = computed(() => {
  if (props.mode === 'new_student') {
    return {
      title: '新生报名',
      subtitle: '面向志愿服务队新生招募入口，请填写完整报名资料。',
      formHint: '新生纳新',
      notices: [
        '仅普通志愿者可见，请确保学号、手机号、邮箱填写真实有效。',
        '第一志愿和第二志愿建议按实际意愿排序填写。',
        '技能标签可以多选或自由输入，便于后续分配。',
        '提交后进入审核流程，重复报名会被后端拦截。',
      ],
      reasonLabel: '加入动机',
      reasonPlaceholder: '请说明你为什么想加入志愿服务队，以及你能带来的优势',
      submitText: '提交新生报名',
    }
  }

  return {
    title: '骨干成员换届竞选',
    subtitle: '面向现任骨干成员的换届晋升入口，请填写竞选信息与工作计划。',
    formHint: '内部换届',
    notices: [
      '仅骨干成员可见，队长不展示此入口。',
      '请填写当前职务与竞选目标职务，便于后续审核。',
      '工作计划建议写清楚你对岗位职责的理解和行动方案。',
      '竞选岗位会进入一轮审核，通过后再进入最终任命。',
    ],
    reasonLabel: '竞选理由',
    reasonPlaceholder: '请说明你竞选该岗位的理由、经验与优势',
    submitText: '提交换届竞选',
  }
})

const flowSteps = computed(() => {
  // 只显示当前用户有资格的通道的步骤
  const eligibleChannels = userStatus.value?.open_channels.filter(c => {
    if (props.mode === 'new_student') {
      return c.type === 'new_student'
    } else {
      return c.type === 'internal_election'
    }
  }) || []
  
  if (eligibleChannels.length === 0) {
    return []
  }

  if (props.mode === 'new_student') {
    return [
      { title: '确认报名通道', description: '当前页面仅对普通志愿者开放，进入前请确认身份与通道是否匹配。', color: '#1989fa' },
      { title: '填写基础信息', description: '完善学号、姓名、学院、专业、联系方式和技能标签。', color: '#1989fa' },
      { title: '提交申请表', description: '提交后将进入后端审核流程，期间请保持联系方式畅通。', color: '#1989fa' },
      { title: '等待审核结果', description: '审核通过后，系统会依据安排进入后续分配。', color: '#1989fa' },
    ]
  }

  return [
    { title: '确认身份范围', description: '当前页面面向骨干成员。', color: '#1989fa' },
    { title: '填写竞选信息', description: '补充当前职务、竞选岗位和工作计划，便于审核判断。', color: '#1989fa' },
    { title: '提交竞选材料', description: '提交后进入审核流程，竞选材料会作为后续评审依据。', color: '#1989fa' },
    { title: '等待任命结果', description: '通过审核后进入最终任命或分配阶段。', color: '#1989fa' },
  ]
})

const reasonLabel = computed(() => modeConfig.value.reasonLabel)
const reasonPlaceholder = computed(() => modeConfig.value.reasonPlaceholder)
const submitButtonText = computed(() => modeConfig.value.submitText)
const channelTitleText = computed(() => {
  const customTitle = currentSeason.value?.title?.trim()
  if (currentSeason.value?.eligible && customTitle) {
    return customTitle
  }
  return props.mode === 'new_student' ? '新生报名' : '换届竞选'
})

const seasonTagType = computed(() => {
  if (!currentSeason.value) return 'info'
  if (currentSeason.value.eligible) return 'primary'
  return 'warning'
})

const seasonTagText = computed(() => {
  if (!currentSeason.value) return '暂无开放通道'
  return currentSeason.value.eligible ? '当前可报名' : '当前不可报名'
})

const seasonAlertText = computed(() => {
  if (!userStatus.value) return '正在获取报名资格，请稍后...'
  if (!currentSeason.value) return userStatus.value.message || '当前暂无开放的报名通道，请等待管理员开启报名。'
  if (!currentSeason.value.eligible) {
    return userStatus.value.message || `当前通道「${currentSeason.value.title || channelTitleText.value}」暂不可报名。`
  }
  return `当前报名通道「${currentSeason.value.title || channelTitleText.value}」已开放，可以直接提交。`
})

const canSubmit = computed(() => {
  if (hasSubmitted.value) {
    return false // 已提交则不能再提交
  }
  return Boolean(currentSeason.value?.eligible)
})

const formDisabled = computed(() => !canSubmit.value || hasSubmitted.value)

const isBackboneMember = computed(() => Boolean(userStatus.value?.is_backbone_member))
const canApplyNewStudent = computed(() => {
  const eligibilityFlag = userStatus.value?.eligibility?.can_apply_new_student
  if (typeof eligibilityFlag === 'boolean') return eligibilityFlag
  const channel = userStatus.value?.open_channels.find((c) => c.type === 'new_student')
  return Boolean(channel?.eligible)
})
const canApplyInternalElection = computed(() => {
  const eligibilityFlag = userStatus.value?.eligibility?.can_apply_internal_election
  if (typeof eligibilityFlag === 'boolean') return eligibilityFlag
  if (typeof userStatus.value?.can_apply_election === 'boolean') return userStatus.value.can_apply_election
  const channel = userStatus.value?.open_channels.find((c) => c.type === 'internal_election')
  return Boolean(channel?.eligible)
})

const canViewPage = computed(() => {
  if (!userStatus.value) return false
  
  if (props.mode === 'new_student') {
    return !isBackboneMember.value && canApplyNewStudent.value
  }

  return isBackboneMember.value && canApplyInternalElection.value
})

const showAccessDenied = computed(() => {
  return bootstrapReady.value && !identityLoading.value && !canViewPage.value
})

const accessDeniedTitle = computed(() => {
  return props.mode === 'new_student' ? '当前账号不可查看新生报名' : '当前账号不可查看换届竞选'
})

const accessDeniedDescription = computed(() => {
  console.log(userStatus.value);
  
  if (!userStatus.value?.eligibility) {
    return userStatus.value?.message || '当前账号暂不满足报名条件。'
  }

  if (props.mode === 'new_student') {
    if (userStatus.value.is_backbone_member) {
      return '骨干成员不可参与新生纳新报名'
    }
  } else {
    // 换届竞选
    if (!userStatus.value.is_backbone_member) {
      return '仅当届骨干成员可参与换届竞选报名'
    }
    if (userStatus.value.backbone_info?.is_leader) {
      return '队长不可参与换届竞选报名'
    }
    if (!userStatus.value.backbone_info?.is_current_term) {
      return '仅当届骨干成员可参与换届竞选报名'
    }
  }
  return userStatus.value.message || '当前账号暂不满足报名条件。'
})

const isFieldRequired = computed(() => props.mode === 'new_student')

const rules = computed<FormRules>(() => {
  const baseRules: FormRules = {
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    student_id: [{ required: true, message: '学号不能为空', trigger: 'blur' }],
    gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
    college: [{ required: true, message: '请输入学院', trigger: 'blur' }],
    major: [{ required: true, message: '请输入专业', trigger: 'blur' }],
    grade: [{ required: true, message: '请输入年级', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
    email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
    intention_dept1: [{ required: true, message: '请选择第一志愿/竞选部门', trigger: 'change' }],
    self_intro: [
      { required: true, message: '请填写自我介绍', trigger: 'blur' },
      { min: 20, message: '自我介绍建议不少于 20 个字', trigger: 'blur' },
    ],
    reason_for_joining: [
      { required: true, message: isFieldRequired.value ? '请填写加入动机' : '请填写竞选理由', trigger: 'blur' },
      { min: 50, message: '内容建议不少于 50 个字', trigger: 'blur' },
    ],
  }

  if (props.mode === 'new_student') {
    baseRules.intention_dept2 = []
  } else {
    baseRules.current_position = [{ required: true, message: '请输入当前职务', trigger: 'blur' }]
    baseRules.election_position = [{ required: true, message: '请选择竞选职务', trigger: 'change' }]
    baseRules.work_plan = [
      { required: true, message: '请填写工作计划', trigger: 'blur' },
      { min: 50, message: '工作计划建议不少于 50 个字', trigger: 'blur' },
    ]
  }

  return baseRules
})

const applyUserProfile = (profile: UserInfo | null) => {
  if (!profile) return
  form.student_id = profile.student_id || form.student_id
  form.name = profile.name || form.name
  form.gender = profile.gender || form.gender
  form.college = profile.college || form.college
  form.major = profile.major || form.major
  form.phone = profile.phone || form.phone
  form.email = profile.email || form.email
  if (profile.skill_tags) {
    try {
      skillTags.value = JSON.parse(profile.skill_tags)
    } catch {
      skillTags.value = profile.skill_tags.split(',').map((item) => item.trim()).filter(Boolean)
    }
  }
}

const applyMyApplication = (appData: RecruitmentMyApplicationRecord | null) => {
  if (!appData) return
  form.year = appData.year || form.year
  form.type = appData.type || appData.recruitment_type || props.mode
  form.name = appData.name || form.name
  form.gender = appData.gender || form.gender
  form.college = appData.college || form.college
  form.major = appData.major || form.major
  form.grade = appData.grade || form.grade
  form.phone = appData.phone || form.phone
  form.email = appData.email || form.email
  form.qq = appData.qq || ''
  form.dormitory = appData.dormitory || ''
  form.intention_dept1 = appData.intention_dept1 || ''
  form.intention_dept2 = appData.intention_dept2 || ''
  form.self_intro = appData.self_intro || ''
  form.reason_for_joining = appData.reason_for_joining || ''
  form.past_experience = appData.past_experience || ''
  
  if (appData.current_position) form.current_position = appData.current_position
  if (appData.election_position) form.election_position = appData.election_position
  if (appData.work_plan) form.work_plan = appData.work_plan
  
  if (appData.skill_tags) {
    try {
      skillTags.value = Array.isArray(appData.skill_tags)
        ? appData.skill_tags.filter((tag) => Boolean(tag && String(tag).trim()))
        : typeof appData.skill_tags === 'string'
          ? JSON.parse(appData.skill_tags)
          : []
    } catch {
      skillTags.value = []
    }
  }
}

const loadBootstrapData = async () => {
  pageLoading.value = true
  userStatusLoading.value = true
  bootstrapReady.value = false
  try {
    // 检查 userStore 中的 recruitmentUserStatus 是否已加载
    if (!userStore.recruitmentUserStatus) {
      // 如果还没加载，则主动加载
      await userStore.fetchRecruitmentUserStatus()
    }

    // 获取部门列表
    const deptRes = await departmentApi.getAll()
    departmentOptions.value = deptRes.data?.list || []
    
    // 根据 userStatus 获取当前报名年度，然后获取用户已提交的报名
    const year = userStore.recruitmentUserStatus?.open_channels[0]?.year || new Date().getFullYear()
    const myAppRes = await recruitmentApi.getMyApplication(year, props.mode).catch(() => null) // 如果未提交过会返回 404
    
    // 检查是否已提交过当前模式的报名
    if (myAppRes?.data) {
      hasSubmitted.value = Boolean(myAppRes.data.has_submitted)
      myApplication.value = myAppRes.data.record || null
    }
    
    form.year = currentSeason.value?.year || year

    const studentId = userStore.recruitmentUserStatus?.student_id || localStorage.getItem('student_id') || ''
    if (studentId) {
      await userStore.fetchProfile(studentId)
      applyUserProfile(userStore.profile)
    }
    
    // 如果已提交，回显表单内容
    if (hasSubmitted.value && myApplication.value) {
      applyMyApplication(myApplication.value)
    }
  } catch (error) {
    console.error('加载报名页面基础数据失败:', error)
    message.error('加载报名页面失败')
  } finally {
    userStatusLoading.value = false
    pageLoading.value = false
    bootstrapReady.value = true
  }
}

const resetFormFields = () => {
  form.type = props.mode
  form.year = currentSeason.value?.year || new Date().getFullYear()
  form.student_id = userStatus.value?.student_id || localStorage.getItem('student_id') || ''
  form.name = ''
  form.gender = '其他'
  form.college = ''
  form.major = ''
  form.grade = ''
  form.phone = ''
  form.email = ''
  form.qq = ''
  form.dormitory = ''
  form.intention_dept1 = ''
  form.intention_dept2 = ''
  form.current_position = ''
  form.election_position = ''
  form.work_plan = ''
  form.self_intro = ''
  form.past_experience = ''
  form.reason_for_joining = ''
  form.skill_tags = []
  skillTags.value = []
  formRef.value?.clearValidate()
  applyUserProfile(userStore.profile)
}

const handleReset = () => {
  resetFormFields()
}

const normalizeOptionalText = (value?: string) => {
  const text = (value || '').trim()
  return text || undefined
}

const buildSubmitPayload = (): SubmitRecruitmentParams => {
  const basePayload: SubmitRecruitmentParams = {
    year: submitYear.value,
    type: props.mode,
    student_id: form.student_id,
    name: form.name,
    gender: form.gender,
    college: form.college,
    major: form.major,
    grade: form.grade,
    phone: form.phone,
    email: form.email,
    intention_dept1: form.intention_dept1,
    self_intro: form.self_intro,
    reason_for_joining: form.reason_for_joining,
  }

  const qq = normalizeOptionalText(form.qq)
  const dormitory = normalizeOptionalText(form.dormitory)
  const pastExperience = normalizeOptionalText(form.past_experience)
  const skillTagsText = skillTags.value.map((tag) => tag.trim()).filter(Boolean)

  if (qq) basePayload.qq = qq
  if (dormitory) basePayload.dormitory = dormitory
  if (pastExperience) basePayload.past_experience = pastExperience
  if (skillTagsText.length) basePayload.skill_tags = skillTagsText

  if (props.mode === 'new_student') {
    const intentionDept2 = normalizeOptionalText(form.intention_dept2)
    if (intentionDept2) {
      basePayload.intention_dept2 = intentionDept2
    }
    return basePayload
  }

  basePayload.current_position = form.current_position
  basePayload.election_position = form.election_position
  basePayload.work_plan = form.work_plan
  return basePayload
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  if (hasSubmitted.value) {
    message.warning('您已提交过本年度报名申请，无法重复提交。如需修改请联系管理员。')
    return
  }
  
  if (!canSubmit.value) {
    message.warning(seasonAlertText.value)
    return
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submitLoading.value = true
      const payload = buildSubmitPayload()

      await recruitmentApi.submitApplication(payload)

      hasSubmitted.value = true
      message.success(
        props.mode === 'new_student' ? '新生报名提交成功，请等待审核。' : '换届竞选提交成功，请等待审核。'
      )

      await loadBootstrapData()
    } catch (error) {
      console.error('提交报名失败:', error)
    } finally {
      submitLoading.value = false
    }
  })
}

watch(
  () => userStore.profile,
  (profile) => {
    applyUserProfile(profile)
  },
  { immediate: true }
)

onMounted(() => {
  loadBootstrapData()
})
</script>

<style scoped>
.application-page {
  min-height: 100%;
}

.page-card {
  min-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  overflow: hidden;
  background: #f7fbff;
  border: 1px solid rgba(25, 137, 250, 0.08);
}

.page-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-header-left {
  min-width: 0;
}

.page-header-right {
  flex: 0 0 auto;
  min-width: 240px;
}

.header-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(25, 137, 250, 0.06);
  border: 1px solid rgba(25, 137, 250, 0.12);
}

.header-summary-item {
  min-width: 0;
}

.header-summary-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #6a7a96;
}

.header-summary-value {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #17315e;
  line-height: 1.4;
  word-break: break-word;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #16233d;
}

.page-subtitle {
  margin: 10px 0 0;
  color: #5f6b85;
  line-height: 1.6;
  font-size: 13px;
}

.page-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 18px;
  overflow: hidden;
}

.sidebar-panel,
.form-panel {
  min-height: 0;
  overflow: auto;
}

.sidebar-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-self: start;
}

.process-card {
  flex: none;
}

.form-panel {
  display: flex;
  flex-direction: column;
}

.info-card,
.form-card {
  border-radius: 16px;
}

.info-card :deep(.el-card__body),
.form-card :deep(.el-card__body) {
  padding: 18px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
  color: #1b2a4a;
  font-size: 15px;
}

.season-alert,
.submit-locked-alert {
  margin-bottom: 14px;
}

.notice-list {
  margin: 0;
  padding-left: 18px;
  color: #4d5b78;
  line-height: 1.8;
  font-size: 14px;
}

.flow-timeline {
  margin-top: 8px;
}

.flow-timeline :deep(.el-timeline-item) {
  padding-bottom: 18px;
}

.flow-timeline :deep(.el-timeline-item__node) {
  box-shadow: 0 0 0 4px rgba(25, 137, 250, 0.12);
}

.flow-step-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(25, 137, 250, 0.1);
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(25, 137, 250, 0.06);
}

.flow-step-title {
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #17315e;
}

.flow-step-desc {
  color: #5b6b88;
  line-height: 1.7;
  font-size: 14px;
}

.application-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-section {
  padding: 16px;
  border: 1px solid rgba(24, 137, 250, 0.12);
  border-radius: 16px;
  background: #ffffff;
}

.form-section-title {
  margin-bottom: 16px;
  font-weight: 700;
  color: #17315e;
  font-size: 15px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.form-span-2 {
  grid-column: span 2;
}

.form-grid :deep(.el-form-item) {
  margin-bottom: 18px;
}

.form-grid :deep(.el-form-item__label) {
  color: #344563;
  font-size: 14px;
}

.form-grid :deep(.el-select),
.form-grid :deep(.el-input) {
  width: 100%;
}

.access-card {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background: #f7fbff;
}

.access-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  height: 100%;
  padding: 0;
}

.access-card :deep(.el-result) {
  width: min(520px, calc(100vw - 48px));
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
}

@media (max-width: 1180px) {
  .page-body {
    grid-template-columns: 1fr;
  }

  .page-header-right {
    min-width: 0;
    width: 100%;
  }

  .header-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .sidebar-panel {
    order: 2;
  }

  .form-panel {
    order: 1;
  }
}

@media (max-width: 720px) {
  .page-header {
    flex-direction: column;
  }

  .header-summary {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-span-2 {
    grid-column: auto;
  }
}
</style>