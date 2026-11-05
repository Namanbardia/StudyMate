<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  hoverable?: boolean
  muted?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  muted: false,
  padding: 'md'
})

const paddingClass = computed(() => {
  switch (props.padding) {
    case 'none':
      return 'p-0'
    case 'sm':
      return 'p-4'
    case 'lg':
      return 'p-8 sm:p-10'
    case 'md':
    default:
      return 'p-6 sm:p-7'
  }
})
</script>

<template>
  <div
    class="rounded-2xl border transition-all duration-200"
    :class="[
      muted ? 'bg-surface-muted border-border-subtle' : 'bg-surface border-border-subtle',
      hoverable ? 'hover:border-border-hover hover:shadow-sm hover:-translate-y-0.5' : '',
      paddingClass
    ]"
  >
    <slot />
  </div>
</template>

