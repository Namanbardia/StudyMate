<script setup lang="ts">
import { ref } from 'vue'
import {
  Search,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle,
  Play
} from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import PreviewModal from '@/components/landing/PreviewModal.vue'

const searchQuery = ref('')
const isPreviewOpen = ref(false)
const activePreviewTopic = ref('')

const exampleSearches = [
  'Learn Python from scratch',
  'Operating System — Deadlocks',
  'Machine Learning — Regression',
  'Data Structures and Algorithms'
]

const triggerSearch = (query?: string) => {
  const q = query || searchQuery.value.trim() || 'Learn Python from scratch'
  activePreviewTopic.value = q
  searchQuery.value = q
  isPreviewOpen.value = true
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    triggerSearch()
  }
}
</script>

<template>
  <section class="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
    <!-- Subtle background warm ambient radial tint -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-accent/5 blur-3xl pointer-events-none -z-10 rounded-full" />

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <!-- Tagline Pill -->
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-muted border border-border-subtle shadow-2xs mb-6 sm:mb-8 animate-fade-in">
        <Sparkles class="w-3.5 h-3.5 text-accent" />
        <span class="text-xs font-semibold tracking-wide uppercase text-text-muted">
          StudyMate AI &bull; Focused Academic Copilot
        </span>
      </div>

      <!-- Headline -->
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-text-base leading-[1.15] mb-6">
        Your learning journey, <br class="hidden sm:inline" />
        <span class="italic font-normal">all in one place.</span>
      </h1>

      <!-- Subheading -->
      <p class="text-base sm:text-lg lg:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
        Discover the best resources, understand difficult concepts, and turn your learning goals into a plan you can actually follow.
      </p>

      <!-- Prominent Search Box -->
      <div class="max-w-2xl mx-auto mb-6">
        <div class="relative bg-surface p-2 rounded-2xl border-2 border-border-subtle shadow-md hover:border-accent/40 focus-within:border-accent transition-all duration-200 flex items-center gap-2">
          <div class="pl-3.5 text-text-muted">
            <Search class="w-5 h-5 text-accent" />
          </div>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="What do you want to learn today?"
            @keydown="handleKeydown"
            class="flex-1 bg-transparent text-text-base placeholder:text-text-muted/65 text-sm sm:text-base px-2 py-2 focus:outline-none"
          />

          <Button
            variant="primary"
            size="md"
            @click="() => triggerSearch()"
            class="shrink-0 rounded-xl"
          >
            <span>Search</span>
            <ArrowRight class="w-4 h-4 ml-0.5" />
          </Button>
        </div>

        <!-- Example Search suggestions -->
        <div class="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs text-text-muted">
          <span class="font-medium mr-1 select-none">Try:</span>
          <button
            v-for="example in exampleSearches"
            :key="example"
            type="button"
            @click="triggerSearch(example)"
            class="px-2.5 py-1 rounded-lg bg-surface-muted/80 hover:bg-surface-hover hover:text-text-base border border-border-subtle transition-colors cursor-pointer text-xs"
          >
            {{ example }}
          </button>
        </div>
      </div>

      <!-- Product Preview Mockup Card (Editorial Academic Dashboard Preview) -->
      <div class="mt-14 max-w-4xl mx-auto text-left">
        <div class="relative rounded-2xl border border-border-subtle bg-surface shadow-lg overflow-hidden transition-all">
          <!-- Window Header bar -->
          <div class="px-5 py-3 border-b border-border-subtle bg-surface-muted/50 flex items-center justify-between text-xs text-text-muted">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-border-subtle inline-block" />
              <span class="w-2.5 h-2.5 rounded-full bg-border-subtle inline-block" />
              <span class="w-2.5 h-2.5 rounded-full bg-border-subtle inline-block" />
              <span class="ml-2 font-mono text-xs opacity-75">studymate.ai/explore/operating-systems</span>
            </div>
            <div class="flex items-center gap-2">
              <Badge variant="success" size="sm">
                <CheckCircle class="w-3 h-3 mr-1" /> Verified Syllabus
              </Badge>
            </div>
          </div>

          <!-- Mockup Content -->
          <div class="p-6 sm:p-8 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
              <div>
                <span class="text-xs uppercase tracking-wider font-semibold text-accent">Active Learning Package</span>
                <h3 class="text-xl sm:text-2xl font-serif font-bold text-text-base mt-0.5">
                  Operating System — Deadlock Detection &amp; Prevention
                </h3>
              </div>
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" @click="triggerSearch('Operating System — Deadlocks')">
                  Open Interactive View
                </Button>
              </div>
            </div>

            <!-- Grid of sample package elements -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Item 1: Concept Breakdown -->
              <div class="p-4 rounded-xl bg-surface-muted/40 border border-border-subtle space-y-2">
                <div class="flex items-center gap-2 text-text-base font-semibold text-xs">
                  <BookOpen class="w-4 h-4 text-accent" />
                  <span>AI Core Breakdown</span>
                </div>
                <p class="text-xs text-text-muted leading-relaxed">
                  Coffman 4 Conditions, Safe State vectors, and Banker's Algorithm explained step-by-step with zero fluff.
                </p>
                <span class="inline-block text-[11px] text-accent font-medium">4 key takeaways identified</span>
              </div>

              <!-- Item 2: Curated Video Playlist -->
              <div class="p-4 rounded-xl bg-surface-muted/40 border border-border-subtle space-y-2">
                <div class="flex items-center gap-2 text-text-base font-semibold text-xs">
                  <Play class="w-4 h-4 text-danger fill-danger/20" />
                  <span>Verified Video Lessons</span>
                </div>
                <p class="text-xs text-text-muted leading-relaxed">
                  3 top-rated lecture clips indexed by timestamp. No 2-hour unedited lecture recordings.
                </p>
                <span class="inline-block text-[11px] text-text-muted font-medium">1h 21m total curated runtime</span>
              </div>

              <!-- Item 3: Day-Wise Study Schedule -->
              <div class="p-4 rounded-xl bg-surface-muted/40 border border-border-subtle space-y-2">
                <div class="flex items-center gap-2 text-text-base font-semibold text-xs">
                  <Calendar class="w-4 h-4 text-success" />
                  <span>3-Day Structured Plan</span>
                </div>
                <p class="text-xs text-text-muted leading-relaxed">
                  Day 1: Concept &amp; Conditions. Day 2: Banker's Algorithm. Day 3: Past Exam Practice.
                </p>
                <span class="inline-block text-[11px] text-success font-medium">35 mins daily target</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal for Search CTA -->
    <PreviewModal
      :open="isPreviewOpen"
      :query="activePreviewTopic"
      @close="isPreviewOpen = false"
    />
  </section>
</template>
