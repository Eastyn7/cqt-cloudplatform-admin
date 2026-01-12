<template>
  <AuroraBackground>
    <Transition appear enter-active-class="fade-in-up" leave-active-class="fade-out">
      <div class="home-content">
        <!-- 左侧内容区域 -->
        <div class="home-left">
          <div class="home-header">
            <div class="title-with-logo">
              <img class="team-logo" :src="TeamEmblem" alt="Team Emblem" />
              <h1>常青藤志愿服务平台</h1>
            </div>
            <p class="subtitle">CTBU·AI Volunteer Service Platform</p>
          </div>

          <div class="platform-intro">
            <h2>平台简介</h2>
            <p>
              常青藤志愿服务平台致力于为志愿者提供优质的服务管理体验，通过系统化的管理方式，提升志愿服务效率和质量。
            </p>
            <p>
              管理员可通过后台管理系统进行用户管理、活动管理、数据统计等操作，实现志愿服务全流程数字化管理。
            </p>
          </div>
        </div>

        <!-- 右侧登录表单区域 -->
        <div class="home-right">
          <el-card class="login-card" shadow="always">
            <template #header>
              <div class="login-header">
                <h3>管理员登录</h3>
                <p class="login-subtitle">请使用您的账号登录后台管理系统</p>
              </div>
            </template>

            <el-form
              ref="loginFormRef"
              :model="loginForm"
              :rules="loginRules"
              class="login-form"
              @submit.prevent="handleLogin"
            >
              <el-form-item prop="loginInput">
                <el-input
                  v-model="loginForm.loginInput"
                  placeholder="请输入学号或邮箱"
                  size="large"
                  clearable
                />
              </el-form-item>

              <el-form-item prop="password">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  show-password
                  clearable
                  @keyup.enter="handleLogin"
                />
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  class="login-button"
                  :loading="loginLoading"
                  @click="handleLogin"
                >
                  {{ loginLoading ? '登录中...' : '登录' }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </div>
    </Transition>

    <div class="home-footer">
      <p>© 2025 常青藤志愿服务平台 - 后台管理系统</p>

      <!-- 工信部ICP备案 -->
      <p class="icp">
        <a href="https://beian.miit.gov.cn/" target="_blank"> 蜀ICP备2023043183号-1 </a>
      </p>
    </div>
  </AuroraBackground>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { authApi } from '../utils/api'
import type { UserRole } from '../utils/api/types'
import { message } from '../utils/message'
import TeamEmblem from '../assets/TeamEmblem.png'

const router = useRouter()

const ADMIN_ROLES: UserRole[] = ['admin', 'superadmin']

// 登录相关
const loginFormRef = ref<FormInstance>()
const loginLoading = ref(false)
const loginForm = reactive({
  loginInput: '',
  password: '',
})

const loginRules: FormRules = {
  loginInput: [{ required: true, message: '请输入学号或邮箱', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loginLoading.value = true
    try {
      const res = await authApi.login({
        loginInput: loginForm.loginInput,
        password: loginForm.password,
      })

      if (res.success && res.data?.token) {
        const userRole = res.data.role

        if (!userRole) {
          message.error('未获取到用户角色，无法登录后台')
          return
        }

        if (!ADMIN_ROLES.includes(userRole)) {
          message.error('当前账号没有后台访问权限')
          return
        }

        // 保存 token 与用户信息
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('role', userRole)
        if (res.data.student_id) {
          localStorage.setItem('student_id', res.data.student_id)
        }
        if (res.data.email) {
          localStorage.setItem('email', res.data.email)
        }

        message.success('登录成功')
        // 跳转到后台管理首页
        router.push('/admin/dashboard')
      }
    } catch (error) {
      // 错误信息已在 request 拦截器中处理
      console.error('登录失败:', error)
    } finally {
      loginLoading.value = false
    }
  })
}
</script>

<style scoped>
.home-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  gap: 60px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - 80px);
}

.home-left {
  flex: 1;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  color: #000000;
}

.home-header {
  text-align: left;
}

.title-with-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 20px 0;
}

.team-logo {
  height: 56px;
  width: auto;
  object-fit: contain;
}

.home-header h1 {
  font-size: 56px;
  color: #000000;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 18px;
  opacity: 0.95;
  margin: 0;
  font-weight: 300;
  letter-spacing: 1px;
}

.platform-intro {
  background: rgb(0, 0, 0);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.platform-intro h2 {
  font-size: 24px;
  margin: 0 0 20px 0;
  color: #fff;
  font-weight: 600;
}

.platform-intro p {
  font-size: 16px;
  line-height: 1.8;
  margin: 15px 0;
  color: rgba(255, 255, 255, 0.95);
  opacity: 0.9;
}

.home-right {
  flex: 0 0 450px;
}

.login-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  padding: 10px 0;
}

.login-header h3 {
  font-size: 28px;
  margin: 0 0 10px 0;
  color: #333;
  font-weight: 600;
}

.login-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.login-form {
  margin-top: 30px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 12px 15px;
  border-radius: 8px;
}

.login-form :deep(.el-input__prefix) {
  color: #909399;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  margin-top: 10px;
}

.home-footer {
  max-height: 80px;
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 10px 10px;
  color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.home-footer p {
  margin: 4px 0;
  font-size: 14px;
}

.home-footer .icp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.home-footer .icp a {
  text-decoration: none;
  color: rgba(0, 0, 0, 0.8);
}

/* 动画效果 */
.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

.fade-out {
  animation: fadeOut 0.3s ease-in;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
    filter: blur(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .home-content {
    flex-direction: column;
    gap: 40px;
    padding: 40px 20px;
  }

  .home-left {
    max-width: 100%;
    text-align: center;
  }

  .home-header {
    text-align: center;
  }

  .home-right {
    flex: 0 0 auto;
    width: 100%;
    max-width: 450px;
  }
}

@media (max-width: 768px) {
  .home-header h1 {
    font-size: 36px;
  }

  .subtitle {
    font-size: 14px;
  }

  .platform-intro {
    padding: 20px;
  }

  .platform-intro h2 {
    font-size: 20px;
  }

  .platform-intro p {
    font-size: 14px;
  }

  .login-header h3 {
    font-size: 24px;
  }
}
</style>
