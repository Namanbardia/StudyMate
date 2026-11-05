<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, Sparkles, BookOpen, Compass, Youtube, Globe2, Layers3, AlertCircle } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import YouTubeResultCard from '@/components/search/YouTubeResultCard.vue'
import WebResultCard from '@/components/search/WebResultCard.vue'
import { ApiError, searchStudyResources, type SearchType, type StudySearchResponse } from '@/services/api'

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const selectedType = ref<SearchType>('all')
const results = ref<StudySearchResponse | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const hasSearched = ref(false)
let requestId = 0

const tabs: Array<{ id: SearchType; label: string; icon: typeof Layers3 }> = [
  { id: 'all', label: 'All', icon: Layers3 },
  { id: 'videos', label: 'Videos', icon: Youtube },
  { id: 'web', label: 'Web', icon: Globe2 },
]
const videos = computed(() => results.value?.videos || [])
const webResults = computed(() => results.value?.web || [])
const visibleResultCount = computed(() => selectedType.value === 'videos' ? videos.value.length : selectedType.value === 'web' ? webResults.value.length : videos.value.length + webResults.value.length)

const handleSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query || isLoading.value) return
  const currentRequest = ++requestId
  isLoading.value = true
  errorMessage.value = ''
  hasSearched.value = true
  try {
    // One user submission fetches both providers once. Tabs only filter this response.
    results.value = await searchStudyResources(query, 'all')
  } catch (error) {
    if (currentRequest !== requestId) return
    errorMessage.value = error instanceof ApiError ? error.message : 'Could not connect to StudyMate search. Check your connection and try again.'
    results.value = null
  } finally {
    if (currentRequest === requestId) isLoading.value = false
  }
}

const selectTab = (type: SearchType) => {
  selectedType.value = type
}

