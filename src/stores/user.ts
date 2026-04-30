import { defineStore } from 'pinia'
import { userInfoApi, recruitmentApi } from '@/utils/api'
import type { UserInfo, RecruitmentUserStatusData } from '@/utils/api/types'
import { getSignedOssUrl } from '@/utils/oss'

interface State {
  profile: UserInfo | null
  loading: boolean
  avatarUrl: string // 缓存的头像URL
  recruitmentUserStatus: RecruitmentUserStatusData | null
  recruitmentUserStatusLoading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): State => ({
    profile: null,
    loading: false,
    avatarUrl: '',
    recruitmentUserStatus: null,
    recruitmentUserStatusLoading: false,
  }),
  getters: {
    displayName: (state) => state.profile?.name || state.profile?.email || '',
    avatar: (state) => state.avatarUrl,
    role: (state) => state.profile?.role || '',
    isBackboneMember: (state) => Boolean(state.recruitmentUserStatus?.is_backbone_member),
    canApplyNewStudent: (state) => Boolean(state.recruitmentUserStatus?.eligibility?.can_apply_new_student),
    canApplyInternalElection: (state) =>
      Boolean(
        state.recruitmentUserStatus?.eligibility?.can_apply_internal_election
        ?? state.recruitmentUserStatus?.can_apply_election
      ),
  },
  actions: {
    async fetchProfile(studentId?: string) {
      if (!studentId) return
      this.loading = true
      try {
        const res = await userInfoApi.getUserInfo(studentId)
        if (res.data) {
          this.profile = res.data
          // 从avatar_key生成头像URL
          if (res.data.avatar_key) {
            try {
              this.avatarUrl = await getSignedOssUrl(res.data.avatar_key, {
                expiresInSeconds: 60 * 60,
                disposition: 'inline',
              })
            } catch (error) {
              console.error('生成头像URL失败:', error)
              this.avatarUrl = ''
            }
          } else {
            this.avatarUrl = ''
          }
        }

        await this.fetchRecruitmentUserStatus()
      } finally {
        this.loading = false
      }
    },
    async fetchRecruitmentUserStatus() {
      this.recruitmentUserStatusLoading = true
      try {
        const res = await recruitmentApi.getUserStatus()
        this.recruitmentUserStatus = res.data || null
      } catch (error) {
        console.error('获取报名用户状态失败:', error)
        this.recruitmentUserStatus = null
      } finally {
        this.recruitmentUserStatusLoading = false
      }
    },
    async setProfile(profile: UserInfo | null) {
      this.profile = profile
      if (profile?.avatar_key) {
        try {
          this.avatarUrl = await getSignedOssUrl(profile.avatar_key, {
            expiresInSeconds: 60 * 60,
            disposition: 'inline',
          })
        } catch (error) {
          console.error('生成头像URL失败:', error)
          this.avatarUrl = ''
        }
      } else {
        this.avatarUrl = ''
      }
    },
    clearProfile() {
      this.profile = null
      this.avatarUrl = ''
      this.recruitmentUserStatus = null
      this.recruitmentUserStatusLoading = false
    },
  },
})

