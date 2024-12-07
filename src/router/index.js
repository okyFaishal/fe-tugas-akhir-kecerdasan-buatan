import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '/',
          name: 'dashboard',
          component: () => import('@/views/Dashboard.vue')
        },
        {
          path: '/pages/empty',
          name: 'empty',
          component: () => import('@/views/pages/Empty.vue')
        },
        {
          path: '/pages/crud',
          name: 'crud',
          component: () => import('@/views/pages/Crud.vue')
        },
        {
          path: '/documentation',
          name: 'documentation',
          component: () => import('@/views/pages/Documentation.vue')
        },
        {
          path: '/test',
          name: 'test',
          component: () => import('@/views/test/test.vue')
        },
        {
          path: '/area-banjir',
          name: 'area banjir',
          component: () => import('@/views/area-banjir/area-banjir.vue')
        },
        {
          path: '/rute-perjalanan',
          name: 'rute perjalanan',
          component: () => import('@/views/rute-perjalanan/rute-perjalanan.vue')
        },
        {
          path: '/rute-by-node',
          name: 'rute by node',
          component: () => import('@/views/rute-by-node/rute-by-node.vue')
        },
      ]
    },
    {
      path: '/rute',
      component: AppLayout,
      children: [
        {
          path: '/rute/rute-1',
          name: 'rute-1',
          component: () => import('@/views/rute/rute-1/rute-1.vue')
        },
        {
          path: '/rute/rute-2',
          name: 'rute-2',
          component: () => import('@/views/rute/rute-2/rute-2.vue')
        },
      ]
    },
    {
      path: '/set-data',
      component: AppLayout,
      children: [
        {
          path: '/set-data/cuaca',
          name: 'cuaca',
          component: () => import('@/views/set-data/cuaca/cuaca.vue')
        },
        {
          path: '/set-data/rute',
          name: 'rute',
          component: () => import('@/views/set-data/rute/rute.vue')
        },
        {
          path: '/set-data/wilayah',
          name: 'wilayah',
          component: () => import('@/views/set-data/wilayah/wilayah.vue')
        },
      ]
    },
    {
      path: '/landing',
      name: 'landing',
      component: () => import('@/views/pages/Landing.vue')
    },
    {
      path: '/pages/notfound',
      name: 'notfound',
      component: () => import('@/views/pages/NotFound.vue')
    },

    {
      path: '/auth/login',
      name: 'login',
      component: () => import('@/views/pages/auth/Login.vue')
    },
    {
      path: '/auth/access',
      name: 'accessDenied',
      component: () => import('@/views/pages/auth/Access.vue')
    },
    {
      path: '/auth/error',
      name: 'error',
      component: () => import('@/views/pages/auth/Error.vue')
    }
  ]
});

export default router;
