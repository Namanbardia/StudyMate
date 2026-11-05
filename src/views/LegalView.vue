<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'

const route = useRoute()

const handleContactSubmit = () => {
  window.alert('Thank you! Your inquiry has been submitted. Our team will follow up via email.')
}

const viewType = computed(() => {
  if (route.path.includes('privacy')) return 'privacy'
  if (route.path.includes('contact')) return 'contact'
  if (route.path.includes('faq')) return 'faq'
  if (route.path.includes('guides')) return 'guides'
  if (route.path.includes('safety')) return 'safety'
  return 'terms'
})

const pageInfo = computed(() => {
  switch (viewType.value) {
    case 'privacy':
      return {
        title: 'Privacy Policy',
        tag: 'Data Protection & Security',
        summary: 'How StudyMate AI collects, uses, and safeguards student information.',
        updated: 'November 2026'
      }
    case 'contact':
      return {
        title: 'Contact Support',
        tag: 'Student Helpdesk',
        summary: 'Have questions, syllabus feedback, or account inquiries? Our team is here to assist.',
        updated: 'Response within 24 hours'
      }
    case 'faq':
      return {
        title: 'Student Frequently Asked Questions',
        tag: 'Knowledge Base',
        summary: 'Common queries about free usage limits, study planners, and source attribution.',
        updated: 'Frequently Updated'
      }
    case 'guides':
      return {
        title: 'Academic Study Guides',
        tag: 'Study Techniques',
        summary: 'Evidence-based methods: Spaced repetition, active recall, and Coffman condition breakdowns.',
        updated: 'Curated by Educators'
      }
    case 'safety':
      return {
        title: 'Usage Limits & Academic Integrity',
        tag: 'Fair Use & Safety',
        summary: 'Guidelines on rate limits, authentic learning, and responsible AI usage.',
        updated: 'Version 1.0'
      }
    case 'terms':
    default:
      return {
        title: 'Terms of Service',
        tag: 'User Agreement',
        summary: 'General terms and conditions for using StudyMate AI services.',
        updated: 'November 2026'
      }
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-base mb-8 transition-colors"
    >
      <ArrowLeft class="w-3.5 h-3.5" />
      <span>Back to Homepage</span>
    </RouterLink>

    <div class="mb-8 pb-6 border-b border-border-subtle">
      <Badge variant="accent" class="mb-3">
        {{ pageInfo.tag }}
      </Badge>
      <h1 class="text-3xl sm:text-4xl font-serif font-bold text-text-base">
        {{ pageInfo.title }}
      </h1>
      <p class="text-sm sm:text-base text-text-muted mt-2 leading-relaxed">
        {{ pageInfo.summary }}
      </p>
      <span class="inline-block text-xs text-text-muted font-mono mt-3">
        Status: {{ pageInfo.updated }}
      </span>
    </div>

    <!-- Contact specific form/content -->
    <div v-if="viewType === 'contact'" class="space-y-6">
      <Card padding="lg">
        <h3 class="text-base font-bold text-text-base mb-4">Send a message to our academic team</h3>
        <form @submit.prevent="handleContactSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1.5">Your Name</label>
            <input type="text" required placeholder="Alex Student" class="w-full bg-surface text-text-base text-sm border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1.5">Email Address</label>
            <input type="email" required placeholder="alex@university.edu" class="w-full bg-surface text-text-base text-sm border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1.5">Subject</label>
            <input type="text" required placeholder="Feature feedback / syllabus suggestion" class="w-full bg-surface text-text-base text-sm border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-muted mb-1.5">Message</label>
            <textarea rows="4" required placeholder="Describe your question or suggestion in detail..." class="w-full bg-surface text-text-base text-sm border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent"></textarea>
          </div>
          <Button type="submit" variant="primary" size="md">
            <span>Send Message</span>
          </Button>
        </form>
      </Card>
    </div>

    <!-- Legal & Terms content -->
    <div v-else class="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm text-text-muted leading-relaxed">
      <Card padding="lg" class="space-y-4">
        <h3 class="text-base font-bold text-text-base">1. Academic Purpose &amp; Educational Intent</h3>
        <p>
          StudyMate AI is designed strictly to facilitate student comprehension, syllabus roadmap planning, and resource discovery. It is not intended for academic dishonesty, unauthorized code generation during proctored exams, or bypassing institutional standards.
        </p>

        <h3 class="text-base font-bold text-text-base pt-2">2. Resource Curation &amp; Verified Attribution</h3>
        <p>
          Our platform synthesizes resources strictly using verified public metadata from video services (such as YouTube Data API) and authoritative documentation platforms. StudyMate AI does not claim ownership of external educational content.
        </p>

        <h3 class="text-base font-bold text-text-base pt-2">3. Account Ownership &amp; Privacy</h3>
        <p>
          Student accounts are securely authenticated via Firebase. StudyMate does not sell personal browsing records or student study habits to third-party ad brokers. Uploaded notes are processed securely solely for summarization and quiz generation.
        </p>

        <h3 class="text-base font-bold text-text-base pt-2">4. Free Tier &amp; Rate Limits</h3>
        <p>
          To maintain zero operating abuse and preserve fair access for all students, monthly limits on AI searches and note summarizations apply as detailed in our pricing specification.
        </p>
      </Card>
    </div>
  </div>
</template>
