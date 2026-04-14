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
              <AdminMenuNode v-for="section in filteredMenu" :key="section.key" :node="section" />
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
              <el-breadcrumb-item v-for="(label, idx) in breadcrumbLabels" :key="`${label}-${idx}`">
                {{ label }}
              </el-breadcrumb-item>
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
                  <el-dropdown-item @click="goProfile">个人资料</el-dropdown-item>
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
  Medal,
  OfficeBuilding,
  Picture,
  Tickets,
  Timer,
  Trophy,
  TrendCharts,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import TeamFlag from '@/assets/TeamFlag.jpg'
import TeamEmblem from '@/assets/TeamEmblem.png'
import AdminMenuNode from '@/components/admin/AdminMenuNode.vue'

type Role = 'admin' | 'superadmin' | ''

interface MenuNode {
  key: string
  label: string
  roles: Role[]
  index?: string
  icon?: Component
  children?: MenuNode[]
}

const route = useRoute()
const router = useRouter()

const userRole = ref<Role>((localStorage.getItem('role') as Role) || '')
const studentId = ref(localStorage.getItem('student_id') || '')
const isCollapsed = ref(false)

const teamFlag = TeamFlag
const teamEmblem = TeamEmblem
const userStore = useUserStore()

const MENU_SECTIONS: MenuNode[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    index: '/admin/dashboard',
    roles: ['admin', 'superadmin'],
    icon: DataLine,
  },
  {
    key: 'personal-certificate',
    label: '个人中心',
    roles: ['admin', 'superadmin'],
    icon: Medal,
    children: [
      {
        key: 'profile',
        label: '个人资料',
        index: '/admin/profile',
        roles: ['admin', 'superadmin'],
        icon: UserFilled,
      },
      {
        key: 'user-portrait',
        label: '个人画像',
        index: '/admin/user-portrait',
        roles: ['admin', 'superadmin'],
        icon: TrendCharts,
      },
      {
        key: 'my-certificates',
        label: '志愿时长证明',
        index: '/admin/my-certificates',
        roles: ['admin', 'superadmin'],
        icon: Medal,
      },
    ],
  },
  {
    key: 'user',
    label: '用户管理',
    roles: ['admin', 'superadmin'],
    icon: User,
    children: [
      {
        key: 'user-list',
        label: '用户列表',
        index: '/admin/user',
        roles: ['admin', 'superadmin'],
        icon: User,
      },
      {
        key: 'permission',
        label: '权限管理',
        index: '/admin/permission',
        roles: ['superadmin'],
        icon: UserFilled,
      },
    ],
  },
  {
    key: 'organization',
    label: '组织架构',
    roles: ['admin', 'superadmin'],
    icon: OfficeBuilding,
    children: [
      {
        key: 'team-term',
        label: '届次管理',
        index: '/admin/team-term',
        roles: ['admin', 'superadmin'],
        icon: Calendar,
      },
      {
        key: 'department',
        label: '部门管理',
        index: '/admin/department',
        roles: ['admin', 'superadmin'],
        icon: OfficeBuilding,
      },
      {
        key: 'backbone-member',
        label: '骨干成员',
        index: '/admin/backbone-member',
        roles: ['admin', 'superadmin'],
        icon: UserFilled,
      },
    ],
  },
  {
    key: 'recruitment',
    label: '组织报名管理',
    roles: ['admin', 'superadmin'],
    icon: Tickets,
    children: [
      {
        key: 'recruitment-season',
        label: '报名通道',
        index: '/admin/recruitment-season',
        roles: ['admin', 'superadmin'],
        icon: Tickets,
      },
      {
        key: 'recruitment-list',
        label: '报名列表',
        index: '/admin/recruitment',
        roles: ['admin', 'superadmin'],
        icon: Tickets,
      },
    ],
  },
  {
    key: 'activity',
    label: '活动管理',
    roles: ['admin', 'superadmin'],
    icon: Calendar,
    children: [
      {
        key: 'activity-signup',
        label: '活动报名',
        index: '/admin/activity-signup',
        roles: ['admin', 'superadmin'],
        icon: Calendar,
      },
      {
        key: 'activity-list',
        label: '活动发布',
        index: '/admin/activity',
        roles: ['admin', 'superadmin'],
        icon: Calendar,
      },
      {
        key: 'activity-participant',
        label: '活动参与记录',
        index: '/admin/activity-participant',
        roles: ['admin', 'superadmin'],
        icon: Calendar,
      },
      {
        key: 'recommendation-strategy',
        label: '推荐策略',
        index: '/admin/recommendation-strategy',
        roles: ['admin', 'superadmin'],
        icon: TrendCharts,
      },
      {
        key: 'recommendations',
        label: '推荐审计',
        index: '/admin/recommendations',
        roles: ['admin', 'superadmin'],
        icon: TrendCharts,
      },
    ],
  },
  {
    key: 'content',
    label: '内容管理',
    roles: ['admin', 'superadmin'],
    icon: Picture,
    children: [
      {
        key: 'news-content',
        label: '资讯内容',
        roles: ['admin', 'superadmin'],
        icon: Document,
        children: [
          {
            key: 'current-announcements',
            label: '当前公告',
            index: '/admin/current-announcements',
            roles: ['admin', 'superadmin'],
            icon: Document,
          },
          {
            key: 'announcement',
            label: '公告管理',
            index: '/admin/announcement',
            roles: ['admin', 'superadmin'],
            icon: Document,
          },
          {
            key: 'milestone',
            label: '发展历程记录',
            index: '/admin/milestone',
            roles: ['admin', 'superadmin'],
            icon: DataLine,
          },
        ],
      },
      {
        key: 'resource-material',
        label: '资源素材',
        roles: ['admin', 'superadmin'],
        icon: Picture,
        children: [
          {
            key: 'gallery',
            label: '组织相册',
            index: '/admin/gallery',
            roles: ['admin', 'superadmin'],
            icon: Picture,
          },
          {
            key: 'honor',
            label: '荣誉记录',
            index: '/admin/honor',
            roles: ['admin', 'superadmin'],
            icon: Trophy,
          },
          {
            key: 'certificate-management',
            label: '证书管理',
            roles: ['admin', 'superadmin'],
            icon: Medal,
            children: [
              {
                key: 'certificate-templates',
                label: '证书模版',
                index: '/admin/certificate-templates',
                roles: ['admin', 'superadmin'],
                icon: Medal,
              },
              {
                key: 'certificates',
                label: '证书下载记录',
                index: '/admin/certificates',
                roles: ['admin', 'superadmin'],
                icon: Medal,
              },
            ],
          },
          {
            key: 'portrait-dimensions',
            label: '画像维度管理',
            index: '/admin/portrait-dimensions',
            roles: ['admin', 'superadmin'],
            icon: TrendCharts,
          },
        ],
      },
    ],
  },
  {
    key: 'system-settings',
    label: '系统设置',
    roles: ['admin', 'superadmin'],
    icon: Document,
    children: [
      {
        key: 'email-code',
        label: '邮箱验证码',
        index: '/admin/email-code',
        roles: ['admin', 'superadmin'],
        icon: Document,
      },
      {
        key: 'task',
        label: '定时任务',
        roles: ['admin', 'superadmin'],
        icon: Timer,
        children: [
          {
            key: 'task-config',
            label: '任务配置',
            index: '/admin/task-config',
            roles: ['admin', 'superadmin'],
            icon: Timer,
          },
          {
            key: 'task-logs',
            label: '执行日志',
            index: '/admin/task-logs',
            roles: ['admin', 'superadmin'],
            icon: Medal,
          },
        ],
      },
      {
        key: 'operation-log',
        label: '操作日志',
        index: '/admin/operation-log',
        roles: ['superadmin'],
        icon: Medal,
      },
    ],
  },
]

