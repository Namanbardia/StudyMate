<script setup lang="ts">
import { onMounted } from 'vue'
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
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const currentDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

onMounted(() => {
  // Worker identity sync remains in the auth store and runs during auth initialization.
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
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
          <span>Ask AI Tutor</span>
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
