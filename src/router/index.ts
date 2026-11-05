import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

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
      meta: { title: 'Student Dashboard — StudyMate AI' }
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

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
