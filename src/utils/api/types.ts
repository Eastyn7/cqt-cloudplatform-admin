/**
 * API 接口类型定义
 * 统一管理所有 API 接口的请求参数和响应数据类型
 */

// ==================== 通用分页类型 ====================

/**
 * 分页查询参数
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  role?: string
  college?: string
  major?: string
}

/**
 * 分页响应数据（格式A：list + pagination）
 * 用于分页查询接口 (page 接口)
 */
export interface PaginationResponse<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

/**
 * 列表响应数据（格式B：list + total）
 * 用于全量列表查询接口 (list 接口)
 */
export interface ListResponse<T> {
  list: T[]
  total: number
}

// ==================== OSS 相关类型 ====================

/**
 * STS 临时凭证响应类型
 */
export interface OssSTSResponse {
  AccessKeyId: string
  AccessKeySecret: string
  SecurityToken: string
  Expiration: string
}

// ==================== 邮箱相关类型 ====================

/**
 * 发送邮箱验证码请求参数
 */
export interface SendEmailCodeParams {
  email: string // 目标邮箱，必须是学校邮箱格式（如 xxx@ctbu.edu.cn）
  type?: string // 验证码类型，默认 "register"，可在业务中扩展如 login/resetPassword 等
}

/**
 * 校验邮箱验证码请求参数
 */
export interface VerifyEmailCodeParams {
  email: string // 验证的邮箱
  code: string // 用户收到的 6 位验证码
  type?: string // 验证码类型，默认 "register"
}

/**
 * 清理验证码记录响应数据
 */
export interface CleanupEmailCodeResponse {
  deleted: number // 删除的记录数
}

/**
 * 邮箱验证码信息
 */
export interface EmailCodeInfo {
  id: number
  email: string
  code: string
  type: string
  verified: number // 0=未验证, 1=已验证
  expires_at: string
  created_at: string
}

/**
 * 获取验证码列表请求参数
 */
export interface GetEmailCodeListParams {
  page?: number
  pageSize?: number
  email?: string
  type?: string
  verified?: number | string
}

/**
 * 邮箱验证码列表响应数据
 */
export type EmailCodeListResponse = PaginationResponse<EmailCodeInfo>

// ==================== 注册/登录相关类型 ====================

/**
 * 注册请求参数
 */
export interface RegisterParams {
  student_id: string // 10 位数字学生账号
  email: string // 必须以 @ctbu.edu.cn 结尾
  password: string // 强密码，需通过校验
  name: string // 用户姓名
  code: string // 邮箱验证码
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  loginInput: string // 学号、ctbu 邮箱或普通邮箱均可
  password: string // 用户密码
}

/**
 * 登录响应数据
 */
export type UserRole = 'user' | 'admin' | 'superadmin'

export interface LoginResponse {
  token: string // JWT Token
  student_id: string
  email: string
  role: UserRole
}

/**
 * 批量注册用户项
 */
export interface BatchRegisterUser {
  student_id: string // 10 位数字
  email: string // ctbu 校园邮箱
  password: string // 强密码
  name: string // 用户姓名
}

/**
 * 批量注册详情项
 */
export interface BatchRegisterDetail {
  student_id: string
  email: string
  status: 'success' | 'failed'
  reason?: string // 失败原因
}

/**
 * 批量注册响应数据
 */
export interface BatchRegisterResponse {
  message: string
  total: number // 总数
  success: number // 成功数
  failed: number // 失败数
  details: BatchRegisterDetail[] // 详细信息
}

// ==================== 删除用户相关类型 ====================

/**
 * 删除单个用户响应数据
 */
export interface DeleteUserResponse {
  message: string
}

/**
 * 批量删除用户请求参数
 */
export interface BatchDeleteUserParams {
  studentIds: string[] // 学号数组
}

/**
 * 批量删除详情项
 */
export interface BatchDeleteDetail {
  student_id: string
  status: 'success' | 'failed'
  reason?: string // 失败原因
}

/**
 * 批量删除用户响应数据
 */
export interface BatchDeleteUserResponse {
  message: string
  total: number // 总数
  success: number // 成功数
  failed: number // 失败数
  details: BatchDeleteDetail[] // 详细信息
}

// ==================== 用户信息管理相关类型 ====================

/**
 * 更新用户信息请求参数
 */
export interface UpdateUserInfoParams {
  name?: string // 姓名
  gender?: '男' | '女' | '其他' // 性别
  college?: string // 学院名称
  major?: string // 专业
  phone?: string // 手机号
  avatar_key?: string // OSS 对象 key
  join_date?: string // 入队日期（YYYY-MM-DD）
  total_hours?: number // 总服务时长
  skill_tags?: string // 技能标签（逗号分隔）
}

