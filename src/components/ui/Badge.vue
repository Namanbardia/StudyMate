<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'muted' | 'outline'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm'
})

const classes = computed(() => {
  const base = 'inline-flex items-center font-medium rounded-full select-none'
  const sizeClasses = props.size === 'sm' ? 'text-xs px-2.5 py-0.5 gap-1' : 'text-xs px-3 py-1 gap-1.5'

  let variantClasses = ''
  switch (props.variant) {
    case 'accent':
      variantClasses = 'bg-accent/15 text-accent border border-accent/25'
      break
    case 'success':
      variantClasses = 'bg-success/15 text-success border border-success/25'
      break
    case 'danger':
      variantClasses = 'bg-danger/15 text-danger border border-danger/25'
      break
    case 'muted':
      variantClasses = 'bg-surface-muted text-text-muted border border-border-subtle'
      break
    case 'outline':
      variantClasses = 'border border-border-subtle text-text-base bg-transparent'
      break
    case 'default':
    default:
      variantClasses = 'bg-surface-muted text-text-base border border-border-subtle'
      break
  }

  return [base, sizeClasses, variantClasses]
})
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

