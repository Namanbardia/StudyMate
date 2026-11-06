<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Calendar,
  Target,
  CheckCircle2,
  BookOpen,
  FileText,
  RotateCcw,
  Trash2,
  Sparkles,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Modal from '@/components/ui/Modal.vue'
import { useAuthStore } from '@/stores/auth'
import { getStudyPlan, updateStudyPlanTask, deleteStudyPlan, type StudyPlan, type StudyPlanTask } from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const plan = ref<StudyPlan | null>(null)
const tasks = ref<StudyPlanTask[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

// Delete confirmation modal
const deleteModalOpen = ref(false)
const isDeleting = ref(false)

// Track pending task updates to prevent duplicate requests
const pendingTaskUpdates = ref<Set<string>>(new Set())

// Task grouping by day
const days = computed(() => {
  const dayMap = new Map<number, { dayNumber: number; tasks: StudyPlanTask[] }>()
  tasks.value.forEach(task => {
    const key = task.day_number
    if (!dayMap.has(key)) {
      dayMap.set(key, { dayNumber: task.day_number, tasks: [] })
    }
    dayMap.get(key)!.tasks.push(task)
  })
  return Array.from(dayMap.values()).sort((a, b) => a.dayNumber - b.dayNumber)
})

// Also keep module grouping for backward compatibility if needed
const modules = computed(() => {
  const moduleMap = new Map<string, { name: string; order: number; tasks: StudyPlanTask[] }>()
  tasks.value.forEach(task => {
    const key = task.module_name
    if (!moduleMap.has(key)) {
      moduleMap.set(key, { name: task.module_name, order: task.module_order, tasks: [] })
    }
    moduleMap.get(key)!.tasks.push(task)
  })
  return Array.from(moduleMap.values()).sort((a, b) => a.order - b.order)
})

// Day progress computation
const getDayProgress = (dayTasks: StudyPlanTask[]) => {
  const total = dayTasks.length
  const completed = dayTasks.filter(t => t.is_completed === 1).length
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

const totalTasks = computed(() => tasks.value.length)
const completedTasks = computed(() => tasks.value.filter(t => t.is_completed === 1).length)
const overallProgress = computed(() => totalTasks.value > 0 ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0)

const formatFullDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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

const loadPlan = async () => {
  if (!authStore.isAuthenticated) return
  isLoading.value = true
  error.value = null
  try {
    const response = await getStudyPlan(route.params.id as string)
    if (response.success && response.plan) {
      plan.value = response.plan
      tasks.value = response.tasks || []
    } else {
      error.value = response.message || 'Failed to load study plan'
    }
  } catch (err) {
    console.warn('[StudyPlanDetail] Failed to load:', err)
    error.value = 'Failed to load study plan'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadPlan()
})

const handleTaskToggle = async (task: StudyPlanTask) => {
  const taskId = task.id
  
  // Prevent duplicate requests for the same task
  if (pendingTaskUpdates.value.has(taskId)) return
  
  const previousCompleted = task.is_completed
  const previousCompletedAt = task.completed_at
  const previousProgress = plan.value?.progress ?? 0
  
  // Optimistic update - immediate UI feedback
  task.is_completed = previousCompleted === 1 ? 0 : 1
  task.completed_at = task.is_completed === 1 ? Math.floor(Date.now() / 1000) : null
  if (plan.value) {
    plan.value.progress = overallProgress.value
  }
  
  pendingTaskUpdates.value.add(taskId)
  
  try {
    await updateStudyPlanTask(plan.value!.id, task.id, task.is_completed === 1)
  } catch (err) {
    // Rollback on failure
    console.warn('[StudyPlanDetail] Failed to update task:', err)
    task.is_completed = previousCompleted
    task.completed_at = previousCompletedAt
    if (plan.value) {
      plan.value.progress = previousProgress
    }
    // Show error notification (could be enhanced with a toast)
    alert('Failed to update task. Please try again.')
  } finally {
    pendingTaskUpdates.value.delete(taskId)
  }
}

const openDeleteModal = () => {
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!plan.value || isDeleting.value) return
  isDeleting.value = true
  try {
    await deleteStudyPlan(plan.value.id)
    router.push('/planner')
  } catch (err) {
    console.warn('[StudyPlanDetail] Failed to delete:', err)
  } finally {
    isDeleting.value = false
    deleteModalOpen.value = false
  }
}

const cancelDelete = () => {
  if (isDeleting.value) return
  deleteModalOpen.value = false
}

const goBack = () => {
  router.push('/planner')
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <!-- Header -->
    <div class="pb-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" @click="goBack" class="shrink-0">
          <ArrowLeft class="w-4 h-4 mr-1.5" />
          <span>Back</span>
        </Button>
        <div v-if="plan">
          <div class="flex items-center gap-2">
            <Badge variant="accent" size="sm">
              <Sparkles class="w-3 h-3 mr-1" /> AI Generated
            </Badge>
            <Badge :variant="getKnowledgeLevelColor(plan.knowledge_level)" size="sm">
              {{ getKnowledgeLevelLabel(plan.knowledge_level) }}
            </Badge>
          </div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-text-base mt-2">{{ plan.title }}</h1>
          <p class="text-sm text-text-muted mt-1">{{ plan.topic }}</p>
        </div>
      </div>

      <div v-if="plan" class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="openDeleteModal">
          <Trash2 class="w-3.5 h-3.5 mr-1.5" />
          <span>Delete Plan</span>
        </Button>
      </div>
    </div>

    <div v-if="isLoading" class="space-y-6">
      <div v-for="n in 3" :key="n" class="h-20 rounded-xl bg-surface-muted animate-pulse" />
    </div>

    <div v-else-if="error" class="p-6 rounded-xl border border-danger/25 bg-danger/10 text-center">
      <AlertCircle class="w-8 h-8 text-danger mx-auto mb-2" />
      <p class="text-text-base">{{ error }}</p>
      <Button variant="primary" size="sm" @click="loadPlan" class="mt-4">
        <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
        <span>Retry</span>
      </Button>
    </div>

    <div v-else-if="plan" class="space-y-8">
      <!-- Plan Overview Card -->
      <Card padding="lg" class="shadow-sm border-border-subtle">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="flex items-center gap-4 p-4 rounded-xl bg-surface-muted/50">
            <div class="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Target class="w-6 h-6" />
            </div>
            <div>
              <span class="text-xs text-text-muted">Target Date</span>
              <p class="text-lg font-bold font-serif text-text-base">{{ formatFullDate(plan.target_completion_date) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 p-4 rounded-xl bg-surface-muted/50">
            <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar class="w-6 h-6" />
            </div>
            <div>
              <span class="text-xs text-text-muted">Daily Time</span>
              <p class="text-lg font-bold font-serif text-text-base">{{ plan.daily_study_time_minutes }} minutes</p>
            </div>
          </div>
          <div class="flex items-center gap-4 p-4 rounded-xl bg-surface-muted/50">
            <div class="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <FileText class="w-6 h-6" />
            </div>
            <div>
              <span class="text-xs text-text-muted">Total Days</span>
              <p class="text-lg font-bold font-serif text-text-base">{{ plan.total_estimated_days }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4 p-4 rounded-xl bg-surface-muted/50">
            <div class="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Sparkles class="w-6 h-6" />
            </div>
            <div>
              <span class="text-xs text-text-muted">Modules</span>
              <p class="text-lg font-bold font-serif text-text-base">{{ modules.length }}</p>
            </div>
          </div>
        </div>

        <!-- Overall Progress -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-text-base">Overall Progress</span>
            <span class="text-sm font-semibold text-text-base">{{ overallProgress }}%</span>
          </div>
          <div class="h-3 bg-surface-muted rounded-full overflow-hidden">
            <div class="h-full bg-accent rounded-full transition-all duration-300" :style="{ width: overallProgress + '%' }"></div>
          </div>
          <p class="text-xs text-text-muted mt-2">{{ completedTasks }} of {{ totalTasks }} tasks completed</p>
        </div>

        <!-- Description & Goals -->
        <div class="space-y-4 pt-6 border-t border-border-subtle">
          <div>
            <h3 class="text-sm font-semibold text-text-base mb-2">Description</h3>
            <p class="text-sm text-text-muted">{{ plan.description }}</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-text-base mb-2">Learning Goals</h3>
            <p class="text-sm text-text-muted whitespace-pre-wrap">{{ plan.learning_goals }}</p>
          </div>
          <div v-if="plan.additional_instructions">
            <h3 class="text-sm font-semibold text-text-base mb-2">Additional Instructions</h3>
            <p class="text-sm text-text-muted">{{ plan.additional_instructions }}</p>
          </div>
        </div>
      </Card>

      <!-- Days & Tasks -->
      <div v-for="day in days" :key="day.dayNumber" class="space-y-4">
        <Card padding="lg" class="shadow-sm border-border-subtle">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Calendar class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-text-base">Day {{ day.dayNumber }}</h3>
                <p class="text-xs text-text-muted">
                  {{ day.tasks.filter(t => t.is_completed === 1).length }} / {{ day.tasks.length }} tasks
                  <span class="mx-2">•</span>
                  {{ getDayProgress(day.tasks) }}% complete
                </p>
              </div>
            </div>
            <div class="h-2 bg-surface-muted rounded-full overflow-hidden w-32">
              <div class="h-full bg-accent rounded-full transition-all duration-300" :style="{ width: getDayProgress(day.tasks) + '%' }"></div>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="task in day.tasks"
              :key="task.id"
              class="group p-3 rounded-lg border border-border-subtle hover:bg-surface-muted transition-colors"
            >
              <label class="flex items-start gap-3 cursor-pointer">
                <div class="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    :checked="task.is_completed === 1"
                    @change="handleTaskToggle(task)"
                    :disabled="pendingTaskUpdates.has(task.id)"
                    class="w-5 h-5 rounded border-border-subtle text-accent focus:ring-accent mt-0.5 shrink-0 peer"
                  />
                  <div v-if="pendingTaskUpdates.has(task.id)" class="absolute inset-0 flex items-center justify-center">
                    <Loader2 class="w-4 h-4 text-accent animate-spin" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p :class="task.is_completed === 1 ? 'line-through text-text-muted' : 'text-text-base'" class="text-sm font-medium">
                    {{ task.task_title }}
                  </p>
                  <p v-if="task.task_description" :class="task.is_completed === 1 ? 'line-through text-text-muted' : 'text-text-muted'" class="text-xs mt-0.5 line-clamp-1">
                    {{ task.task_description }}
                  </p>
                  <div class="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                    <span class="flex items-center gap-1">
                      <Clock class="w-2.5 h-2.5" />
                      {{ task.estimated_duration_minutes }} min
                    </span>
                    <span class="flex items-center gap-1">
                      <BookOpen class="w-2.5 h-2.5" />
                      {{ task.module_name }}
                    </span>
                  </div>
                </div>
                <div v-if="task.is_completed === 1" class="flex items-center justify-center w-8 h-8 shrink-0">
                  <CheckCircle2 class="w-5 h-5 text-success" />
                </div>
              </label>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="py-12 text-center">
      <FileText class="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
      <h3 class="text-lg font-semibold text-text-base mb-2">Plan not found</h3>
      <p class="text-sm text-text-muted mb-6">This study plan may have been deleted or you don't have access to it.</p>
      <Button variant="primary" size="md" @click="goBack">
        <ArrowLeft class="w-4 h-4 mr-2" />
        <span>Back to Study Planner</span>
      </Button>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <Modal :open="deleteModalOpen" @close="cancelDelete" title="Delete Study Plan?" maxWidth="sm" :description="undefined">
    <p class="text-text-base text-sm" v-if="plan">
      Are you sure you want to delete <strong>"{{ plan.title }}"</strong>? This action cannot be undone and will permanently remove all modules and tasks.
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