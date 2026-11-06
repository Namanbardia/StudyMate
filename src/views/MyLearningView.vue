<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Calendar,
  Bookmark,
  TrendingUp,
  Search,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  GraduationCap,
  FileText,
  Target,
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

const router = useRouter()

interface StudyPlan {
  id: string
  title: string
  description: string
  progress: number
  totalDays: number
  currentDay: number
  nextTask: string
  createdAt: number
}

interface LearningGoal {
  id: string
  title: string
  targetDate: number
  progress: number
  milestones: Array<{ title: string; completed: boolean }>
}

interface SavedResource {
  id: string
  title: string
  source: string
  url: string
  savedAt: number
}

// Mock study plans data - in future this would come from API
const studyPlans = ref<StudyPlan[]>([])
const learningGoals = ref<LearningGoal[]>([])
const savedResources = ref<SavedResource[]>([])

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatRelativeTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(timestamp)
}

const navigateToSearch = () => {
  router.push('/search')
}

const navigateToPlanner = () => {
  router.push('/planner')
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <!-- My Learning Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
      <div>
        <div class="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            <Sparkles class="w-3 h-3 mr-1" /> My Learning
          </Badge>
        </div>
        <h1 class="text-2xl sm:text-3xl font-serif font-bold text-text-base mt-1.5">
          Your Learning Journey
        </h1>
        <p class="text-sm text-text-muted mt-0.5">
          Track your study plans, learning goals, and saved resources in one place.
        </p>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm" to="/search">
          <Search class="w-4 h-4 mr-1.5 text-accent" />
          <span>New Search</span>
        </Button>
        <Button variant="primary" size="sm" @click="navigateToPlanner">
          <GraduationCap class="w-4 h-4 mr-1.5" />
          <span>Create Study Plan</span>
        </Button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <GraduationCap class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Active Study Plans</span>
          <p class="text-xl font-bold font-serif text-text-base">{{ studyPlans.length }}</p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
          <Target class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Learning Goals</span>
          <p class="text-xl font-bold font-serif text-text-base">{{ learningGoals.length }}</p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-surface-muted text-text-muted flex items-center justify-center shrink-0">
          <Bookmark class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Saved Resources</span>
          <p class="text-xl font-bold font-serif text-text-base">{{ savedResources.length }}</p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-surface-muted text-text-muted flex items-center justify-center shrink-0">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Total Study Hours</span>
          <p class="text-xl font-bold font-serif text-text-base">0</p>
        </div>
      </Card>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Active Study Plans -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Active Study Plans Section -->
        <Card padding="md">
          <div class="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <GraduationCap class="w-4 h-4" />
              </div>
              <h3 class="text-sm font-semibold text-text-base">Active Study Plans</h3>
            </div>
          </div>

          <div v-if="studyPlans.length === 0" class="text-center py-12">
            <div class="w-16 h-16 rounded-2xl bg-surface-muted border border-border-subtle flex items-center justify-center mx-auto mb-4 text-text-muted">
              <FileText class="w-7 h-7 text-accent" />
            </div>

            <h4 class="text-lg font-bold font-serif text-text-base mb-1">
              No active study plans yet
            </h4>
            <p class="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-6 leading-relaxed">
              Create a personalized study plan from your search results. StudyMate will break down the concepts and generate a realistic day-by-day schedule.
            </p>

            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" size="md" @click="navigateToSearch">
                <Search class="w-4 h-4 mr-2" />
                <span>Search a Topic</span>
              </Button>
              <Button variant="outline" size="md" @click="navigateToPlanner">
                <GraduationCap class="w-4 h-4 mr-2" />
                <span>Create Plan Manually</span>
              </Button>
            </div>
          </div>

          <div v-else class="space-y-3">
            <div v-for="plan in studyPlans" :key="plan.id" class="group p-4 rounded-xl border border-border-subtle hover:bg-surface-muted hover:border-accent/30 transition-all duration-200">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="text-base font-semibold text-text-base truncate">{{ plan.title }}</h4>
                    <Badge variant="accent" size="sm">In Progress</Badge>
                  </div>
                  <p class="text-sm text-text-muted mb-2 line-clamp-1">{{ plan.description }}</p>
                  <div class="flex items-center gap-4 text-xs text-text-muted">
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      Day {{ plan.currentDay }} of {{ plan.totalDays }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Target class="w-3 h-3" />
                      Next: {{ plan.nextTask }}
                    </span>
                  </div>
                  <div class="mt-2 h-2 bg-surface-muted rounded-full overflow-hidden">
                    <div class="h-full bg-accent rounded-full transition-all duration-300" :style="{ width: plan.progress + '%' }"></div>
                  </div>
                  <p class="text-xs text-text-muted mt-1">{{ plan.progress }}% complete</p>
                </div>
                <Button variant="outline" size="sm" class="shrink-0">
                  <ChevronRight class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <!-- Learning Goals Section -->
        <Card padding="md">
          <div class="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <Target class="w-4 h-4" />
              </div>
              <h3 class="text-sm font-semibold text-text-base">Learning Goals</h3>
            </div>
          </div>

          <div v-if="learningGoals.length === 0" class="text-center py-8">
            <Target class="w-12 h-12 mx-auto text-text-muted/30 mb-3" />
            <h4 class="text-base font-semibold text-text-base mb-1">No learning goals yet</h4>
            <p class="text-sm text-text-muted mb-4">Set learning goals to track your progress over time.</p>
            <Button variant="outline" size="sm" @click="navigateToPlanner">
              <GraduationCap class="w-3.5 h-3.5 mr-1.5" />
              <span>Create Goal</span>
            </Button>
          </div>

          <div v-else class="space-y-3">
            <div v-for="goal in learningGoals" :key="goal.id" class="p-4 rounded-xl border border-border-subtle">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <h4 class="text-base font-semibold text-text-base mb-1">{{ goal.title }}</h4>
                  <div class="flex items-center gap-3 text-xs text-text-muted mb-2">
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3 h-3" />
                      Target: {{ formatDate(goal.targetDate) }}
                    </span>
                    <Badge :variant="goal.progress >= 100 ? 'success' : 'muted'" size="sm">
                      {{ goal.progress }}% complete
                    </Badge>
                  </div>
                  <div class="h-2 bg-surface-muted rounded-full overflow-hidden">
                    <div class="h-full bg-success rounded-full transition-all duration-300" :style="{ width: goal.progress + '%' }"></div>
                  </div>
                  <div class="mt-2 space-y-1">
                    <div v-for="(milestone, idx) in goal.milestones" :key="idx" class="flex items-center gap-2 text-xs text-text-muted">
                      <CheckCircle2 :class="milestone.completed ? 'text-success' : 'text-text-muted'" class="w-3.5 h-3.5 shrink-0" />
                      <span :class="milestone.completed ? 'line-through text-text-muted' : 'text-text-base'">{{ milestone.title }}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" class="shrink-0">
                  <ChevronRight class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Right Column: Saved Resources -->
      <div class="space-y-6">
        <Card padding="md">
          <div class="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-surface-muted text-text-muted flex items-center justify-center">
                <Bookmark class="w-4 h-4" />
              </div>
              <h3 class="text-sm font-semibold text-text-base">Saved Resources</h3>
            </div>
          </div>

          <div v-if="savedResources.length === 0" class="text-center py-8">
            <Bookmark class="w-12 h-12 mx-auto text-text-muted/30 mb-3" />
            <h4 class="text-base font-semibold text-text-base mb-1">No saved resources yet</h4>
            <p class="text-sm text-text-muted mb-4">Save interesting videos, articles, and papers from your searches.</p>
            <Button variant="primary" size="sm" @click="navigateToSearch">
              <Search class="w-3.5 h-3.5 mr-1.5" />
              <span>Search & Save</span>
            </Button>
          </div>

          <div v-else class="space-y-2">
            <div v-for="resource in savedResources" :key="resource.id" class="group p-3 rounded-lg border border-border-subtle hover:bg-surface-muted transition-colors">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <FileText class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-text-base truncate">{{ resource.title }}</p>
                  <div class="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                    <Badge variant="muted" size="sm">{{ resource.source }}</Badge>
                    <time :datetime="new Date(resource.savedAt * 1000).toISOString()">
                      {{ formatRelativeTime(resource.savedAt) }}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <!-- Progress Overview -->
        <Card padding="md" class="bg-surface-muted/40">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <TrendingUp class="w-4 h-4" />
            </div>
            <h3 class="text-sm font-semibold text-text-base">Progress Overview</h3>
          </div>
          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-text-muted">This Week</span>
              <span class="font-medium text-text-base">0h 0m</span>
            </div>
            <div class="h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div class="h-full bg-accent/30 rounded-full"></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">This Month</span>
              <span class="font-medium text-text-base">0h 0m</span>
            </div>
            <div class="h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div class="h-full bg-accent/30 rounded-full"></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-text-muted">Current Streak</span>
              <span class="font-medium text-text-base">0 days</span>
            </div>
            <div class="h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div class="h-full bg-success/30 rounded-full"></div>
            </div>
          </div>
          <Button variant="outline" size="sm" full-width class="mt-4">
            <TrendingUp class="w-3.5 h-3.5 mr-1.5" />
            <span>View Detailed Analytics</span>
          </Button>
        </Card>
      </div>
    </div>
  </div>
</template>