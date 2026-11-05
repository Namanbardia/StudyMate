import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    // Mobile slide-out drawer state
    sidebarMobileOpen: false,
    // Desktop collapse state: false = expanded (260px), true = collapsed (68px)
    sidebarCollapsed: false
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
    },
    setSidebarCollapsed(val: boolean) {
      this.sidebarCollapsed = val
    }
  }
})
