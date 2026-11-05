<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  href?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
  fullWidth: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary text-primary-fg hover:opacity-90 active:scale-[0.98] shadow-xs'
    case 'secondary':
      return 'bg-surface-muted text-text-base hover:bg-surface-hover active:scale-[0.98]'
    case 'outline':
      return 'border border-border-subtle bg-surface text-text-base hover:bg-surface-hover hover:border-border-hover active:scale-[0.98]'
    case 'ghost':
      return 'text-text-base hover:bg-surface-muted active:scale-[0.98]'
    case 'accent':
      return 'bg-accent text-primary-fg hover:opacity-90 active:scale-[0.98]'
    default:
      return 'bg-primary text-primary-fg'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs px-3 py-1.5 rounded-lg gap-1.5'
    case 'lg':
      return 'text-base px-6 py-3 rounded-xl gap-2.5 font-semibold'
    case 'md':
    default:
      return 'text-sm px-4 py-2.5 rounded-xl gap-2'
  }
})

const widthClass = computed(() => (props.fullWidth ? 'w-full' : ''))

const handleClick = (e: MouseEvent) => {
  if (props.disabled || props.loading) {
    e.preventDefault()
    return
  }
  emit('click', e)
}
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    :class="[baseClasses, variantClasses, sizeClasses, widthClass]"
    @click="handleClick"
  >
    <span v-if="loading" class="animate-spin mr-2">◌</span>
    <slot />
  </RouterLink>

  <a
    v-else-if="href"
    :href="href"
    :class="[baseClasses, variantClasses, sizeClasses, widthClass]"
    @click="handleClick"
  >
    <span v-if="loading" class="animate-spin mr-2">◌</span>
    <slot />
  </a>

  <button
    v-else
    :type="type"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses, widthClass]"
    @click="handleClick"
  >
    <span v-if="loading" class="animate-spin mr-2">◌</span>
    <slot />
  </button>
</template>

