<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, Bot, GraduationCap, CalendarDays, Library, ChartNoAxesCombined,
  UserRound, Settings, LogOut, PanelLeftClose, PanelLeftOpen, X
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const uiStore = useUIStore()
const authStore = useAuthStore()
const isCollapsed = computed(() => uiStore.sidebarCollapsed)
const displayName = computed(() => authStore.user?.name || authStore.user?.email?.split('@')[0] || 'Student')
const initials = computed(() => displayName.value.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase())

// Initialize sidebar state from localStorage on mount
onMounted(() => {
  uiStore.initSidebarFromStorage()
})

const mainItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, implemented: true },
  { label: 'AI Tutor', to: '/search', icon: Bot, implemented: true },
  { label: 'My Learning', to: '/learning', icon: GraduationCap, implemented: false },
  { label: 'Study Planner', to: '/planner', icon: CalendarDays, implemented: false },
  { label: 'My Resources', to: '/resources', icon: Library, implemented: false },
  { label: 'Progress & Analytics', to: '/progress', icon: ChartNoAxesCombined, implemented: false }
]
const personalItems = [
  { label: 'My Profile', to: '/profile', icon: UserRound, implemented: true },
  { label: 'Settings', to: '/settings', icon: Settings, implemented: true }
]

const isActive = (to: string) => route.path === to || (to === '/search' && route.path.startsWith('/search/'))
const handleNavClick = () => uiStore.closeMobileSidebar()

const handleLogout = async () => {
  uiStore.closeMobileSidebar()
  await authStore.logout()
  await router.push('/')
}
</script>

