<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Sun, Moon, Monitor, Check } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/types'

const { theme, setTheme } = useTheme()
const isOpen = ref(false)
const toggleRef = ref<HTMLElement | null>(null)

const options: Array<{ label: string; value: ThemeMode; icon: typeof Sun }> = [
  { label: 'Light', value: 'light', icon: Sun },
  { label: 'Dark', value: 'dark', icon: Moon },
  { label: 'System', value: 'system', icon: Monitor }
]

const selectTheme = (val: ThemeMode) => {
  setTheme(val)
  isOpen.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  if (toggleRef.value && !toggleRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="toggleRef" class="relative inline-block text-left">
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="inline-flex items-center justify-center p-2 rounded-xl text-text-muted hover:text-text-base hover:bg-surface-muted border border-transparent hover:border-border-subtle transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      :aria-label="`Current theme: ${theme}. Click to change.`"
      :aria-expanded="isOpen"
    >
      <Sun v-if="theme === 'light'" class="w-4 h-4 text-accent" />
      <Moon v-else-if="theme === 'dark'" class="w-4 h-4 text-accent" />
      <Monitor v-else class="w-4 h-4" />
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-surface border border-border-subtle shadow-lg py-1.5 z-50 text-xs focus:outline-none"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          @click="selectTheme(opt.value)"
          class="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-muted transition-colors cursor-pointer"
          :class="theme === opt.value ? 'font-semibold text-text-base' : 'text-text-muted'"
        >
          <span class="flex items-center gap-2">
            <component :is="opt.icon" class="w-3.5 h-3.5" />
            <span>{{ opt.label }}</span>
          </span>
          <Check v-if="theme === opt.value" class="w-3.5 h-3.5 text-accent" />
        </button>
      </div>
    </Transition>
  </div>
</template>
