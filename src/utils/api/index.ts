/**
 * API 请求封装
 * 统一管理所有 API 接口
 *
 * 根据后端接口文档规范：
 * - 所有接口返回格式统一为 { code, success, message, data, meta?, debug? }
 * - 非 /public/** 的接口必须携带 Token
 * - Token 格式：Authorization: Bearer <token>
 * - 接口路径不包含 /api 前缀，已在 VITE_API_BASE_URL 中配置
 */

import { request } from '../request'
import type {
  OssSTSResponse,
  SendEmailCodeParams,
  VerifyEmailCodeParams,
  CleanupEmailCodeResponse,
  EmailCodeListResponse,
  GetEmailCodeListParams,
  RegisterParams,
  LoginParams,
  LoginResponse,
  BatchRegisterUser,
  BatchRegisterResponse,
  DeleteUserResponse,
  BatchDeleteUserResponse,
  UpdateUserInfoParams,
  UserInfo,
  UserInfoPageResponse,
  CollegesMajorsResponse,
  BatchImportUserInfoParams,
  BatchImportUserInfoResponse,
  ChangePasswordParams,
  PaginationParams,
  CreateDepartmentParams,
  CreateDepartmentResponse,
  DepartmentInfo,
  DepartmentPageResponse,
  DepartmentListResponse,
  UpdateDepartmentParams,
  BatchCreateDepartmentParams,
  BatchCreateDepartmentResponse,
  CreateTeamTermParams,
  CreateTeamTermResponse,
  TeamTermInfo,
  TeamTermPageResponse,
  TeamTermListResponse,
  UpdateTeamTermParams,
  BatchCreateTeamTermParams,
  BatchCreateTeamTermResponse,
  CreateBackboneMemberParams,
  CreateBackboneMemberResponse,
  BackboneMemberPageResponse,
  BackboneMemberListResponse,
  BackboneMemberTreeResponse,
  UpdateBackboneMemberParams,
  BatchCreateBackboneMemberParams,
  BatchCreateBackboneMemberResponse,
  CreateActivityParams,
  CreateActivityResponse,
  ActivityInfo,
  ActivityPageResponse,
  ActivityListResponse,
  UpdateActivityParams,
  UpdateActivityResponse,
  ChangeActivityStatusParams,
  ChangeActivityStatusResponse,
  ActivityParticipantListResponse,
  JoinActivityParams,
  JoinActivityResponse,
  SignInActivityParams,
  UpdateServiceHoursParams,
  UpdateServiceHoursResponse,
  BatchUpdateServiceHoursParams,
  BatchUpdateServiceHoursResponse,
  StudentActivityRecordsPageResponse,
  StudentActivityRecordsListResponse,
  AllActivityParticipantsPageResponse,
  AllActivityParticipantsListResponse,
  CreateHonorRecordParams,
  CreateHonorRecordResponse,
  HonorRecordPageResponse,
  HonorRecordListResponse,
  HonorWallPageResponse,
  HonorWallListResponse,
  UpdateHonorRecordParams,
  BatchCreateHonorRecordParams,
  BatchCreateHonorRecordResponse,
  CreateAnnouncementParams,
  CreateAnnouncementResponse,
  PublishedAnnouncementsResponse,
  AnnouncementPageResponse,
  AnnouncementListResponse,
  UpdateAnnouncementParams,
  CreateGalleryPhotoParams,
  CreateGalleryPhotoResponse,
  GalleryPhotoPageResponse,
  GalleryPhotoListResponse,
  UpdateGalleryPhotoParams,
  CreateTeamMilestoneParams,
  CreateTeamMilestoneResponse,
  TeamMilestonePageResponse,
  TeamMilestoneListResponse,
  UpdateTeamMilestoneParams,
  OperationLogQueryParams,
  OperationLogInfo,
  OperationLogListResponse,
  SubmitRecruitmentParams,
  RecruitmentListResponse,
  DepartmentApplicantsResponse,
  ReviewStageParams,
  ReviewStageResponse,
  AssignFinalParams,
  AssignFinalResponse,
  CurrentSeasonResponse,
  RecruitmentSeasonListResponse,
  OpenSeasonParams,
  OpenSeasonResponse,
  CloseSeasonParams,
  CloseSeasonResponse,
  DeleteSeasonParams,
  DeleteSeasonResponse,
  AdminPageResponse,
  AdminListResponse,
  SetAdminParams,
  SetAdminResponse,
  RemoveAdminParams,
  RemoveAdminResponse,
  BatchSetUserRolesParams,
} from './types'

// ==================== OSS 相关 API ====================

export const ossApi = {
  /**
   * 获取 OSS 上传用的 STS 临时凭证
   * 所有文件上传（图片、PDF、Word）都走这一个接口
   */
  getSTS: () => request.get<OssSTSResponse>('/oss/sts'),
}

