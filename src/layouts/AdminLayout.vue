<template>
  <div class="admin-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="isCollapsed ? '72px' : '220px'" class="sidebar">
        <div class="sidebar-inner">
          <div class="logo" @click="isCollapsed = false">
            <transition name="fade">
              <h3 v-if="!isCollapsed">常青藤 Admin</h3>
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
              <template v-for="section in filteredMenu" :key="section.key">
                <el-menu-item v-if="section.type === 'item'" :index="section.index">
                  <el-icon v-if="section.icon" class="menu-icon">
                    <component :is="section.icon" />
                  </el-icon>
                  <span>{{ section.label }}</span>
                </el-menu-item>
                <el-sub-menu v-else :index="section.key">
                  <template #title>
                    <el-icon v-if="section.icon" class="menu-icon">
                      <component :is="section.icon" />
                    </el-icon>
                    <span>{{ section.label }}</span>
                  </template>
                  <el-menu-item
                    v-for="child in section.children"
                    :key="child.index"
                    :index="child.index"
                  >
                    {{ child.label }}
                  </el-menu-item>
                </el-sub-menu>
              </template>
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

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航 -->
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

        <!-- 内容区域 -->
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
import {
  ArrowDown,
  Calendar,
  DataLine,
  Document,
  Expand,
  Fold,
  OfficeBuilding,
  Tickets,
  Trophy,
  UserFilled,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import TeamFlag from '@/assets/TeamFlag.jpg'
import TeamEmblem from '@/assets/TeamEmblem.png'

type Role = 'admin' | 'superadmin' | ''

interface MenuItem {
  label: string
  index: string
  roles: Role[]
  icon?: Component
}

interface MenuSection {
  key: string
  type: 'item' | 'submenu'
  label: string
  index?: string
  roles: Role[]
  icon?: Component
  children?: MenuItem[]
}

const route = useRoute()
const router = useRouter()

const userRole = ref<Role>((localStorage.getItem('role') as Role) || '')
const studentId = ref(localStorage.getItem('student_id') || '')
const isCollapsed = ref(false)

const teamFlag = TeamFlag
const teamEmblem = TeamEmblem
const userStore = useUserStore()

const MENU_SECTIONS: MenuSection[] = [
  {
    key: 'dashboard',
    type: 'item',
    label: '仪表盘',
    index: '/admin/dashboard',
    roles: ['admin', 'superadmin'],
    icon: DataLine,
  },
  {
    key: 'profile',
    type: 'item',
    label: '个人中心',
    index: '/admin/profile',
    roles: ['admin', 'superadmin'],
    icon: UserFilled,
  },
  {
    key: 'user',
    type: 'submenu',
    label: '用户管理',
    roles: ['admin', 'superadmin'],
    icon: UserFilled,
    children: [
      { label: '用户列表', index: '/admin/user', roles: ['admin', 'superadmin'] },
      { label: '权限管理', index: '/admin/permission', roles: ['superadmin'] },
    ],
  },
  {
    key: 'organization',
    type: 'submenu',
    label: '组织架构',
    roles: ['admin', 'superadmin'],
    icon: OfficeBuilding,
    children: [
      { label: '部门管理', index: '/admin/department', roles: ['admin', 'superadmin'] },
      { label: '届次管理', index: '/admin/team-term', roles: ['admin', 'superadmin'] },
      { label: '骨干成员', index: '/admin/backbone-member', roles: ['admin', 'superadmin'] },
    ],
  },
  {
    key: 'recruitment',
    type: 'submenu',
    label: '报名管理',
    roles: ['admin', 'superadmin'],
    icon: Document,
    children: [
      { label: '报名列表', index: '/admin/recruitment', roles: ['admin', 'superadmin'] },
      {
        label: '报名通道',
        index: '/admin/recruitment-season',
        roles: ['admin', 'superadmin'],
      },
    ],
  },
  {
    key: 'activity',
    type: 'submenu',
    label: '活动管理',
    roles: ['admin', 'superadmin'],
    icon: Calendar,
    children: [
      { label: '活动记录', index: '/admin/activity', roles: ['admin', 'superadmin'] },
      {
        label: '活动参与',
        index: '/admin/activity-participant',
        roles: ['admin', 'superadmin'],
      },
    ],
  },
  {
    key: 'honor',
    type: 'item',
    label: '荣誉管理',
    index: '/admin/honor',
    roles: ['admin', 'superadmin'],
    icon: Trophy,
  },
  {
    key: 'content',
    type: 'submenu',
    label: '内容管理',
    roles: ['admin', 'superadmin'],
    icon: Document,
    children: [
      { label: '公告通知', index: '/admin/announcement', roles: ['admin', 'superadmin'] },
      { label: '团队相册', index: '/admin/gallery', roles: ['admin', 'superadmin'] },
      { label: '发展历程', index: '/admin/milestone', roles: ['admin', 'superadmin'] },
    ],
  },
  {
    key: 'email-code',
    type: 'item',
    label: '邮箱验证码',
    index: '/admin/email-code',
    roles: ['admin', 'superadmin'],
    icon: Tickets,
  },
  {
    key: 'task',
    type: 'submenu',
    label: '定时任务',
    roles: ['admin', 'superadmin'],
    icon: Tickets,
    children: [
      { label: '任务配置', index: '/admin/task-config', roles: ['admin', 'superadmin'] },
      { label: '执行日志', index: '/admin/task-logs', roles: ['admin', 'superadmin'] },
    ],
  },
  {
    key: 'operation-log',
    type: 'item',
    label: '操作日志',
    index: '/admin/operation-log',
    roles: ['superadmin'],
    icon: Tickets,
  },
]

const filteredMenu = computed<MenuSection[]>(() =>
  MENU_SECTIONS.filter((section) => section.roles.includes(userRole.value))
    .map((section) => {
      if (section.type === 'submenu') {
        const allowedChildren = (section.children ?? []).filter((child) =>
          child.roles.includes(userRole.value)
        )
        return {
          ...section,
          children: allowedChildren,
        }
      }
      return section
    })
    .filter((section) => (section.type === 'submenu' ? (section.children?.length ?? 0) > 0 : true))
)

const roleLabel = computed(() => {
  if (userRole.value === 'superadmin') return '超级管理员'
  if (userRole.value === 'admin') return '管理员'
  return '访客'
})

const activeMenu = computed(() => route.path)

const displayName = computed(
  () => userStore.displayName || localStorage.getItem('student_id') || '未登录账号'
)
const userInitial = computed(() => displayName.value.charAt(0)?.toUpperCase() || '访')
const userAvatar = computed(() => userStore.avatar)

const breadcrumb = computed(() => {
  const path = route.path
  const breadcrumbMap: Record<string, string> = {
    '/admin/dashboard': '仪表盘',
    '/admin/user': '用户管理',
    '/admin/department': '部门管理',
    '/admin/team-term': '届次管理',
    '/admin/backbone-member': '骨干成员管理',
    '/admin/activity': '活动管理',
    '/admin/activity-participant': '活动参与管理',
    '/admin/honor': '荣誉管理',
    '/admin/announcement': '公告管理',
    '/admin/gallery': '相册管理',
    '/admin/milestone': '发展历程管理',
    '/admin/email-code': '邮箱验证码管理',
    '/admin/operation-log': '操作日志',
    '/admin/task-config': '定时任务配置',
    '/admin/task-logs': '定时任务执行日志',
  }
  return breadcrumbMap[path] || ''
})

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('student_id')
  localStorage.removeItem('email')
  userRole.value = ''
  userStore.clearProfile()
  router.push('/')
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const goProfile = () => {
  router.push('/admin/profile')
}

onMounted(() => {
  userStore.fetchProfile(studentId.value || undefined)
})
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
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

.menu-icon {
  margin-right: 12px;
}

.el-menu--collapse .menu-icon {
  margin-right: 0;
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

.header-right {
  display: flex;
  align-items: center;
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
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 12px;
  overflow: hidden;
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

:deep(.el-menu--popup) {
  background: rgba(0, 35, 82, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(6px);
}

:deep(.el-menu--popup .el-menu-item) {
  color: #fff;
}

:deep(.el-menu--popup .el-menu-item.is-active),
:deep(.el-menu--popup .el-menu-item:hover) {
  background: rgba(25, 137, 250, 0.35);
}
</style>
