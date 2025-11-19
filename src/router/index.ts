import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import RelativeCapitalDeployed from '../views/RelativeCapitalDeployed.vue'
// Use the correct type for the routes array
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'RelativeCapitalDeployed',
    component: RelativeCapitalDeployed
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router