/**
 * 用户信息响应数据
 */
export interface UserInfo {
  student_id: string
  name: string
  gender: '男' | '女' | '其他' | null
  college: string | null
  major: string | null
  phone: string | null
  /**
   * 头像 OSS 对象 key（可选，部分旧数据可能不存在）
   */
  avatar_key?: string | null
  join_date: string | null
  total_hours: string
  skill_tags: string | null
  info_created_at: string
  info_updated_at: string
  email: string
  role: 'user' | 'admin' | 'superadmin'
  account_created_at: string
  account_updated_at: string
  last_login_at?: string | null
}

/**
 * 用户信息分页响应数据
 */
export type UserInfoPageResponse = PaginationResponse<UserInfo>

/**
 * 用户信息列表响应数据
 */
export type UserInfoListResponse = ListResponse<UserInfo>

/**
 * 学院专业列表响应数据
 */
export type CollegesMajorsResponse = Record<string, string[]>

/**
 * 批量导入/更新用户信息请求参数
 */
export interface BatchImportUserInfoParams {
  student_id: string // 要更新的学号（必填）
  name: string // 姓名（必填）
  gender?: '男' | '女' | '其他'
  college?: string
  major?: string
  phone?: string
  avatar_key?: string
  join_date?: string
  total_hours?: number
  skill_tags?: string
}

/**
 * 批量导入/更新详情项
 */
export interface BatchImportDetail {
  student_id: string
  status: 'updated' | 'skipped' | 'failed'
  reason?: string // 失败或跳过的原因
}

/**
 * 批量导入/更新用户信息响应数据
 */
export interface BatchImportUserInfoResponse {
  message: string
  total: number // 总数
  updated: number // 更新数
  skipped: number // 跳过数
  failed: number // 失败数
  details: BatchImportDetail[] // 详细信息
}

// ==================== 修改密码相关类型 ====================

/**
 * 修改密码请求参数
 */
export interface ChangePasswordParams {
  email: string // 必须为学校邮箱
  oldPassword: string // 用户当前旧密码
  newPassword: string // 必须满足强密码校验
  code: string // 邮箱验证码（重置密码类型）
}

// ==================== 部门管理相关类型 ====================

/**
 * 创建部门请求参数
 */
export interface CreateDepartmentParams {
  dept_name: string // 部门名称（唯一）
  description?: string // 部门描述
  leader_id?: string // 负责人学号（自动校验格式）
  display_order?: number // 排序数字，越小越靠前
}

/**
 * 创建部门响应数据
 */
export interface CreateDepartmentResponse {
  dept_id: number
  dept_name: string
  description?: string
  leader_id?: string
  display_order?: number
}

/**
 * 部门信息
 */
export interface DepartmentInfo {
  dept_id: number
  dept_name: string
  description?: string | null
  leader_id?: string | null
  leader_name?: string | null
  display_order?: number
}

/**
 * 部门分页响应数据
 */
export type DepartmentPageResponse = PaginationResponse<DepartmentInfo>

/**
 * 部门列表响应数据
 */
export type DepartmentListResponse = ListResponse<DepartmentInfo>

/**
 * 更新部门信息请求参数
 */
export interface UpdateDepartmentParams {
  dept_name?: string // 新部门名称
  description?: string // 部门描述
  leader_id?: string // 负责人学号
  display_order?: number // 排序数字
}

/**
 * 批量创建部门请求参数
 */
export interface BatchCreateDepartmentParams {
  dept_name: string // 部门名称（必填）
  description?: string
  leader_id?: string
  display_order?: number
}

/**
 * 批量创建部门详情项
 */
export interface BatchCreateDepartmentDetail {
  dept_id?: number // 创建成功时返回
  dept_name: string
  reason?: string // 跳过原因
}

/**
 * 批量创建部门响应数据
 */
export interface BatchCreateDepartmentResponse {
  message: string
  total: number // 总数
  created: number // 创建数
  skipped: number // 跳过数
  details: {
    created: BatchCreateDepartmentDetail[]
    skipped: BatchCreateDepartmentDetail[]
  }
}

// ==================== 届次管理相关类型 ====================

/**
 * 创建届次请求参数
 */
export interface CreateTeamTermParams {
  term_name: string // 届次名称，必须唯一
  start_date?: string // 开始时间：YYYY-MM-DD
  end_date?: string // 结束时间：YYYY-MM-DD
  is_current?: number // 是否当前届（0/1）
  remark?: string // 备注
}

/**
 * 创建届次响应数据
 */
export interface CreateTeamTermResponse {
  term_id: number
  term_name: string
  start_date?: string
  end_date?: string
  is_current?: number
  remark?: string
}

/**
 * 届次信息
 */
