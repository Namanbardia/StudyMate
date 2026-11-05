<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  AlertCircle
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const selectedPlan = ref<'free' | 'premium'>('free')
const agreedTerms = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

onMounted(() => {
  if (route.query.plan === 'premium') {
    selectedPlan.value = 'premium'
  }
})

const getFriendlyErrorMessage = (err: any): string => {
  console.error('Firebase Auth Signup Error:', err)
  const code = err?.code || ''
  const message = err?.message || ''

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Account creation is disabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method, and enable "Email/Password" and "Google".'
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.'
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/unauthorized-domain':
      return `This domain (${typeof window !== 'undefined' ? window.location.hostname : 'current domain'}) is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.`
    case 'auth/popup-closed-by-user':
      return 'Google sign-up was closed before completion.'
    case 'auth/popup-blocked':
      return 'Sign-up popup was blocked by your browser. Please allow popups for this site.'
    case 'auth/cancelled-popup-request':
      return 'Another sign-up attempt was already in progress.'
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.'
    case 'auth/api-key-not-valid':
      return 'Firebase API key is invalid. Please check your VITE_FIREBASE_API_KEY in the .env file.'
    default:
      return message ? `${message} (Code: ${code})` : 'Account creation failed. Please check your details and try again.'
  }
}

const navigateAfterSignup = async () => {
  await router.push('/dashboard')
}

// Email & Password Signup
const handleSignup = async () => {
  errorMessage.value = ''

  const trimmedName = name.value.trim()
  const trimmedEmail = email.value.trim()

  if (!trimmedName) {
    errorMessage.value = 'Please enter your name.'
    return
  }
  if (!trimmedEmail) {
    errorMessage.value = 'Please enter your email address.'
    return
  }
  if (!password.value || password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long.'
    return
  }
  if (!agreedTerms.value) {
    errorMessage.value = 'Please accept the Terms of Service and Privacy Policy to create your account.'
    return
  }

  isLoading.value = true

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password.value)

    if (trimmedName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: trimmedName
      })
    }

    await authStore.setUserFromFirebase(userCredential.user)
    // Verify token with Cloudflare Worker (/api/me)
    await authStore.syncWithWorker().catch((e) => console.warn('Worker sync on signup:', e))
    await navigateAfterSignup()
  } catch (err: any) {
    errorMessage.value = getFriendlyErrorMessage(err)
  } finally {
    isLoading.value = false
  }
}

// Google Signup
const handleGoogleSignup = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const userCredential = await signInWithPopup(auth, googleProvider)
    await authStore.setUserFromFirebase(userCredential.user)
    // Verify token with Cloudflare Worker (/api/me)
    await authStore.syncWithWorker().catch((e) => console.warn('Worker sync on Google signup:', e))
    await navigateAfterSignup()
  } catch (err: any) {
    errorMessage.value = getFriendlyErrorMessage(err)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-lg space-y-6">

      <!-- Main Signup Card -->
      <Card padding="lg" class="shadow-md">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-fg mb-3 shadow-xs">
            <Sparkles class="w-5 h-5 text-accent" />
          </div>
          <h2 class="text-2xl font-serif font-bold text-text-base">
            Start your learning journey
          </h2>
          <p class="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            Join StudyMate AI to discover curated resources and build effective study plans
          </p>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span class="leading-relaxed">{{ errorMessage }}</span>
        </div>

        <!-- Plan selection pill toggle -->
        <div class="mb-6 p-1.5 rounded-xl bg-surface-muted border border-border-subtle grid grid-cols-2 gap-1 text-xs">
          <button
            type="button"
            @click="selectedPlan = 'free'"
            class="py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer flex flex-col items-center justify-center"
            :class="selectedPlan === 'free' ? 'bg-surface text-text-base shadow-xs font-semibold' : 'text-text-muted hover:text-text-base'"
          >
            <span>Free Starter</span>
            <span class="text-[10px] text-text-muted">₹0 / forever</span>
          </button>

          <button
            type="button"
            @click="selectedPlan = 'premium'"
            class="py-2 px-3 rounded-lg font-medium transition-colors cursor-pointer flex flex-col items-center justify-center"
            :class="selectedPlan === 'premium' ? 'bg-surface text-text-base shadow-xs font-semibold' : 'text-text-muted hover:text-text-base'"
          >
            <div class="flex items-center gap-1">
              <span>Student Pro</span>
              <span class="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
            <span class="text-[10px] text-accent">₹79 / mo (Proposed)</span>
          </button>
        </div>

        <!-- Google OAuth Button -->
        <button
          type="button"
          @click="handleGoogleSignup"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-border-subtle hover:bg-surface-muted hover:border-border-hover text-xs sm:text-sm font-medium text-text-base transition-all duration-200 cursor-pointer mb-5 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{{ isLoading ? 'Connecting to Google...' : 'Sign up with Google' }}</span>
        </button>

        <div class="relative flex items-center justify-center my-5">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-subtle" />
          </div>
          <div class="relative bg-surface px-3 text-xs text-text-muted uppercase tracking-wider font-mono">
            or with email
          </div>
        </div>

        <!-- Form Fields -->
        <form @submit.prevent="handleSignup" class="space-y-4">
          <Input
            id="name"
            v-model="name"
            label="Full name"
            placeholder="Ada Lovelace"
            :disabled="isLoading"
            required
          >
            <template #leading>
              <User class="w-4 h-4 text-text-muted" />
            </template>
          </Input>

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
            placeholder="At least 6 characters"
            :disabled="isLoading"
            required
          >
            <template #leading>
              <Lock class="w-4 h-4 text-text-muted" />
            </template>
          </Input>

          <!-- Checkbox for Terms -->
          <div class="flex items-start gap-2.5 pt-1">
            <input
              id="terms"
              v-model="agreedTerms"
              type="checkbox"
              required
              class="mt-1 rounded border-border-subtle text-accent focus:ring-accent cursor-pointer"
            />
            <label for="terms" class="text-xs text-text-muted leading-relaxed select-none cursor-pointer">
              I agree to the
              <RouterLink to="/terms" class="text-text-base hover:text-accent underline underline-offset-2">Terms of Service</RouterLink>
              and
              <RouterLink to="/privacy" class="text-text-base hover:text-accent underline underline-offset-2">Privacy Policy</RouterLink>.
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            full-width
            size="lg"
            :disabled="isLoading"
            :loading="isLoading"
            class="mt-3"
          >
            <span>{{ isLoading ? 'Creating Account...' : 'Create Free Account' }}</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4 ml-1" />
          </Button>
        </form>

        <p class="text-center text-xs text-text-muted mt-6">
          Already have an account?
          <RouterLink to="/login" class="font-semibold text-text-base hover:text-accent underline underline-offset-4 ml-1">
            Sign in
          </RouterLink>
        </p>
      </Card>
    </div>
  </div>
</template>
