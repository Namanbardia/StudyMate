<script setup lang="ts">
import { ref } from 'vue'
import { Search, Sparkles, BookOpen, Compass } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

const popularTopics = [
  'Dynamic Programming in Python',
  'Organic Chemistry Reaction Mechanisms',
  'Macroeconomics: Monetary Policy',
  'Linear Algebra: Eigenvectors & Eigenvalues',
  'Cell Biology: Mitosis vs Meiosis'
]

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  // Placeholder action for AI search phase
}

const selectTopic = (topic: string) => {
  searchQuery.value = topic
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <!-- Header -->
    <div class="pb-6 border-b border-border-subtle">
      <div class="flex items-center gap-2">
        <Badge variant="accent" size="sm">
          <Sparkles class="w-3 h-3 mr-1" /> AI Learning Engine
        </Badge>
      </div>
      <h1 class="text-2xl sm:text-3xl font-serif font-bold text-text-base mt-2">
        AI Search &amp; Resource Discovery
      </h1>
      <p class="text-sm text-text-muted mt-1 max-w-2xl">
        Enter any academic topic, course unit, or complex question. StudyMate AI structures key concepts, creates structured explanations, and finds curated video explanations.
      </p>
    </div>

    <!-- Search Input Box -->
    <Card padding="lg" class="space-y-4 shadow-sm border-border-subtle">
      <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="e.g. Binary Search Trees, Keynesian Economics, Photosynthesis..."
            class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border-subtle text-text-base placeholder:text-text-muted/60 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            autofocus
          />
        </div>
        <Button variant="primary" size="md" type="submit" class="shrink-0">
          <Sparkles class="w-4 h-4 mr-1.5" />
          <span>Generate Plan</span>
        </Button>
      </form>

      <!-- Suggested Topics -->
      <div class="pt-2">
        <span class="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
          Suggested Topics
        </span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="topic in popularTopics"
            :key="topic"
            type="button"
            @click="selectTopic(topic)"
            class="text-xs px-2.5 py-1 rounded-lg bg-surface-muted hover:bg-surface-hover text-text-base border border-border-subtle transition-colors cursor-pointer"
          >
            {{ topic }}
          </button>
        </div>
      </div>
    </Card>

    <!-- Placeholder State -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="md" class="space-y-2">
        <div class="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
          <BookOpen class="w-4 h-4" />
        </div>
        <h3 class="text-sm font-semibold text-text-base">Concept Breakdown</h3>
        <p class="text-xs text-text-muted leading-relaxed">
          Comprehensive step-by-step breakdown with key takeaways, formulas, and common exam pitfalls.
        </p>
      </Card>

      <Card padding="md" class="space-y-2">
        <div class="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
          <Compass class="w-4 h-4" />
        </div>
        <h3 class="text-sm font-semibold text-text-base">Targeted YouTube Lectures</h3>
        <p class="text-xs text-text-muted leading-relaxed">
          Curated timestamps and verified educational channels directly matching the curriculum.
        </p>
      </Card>
    </div>
  </div>
</template>
