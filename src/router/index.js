import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DtrFilter from '@/views/DtrFilter.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },

  {
    path: '/dtrFilter',
    name: 'dtrFilter',
    component: DtrFilter
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
