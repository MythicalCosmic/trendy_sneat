export const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('@/pages/dashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        component: () => import('@/pages/users.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'categories',
        component: () => import('@/pages/category.vue')
      },
      {
        path: 'suppliers',
        component: () => import('@/pages/suppliers.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'services',
        component: () => import('@/pages/services.vue'),
        meta: { requiresAuth: true }
      }
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: 'login',
        component: () => import('@/pages/login.vue'),
      },
      {
        path: '/:pathMatch(.*)*',
        component: () => import('@/pages/[...error].vue'),
      },
    ],
  },
]