// ==================== 邮箱相关 API ====================

export const emailApi = {
  /**
   * 发送邮箱验证码
   * 同一邮箱 + type 的验证码 1 分钟内只能发送一次，验证码有效期 5 分钟
   */
  sendCode: (params: SendEmailCodeParams) =>
    request.post('/public/email/send', params, {
      skipAuth: true, // 公共接口，不需要鉴权
      showSuccess: true,
    }),

  /**
   * 校验邮箱验证码
   * 校验验证码是否匹配、是否过期，校验通过后会将 verified 更新为 1
   */
  verifyCode: (params: VerifyEmailCodeParams) =>
    request.post('/public/email/verify', params, {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取验证码列表（管理员，支持分页和筛选）
   * admin / superadmin 可使用
   * @param params 分页和筛选参数
   */
  getAll: (params?: GetEmailCodeListParams) =>
    request.get<EmailCodeListResponse>('/email/list', {
      params,
    }),

  /**
   * 清理验证码记录（管理员）
   * @param daysBefore 删除 daysBefore 天前的记录，不传则删除所有已过期或 verified=1 的记录
   */
  cleanup: (daysBefore?: number) =>
    request.delete<CleanupEmailCodeResponse>('/email/cleanup', {
      params: daysBefore ? { daysBefore } : undefined,
      showSuccess: true,
    }),
}

// ==================== 注册/登录相关 API ====================

export const authApi = {
  /**
   * 用户注册
   * 需要邮箱验证码校验，校验成功后更新验证码状态为 verified = 1
   */
  register: (params: RegisterParams) =>
    request.post('/public/auth/register', params, {
      skipAuth: true, // 公共接口，不需要鉴权
      showSuccess: true,
    }),

  /**
   * 用户登录
   * 支持学号、ctbu 邮箱或普通邮箱登录，返回 JWT Token 及用户基础信息
   */
  login: (params: LoginParams) =>
    request.post<LoginResponse>('/public/auth/login', params, {
      skipAuth: true, // 公共接口，不需要鉴权
      showSuccess: true,
    }),

  /**
   * 批量注册（管理员）
   * 管理员批量导入用户账号，无需验证码
   * 单条错误不会停止任务，将错误记录汇总后返回
   */
  batchRegister: (users: BatchRegisterUser[]) =>
    request.post<BatchRegisterResponse>('/auth/login/batch-register', users, {
      showSuccess: true,
    }),
}

// ==================== 删除用户相关 API ====================

export const userDeleteApi = {
  /**
   * 删除单个用户（按学号）
   * 仅限 superadmin 使用
   * @param student_id 10 位学号
   */
  deleteUser: (student_id: string) =>
    request.delete<DeleteUserResponse>(`/auth/login/delete/${student_id}`, {
      showSuccess: true,
    }),

  /**
   * 批量删除用户
   * 仅限 superadmin 使用
   * @param studentIds 学号数组
   */
  batchDelete: (studentIds: string[]) =>
    request.post<BatchDeleteUserResponse>(
      '/auth/login/delete/batch',
      { studentIds },
      {
        showSuccess: true,
      }
    ),
}

// ==================== 用户信息管理相关 API ====================

export const userInfoApi = {
  /**
   * 更新单个用户信息
   * 本人 / admin / superadmin 可使用
   * @param student_id 要更新的学号
   * @param params 要更新的字段（所有字段均为可选）
   */
  updateUserInfo: (student_id: string, params: UpdateUserInfoParams) =>
    request.put<{ message: string }>(`/auth/info/update/${student_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 查询单个用户信息
   * 本人 / admin / superadmin 可查询
   * @param student_id 要查询的学号
   */
  getUserInfo: (student_id: string) => request.get<UserInfo>(`/auth/info/info/${student_id}`),

  /**
   * 查询所有用户信息（管理员）
   * admin / superadmin 可使用
   */
  getAllUsers: (params?: PaginationParams) => request.get<UserInfoPageResponse>('/auth/info/page', { params }),

  /**
   * 批量导入/更新用户信息（管理员）
   * admin / superadmin 可使用
   * @param users 用户信息数组
   */
  batchImport: (users: BatchImportUserInfoParams[]) =>
    request.post<BatchImportUserInfoResponse>('/auth/info/batch-import', users, {
      showSuccess: true,
    }),
}

// ==================== 学院专业列表相关 API ====================

export const collegesMajorsApi = {
  /**
   * 获取所有学院及专业列表
   */
  getAll: () => request.get<CollegesMajorsResponse>('/auth/info/colleges-majors'),
}

// ==================== 修改密码相关 API ====================

export const passwordApi = {
  /**
   * 修改密码
   * 用户通过旧密码 + 邮箱验证码修改密码
   */
  changePassword: (params: ChangePasswordParams) =>
    request.post<{ message: string }>('/public/auth/change-password', params, {
      skipAuth: true, // 公共接口，不需要鉴权
      showSuccess: true,
    }),
}

// ==================== 部门管理相关 API ====================

export const departmentApi = {
  /**
   * 创建部门（超管）
   * 创建一个新的部门（名称唯一）
   */
  create: (params: CreateDepartmentParams) =>
    request.post<CreateDepartmentResponse>('/departments/create', params, {
      showSuccess: true,
    }),

  /**
   * 获取部门分页列表
   * 公开接口，获取部门分页列表（含负责人姓名）
   */
  getPage: (params?: { page?: number; pageSize?: number; search?: string }) =>
    request.get<DepartmentPageResponse>('/public/departments/page', {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取所有部门信息
   * 公开接口，获取所有部门信息（含负责人姓名）
   */
  getAll: () =>
    request.get<DepartmentListResponse>('/public/departments/list', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取单个部门信息
   * 公开接口，查询单个部门信息（含负责人姓名）
   * @param dept_id 部门主键ID
   */
  getOne: (dept_id: number) =>
    request.get<DepartmentInfo>(`/public/departments/${dept_id}`, {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 更新部门信息（管理员）
   * admin / superadmin 可使用
   * @param dept_id 部门主键ID
   * @param params 要更新的字段（所有字段均为可选）
   */
  update: (dept_id: number, params: UpdateDepartmentParams) =>
    request.put<{ message: string }>(`/departments/update/${dept_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 删除部门（超管）
   * 仅限 superadmin 使用
   * @param dept_id 部门主键ID
   */
  delete: (dept_id: number) =>
    request.delete<{ message: string }>(`/departments/delete/${dept_id}`, {
      showSuccess: true,
    }),

  /**
   * 批量创建部门（超管）
   * 仅限 superadmin 使用，批量创建多个部门（自动跳过已存在的名称）
   * @param departments 部门信息数组
   */
  batchCreate: (departments: BatchCreateDepartmentParams[]) =>
    request.post<BatchCreateDepartmentResponse>('/departments/batch-create', departments, {
      showSuccess: true,
    }),
}

// ==================== 届次管理相关 API ====================

export const teamTermApi = {
  /**
   * 创建届次（超管）
   * 仅限 superadmin 使用，创建新的服务队届次记录
   */
  create: (params: CreateTeamTermParams) =>
    request.post<CreateTeamTermResponse>('/team-terms/create', params, {
      showSuccess: true,
    }),

  /**
   * 获取届次分页列表
   * 公开接口，获取届次分页列表（时间排序）
   */
  getPage: (params?: { page?: number; pageSize?: number; search?: string }) =>
    request.get<TeamTermPageResponse>('/public/team-terms/page', {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 查询所有届次
   * 公开接口，获取所有届次信息（时间排序）
   */
  getAll: () =>
    request.get<TeamTermListResponse>('/public/team-terms/list', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 查询单个届次详情
   * 公开接口，根据 term_id 查询特定届次详细信息
   * @param term_id 届次主键ID
   */
  getOne: (term_id: number) =>
    request.get<TeamTermInfo>(`/public/team-terms/${term_id}`, {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 更新届次信息（超管）
   * 仅限 superadmin 使用
   * @param term_id 届次主键ID
   * @param params 要更新的字段（所有字段均为可选）
   */
  update: (term_id: number, params: UpdateTeamTermParams) =>
    request.put<{ message: string }>(`/team-terms/update/${term_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 删除届次（超管）
   * 仅限 superadmin 使用
   * @param term_id 届次主键ID
   */
  delete: (term_id: number) =>
    request.delete<{ message: string }>(`/team-terms/delete/${term_id}`, {
      showSuccess: true,
    }),

  /**
   * 批量创建届次（超管）
   * 仅限 superadmin 使用，批量创建届次（跳过重名或不合法项）
   * @param terms 届次信息数组
   */
  batchCreate: (terms: BatchCreateTeamTermParams[]) =>
    request.post<BatchCreateTeamTermResponse>('/team-terms/batch-create', terms, {
      showSuccess: true,
    }),
}

// ==================== 骨干成员管理相关 API ====================

export const backboneMemberApi = {
  /**
   * 创建骨干成员（管理员）
   * admin / superadmin 可使用
   * 创建一个新的骨干成员（届次内学号唯一）
   */
  create: (params: CreateBackboneMemberParams) =>
    request.post<CreateBackboneMemberResponse>('/backbone-members/create', params, {
      showSuccess: true,
    }),

  /**
   * 获取骨干成员分页列表
   * 公开接口，获取骨干成员分页列表（关联部门、届次）
   */
  getPage: (params?: { page?: number; pageSize?: number; search?: string }) =>
    request.get<BackboneMemberPageResponse>('/public/backbone-members/page', {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取所有骨干成员
   * 公开接口，获取所有骨干成员信息（关联部门、届次）
   */
  getAll: () =>
    request.get<BackboneMemberListResponse>('/public/backbone-members/all', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取骨干成员树状结构
   * 公开接口，按届次→部门→成员的树状结构返回骨干信息（供门户展示）
   */
  getTree: () =>
    request.get<BackboneMemberTreeResponse>('/public/backbone-members/tree', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 更新骨干成员信息（管理员）
   * admin / superadmin 可使用
   * @param member_id 骨干成员主键ID
   * @param params 要更新的字段（所有字段均为可选）
   */
  update: (member_id: number, params: UpdateBackboneMemberParams) =>
    request.put<{ message: string }>(`/backbone-members/update/${member_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 删除骨干成员（管理员）
   * admin / superadmin 可使用，删除指定骨干成员，连带删除 OSS 头像文件
   * @param member_id 骨干成员主键ID
   */
  delete: (member_id: number) =>
    request.delete<{ message: string }>(`/backbone-members/delete/${member_id}`, {
      showSuccess: true,
    }),

  /**
   * 批量创建骨干成员（管理员）
   * 仅限 admin 使用，批量创建多个骨干成员，返回创建/失败详情
   * @param members 骨干成员信息数组
   */
  batchCreate: (members: BatchCreateBackboneMemberParams[]) =>
    request.post<BatchCreateBackboneMemberResponse>('/backbone-members/batch-create', members, {
      showSuccess: true,
    }),
}

// ==================== 志愿活动记录管理相关 API ====================

export const activityApi = {
  /**
   * 创建志愿活动（管理员）
   * admin / superadmin 可使用
   * 创建一个新的志愿活动
   */
  create: (params: CreateActivityParams) =>
    request.post<CreateActivityResponse>('/activities/create', params, {
      showSuccess: true,
    }),

  /**
   * 获取志愿活动分页列表
   * 公开接口，获取志愿活动分页列表（关联部门、届次）
   */
  getPage: (params?: { page?: number; pageSize?: number; search?: string; status?: string; category?: string }) =>
    request.get<ActivityPageResponse>('/public/activities/page', {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取所有志愿活动
   * 公开接口，获取所有志愿活动信息（关联部门、届次）
   */
  getAll: () =>
    request.get<ActivityListResponse>('/public/activities/list', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取活动详情
   * 公开接口，获取单个志愿活动的详细信息
   * @param activity_id 活动主键ID
   */
  getOne: (activity_id: number) =>
    request.get<ActivityInfo>(`/public/activities/${activity_id}`, {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取活动类别列表
   * 公开接口，获取所有活动的活动类别
   */
  getCategories: () =>
    request.get<string[]>('/activities/categories', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 更新志愿活动（管理员）
   * admin / superadmin 可使用
   * @param activity_id 活动主键ID
   * @param params 要更新的字段（所有字段均为可选）
   */
  update: (activity_id: number, params: UpdateActivityParams) =>
    request.put<UpdateActivityResponse>(`/activities/update/${activity_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 删除志愿活动（管理员）
   * admin / superadmin 可使用
   * @param activity_id 活动主键ID
   */
  delete: (activity_id: number) =>
    request.delete<{ message: string }>(`/activities/delete/${activity_id}`, {
      showSuccess: true,
    }),

  /**
   * 切换活动状态（管理员）
   * admin / superadmin 可使用
   * 切换志愿活动的状态（草稿→进行中→已结束）
   * @param activity_id 活动主键ID
   * @param params 目标状态
   */
  changeStatus: (activity_id: number, params: ChangeActivityStatusParams) =>
    request.patch<ChangeActivityStatusResponse>(`/activities/status/${activity_id}`, params, {
      showSuccess: true,
    }),
}

// ==================== 参与志愿活动相关 API ====================

export const activityParticipantApi = {
  /**
   * 获取活动报名名单（管理员）
   * admin / superadmin 可使用
   * 获取指定活动的所有报名人员信息（关联活动、学生详情）
   * @param activity_id 活动主键ID
   */
  getList: (activity_id: number, params?: PaginationParams) =>
    request.get<ActivityParticipantListResponse>(`/activity-participants/list/${activity_id}`, { params }),

  /**
   * 学生报名活动
   * user / admin / superadmin 可使用
   * 普通用户仅可自己报名，管理员/超管可代报
   */
  join: (params: JoinActivityParams) =>
    request.post<JoinActivityResponse>('/activity-participants/join', params, {
      showSuccess: true,
    }),

  /**
   * 取消活动报名
   * user / admin / superadmin 可使用
   * 普通用户仅可取消自己的报名，管理员/超管可代取消
   * @param activity_id 活动主键ID
   * @param student_id 报名学生学号
   */
  cancel: (activity_id: number, student_id: string) =>
    request.delete<JoinActivityResponse>(
      `/activity-participants/cancel/${activity_id}/${student_id}`,
      {
        showSuccess: true,
      }
    ),

  /**
   * 活动签到/取消签到（管理员）
   * admin / superadmin 可使用
   * 标记活动签到状态（1 = 签到，0 = 取消签到）
   * @param record_id 报名记录主键ID
   * @param params 签到状态
   */
  signIn: (record_id: number, params: SignInActivityParams) =>
    request.patch<{ message: string }>(`/activity-participants/signin/${record_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 单个更新服务时长（管理员）
   * admin / superadmin 可使用
   * @param record_id 报名记录主键ID
   * @param params 服务时长
   */
  updateHours: (record_id: number, params: UpdateServiceHoursParams) =>
    request.patch<UpdateServiceHoursResponse>(`/activity-participants/hours/${record_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 批量更新服务时长（管理员）
   * admin / superadmin 可使用
   * @param params 批量更新列表
   */
  batchUpdateHours: (params: BatchUpdateServiceHoursParams) =>
    request.put<BatchUpdateServiceHoursResponse>('/activity-participants/hours/batch', params, {
      showSuccess: true,
    }),

  /**
   * 获取学生个人报名记录（分页）
   * user / admin / superadmin 可使用
   * 普通用户仅可查看自己的记录，管理员/超管可查看任意学生的记录
   * @param student_id 学生学号
   */
  getStudentRecordsPage: (student_id: string, params?: { page?: number; pageSize?: number }) =>
    request.get<StudentActivityRecordsPageResponse>(`/activity-participants/records/page/${student_id}`, { params }),

  /**
   * 获取学生个人报名记录（全量）
   * user / admin / superadmin 可使用
   * 普通用户仅可查看自己的记录，管理员/超管可查看任意学生的记录
   * @param student_id 学生学号
   */
  getStudentRecords: (student_id: string) =>
    request.get<StudentActivityRecordsListResponse>(`/activity-participants/records/list/${student_id}`),

  /**
   * 获取所有活动参与记录（分页）
   * admin / superadmin 可使用
   * 获取系统中所有活动的参与记录（关联活动、学生信息）
   */
  getAllPage: (params?: { page?: number; pageSize?: number; search?: string }) =>
    request.get<AllActivityParticipantsPageResponse>('/activity-participants/all/page', { params }),

  /**
   * 获取所有活动参与记录（全量）
   * admin / superadmin 可使用
   * 获取系统中所有活动的参与记录（关联活动、学生信息）
   */
  getAll: () => request.get<AllActivityParticipantsListResponse>('/activity-participants/all/list'),
}

// ==================== 荣誉与表彰记录相关 API ====================

export const honorRecordApi = {
  /**
   * 创建荣誉记录（管理员）
   * admin / superadmin 可使用
   * 创建一条学生荣誉记录
   */
  create: (params: CreateHonorRecordParams) =>
    request.post<CreateHonorRecordResponse>('/honor-records/create', params, {
      showSuccess: true,
    }),

  /**
   * 获取荣誉记录分页列表
   * 公开接口，获取荣誉记录分页列表（关联学生、届次信息）
   */
  getPage: (params?: { page?: number; pageSize?: number; search?: string; honor_level?: string; term_id?: string }) =>
    request.get<HonorRecordPageResponse>('/public/honor-records/page', {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取所有荣誉记录
   * 公开接口，获取所有荣誉记录（关联学生、届次信息）
   */
  getAll: () =>
    request.get<HonorRecordListResponse>('/public/honor-records/list', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取荣誉墙分页
   * 公开接口，按届次分组展示荣誉记录（届次→荣誉列表结构，供门户展示）
   */
  getWallPage: (params?: { page?: number; pageSize?: number }) =>
    request.get<HonorWallPageResponse>('/public/honor-records/wall/page', {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取历届荣誉墙
   * 公开接口，按届次分组展示荣誉记录（届次→荣誉列表结构，供门户展示）
   */
  getWall: () =>
    request.get<HonorWallListResponse>('/public/honor-records/wall/list', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 更新荣誉记录（管理员）
   * admin / superadmin 可使用
   * @param honor_id 荣誉记录主键ID
   * @param params 要更新的字段（所有字段均为可选）
   */
  update: (honor_id: number, params: UpdateHonorRecordParams) =>
    request.put<{ message: string }>(`/honor-records/update/${honor_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 删除荣誉记录（管理员）
   * admin / superadmin 可使用
   * @param honor_id 荣誉记录主键ID
   */
  delete: (honor_id: number) =>
    request.delete<{ message: string }>(`/honor-records/delete/${honor_id}`, {
      showSuccess: true,
    }),

  /**
   * 批量创建荣誉记录（管理员）
   * admin / superadmin 可使用
   * 批量创建多条荣誉记录，返回创建/失败详情
   * @param honors 荣誉记录信息数组
   */
  batchCreate: (honors: BatchCreateHonorRecordParams[]) =>
    request.post<BatchCreateHonorRecordResponse>('/honor-records/batch-create', honors, {
      showSuccess: true,
    }),
}

// ==================== 公告与通知相关 API ====================

export const announcementApi = {
  /**
   * 创建公告（管理员）
   * admin / superadmin 可使用
   * 创建公告（支持 Word 文档转 HTML 内容，自动存储 OSS 附件）
   */
  create: (params: CreateAnnouncementParams) =>
    request.post<CreateAnnouncementResponse>('/announcements/create', params, {
      showSuccess: true,
    }),

  /**
   * 获取已发布公告
   * 公开接口，获取所有状态为"已发布"的公告（供门户展示）
   */
  getPublished: () =>
    request.get<PublishedAnnouncementsResponse>('/public/announcements/published', {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取公告分页列表
   * admin / superadmin 可使用
   * 获取所有状态的公告（含草稿、归档，供后台管理）
   */
  getPage: (params?: { page?: number; pageSize?: number; search?: string; status?: string }) =>
    request.get<AnnouncementPageResponse>('/announcements/page', { params }),

  /**
   * 获取所有公告（管理员）
   * admin / superadmin 可使用
   * 获取所有状态的公告（含草稿、归档，供后台管理）
   */
  getAll: () => request.get<AnnouncementListResponse>('/announcements/list'),

  /**
   * 更新公告（管理员）
   * admin / superadmin 可使用
   * 更新公告信息（支持 OSS 附件替换、Word 重新转 HTML）
   * @param announcement_id 公告主键ID
   * @param params 要更新的字段（所有字段均为可选）
   */
  update: (announcement_id: number, params: UpdateAnnouncementParams) =>
    request.put<{ message: string }>(`/announcements/update/${announcement_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 删除公告（管理员）
   * admin / superadmin 可使用
   * 删除指定公告（连带删除 OSS 附件）
   * @param announcement_id 公告主键ID
   */
  delete: (announcement_id: number) =>
    request.delete<{ message: string }>(`/announcements/delete/${announcement_id}`, {
      showSuccess: true,
    }),
}

// ==================== 团队相册/风采展示管理相关 API ====================

export const galleryPhotoApi = {
  /**
   * 上传照片（管理员）
   * admin / superadmin 可使用
   * 上传照片到团队相册（OSS 存储，必填图片 URL 和存储 key）
   */
  create: (params: CreateGalleryPhotoParams) =>
    request.post<CreateGalleryPhotoResponse>('/gallery-photos/create', params, {
      showSuccess: true,
    }),

  /**
   * 按届次筛选照片
   * 公开接口，获取指定届次下的所有照片（供门户展示）
   * @param term_id 届次主键ID
   */
  getByTerm: (term_id: number, params?: PaginationParams) =>
    request.get<GalleryPhotoListResponse>(`/public/gallery-photos/term/${term_id}`, {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 按活动筛选照片
   * 公开接口，获取指定活动下的所有照片（供门户展示）
   * @param activity_id 活动主键ID
   */
  getByActivity: (activity_id: number, params?: PaginationParams) =>
    request.get<GalleryPhotoListResponse>(`/public/gallery-photos/activity/${activity_id}`, {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取所有照片（管理员）
   * admin / superadmin 可使用
   * 获取系统中所有照片（关联届次信息，供后台管理）
   */
  getAll: (params?: PaginationParams) => request.get<GalleryPhotoPageResponse>('/gallery-photos/page', { params }),

  /**
   * 更新照片信息（管理员）
   * admin / superadmin 可使用
   * 更新照片信息（支持 OSS 图片替换，自动删除旧图）
   * @param photo_id 照片主键ID
   * @param params 要更新的字段（所有字段均为可选）
   */
  update: (photo_id: number, params: UpdateGalleryPhotoParams) =>
    request.put<{ message: string }>(`/gallery-photos/update/${photo_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 删除照片（管理员）
   * admin / superadmin 可使用
   * 删除指定照片（连带删除 OSS 中的图片文件）
   * @param photo_id 照片主键ID
   */
  delete: (photo_id: number) =>
    request.delete<{ message: string }>(`/gallery-photos/delete/${photo_id}`, {
      showSuccess: true,
    }),
}

// ==================== 服务队发展历程管理相关 API ====================

export const teamMilestoneApi = {
  /**
   * 创建里程碑事件（管理员）
   * admin / superadmin 可使用
   * 创建服务队里程碑事件（必填标题和事件日期，支持图片上传）
   */
  create: (params: CreateTeamMilestoneParams) =>
    request.post<CreateTeamMilestoneResponse>('/team-milestones/create', params, {
      showSuccess: true,
    }),

  /**
   * 按届次筛选里程碑
   * 公开接口，获取指定届次下的所有里程碑事件（供门户展示）
   * @param term_id 届次主键ID
   */
  getByTerm: (term_id: number, params?: PaginationParams) =>
    request.get<TeamMilestoneListResponse>(`/public/team-milestones/term/${term_id}`, {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 按事件类型筛选里程碑（全量）
   * 公开接口，获取指定类型的所有里程碑事件（供门户展示）
   * @param event_type 事件类型（如：成立、获奖、重大活动）
   */
  getByType: (event_type: string) =>
    request.get<TeamMilestoneListResponse>(`/public/team-milestones/type/list/${event_type}`, {
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 按事件类型筛选里程碑（分页）
   * 公开接口，获取指定类型的所有里程碑事件（供门户展示）
   * @param event_type 事件类型（如：成立、获奖、重大活动）
   */
  getByTypePage: (event_type: string, params?: PaginationParams) =>
    request.get<TeamMilestonePageResponse>(`/public/team-milestones/type/page/${event_type}`, {
      params,
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 按时间范围筛选里程碑（分页）
   * 公开接口，获取指定时间范围内的所有里程碑事件（供门户展示）
   * @param start 开始日期（格式：YYYY-MM-DD）
   * @param end 结束日期（格式：YYYY-MM-DD）
   */
  getByDateRangePage: (start: string, end: string, params?: { page?: number; pageSize?: number }) =>
    request.get<TeamMilestonePageResponse>('/public/team-milestones/date-range/page', {
      params: { start_date: start, end_date: end, ...params },
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 按时间范围筛选里程碑（全量）
   * 公开接口，获取指定时间范围内的所有里程碑事件（供门户展示）
   * @param start 开始日期（格式：YYYY-MM-DD）
   * @param end 结束日期（格式：YYYY-MM-DD）
   */
  getByDateRange: (start: string, end: string) =>
    request.get<TeamMilestoneListResponse>('/public/team-milestones/date-range/list', {
      params: { start_date: start, end_date: end },
      skipAuth: true, // 公共接口，不需要鉴权
    }),

  /**
   * 获取里程碑分页列表
   * admin / superadmin 可使用
   * 获取系统中所有里程碑事件（关联届次信息，供后台管理）
   */
  getPage: (params?: { page?: number; pageSize?: number; search?: string }) =>
    request.get<TeamMilestonePageResponse>('/team-milestones/page', { params }),

  /**
   * 获取所有里程碑（管理员）
   * admin / superadmin 可使用
   * 获取系统中所有里程碑事件（关联届次信息，供后台管理）
   */
  getAll: () => request.get<TeamMilestoneListResponse>('/team-milestones/list'),

  /**
   * 更新里程碑事件（管理员）
   * admin / superadmin 可使用
   * 更新里程碑事件信息（支持 OSS 图片替换，自动删除旧图）
   * @param milestone_id 里程碑主键ID
   * @param params 要更新的字段（所有字段均为可选）
   */
  update: (milestone_id: number, params: UpdateTeamMilestoneParams) =>
    request.put<{ message: string }>(`/team-milestones/update/${milestone_id}`, params, {
      showSuccess: true,
    }),

  /**
   * 删除里程碑事件（管理员）
   * admin / superadmin 可使用
   * 删除指定里程碑事件（连带删除 OSS 中的图片文件）
   * @param milestone_id 里程碑主键ID
   */
  delete: (milestone_id: number) =>
    request.delete<{ message: string }>(`/team-milestones/delete/${milestone_id}`, {
      showSuccess: true,
    }),
}

// ==================== 系统操作日志管理相关 API ====================

export const operationLogApi = {
  /**
   * 分页查询操作日志（管理员）
   * admin / superadmin 可使用
   * 分页查询系统操作日志（支持用户 ID、操作类型、时间范围多条件筛选）
   * @param params 查询参数
   */
  getList: (params?: OperationLogQueryParams) =>
    request.get<OperationLogListResponse>('/operation-logs/list', {
      params,
    }),

  /**
   * 查看单条操作日志详情（管理员）
   * admin / superadmin 可使用
   * 查询指定 ID 的操作日志详情
   * @param log_id 操作日志主键ID
   */
  getOne: (log_id: number) => request.get<OperationLogInfo>(`/operation-logs/${log_id}`),
}

// ==================== 报名管理相关 API ====================

export const recruitmentApi = {
  /**
   * 学生提交报名
   * user / admin / superadmin 可使用
   */
  submitApplication: (params: SubmitRecruitmentParams) =>
    request.post('/team-recruitment/create', params, {
      showSuccess: true,
    }),

  /**
   * 获取报名列表分页（超级管理员）
   * 超级管理员可以查看所有报名记录
   * @param params 查询参数
   */
  getAdminList: (params?: { year?: number; type?: string; status?: string; page?: number; pageSize?: number; search?: string }) =>
    request.get<RecruitmentListResponse>('/team-recruitment/page', {
      params,
    }),

  /**
   * 获取部门管理员负责的报名列表
   * 部门管理员只能看到自己部门的报名记录
   * @param params 查询参数（year 可选）
   */
  getDepartmentApplicants: (params?: { year?: number; page?: number; pageSize?: number; search?: string }) =>
    request.get<DepartmentApplicantsResponse>('/team-recruitment/department-applicants/page', {
      params,
    }),

  /**
   * 审核面试结果（批量）
   * admin / superadmin 可使用
   * @param params 审核参数
   */
  reviewStage: (params: ReviewStageParams) =>
    request.post<ReviewStageResponse>('/team-recruitment/review', params, {
      showSuccess: true,
    }),

  /**
   * 最终任命/分配部门
   * admin / superadmin 可使用
   * @param params 分配参数
   */
  assignFinal: (params: AssignFinalParams) =>
    request.post<AssignFinalResponse>('/team-recruitment/assign', params, {
      showSuccess: true,
    }),
}

// ==================== 报名通道管理相关 API ====================

export const recruitmentSeasonApi = {
  /**
   * 获取当前开启的报名通道
   */
  getCurrent: () => request.get<CurrentSeasonResponse>('/recruitment-seasons/current'),

  /**
   * 获取所有报名通道列表（管理端）
   * admin / superadmin 可使用
   */
  getList: (params?: PaginationParams) => request.get<RecruitmentSeasonListResponse>('/recruitment-seasons/list', { params }),

  /**
   * 开启报名通道
   * admin / superadmin 可使用
   * @param params 开启参数
   */
  open: (params: OpenSeasonParams) =>
    request.post<OpenSeasonResponse>('/recruitment-seasons/open', params, {
      showSuccess: true,
    }),

  /**
   * 关闭所有报名通道
   * 仅限 superadmin 使用
   */
  closeAll: () =>
    request.post<CloseSeasonResponse>(
      '/recruitment-seasons/close-all',
      {},
      {
        showSuccess: true,
      }
    ),

  /**
   * 关闭指定报名通道
   * admin / superadmin 可使用
   * @param params 关闭参数
   */
  close: (params: CloseSeasonParams) =>
    request.post<CloseSeasonResponse>('/recruitment-seasons/close', params, {
      showSuccess: true,
    }),

  /**
   * 删除报名通道（仅在关闭状态下可删）
   * admin / superadmin 可使用
   * @param params 删除参数
   */
  delete: (params: DeleteSeasonParams) =>
    request.post<DeleteSeasonResponse>('/recruitment-seasons/delete', params, {
      showSuccess: true,
    }),
}

// ==================== 权限管理 API ====================

/**
 * 权限管理相关 API
 */
export const permissionApi = {
  /**
   * 获取所有管理员分页列表
   * admin / superadmin 可使用
   */
  getAllAdmins: (params?: { page?: number; pageSize?: number }) =>
    request.get<AdminPageResponse>('/auth/login/admin/list-page', { params }),

  /**
   * 获取所有管理员（全量）
   * admin / superadmin 可使用
   */
  getAllAdminsList: () => request.get<AdminListResponse>('/auth/login/admin/list'),

  /**
   * 设置管理员
   * 仅限 superadmin 使用
   * @param params 设置管理员参数
   */
  setAdmin: (params: SetAdminParams) =>
    request.post<SetAdminResponse>('/auth/login/admin/set', params, {
      showSuccess: true,
    }),

  /**
   * 批量设置用户角色
   * 仅限 superadmin 使用
   * @param params 批量设置参数
   */
  batchSetUserRoles: (params: BatchSetUserRolesParams) =>
    request.post('/auth/login/admin/set/batch', params, {
      showSuccess: true,
    }),

  /**
   * 取消管理员身份
   * 仅限 superadmin 使用
   * @param params 取消管理员参数
   */
  removeAdmin: (params: RemoveAdminParams) =>
    request.post<RemoveAdminResponse>('/auth/login/admin/remove', params, {
      showSuccess: true,
    }),

  /**
   * 搜索用户（用于设置管理员）
   * admin / superadmin 可使用
   * @param query 搜索关键词
   * @param params 分页参数
   */
  searchUsers: (query: string, params?: PaginationParams) =>
    request.get<UserInfoPageResponse>(`/auth/login/users/search?q=${encodeURIComponent(query)}`, { params }),
}

// 导出所有 API
export default {
  ossApi,
  emailApi,
  authApi,
  userDeleteApi,
  userInfoApi,
  passwordApi,
  departmentApi,
  teamTermApi,
  backboneMemberApi,
  activityApi,
  activityParticipantApi,
  honorRecordApi,
  announcementApi,
  galleryPhotoApi,
  teamMilestoneApi,
  operationLogApi,
  recruitmentApi,
  recruitmentSeasonApi,
  permissionApi,
}
