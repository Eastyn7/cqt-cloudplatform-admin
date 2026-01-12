<template>
  <div class="profile-center">
    <el-row :gutter="20">
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="profile-card" :loading="profileLoading">
          <template #header>
            <div class="card-header">
              <span>个人名片</span>
              <el-tag
                v-if="profile?.role"
                size="large"
                effect="dark"
                type="primary"
                class="role-tag"
              >
                {{ roleMap[profile.role] || '管理员' }}
              </el-tag>
            </div>
          </template>
          <div class="avatar-wrapper">
            <el-upload
              class="avatar-upload"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/png,image/jpeg,image/webp"
              :on-change="handleAvatarChange"
            >
              <div class="avatar-border" :class="{ uploading: avatarUploading }">
                <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" />
                <span v-else>{{ profileInitial }}</span>
                <div class="avatar-mask">
                  <el-icon>
                    <Camera />
                  </el-icon>
                  <span>更换头像</span>
                </div>
              </div>
            </el-upload>
            <el-progress
              v-if="avatarUploading"
              :percentage="avatarProgress"
              :stroke-width="4"
              status="success"
            />
          </div>
          <p class="profile-name">{{ profile?.name || '未填写姓名' }}</p>
          <p class="profile-desc">
            {{ profile?.college || '未填写学院' }} · {{ profile?.major || '未填写专业' }}
          </p>
          <el-divider />
          <el-descriptions :column="1" size="small" class="profile-info">
            <el-descriptions-item label="学号">{{
              profile?.student_id || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ profile?.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{
              profile?.phone || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="加入时间">{{ joinDateDisplay }}</el-descriptions-item>
            <el-descriptions-item label="最后登录时间">{{
              dateUtil.format(profile?.last_login_at) || '--'
            }}</el-descriptions-item>
          </el-descriptions>
          <div class="skill-tags" v-if="skillTags.length">
            <el-tag v-for="tag in skillTags" :key="tag" type="primary" effect="dark" size="small">
              {{ tag }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>基本资料</span>
              <small>与团队其他模块共享，请保持最新</small>
            </div>
          </template>
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="90px"
            class="profile-form"
          >
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="profileForm.name" placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="联系电话" prop="phone">
                  <el-input v-model="profileForm.phone" placeholder="用于紧急联系" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="学院" prop="college">
                  <el-input v-model="profileForm.college" placeholder="如：信息工程学院" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="专业" prop="major">
                  <el-input v-model="profileForm.major" placeholder="如：计算机科学与技术" />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="擅长领域" prop="skill_tags">
                  <el-input
                    v-model="profileForm.skill_tags"
                    placeholder="多项以逗号分隔，如：组织统筹,摄影"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="form-actions">
              <el-button type="primary" :loading="profileSaving" @click="handleProfileSubmit">
                保存资料
              </el-button>
              <el-button text @click="resetProfileForm">恢复原数据</el-button>
            </div>
          </el-form>
        </el-card>

        <el-card shadow="hover" class="password-card">
          <template #header>
            <div class="card-header">
              <span>账号安全</span>
              <small>修改密码前需要邮箱验证码校验</small>
            </div>
          </template>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="96px"
            class="profile-form"
          >
            <el-form-item label="绑定邮箱">
              <el-input v-model="passwordForm.email" disabled />
            </el-form-item>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="passwordForm.oldPassword" type="password" show-password />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="passwordForm.newPassword" type="password" show-password />
                </el-form-item>
              </el-col>
              <el-col :xs="24">
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="邮箱验证码" prop="code">
              <el-input v-model="passwordForm.code" placeholder="6 位验证码" maxlength="6">
                <template #append>
                  <el-button
                    :disabled="sendCodeDisabled"
                    :loading="codeLoading"
                    @click="handleSendCode"
                  >
                    {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <div class="form-actions">
              <el-button type="primary" :loading="passwordSaving" @click="handlePasswordSubmit">
                更新密码
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Camera } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { emailApi, passwordApi, userInfoApi } from '@/utils/api'
import type { UpdateUserInfoParams } from '@/utils/api/types'
import {
  getSignedOssUrl,
  uploadToOssWithKey,
  validateFileSize,
  validateFileType,
} from '@/utils/oss'
import { message } from '@/utils/message'
import { useUserStore } from '@/stores/user'
import { useDate } from '@/utils/date'

const dateUtil = useDate

const roleMap: Record<string, string> = {
  superadmin: '超级管理员',
  admin: '管理员',
  user: '志愿者',
}

const studentId = ref(localStorage.getItem('student_id') || '')
const userStore = useUserStore()
const { profile } = storeToRefs(userStore)
const profileLoading = ref(false)
const profileSaving = ref(false)
const profileFormRef = ref<FormInstance>()
const avatarUrl = ref('')
const avatarUploading = ref(false)
const avatarProgress = ref(0)

const profileForm = reactive<UpdateUserInfoParams>({
  name: '',
  college: '',
  major: '',
  phone: '',
  skill_tags: '',
  avatar_key: '',
})

const profileRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    {
      validator: (_, value, callback) => {
        if (!value) return callback()
        const valid = /^1[3-9]\d{9}$/.test(value)
        return valid ? callback() : callback(new Error('请输入正确的手机号'))
      },
      trigger: 'blur',
    },
  ],
}

const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  email: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  code: '',
})

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      min: 8,
      message: '密码长度至少 8 位',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次密码输入不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const passwordSaving = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)
let countdownTimer: number | null = null

const skillTags = computed(() =>
  profile.value?.skill_tags
    ? profile.value.skill_tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : []
)

const profileInitial = computed(() => profile.value?.name?.charAt(0) || '青')

