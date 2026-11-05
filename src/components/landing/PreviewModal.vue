<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Sparkles,
  BookOpen,
  Youtube,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  Info
} from 'lucide-vue-next'
import Modal from '@/components/ui/Modal.vue'
import Badge from '@/components/ui/Badge.vue'
import Button from '@/components/ui/Button.vue'
import type { SearchPreviewPackage } from '@/types'

interface Props {
  open: boolean
  query: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeTab = ref<'overview' | 'videos' | 'docs' | 'quiz'>('overview')
const selectedQuizOption = ref<number | null>(null)
const isSaved = ref(false)

// Sample structured packages mapped to popular queries or fallback
const samplePackages: Record<string, SearchPreviewPackage> = {
  'Learn Python from scratch': {
    topic: 'Learn Python from Scratch',
    difficulty: 'Beginner',
    estimatedHours: '14 hrs total • 7 modules',
    summary: 'Python is a high-level, dynamically typed language known for its readable syntax. This foundational package covers basic data structures (lists, dicts, tuples), control flow, functions, file handling, and virtual environment setup.',
    keyTakeaways: [
      'Master fundamental syntax: indentation, variable scoping, and dynamic typing.',
      'Work comfortably with core data types: strings, lists, dictionaries, sets.',
      'Understand modular programming: creating reusable functions and importing libraries.',
      'Handle errors gracefully with try/except exception management.'
    ],
    videos: [
      {
        title: 'Python for Beginners – Full Course [2026 Edition]',
        channel: 'freeCodeCamp.org',
        duration: '4h 26m',
        verified: true
      },
      {
        title: 'Python Object-Oriented Programming (OOP) in Depth',
        channel: 'Corey Schafer',
        duration: '52m',
        verified: true
      },
      {
        title: '10 Python Tips & Tricks For Clean Production Code',
        channel: 'mCoding',
        duration: '18m',
        verified: true
      }
    ],
    readings: [
      {
        title: 'Official Python Tutorial – Documentation',
        source: 'docs.python.org',
        readTime: '25 min read',
        category: 'Official Docs'
      },
      {
        title: 'A Byte of Python – Beginner Friendly Guide',
        source: 'swaroopch.com',
        readTime: '40 min read',
        category: 'Guide'
      },
      {
        title: 'Real Python – The Real World of Python Data Structures',
        source: 'realpython.com',
        readTime: '15 min read',
        category: 'Deep Dive'
      }
    ],
    sampleQuiz: {
      question: 'Which of the following data types in Python is immutable?',
      options: ['List [1, 2, 3]', 'Dictionary {"key": "val"}', 'Tuple (1, 2, 3)', 'Set {1, 2, 3}'],
      correctIndex: 2,
      explanation: 'Tuples are immutable sequences in Python. Once declared, their elements and length cannot be modified.'
    }
  },
  'Operating System — Deadlocks': {
    topic: 'Operating Systems: Deadlock Characterization & Prevention',
    difficulty: 'Intermediate',
    estimatedHours: '5 hrs total • 3 modules',
    summary: 'A deadlock in operating systems is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process.',
    keyTakeaways: [
      'The 4 Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
      'Resource Allocation Graph (RAG) cycles and how to detect deadlock in single vs multi-resource systems.',
      "Banker's Algorithm: safe state calculation and resource request evaluation.",
      'Prevention vs Avoidance vs Detection & Recovery tradeoffs.'
    ],
    videos: [
      {
        title: 'Deadlock in Operating System – Coffman Conditions Explained',
        channel: 'Gate Smashers',
        duration: '14m 20s',
        verified: true
      },
      {
        title: "Banker's Algorithm with Solved Numerical Example",
        channel: 'Knowledge Gate',
        duration: '22m 10s',
        verified: true
      },
      {
        title: 'OS Process Synchronization & Deadlock Recovery',
        channel: 'NPTEL Computer Science',
        duration: '45m 00s',
        verified: true
      }
    ],
    readings: [
      {
        title: 'Operating System Concepts (Silberschatz) – Chapter 8 Summary',
        source: 'os-book.com',
        readTime: '30 min read',
        category: 'Textbook'
      },
      {
        title: 'Deadlock Detection and Banker’s Algorithm Illustrated',
        source: 'GeeksforGeeks OS Portal',
        readTime: '18 min read',
        category: 'Article'
      }
    ],
    sampleQuiz: {
      question: 'Which condition is NOT one of the 4 Coffman conditions required for a deadlock?',
      options: ['Mutual Exclusion', 'Preemptive Allocation', 'Hold and Wait', 'Circular Wait'],
      correctIndex: 1,
      explanation: 'No Preemption is the condition. If preemption is allowed, deadlocks cannot persist because resources can be forcibly taken back.'
    }
  },
  'Machine Learning — Regression': {
    topic: 'Machine Learning: Linear, Polynomial & Logistic Regression',
    difficulty: 'Intermediate',
    estimatedHours: '8 hrs total • 4 modules',
    summary: 'Regression analysis models the relationship between dependent target variables and one or more independent predictor features. Understand cost functions, gradient descent, bias-variance tradeoff, and regularizations (Lasso & Ridge).',
    keyTakeaways: [
      'Formulating Ordinary Least Squares (OLS) and Mean Squared Error (MSE).',
      'Batch, Mini-batch, and Stochastic Gradient Descent convergence.',
      'Overfitting mitigation with L1 (Lasso) and L2 (Ridge) penalties.',
      'Evaluating regression performance using R², Adjusted R², and RMSE.'
    ],
    videos: [
      {
        title: 'StatQuest: Linear Regression, Clearly Explained!',
        channel: 'StatQuest with Josh Starmer',
        duration: '27m 15s',
        verified: true
      },
      {
        title: 'Gradient Descent from Scratch in Python',
        channel: '3Blue1Brown',
        duration: '19m 40s',
        verified: true
      }
    ],
    readings: [
      {
        title: 'Scikit-Learn Generalized Linear Models Guide',
        source: 'scikit-learn.org',
        readTime: '22 min read',
        category: 'Official Docs'
      },
      {
        title: 'Understanding Regularization: Ridge vs Lasso',
        source: 'Towards Data Science',
        readTime: '12 min read',
        category: 'Article'
      }
    ],
    sampleQuiz: {
      question: 'Which regularization technique can drive feature coefficients strictly to zero, effectively performing feature selection?',
      options: ['L2 Ridge Regularization', 'L1 Lasso Regularization', 'Batch Normalization', 'Polynomial Expansion'],
      correctIndex: 1,
      explanation: 'L1 regularization (Lasso) uses the absolute sum of coefficients which forces irrelevant feature weights to zero, acting as automatic feature selection.'
    }
  },
  'Data Structures and Algorithms': {
    topic: 'Data Structures & Algorithms: Foundation & Patterns',
    difficulty: 'Intermediate',
    estimatedHours: '25 hrs total • 10 modules',
    summary: 'A structured breakdown of fundamental computational primitives: arrays, linked lists, hash tables, trees, heaps, graphs, plus core paradigms (sliding window, two-pointer, BFS/DFS, dynamic programming).',
    keyTakeaways: [
      'Big-O asymptotic time and space complexity evaluation.',
      'Hash table collision strategies and average O(1) lookups.',
      'Binary Search Trees (BST), AVL balance, and Heap properties.',
      'Graph representations (adjacency list vs matrix) and shortest path algorithms.'
    ],
    videos: [
      {
        title: 'Data Structures and Algorithms in 2026 – Full Roadmap',
        channel: 'NeetCode',
        duration: '34m 12s',
        verified: true
      },
      {
        title: 'Dynamic Programming: 7 Steps to Master Patterns',
        channel: 'TechLead / CS Dojo',
        duration: '42m 00s',
        verified: true
      }
    ],
    readings: [
      {
        title: 'Visualgo – Visualising Data Structures and Algorithms',
        source: 'visualgo.net',
        readTime: 'Interactive Lab',
        category: 'Interactive'
      },
      {
        title: 'CLRS Introduction to Algorithms Lecture Notes',
        source: 'mit.edu',
        readTime: '35 min read',
        category: 'Academic'
      }
    ],
    sampleQuiz: {
      question: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctIndex: 2,
      explanation: 'When a BST is completely unbalanced (skewed like a linked list), searching an element degenerates to O(n).'
    }
  }
}

const currentPackage = computed<SearchPreviewPackage>(() => {
  const match = Object.keys(samplePackages).find(
    (k) => k.toLowerCase() === props.query.trim().toLowerCase()
  )
  if (match) {
    return samplePackages[match]
  }

  // Fallback realistic package for user-typed query
  const displayTopic = props.query.trim() || 'Modern Computer Systems'
  return {
    topic: displayTopic,
    difficulty: 'Intermediate',
    estimatedHours: '6-8 hrs estimated • 4 modules',
    summary: `StudyMate AI generated a curated roadmap for "${displayTopic}". It connects high-yield explanations, vetted academic papers, YouTube tutorials, and diagnostic questions.`,
    keyTakeaways: [
      `Grasp core theoretical foundations and industry use cases of ${displayTopic}.`,
      'Review step-by-step implementations and real-world architectures.',
      'Identify common pitfalls and exam-tested edge cases.',
      'Reinforce retention through progressive active recall checkpoints.'
    ],
    videos: [
      {
        title: `Comprehensive Guide to ${displayTopic} [Crash Course]`,
        channel: 'Computerphile / MIT OpenCourseWare',
        duration: '38m 45s',
        verified: true
      },
      {
        title: `${displayTopic}: Practical Implementation & Walkthrough`,
        channel: 'CS Dojo / Academind',
        duration: '26m 10s',
        verified: true
      }
    ],
    readings: [
      {
        title: `${displayTopic} – Architecture & Concepts Reference`,
        source: 'Engineering Documentation',
        readTime: '20 min read',
        category: 'Reference'
      },
      {
        title: `Best Practices and Cheat Sheet: ${displayTopic}`,
        source: 'StudyMate Curated Library',
        readTime: '15 min read',
        category: 'Summary'
      }
    ],
    sampleQuiz: {
      question: `What is the most effective study method when mastering complex topics like ${displayTopic}?`,
      options: [
        'Passive re-reading of textbooks multiple times',
        'Active recall combined with spaced repetition and practice problems',
        'Highlighting entire pages with colored markers',
        'Cramming right before exam deadlines'
      ],
      correctIndex: 1,
      explanation: 'Cognitive science consistently demonstrates that active recall and spaced interval repetition produce far superior long-term conceptual retention.'
    }
  }
})

const handleSelectQuiz = (idx: number) => {
  selectedQuizOption.value = idx
}
</script>

<template>
  <Modal
    :open="open"
    max-width="3xl"
    @close="emit('close')"
  >
    <!-- Notice Banner about coming-soon status as mandated by spec -->
    <div class="mb-5 p-3.5 rounded-xl bg-accent/10 border border-accent/25 flex items-start gap-3 text-xs text-text-base">
      <Info class="w-4 h-4 text-accent shrink-0 mt-0.5" />
      <div>
        <p class="font-medium text-text-base">
          AI Learning Search Preview Mode
        </p>
        <p class="text-text-muted mt-0.5">
          Backend Cloudflare Worker and live YouTube API endpoints are currently in staging (scheduled for Phase 6). Below is an interactive preview of how your learning package will look and function.
        </p>
      </div>
    </div>