<template>
  <template v-if="authStore.isAuthenticated">
    <!-- Mobile overlay -->
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="uiStore.sidebarMobileOpen" class="fixed inset-0 bg-black/60 z-40 md:hidden" @click="uiStore.closeMobileSidebar" aria-hidden="true" />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed z-50 md:z-30 left-0 top-0 bottom-0 md:top-16 sm:md:top-20 h-screen md:h-[calc(100vh-4rem)] sm:md:h-[calc(100vh-5rem)] bg-surface border-r border-border-subtle flex flex-col transition-all duration-300 ease-in-out overflow-hidden"
      :class="[uiStore.sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0', isCollapsed ? 'w-[80px]' : 'w-[280px]']"
      aria-label="Sidebar navigation"
    >
      <!-- Header: Navigation label + Collapse toggle -->
      <div class="h-14 px-3 flex items-center justify-between border-b border-border-subtle/80 shrink-0">
        <span v-if="!isCollapsed" class="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Navigation</span>
        <button
          type="button"
          @click="uiStore.toggleSidebarCollapse"
          class="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-muted transition-colors"
          :class="isCollapsed ? 'mx-auto' : ''"
          :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <PanelLeftOpen v-if="isCollapsed" class="w-4 h-4 text-accent" />
          <PanelLeftClose v-else class="w-4 h-4" />
        </button>
        <span v-if="isCollapsed" class="md:hidden w-1" />
        <button
          type="button"
          @click="uiStore.closeMobileSidebar"
          class="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-muted"
          aria-label="Close navigation drawer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-2" aria-label="Main navigation">
        <template v-for="(section, sectionIndex) in [{ label: 'Main Menu', items: mainItems }, { label: 'Personal', items: personalItems }]" :key="section.label">
          <p v-if="!isCollapsed" class="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted/75">{{ section.label }}</p>
          <div v-else-if="sectionIndex > 0" class="my-3 mx-2 border-t border-border-subtle" />
          <div class="space-y-1">
            <template v-for="item in section.items" :key="item.to">
              <!-- Implemented navigation item -->
              <RouterLink
                v-if="item.implemented"
                :to="item.to"
                :aria-current="isActive(item.to) ? 'page' : undefined"
                :aria-label="isCollapsed ? item.label : undefined"
                class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-all duration-200"
                :class="isActive(item.to) ? 'bg-accent/15 text-accent font-medium border-accent/20' : 'text-text-muted border-transparent hover:text-text-base hover:bg-surface-muted'"
                @click="handleNavClick"
              >
                <!-- Icon - centered in collapsed mode -->
                <div class="flex items-center justify-center w-8 h-8 shrink-0" :class="isCollapsed ? 'mx-auto' : ''">
                  <component :is="item.icon" class="w-4 h-4" :class="isActive(item.to) ? 'text-accent' : 'text-text-muted group-hover:text-text-base'" />
                </div>

                <!-- Label - hidden in collapsed mode -->
                <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>

                <!-- Tooltip for collapsed mode -->
                <div
                  v-if="isCollapsed"
                  class="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-2.5 py-1 text-xs font-medium text-primary-fg bg-primary rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  role="tooltip"
                >
                  {{ item.label }}
                </div>
              </RouterLink>

              <!-- Not yet implemented navigation item -->
              <div
                v-else
                class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted/60 border border-transparent cursor-not-allowed"
                :title="isCollapsed ? `${item.label} — coming soon` : undefined"
                :aria-label="`${item.label}, coming soon`"
              >
                <div class="flex items-center justify-center w-8 h-8 shrink-0" :class="isCollapsed ? 'mx-auto' : ''">
                  <component :is="item.icon" class="w-4 h-4" />
                </div>
                <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
                <div
                  v-if="isCollapsed"
                  class="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-2.5 py-1 text-xs font-medium text-primary-fg bg-primary rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  role="tooltip"
                >
                  {{ item.label }} · Coming soon
                </div>
              </div>
            </template>
          </div>
        </template>
      </nav>

      <!-- Profile & Logout at bottom -->
      <div class="p-2 border-t border-border-subtle/80 shrink-0">
        <div class="flex items-center gap-2.5 rounded-xl px-2 py-2" :class="isCollapsed ? 'justify-center' : ''" :title="isCollapsed ? `${displayName} · ${authStore.user?.email || ''}` : undefined">
          <img
            v-if="authStore.user?.avatarUrl"
            :src="authStore.user.avatarUrl"
            :alt="`${displayName} avatar`"
            class="w-9 h-9 rounded-full object-cover shrink-0 border border-border-subtle"
          />
          <div
            v-else
            class="w-9 h-9 rounded-full shrink-0 border border-accent/25 bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold"
          >
            {{ initials }}
          </div>
          <div v-if="!isCollapsed" class="min-w-0 flex-1">
            <p class="text-xs font-medium text-text-base truncate">{{ displayName }}</p>
            <p class="text-[11px] text-text-muted truncate">{{ authStore.user?.email }}</p>
          </div>
          <button
            type="button"
            @click="handleLogout"
            :aria-label="isCollapsed ? 'Sign out' : 'Sign out'"
            title="Sign out"
            class="group relative p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
          >
            <LogOut class="w-4 h-4" />
            <span
              v-if="isCollapsed"
              class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-2.5 py-1 text-xs font-medium text-white bg-danger rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              Sign out
            </span>
          </button>
        </div>
      </div>
    </aside>
  </template>
</template>

<style scoped>
/* Smooth width transition for the sidebar itself */
aside {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Ensure no horizontal overflow in collapsed mode */
nav {
  overflow-x: hidden;
}

/* Smooth transitions for section headings */
nav p {
  transition: opacity 0.2s ease-in-out, height 0.2s ease-in-out, margin 0.2s ease-in-out, padding 0.2s ease-in-out;
}

/* Smooth transitions for nav item labels */
nav .group span {
  transition: opacity 0.2s ease-in-out, width 0.2s ease-in-out;
}

/* Smooth transitions for user info */
aside .border-t .flex-1 {
  transition: opacity 0.2s ease-in-out, width 0.2s ease-in-out;
}

/* Tooltip animations */
.group:hover .absolute {
  animation: tooltipFadeIn 0.2s ease-out forwards;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

/* Hide scrollbar but keep scrolling */
nav::-webkit-scrollbar {
  width: 4px;
}
nav::-webkit-scrollbar-track {
  background: transparent;
}
nav::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}
nav::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
</style>