export interface TeamTermInfo {
  term_id: number
  term_name: string
  start_date?: string | null
  end_date?: string | null
  is_current: number
  remark?: string | null
}

/**
 * 届次分页响应数据
 */
export type TeamTermPageResponse = PaginationResponse<TeamTermInfo>

/**
 * 届次列表响应数据
 */
export type TeamTermListResponse = ListResponse<TeamTermInfo>

/**
 * 更新届次信息请求参数
 */
export interface UpdateTeamTermParams {
  term_name?: string // 届次名称
  start_date?: string // 开始时间
  end_date?: string // 结束时间
  is_current?: number // 是否为当前届（0/1）
  remark?: string // 备注
}

/**
 * 批量创建届次请求参数
 */
export interface BatchCreateTeamTermParams {
  term_name: string // 届次名称（必填）
  start_date?: string
  end_date?: string
  is_current?: number
  remark?: string
}

/**
 * 批量创建届次详情项
 */
export interface BatchCreateTeamTermDetail {
  term_id?: number // 创建成功时返回
  term_name: string
  reason?: string // 跳过原因
}

/**
 * 批量创建届次响应数据
 */
export interface BatchCreateTeamTermResponse {
  message: string
  total: number // 总数
  created: number // 创建数
  skipped: number // 跳过数
  details: {
    created: BatchCreateTeamTermDetail[]
    skipped: BatchCreateTeamTermDetail[]
  }
}

// ==================== 骨干成员管理相关类型 ====================

/**
 * 创建骨干成员请求参数
 */
export interface CreateBackboneMemberParams {
  student_id: string // 学号（格式校验）
  dept_id: number // 部门 ID
  term_id: number // 届次 ID
  position?: '队长' | '部长' | '副部长' | '部员' // 职位，默认部员
  photo_key?: string // 照片 OSS 存储 key
  term_start?: string // 任期开始日期
  term_end?: string // 任期结束日期
  remark?: string // 备注
}

/**
 * 创建骨干成员响应数据
 */
export interface CreateBackboneMemberResponse {
  member_id: number
  student_id: string
  dept_id: number
  term_id: number
  position: string
  photo_key?: string
  term_start?: string
  term_end?: string
  remark?: string
}

/**
 * 骨干成员信息
 */
export interface BackboneMemberInfo {
  member_id: number
  student_id: string
  student_name?: string | null
  dept_id: number
  dept_name?: string
  term_id: number
  term_name?: string
  is_current?: boolean | 0 | 1
  position: string
  /**
   * 照片 OSS 存储 key（仅当已上传展示照片时存在）
   */
  photo_key?: string | null
  term_start?: string | null
  term_end?: string | null
  remark?: string | null
  created_at?: string | null
  updated_at?: string | null
}

/**
 * 骨干成员分页响应数据
 */
export type BackboneMemberPageResponse = PaginationResponse<BackboneMemberInfo>

/**
 * 骨干成员列表响应数据
 */
export type BackboneMemberListResponse = ListResponse<BackboneMemberInfo>

/**
 * 骨干成员树状结构 - 成员项（按届次→队长→部门→成员）
 */
export interface BackboneMemberTreeMember {
  member_id: number
  student_id: string
  student_name: string
  position: string
  /**
   * 照片 OSS 存储 key
   */
  photo_key?: string | null
  /**
   * 是否为该届次的队长（manager）
   */
  is_manager: boolean
  term_start?: string | null
  term_end?: string | null
}

/**
 * 骨干成员树状结构 - 部门项
 */
export interface BackboneMemberTreeDepartment {
  dept_id: number
  dept_name: string
  /**
   * 部门负责人姓名
   */
  leader_name?: string | null
  members: BackboneMemberTreeMember[]
}

/**
 * 骨干成员树状结构 - 队长（经理）节点
 */
export interface BackboneMemberTreeManager {
  manager_student_id: string
  manager_name: string
  departments: BackboneMemberTreeDepartment[]
}

/**
 * 骨干成员树状结构 - 届次项
 */
export interface BackboneMemberTreeTerm {
  term_id: number
  term_name: string
  is_current: boolean
  /**
   * 届次开始日期
   */
  start_date: string
  /**
   * 本届所有队长及其管理的部门
   */
  managers: BackboneMemberTreeManager[]
}

/**
 * 骨干成员树状结构响应数据
 */
export interface BackboneMemberTreeResponse {
  list: BackboneMemberTreeTerm[]
  total: number
}

/**
 * 更新骨干成员信息请求参数
 */
export interface UpdateBackboneMemberParams {
  student_id?: string // 学号（格式校验）
  dept_id?: number // 部门 ID
  term_id?: number // 届次 ID
  position?: '队长' | '部长' | '副部长' | '部员' // 职位
  photo_key?: string // 照片 OSS 存储 key（变更时自动删除旧文件）
  term_start?: string // 任期开始日期
  term_end?: string // 任期结束日期
  remark?: string // 备注
}

