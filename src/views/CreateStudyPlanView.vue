<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Sparkles,
  Brain,
  Target,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import { generateStudyPlan, type StudyPlanGenerateRequest, type StudyPlanGenerateResponse } from '@/services/api'

const router = useRouter()

// Separate ref for date picker (YYYY-MM-DD string) to avoid type issues with date input
const targetDateString = ref<string>('')

const form = ref<StudyPlanGenerateRequest>({
  topic: '',
  knowledgeLevel: 'beginner',
  dailyStudyTimeMinutes: 60,
  targetCompletionDate: 0,
  learningGoals: '',
  additionalInstructions: '',
})

const isLoading = ref(false)
const error = ref<string | null>(null)
const errorDetails = ref<string | null>(null)
const generatedPlan = ref<StudyPlanGenerateResponse | null>(null)
const showPreview = ref(false)

const today = new Date()
today.setHours(0, 0, 0, 0)
const minDate = today.toISOString().split('T')[0]

const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

// Set default target date to tomorrow (both string for picker and timestamp for form)
targetDateString.value = tomorrow.toISOString().split('T')[0]
form.value.targetCompletionDate = Math.floor(tomorrow.getTime() / 1000)

// Sync date string to Unix timestamp whenever date picker changes
const syncTargetDate = () => {
  if (targetDateString.value) {
    const date = new Date(targetDateString.value + 'T00:00:00')
    form.value.targetCompletionDate = Math.floor(date.getTime() / 1000)
  }
}

// Initialize sync
syncTargetDate()

// Watch for date string changes and sync to form
watch(targetDateString, syncTargetDate)

const knowledgeLevels = [
  { value: 'beginner', label: 'Beginner', description: 'New to this topic', icon: Brain },
  { value: 'intermediate', label: 'Intermediate', description: 'Some prior knowledge', icon: Brain },
  { value: 'advanced', label: 'Advanced', description: 'Deep experience, want mastery', icon: Brain },
] as const

const timeOptions = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5+ hours' },
] as const

const isFormValid = computed(() => {
  const minAllowedTimestamp = Math.floor(Date.now() / 1000) + 86400
  return (
    form.value.topic.trim().length >= 3 &&
    form.value.topic.trim().length <= 200 &&
    ['beginner', 'intermediate', 'advanced'].includes(form.value.knowledgeLevel) &&
    form.value.dailyStudyTimeMinutes >= 15 &&
    form.value.dailyStudyTimeMinutes <= 480 &&
    form.value.targetCompletionDate > minAllowedTimestamp &&
    form.value.learningGoals.trim().length >= 10 &&
    form.value.learningGoals.trim().length <= 2000 &&
    (!form.value.additionalInstructions || form.value.additionalInstructions.length <= 2000)
  )
})

const topicError = computed(() => {
  if (!form.value.topic.trim()) return 'Topic is required'
  if (form.value.topic.trim().length < 3) return 'Topic must be at least 3 characters'
  if (form.value.topic.trim().length > 200) return 'Topic must be 200 characters or fewer'
  return null
})

const learningGoalsError = computed(() => {
  if (!form.value.learningGoals.trim()) return 'Learning goals are required'
  if (form.value.learningGoals.trim().length < 10) return 'Please describe your goals in at least 10 characters'
  if (form.value.learningGoals.trim().length > 2000) return 'Learning goals must be 2000 characters or fewer'
  return null
})

const targetDateError = computed(() => {
  if (!form.value.targetCompletionDate) return 'Target date is required'
  const minAllowed = Math.floor(Date.now() / 1000) + 86400
  if (form.value.targetCompletionDate <= minAllowed) return 'Target date must be at least 1 day in the future'
  return null
})

