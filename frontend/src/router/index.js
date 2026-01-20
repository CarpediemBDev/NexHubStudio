import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "../layouts/MainLayout.vue";
import UserPage from "../pages/UserPage.vue";
import UserSearGridPage from "../pages/UserSearGridPage.vue";
import JqxGridPage from "../pages/JqxGridPage.vue";
import CommonCodeGroupListPage from "../pages/CommonCodeGroupListPage.vue";
import CommonCodeGroupDetailPage from "../pages/CommonCodeGroupDetailPage.vue";
import ComponentGuidePage from "../pages/ComponentGuidePage.vue";
import UserAssignmentVertical from "../pages/UserAssignmentVertical.vue";
import UserAssignmentShared from "../pages/UserAssignmentShared.vue";
import PostListPage from "../pages/PostListPage.vue";
import PostDetailPage from "../pages/PostDetailPage.vue";
import PostWritePage from "../pages/PostWritePage.vue";
import FileListPage from "../pages/FileListPage.vue";
import EquipmentMonitorPage from "../pages/EquipmentMonitorPage.vue";
import RequestWorkflowPage from "../pages/RequestWorkflowPage.vue";
import WorkRequestFormPage from "../pages/WorkRequestFormPage.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "",
        name: "Main",
        component: () => import("../pages/MainPage.vue"),
      },
      { path: "users", name: "Users", component: UserPage },
      {
        path: "search-grid",
        name: "사용자(검색 그리드)",
        component: UserSearGridPage,
      },
      { path: "jqx-grid", name: "JqxGrid 샘플", component: JqxGridPage },
      // 업무관리 > 설비지원요청
      {
        path: "equipment-support-request",
        name: "설비지원요청",
        component: () => import("../pages/EquipmentSupportRequestPage.vue"),
      },
      {
        path: "common-code-groups",
        name: "CommonCodeGroupList",
        component: CommonCodeGroupListPage,
      },
      {
        path: "common-code-groups/:groupId",
        name: "CommonCodeGroupDetail",
        component: CommonCodeGroupDetailPage,
      },
      {
        path: "component-guide",
        name: "공통 컴포넌트 가이드",
        component: ComponentGuidePage,
      },
      {
        path: "user-assignment-vertical",
        name: "사용자 배정 (세로)",
        component: UserAssignmentVertical,
      },
      {
        path: "user-assignment-shared",
        name: "사용자 배정 (공통목록)",
        component: UserAssignmentShared,
      },
      {
        path: "user-assignment-shared-new",
        name: "사용자 배정 (신규)",
        component: () => import("../pages/UserAssignmentSharedNew.vue"),
      },
      // 게시판
      { path: "posts", name: "게시판", component: PostListPage },
      { path: "posts/write", name: "게시글 작성", component: PostWritePage },
      { path: "posts/:id", name: "게시글 상세", component: PostDetailPage },
      { path: "posts/:id/edit", name: "게시글 수정", component: PostWritePage },
      // 파일
      { path: "files", name: "파일 관리", component: FileListPage },
      // 설비 모니터링
      {
        path: "equipment-monitor",
        name: "설비 모니터링",
        component: EquipmentMonitorPage,
      },
      // 업무 의뢰
      {
        path: "request-workflow",
        name: "업무 의뢰",
        component: RequestWorkflowPage,
      },
      {
        path: "work-request-form",
        name: "업무 의뢰서",
        component: WorkRequestFormPage,
      },
      // 샘플
      {
        path: "sample/barcode-equipment",
        name: "설비 바코드 샘플",
        component: () => import("../pages/sample/BarcodeEquipment.vue"),
      },
      {
        path: "sample/portal",
        name: "포털 메인 샘플",
        component: () => import("../pages/sample/PortalSample.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
