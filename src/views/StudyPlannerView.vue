<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  BookOpen,
  Plus,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  ChevronRight,
  Sparkles,
  Clock,
  ExternalLink,
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Modal from '@/components/ui/Modal.vue'
import { useAuthStore } from '@/stores/auth'
import { getStudyPlans, deleteStudyPlan, type StudyPlan } from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()

const studyPlans = ref<StudyPlan[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Delete confirmation modal state
const deleteModalOpen = ref(false)
const deleteTargetPlan = ref<StudyPlan | null>(null)
const isDeleting = ref(false)

const loadStudyPlans = async () => {
  if (!authStore.isAuthenticated) return
  isLoading.value = true
  error.value = null
  try {
    const response = await getStudyPlans()
    studyPlans.value = response.plans || []
  } catch (err) {
    console.warn('[StudyPlanner] Failed to load plans:', err)
    error.value = 'Failed to load study plans'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadStudyPlans()
})

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getKnowledgeLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  }
  return labels[level] || level
}

const getKnowledgeLevelColor = (level: string): 'success' | 'accent' | 'danger' | 'muted' => {
  const colors: Record<string, 'success' | 'accent' | 'danger' | 'muted'> = {
    beginner: 'success',
    intermediate: 'accent',
    advanced: 'danger'
  }
  return colors[level] || 'muted'
}

const navigateToCreatePlan = () => {
  router.push('/planner/create')
}

const navigateToPlan = (plan: StudyPlan) => {
  router.push(`/planner/${plan.id}`)
}

const openDeleteModal = (plan: StudyPlan) => {
  deleteTargetPlan.value = plan
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!deleteTargetPlan.value || isDeleting.value) return
  isDeleting.value = true
  try {
    await deleteStudyPlan(deleteTargetPlan.value.id)
    studyPlans.value = studyPlans.value.filter(p => p.id !== deleteTargetPlan.value!.id)
  } catch (err) {
    console.warn('[StudyPlanner] Failed to delete plan:', err)
  } finally {
    isDeleting.value = false
    deleteModalOpen.value = false
    deleteTargetPlan.value = null
  }
}

const cancelDelete = () => {
  if (isDeleting.value) return
  deleteModalOpen.value = false
  deleteTargetPlan.value = null
}

const getDaysRemaining = (targetDate: number): number => {
  const now = Date.now() / 1000
  const diff = targetDate - now
  return Math.max(0, Math.ceil(diff / 86400))
}