/**
 * 批量创建骨干成员请求参数
 */
export interface BatchCreateBackboneMemberParams {
  student_id: string // 学号（格式校验）
  dept_id: number // 部门 ID
  term_id: number // 届次 ID
  position?: '队长' | '部长' | '副部长' | '部员' // 职位，默认部员
  photo_key?: string // 照片 OSS 存储 key
  term_start?: string // 任期开始日期
  term_end?: string // 任期结束日期
  remark?: string // 备注
}

/**
 * 批量创建骨干成员详情项 - 成功项
 */
export interface BatchCreateBackboneMemberSuccess {
  member_id: number
  student_id: string
  dept_id: number
  term_id: number
  position?: string
  photo_key?: string
  term_start?: string
  term_end?: string
  remark?: string
}

/**
 * 批量创建骨干成员详情项 - 失败项
 */
export interface BatchCreateBackboneMemberFailed {
  student_id: string
  reason: string
}

/**
 * 批量创建骨干成员响应数据
 */
export interface BatchCreateBackboneMemberResponse {
  total: number // 总数
  created: number // 创建数
  failed: number // 失败数
  createdList: BatchCreateBackboneMemberSuccess[]
  failedList: BatchCreateBackboneMemberFailed[]
}

// ==================== 志愿活动记录管理相关类型 ====================

/**
 * 创建志愿活动请求参数
 */
export interface CreateActivityParams {
  activity_name: string // 活动名称
  dept_id?: number // 部门 ID
  term_id?: number // 届次 ID
  category?: string // 活动类别
  cover_key?: string // 封面图片 OSS 存储 key
  recruitment_limit?: number // 招募人数
  service_hours?: number // 服务时长
  location?: string // 活动地点
  start_time?: string // 开始时间
  end_time?: string // 结束时间
  description?: string // 活动描述
  status?: '草稿' | '进行中' | '已结束' // 状态，默认草稿
  created_by?: string // 创建人
}

/**
 * 创建志愿活动响应数据
 */
export interface CreateActivityResponse {
  activity_id: number
  activity_name: string
  service_hours?: number
  status: string
}

/**
 * 志愿活动信息
 */
export interface ActivityInfo {
  activity_id: number
  activity_name: string
  dept_id?: number | null
  dept_name?: string | null
  term_id?: number | null
  term_name?: string | null
  category?: string | null
  cover_key?: string | null
  recruitment_limit?: number | null
  service_hours?: number | null
  location?: string | null
  start_time?: string | null
  end_time?: string | null
  description?: string | null
  status: string
  created_by?: string | null
  created_at?: string
}

/**
 * 志愿活动分页响应数据
 */
export type ActivityPageResponse = PaginationResponse<ActivityInfo>

/**
 * 志愿活动列表响应数据
 */
export type ActivityListResponse = ListResponse<ActivityInfo>

/**
 * 更新志愿活动信息请求参数
 */
export interface UpdateActivityParams {
  activity_name?: string // 活动名称
  dept_id?: number // 部门 ID
  term_id?: number // 届次 ID
  category?: string // 活动类别
  cover_key?: string // 封面图片 OSS 存储 key
  recruitment_limit?: number // 招募人数
  service_hours?: number // 服务时长
  location?: string // 活动地点
  start_time?: string // 开始时间
  end_time?: string // 结束时间
  description?: string // 活动描述
  status?: '草稿' | '进行中' | '已结束' // 状态
  created_by?: string // 创建人
}

/**
 * 更新志愿活动响应数据
 */
export interface UpdateActivityResponse {
  message: string
  updated_fields: string[]
}

/**
 * 切换活动状态请求参数
 */
export interface ChangeActivityStatusParams {
  status: '草稿' | '进行中' | '已结束' // 目标状态
}

/**
 * 切换活动状态响应数据
 */
export interface ChangeActivityStatusResponse {
  message: string
}

// ==================== 参与志愿活动相关类型 ====================

/**
 * 活动报名名单项
 */
export interface ActivityParticipantInfo {
  record_id: number
  activity_id: number
  activity_name: string
  student_id: string
  student_name: string
  college?: string | null
  major?: string | null
  role: string
  service_hours: number
  signed_in: number
  remark?: string | null
  created_at: string
}

/**
 * 活动报名名单分页响应数据
 */
export type ActivityParticipantPageResponse = PaginationResponse<ActivityParticipantInfo>

/**
 * 活动报名名单列表响应数据
 */
export type ActivityParticipantListResponse = ListResponse<ActivityParticipantInfo>

/**
 * 学生报名活动请求参数
 */
