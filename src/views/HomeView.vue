<script setup lang="ts">
import { ref } from 'vue'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturesSection from '@/components/landing/FeaturesSection.vue'
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue'
import PricingSection from '@/components/landing/PricingSection.vue'
import CtaSection from '@/components/landing/CtaSection.vue'
import PreviewModal from '@/components/landing/PreviewModal.vue'

const isDemoOpen = ref(false)
const demoTopic = ref('Data Structures and Algorithms')

const openDemoModal = () => {
  demoTopic.value = 'Data Structures and Algorithms'
  isDemoOpen.value = true
}
</script>

<template>
  <main class="w-full">
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <PricingSection />
    <CtaSection @demo-search="openDemoModal" />

    <PreviewModal
      :open="isDemoOpen"
      :query="demoTopic"
      @close="isDemoOpen = false"
    />
  </main>
</template>