const sendCodeDisabled = computed(() => countdown.value > 0 || !passwordForm.email)
const joinDateDisplay = computed(() => dateUtil.formatDate(profile.value?.join_date) || '-')

const buildAvatarPreviewUrl = async (
  avatarKey?: string | null,
  fallbackUrl = ''
): Promise<string> => {
  if (!avatarKey) return fallbackUrl
  try {
    // 头像只在前端按需生成临时访问地址，后端仅存储 key
    return await getSignedOssUrl(avatarKey, {
      expiresInSeconds: 60 * 60,
      disposition: 'inline',
    })
  } catch (error) {
    console.error('生成头像预览链接失败:', error)
    return fallbackUrl
  }
}

const resetProfileForm = async () => {
  if (!profile.value) return
  profileForm.name = profile.value.name || ''
  profileForm.college = profile.value.college || ''
  profileForm.major = profile.value.major || ''
  profileForm.phone = profile.value.phone || ''
  profileForm.skill_tags = profile.value.skill_tags || ''
  profileForm.avatar_key = profile.value.avatar_key || ''
  // 从 avatar_key 生成预览 URL
  const key = profile.value.avatar_key || undefined
  avatarUrl.value = await buildAvatarPreviewUrl(key, '')
}

const loadProfile = async () => {
  if (!studentId.value) {
    message.warning('未检测到管理员学号，请重新登录')
    return
  }
  profileLoading.value = true
  try {
    await userStore.fetchProfile(studentId.value)
    if (profile.value) {
      passwordForm.email = profile.value.email || ''
      await resetProfileForm()
    }
  } catch (error) {
    console.error('获取个人信息失败', error)
    message.error('获取个人资料失败，请稍后重试')
  } finally {
    profileLoading.value = false
  }
}

const buildPayload = (fields: UpdateUserInfoParams): UpdateUserInfoParams => {
  const payload: UpdateUserInfoParams = {}
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      payload[key as keyof UpdateUserInfoParams] = value
    }
  })
  return payload
}

const handleProfileSubmit = async () => {
  if (!profileFormRef.value) return
  const isValid = await profileFormRef.value.validate().catch(() => false)
  if (!isValid) return
  await saveProfile(buildPayload(profileForm))
}

const saveProfile = async (payload: UpdateUserInfoParams) => {
  if (!studentId.value) {
    message.error('未能定位当前管理员')
    return
  }
  if (Object.keys(payload).length === 0) {
    message.info('资料未发生变化')
    return
  }
  profileSaving.value = true
  try {
    await userInfoApi.updateUserInfo(studentId.value, payload)
    await loadProfile()
  } catch (error) {
    console.error('更新资料失败', error)
  } finally {
    profileSaving.value = false
  }
}

const handleAvatarChange = async (file: UploadFile) => {
  const raw = file.raw
  if (!raw) return
  if (!validateFileType(raw, ['image/png', 'image/jpeg', 'image/webp'])) {
    message.warning('仅支持 PNG/JPG/WebP 格式')
    return
  }
  if (!validateFileSize(raw)) {
    message.warning('头像大小不能超过 10MB')
    return
  }
  avatarUploading.value = true
  try {
    const { url, key } = await uploadToOssWithKey(raw, 'uploads/avatars/', (progress) => {
      avatarProgress.value = progress
    })
    // 前端本地立即使用临时 URL 预览，后端仅保存 key
    avatarUrl.value = url
    profileForm.avatar_key = key
    await saveProfile({ avatar_key: key })
  } catch (error) {
    console.error('上传头像失败', error)
    message.error('上传头像失败，请稍后重试')
  } finally {
    avatarUploading.value = false
    avatarProgress.value = 0
  }
}

const startCountdown = () => {
  countdown.value = 60
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

const handleSendCode = async () => {
  if (!passwordForm.email) {
    message.warning('当前账号未绑定邮箱，无法发送验证码')
    return
  }
  codeLoading.value = true
  try {
    await emailApi.sendCode({ email: passwordForm.email, type: 'reset_password' })
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败', error)
  } finally {
    codeLoading.value = false
  }
}

const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return
  const isValid = await passwordFormRef.value.validate().catch(() => false)
  if (!isValid) return
  passwordSaving.value = true
  try {
    await passwordApi.changePassword({
      email: passwordForm.email,
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      code: passwordForm.code,
    })
    Object.assign(passwordForm, {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      code: '',
    })
    countdown.value = 0
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  } catch (error) {
    console.error('修改密码失败', error)
  } finally {
    passwordSaving.value = false
  }
}

onMounted(() => {
  loadProfile()
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.profile-center {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 0;
}

.profile-card {
  border-radius: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.card-header small {
  font-weight: 400;
  color: #909399;
  font-size: 12px;
}

.role-tag {
  font-size: 18px;
  padding: 4px 12px;
}

.avatar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.avatar-border {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1989fa, #4cb5ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.avatar-border img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-border.uploading {
  opacity: 0.8;
}

.avatar-border:hover {
  transform: translateY(-2px);
}

.avatar-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 12px;
  letter-spacing: 1px;
}

.avatar-border:hover .avatar-mask {
  opacity: 1;
}

.profile-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  color: #1f2d3d;
}

.profile-desc {
  margin: 6px 0 0;
  text-align: center;
  color: #909399;
}

.profile-info {
  margin-top: 12px;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.profile-form {
  margin-top: 0;
}

.form-actions {
  margin-top: 8px;
  display: flex;
  gap: 10px;
}

.password-card {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
}

:deep(.profile-form .el-form-item) {
  margin-bottom: 13px;
}
</style>