export interface JoinActivityParams {
  activity_id: number // 活动主键 ID
  student_id: string // 报名学生学号（格式校验）
}

/**
 * 学生报名活动响应数据
 */
export interface JoinActivityResponse {
  message: string
  activity_id: number
  student_id: string
}

/**
 * 活动签到请求参数
 */
export interface SignInActivityParams {
  signed_in: number // 签到状态（1 = 签到，0 = 取消签到）
}

/**
 * 更新服务时长请求参数
 */
export interface UpdateServiceHoursParams {
  service_hours: number // 服务时长（数字类型）
}

/**
 * 更新服务时长响应数据
 */
export interface UpdateServiceHoursResponse {
  message: string
  record_id: number
  service_hours: number
}

/**
 * 批量更新服务时长请求项
 */
export interface BatchUpdateServiceHoursItem {
  record_id: number // 报名记录主键 ID
  service_hours: number // 服务时长（数字类型）
}

/**
 * 批量更新服务时长请求参数
 */
export interface BatchUpdateServiceHoursParams {
  updates: BatchUpdateServiceHoursItem[] // 批量更新列表（非空数组）
}

/**
 * 批量更新服务时长成功项
 */
export interface BatchUpdateServiceHoursSuccess {
  record_id: number
  service_hours: number
}

/**
 * 批量更新服务时长失败项
 */
export interface BatchUpdateServiceHoursFailed {
  record_id: number
  reason: string
}

/**
 * 批量更新服务时长响应数据
 */
export interface BatchUpdateServiceHoursResponse {
  total: number // 总数
  success: number // 成功数
  failed: number // 失败数
  successList: BatchUpdateServiceHoursSuccess[]
  failedList: BatchUpdateServiceHoursFailed[]
  message: string
}

/**
 * 学生个人报名记录项
 */
export interface StudentActivityRecord {
  record_id: number
  activity_id: number
  activity_name: string
  activity_status: string
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  category?: string | null
  student_id: string
  student_name: string
  college?: string | null
  major?: string | null
  role: string
  service_hours: number
  signed_in: number
  remark?: string | null
  created_at: string
  /**
   * 记录更新时间（部分历史数据可能为空）
   */
  updated_at?: string
}

/**
 * 学生个人报名记录分页响应数据
 */
export type StudentActivityRecordsPageResponse = PaginationResponse<StudentActivityRecord>

/**
 * 学生个人报名记录列表响应数据
 */
export type StudentActivityRecordsListResponse = ListResponse<StudentActivityRecord>

/**
 * 所有活动参与记录分页响应数据
 */
export type AllActivityParticipantsPageResponse = PaginationResponse<StudentActivityRecord>

/**
 * 所有活动参与记录列表响应数据
 */
export type AllActivityParticipantsListResponse = ListResponse<StudentActivityRecord>

// ==================== 荣誉与表彰记录相关类型 ====================

/**
 * 创建荣誉记录请求参数
 */
export interface CreateHonorRecordParams {
  honor_title: string // 荣誉名称
  student_id?: string // 获奖学生学号（格式校验）
  term_id?: number // 届次 ID
  honor_level?: string // 荣誉等级（如：国家级、省级、校级）
  issue_date?: string // 颁发日期
  issuer?: string // 颁发单位
  description?: string // 荣誉描述
  certificate_key?: string // 证书图片 OSS 存储 key
}

/**
 * 创建荣誉记录响应数据
 */
export interface CreateHonorRecordResponse {
  honor_id: number
  honor_title: string
  student_id?: string
  term_id?: number
  honor_level?: string
  issue_date?: string
  issuer?: string
  description?: string
  certificate_key?: string
}

/**
 * 荣誉记录信息
 */
export interface HonorRecordInfo {
  honor_id: number
  honor_title: string
  student_id?: string | null
  student_name?: string | null
  term_id?: number | null
  term_name?: string | null
  is_current?: boolean
  honor_level?: string | null
  issue_date?: string | null
  issuer?: string | null
  description?: string | null
  certificate_key?: string | null
}

/**
 * 荣誉记录分页响应数据
 */
export type HonorRecordPageResponse = PaginationResponse<HonorRecordInfo>

/**
 * 荣誉记录列表响应数据
 */
export type HonorRecordListResponse = ListResponse<HonorRecordInfo>

/**
 * 荣誉墙荣誉项
 */
export interface HonorWallHonor {
  honor_id: number
  honor_title: string
  honor_level?: string | null
  issue_date?: string | null
  issuer?: string | null
  description?: string | null
  student_id?: string | null
  student_name?: string | null
}

/**
 * 荣誉墙届次项
 */
export interface HonorWallTerm {
  term_id: number
  term_name: string
  is_current: boolean
  honors: HonorWallHonor[]
}

