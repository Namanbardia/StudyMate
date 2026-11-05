<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Menu, X, Sparkles, ArrowRight, LayoutDashboard, LogOut } from 'lucide-vue-next'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import Button from '@/components/ui/Button.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const navLinks = [
  { label: 'Home', href: '/', sectionId: '' },
  { label: 'Features', href: '/#features', sectionId: 'features' },
  { label: 'How It Works', href: '/#how-it-works', sectionId: 'how-it-works' },
  { label: 'Pricing', href: '/#pricing', sectionId: 'pricing' }
]

const handleNavClick = (link: typeof navLinks[0]) => {
  isMobileMenuOpen.value = false
  if (link.sectionId) {
    if (route.path === '/') {
      const el = document.getElementById(link.sectionId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      router.push({ path: '/', hash: `#${link.sectionId}` })
    }
  } else {
    if (route.path === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/')
    }
  }
}

const handleLogout = async () => {
  isMobileMenuOpen.value = false
  await authStore.logout()
  await router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-bg-base/90 border-b border-border-subtle/80 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
      <!-- Logo -->
      <RouterLink
        to="/"
        class="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
      >
        <div class="w-8 h-8 rounded-xl bg-primary text-primary-fg flex items-center justify-center font-bold text-sm tracking-tight transition-transform group-hover:scale-105 shadow-xs">
          <Sparkles class="w-4 h-4 text-accent" />
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-base sm:text-lg tracking-tight text-text-base flex items-center gap-1.5">
            StudyMate
            <span class="text-xs px-1.5 py-0.2 font-mono font-medium rounded-md bg-accent/15 text-accent border border-accent/25">AI</span>
          </span>
        </div>
      </RouterLink>

      <!-- Desktop Navigation links -->
      <nav class="hidden md:flex items-center gap-1 lg:gap-2">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          @click.prevent="handleNavClick(link)"
          class="px-3.5 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-base hover:bg-surface-muted transition-colors cursor-pointer"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Actions (Desktop) -->
      <div class="hidden md:flex items-center gap-3">
        <ThemeToggle />

        <div class="h-4 w-px bg-border-subtle mx-1" />

        <template v-if="authStore.isAuthenticated">
          <Button
            variant="ghost"
            size="sm"
            to="/dashboard"
          >
            <LayoutDashboard class="w-3.5 h-3.5 mr-1" />
            <span>Dashboard</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            @click="handleLogout"
          >
            <LogOut class="w-3.5 h-3.5 mr-1 text-text-muted" />
            <span>Sign Out</span>
          </Button>
        </template>

        <template v-else>
          <Button
            variant="ghost"
            size="sm"
            to="/login"
          >
            Log in
          </Button>

          <Button
            variant="primary"
            size="sm"
            to="/signup"
          >
            <span>Get Started</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </Button>
        </template>
      </div>

      <!-- Mobile Menu Button & Theme Toggle -->
      <div class="flex items-center gap-2 md:hidden">
        <ThemeToggle />

        <button
          type="button"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="p-2 rounded-xl text-text-base hover:bg-surface-muted transition-colors cursor-pointer border border-border-subtle"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <Menu v-if="!isMobileMenuOpen" class="w-5 h-5" />
          <X v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation Drawer -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden border-b border-border-subtle bg-surface px-4 pt-3 pb-6 space-y-4 shadow-lg"
      >
        <div class="flex flex-col space-y-1">
          <a
            v-for="link in navLinks"
            :key="link.label"
            :href="link.href"
            @click.prevent="handleNavClick(link)"
            class="px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-base hover:bg-surface-muted transition-colors"
          >
            {{ link.label }}
          </a>
        </div>

        <div class="pt-3 border-t border-border-subtle flex flex-col gap-2.5">
          <template v-if="authStore.isAuthenticated">
            <Button
              variant="outline"
              full-width
              to="/dashboard"
              @click="isMobileMenuOpen = false"
            >
              <LayoutDashboard class="w-4 h-4 mr-1.5" />
              <span>Dashboard ({{ authStore.user?.name || 'Account' }})</span>
            </Button>
            <Button
              variant="ghost"
              full-width
              @click="handleLogout"
            >
              <LogOut class="w-4 h-4 mr-1.5 text-danger" />
              <span class="text-danger">Sign Out</span>
            </Button>
          </template>

          <template v-else>
            <Button
              variant="outline"
              full-width
              to="/login"
              @click="isMobileMenuOpen = false"
            >
              Log in
            </Button>
            <Button
              variant="primary"
              full-width
              to="/signup"
              @click="isMobileMenuOpen = false"
            >
              <span>Get Started Free</span>
              <ArrowRight class="w-4 h-4 ml-1" />
            </Button>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>
