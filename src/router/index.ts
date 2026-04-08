import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { message } from '../utils/message'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: '首页',
      requiresAuth: false,
    },
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: {
      requiresAuth: true,
      roles: ['admin', 'superadmin'],
    },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/admin/DashboardView.vue'),
        meta: {
          title: '仪表盘',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'profile',
        name: 'admin-profile',
        component: () => import('../views/admin/ProfileCenter.vue'),
        meta: {
          title: '个人中心',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'user-portrait',
        name: 'admin-user-portrait',
        component: () => import('../views/user/UserPortraitView.vue'),
        meta: {
          title: '人物画像',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'user',
        name: 'admin-user',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: {
          title: '用户管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'permission',
        name: 'admin-permission',
        component: () => import('../views/admin/PermissionSettingManagement.vue'),
        meta: {
          title: '权限管理',
          requiresAuth: true,
          roles: ['superadmin'],
        },
      },
      {
        path: 'department',
        name: 'admin-department',
        component: () => import('../views/admin/DepartmentManagement.vue'),
        meta: {
          title: '部门管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'team-term',
        name: 'admin-team-term',
        component: () => import('../views/admin/TeamTermManagement.vue'),
        meta: {
          title: '届次管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'backbone-member',
        name: 'admin-backbone-member',
        component: () => import('../views/admin/BackboneMemberManagement.vue'),
        meta: {
          title: '骨干成员管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'activity',
        name: 'admin-activity',
        component: () => import('../views/admin/ActivityManagement.vue'),
        meta: {
          title: '活动管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'activity-participant',
        name: 'admin-activity-participant',
        component: () => import('../views/admin/ActivityParticipantManagement.vue'),
        meta: {
          title: '活动参与管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'activity-signup',
        name: 'admin-activity-signup',
        component: () => import('../views/user/UserActivitiesView.vue'),
        meta: {
          title: '活动报名',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'honor',
        name: 'admin-honor',
        component: () => import('../views/admin/HonorManagement.vue'),
        meta: {
          title: '荣誉管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'announcement',
        name: 'admin-announcement',
        component: () => import('../views/admin/AnnouncementManagement.vue'),
        meta: {
          title: '公告管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'current-announcements',
        name: 'admin-current-announcements',
        component: () => import('../views/user/UserAnnouncementsView.vue'),
        meta: {
          title: '当前公告',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'gallery',
        name: 'admin-gallery',
        component: () => import('../views/admin/GalleryManagement.vue'),
        meta: {
          title: '相册管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'milestone',
        name: 'admin-milestone',
        component: () => import('../views/admin/MilestoneManagement.vue'),
        meta: {
          title: '发展历程管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'certificate-templates',
        name: 'admin-certificate-templates',
        component: () => import('../views/admin/CertificateTemplateManagement.vue'),
        meta: {
          title: '证书模板管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'certificates',
        name: 'admin-certificates',
        component: () => import('../views/admin/ServiceCertificateManagement.vue'),
        meta: {
          title: '证书管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'my-certificates',
        name: 'admin-my-certificates',
        component: () => import('../views/user/UserCertificatesView.vue'),
        meta: {
          title: '我的志愿证书',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'operation-log',
        name: 'admin-operation-log',
        component: () => import('../views/admin/OperationLogManagement.vue'),
        meta: {
          title: '操作日志',
          requiresAuth: true,
          roles: ['superadmin'],
        },
      },
      {
        path: 'email-code',
        name: 'admin-email-code',
        component: () => import('../views/admin/EmailCodeManagement.vue'),
        meta: {
          title: '邮箱验证码管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'recruitment',
        name: 'admin-recruitment',
        component: () => import('../views/admin/RecruitmentManagement.vue'),
        meta: {
          title: '报名管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'recruitment-season',
        name: 'admin-recruitment-season',
        component: () => import('../views/admin/RecruitmentSeasonManagement.vue'),
        meta: {
          title: '报名通道管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'task-config',
        name: 'admin-task-config',
        component: () => import('../views/admin/TaskConfigManagement.vue'),
        meta: {
          title: '定时任务配置',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'task-logs',
        name: 'admin-task-logs',
        component: () => import('../views/admin/TaskLogsManagement.vue'),
        meta: {
          title: '定时任务执行日志',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'portrait-dimensions',
        name: 'admin-portrait-dimensions',
        component: () => import('../views/admin/PortraitDimensionManagement.vue'),
        meta: {
          title: '画像维度管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
      {
        path: 'recommendations',
        name: 'admin-recommendations',
        component: () => import('../views/admin/RecommendationManagement.vue'),
        meta: {
          title: '推荐管理',
          requiresAuth: true,
          roles: ['admin', 'superadmin'],
        },
      },
    ],
  },
  {
    path: '/user',
    component: () => import('../layouts/UserLayout.vue'),
    redirect: '/user/dashboard',
    meta: {
      requiresAuth: true,
      roles: ['user', 'admin', 'superadmin'],
    },
    children: [
      {
        path: 'dashboard',
        name: 'user-dashboard',
        component: () => import('../views/user/UserDashboardView.vue'),
        meta: {
          title: '数据驾驶舱',
          requiresAuth: true,
          roles: ['user', 'admin', 'superadmin'],
        },
      },
      {
        path: 'activities',
        name: 'user-activities',
        component: () => import('../views/user/UserActivitiesView.vue'),
        meta: {
          title: '活动报名',
          requiresAuth: true,
          roles: ['user', 'admin', 'superadmin'],
        },
      },
      {
        path: 'announcements',
        name: 'user-announcements',
        component: () => import('../views/user/UserAnnouncementsView.vue'),
        meta: {
          title: '公告通知',
          requiresAuth: true,
          roles: ['user', 'admin', 'superadmin'],
        },
      },
      {
        path: 'gallery',
        name: 'user-gallery',
        component: () => import('../views/user/UserGalleryView.vue'),
        meta: {
          title: '团队相册',
          requiresAuth: true,
          roles: ['user', 'admin', 'superadmin'],
        },
      },
      {
        path: 'certificates',
        name: 'user-certificates',
        component: () => import('../views/user/UserCertificatesView.vue'),
        meta: {
          title: '我的证书',
          requiresAuth: true,
          roles: ['user', 'admin', 'superadmin'],
        },
      },
      {
        path: 'profile',
        name: 'user-profile',
        component: () => import('../views/user/UserProfileView.vue'),
        meta: {
          title: '个人中心',
          requiresAuth: true,
          roles: ['user', 'admin', 'superadmin'],
        },
      },
      {
        path: 'portrait',
        name: 'user-portrait',
        component: () => import('../views/user/UserPortraitView.vue'),
        meta: {
          title: '人物画像',
          requiresAuth: true,
          roles: ['user', 'admin', 'superadmin'],
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

const ADMIN_ROLES = ['admin', 'superadmin']

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 常青藤志愿服务平台`
  } else {
    document.title = '常青藤志愿服务平台'
  }

  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth) {
    if (!token) {
      message.warning('请先登录账户')
      next('/')
      return
    }

    const matchedRoles = to.matched
      .map((record) => record.meta.roles as string[] | undefined)
      .filter((roles): roles is string[] => Array.isArray(roles) && roles.length > 0)
      .flat()

    if (matchedRoles.length > 0 && (!role || !matchedRoles.includes(role))) {
      message.error('当前账号无权访问该模块')
      if (role && ADMIN_ROLES.includes(role)) {
        next('/admin/dashboard')
      } else {
        next('/user/dashboard')
      }
      return
    }
  }

  // 如果已登录账号，访问首页则跳转到对应入口
  if (to.path === '/') {
    if (token && role) {
      if (ADMIN_ROLES.includes(role)) {
        next('/admin/dashboard')
        return
      }
      next('/user/dashboard')
      return
    }
  }

  next()
})

export default router