/**
 * 荣誉墙分页响应数据
 */
export interface HonorWallPageResponse {
  list: HonorWallTerm[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

/**
 * 荣誉墙列表响应数据
 */
export interface HonorWallListResponse {
  list: HonorWallTerm[]
  total: number
}

/**
 * 更新荣誉记录请求参数
 */
export interface UpdateHonorRecordParams {
  honor_title?: string // 荣誉名称
  student_id?: string // 获奖学生学号（格式校验）
  term_id?: number // 届次 ID
  honor_level?: string // 荣誉等级
  issue_date?: string // 颁发日期
  issuer?: string // 颁发单位
  description?: string // 荣誉描述
  certificate_key?: string // 证书图片 OSS 存储 key
}

/**
 * 批量创建荣誉记录请求参数
 */
export interface BatchCreateHonorRecordParams {
  honor_title: string // 荣誉名称（必填）
  student_id?: string
  term_id?: number
  honor_level?: string
  issue_date?: string
  issuer?: string
  description?: string
  certificate_key?: string
}

/**
 * 批量创建荣誉记录成功项
 */
export interface BatchCreateHonorRecordSuccess {
  honor_id: number
  honor_title: string
  student_id?: string
  term_id?: number
  honor_level?: string
  issue_date?: string
  issuer?: string
  description?: string
  certificate_key?: string
}

/**
 * 批量创建荣誉记录失败项
 */
export interface BatchCreateHonorRecordFailed {
  honor_title?: string | null
  reason: string
}

/**
 * 批量创建荣誉记录响应数据
 */
export interface BatchCreateHonorRecordResponse {
  total: number // 总数
  created: number // 创建数
  failed: number // 失败数
  createdList: BatchCreateHonorRecordSuccess[]
  failedList: BatchCreateHonorRecordFailed[]
}

// ==================== 公告与通知相关类型 ====================

/**
 * 创建公告请求参数
 */
export interface CreateAnnouncementParams {
  title: string // 公告标题
  content: string // 公告内容（Word 附件上传时可留空，自动转换）
  author_id?: string // 作者 ID
  term_id?: number // 届次 ID
  publish_time?: string // 发布时间
  status?: '草稿' | '已发布' | '归档' // 状态，默认草稿
  file_key?: string // 附件 OSS 存储 key（仅文件类型非 none 时有效）
  file_type?: 'none' | 'pdf' | 'word' // 附件类型，默认 none
}

/**
 * 创建公告响应数据
 */
export interface CreateAnnouncementResponse {
  message: string
  announcement_id: number
}

/**
 * 公告信息
 */
export interface AnnouncementInfo {
  announcement_id: number
  title: string
  content: string
  author_id?: string | null
  term_id?: number | null
  term_name?: string | null
  is_current?: boolean
  publish_time?: string | null
  status: string
  file_key?: string | null
  file_type?: string | null
  created_at?: string
}

/**
 * 已发布公告响应数据
 */
export interface PublishedAnnouncementsResponse {
  list: AnnouncementInfo[]
  total: number
}

/**
 * 公告分页响应数据（管理员）
 */
export type AnnouncementPageResponse = PaginationResponse<AnnouncementInfo>

/**
 * 公告列表响应数据（管理员）
 */
export type AnnouncementListResponse = ListResponse<AnnouncementInfo>

/**
 * 更新公告请求参数
 */
export interface UpdateAnnouncementParams {
  title?: string // 公告标题
  content?: string // 公告内容（Word 附件更新时可留空）
  author_id?: string // 作者 ID
  term_id?: number // 届次 ID
  publish_time?: string // 发布时间
  status?: '草稿' | '已发布' | '归档' // 状态
  file_key?: string // 新附件 OSS 存储 key（仅文件类型非 none 时有效）
  file_type?: 'none' | 'pdf' | 'word' // 新附件类型
}

// ==================== 团队相册/风采展示管理相关类型 ====================

/**
 * 创建照片请求参数
 */
export interface CreateGalleryPhotoParams {
  image_key: string // 图片 OSS 存储 key（唯一标识）
  term_id?: number // 届次 ID（关联对应届次）
  activity_id?: number // 活动 ID（关联对应活动）
  title?: string // 照片标题
  description?: string // 照片描述
  uploaded_by?: string // 上传人（自动填充当前登录用户学号，无需手动传）
  sort_order?: number // 排序序号（数字越小越靠前）
}

/**
 * 创建照片响应数据
 */
export interface CreateGalleryPhotoResponse {
  message: string
  photo_id: number
}

/**
 * 照片信息
 */
export interface GalleryPhotoInfo {
  photo_id: number
  term_id?: number | null
  term_name?: string | null
  activity_id?: number | null
  title?: string | null
  image_key: string
  description?: string | null
  uploaded_by?: string | null
  sort_order?: number | null
  uploaded_at?: string
}

/**
 * 照片分页响应数据
 */
export type GalleryPhotoPageResponse = PaginationResponse<GalleryPhotoInfo>

/**
 * 照片列表响应数据
 */
export type GalleryPhotoListResponse = ListResponse<GalleryPhotoInfo>

/**
 * 更新照片信息请求参数
 */
export interface UpdateGalleryPhotoParams {
  term_id?: number // 届次 ID
  activity_id?: number // 活动 ID
  title?: string // 照片标题
  description?: string // 照片描述
  image_key?: string // 新图片 OSS 存储 key（替换图片时必填）
  uploaded_by?: string // 上传人（替换图片时自动填充当前用户，无需手动传）
  sort_order?: number // 排序序号
}

// ==================== 服务队发展历程管理相关类型 ====================

/**
 * 创建里程碑事件请求参数
 */
export interface CreateTeamMilestoneParams {
  title: string // 里程碑标题
  event_date: string // 事件日期（格式校验）
  term_id?: number // 届次 ID（关联对应届次）
  description?: string // 事件描述
  event_type?: string // 事件类型（如：成立、获奖、重大活动等）
  image_key?: string // 图片 OSS 存储 key（上传图片时必填）
  created_by?: string // 创建人（自动填充当前登录用户学号，无需手动传）
}

/**
 * 创建里程碑响应数据
 */
export interface CreateTeamMilestoneResponse {
  message: string
  milestone_id: number
}

/**
 * 里程碑信息
 */
export interface TeamMilestoneInfo {
  milestone_id: number
  term_id?: number | null
  term_name?: string | null
  title: string
  description?: string | null
  event_date: string
  event_type?: string | null
  image_key?: string | null
  created_by?: string | null
  created_at?: string
}

/**
 * 里程碑分页响应数据
 */
export type TeamMilestonePageResponse = PaginationResponse<TeamMilestoneInfo>

/**
 * 里程碑列表响应数据
 */
export type TeamMilestoneListResponse = ListResponse<TeamMilestoneInfo>

/**
 * 更新里程碑事件请求参数
 */
export interface UpdateTeamMilestoneParams {
  title?: string // 里程碑标题
  event_date?: string // 事件日期（格式校验）
  term_id?: number // 届次 ID
  description?: string // 事件描述
  event_type?: string // 事件类型
  image_key?: string // 新图片 OSS 存储 key（替换图片时必填）
  created_by?: string // 创建人（不可修改，自动填充）
}

// ==================== 系统操作日志管理相关类型 ====================

/**
 * 操作日志查询参数
 */
export interface OperationLogQueryParams {
  page?: number // 页码（默认 1）
  pageSize?: number // 每页条数（默认 20）
  user_id?: string // 操作用户 ID（筛选指定用户的操作日志）
  action?: string // 操作动作（筛选指定类型的操作，如：创建、更新、删除）
  start_date?: string // 开始日期（格式：YYYY-MM-DD HH:MM:SS，筛选该时间后的日志）
  end_date?: string // 结束日期（格式：YYYY-MM-DD HH:MM:SS，筛选该时间前的日志）
}

/**
 * 操作日志信息
 */
export interface OperationLogInfo {
  log_id: number
  user_id: string
  action: string
  target_table: string
  target_id: string
  description: string
  ip_address: string
  user_agent: string
  created_at: string
}

/**
 * 操作日志列表响应数据
 */
export type OperationLogListResponse = PaginationResponse<OperationLogInfo>

// ==================== 报名管理相关类型 ====================

/**
 * 报名类型
 */
export type RecruitmentType = 'new_student' | 'internal_election'

/**
 * 报名状态
 */
export type RecruitmentStatus =
  | 'pending_review'
  | 'interview1_passed'
  | 'interview1_failed'
  | 'interview2_passed'
  | 'interview2_failed'
  | 'pending_assignment'
  | 'assigned'
  | 'rejected'

/**
 * 报名记录信息
 */
export interface TeamRecruitmentInfo {
  id: number
  year: number
  recruitment_type: RecruitmentType
  interview_rounds: number
  student_id: string
  name: string
  gender: '男' | '女' | '其他'
  college: string
  major: string
  grade: string
  phone: string
  email: string
  qq?: string | null
  dormitory?: string | null
  intention_dept1: string
  intention_dept2?: string | null
  current_position?: string | null
  election_position?: string | null
  work_plan?: string | null
  self_intro?: string | null
  past_experience?: string | null
  reason_for_joining?: string | null
  skill_tags?: string | null
  status: RecruitmentStatus
  final_department?: string | null
  final_position?: string | null
  reviewed_by_stage1?: number | null
  review_remark_stage1?: string | null
  reviewed_by_stage2?: number | null
  review_remark_stage2?: string | null
  assigned_by?: number | null
  created_at: string
  updated_at: string
  avatar_key?: string | null
  join_date?: string | null
}

/**
 * 提交报名请求参数
 */
export interface SubmitRecruitmentParams {
  year: number
  recruitment_type: RecruitmentType
  student_id: string
  name: string
  gender: '男' | '女' | '其他'
  college: string
  major: string
  grade: string
  phone: string
  email: string
  qq?: string
  dormitory?: string
  intention_dept1: string
  intention_dept2?: string
  current_position?: string
  election_position?: string
  work_plan?: string
  self_intro?: string
  past_experience?: string
  reason_for_joining?: string
  skill_tags?: string
  avatar_key?: string
}

/**
 * 报名列表响应数据
 */
export interface RecruitmentListResponse {
  list: TeamRecruitmentInfo[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  year: number
}

/**
 * 部门管理员查看报名列表响应数据
 */
export interface DepartmentApplicantsResponse extends PaginationResponse<TeamRecruitmentInfo> {
  year: number
}

/**
 * 审核面试结果请求参数
 */
export interface ReviewStageParams {
  year: number
  student_ids: string[]
  stage: '1' | '2'
  pass: boolean
  remark?: string | null
}

/**
 * 审核面试结果响应数据
 */
export interface ReviewStageResponse {
  message: string
}

/**
 * 最终任命/分配部门请求参数
 */
export interface AssignFinalParams {
  year: number
  student_ids: string[]
  department: string
  position?: string
}

/**
 * 最终任命/分配部门响应数据
 */
export interface AssignFinalResponse {
  message: string
}

// ==================== 报名通道管理相关类型 ====================

/**
 * 报名通道信息
 */
export interface RecruitmentSeasonInfo {
  id: number
  year: number
  type: RecruitmentType
  is_open: 0 | 1
  title: string
  start_time?: string | null
  end_time?: string | null
  created_at: string
  updated_at: string
}

/**
 * 获取当前报名通道响应数据
 */
export interface CurrentSeasonResponse {
  season: RecruitmentSeasonInfo | null
}

/**
 * 报名通道列表响应数据
 */
export type RecruitmentSeasonListResponse = ListResponse<RecruitmentSeasonInfo>

/**
 * 开启报名通道请求参数
 */
export interface OpenSeasonParams {
  year: number
  type: RecruitmentType
  title: string
  start_time?: string | null
  end_time?: string | null
}

/**
 * 开启报名通道响应数据
 */
export interface OpenSeasonResponse {
  message: string
}

/**
 * 关闭报名通道请求参数
 */
export interface CloseSeasonParams {
  year: number
  type: RecruitmentType
}

/**
 * 关闭报名通道响应数据
 */
export interface CloseSeasonResponse {
  message: string
}

/**
 * 删除报名通道请求参数
 */
export interface DeleteSeasonParams {
  year: number
  type: RecruitmentType
}

/**
 * 删除报名通道响应数据
 */
export interface DeleteSeasonResponse {
  message: string
}

// ==================== 权限管理相关类型 ====================

/**
 * 管理员信息
 */
export interface AdminInfo {
  student_id: string
  email: string
  role: 'admin' | 'superadmin'
  name: string | null
  created_at: string
  updated_at: string
}

/**
 * 管理员分页响应数据
 */
export type AdminPageResponse = PaginationResponse<AdminInfo>

/**
 * 管理员列表响应数据
 */
export type AdminListResponse = ListResponse<AdminInfo>

/**
 * 设置管理员请求参数
 */
export interface SetAdminParams {
  student_id: string
}

/**
 * 设置管理员响应数据
 */
export interface SetAdminResponse {
  message: string
}

/**
 * 取消管理员请求参数
 */
export interface RemoveAdminParams {
  student_id: string
}

/**
 * 取消管理员响应数据
 */
export interface RemoveAdminResponse {
  message: string
}

/**
 * 批量设置用户角色请求参数
 */
export interface BatchSetUserRolesParams {
  student_ids: string[]
  role: 'user' | 'admin' | 'superadmin'
}

// ==================== 操作日志相关类型 ====================

/**
 * 操作日志查询参数
 */
export interface OperationLogQueryParams {
  page?: number
  pageSize?: number
  user_id?: string
  operation_type?: string
  start_time?: string
  end_time?: string
  search?: string
}

/**
 * 操作日志信息
 */
export interface OperationLogInfo {
  id: number
  user_id: string
  operation_type: string
  operation_desc: string
  ip_address: string
  user_agent: string
  created_at: string
  details?: Record<string, unknown>
}
