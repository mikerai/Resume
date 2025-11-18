import { createRouter, createWebHistory } from '@ionic/vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: () => import('@/views/Tab1Page.vue')
      },
      {
        path: 'tab2',
        component: () => import('@/views/Tab2Page.vue')
      },
      {
        path: 'tab3',
        component: () => import('@/views/Tab3Page.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Auth Guard
router.beforeEach(async (to, from) => {
  // Import auth composable dynamically to avoid circular dependency
  const { useAuth } = await import('@/composables/useAuth.js');
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for auth to initialize
  if (isLoading.value) {
    return new Promise((resolve) => {
      const unwatch = isLoading.value.$watch ? isLoading.value.$watch((newVal) => {
        if (!newVal) {
          unwatch();
          resolve(true);
        }
      }) : setTimeout(() => resolve(true), 1000);
    });
  }

  const isAuthRequired = to.path.startsWith('/tabs');
  const isLoginPage = to.path === '/login';

  if (isAuthRequired && !isAuthenticated.value) {
    console.log('🔒 Auth required, redirecting to login');
    return '/login';
  }

  // Allow access to login page even if authenticated (manual login required)
  if (isLoginPage) {
    console.log('🔓 Allowing access to login page (manual login required)');
    return true;
  }

  return true;
})

export default router
