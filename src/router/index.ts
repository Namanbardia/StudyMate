import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import MyLearningView from '@/views/MyLearningView.vue'
import SearchHistoryView from '@/views/SearchHistoryView.vue'
import StudyPlannerView from '@/views/StudyPlannerView.vue'
import StudyPlanDetailView from '@/views/StudyPlanDetailView.vue'
import CreateStudyPlanView from '@/views/CreateStudyPlanView.vue'
import { auth } from '@/firebase/config'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'StudyMate AI — Learn Smarter. Plan Better. Achieve More.' }
    },
    {
      path: '/features',
      name: 'features',
      redirect: { path: '/', hash: '#features' }
    },
    {
      path: '/how-it-works',
      name: 'how-it-works',
      redirect: { path: '/', hash: '#how-it-works' }
    },
    {
      path: '/pricing',
      name: 'pricing',
      redirect: { path: '/', hash: '#pricing' }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'Sign In — StudyMate AI' }
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue'),
      meta: { title: 'Create Account — StudyMate AI' }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'Student Dashboard — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/learning',
      name: 'learning',
      component: MyLearningView,
      meta: { title: 'My Learning — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/views/SearchView.vue'),
      meta: { title: 'AI Search — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'Student Profile — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'Settings — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/terms',
      name: 'terms',
      component: () => import('@/views/LegalView.vue'),
      meta: { title: 'Terms of Service — StudyMate AI' }
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/LegalView.vue'),
      meta: { title: 'Privacy Policy — StudyMate AI' }
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/LegalView.vue'),
      meta: { title: 'Contact Support — StudyMate AI' }
    },
    {
      path: '/faq',
      name: 'faq',
      component: () => import('@/views/LegalView.vue'),
      meta: { title: 'Student FAQ — StudyMate AI' }
    },
    {
      path: '/guides',
      name: 'guides',
      component: () => import('@/views/LegalView.vue'),
      meta: { title: 'Academic Guides — StudyMate AI' }
    },
    {
      path: '/search-history',
      name: 'search-history',
      component: SearchHistoryView,
      meta: { title: 'Search History — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/planner',
      name: 'study-planner',
      component: StudyPlannerView,
      meta: { title: 'Study Planner — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/planner/create',
      name: 'create-study-plan',
      component: CreateStudyPlanView,
      meta: { title: 'Create Study Plan — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/planner/:id',
      name: 'study-plan-detail',
      component: StudyPlanDetailView,
      meta: { title: 'Study Plan — StudyMate AI', requiresAuth: true }
    },
    {
      path: '/safety',
      name: 'safety',
      component: () => import('@/views/LegalView.vue'),
      meta: { title: 'Safety & Academic Integrity — StudyMate AI' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 80
      }
    }
    return { top: 0, behavior: 'smooth' }
  }
})

router.beforeEach(async (to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  if (to.meta.requiresAuth) {
    // Wait for auth to initialize if needed
    if (auth.currentUser === null) {
      await auth.authStateReady()
    }
    if (!auth.currentUser) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }

  next()
})

export default router
