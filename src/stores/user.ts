import { defineStore } from 'pinia'
import { userInfoApi } from '@/utils/api'
import type { UserInfo } from '@/utils/api/types'
import { getSignedOssUrl } from '@/utils/oss'

interface State {
  profile: UserInfo | null
  loading: boolean
  avatarUrl: string // 缓存的头像URL
}

export const useUserStore = defineStore('user', {
  state: (): State => ({
    profile: null,
    loading: false,
    avatarUrl: '',
  }),
  getters: {
    displayName: (state) => state.profile?.name || state.profile?.email || '',
    avatar: (state) => state.avatarUrl,
    role: (state) => state.profile?.role || '',
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
      } finally {
        this.loading = false
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
    },
  },
})

