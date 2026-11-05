<script setup lang="ts">
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const emit = defineEmits<{
  (e: 'demoSearch'): void
}>()
</script>

<template>
  <section class="py-20 sm:py-28 transition-colors">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative rounded-3xl bg-surface border border-border-subtle p-8 sm:p-14 text-center overflow-hidden shadow-sm">
        <!-- Ambient background glow -->
        <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 blur-3xl rounded-full pointer-events-none -z-10" />

        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-muted border border-border-subtle mb-6">
          <Sparkles class="w-3.5 h-3.5 text-accent" />
          <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Start Today</span>
        </div>

        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-text-base tracking-tight mb-4 max-w-2xl mx-auto">
          Stop bookmarking tabs you'll never open. <br />
          <span class="italic font-normal">Start learning with clarity.</span>
        </h2>

        <p class="text-base sm:text-lg text-text-muted max-w-xl mx-auto mb-8 leading-relaxed">
          Create your free StudyMate account today. Search any topic, discover structured resources, and follow a realistic study plan.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
          <Button
            variant="primary"
            size="lg"
            to="/signup"
            class="w-full sm:w-auto"
          >
            <span>Get Started for Free</span>
            <ArrowRight class="w-4 h-4 ml-1" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            @click="emit('demoSearch')"
            class="w-full sm:w-auto"
          >
            <span>Explore Interactive Demo</span>
          </Button>
        </div>

        <!-- Trust Points -->
        <div class="flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs text-text-muted pt-6 border-t border-border-subtle/60">
          <div class="flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-success" />
            <span>Forever Free Starter Tier</span>
          </div>
          <div class="flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-success" />
            <span>No Credit Card Required</span>
          </div>
          <div class="flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-success" />
            <span>Real Verified Academic Sources</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
