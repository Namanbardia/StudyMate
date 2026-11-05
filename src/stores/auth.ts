import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { getMe, type WorkerUser } from '@/services/api'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
  subscriptionTier: 'free' | 'premium'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const workerProfile = ref<WorkerUser | null>(null)
  const isLoading = ref(true)
  const isInitialized = ref(false)
  const workerSyncError = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isPremium = computed(() => user.value?.subscriptionTier === 'premium')

  const setUserFromFirebase = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      user.value = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
        email: firebaseUser.email || '',
        avatarUrl: firebaseUser.photoURL || undefined,
        subscriptionTier: 'free'
      }
    } else {
      user.value = null
      workerProfile.value = null
      workerSyncError.value = null
    }
  }

  /**
   * Call GET /api/me to retrieve and verify user identity through Cloudflare Worker.
   * Logs only non-sensitive debug info (Firebase UID) for development verification.
   */
  const syncWithWorker = async (): Promise<WorkerUser | null> => {
    if (!auth.currentUser) {
      return null
    }

    try {
      workerSyncError.value = null
      const response = await getMe()
      const data: WorkerUser = response?.user || response?.data || response

      workerProfile.value = data

      // Development testing verification (logs only the verified Firebase UID, no tokens/secrets)
      const verifiedUid = data?.id || data?.uid || auth.currentUser.uid
      console.log('[Auth] Cloudflare Worker /api/me verified Firebase UID:', verifiedUid)

      // Sync subscription tier if returned by backend
      if (user.value && data) {
        const tier = (data.subscription_tier || data.subscriptionTier) as 'free' | 'premium' | undefined
        if (tier) {
          user.value.subscriptionTier = tier
        }
        if (data.name && !user.value.name) {
          user.value.name = data.name
        }
      }

      return data
    } catch (err: any) {
      workerSyncError.value = err?.message || 'Failed to sync with API Worker'
      console.warn('[Auth] Worker /api/me sync warning:', workerSyncError.value)
      return null
    }
  }

  const initAuth = (): Promise<UserProfile | null> => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        isLoading.value = true
        await setUserFromFirebase(firebaseUser)

        if (firebaseUser) {
          // Attempt sync with Worker in the background without blocking the UI
          syncWithWorker().catch(() => {})
        }

        isLoading.value = false
        isInitialized.value = true
        resolve(user.value)
      })
    })
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await signOut(auth)
      user.value = null
      workerProfile.value = null
      workerSyncError.value = null
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    workerProfile,
    workerSyncError,
    isLoading,
    isInitialized,
    isAuthenticated,
    isPremium,
    initAuth,
    setUserFromFirebase,
    syncWithWorker,
    logout
  }
})
