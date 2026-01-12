<template>
  <div class="backbone-tree-container" :class="{ 'is-simple': props.simple }">
    <div class="tree-toolbar" v-if="!props.simple">
      <div class="toolbar-left">
        <span class="label">届次：</span>
        <el-select v-model="currentTermId" style="width: 200px" @change="handleTermChange">
          <el-option
            v-for="term in terms"
            :key="term.term_id"
            :label="term.term_name + (term.is_current ? ' (当前)' : '')"
            :value="term.term_id"
          />
        </el-select>

        <el-input
          v-model="searchKeyword"
          placeholder="搜索姓名/学号/部门"
          clearable
          style="width: 240px; margin-left: 16px"
          @input="handleSearchInput"
          @clear="handleSearchClear"
        >
          <template #prefix
            ><el-icon> <Search /> </el-icon
          ></template>
        </el-input>
      </div>

      <div class="toolbar-right">
        <!-- <el-tag type="info" effect="plain" size="small">
          <el-icon>
            <InfoFilled />
          </el-icon>
          <span style="margin-left: 4px">滚轮缩放 · 拖拽移动 · 点击查看详情</span>
        </el-tag> -->
        <span class="tag tag--info">
          <InfoFilled style="margin-right: 4px; width: 16px; height: 16px" />
          滚轮缩放 · 拖拽移动 · 点击查看详情
        </span>
        <el-button size="small" type="primary" plain :loading="exporting" @click="exportTree">
          导出高清图
        </el-button>
      </div>
    </div>
    <div class="simple-export-bar" v-else>
      <el-button size="small" type="primary" plain :loading="exporting" @click="exportTree">
        导出高清图
      </el-button>
    </div>

    <div class="org-chart-wrapper" ref="treeWrapperRef" v-loading="loading">
      <vue3-tree-org
        v-if="currentTreeData"
        :data="currentTreeData"
        :horizontal="false"
        :collapsable="!props.simple"
        :scalable="true"
        :scale="treeScale"
        :default-expand-level="4"
        :node-draggable="false"
        :node-width="nodeWidth"
        :node-height="nodeHeight"
        :level-gap="levelGap"
        :horizontal-gap="horizontalGap"
        :center="true"
      >
        <template #default="{ node }">
          <!-- 届次节点 -->
          <div
            v-if="getNodeData(node).type === 'term'"
            class="term-node"
            @click.stop="handleNodeClick(node)"
          >
            <div class="term-title">{{ node.label }}</div>
            <div class="term-count">共 {{ getNodeData(node).totalCount }} 人</div>
          </div>

          <!-- 部门节点 -->
          <div
            v-else-if="getNodeData(node).type === 'department'"
            class="dept-node"
            :class="getDeptClass(getNodeData(node).label)"
            @click.stop="handleNodeClick(node)"
          >
            <el-icon class="dept-icon">
              <component :is="getNodeData(node).label === '队长团' ? UserFilled : OfficeBuilding" />
            </el-icon>
            <div class="dept-info">
              <div class="dept-name">{{ node.label }}</div>
              <div class="dept-badge">{{ getNodeData(node).memberCount || 0 }} 人</div>
            </div>
          </div>

          <!-- 部长/副部长/队长（普通成员节点） -->
          <div
            v-else-if="!getNodeData(node).isMembersGroup"
            class="member-node"
            :class="getPositionClass(getNodeData(node).position)"
            @click.stop="handleNodeClick(node)"
          >
            <div class="avatar" :style="getAvatarStyle(getNodeData(node))">
              <span class="letter" :class="getGenderClass(getNodeData(node))">
                {{ getMemberInitial(getNodeData(node)) }}
              </span>
            </div>
            <div class="member-info">
              <div class="name">{{ node.label || getNodeData(node).student_name }}</div>
              <!-- <el-tag
                v-if="getNodeData(node).position"
                :type="getPositionTagType(getNodeData(node).position)"
                size="small"
                effect="light"
                round
              >
                {{ getNodeData(node).position }}
              </el-tag> -->
              <span
                v-if="getNodeData(node).position"
                class="tag"
                :class="`tag--${getPositionTagType(getNodeData(node).position)}`"
              >
                {{ getNodeData(node).position }}
              </span>
            </div>
          </div>

          <!-- 部员组（网格布局，一行5个） -->
          <div v-else class="members-group-node">
            <div class="members-group-title">
              普通部员（{{ getNodeData(node).membersGroupData?.length || 0 }}人）
            </div>
            <div class="members-grid">
              <div
                v-for="member in getNodeData(node).membersGroupData"
                :key="member.id"
                class="member-grid-item"
                @click.stop="handleNodeClick(member)"
              >
                <div class="member-node member-grid-card">
                  <div class="avatar" :style="getAvatarStyle(getNodeData(member))">
                    <span class="letter" :class="getGenderClass(getNodeData(member))">
                      {{ getMemberInitial(getNodeData(member)) }}
                    </span>
                  </div>
                  <div class="member-info">
                    <div class="name">{{ member.label }}</div>
                    <!-- <el-tag
                      v-if="getNodeData(member).position"
                      :type="getPositionTagType(getNodeData(member).position)"
                      size="small"
                      effect="light"
                      round
                    >
                      {{ getNodeData(member).position }}
                    </el-tag> -->
                    <span
                      v-if="getNodeData(member).position"
                      class="tag"
                      :class="`tag--${getPositionTagType(getNodeData(member).position)}`"
                    >
                      {{ getNodeData(member).position }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #expand="{ node }">
          <div class="count-badge" v-if="node.children?.length > 0">
            {{ getExpandCount(node as OrgSlotNode) }}
          </div>
        </template>
      </vue3-tree-org>

      <el-empty v-else description="暂无数据" />
    </div>

    <!-- ===== 点击节点右侧抽屉（term / department / member 通用详情） ===== -->
    <el-drawer
      v-if="!props.simple"
      v-model="drawerVisible"
      :title="drawerTitle"
      direction="rtl"
      size="420px"
    >
      <!-- ==================== 成员详情页面 ==================== -->
      <div
        v-if="currentNodeType === 'member' && currentNodeData"
        class="detail-content member-detail"
        v-loading="loadingMemberDetail"
      >
        <!-- 头像 / 首字母 -->
        <div class="detail-avatar">
          <el-avatar :size="110" :src="getMemberAvatarUrl(currentNodeData)">
            <div class="big-letter" :class="currentNodeData.gender === '女' ? 'female' : 'male'">
              {{ getMemberInitial(currentNodeData) }}
            </div>
          </el-avatar>
        </div>

        <h3>
          {{ currentNodeData.student_name || currentNodeData.student_id || '未知' }}
        </h3>

        <!-- 性别 + 职位 -->
        <div class="tags-row">
          <!-- <el-tag :type="getPositionTagType(currentNodeData.position)" effect="dark" round>{{
            currentNodeData.position || '成员'
          }}</el-tag>
          <el-tag
            :type="currentNodeData.gender === '女' ? 'danger' : 'primary'"
            effect="plain"
            round
            >{{ currentNodeData.gender || '未知' }}</el-tag
          > -->
          <span class="tag" :class="`tag--${getPositionTagType(currentNodeData.position)}`">
            {{ currentNodeData.position || '成员' }}
          </span>

          <span
            class="tag"
            :class="currentNodeData.gender === '女' ? 'tag--danger' : 'tag--primary'"
          >
            {{ currentNodeData.gender || '未知' }}
          </span>
        </div>

        <!-- 展示成员详细信息 -->
        <el-descriptions :column="1" border class="desc-list">
          <el-descriptions-item label="学号">{{
            currentNodeData.student_id || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{
            currentNodeData.college || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{
            currentNodeData.major || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{
            currentNodeData.phone || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{
            currentNodeData.email || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="任职时间">
            {{ dateUtil.formatDate(currentNodeData.term_start) }} 至
            {{ dateUtil.formatDate(currentNodeData.term_end) }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 底部操作按钮 -->
        <div class="detail-actions">
          <el-button
            v-if="currentNodeData.member_id"
            type="primary"
            @click="emit('view-member', currentNodeData.member_id)"
            >查看完整档案</el-button
          >
          <el-button
            v-if="currentNodeData.member_id"
            type="danger"
            plain
            @click="emit('delete-member', currentNodeData.member_id)"
            >删除成员</el-button
          >
        </div>
      </div>

      <!-- ==================== 部门详情 ==================== -->
      <div
        v-else-if="currentNodeType === 'department' && currentNodeData"
        class="detail-content dept-detail"
      >
        <div class="icon-placeholder bg-success">
          <OfficeBuilding />
        </div>
        <h3>{{ currentNodeData.label }}</h3>
        <p class="subtitle">部门信息</p>
        <el-descriptions :column="1" border class="desc-list">
          <el-descriptions-item label="部门名称">{{ currentNodeData.label }}</el-descriptions-item>
          <el-descriptions-item label="成员人数"
            >{{ currentNodeData.children?.length || 0 }} 人</el-descriptions-item
          >
        </el-descriptions>
      </div>

      <!-- ==================== 届次详情 ==================== -->
      <div
        v-else-if="currentNodeType === 'term' && currentNodeData"
        class="detail-content term-detail"
      >
        <div class="icon-placeholder bg-primary">届</div>
        <h3>{{ currentNodeData.label }}</h3>
        <p class="subtitle">届次信息</p>

        <el-descriptions :column="1" border class="desc-list">
          <el-descriptions-item label="届次名称">{{ currentNodeData.label }}</el-descriptions-item>
          <el-descriptions-item label="部门数量"
            >{{ currentNodeData.children?.length || 0 }} 个</el-descriptions-item
          >
          <el-descriptions-item label="总人数"
            >{{ currentNodeData.totalCount || 0 }} 人</el-descriptions-item
          >
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { Vue3TreeOrg } from 'vue3-tree-org'
import 'vue3-tree-org/lib/vue3-tree-org.css'
import { Search, InfoFilled, OfficeBuilding, UserFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { useDate } from '@/utils/date'
import type {
  BackboneMemberTreeTerm,
  BackboneMemberTreeManager,
  BackboneMemberTreeDepartment,
  BackboneMemberTreeMember,
  UserInfo,
} from '@/utils/api/types'
import { userInfoApi } from '@/utils/api'
import { getSignedOssUrl } from '@/utils/oss'

const dateUtil = useDate

interface TreeNode {
  id: string
  label: string
  type: 'term' | 'department' | 'member'
  children?: TreeNode[]
  membersGroupData?: TreeNode[]
  isMembersGroup?: boolean
  totalCount?: number
  memberCount?: number
  member_id?: number
  student_name?: string
  student_id?: string
  position?: string
  photo_key?: string
  gender?: string
  college?: string
  major?: string
  phone?: string
  email?: string
  term_start?: string
  term_end?: string
  is_manager?: boolean
}

interface MemberDetailData extends TreeNode {
  userInfo?: UserInfo
}

const props = withDefaults(
  defineProps<{
    terms: BackboneMemberTreeTerm[]
    loading: boolean
    active: boolean
    /** 简洁模式：只展示架构图，不展示工具栏和右侧抽屉 */
    simple?: boolean
    /** 过滤层级：'all' | 'captain' | 'minister' | 部门名称 */
    filterLevel?: string
  }>(),
  {
    simple: false,
    filterLevel: 'all',
  }
)

// 不同模式下的初始缩放比例：仪表盘里更小一点方便整体浏览
const treeScale = computed(() => (props.simple ? 0.55 : 0.85))

// 简洁模式：节点和间距更紧凑，能一次看到更多内容
const nodeWidth = computed(() => (props.simple ? 220 : 280))
const nodeHeight = computed(() => (props.simple ? 160 : 200))
const levelGap = computed(() => (props.simple ? 420 : 700))
const horizontalGap = computed(() => (props.simple ? 80 : 120))

const emit = defineEmits<{
  (e: 'view-member', id: number): void
  (e: 'delete-member', id: number): void
}>()

const currentTermId = ref<number | null>(null)
const searchKeyword = ref('')
const drawerVisible = ref(false)
const currentNodeType = ref<'term' | 'department' | 'member' | null>(null)
const currentNodeData = ref<MemberDetailData | null>(null)
const loadingMemberDetail = ref(false)
const treeWrapperRef = ref<HTMLDivElement | null>(null)
const exporting = ref(false)

const drawerTitle = computed(() => {
  if (!currentNodeType.value) return '详情'
  return { term: '届次信息', department: '部门信息', member: '成员详情' }[currentNodeType.value]
})

const currentTermName = computed(() => {
  const term = props.terms.find((t) => t.term_id === currentTermId.value)
  return term?.term_name?.trim() || '树形结构'
})

const exportFileName = computed(() => `骨干组织架构-${currentTermName.value}`)

// 成员头像URL缓存（响应式）
const memberAvatarUrlMap = reactive<Map<string, string>>(new Map())

// 从photo_key生成头像URL
const getMemberAvatarUrl = (node: TreeNode): string => {
  if (!node.photo_key) return ''
  const cached = memberAvatarUrlMap.get(node.photo_key)
  if (cached) return cached
  // 异步生成URL并更新响应式Map
  getSignedOssUrl(node.photo_key, {
    expiresInSeconds: 60 * 60,
    disposition: 'inline',
  })
    .then((url) => {
      memberAvatarUrlMap.set(node.photo_key!, url)
    })
    .catch((error) => {
      console.error('生成成员头像URL失败:', error)
    })
  return ''
}

// vue3-tree-org 插槽节点类型（内部通过 $$data 存放我们传入的数据）
type OrgSlotNode = TreeNode & { $$data?: TreeNode }

// === 核心辅助函数：获取节点真实数据 ===
const getNodeData = (node: OrgSlotNode): TreeNode => {
  return node.$$data || node
}

// 展开角标展示人数：
// - 如果唯一子节点是部员组，则展示部员组人数
// - 否则优先展示当前节点 children 数量，其次 membersGroupData 数量
const getExpandCount = (node: OrgSlotNode): number => {
  const data = getNodeData(node)
  const children = (node.children || []) as OrgSlotNode[]

  if (children.length === 1) {
    const firstChild = children[0]
    if (firstChild) {
      const childData = getNodeData(firstChild)
      if (childData.isMembersGroup && childData.membersGroupData) {
        return childData.membersGroupData.length
      }
    }
  }

  if (children.length > 0) return children.length
  if (data.membersGroupData?.length) return data.membersGroupData.length
  if (data.children?.length) return data.children.length
  return 0
}

watch(
  () => props.terms,
  (terms) => {
    if (terms?.length && !currentTermId.value) {
      const currentTerm = terms.find((t) => t.is_current)
      const firstTerm = terms[0]
      currentTermId.value = currentTerm?.term_id || firstTerm?.term_id || null
    }
  },
  { immediate: true }
)

const handleTermChange = () => {
  drawerVisible.value = false
  currentNodeData.value = null
  currentNodeType.value = null
}

const handleSearchInput = () => {
  if (drawerVisible.value) {
    drawerVisible.value = false
    currentNodeData.value = null
    currentNodeType.value = null
  }
}

const handleSearchClear = () => {
  if (drawerVisible.value) {
    drawerVisible.value = false
    currentNodeData.value = null
    currentNodeType.value = null
  }
}

const exportTree = async () => {
  if (exporting.value) return
  exporting.value = true

  await nextTick()
  const wrapper = treeWrapperRef.value!
  const target = wrapper.querySelector('.tree-org') as HTMLElement

  if (!target) {
    ElMessage.error('未找到组织图，请刷新页面后重试')
    exporting.value = false
    return
  }

  // 强制铺平
  const bak = target.style.transform
  target.style.transform = 'scale(1)'
  wrapper.style.overflow = 'visible'

  try {
    const canvas = await html2canvas(target, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff00',
    })
    const a = document.createElement('a')
    a.download = `${exportFileName.value}.png`
    a.href = canvas.toDataURL()
    a.click()
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
    console.error(e)
  } finally {
    target.style.transform = bak
    wrapper.style.overflow = ''
    exporting.value = false
  }
}

// 构造树形数据：届次 → 队长团 → 队长 → 部门 → 部长/副部长 → 部员
const currentTreeData = computed<TreeNode | null>(() => {
  if (!currentTermId.value) return null
  const term = props.terms.find((t) => t.term_id === currentTermId.value)
  if (!term) return null

  const managers: BackboneMemberTreeManager[] = Array.isArray(term.managers) ? term.managers : []
  const keyword = (searchKeyword.value || '').trim()
  const lowerKeyword = keyword.toLowerCase()
  let totalMembers = 0

  const captainNodes: TreeNode[] = managers
    .map((manager) => {
      const departments: BackboneMemberTreeDepartment[] = Array.isArray(manager.departments)
        ? manager.departments
        : []
      const deptNodes: TreeNode[] = []

      departments.forEach((dept) => {
        const rawDeptName = dept.dept_name || ''
        if (rawDeptName.includes('队长团')) return

        let members: BackboneMemberTreeMember[] = Array.isArray(dept.members) ? dept.members : []
        members = members.filter((m) => !m.is_manager)

        if (keyword) {
          members = members.filter((m) => {
            const name = (m.student_name || '').toLowerCase()
            const id = (m.student_id || '').toLowerCase()
            const deptName = rawDeptName.toLowerCase()
            return (
              name.includes(lowerKeyword) ||
              id.includes(lowerKeyword) ||
              deptName.includes(lowerKeyword)
            )
          })
        }

        totalMembers += members.length

        const memberNodes: TreeNode[] = members.map((m) => ({
          id: `mem-${m.member_id}`,
          label: m.student_name?.trim() || m.student_id?.trim() || '未知',
          type: 'member' as const,
          member_id: m.member_id,
          student_id: m.student_id,
          student_name: m.student_name,
          position: m.position,
          photo_key: m.photo_key || undefined,
        }))

        // 分离：只保留部长和副部长
        const ministers = memberNodes.filter((m) => m.position === '部长')
        const viceMinisters = memberNodes.filter((m) => m.position === '副部长')
        const ordinaryMembers = memberNodes.filter(
          (m) => !['部长', '副部长'].includes(m.position || '')
        )

        // 创建部员组节点
        const membersGroupNode: TreeNode | null =
          ordinaryMembers.length > 0
            ? {
                id: `members-group-${dept.dept_id}`,
                label: '普通部员',
                type: 'member' as const,
                isMembersGroup: true,
                membersGroupData: ordinaryMembers,
                // children: ordinaryMembers,
              }
            : null

        // 构建领导层：左副 - 部长 - 右副（普通部员已完全移除）
        let leaderLayer: TreeNode[] = []

        if (ministers.length > 0) {
          // 有部长：副部长左右对称排布
          const mid = Math.floor(viceMinisters.length / 2)
          const leftVice = viceMinisters.slice(0, mid)
          const rightVice = viceMinisters.slice(mid)
          leaderLayer = [...leftVice, ...ministers, ...rightVice]

          // 部员组挂在部长下面（部长在中间）
          if (membersGroupNode) {
            const ministerIndex = leftVice.length // 部长正好在中间
            const ministerNode = leaderLayer[ministerIndex]
            if (ministerNode) {
              ministerNode.children = [membersGroupNode]
            }
          }
        } else if (viceMinisters.length > 0) {
          // 没有部长，只有副部长 → 部员组挂在正中间的副部长下面
          leaderLayer = [...viceMinisters]
          if (membersGroupNode) {
            const middleIndex = Math.floor(leaderLayer.length / 2)
            const middleLeader = leaderLayer[middleIndex]
            if (middleLeader) {
              middleLeader.children = [membersGroupNode]
            }
          }
        } else if (membersGroupNode) {
          // 两者都没有 → 创建虚拟部长挂部员组
          leaderLayer = [
            {
              id: `virtual-minister-${dept.dept_id}`,
              label: dept.leader_name || `${rawDeptName}部长`,
              type: 'member' as const,
              position: '部长',
              children: [membersGroupNode],
            },
          ]
        }

        const deptNode: TreeNode = {
          id: `dept-${dept.dept_id}`,
          label: rawDeptName,
          type: 'department',
          memberCount: members.length,
          children: leaderLayer.length > 0 ? leaderLayer : undefined,
        }
        deptNodes.push(deptNode)
      })

      return {
        id: `captain-${manager.manager_student_id || manager.manager_name}`,
        label: manager.manager_name || '未知队长',
        type: 'member',
        position: '队长',
        children: deptNodes.length > 0 ? deptNodes : undefined,
      }
    })
    .filter(Boolean) as TreeNode[]

  if (captainNodes.length === 0) return null

  // 根据 filterLevel 过滤树形数据
  let filteredCaptainNodes = captainNodes
  const filterLevel = props.filterLevel || 'all'

  if (filterLevel === 'captain') {
    // 只显示到队长：移除队长的 children（部门）
    filteredCaptainNodes = captainNodes.map((captain) => ({
      ...captain,
      children: undefined,
    }))
  } else if (filterLevel === 'minister') {
    // 显示到部长：移除部长/副部长的 children（普通部员）
    filteredCaptainNodes = captainNodes.map((captain) => {
      if (!captain.children) return captain
      const filteredDepts = captain.children.map((dept) => {
        if (!dept.children) return dept
        // 移除部长/副部长的 children（普通部员组）
        const filteredLeaders = dept.children.map((leader) => ({
          ...leader,
          children: undefined,
        }))
        return {
          ...dept,
          children: filteredLeaders,
        }
      })
      return {
        ...captain,
        children: filteredDepts,
      }
    })
  } else if (filterLevel !== 'all') {
    // 特定部门：只保留该部门
    const filtered: TreeNode[] = []
    captainNodes.forEach((captain) => {
      if (!captain.children) return
      const filteredDepts = captain.children.filter((dept) => dept.label === filterLevel)
      if (filteredDepts.length === 0) return
      filtered.push({
        ...captain,
        children: filteredDepts,
      })
    })
    filteredCaptainNodes = filtered
  }

  return {
    id: `term-${term.term_id}`,
    label: term.term_name,
    type: 'term',
    totalCount: totalMembers,
    children: [
      {
        id: 'captain-group',
        label: '队长团',
        type: 'department',
        memberCount: filteredCaptainNodes.length,
        children: filteredCaptainNodes,
      },
    ],
  }
})

const handleNodeClick = async (nodeWrapper: OrgSlotNode) => {
  if (props.simple) return
  const realNode = getNodeData(nodeWrapper)
  if (!realNode) return

  currentNodeType.value = realNode.type
  currentNodeData.value = {
    ...realNode,
    children: nodeWrapper.children || realNode.children,
  } as MemberDetailData

  drawerVisible.value = true

  if (realNode.type === 'member' && realNode.student_id) {
    loadingMemberDetail.value = true
    try {
      const res = await userInfoApi.getUserInfo(realNode.student_id)
      if (res.data && currentNodeData.value) {
        currentNodeData.value.userInfo = res.data
        Object.assign(currentNodeData.value, {
          gender: res.data.gender || realNode.gender,
          college: res.data.college || realNode.college,
          major: res.data.major || realNode.major,
          phone: res.data.phone || realNode.phone,
          email: res.data.email || realNode.email,
          photo_key: res.data.avatar_key || realNode.photo_key,
        })
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      loadingMemberDetail.value = false
    }
  }
}

const getDeptClass = (pos?: string) =>
  (
    ({
      队长团: 'dept-captain',
    }) as Record<string, string>
  )[pos || ''] || 'dept-normal'

const getPositionClass = (pos?: string) =>
  ({
    队长: 'is-captain',
    部长: 'is-minister',
    副部长: 'is-vice',
  })[pos || ''] || ''

const getPositionTagType = (pos?: string): 'danger' | 'warning' | 'success' | 'info' => {
  const typeMap: Record<string, 'danger' | 'warning' | 'success' | 'info'> = {
    队长: 'danger',
    部长: 'warning',
    副部长: 'success',
  }
  return typeMap[pos || ''] || 'info'
}

const getGenderClass = (node: TreeNode) => {
  if (node.photo_key) return ''
  return node.gender === '女' ? 'female-letter' : 'male-letter'
}

const getAvatarStyle = (node: TreeNode) => {
  const url = getMemberAvatarUrl(node)
  return url ? { backgroundImage: `url(${url.trim()})` } : {}
}

const getMemberInitial = (node: TreeNode): string => {
  if (!node) return '?'
  const name = (node.student_name || node.label || node.student_id || '').trim()
  if (!name) return '?'
  const firstChar = name.charAt(0)
  return firstChar ? firstChar.toUpperCase() : '?'
}
</script>

<style scoped>
.backbone-tree-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.backbone-tree-container.is-simple {
  padding: 0;
}

.tree-toolbar {
  padding: 15px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  z-index: 10;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.simple-export-bar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

.org-chart-wrapper {
  flex: 1;
  overflow: auto;
  padding: 15px;
  background: linear-gradient(135deg, #f2f8ff 0%, #e6f7ff 100%);
}

.backbone-tree-container.is-simple .org-chart-wrapper {
  padding: 0;
  background: transparent;
}

/* :deep(.tree-org-node__content .tree-org-node__inner) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
} */

/* 只清除默认背景 */
:deep(.tree-org-node__inner) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

/* 把节点内容强制提升，让它覆盖默认样式 */
:deep(.tree-org-node__content) {
  background: transparent !important;
}

/* 届次节点 */
.term-node {
  padding: 22px 44px;
  border-radius: 24px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  text-align: center;
  box-shadow: 0 5px 20px rgba(220, 38, 38, 0.4);
  min-width: 300px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.backbone-tree-container.is-simple .term-node {
  padding: 20px 40px;
  border-radius: 22px;
  box-shadow: 0 6px 22px rgba(220, 38, 38, 0.45);
  min-width: 320px;
}

.term-node:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 10px 40px rgba(220, 38, 38, 0.5);
}

.term-title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.term-count {
  font-size: 16px;
  opacity: 0.95;
}

.backbone-tree-container.is-simple .term-title {
  font-size: 24px;
  margin-bottom: 8px;
}

.backbone-tree-container.is-simple .term-count {
  font-size: 15px;
}

.click-hint {
  font-size: 12px;
  margin-top: 10px;
  opacity: 0.5;
}

/* 队长团节点 */
.dept-captain {
  background: linear-gradient(135deg, #1989fa 0%, #0f5294 100%);
  box-shadow: 0 5px 20px rgba(22, 119, 255, 0.4);
}

.dept-captain:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 40px rgba(22, 119, 255, 0.5);
}

/* 普通部门节点 */
.dept-normal {
  background: linear-gradient(135deg, #c5deff 0%, #1989fa 100%);
  box-shadow: 0 5px 10px rgba(133, 133, 133, 0.4);
}

.dept-normal:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 40px rgba(133, 133, 133, 0.5);
}

/* 部门节点通用 */
.dept-node {
  padding: 15px 30px;
  border-radius: 50px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 200px;
  min-height: 90px;
  cursor: pointer;
  transition: all 0.3s;
}

.backbone-tree-container.is-simple .dept-node {
  padding: 8px 18px;
  border-radius: 30px;
  min-width: 140px;
  min-height: 60px;
}

.dept-icon {
  font-size: 30px;
}

.dept-name {
  font-size: 18px;
}

.dept-badge {
  font-size: 13px;
  opacity: 0.6;
}

.backbone-tree-container.is-simple .dept-icon {
  font-size: 18px;
}

.backbone-tree-container.is-simple .dept-name {
  font-size: 13px;
}

.backbone-tree-container.is-simple .dept-badge {
  font-size: 11px;
}

/* 成员节点 */
.member-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 146px;
  min-height: 176px;
  padding: 20px 12px;
  border-radius: 20px;
  background: white;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  border-top: 8px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.backbone-tree-container.is-simple .member-node {
  width: 118px;
  min-height: 140px;
  padding: 12px 8px;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.member-node:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.16);
  z-index: 10;
}

.member-node.is-captain {
  border-top-color: #ff1616;
}

.member-node.is-minister {
  border-top-color: #ff7716;
}

.member-node.is-vice {
  border-top-color: #1989fa;
}

.member-node .avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 5px solid white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
}

.backbone-tree-container.is-simple .member-node .avatar {
  width: 50px;
  height: 50px;
  border-width: 3px;
  margin-bottom: 6px;
}

.member-node .letter {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 26px;
  color: white;
  border-radius: 50%;
}

.backbone-tree-container.is-simple .member-node .letter {
  font-size: 18px;
}

.male-letter {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

.female-letter {
  background: linear-gradient(135deg, #ff4d7f, #e91e63);
}

.member-node .avatar[style*='url'] .letter {
  display: none;
}

.member-info {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.member-info .name {
  font-weight: 700;
  color: #000000;
  font-size: 16px;
  margin-bottom: 6px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backbone-tree-container.is-simple .member-info .name {
  font-size: 13px;
  max-width: 82px;
}

/* 数字角标 */
.count-badge {
  background: #1989fa;
  color: white;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  font-weight: bold;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(25, 137, 250, 0.35);
}

/* 连线美化 */
:deep(.tree-org-node::before),
:deep(.tree-org-node::after),
:deep(.tree-org-node__children:before),
:deep(.tree-org-node__children:after) {
  border-color: #1989fa !important;
  z-index: 0;
}

/* 抽屉样式 */
.detail-content {
  text-align: center;
  padding: 20px 0;
}

.detail-avatar {
  margin-bottom: 20px;
}

.big-letter {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  color: white;
  font-weight: bold;
}

.big-letter.male {
  background: linear-gradient(135deg, #1890ff, #096dd9);
}

.big-letter.female {
  background: linear-gradient(135deg, #ff4d7f, #e91e63);
}

.tags-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 16px 0;
}

.desc-list {
  margin: 24px 0;
}

.detail-actions {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.icon-placeholder {
  width: 90px;
  height: 90px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 44px;
  color: white;
}

.icon-placeholder.bg-primary {
  background: linear-gradient(135deg, #1989fa, #0d6efd);
}

.icon-placeholder.bg-success {
  background: linear-gradient(135deg, #13c2c2, #0ea5a5);
}

.subtitle {
  color: #6b7280;
  margin: 8px 0 0;
}

/* 部员组节点（关键！） */
.members-group-node {
  padding: 24px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid #e4e7ed;
  min-width: 860px;
  max-width: 1100px;
  margin: 0 auto;
}

.members-group-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
  padding: 0 20px;
}

.members-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 10px 0;
}

.member-grid-item {
  flex: 0 0 146px;
}

.member-grid-card {
  width: 146px !important;
  height: 176px;
  margin: 0 !important;
  padding: 20px 12px;
}

.tag {
  display: inline-block;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 12px;
  border: 1px solid #dcdfe6;
  background: #f4f4f5;
  color: #606266;
  line-height: 1;
  white-space: nowrap;
}

.tag--primary {
  background: #ecf5ff;
  border-color: #b3d8ff;
  color: #409eff;
}

.tag--success {
  background: #f0f9eb;
  border-color: #c2e7b0;
  color: #67c23a;
}

.tag--danger {
  background: #fde2e2;
  border-color: #fab6b6;
  color: #f56c6c;
}

.tag--warning {
  background: #fdf6ec;
  border-color: #f5dab1;
  color: #e6a23c;
}

.tag--info {
  background: #f4f4f5;
  border-color: #d3d4d6;
  color: #909399;
}

/* 响应式 */
@media (max-width: 1600px) {
  .members-group-node {
    min-width: 720px;
  }
  .member-grid-item {
    flex: 0 0 140px;
  }
}
@media (max-width: 1200px) {
  .members-group-node {
    min-width: 580px;
  }
  .member-grid-item {
    flex: 0 0 135px;
  }
}
</style>
