<script setup lang="ts">
import { Check, Sparkles, AlertCircle, ArrowRight } from 'lucide-vue-next'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import type { PricingPlan } from '@/types'

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    price: '₹0',
    billing: 'forever free',
    statusLabel: 'Always Available',
    description: 'Essential learning search and basic study organization for every student.',
    features: [
      'Basic AI learning search (with monthly usage allowance)',
      'Curated video and article resource discovery',
      'Recent search history and basic resource bookmarks',
      'Concise conceptual breakdowns and takeaways',
      'Core student dashboard overview'
    ],
    buttonText: 'Get Started Free',
    buttonVariant: 'outline'
  },
  {
    id: 'premium',
    name: 'Student Pro',
    price: '₹79',
    billing: 'per month',
    isPopular: true,
    statusLabel: 'Proposed Pricing',
    description: 'Full AI study copilot with intelligent day-wise planning, notes synthesis, and quizzes.',
    features: [
      'Everything in Free Starter',
      'Personalized AI Study Planner with day-wise milestones',
      'Custom time-wise daily study schedules',
      'Notes Summarizer for PDFs, slides, and lecture notes',
      'AI Quiz Generator with active recall and explanations',
      'Subject-level progress analytics and completion tracking',
      'Expanded AI credit allowance and priority processing'
    ],
    buttonText: 'Start with Student Pro',
    buttonVariant: 'primary'
  }
]
</script>

<template>
  <section id="pricing" class="py-20 sm:py-28 bg-surface-muted/30 border-y border-border-subtle transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="max-w-3xl mx-auto text-center mb-14 sm:mb-16">
        <Badge variant="accent" class="mb-4">
          Simple, Student-Friendly Pricing
        </Badge>
        <h2 class="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-text-base mb-4">
          Transparent plans built for students
        </h2>
        <p class="text-base sm:text-lg text-text-muted leading-relaxed">
          No hidden fees or predatory lock-ins. Explore for free, or upgrade to unlocked planning and summaries.
        </p>

        <!-- Proposed Notice Pill -->
        <div class="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-xs text-text-muted">
          <AlertCircle class="w-3.5 h-3.5 text-accent shrink-0" />
          <span>Note: Pricing is proposed for the upcoming MVP launch and will be finalized before payment activation.</span>
        </div>
      </div>

      <!-- Pricing Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="relative flex flex-col justify-between p-7 sm:p-9 rounded-2xl bg-surface border transition-all duration-200"
          :class="plan.isPopular ? 'border-accent shadow-md ring-1 ring-accent/30' : 'border-border-subtle hover:border-border-hover'"
        >
          <!-- Popular Pill -->
          <div
            v-if="plan.isPopular"
            class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-primary-fg text-xs font-semibold uppercase tracking-wider shadow-xs flex items-center gap-1.5"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>Recommended for Exams</span>
          </div>

          <div>
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-text-base">
                {{ plan.name }}
              </h3>
              <Badge :variant="plan.isPopular ? 'accent' : 'muted'" size="sm">
                {{ plan.statusLabel }}
              </Badge>
            </div>

            <!-- Price -->
            <div class="flex items-baseline gap-1.5 mb-4">
              <span class="text-4xl sm:text-5xl font-serif font-bold text-text-base">
                {{ plan.price }}
              </span>
              <span class="text-xs text-text-muted font-medium">
                / {{ plan.billing }}
              </span>
            </div>

            <p class="text-xs sm:text-sm text-text-muted leading-relaxed mb-6 pb-6 border-b border-border-subtle">
              {{ plan.description }}
            </p>

            <!-- Features List -->
            <div class="space-y-3 mb-8">
              <p class="text-xs font-semibold uppercase tracking-wider text-text-base">
                Included Features:
              </p>
              <ul class="space-y-2.5">
                <li
                  v-for="(feature, fIdx) in plan.features"
                  :key="fIdx"
                  class="flex items-start gap-2.5 text-xs sm:text-sm text-text-base"
                >
                  <Check class="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- CTA Button -->
          <div class="pt-6 border-t border-border-subtle">
            <Button
              :variant="plan.buttonVariant"
              full-width
              size="lg"
              :to="`/signup?plan=${plan.id}`"
            >
              <span>{{ plan.buttonText }}</span>
              <ArrowRight class="w-4 h-4 ml-1" />
            </Button>
            <p class="text-center text-[11px] text-text-muted mt-2.5">
              {{ plan.id === 'free' ? 'No credit card required' : 'Proposed MVP rate &bull; 14-day refund policy upon launch' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
