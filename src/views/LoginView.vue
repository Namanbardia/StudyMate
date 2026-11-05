<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, googleProvider } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// Forgot Password State
const isForgotModalOpen = ref(false)
const resetEmail = ref('')
const resetLoading = ref(false)
const resetMessage = ref('')
const resetError = ref('')

// Format friendly error messages from Firebase error codes
const getFriendlyErrorMessage = (err: any): string => {
  console.error('Firebase Auth Error Details:', err)
  const code = err?.code || ''
  const message = err?.message || ''

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Sign-in method is not enabled in Firebase Console. Please go to Firebase Console > Authentication > Sign-in method, and enable "Email/Password" and "Google".'
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.'
    case 'auth/user-not-found':
      return 'No account exists with this email address.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This user account has been suspended or disabled.'
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again in a few minutes or reset your password.'
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.'
    case 'auth/unauthorized-domain':
      return `This domain (${typeof window !== 'undefined' ? window.location.hostname : 'current domain'}) is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.`
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.'
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.'
    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt was already in progress.'
    case 'auth/api-key-not-valid':
      return 'Firebase API key is invalid. Please check your VITE_FIREBASE_API_KEY in the .env file.'
    default:
      return message ? `${message} (Code: ${code})` : 'Sign-in failed. Please check your details and try again.'
  }
}

// Redirect helper
const navigateAfterLogin = async () => {
  const redirectTarget = (route.query.redirect as string) || '/dashboard'
  await router.push(redirectTarget)
}

// Email & Password Login
const handleEmailLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail) {
    errorMessage.value = 'Please enter your email address.'
    return
  }
  if (!password.value) {
    errorMessage.value = 'Please enter your password.'
    return
  }

  isLoading.value = true

  try {
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password.value)
    await authStore.setUserFromFirebase(userCredential.user)
    await navigateAfterLogin()
  } catch (err: any) {
    errorMessage.value = getFriendlyErrorMessage(err)
  } finally {
    isLoading.value = false
  }
}

// Google Authentication
const handleGoogleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    await authStore.setUserFromFirebase(userCredential.user)
    await navigateAfterLogin()
  } catch (err: any) {
    errorMessage.value = getFriendlyErrorMessage(err)
  } finally {
    isLoading.value = false
  }
}

// Open Forgot Password Modal
const openForgotPassword = () => {
  resetEmail.value = email.value.trim()
  resetMessage.value = ''
  resetError.value = ''
  isForgotModalOpen.value = true
}

// Send Password Reset
const handlePasswordReset = async () => {
  resetError.value = ''
  resetMessage.value = ''

  const targetEmail = resetEmail.value.trim()
  if (!targetEmail) {
    resetError.value = 'Please enter your account email address.'
    return
  }

  resetLoading.value = true

  try {
    await sendPasswordResetEmail(auth, targetEmail)
    // Section 4 requirement: Generic confirmation message that avoids exposing whether an account exists
    resetMessage.value = 'If an account matches this email, a password reset link has been dispatched. Please check your inbox and spam folder.'
  } catch (err: any) {
    if (err.code === 'auth/invalid-email') {
      resetError.value = 'Please enter a valid email address.'
    } else {
      resetError.value = 'Unable to send reset email at this moment. Please try again later.'
    }
  } finally {
    resetLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-6">

      <!-- Login Card -->
      <Card padding="lg" class="shadow-md">

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-fg mb-3 shadow-xs">
            <Sparkles class="w-5 h-5 text-accent" />
          </div>

          <h2 class="text-2xl font-serif font-bold text-text-base">
            Welcome back
          </h2>

          <p class="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            Sign in to access your study plans, bookmarks, and progress
          </p>
        </div>

        <!-- Global Error Alert -->
        <div
          v-if="errorMessage"
          class="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span class="leading-relaxed">{{ errorMessage }}</span>
        </div>

        <!-- Global Success Alert -->
        <div
          v-if="successMessage"
          class="mb-5 p-3.5 rounded-xl bg-success/10 border border-success/25 text-success text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
        >
          <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
          <span class="leading-relaxed">{{ successMessage }}</span>
        </div>

        <!-- Google Login Button -->
        <button
          type="button"
          @click="handleGoogleLogin"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-border-subtle hover:bg-surface-muted hover:border-border-hover text-xs sm:text-sm font-medium text-text-base transition-all duration-200 cursor-pointer mb-5 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>

          <span>
            {{ isLoading ? 'Connecting to Google...' : 'Continue with Google' }}
          </span>
        </button>

        <!-- Divider -->
        <div class="relative flex items-center justify-center my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-subtle" />
          </div>

          <div class="relative bg-surface px-3 text-xs text-text-muted uppercase tracking-wider font-mono">
            or with email
          </div>
        </div>

        <!-- Email & Password Form -->
        <form @submit.prevent="handleEmailLogin" class="space-y-4">

          <Input
            id="email"
            v-model="email"
            label="Email address"
            type="email"
            placeholder="student@university.edu"
            :disabled="isLoading"
            required
          >
            <template #leading>
              <Mail class="w-4 h-4 text-text-muted" />
            </template>
          </Input>

          <Input
            id="password"
            v-model="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            :disabled="isLoading"
            required
          >
            <template #leading>
              <Lock class="w-4 h-4 text-text-muted" />
            </template>

            <template #label-right>
              <button
                type="button"
                @click="openForgotPassword"
                class="text-xs text-accent hover:underline font-normal cursor-pointer focus:outline-none"
              >
                Forgot password?
              </button>
            </template>
          </Input>

          <Button
            type="submit"
            variant="primary"
            full-width
            size="lg"
            :disabled="isLoading"
            :loading="isLoading"
            class="mt-2"
          >
            <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4 ml-1" />
          </Button>

        </form>

        <!-- Footer Link -->
        <p class="text-center text-xs text-text-muted mt-6">
          Don't have an account yet?

          <RouterLink
            to="/signup"
            class="font-semibold text-text-base hover:text-accent underline underline-offset-4 ml-1"
          >
            Sign up free
          </RouterLink>
        </p>

      </Card>
    </div>

    <!-- Forgot Password Modal -->
    <Modal
      :open="isForgotModalOpen"
      title="Reset Password"
      description="Enter your account email to receive instructions to reset your password."
      max-width="md"
      @close="isForgotModalOpen = false"
    >
      <div class="space-y-4">
        <!-- Error in Modal -->
        <div
          v-if="resetError"
          class="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs flex items-start gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ resetError }}</span>
        </div>

        <!-- Success in Modal -->
        <div
          v-if="resetMessage"
          class="p-3.5 rounded-xl bg-success/10 border border-success/25 text-success text-xs flex items-start gap-2 leading-relaxed"
        >
          <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ resetMessage }}</span>
        </div>

        <div v-if="!resetMessage">
          <Input
            id="reset-email"
            v-model="resetEmail"
            label="Email address"
            type="email"
            placeholder="student@university.edu"
            :disabled="resetLoading"
            required
          >
            <template #leading>
              <Mail class="w-4 h-4 text-text-muted" />
            </template>
          </Input>
        </div>
      </div>

      <template #footer>
        <Button
          variant="ghost"
          size="sm"
          @click="isForgotModalOpen = false"
        >
          {{ resetMessage ? 'Close' : 'Cancel' }}
        </Button>

        <Button
          v-if="!resetMessage"
          variant="primary"
          size="sm"
          :disabled="resetLoading"
          :loading="resetLoading"
          @click="handlePasswordReset"
        >
          <span>Send Reset Link</span>
        </Button>
      </template>
    </Modal>
  </div>
</template>