const hasChildren = (node: MenuNode): node is MenuNode & { children: MenuNode[] } =>
  Array.isArray(node.children) && node.children.length > 0

const filterMenuByRole = (nodes: MenuNode[], role: Role): MenuNode[] =>
  nodes
    .filter((node) => node.roles.includes(role))
    .map((node) => {
      if (!hasChildren(node)) return { ...node }
      const children = filterMenuByRole(node.children, role)
      return {
        ...node,
        children,
      }
    })
    .filter((node) => !hasChildren(node) || node.children.length > 0)

const filteredMenu = computed<MenuNode[]>(() => filterMenuByRole(MENU_SECTIONS, userRole.value))

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

const findMenuPathByRoute = (nodes: MenuNode[], path: string, trail: MenuNode[] = []): MenuNode[] | null => {
  for (const node of nodes) {
    const currentTrail = [...trail, node]
    if (node.index === path) {
      return currentTrail
    }
    if (hasChildren(node)) {
      const nested = findMenuPathByRoute(node.children, path, currentTrail)
      if (nested) return nested
    }
  }
  return null
}

const breadcrumbLabels = computed(() => {
  const matched = findMenuPathByRoute(filteredMenu.value, route.path)
  if (matched?.length) {
    return matched.map((node) => node.label)
  }
  const title = typeof route.meta?.title === 'string' ? route.meta.title : ''
  return title ? [title] : []
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