const handleSubmit = async () => {
  if (!isFormValid.value) return
  isLoading.value = true
  error.value = null
  errorDetails.value = null
  generatedPlan.value = null
  showPreview.value = false

  try {
    const response = await generateStudyPlan(form.value)
    if (response.success && response.plan) {
      generatedPlan.value = response
      showPreview.value = true
    } else {
      error.value = response.message || 'Failed to generate study plan'
      errorDetails.value = response.error ?? null
    }
  } catch (err: any) {
    console.error('[CreateStudyPlan] Generation failed:', err)
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const handleSaveAndView = async () => {
  if (!generatedPlan.value?.plan) return
  // Plan is already saved by the backend, just navigate
  router.push(`/planner/${generatedPlan.value.plan.id}`)
}

const handleCreateAnother = () => {
  const newTomorrow = new Date()
  newTomorrow.setDate(newTomorrow.getDate() + 1)
  const tomorrowString = newTomorrow.toISOString().split('T')[0]
  
  form.value = {
    topic: '',
    knowledgeLevel: 'beginner',
    dailyStudyTimeMinutes: 60,
    targetCompletionDate: Math.floor(newTomorrow.getTime() / 1000),
    learningGoals: '',
    additionalInstructions: undefined,
  }
  targetDateString.value = tomorrowString
  generatedPlan.value = null
  showPreview.value = false
  error.value = null
  errorDetails.value = null
}

const goBack = () => {
  router.push('/planner')
}

const formatTargetDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <!-- Header -->
    <div class="pb-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="sm" @click="goBack" class="shrink-0">
          <ArrowLeft class="w-4 h-4 mr-1.5" />
          <span>Back</span>
        </Button>
        <div>
          <Badge variant="accent" size="sm">
            <Sparkles class="w-3 h-3 mr-1" /> AI Generator
          </Badge>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-text-base mt-2">Create Study Plan</h1>
          <p class="text-sm text-text-muted mt-1 max-w-2xl">Describe what you want to learn and we'll generate a personalized day-by-day schedule using Google Gemini.</p>
        </div>
      </div>
    </div>

    <div v-if="showPreview && generatedPlan" class="space-y-6">
      <!-- Success State -->
      <Card padding="lg" class="bg-success/5 border-success/20">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <Sparkles class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-text-base">Study Plan Generated!</h3>
            <p class="text-sm text-text-muted">Your personalized plan has been created and saved.</p>
          </div>
        </div>

        <div class="space-y-3 text-sm">
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-muted/50">
            <span class="text-text-muted">Plan Title</span>
            <span class="font-medium text-text-base">{{ generatedPlan?.plan?.title }}</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-muted/50">
            <span class="text-text-muted">Topic</span>
            <span class="font-medium text-text-base">{{ generatedPlan?.plan?.topic }}</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-muted/50">
            <span class="text-text-muted">Duration</span>
            <span class="font-medium text-text-base">{{ generatedPlan?.plan?.totalEstimatedDays }} days</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-muted/50">
            <span class="text-text-muted">Modules</span>
            <span class="font-medium text-text-base">{{ generatedPlan?.plan?.modules?.length ?? 0 }}</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-muted/50">
            <span class="text-text-muted">Daily Time</span>
            <span class="font-medium text-text-base">{{ form.dailyStudyTimeMinutes }} minutes</span>
          </div>
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-muted/50">
            <span class="text-text-muted">Target Date</span>
            <span class="font-medium text-text-base">{{ formatTargetDate(form.targetCompletionDate) }}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 mt-6">
          <Button variant="primary" size="md" @click="handleSaveAndView" class="flex-1">
            <Target class="w-4 h-4 mr-2" />
            <span>View Study Plan</span>
          </Button>
          <Button variant="outline" size="md" @click="handleCreateAnother" class="flex-1">
            <Plus class="w-4 h-4 mr-2" />
            <span>Create Another</span>
          </Button>
        </div>
      </Card>
    </div>

    <div v-else class="space-y-6">
      <!-- Error State -->
      <div v-if="error" class="p-4 rounded-xl border border-danger/25 bg-danger/10">
        <div class="flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div class="flex-1">
            <p class="text-text-base">{{ error }}</p>
            <p v-if="errorDetails" class="text-xs text-text-muted mt-1 font-mono">{{ errorDetails }}</p>
          </div>
        </div>
      </div>

      <Card padding="lg" class="space-y-8 shadow-sm border-border-subtle">
        <!-- Topic Field -->
        <div>
          <label class="block text-sm font-medium text-text-base mb-2">Topic / Subject <span class="text-danger">*</span></label>
          <Input
            v-model="form.topic"
            type="text"
            placeholder="e.g., Machine Learning, Web Development, Data Structures"
            maxlength="200"
            :error="topicError"
            class="w-full"
          />
          <p class="text-xs text-text-muted mt-1">{{ form.topic.length }}/200 characters</p>
        </div>

        <!-- Knowledge Level -->
        <div>
          <label class="block text-sm font-medium text-text-base mb-2">Current Knowledge Level <span class="text-danger">*</span></label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="level in knowledgeLevels"
              :key="level.value"
              type="button"
              @click="form.knowledgeLevel = level.value"
              class="relative p-4 rounded-xl border-2 transition-all duration-200 text-left"
              :class="form.knowledgeLevel === level.value
                ? 'border-accent bg-accent/5'
                : 'border-border-subtle hover:border-accent/30 hover:bg-surface-muted'"
            >
              <div class="flex items-center gap-2 mb-2">
                <component :is="level.icon" class="w-5 h-5 text-accent" />
                <span class="font-medium text-text-base">{{ level.label }}</span>
              </div>
              <p class="text-xs text-text-muted">{{ level.description }}</p>
              <div
                v-if="form.knowledgeLevel === level.value"
                class="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent text-primary-fg flex items-center justify-center"
              >
                <span class="text-[10px] font-bold">✓</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Daily Study Time -->
        <div>
          <label class="block text-sm font-medium text-text-base mb-2">Daily Available Study Time <span class="text-danger">*</span></label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in timeOptions"
              :key="option.value"
              type="button"
              @click="form.dailyStudyTimeMinutes = option.value"
              class="px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200"
              :class="form.dailyStudyTimeMinutes === option.value
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-border-subtle text-text-muted hover:border-accent/30 hover:bg-surface-muted'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- Target Completion Date -->
        <div>
          <label class="block text-sm font-medium text-text-base mb-2">Target Completion Date <span class="text-danger">*</span></label>
          <Input
            v-model="targetDateString"
            type="date"
            :min="minDate"
            :error="targetDateError"
            class="w-full sm:w-64"
          />
          <p class="text-xs text-text-muted mt-1">Must be at least 1 day in the future</p>
        </div>

        <!-- Learning Goals -->
        <div>
          <label class="block text-sm font-medium text-text-base mb-2">Learning Goals <span class="text-danger">*</span></label>
          <textarea
            v-model="form.learningGoals"
            rows="4"
            placeholder="Describe what you want to achieve. Be specific about the skills, concepts, or outcomes you want."
            maxlength="2000"
            class="w-full px-4 py-3 rounded-xl bg-surface border border-border-subtle text-text-base placeholder:text-text-muted/60 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
            :class="{ 'border-danger': learningGoalsError }"
          ></textarea>
          <div class="flex justify-between mt-1">
            <p class="text-xs text-text-muted">{{ form.learningGoals.length }}/2000 characters</p>
            <p v-if="learningGoalsError" class="text-xs text-danger">{{ learningGoalsError }}</p>
          </div>
        </div>

        <!-- Additional Instructions (Optional) -->
        <div>
          <label class="block text-sm font-medium text-text-base mb-2">Additional Instructions (Optional)</label>
          <textarea
            v-model="form.additionalInstructions"
            rows="3"
            placeholder="Any specific preferences? e.g., 'Focus on hands-on projects', 'Prefer video resources', 'Include weekend review sessions'"
            maxlength="2000"
            class="w-full px-4 py-3 rounded-xl bg-surface border border-border-subtle text-text-base placeholder:text-text-muted/60 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
          ></textarea>
          <p class="text-xs text-text-muted mt-1">{{ (form.additionalInstructions ?? '').length }}/2000 characters</p>
        </div>

        <!-- Submit Button -->
        <div class="pt-4 border-t border-border-subtle">
          <Button
            variant="primary"
            size="lg"
            full-width
            @click="handleSubmit"
            :loading="isLoading"
            :disabled="!isFormValid || isLoading"
          >
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin mr-2" />
            <Sparkles v-else class="w-5 h-5 mr-2" />
            <span>{{ isLoading ? 'Generating Plan...' : 'Generate Study Plan' }}</span>
          </Button>
          <p class="text-center text-xs text-text-muted mt-3">
            This will call Google Gemini API to create your personalized study plan.
          </p>
        </div>
      </Card>
    </div>
  </div>
</template>