const selectTopic = (topic: string) => {
  searchQuery.value = topic
  searchInput.value?.focus()
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <div class="pb-6 border-b border-border-subtle">
      <Badge variant="accent" size="sm"><Sparkles class="w-3 h-3 mr-1" /> AI Learning Engine</Badge>
      <h1 class="text-2xl sm:text-3xl font-serif font-bold text-text-base mt-2">AI Tutor &amp; Resource Search</h1>
      <p class="text-sm text-text-muted mt-1 max-w-2xl">Search YouTube lessons and trusted web resources for any subject. Choose a source or search both at once.</p>
    </div>

    <Card padding="lg" class="space-y-5 shadow-sm border-border-subtle">
      <form @submit.prevent="handleSearch" class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input ref="searchInput" v-model="searchQuery" type="search" maxlength="300" required placeholder="Search a topic, course unit, or question…" class="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border-subtle text-text-base placeholder:text-text-muted/60 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors" />
        </div>
        <Button variant="primary" size="md" type="submit" :loading="isLoading" :disabled="!searchQuery.trim()" class="shrink-0">
          <Sparkles class="w-4 h-4 " /><span>Search resources</span>
        </Button>
      </form>

      <div v-if="!hasSearched" class="pt-1">
        <span class="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">Suggested topics</span>
        <div class="flex flex-wrap gap-2">
          <button v-for="topic in ['Dynamic Programming in Python', 'Organic Chemistry Reaction Mechanisms', 'Macroeconomics: Monetary Policy', 'Linear Algebra: Eigenvectors', 'Cell Biology: Mitosis']" :key="topic" type="button" @click="selectTopic(topic)" class="text-xs px-2.5 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-hover text-text-base border border-border-subtle transition-colors cursor-pointer">{{ topic }}</button>
        </div>
      </div>
    </Card>

    <section v-if="hasSearched" class="space-y-5" aria-live="polite">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-text-base truncate">Results for “{{ searchQuery.trim() }}”</h2>
          <p v-if="!isLoading && results" class="text-xs text-text-muted mt-1">{{ visibleResultCount }} {{ visibleResultCount === 1 ? 'result' : 'results' }}</p>
        </div>
        <div class="inline-flex p-1 rounded-xl bg-surface-muted border border-border-subtle self-start sm:self-auto" role="tablist" aria-label="Search source">
          <button v-for="tab in tabs" :key="tab.id" type="button" role="tab" :aria-selected="selectedType === tab.id" @click="selectTab(tab.id)" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer" :class="selectedType === tab.id ? 'bg-accent/15 border border-accent/20 text-accent' : 'border border-transparent text-text-muted hover:text-text-base'">
            <component :is="tab.icon" class="w-3.5 h-3.5" />{{ tab.label }}
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="p-4 rounded-xl border border-danger/25 bg-danger/10 text-sm text-text-base flex items-start gap-3">
        <AlertCircle class="w-4 h-4 text-danger shrink-0 mt-0.5" />
        <div class="flex-1"><p>{{ errorMessage }}</p><button type="button" @click="handleSearch" class="mt-2 text-xs font-semibold text-danger hover:underline">Try again</button></div>
      </div>

      <div v-else-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label="Loading results">
        <div v-for="n in 4" :key="n" class="h-48 rounded-2xl bg-surface-muted animate-pulse" />
      </div>

      <template v-else-if="results">
        <div v-if="(selectedType === 'all' && (!results.providers.youtube.ok || !results.providers.tavily.ok)) || (selectedType === 'videos' && !results.providers.youtube.ok) || (selectedType === 'web' && !results.providers.tavily.ok)" class="p-3 rounded-xl border border-accent/25 bg-accent/10 text-xs text-text-base">
          Some results could not be loaded: <span v-if="(selectedType === 'all' || selectedType === 'videos') && !results.providers.youtube.ok">{{ results.providers.youtube.error }}</span><span v-if="selectedType === 'all' && !results.providers.youtube.ok && !results.providers.tavily.ok"> · </span><span v-if="(selectedType === 'all' || selectedType === 'web') && !results.providers.tavily.ok">{{ results.providers.tavily.error }}</span>
        </div>

        <div v-if="visibleResultCount === 0" class="py-12 px-4 text-center rounded-2xl border border-dashed border-border-subtle">
          <Search class="w-7 h-7 mx-auto text-accent mb-3" />
          <h3 class="font-semibold text-text-base">No results found</h3>
          <p class="text-sm text-text-muted mt-1">Try a broader search phrase or select another source.</p>
        </div>

        <div v-else-if="selectedType === 'videos'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <YouTubeResultCard v-for="video in videos" :key="video.id" :result="video" />
        </div>
        <div v-else-if="selectedType === 'web'" class="grid grid-cols-1 gap-3">
          <WebResultCard v-for="(result, index) in webResults" :key="result.url + index" :result="result" />
        </div>
        <div v-else class="space-y-8">
          <section v-if="videos.length" class="space-y-3">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-text-base"><Youtube class="w-4 h-4 text-danger" /> Video lessons</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><YouTubeResultCard v-for="video in videos" :key="video.id" :result="video" /></div>
          </section>
          <section v-if="webResults.length" class="space-y-3">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-text-base"><Globe2 class="w-4 h-4 text-accent" /> Web resources</h3>
            <div class="grid grid-cols-1 gap-3"><WebResultCard v-for="(result, index) in webResults" :key="result.url + index" :result="result" /></div>
          </section>
        </div>
      </template>
    </section>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card padding="md" class="space-y-2"><div class="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><BookOpen class="w-4 h-4" /></div><h3 class="text-sm font-semibold text-text-base">Explore the subject</h3><p class="text-xs text-text-muted leading-relaxed">Find clear explanations and useful resources for the concepts you are learning.</p></Card>
      <Card padding="md" class="space-y-2"><div class="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><Compass class="w-4 h-4" /></div><h3 class="text-sm font-semibold text-text-base">Learn from multiple sources</h3><p class="text-xs text-text-muted leading-relaxed">Compare curated video lessons with relevant web references in one search.</p></Card>
    </div>
  </div>
</template>
