import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'pidomoro',
      component: () => import('../views/PidomoroView.vue')
    },
    {
      path: '/pong',
      name: 'pong',
      component: () => import('../views/PongView.vue')
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/',
    },
  ]
})

export default router
