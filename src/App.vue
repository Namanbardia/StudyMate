<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import Navbar from '@/components/layout/Navbar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Footer from '@/components/layout/Footer.vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

// Initialize and bind theme watcher
useTheme()

const authStore = useAuthStore()
const uiStore = useUIStore()
const route = useRoute()

// Determine if we should show the full authenticated shell with responsive sidebar padding
const isAuthenticatedView = computed(() => {
  return authStore.isAuthenticated && route.path !== '/' && route.path !== '/login' && route.path !== '/signup'
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg-base text-text-base antialiased transition-colors duration-200">
    <!-- Top Navbar -->
    <Navbar />

    <!-- Authenticated Left Sidebar -->
    <Sidebar />

    <!-- Main Content Area with dynamic margin when sidebar is present -->
    <div
      class="flex-1 w-full transition-all duration-300 ease-in-out"
      :class="[
        isAuthenticatedView
          ? (uiStore.sidebarCollapsed ? 'md:pl-[80px]' : 'md:pl-[280px]')
          : ''
      ]"
    >
      <RouterView />
    </div>

    <!-- Footer: Hidden on inner authenticated workspace pages for clean dashboard height, shown on public views -->
    <Footer v-if="!isAuthenticatedView" />
  </div>
</template>
