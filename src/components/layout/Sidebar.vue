<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Calendar,
  Bookmark,
  TrendingUp,
  User,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const uiStore = useUIStore()
const authStore = useAuthStore()

interface NavItem {
  label: string
  to: string
  icon: any
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Search', to: '/search', icon: Search },
  { label: 'My Learning', to: '/learning', icon: BookOpen },
  { label: 'Study Planner', to: '/planner', icon: Calendar },
  { label: 'My Resources', to: '/resources', icon: Bookmark },
  { label: 'Progress', to: '/progress', icon: TrendingUp },
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Settings', to: '/settings', icon: Settings }
]

const isCollapsed = computed(() => uiStore.sidebarCollapsed)

const handleNavClick = () => {
  uiStore.closeMobileSidebar()
}

const handleLogout = async () => {
  uiStore.closeMobileSidebar()
  await authStore.logout()
  await router.push('/')
}
</script>

<template>
  <!-- Render sidebar only when user is authenticated -->
  <template v-if="authStore.isAuthenticated">
    <!-- Mobile Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.sidebarMobileOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        @click="uiStore.closeMobileSidebar"
        aria-hidden="true"
      />
    </Transition>

    <!-- Sidebar Aside -->
    <!-- 
      Dimensions:
      Expanded: 260px (w-[260px])
      Collapsed: 68px (w-[68px])
      Top aligned with bottom edge of navbar (top-16 sm:top-20)
      Height extends to bottom of viewport (calc(100vh - 4rem) / calc(100vh - 5rem))
    -->
    <aside
      class="fixed z-50 md:z-30 left-0 bg-surface border-r border-border-subtle flex flex-col justify-between transition-all duration-300 ease-in-out top-0 bottom-0 md:top-16 sm:md:top-20 h-screen md:h-[calc(100vh-4rem)] sm:md:h-[calc(100vh-5rem)]"
      :class="[
        // Mobile visibility
        uiStore.sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        // Desktop width
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      ]"
    >
      <!-- Top header with Section Title & Sidebar Expand/Collapse Toggle Button -->
      <div>
        <div class="h-14 px-3 flex items-center justify-between border-b border-border-subtle/80">
          <!-- Workspace Title (only shown in expanded mode) -->
          <div v-if="!isCollapsed" class="flex items-center gap-2 overflow-hidden px-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-text-muted truncate">
              Navigation
            </span>
          </div>

          <!-- Desktop Expand/Collapse Toggle Button -->
          <button
            type="button"
            @click="uiStore.toggleSidebarCollapse"
            class="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-muted transition-colors cursor-pointer border border-transparent hover:border-border-subtle"
            :class="isCollapsed ? 'mx-auto' : ''"
            :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <PanelLeftOpen v-if="isCollapsed" class="w-4 h-4 text-accent" />
            <PanelLeftClose v-else class="w-4 h-4" />
          </button>

          <!-- Mobile Close Button (shown on mobile drawer top right) -->
          <button
            type="button"
            @click="uiStore.closeMobileSidebar"
            class="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-muted transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Navigation Links -->
        <nav class="p-2 space-y-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to"
            class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer"
            :class="[
              route.path === item.to
                ? 'bg-accent/15 text-accent font-medium border border-accent/20'
                : 'text-text-muted hover:text-text-base hover:bg-surface-muted'
            ]"
            @click="handleNavClick"
          >
            <!-- Icon -->
            <component
              :is="item.icon"
              class="w-4 h-4 shrink-0 transition-colors"
              :class="route.path === item.to ? 'text-accent' : 'text-text-muted group-hover:text-text-base'"
            />

            <!-- Label in expanded mode -->
            <span
              v-if="!isCollapsed"
              class="truncate text-sm"
            >
              {{ item.label }}
            </span>

            <!-- Tooltip in collapsed mode -->
            <div
              v-if="isCollapsed"
              class="hidden md:block pointer-events-none fixed left-[76px] z-50 px-2.5 py-1 text-xs font-medium text-primary-fg bg-primary rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap"
            >
              {{ item.label }}
            </div>
          </RouterLink>
        </nav>
      </div>

      <!-- Bottom User Section / Sign Out -->
      <div class="p-2 border-t border-border-subtle/80">
        <!-- User info card (Expanded mode only) -->
        <div v-if="!isCollapsed" class="px-2.5 py-2 mb-1.5 rounded-lg bg-surface-muted/50 border border-border-subtle/40">
          <p class="text-xs font-medium text-text-base truncate">
            {{ authStore.user?.name || 'Student' }}
          </p>
          <p class="text-[11px] text-text-muted truncate">
            {{ authStore.user?.email || 'Authenticated' }}
          </p>
        </div>

        <!-- Sign Out Button -->
        <button
          type="button"
          @click="handleLogout"
          class="group relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          :title="isCollapsed ? 'Sign Out' : undefined"
        >
          <LogOut class="w-4 h-4 shrink-0 text-danger" />
          <span v-if="!isCollapsed" class="truncate text-xs font-medium">
            Sign Out
          </span>

          <!-- Tooltip in collapsed mode -->
          <div
            v-if="isCollapsed"
            class="hidden md:block pointer-events-none fixed left-[76px] z-50 px-2.5 py-1 text-xs font-medium text-white bg-danger rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap"
          >
            Sign Out
          </div>
        </button>
      </div>
    </aside>
  </template>
</template>

<style scoped>
/* Scoped transitions are managed cleanly via Tailwind classes */
</style>
