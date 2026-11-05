<script setup lang="ts">
import {
  Search,
  Calendar,
  FileText,
  TrendingUp,
  Bookmark,
  HelpCircle,
  Sparkles
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import type { FeatureItem } from '@/types'

const features: FeatureItem[] = [
  {
    id: 'search',
    title: 'AI Learning Search',
    tag: 'Core Discovery',
    iconName: 'Search',
    description: 'Search any concept or syllabus topic to receive an organized learning package with clear breakdowns, verified YouTube lectures, and reference docs.',
    highlight: 'Real verified URLs only'
  },
  {
    id: 'planner',
    title: 'Personalized Study Planner',
    tag: 'Goal Mastery',
    iconName: 'Calendar',
    description: 'Transform broad exam syllabi into structured, day-wise milestones with time estimates tailored to your available hours and pace.',
    highlight: 'Realistic day-by-day targets'
  },
  {
    id: 'summarizer',
    title: 'Notes Summarizer',
    tag: 'Smart Synthesis',
    iconName: 'FileText',
    description: 'Upload lecture slides, reading PDFs, or rough notes. Extract high-yield formulas, key terminology, and crisp study cheat sheets.',
    highlight: 'High-yield conceptual summaries'
  },
  {
    id: 'progress',
    title: 'Progress Tracking',
    tag: 'Measurable Growth',
    iconName: 'TrendingUp',
    description: 'Monitor true completion based on completed study tasks and quizzes. View subject-level mastery without vanity metrics or fake numbers.',
    highlight: 'Real verified progress data'
  },
  {
    id: 'resources',
    title: 'Saved Learning Resources',
    tag: 'Personal Vault',
    iconName: 'Bookmark',
    description: 'Organize your favorite YouTube explanations, textbook links, and generated notes by subject tags for frictionless revision before exams.',
    highlight: 'Always accessible & searchable'
  },
  {
    id: 'quiz',
    title: 'AI Quiz Generator',
    tag: 'Active Recall',
    iconName: 'HelpCircle',
    description: 'Test your understanding with topic-based diagnostic questions and instant explanations that reinforce memory retention.',
    highlight: 'Instant rationale for every answer'
  }
]

const getIcon = (name: string) => {
  switch (name) {
    case 'Search': return Search
    case 'Calendar': return Calendar
    case 'FileText': return FileText
    case 'TrendingUp': return TrendingUp
    case 'Bookmark': return Bookmark
    case 'HelpCircle': return HelpCircle
    default: return Sparkles
  }
}
</script>

<template>
  <section id="features" class="py-20 sm:py-28 bg-surface-muted/30 border-y border-border-subtle transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
        <Badge variant="accent" class="mb-4">
          Core Capabilities
        </Badge>
        <h2 class="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-text-base mb-4">
          Everything you need to master difficult topics
        </h2>
        <p class="text-base sm:text-lg text-text-muted leading-relaxed">
          StudyMate AI replaces scattered tabs, chaotic bookmarks, and fragmented study sessions with a unified, disciplined learning system.
        </p>
      </div>

      <!-- Features Grid (6 cards) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card
          v-for="feat in features"
          :key="feat.id"
          hoverable
          class="flex flex-col justify-between group"
        >
          <div>
            <!-- Card Header with Icon & Tag -->
            <div class="flex items-center justify-between gap-3 mb-5">
              <div class="w-11 h-11 rounded-xl bg-surface-muted border border-border-subtle flex items-center justify-center text-text-base group-hover:bg-primary group-hover:text-primary-fg transition-colors">
                <component :is="getIcon(feat.iconName)" class="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
              <Badge variant="muted" size="sm">
                {{ feat.tag }}
              </Badge>
            </div>

            <!-- Title & Description -->
            <h3 class="text-lg font-bold text-text-base mb-2 group-hover:text-accent transition-colors">
              {{ feat.title }}
            </h3>
            <p class="text-sm text-text-muted leading-relaxed mb-6">
              {{ feat.description }}
            </p>
          </div>

          <!-- Highlight Pill / Footer -->
          <div class="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <span class="font-medium text-accent">
              {{ feat.highlight }}
            </span>
            <span class="opacity-0 group-hover:opacity-100 transition-opacity">
              &rarr;
            </span>
          </div>
        </Card>
      </div>
    </div>
  </section>
</template>