    <!-- Package Header -->
    <div class="border-b border-border-subtle pb-5">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div class="flex items-center gap-2">
          <Badge variant="accent">
            {{ currentPackage.difficulty }}
          </Badge>
          <Badge variant="muted">
            <Clock class="w-3 h-3 mr-1" />
            {{ currentPackage.estimatedHours }}
          </Badge>
        </div>

        <button
          type="button"
          @click="isSaved = !isSaved"
          class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-muted transition-colors cursor-pointer text-text-base"
        >
          <Bookmark class="w-3.5 h-3.5" :class="isSaved ? 'text-accent fill-accent' : ''" />
          <span>{{ isSaved ? 'Saved to Library' : 'Save Package' }}</span>
        </button>
      </div>

      <h2 class="text-xl sm:text-2xl font-bold font-serif text-text-base">
        {{ currentPackage.topic }}
      </h2>
      <p class="text-sm text-text-muted mt-1.5 leading-relaxed">
        {{ currentPackage.summary }}
      </p>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-1 border-b border-border-subtle py-3 text-xs font-medium">
      <button
        type="button"
        @click="activeTab = 'overview'"
        class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
        :class="activeTab === 'overview' ? 'bg-primary text-primary-fg font-semibold' : 'text-text-muted hover:text-text-base hover:bg-surface-muted'"
      >
        <BookOpen class="w-3.5 h-3.5" />
        <span>Core Takeaways</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'videos'"
        class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
        :class="activeTab === 'videos' ? 'bg-primary text-primary-fg font-semibold' : 'text-text-muted hover:text-text-base hover:bg-surface-muted'"
      >
        <Youtube class="w-3.5 h-3.5 text-danger" />
        <span>Videos ({{ currentPackage.videos.length }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'docs'"
        class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
        :class="activeTab === 'docs' ? 'bg-primary text-primary-fg font-semibold' : 'text-text-muted hover:text-text-base hover:bg-surface-muted'"
      >
        <FileText class="w-3.5 h-3.5" />
        <span>Docs &amp; Articles</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'quiz'"
        class="px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
        :class="activeTab === 'quiz' ? 'bg-primary text-primary-fg font-semibold' : 'text-text-muted hover:text-text-base hover:bg-surface-muted'"
      >
        <HelpCircle class="w-3.5 h-3.5 text-accent" />
        <span>Concept Check</span>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="py-5">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-4">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Structured Learning Objectives
        </h4>
        <div class="space-y-2.5">
          <div
            v-for="(point, i) in currentPackage.keyTakeaways"
            :key="i"
            class="flex items-start gap-3 p-3 rounded-xl bg-surface-muted/50 border border-border-subtle"
          >
            <CheckCircle2 class="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span class="text-xs sm:text-sm text-text-base leading-relaxed">{{ point }}</span>
          </div>
        </div>

        <div class="mt-6 p-4 rounded-xl border border-border-subtle bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-text-base">Ready to build your personal study plan?</p>
            <p class="text-xs text-text-muted">Break this topic into day-by-day 30-minute targets with the planner.</p>
          </div>
          <Button variant="primary" size="sm" to="/signup">
            Create Study Plan
          </Button>
        </div>
      </div>

      <!-- Videos Tab -->
      <div v-else-if="activeTab === 'videos'" class="space-y-3">
        <div
          v-for="(video, i) in currentPackage.videos"
          :key="i"
          class="flex items-center justify-between p-3.5 rounded-xl border border-border-subtle hover:border-border-hover bg-surface transition-all gap-4"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0">
              <Youtube class="w-5 h-5" />
            </div>
            <div>
              <p class="text-sm font-medium text-text-base line-clamp-1">
                {{ video.title }}
              </p>
              <div class="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                <span>{{ video.channel }}</span>
                <span>&bull;</span>
                <span>{{ video.duration }}</span>
                <span v-if="video.verified" class="text-accent flex items-center gap-0.5 font-medium">
                  &bull; Verified Quality
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Watch</span>
          </Button>
        </div>
      </div>

      <!-- Docs Tab -->
      <div v-else-if="activeTab === 'docs'" class="space-y-3">
        <div
          v-for="(reading, i) in currentPackage.readings"
          :key="i"
          class="flex items-center justify-between p-3.5 rounded-xl border border-border-subtle hover:border-border-hover bg-surface transition-all gap-4"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-surface-muted text-text-muted flex items-center justify-center shrink-0">
              <FileText class="w-5 h-5" />
            </div>
            <div>
              <p class="text-sm font-medium text-text-base line-clamp-1">
                {{ reading.title }}
              </p>
              <div class="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                <Badge variant="muted" size="sm">{{ reading.category }}</Badge>
                <span>{{ reading.source }}</span>
                <span>&bull;</span>
                <span>{{ reading.readTime }}</span>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm">
            <ExternalLink class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Read</span>
          </Button>
        </div>
      </div>

      <!-- Quiz Tab -->
      <div v-else-if="activeTab === 'quiz'" class="space-y-4">
        <div class="p-4 rounded-xl border border-border-subtle bg-surface">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-text-muted">
              AI Diagnostic Check
            </span>
            <Badge variant="accent">1 Question Mini-Check</Badge>
          </div>

          <p class="text-sm font-semibold text-text-base mb-4 leading-relaxed">
            {{ currentPackage.sampleQuiz.question }}
          </p>

          <div class="space-y-2">
            <button
              v-for="(opt, idx) in currentPackage.sampleQuiz.options"
              :key="idx"
              type="button"
              @click="handleSelectQuiz(idx)"
              class="w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between"
              :class="[
                selectedQuizOption === null
                  ? 'border-border-subtle hover:border-border-hover bg-surface'
                  : selectedQuizOption === idx
                    ? idx === currentPackage.sampleQuiz.correctIndex
                      ? 'border-success bg-success/10 text-success font-medium'
                      : 'border-danger bg-danger/10 text-danger font-medium'
                    : idx === currentPackage.sampleQuiz.correctIndex
                      ? 'border-success bg-success/10 text-success'
                      : 'border-border-subtle opacity-50 bg-surface'
              ]"
            >
              <span>{{ opt }}</span>
              <span v-if="selectedQuizOption !== null && idx === currentPackage.sampleQuiz.correctIndex" class="text-success text-xs font-bold">
                ✓ Correct
              </span>
              <span v-else-if="selectedQuizOption === idx && idx !== currentPackage.sampleQuiz.correctIndex" class="text-danger text-xs font-bold">
                ✗ Incorrect
              </span>
            </button>
          </div>

          <div
            v-if="selectedQuizOption !== null"
            class="mt-4 p-3.5 rounded-xl bg-surface-muted border border-border-subtle text-xs text-text-base leading-relaxed"
          >
            <p class="font-semibold text-accent mb-0.5">Explanation:</p>
            <p>{{ currentPackage.sampleQuiz.explanation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <Button variant="ghost" size="sm" @click="emit('close')">
        Close Preview
      </Button>
      <Button variant="primary" size="sm" to="/signup">
        <Sparkles class="w-3.5 h-3.5 mr-1" />
        <span>Join to Save &amp; Track</span>
      </Button>
    </template>
  </Modal>
</template>

