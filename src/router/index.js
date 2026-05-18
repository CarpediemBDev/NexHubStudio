import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import UserPage from '../pages/UserPage.vue'
import UserSearGridPage from '../pages/UserSearGridPage.vue'
import JqxGridPage from '../pages/JqxGridPage.vue'
import RealGridPage from '../pages/RealGridPage.vue'
import RealGridVuePage from '../pages/RealGridVuePage.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'Users', component: UserPage },
      { path: 'search-grid', name: '사용자(검색 그리드)', component: UserSearGridPage },
      { path: 'jqx-grid', name: 'JqxGrid 샘플', component: JqxGridPage },
      { path: 'real-grid', name: 'RealGrid 샘플', component: RealGridPage },
      { path: 'real-grid-vue', name: 'RealGridVue 샘플', component: RealGridVuePage },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
