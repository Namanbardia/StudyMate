<script setup lang="ts">
import {
  Search,
  Compass,
  CheckCircle2,
  CalendarCheck
} from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'
import type { StepItem } from '@/types'

const steps: StepItem[] = [
  {
    number: '01',
    title: 'Search what you want to learn',
    description: 'Enter any subject, syllabus chapter, or tricky exam concept into the search engine.',
    details: [
      'Instant core breakdown with key takeaways',
      'Calculated difficulty rating & study duration',
      'No marketing fluff, just essential theory'
    ]
  },
  {
    number: '02',
    title: 'Explore organized learning resources',
    description: 'Access a curated learning package with verified YouTube video lectures and reference documentation.',
    details: [
      'Top-rated lecture segments indexed by timestamp',
      'Official documentation and academic guides',
      'Real source attribution with zero hallucinated links'
    ]
  },
  {
    number: '03',
    title: 'Build a plan and track your progress',
    description: 'Transform passive reading into consistent mastery with day-wise schedules and diagnostic check quizzes.',
    details: [
      'Realistic 30-45 minute daily milestones',
      'Active recall questions with immediate explanations',
      'Track real task completions without fake metrics'
    ]
  }
]
</script>

<template>
  <section id="how-it-works" class="py-20 sm:py-28 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
        <Badge variant="muted" class="mb-4">
          Simple 3-Step Workflow
        </Badge>
        <h2 class="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-text-base mb-4">
          How StudyMate AI accelerates your learning
        </h2>
        <p class="text-base sm:text-lg text-text-muted leading-relaxed">
          From initial confusion to complete subject mastery in three focused, distraction-free steps.
        </p>
      </div>

      <!-- Steps Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        <div
          v-for="(step, idx) in steps"
          :key="step.number"
          class="relative flex flex-col justify-between p-7 sm:p-8 rounded-2xl bg-surface border border-border-subtle hover:border-border-hover transition-all duration-200"
        >
          <div>
            <!-- Step Badge & Number -->
            <div class="flex items-center justify-between mb-6">
              <span class="text-2xl font-serif font-bold text-accent">
                {{ step.number }}
              </span>
              <div class="w-8 h-8 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center text-text-muted">
                <Search v-if="idx === 0" class="w-4 h-4 text-accent" />
                <Compass v-else-if="idx === 1" class="w-4 h-4 text-accent" />
                <CalendarCheck v-else class="w-4 h-4 text-accent" />
              </div>
            </div>

            <!-- Title & Description -->
            <h3 class="text-lg font-bold text-text-base mb-3 leading-snug">
              {{ step.title }}
            </h3>
            <p class="text-sm text-text-muted leading-relaxed mb-6">
              {{ step.description }}
            </p>
          </div>

          <!-- Checklist -->
          <div class="pt-5 border-t border-border-subtle space-y-2.5">
            <div
              v-for="(detail, dIdx) in step.details"
              :key="dIdx"
              class="flex items-start gap-2.5 text-xs text-text-muted"
            >
              <CheckCircle2 class="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
              <span>{{ detail }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
