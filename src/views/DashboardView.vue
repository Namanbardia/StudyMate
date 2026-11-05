<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Compass,
  Calendar,
  Bookmark,
  TrendingUp,
  Search,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LogOut,
  RefreshCw,
  Server
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const showNotice = ref(true)
const isSyncingWorker = ref(false)
const currentDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

const handleRefreshMe = async () => {
  isSyncingWorker.value = true
  try {
    await authStore.syncWithWorker()
  } finally {
    isSyncingWorker.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated && !authStore.workerProfile) {
    handleRefreshMe()
  }
})

const handleLogout = async () => {
  await authStore.logout()
  await router.push('/')
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <!-- Cloudflare Worker /api/me Integration Status Banner -->
    <div v-if="showNotice" class="p-4 rounded-xl bg-accent/10 border border-accent/25 text-xs text-text-base flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 flex-1">
        <Server class="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-text-base">Cloudflare Worker API Integration:</span>
            <Badge v-if="authStore.workerProfile" variant="success" size="sm">
              <CheckCircle2 class="w-3 h-3 mr-1" />
              Verified /api/me
            </Badge>
            <Badge v-else-if="authStore.workerSyncError" variant="danger" size="sm">
              Sync Notice
            </Badge>
            <Badge v-else variant="muted" size="sm">
              Connecting...
            </Badge>
          </div>

          <p v-if="authStore.workerProfile" class="text-text-muted">
            Verified Firebase UID:
            <code class="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-[11px] text-text-base">
              {{ authStore.workerProfile.id || authStore.workerProfile.uid || authStore.user?.id }}
            </code>
          </p>
          <p v-else-if="authStore.workerSyncError" class="text-text-muted">
            {{ authStore.workerSyncError }}
          </p>
          <p v-else class="text-text-muted">
            Validating Firebase bearer token with backend endpoint (<code class="font-mono text-[11px]">GET /api/me</code>)...
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="handleRefreshMe"
          :disabled="isSyncingWorker"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border-subtle bg-surface text-text-muted hover:text-text-base text-xs transition-colors cursor-pointer disabled:opacity-50"
          title="Test GET /api/me request with Firebase bearer token"
        >
          <RefreshCw class="w-3 h-3" :class="isSyncingWorker ? 'animate-spin' : ''" />
          <span class="hidden sm:inline">Test /api/me</span>
        </button>

        <button
          type="button"
          @click="showNotice = false"
          class="text-text-muted hover:text-text-base text-xs font-semibold cursor-pointer p-1"
          aria-label="Dismiss banner"
        >
          &times;
        </button>
      </div>
    </div>

    <!-- Dashboard Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
      <div>
        <div class="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <Sparkles class="w-3 h-3 mr-1" /> Student Workspace
          </Badge>
          <span class="text-xs text-text-muted font-mono">{{ currentDate }}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-text-base mt-1.5">
          Welcome, {{ authStore.user?.name || 'Student' }}
        </h1>
        <p class="text-sm text-text-muted mt-0.5">
          {{ authStore.user?.email ? authStore.user.email + ' &bull; ' : '' }}Track your daily study milestones and review saved resource packages.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" to="/search">
          <Compass class="w-4 h-4 mr-1.5 text-accent" />
          <span>Search Topics</span>
        </Button>

        <Button variant="ghost" size="sm" @click="handleLogout">
          <LogOut class="w-4 h-4 mr-1.5 text-danger" />
          <span class="text-danger">Log Out</span>
        </Button>
      </div>
    </div>

    <!-- Quick Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Calendar class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Today's Tasks</span>
          <p class="text-xl font-bold font-serif text-text-base">0 pending</p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Study Streak</span>
          <p class="text-xl font-bold font-serif text-text-base">0 days</p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-surface-muted text-text-muted flex items-center justify-center shrink-0">
          <BookOpen class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Active Goals</span>
          <p class="text-xl font-bold font-serif text-text-base">0 active</p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-surface-muted text-text-muted flex items-center justify-center shrink-0">
          <Bookmark class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Saved Packages</span>
          <p class="text-xl font-bold font-serif text-text-base">0 saved</p>
        </div>
      </Card>
    </div>

    <!-- Polished Empty State for Student Dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Activity Area -->
      <div class="lg:col-span-2 space-y-6">
        <Card padding="lg" class="text-center py-12">
          <div class="w-14 h-14 rounded-2xl bg-surface-muted border border-border-subtle flex items-center justify-center mx-auto mb-4 text-text-muted">
            <Search class="w-6 h-6 text-accent" />
          </div>

          <h3 class="text-lg font-bold font-serif text-text-base mb-1">
            No active study plans yet
          </h3>
          <p class="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-6 leading-relaxed">
            Begin by searching for a topic you are currently studying. StudyMate will break down the concepts and generate a realistic day-by-day plan.
          </p>

          <Button variant="primary" size="md" to="/search">
            <span>Start Learning Search</span>
            <ArrowRight class="w-4 h-4 ml-1" />
          </Button>
        </Card>

        <!-- Recent Activity Placeholder -->
        <Card padding="md">
          <div class="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <h4 class="text-sm font-semibold text-text-base">Recent Searches</h4>
            <span class="text-xs text-text-muted">Empty history</span>
          </div>
          <div class="py-6 text-center text-xs text-text-muted">
            Your recent queries will appear here once you explore topics.
          </div>
        </Card>
      </div>

      <!-- Sidebar Tasks / Notes Summary Area -->
      <div class="space-y-6">
        <Card padding="md">
          <div class="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <h4 class="text-sm font-semibold text-text-base">Today's Schedule</h4>
            <Badge variant="muted" size="sm">All clear</Badge>
          </div>
          <div class="p-6 text-center text-xs text-text-muted space-y-2">
            <CheckCircle2 class="w-8 h-8 mx-auto text-success/60" />
            <p class="font-medium text-text-base">No tasks scheduled for today</p>
            <p>Generate a study plan to populate your daily schedule.</p>
          </div>
        </Card>

        <Card padding="md" class="bg-surface-muted/40">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            Pro Feature Preview
          </h4>
          <p class="text-xs text-text-base font-medium mb-1">
            Notes Summarizer &amp; AI Quiz Generator
          </p>
          <p class="text-xs text-text-muted leading-relaxed mb-4">
            Upload PDF lecture notes or textbook chapters to extract key formulas and practice active recall.
          </p>
          <Button variant="outline" size="sm" to="/#pricing" full-width>
            View Pro Plan
          </Button>
        </Card>
      </div>
    </div>
  </div>
</template>
