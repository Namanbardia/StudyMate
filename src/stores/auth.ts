import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  subscriptionTier: 'free' | 'premium'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isPremium = computed(() => user.value?.subscriptionTier === 'premium')

  const setUser = (newUser: UserProfile | null, newToken: string | null = null) => {
    user.value = newUser
    token.value = newToken
  }

  const logout = () => {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isPremium,
    setUser,
    logout
  }
})

