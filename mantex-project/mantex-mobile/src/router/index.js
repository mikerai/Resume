import { createRouter, createWebHistory } from '@ionic/vue-router';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  // 👷 SUPPLIER ROUTES (New Tabs)
  {
    path: '/supplier/',
    component: () => import('@/views/supplier/SupplierTabs.vue'),
    children: [
      {
        path: '',
        redirect: '/supplier/dashboard'
      },
      {
        path: 'dashboard',
        component: () => import('@/views/supplier/SupplierDashboard.vue')
      },
      {
        path: 'jobs',
        component: () => import('@/views/supplier/JobsList.vue')
      },
      {
        path: 'calendar',
        component: () => import('@/views/supplier/CalendarView.vue')
      },
      {
        path: 'messages',
        component: () => import('@/views/supplier/MessagesList.vue')
      },
      {
        path: 'account',
        component: () => import('@/views/supplier/AccountSettings.vue')
      }
    ]
  },
  // 👤 CLIENT ROUTES (New Tabs)
  {
    path: '/client/',
    component: () => import('@/views/client/ClientTabs.vue'),
    children: [
      {
        path: '',
        redirect: '/client/dashboard'
      },
      {
        path: 'dashboard',
        component: () => import('@/views/client/ClientDashboard.vue')
      },
      {
        path: 'tickets',
        component: () => import('@/views/client/TicketsList.vue')
      },
      {
        path: 'calendar',
        component: () => import('@/views/client/CalendarView.vue')
      },
      {
        path: 'chat',
        component: () => import('@/views/client/ChatList.vue')
      },
      {
        path: 'profile',
        component: () => import('@/views/client/UserProfile.vue')
      }
    ]
  },
  // 🎟️ CLIENT TICKET DETAIL
  {
    path: '/client/tickets/:id',
    component: () => import('@/views/client/TicketDetail.vue')
  },
  // 🎟️ SHARED TICKET ROUTES
  {
    path: '/tickets/:id',
    component: () => import('@/views/supplier/TicketDetail.vue')
  },
  {
    path: '/client/create-ticket',
    component: () => import('@/views/client/CreateTicket.vue')
  },
  {
    path: '/client/company/branches',
    component: () => import('@/views/client/company/BranchesList.vue')
  },
  {
    path: '/client/company/assets',
    component: () => import('@/views/client/company/AssetsList.vue')
  },
  {
    path: '/client/company/users',
    component: () => import('@/views/client/company/UsersList.vue')
  },
  {
    path: '/client/company/info',
    component: () => import('@/views/client/company/CompanyInfo.vue')
  },
  {
    path: '/client/settings',
    component: () => import('@/views/client/Settings.vue')
  },
  {
    path: '/supplier/settings',
    component: () => import('@/views/supplier/Settings.vue')
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
      return '/supplier/dashboard'; // Default to technician view
    }

    if (role === 'client') return '/client/dashboard';
    return '/supplier/dashboard'; // Default (Technician/Supplier)
  }

  // 3. Role Access Control
  if (to.path.startsWith('/client') && profile.value?.role !== 'client' && !isFlynn.value) {
    console.warn('🚫 Access denied to Client area');
    return '/supplier/dashboard';
  }

  if (to.path.startsWith('/supplier') && profile.value?.role === 'client' && !isFlynn.value) {
    console.warn('🚫 Access denied to Technician area');
    return '/client/dashboard';
  }

  return true;
})

export default router
