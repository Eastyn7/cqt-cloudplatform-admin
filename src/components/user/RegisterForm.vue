<template>
  <div class="register-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="0px" class="inner-form">
      <div class="row two-cols">
        <el-form-item prop="student_id">
          <el-input v-model="form.student_id" placeholder="学号 (10位)" size="small" clearable />
        </el-form-item>

        <el-form-item prop="name">
          <el-input v-model="form.name" placeholder="姓名" size="small" clearable />
        </el-form-item>
      </div>

      <el-form-item prop="email">
        <el-input v-model="form.email" placeholder="学校邮箱 (例如：20240001@ctbu.edu.cn)" size="small" clearable />
      </el-form-item>

      <el-form-item prop="password">
        <el-input v-model="form.password" type="password" placeholder="密码 (至少6位)" size="small" show-password clearable />
      </el-form-item>

      <el-form-item prop="code">
        <el-input v-model="form.code" placeholder="邮箱验证码" size="small" clearable>
          <template #append>
            <el-button :disabled="countdown>0" :loading="sending" size="small" @click="sendCode">
              {{ countdown>0 ? countdown + 's' : '获取验证码' }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="submitting" class="full-btn" size="small" @click="handleRegister">注册</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeUnmount } from 'vue'
import { emailApi, authApi } from '../../utils/api'
import { message } from '../../utils/message'
import type { FormInstance, FormRules } from 'element-plus'

const emit = defineEmits(['registered'] as const)

const formRef = ref<FormInstance>()
const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const form = reactive({
  student_id: '',
  name: '',
  email: '',
  password: '',
  code: '',
})

const rules: FormRules = {
  student_id: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { pattern: /^\d{10}$/, message: '学号必须为10位数字', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const startCountdown = (s = 60) => {
  countdown.value = s
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0
      if (timer) { clearInterval(timer); timer = null }
      return
    }
    countdown.value -= 1
  }, 1000)
}

const sendCode = async () => {
  if (!form.email) {
    message.warning('请输入邮箱')
    return
  }
  sending.value = true
  try {
    await emailApi.sendCode({ email: form.email, type: 'register' })
    startCountdown(60)
  } catch (e) {
    console.error(e)
  } finally {
    sending.value = false
  }
}

const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await authApi.register({
        student_id: form.student_id,
        email: form.email,
        password: form.password,
        name: form.name,
        code: form.code,
      })
      // 请求封装会展示成功提示，父组件会处理切换逻辑
      emit('registered')
    } catch (e) {
      console.error('注册失败', e)
    } finally {
      submitting.value = false
    }
  })
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.register-form { width: 100%; }
.inner-form { max-width: 420px; margin: 8px auto 0; }
.row.two-cols { display: flex; gap: 12px; }
.row.two-cols :deep(.el-form-item) { flex: 1; }
.full-btn { width: 100%; height: 44px; border-radius: 8px; }

/* 缩小输入高度以避免页面滚动 */
.inner-form :deep(.el-input__inner) { height: 40px; padding: 8px 12px; }

@media (max-width: 480px) {
  .row.two-cols { flex-direction: column; }
  .inner-form { max-width: 100%; padding: 0 8px; }
}
</style>
