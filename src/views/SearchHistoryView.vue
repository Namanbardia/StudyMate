<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  ChevronRight,
  X,
  History,
  RotateCcw,
  Trash2
} from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import Modal from '@/components/ui/Modal.vue'
import { useAuthStore } from '@/stores/auth'
import { getSearchHistory, type SearchHistoryEntry, getSearchHistoryEntry, deleteSearchHistoryEntry } from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()

const searchHistory = ref<SearchHistoryEntry[]>([])
const isLoading = ref(true)
const isLoadingMore = ref(false)
const error = ref<string | null>(null)
const cursor = ref<string | undefined>(undefined)
const hasMore = ref(true)

// Delete confirmation modal state
const deleteModalOpen = ref(false)
const deleteTargetId = ref<string | null>(null)
const isDeleting = ref(false)

const loadSearchHistory = async (append = false) => {
  if (!authStore.isAuthenticated) return
  if (!authStore.isAuthenticated) return
  if (append) {
    isLoadingMore.value = true
  } else {
    isLoading.value = true
    cursor.value = undefined
    hasMore.value = true
    searchHistory.value = []
  }
  error.value = null
  try {
    const response = await getSearchHistory(20, cursor.value)
    const newEntries = response.history || []
    if (append) {
      searchHistory.value.push(...newEntries)
    } else {
      searchHistory.value = newEntries
    }
    cursor.value = response.cursor
    hasMore.value = !!response.cursor
  } catch (err) {
    console.warn('[SearchHistory] Failed to load:', err)
    error.value = 'Failed to load search history'
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

onMounted(() => {
  loadSearchHistory()
})

const formatSearchDate = (timestamp: number): string => {
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatFullDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const handleSearchClick = async (entry: SearchHistoryEntry) => {
  try {
    // Try to get full entry with results
    const response = await getSearchHistoryEntry(entry.id)
    if (response.success && response.entry) {
      // Navigate with restore parameter
      await router.push({ path: '/search', query: { restore: entry.id } })
      return
    }
  } catch (e) {
    // Fallback below
  }
  // Fallback: navigate with query params
  await router.push({ path: '/search', query: { q: entry.query, type: entry.search_type } })
}

const clearAllHistory = async () => {
  if (!confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
    return
  }
  // Note: Backend doesn't have a clear endpoint yet, but we can clear locally
  searchHistory.value = []
  hasMore.value = false
}

const openDeleteModal = (id: string, event: Event) => {
  event.stopPropagation()
  deleteTargetId.value = id
  deleteModalOpen.value = true
}

const confirmDelete = async () => {
  if (!deleteTargetId.value || isDeleting.value) return
  isDeleting.value = true
  try {
    await deleteSearchHistoryEntry(deleteTargetId.value)
    searchHistory.value = searchHistory.value.filter(entry => entry.id !== deleteTargetId.value)
  } catch (err) {
    console.warn('[SearchHistory] Failed to delete entry:', err)
  } finally {
    isDeleting.value = false
    deleteModalOpen.value = false
    deleteTargetId.value = null
  }
}

const cancelDelete = () => {
  if (isDeleting.value) return
  deleteModalOpen.value = false
  deleteTargetId.value = null
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
    <div class="pb-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
          <History class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-text-base">Search History</h1>
          <p class="text-sm text-text-muted mt-1">Your previous searches and results</p>
        </div>
      </div>
      <div v-if="searchHistory.length > 0" class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="clearAllHistory">
          <X class="w-3.5 h-3.5 mr-1.5" />
          <span>Clear All</span>
        </Button>
      </div>
    </div>

    <Card padding="lg" class="shadow-sm border-border-subtle">
      <div v-if="isLoading && searchHistory.length === 0" class="space-y-4">
        <div v-for="n in 5" :key="n" class="h-20 rounded-xl bg-surface-muted animate-pulse" />
      </div>

      <div v-else-if="error" class="p-6 rounded-xl border border-danger/25 bg-danger/10 text-center">
        <X class="w-8 h-8 text-danger mx-auto mb-2" />
        <p class="text-text-base">{{ error }}</p>
        <Button variant="primary" size="sm" @click="() => loadSearchHistory(false)" class="mt-4">
          <RotateCcw class="w-3.5 h-3.5 mr-1.5" />
          <span>Retry</span>
        </Button>
      </div>

      <div v-else-if="searchHistory.length === 0" class="py-12 text-center">
        <Search class="w-12 h-12 mx-auto text-text-muted/30 mb-4" />
        <h3 class="text-lg font-semibold text-text-base mb-2">No search history yet</h3>
        <p class="text-sm text-text-muted mb-6 max-w-md mx-auto">
          Your searches will appear here automatically. Start exploring topics to build your history.
        </p>
        <Button variant="primary" size="md" to="/search">
          <Search class="w-4 h-4 mr-2" />
          <span>Search Now</span>
        </Button>
      </div>

      <ul v-else class="space-y-3" role="list" aria-label="Search history">
        <li v-for="entry in searchHistory" :key="entry.id" class="relative group">
          <button
            type="button"
            @click="handleSearchClick(entry)"
            class="w-full flex items-start gap-4 p-4 pr-14 rounded-xl border border-border-subtle hover:bg-surface-muted hover:border-accent/30 transition-all duration-200 text-left"
          >
            <div class="flex items-center justify-center w-11 h-11 rounded-lg bg-accent/10 text-accent shrink-0">
              <Search class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-base font-medium text-text-base truncate mb-1">{{ entry.query }}</p>
              <div class="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <Badge variant="muted" size="sm">{{ entry.search_type }}</Badge>
                <time :datetime="new Date(entry.created_at * 1000).toISOString()">
                  {{ formatFullDate(entry.created_at) }}
                </time>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <ChevronRight class="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
              <span class="text-[10px] text-text-muted">{{ formatSearchDate(entry.created_at) }}</span>
            </div>
          </button>
          <button
            type="button"
            @click="openDeleteModal(entry.id, $event)"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete search history entry"
            :disabled="isDeleting"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </li>
      </ul>

      <div v-if="hasMore" class="mt-6 text-center">
        <Button
          variant="outline"
          size="md"
          @click="() => loadSearchHistory(true)"
          :loading="isLoadingMore"
          :disabled="isLoadingMore"
          full-width
        >
          <span>Load More</span>
          <ChevronRight class="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  </div>

  <!-- Delete Confirmation Modal -->
  <Modal :open="deleteModalOpen" @close="cancelDelete" title="Delete Search?" maxWidth="sm" :description="undefined">
    <p class="text-text-base text-sm">Are you sure you want to delete this search from your history?</p>
    <template #footer>
      <Button variant="outline" size="sm" @click="cancelDelete" :disabled="isDeleting" class="cursor-pointer">
        Cancel
      </Button>
      <Button variant="secondary" size="sm" @click="confirmDelete" :loading="isDeleting" :disabled="isDeleting" class="bg-danger/10 text-danger hover:text-danger hover:bg-danger/10 cursor-pointer">
        Delete
      </Button>
    </template>
  </Modal>
</template>