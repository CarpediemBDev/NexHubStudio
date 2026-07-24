import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import UserPage from '../pages/UserPage.vue'
import UserSearGridPage from '../pages/UserSearGridPage.vue'
import JqxGridPage from '../pages/JqxGridPage.vue'
import RealGridPage from '../pages/RealGridPage.vue'
import RealGridVuePage from '../pages/RealGridVuePage.vue'
import PivotAltAPage from '../pages/PivotAltAPage.vue'
import PivotAltBPage from '../pages/PivotAltBPage.vue'
import RealPivotPage from '../pages/RealPivotPage.vue'

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
      { path: 'pivot-alt-a', name: '피벗 대안 A (그룹핑)', component: PivotAltAPage },
      { path: 'pivot-alt-b', name: '피벗 대안 B (교차표)', component: PivotAltBPage },
      { path: 'real-pivot', name: 'RealPivot 체험', component: RealPivotPage },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
