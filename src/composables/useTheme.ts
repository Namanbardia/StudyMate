import { ref, computed, watch, onMounted } from 'vue'
import type { ThemeMode } from '@/types'

const THEME_STORAGE_KEY = 'studymate_theme'

// Shared state across all component instances
const theme = ref<ThemeMode>('system')
const systemPrefersDark = ref(false)

export function useTheme() {
  const isDark = computed(() => {
    if (theme.value === 'system') {
      return systemPrefersDark.value
    }
    return theme.value === 'dark'
  })

  const applyTheme = () => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (isDark.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const setTheme = (newTheme: ThemeMode) => {
    theme.value = newTheme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch (e) {
      console.warn('Failed to save theme in localStorage', e)
    }
    applyTheme()
  }

  const cycleTheme = () => {
    if (theme.value === 'light') setTheme('dark')
    else if (theme.value === 'dark') setTheme('system')
    else setTheme('light')
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemPrefersDark.value = mediaQuery.matches

      const listener = (e: MediaQueryListEvent) => {
        systemPrefersDark.value = e.matches
        if (theme.value === 'system') {
          applyTheme()
        }
      }

      mediaQuery.addEventListener('change', listener)

      try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          theme.value = stored
        }
      } catch (e) {
        console.warn('Failed to read theme from localStorage', e)
      }

      applyTheme()
    }
  })

  // Watch reactive changes
  watch(isDark, () => {
    applyTheme()
  })

  return {
    theme,
    isDark,
    setTheme,
    cycleTheme
  }
}

