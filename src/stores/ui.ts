import { defineStore } from 'pinia'

const SIDEBAR_COLLAPSED_KEY = 'studymate:sidebar:collapsed'

export const useUIStore = defineStore('ui', {
  state: () => ({
    // Mobile slide-out drawer state
    sidebarMobileOpen: false,
    // Desktop collapse state: false = expanded (280px), true = collapsed (80px)
    sidebarCollapsed: false,
    _hasInitializedSidebar: false
  }),
  actions: {
    toggleMobileSidebar() {
      this.sidebarMobileOpen = !this.sidebarMobileOpen
    },
    closeMobileSidebar() {
      this.sidebarMobileOpen = false
    },
    openMobileSidebar() {
      this.sidebarMobileOpen = true
    },
    toggleSidebarCollapse() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      this.persistSidebarState()
    },
    setSidebarCollapsed(val: boolean) {
      this.sidebarCollapsed = val
      this.persistSidebarState()
    },
    persistSidebarState() {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(this.sidebarCollapsed))
      }
    },
    initSidebarFromStorage() {
      if (this._hasInitializedSidebar || typeof window === 'undefined') return
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored !== null) {
        this.sidebarCollapsed = stored === 'true'
      }
      this._hasInitializedSidebar = true
    }
  }
})