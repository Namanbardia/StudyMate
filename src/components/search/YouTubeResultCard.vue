<script setup lang="ts">
import type { YouTubeSearchResult } from '@/services/api'

defineProps<{ result: YouTubeSearchResult }>()
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card transition-colors hover:border-border-hover">
    <a :href="result.url" target="_blank" rel="noopener noreferrer" class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <div class="aspect-video bg-surface-muted overflow-hidden">
        <img v-if="result.thumbnail" :src="result.thumbnail" :alt="`Thumbnail for ${result.title}`" loading="lazy" class="w-full h-full object-cover" />
        <div v-else class="w-full h-full grid place-items-center text-text-muted text-sm">Video preview unavailable</div>
      </div>
      <div class="p-4 space-y-2">
        <h3 class="font-semibold text-sm text-text-base line-clamp-2">{{ result.title }}</h3>
        <p class="text-xs text-accent font-medium truncate">{{ result.channel }}</p>
        <p class="text-xs text-text-muted line-clamp-3 leading-relaxed">{{ result.description }}</p>
        <time v-if="result.publishedAt" :datetime="result.publishedAt" class="block text-[11px] text-text-muted">{{ new Date(result.publishedAt).toLocaleDateString() }}</time>
      </div>
    </a>
  </article>
</template>
