import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth'
import { auth } from '@/firebase/config'

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
  const isLoading = ref(true)
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isPremium = computed(() => user.value?.subscriptionTier === 'premium')

  const setUserFromFirebase = async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken()
        token.value = idToken
      } catch (err) {
        console.warn('Failed to retrieve Firebase ID token:', err)
        token.value = null
      }

      user.value = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
        email: firebaseUser.email || '',
        avatarUrl: firebaseUser.photoURL || undefined,
        subscriptionTier: 'free'
      }
    } else {
      user.value = null
      token.value = null
    }
  }

  const initAuth = (): Promise<UserProfile | null> => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        isLoading.value = true
        await setUserFromFirebase(firebaseUser)
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
      token.value = null
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    token,
    isLoading,
    isInitialized,
    isAuthenticated,
    isPremium,
    initAuth,
    setUserFromFirebase,
    logout
  }
})
