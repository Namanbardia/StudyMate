<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  open: boolean
  title?: string
  description?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: '',
  description: '',
  maxWidth: '2xl'
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) {
    emit('close')
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeydown)
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', handleKeydown)
  }
})

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl'
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-xs"
        @click.self="emit('close')"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="w-full bg-surface border border-border-subtle rounded-2xl shadow-xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
          :class="maxWidthClasses[maxWidth]"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4.5 border-b border-border-subtle shrink-0">
            <div>
              <h3 v-if="title" class="text-base font-semibold text-text-base">
                {{ title }}
              </h3>
              <p v-if="description" class="text-xs text-text-muted mt-0.5">
                {{ description }}
              </p>
            </div>
            <button
              type="button"
              @click="emit('close')"
              class="p-1.5 rounded-lg text-text-muted hover:text-text-base hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto flex-1">
            <slot />
          </div>

          <!-- Footer slot if provided -->
          <div
            v-if="$slots.footer"
            class="px-6 py-4 bg-surface-muted/50 border-t border-border-subtle flex items-center justify-end gap-3 shrink-0"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

