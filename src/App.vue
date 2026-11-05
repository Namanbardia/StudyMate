<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'

// Initialize and bind theme watcher
useTheme()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg-base text-text-base antialiased transition-colors duration-200">
    <Navbar />

    <div class="flex-1 w-full">
      <RouterView />
    </div>

    <Footer />
  </div>
</template>

