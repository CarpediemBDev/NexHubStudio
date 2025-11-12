import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import UserPage from '../pages/UserPage.vue'
import UserSearGridPage from '../pages/UserSearGridPage.vue'
import JqxGridPage from '../pages/JqxGridPage.vue'
import ComponentGuidePage from '../pages/ComponentGuidePage.vue'
import UserAssignmentVertical from '../pages/UserAssignmentVertical.vue'
import UserAssignmentShared from '../pages/UserAssignmentShared.vue'
import PostListPage from '../pages/PostListPage.vue'
import PostDetailPage from '../pages/PostDetailPage.vue'
import PostWritePage from '../pages/PostWritePage.vue'
import FileListPage from '../pages/FileListPage.vue'
import EquipmentMonitorPage from '../pages/EquipmentMonitorPage.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'Users', component: UserPage },
      { path: 'search-grid', name: '사용자(검색 그리드)', component: UserSearGridPage },
      { path: 'jqx-grid', name: 'JqxGrid 샘플', component: JqxGridPage },
      { path: 'component-guide', name: '공통 컴포넌트 가이드', component: ComponentGuidePage },
      {
        path: 'user-assignment-vertical',
        name: '사용자 배정 (세로)',
        component: UserAssignmentVertical,
      },
      {
        path: 'user-assignment-shared',
        name: '사용자 배정 (공통목록)',
        component: UserAssignmentShared,
      },
      // 게시판
      { path: 'posts', name: '게시판', component: PostListPage },
      { path: 'posts/write', name: '게시글 작성', component: PostWritePage },
      { path: 'posts/:id', name: '게시글 상세', component: PostDetailPage },
      { path: 'posts/:id/edit', name: '게시글 수정', component: PostWritePage },
      // 파일
      { path: 'files', name: '파일 관리', component: FileListPage },
      // 설비 모니터링
      { path: 'equipment-monitor', name: '설비 모니터링', component: EquipmentMonitorPage },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
