<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Sparkles, Heart } from 'lucide-vue-next'

const currentYear = new Date().getFullYear()

const productLinks = [
  { label: 'AI Learning Search', href: '/#features' },
  { label: 'Personalized Study Planner', href: '/#features' },
  { label: 'Notes Summarizer', href: '/#features' },
  { label: 'AI Quiz Generator', href: '/#features' },
  { label: 'Progress Tracking', href: '/#features' },
  { label: 'Pricing Plans', href: '/#pricing' }
]

const resourceLinks = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Student FAQ', href: '/faq' },
  { label: 'Study Guides', href: '/guides' },
  { label: 'Syllabus Integrations', href: '/integrations' }
]

const legalLinks = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Contact Support', href: '/contact' },
  { label: 'Usage Limits & Safety', href: '/safety' }
]
</script>

<template>
  <footer class="w-full bg-surface-muted/60 border-t border-border-subtle pt-16 pb-12 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
        <!-- Brand column -->
        <div class="lg:col-span-2 space-y-4">
          <RouterLink
            to="/"
            class="flex items-center gap-2.5 inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
          >
            <div class="w-8 h-8 rounded-xl bg-primary text-primary-fg flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles class="w-4 h-4 text-accent" />
            </div>
            <span class="font-bold text-lg tracking-tight text-text-base">
              StudyMate <span class="text-xs px-1.5 py-0.5 font-mono font-medium rounded-md bg-accent/15 text-accent border border-accent/25">AI</span>
            </span>
          </RouterLink>

          <p class="text-sm text-text-muted leading-relaxed max-w-sm">
            Learn Smarter. Plan Better. Achieve More. An academic-first learning copilot organizing verified YouTube videos, documentation, study plans, and smart quizzes into one focused space.
          </p>

          <div class="pt-2 flex items-center gap-2 text-xs text-text-muted">
            <span class="inline-block w-2 h-2 rounded-full bg-success"></span>
            <span>All systems operational &bull; Built with Cloudflare &amp; Vue 3</span>
          </div>
        </div>

        <!-- Product links -->
        <div class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-text-base">
            Product
          </h4>
          <ul class="space-y-2 text-sm">
            <li v-for="item in productLinks" :key="item.label">
              <a
                :href="item.href"
                class="text-text-muted hover:text-text-base transition-colors"
              >
                {{ item.label }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Resources -->
        <div class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-text-base">
            Resources
          </h4>
          <ul class="space-y-2 text-sm">
            <li v-for="item in resourceLinks" :key="item.label">
              <RouterLink
                :to="item.href"
                class="text-text-muted hover:text-text-base transition-colors"
              >
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Legal & Support -->
        <div class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-text-base">
            Legal &amp; Support
          </h4>
          <ul class="space-y-2 text-sm">
            <li v-for="item in legalLinks" :key="item.label">
              <RouterLink
                :to="item.href"
                class="text-text-muted hover:text-text-base transition-colors"
              >
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
        <p>
          &copy; {{ currentYear }} StudyMate AI. All rights reserved. Designed for student focus.
        </p>
        <div class="flex items-center gap-1 text-text-muted">
          <span>Crafted with</span>
          <Heart class="w-3.5 h-3.5 text-accent fill-accent" />
          <span>for learners worldwide</span>
        </div>
      </div>
    </div>
  </footer>
</template>

