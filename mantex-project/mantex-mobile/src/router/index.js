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
  // 👷 TECHNICIAN ROUTES (Existing Tabs)
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
  },
  // 👤 CLIENT ROUTES (New)
  {
    path: '/client/dashboard',
    component: () => import('@/views/client/ClientDashboard.vue')
  },
  {
    path: '/client/create-ticket',
    component: () => import('@/views/client/CreateTicket.vue')
  },
  // 🎟️ SHARED TICKET ROUTES
  {
    path: '/tickets/:id',
    component: () => import('@/views/shared/TicketDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Auth & Role Guard
router.beforeEach(async (to, from) => {
  // Import auth composable dynamically
  const { useAuth } = await import('@/composables/useAuth.js');
  const { isAuthenticated, isLoading, profile, isFlynn, currentGridMode } = useAuth();

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

  const isLoginPage = to.path === '/login';

  // 1. If not authenticated, force login
  if (!isAuthenticated.value && !isLoginPage) {
    console.log('🔒 Auth required, redirecting to login');
    return '/login';
  }

  // 2. If authenticated and on login page, redirect based on role
  if (isAuthenticated.value && isLoginPage) {
    const role = profile.value?.role;

    // 🕶️ FLYNN MODE CHECK
    if (isFlynn.value) {
      console.log('🕶️ Flynn Mode Active - Grid Mode:', currentGridMode.value);
      if (currentGridMode.value === 'client') return '/client/dashboard';
      return '/tabs/tab1'; // Default to technician view for now
    }

    if (role === 'client') return '/client/dashboard';
    return '/tabs/tab1'; // Default (Technician/Supplier)
  }

  // 3. Role Access Control
  if (to.path.startsWith('/client') && profile.value?.role !== 'client' && !isFlynn.value) {
    console.warn('🚫 Access denied to Client area');
    return '/tabs/tab1';
  }

  if (to.path.startsWith('/tabs') && profile.value?.role === 'client' && !isFlynn.value) {
    console.warn('🚫 Access denied to Technician area');
    return '/client/dashboard';
  }

  return true;
})

export default router
