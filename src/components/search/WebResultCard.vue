<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import type { WebSearchResult } from '@/services/api'

defineProps<{ result: WebSearchResult }>()
</script>

<template>
  <article class="p-4 sm:p-5 rounded-2xl border border-border-subtle bg-surface-card transition-colors hover:border-border-hover">
    <a :href="result.url" target="_blank" rel="noopener noreferrer" class="group inline-flex items-start gap-2 text-sm font-semibold text-text-base hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
      <span class="line-clamp-2">{{ result.title }}</span>
      <ExternalLink class="w-3.5 h-3.5 mt-0.5 shrink-0 text-text-muted group-hover:text-accent" />
    </a>
    <p class="mt-1 text-[11px] text-success truncate">{{ result.url }}</p>
    <p class="mt-3 text-xs sm:text-sm text-text-muted leading-relaxed line-clamp-4">{{ result.content }}</p>
  </article>
</template>
