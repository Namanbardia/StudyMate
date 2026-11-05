<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Menu,
  Sparkles,
  ArrowRight,
  Search
} from 'lucide-vue-next'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import Button from '@/components/ui/Button.vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

const publicNavLinks = [
  { label: 'Home', href: '/', sectionId: '' },
  { label: 'Features', href: '/#features', sectionId: 'features' },
  { label: 'How It Works', href: '/#how-it-works', sectionId: 'how-it-works' },
  { label: 'Pricing', href: '/#pricing', sectionId: 'pricing' }
]

const handleNavClick = (link: typeof publicNavLinks[0]) => {
  uiStore.closeMobileSidebar()
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

</script>

<template>
  <header class="sticky top-0 z-40 w-full backdrop-blur-md bg-bg-base/90 border-b border-border-subtle/80 transition-colors h-16 sm:h-20">
    <div class="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
      <!-- Left side: Mobile Toggle & Brand Logo -->
      <div class="flex items-center gap-3">
        <!-- Mobile Sidebar Toggle (visible only when authenticated) -->
        <button
          v-if="authStore.isAuthenticated"
          type="button"
          @click="uiStore.toggleMobileSidebar"
          class="md:hidden p-2 rounded-xl text-text-base hover:bg-surface-muted transition-colors cursor-pointer border border-border-subtle"
          aria-label="Toggle navigation drawer"
        >
          <Menu class="w-5 h-5 text-text-base" />
        </button>

        <!-- Brand Logo -->
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
      </div>

      <!-- Center: Public Navigation links (HIDDEN when user is logged in) -->
      <nav v-if="!authStore.isAuthenticated" class="hidden md:flex items-center gap-1 lg:gap-2">
        <a
          v-for="link in publicNavLinks"
          :key="link.label"
          :href="link.href"
          @click.prevent="handleNavClick(link)"
          class="px-3.5 py-1.5 rounded-lg text-sm font-medium text-text-muted hover:text-text-base hover:bg-surface-muted transition-colors cursor-pointer"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        <div class="h-4 w-px bg-border-subtle mx-1 hidden sm:block" />

        <!-- Authenticated Topbar Controls -->
        <template v-if="authStore.isAuthenticated">
          <!-- Prominent New Search Action -->
          <Button
            variant="outline"
            size="sm"
            to="/search"
            class="inline-flex"
          >
            <Search class="w-3.5 h-3.5 mr-1.5 text-accent" />
            <span>New Search</span>
          </Button>

        </template>

        <!-- Unauthenticated Public CTA Controls -->
        <template v-else>
          <div class="hidden md:flex items-center gap-2">
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
          </div>

          <!-- Mobile Hamburger for unauthenticated visitors -->
          <div class="md:hidden">
            <Button
              variant="primary"
              size="sm"
              to="/login"
            >
              Log in
            </Button>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>
