<template>
  <div class="user-layout">
    <el-container>
      <el-aside :width="isCollapsed ? '72px' : '220px'" class="sidebar">
        <div class="sidebar-inner">
          <div class="logo" @click="isCollapsed = false">
            <transition name="fade">
              <h3 v-if="!isCollapsed">常青藤 志愿者</h3>
              <span v-else class="logo-mini">CQT</span>
            </transition>
          </div>
          <el-scrollbar class="sidebar-scroll">
            <el-menu
              :default-active="activeMenu"
              router
              class="sidebar-menu"
              background-color="transparent"
              text-color="rgba(255,255,255,0.70)"
              active-text-color="#ffffff"
              :collapse="isCollapsed"
              :collapse-transition="true"
              :popper-offset="16"
              :popper-style="{
                backgroundColor: 'rgba(0, 35, 82, 0.95)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(6px)',
                padding: '6px 0',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              }"
            >
              <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
                <el-icon v-if="item.icon" class="menu-icon">
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.label }}</span>
              </el-menu-item>
            </el-menu>
          </el-scrollbar>
          <div class="sidebar-footer">
            <transition name="fade" mode="out-in">
              <img v-if="!isCollapsed" :src="teamFlag" alt="team flag" class="footer-flag" />
              <img v-else :src="teamEmblem" alt="team emblem" class="footer-emblem" />
            </transition>
          </div>
        </div>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-button class="collapse-btn" link circle @click="toggleSidebar">
              <el-icon>
                <component :is="isCollapsed ? Expand : Fold" />
              </el-icon>
            </el-button>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="breadcrumb">{{ breadcrumb }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown trigger="click">
              <div class="user-info">
                <div class="user-avatar">
                  <img v-if="userAvatar" :src="userAvatar" alt="avatar" />
                  <span v-else>{{ userInitial }}</span>
                </div>
                <div class="user-meta">
                  <span class="user-name">{{ displayName }}</span>
                  <span class="user-role">{{ roleLabel }}</span>
                </div>
                <el-icon class="arrow-icon">
                  <ArrowDown />
                </el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item disabled>当前账号：{{ displayName }}</el-dropdown-item>
                  <el-dropdown-item @click="goProfile">个人中心</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { ArrowDown, Calendar, DataLine, Document, Expand, Fold, Medal, Picture, TrendCharts, UserFilled } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import TeamFlag from '@/assets/TeamFlag.jpg'
import TeamEmblem from '@/assets/TeamEmblem.png'
import { message } from '@/utils/message'

interface MenuItem {
  label: string
  index: string
  icon?: Component
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapsed = ref(false)

const teamFlag = TeamFlag
const teamEmblem = TeamEmblem

const currentStudentId = computed(() => userStore.profile?.student_id || localStorage.getItem('student_id') || '')
const currentRole = computed(() => userStore.profile?.role || localStorage.getItem('role') || '')

// 使用新的报名资格判断逻辑（来自 /team-recruitment/user-status）
const showNewStudentEntry = computed(() => currentRole.value === 'user' && !userStore.isBackboneMember)
const showElectionEntry = computed(() => currentRole.value === 'user' && userStore.isBackboneMember)

const menuItems = computed(() => {
  const items: Array<MenuItem | undefined> = [
    { label: '数据驾驶舱', index: '/user/dashboard', icon: DataLine },
    showNewStudentEntry.value ? { label: '新生报名', index: '/user/recruitment', icon: Document } : undefined,
    showElectionEntry.value ? { label: '换届竞选', index: '/user/election', icon: Medal } : undefined,
    { label: '个人中心', index: '/user/profile', icon: UserFilled },
    { label: '人物画像', index: '/user/portrait', icon: TrendCharts },
    { label: '公告通知', index: '/user/announcements', icon: Document },
    { label: '活动报名', index: '/user/activities', icon: Calendar },
    { label: '团队相册', index: '/user/gallery', icon: Picture },
    { label: '我的证书', index: '/user/certificates', icon: Medal },
  ]

  return items.filter((item): item is MenuItem => Boolean(item))
})

const activeMenu = computed(() => route.path)

const displayName = computed(() => userStore.displayName || '志愿者')
const userAvatar = computed(() => userStore.avatar)
const userInitial = computed(() => displayName.value.slice(-2))

const roleLabel = computed(() => {
  const role = currentRole.value
  if (role === 'superadmin') return '超级管理员'
  if (role === 'admin') return '管理员'
  return '志愿者'
})

const breadcrumb = computed(() => {
  const matched = route.matched.find((record) => record.meta?.title)
  return matched?.meta?.title as string | undefined
})

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const goProfile = () => {
  router.push('/user/profile')
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('student_id')
  localStorage.removeItem('email')
  userStore.clearProfile()
  message.success('已退出登录')
  router.push('/')
}

onMounted(() => {
  const studentId = currentStudentId.value
  if (studentId) {
    void userStore.fetchProfile(studentId)
  }
})
</script>

<style scoped>
.user-layout {
  height: 100vh;
  overflow: hidden;
  background: #0b1c3d;
}

.sidebar {
  background: linear-gradient(180deg, #1989fa 0%, #4cb5ff 100%);
  height: 100vh;
  overflow: hidden;
  transition: width 0.2s ease;
  color: #fff;
  box-shadow: 8px 0 24px rgba(25, 137, 250, 0.18);
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.logo h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.logo-mini {
  font-size: 20px;
  letter-spacing: 2px;
}

.sidebar-scroll {
  flex: 1;
  height: calc(100vh - 150px);
}

.sidebar-menu {
  border-right: none;
  height: 100%;
  background-color: transparent;
  padding-top: 12px;
}

.menu-icon {
  margin-right: 12px;
}

.el-menu--collapse .menu-icon {
  margin-right: 0;
}

.sidebar-footer {
  padding: 18px 12px 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-flag {
  width: 100%;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
}

.footer-emblem {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  background: rgb(255, 255, 255);
  padding: 6px;
}

.header {
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  color: #606266;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 28px;
  transition: all 0.2s ease;
  color: #1f2d3d;
  background-color: #eaf4ff;
  border: 1px solid transparent;
  box-shadow: 0 6px 16px rgba(25, 137, 250, 0.15);
}

.user-info:hover {
  background-color: #d9ecff;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1989fa, #4cb5ff);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-weight: 600;
  margin-right: 12px;
  color: #fff;
  font-size: 16px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-meta {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  margin-right: 8px;
  gap: 4px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
}

.user-role {
  color: #909399;
}

.arrow-icon {
  color: #909399;
}

.main-content {
  background-color: #f5f9ff;
  padding: 20px;
  overflow-y: auto;
  height: calc(100vh - 60px);
}
</style>
