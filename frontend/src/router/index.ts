import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { loadMe, session } from '../stores/session'
import AppLayout from '../layouts/AppLayout.vue'

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', component: () => import('../views/WorkbenchView.vue') },
      { path: 'ingest', component: () => import('../views/IngestView.vue'), meta: { roles: ['operator', 'admin'] } },
      { path: 'review', component: () => import('../views/ReviewView.vue'), meta: { roles: ['operator', 'admin'] } },
      { path: 'rankings', component: () => import('../views/RankingsView.vue') },
      { path: 'games', component: () => import('../views/GamesView.vue') },
      { path: 'games/:id', component: () => import('../views/GameProfileView.vue') },
      { path: 'articles/:id', component: () => import('../views/ArticleView.vue') },
      { path: 'digest/:date', component: () => import('../views/DigestView.vue') },
      { path: 'settings', component: () => import('../views/SettingsView.vue'), meta: { roles: ['admin'] } },
    ],
  },
]

export const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to) => {
  if (!session.loaded) await loadMe()
  if (to.meta.public) return true
  if (!session.user) return '/login'
  const roles = to.meta.roles as string[] | undefined
  if (roles && !roles.includes(session.user.role)) return '/'
  return true
})