const isOverdue = (targetDate: number): boolean => {
  return Date.now() / 1000 > targetDate
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <!-- Header -->
    <div class="pb-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
          <BookOpen class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-text-base">Study Planner</h1>
          <p class="text-sm text-text-muted mt-1">Create AI-powered study plans tailored to your goals and schedule</p>
        </div>
      </div>
      <Button variant="primary" size="md" @click="navigateToCreatePlan" class="shrink-0">
        <Plus class="w-4 h-4 mr-2" />
        <span>Create Study Plan</span>
      </Button>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <BookOpen class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Total Plans</span>
          <p class="text-xl font-bold font-serif text-text-base">{{ studyPlans.length }}</p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
          <Target class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">In Progress</span>
          <p class="text-xl font-bold font-serif text-text-base">
            {{ studyPlans.filter(p => p.progress > 0 && p.progress < 100).length }}
          </p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Completed</span>
          <p class="text-xl font-bold font-serif text-text-base">
            {{ studyPlans.filter(p => p.progress >= 100).length }}
          </p>
        </div>
      </Card>

      <Card padding="sm" class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-surface-muted text-text-muted flex items-center justify-center shrink-0">
          <TrendingUp class="w-5 h-5" />
        </div>
        <div>
          <span class="text-xs text-text-muted">Avg Progress</span>
          <p class="text-xl font-bold font-serif text-text-base">
            {{ studyPlans.length > 0 ? Math.round(studyPlans.reduce((a, b) => a + b.progress, 0) / studyPlans.length) : 0 }}%
          </p>
        </div>
      </Card>
    </div>

    <Card padding="lg" class="shadow-sm border-border-subtle">
      <div v-if="isLoading" class="space-y-4">
        <div v-for="n in 5" :key="n" class="h-24 rounded-xl bg-surface-muted animate-pulse" />
      </div>

      <div v-else-if="error" class="p-6 rounded-xl border border-danger/25 bg-danger/10 text-center">
        <FileText class="w-8 h-8 text-danger mx-auto mb-2" />
        <p class="text-text-base">{{ error }}</p>
        <Button variant="primary" size="sm" @click="loadStudyPlans" class="mt-4">
          <Sparkles class="w-3.5 h-3.5 mr-1.5" />
          <span>Retry</span>
        </Button>
      </div>

      <div v-else-if="studyPlans.length === 0" class="py-16 text-center">
        <div class="w-20 h-20 rounded-2xl bg-surface-muted border border-border-subtle flex items-center justify-center mx-auto mb-6 text-text-muted">
          <BookOpen class="w-10 h-10 text-accent" />
        </div>

        <h3 class="text-lg font-semibold text-text-base mb-2">No study plans yet</h3>
        <p class="text-sm text-text-muted mb-8 max-w-md mx-auto leading-relaxed">
          Create your first AI-powered study plan. Tell us what you want to learn, how much time you have, and when you want to finish. We'll generate a personalized day-by-day schedule.
        </p>

        <Button variant="primary" size="lg" @click="navigateToCreatePlan" class="w-full sm:w-auto">
          <Plus class="w-5 h-5 mr-2" />
          <span>Create Your First Plan</span>
        </Button>
      </div>

      <div v-else class="space-y-4">
        <h3 class="text-sm font-semibold text-text-base">Your Study Plans</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="plan in studyPlans"
            :key="plan.id"
            @click="navigateToPlan(plan)"
            class="group p-5 rounded-xl border border-border-subtle hover:bg-surface-muted hover:border-accent/30 transition-all duration-200 cursor-pointer"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <BookOpen class="w-4 h-4" />
                </div>
                <Badge :variant="getKnowledgeLevelColor(plan.knowledge_level)" size="sm">
                  {{ getKnowledgeLevelLabel(plan.knowledge_level) }}
                </Badge>
              </div>
              <button
                type="button"
                @click.stop="openDeleteModal(plan)"
                class="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete study plan"
                :disabled="isDeleting"
              >
                <ExternalLink class="w-4 h-4" />
              </button>
            </div>

            <h4 class="text-base font-semibold text-text-base truncate mb-1">{{ plan.title }}</h4>
            <p class="text-sm text-text-muted mb-3 line-clamp-2">{{ plan.description }}</p>

            <div class="flex items-center gap-3 text-xs text-text-muted mb-3">
              <span class="flex items-center gap-1">
                <Calendar class="w-3 h-3" />
                {{ formatDate(plan.created_at) }}
              </span>
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ plan.daily_study_time_minutes }} min/day
              </span>
            </div>

            <div class="mb-3">
              <div class="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>Target: {{ formatDate(plan.target_completion_date) }}</span>
                <span :class="isOverdue(plan.target_completion_date) ? 'text-danger' : 'text-text-muted'">
                  {{ isOverdue(plan.target_completion_date) ? 'Overdue' : getDaysRemaining(plan.target_completion_date) + ' days left' }}
                </span>
              </div>
              <div class="h-2 bg-surface-muted rounded-full overflow-hidden">
                <div class="h-full bg-accent rounded-full transition-all duration-300" :style="{ width: plan.progress + '%' }"></div>
              </div>
              <p class="text-xs text-text-muted mt-1">{{ plan.progress }}% complete</p>
            </div>

            <div class="flex items-center gap-2 text-xs text-accent font-medium group-hover:underline">
              <span>View Plan</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>

  <!-- Delete Confirmation Modal -->
  <Modal :open="deleteModalOpen" @close="cancelDelete" title="Delete Study Plan?" maxWidth="sm" :description="undefined">
    <p class="text-text-base text-sm" v-if="deleteTargetPlan">
      Are you sure you want to delete <strong>"{{ deleteTargetPlan.title }}"</strong>? This action cannot be undone and will permanently remove all modules and tasks.
    </p>
    <template #footer>
      <Button variant="outline" size="sm" @click="cancelDelete" :disabled="isDeleting">
        Cancel
      </Button>
      <Button variant="secondary" size="sm" @click="confirmDelete" :loading="isDeleting" :disabled="isDeleting" class="bg-danger/10 text-danger hover:bg-danger/20">
        Delete
      </Button>
    </template>
  </Modal>
</template>