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
import PivotAltAPage from "../pages/PivotAltAPage.vue";
import RealPivotPage from "../pages/RealPivotPage.vue";
import RealPivotSdkPage from "../pages/RealPivotSdkPage.vue";
import RealGridPage from "../pages/RealGridPage.vue";
import RealGridVuePage from "../pages/RealGridVuePage.vue";
import RealGridTreePage from "../pages/RealGridTreePage.vue";
import RealGridDndPage from "../pages/RealGridDndPage.vue";
import RealGridSmartDndPage from "../pages/RealGridSmartDndPage.vue";
import RealGridToDivGuidePage from "../pages/RealGridToDivGuidePage.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../pages/auth/LoginPage.vue"),
    meta: { title: "로그인", hidden: true }
  },
  {
    path: "/",
    component: MainLayout,
    children: [
      // 1. 대시보드 (단독)
      {
        path: "",
        name: "Main",
        component: () => import("../pages/MainPage.vue"),
        meta: { title: "대시보드", icon: "bi-house-door" }
      },

      // 2. 시스템 관리 (그룹)
      {
        path: "system",
        name: "SystemGroup",
        meta: { title: "시스템 관리", icon: "bi-gear-fill" },
        children: [
          { path: "menus", name: "MenuManagement", component: () => import("../pages/admin/MenuPermissionPage.vue"), meta: { title: "메뉴 및 권한 관리", icon: "bi-menu-button-wide" } },
          { path: "departments", name: "DepartmentManagement", component: () => import("../pages/admin/DepartmentPage.vue"), meta: { title: "부서 관리", icon: "bi-diagram-3" } },
          { path: "common-codes", name: "CommonCodeManagement", component: () => import("../pages/admin/CommonCodePage.vue"), meta: { title: "공통 코드 관리", icon: "bi-list-ul" } }
        ]
      },

      // 3. 사용자 & 배정 관리 (그룹)
      {
        path: "user-group",
        name: "UserGroup",
        meta: { title: "사용자 & 배정 관리", icon: "bi-people-fill" },
        children: [
          { path: "users", name: "Users", component: UserPage, meta: { title: "사용자 목록", icon: "bi-person-badge", keepAlive: true } },
          { path: "search-grid", name: "UserSearchGrid", component: UserSearGridPage, meta: { title: "사용자 검색 그리드", icon: "bi-search", keepAlive: true } },
          { path: "user-assignment-vertical", name: "UserAssignmentVertical", component: UserAssignmentVertical, meta: { title: "사용자 배정(세로)", icon: "bi-person-lines-fill" } },
          { path: "user-assignment-shared", name: "UserAssignmentShared", component: UserAssignmentShared, meta: { title: "사용자 배정(공통)", icon: "bi-person-gear" } },
          { path: "user-assignment-shared-new", name: "UserAssignmentSharedNew", component: () => import("../pages/UserAssignmentSharedNew.vue"), meta: { title: "사용자 배정(신규)", icon: "bi-person-plus" } }
        ]
      },

      // 4. RealGrid & 피벗 스튜디오 (그룹)
      {
        path: "grid-studio",
        name: "GridStudioGroup",
        meta: { title: "RealGrid & 피벗 스튜디오", icon: "bi-grid-3x3-gap-fill" },
        children: [
          { path: "vue", name: "RealGridVueSample", component: RealGridVuePage, meta: { title: "RealGrid (Vue3)", icon: "bi-grid-3x3-gap" } },
          { path: "js", name: "RealGridJsSample", component: RealGridPage, meta: { title: "RealGrid (JS)", icon: "bi-grid-3x3" } },
          { path: "tree", name: "RealGridTreeSample", component: RealGridTreePage, meta: { title: "RealGrid 트리", icon: "bi-diagram-3" } },
          { path: "dnd", name: "RealGridDndSample", component: RealGridDndPage, meta: { title: "RealGrid 드래그&드롭 (Grid to Grid)", icon: "bi-arrows-move" } },
          { path: "grid-to-div", name: "RealGridToDivGuideSample", component: RealGridToDivGuidePage, meta: { title: "RealGrid ➔ DIV 드래그앤드롭 (공식가이드)", icon: "bi-box-arrow-right" } },
          { path: "smart-dnd", name: "RealGridSmartDndSample", component: RealGridSmartDndPage, meta: { title: "RealGrid 스마트 D&D 스튜디오 (Pro)", icon: "bi-magic" } },
          { path: "pivot-a", name: "PivotA", component: PivotAltAPage, meta: { title: "Pivot 분석 A", icon: "bi-pie-chart" } },
          { path: "pivot-real", name: "RealPivot", component: RealPivotPage, meta: { title: "AI 스마트 피벗 (자체개발)", icon: "bi-bar-chart-steps" } },
          { path: "pivot-sdk", name: "RealPivotSdk", component: RealPivotSdkPage, meta: { title: "RealPivot 공식 SDK 가이드", icon: "bi-box-seam" } }
        ]
      },

      // 5. 업무 & 게시판 관리 (그룹)
      {
        path: "work-group",
        name: "WorkGroup",
        meta: { title: "업무 & 게시판 관리", icon: "bi-briefcase-fill" },
        children: [
          { path: "posts", name: "PostList", component: PostListPage, meta: { title: "게시판 목록", icon: "bi-card-text", keepAlive: true } },
          { path: "files", name: "FileList", component: FileListPage, meta: { title: "파일 관리", icon: "bi-folder", keepAlive: true } },
          { path: "equipment-monitor", name: "EquipmentMonitor", component: EquipmentMonitorPage, meta: { title: "설비 모니터링", icon: "bi-display" } },
          { path: "request-workflow", name: "RequestWorkflow", component: RequestWorkflowPage, meta: { title: "업무 의뢰 워크플로우", icon: "bi-briefcase" } },
          { path: "equipment-support-request", name: "EquipmentSupportRequest", component: () => import("../pages/EquipmentSupportRequestPage.vue"), meta: { title: "설비 지원 요청", icon: "bi-tools" } }
        ]
      },

      // 6. 메일 관리 (그룹)
      {
        path: "mail",
        name: "MailGroup",
        meta: { title: "메일 관리", icon: "bi-envelope-fill" },
        children: [
          { path: "studio-hub", name: "MailStudioHub", component: () => import("../pages/mail/MailStudioHubPage.vue"), meta: { title: "메일 스튜디오 Pro 통합 허브 (Antigravity)", icon: "bi-stars" } },
          { path: "templates", name: "MailTemplate", component: () => import("../pages/mail/MailTemplatePage.vue"), meta: { title: "메일 템플릿 관리 (Claude)", icon: "bi-envelope-paper" } },
          { path: "dispatch-map", name: "MailDispatchMap", component: () => import("../pages/mail/MailDispatchMapPage.vue"), meta: { title: "메일 발송 매핑 현황 (Claude)", icon: "bi-diagram-2" } },
          { path: "send-log", name: "MailSendLog", component: () => import("../pages/mail/MailSendLogPage.vue"), meta: { title: "메일 발송 이력 (Claude)", icon: "bi-clock-history" } }
        ]
      },

      // 7. 규격/규제 관리 (그룹)
      {
        path: "regulation",
        name: "RegulationGroup",
        meta: { title: "규격/규제 관리", icon: "bi-shield-check" },
        children: [
          { path: "info", name: "RegulationInfo", component: () => import("../pages/regulation/RegulationInfoPage.vue"), meta: { title: "규제 정보 관리", icon: "bi-clipboard-check" } }
        ]
      },

      // 8. UI 컴포넌트 & 샘플 (그룹)
      {
        path: "sample-group",
        name: "SampleGroup",
        meta: { title: "UI 컴포넌트 & 샘플", icon: "bi-layers-fill" },
        children: [
          { path: "autocomplete", name: "AutocompleteSample", component: () => import("../pages/sample/AutocompleteDemoPage.vue"), meta: { title: "Input 자동완성 샘플", icon: "bi-search" } },
          { path: "jqx-grid", name: "JqxGridSample", component: JqxGridPage, meta: { title: "JqxGrid 샘플", icon: "bi-table" } },
          { path: "pivot-a-search", name: "PivotASearchSample", component: () => import("../pages/sample/PivotASearchGridPage.vue"), meta: { title: "Pivot 분석 A (SearchGrid형)", icon: "bi-pie-chart-fill" } },
          { path: "component-guide", name: "ComponentGuide", component: ComponentGuidePage, meta: { title: "UI 컴포넌트 가이드", icon: "bi-book" } },
          { path: "datepicker-gallery", name: "DatePickerGallery", component: () => import("../pages/sample/DatePickerGalleryPage.vue"), meta: { title: "DatePicker 갤러리", icon: "bi-calendar-week" } },
          { path: "barcode-equipment", name: "BarcodeEquipment", component: () => import("../pages/sample/BarcodeEquipment.vue"), meta: { title: "설비 바코드 샘플", icon: "bi-upc-scan" } },
          { path: "portal", name: "PortalSample", component: () => import("../pages/sample/PortalSample.vue"), meta: { title: "포털 메인 샘플", icon: "bi-layout-text-window" } }
        ]
      },

      { path: "sample/autocomplete", component: () => import("../pages/sample/AutocompleteDemoPage.vue"), meta: { hidden: true } },

      // 기존 호환성 단독 경로 유지 (hidden)
      { path: "users", component: UserPage, meta: { hidden: true } },
      { path: "search-grid", component: UserSearGridPage, meta: { hidden: true } },
      { path: "user-assignment-vertical", component: UserAssignmentVertical, meta: { hidden: true } },
      { path: "user-assignment-shared", component: UserAssignmentShared, meta: { hidden: true } },
      { path: "real-grid", component: RealGridPage, meta: { hidden: true } },
      { path: "real-grid-vue", component: RealGridVuePage, meta: { hidden: true } },
      { path: "real-grid-tree", component: RealGridTreePage, meta: { hidden: true } },
      { path: "real-grid-dnd", component: RealGridDndPage, meta: { hidden: true } },
      { path: "real-grid-smart-dnd", component: RealGridSmartDndPage, meta: { hidden: true } },
      { path: "component-guide", component: ComponentGuidePage, meta: { hidden: true } },
      { path: "pivot-alt-a", component: PivotAltAPage, meta: { hidden: true } },
      { path: "real-pivot", component: RealPivotPage, meta: { hidden: true } },
      // 업무 & 게시판 / 공통코드 / 샘플 단독 경로 (NavBar·대시보드 flat 링크 매칭용)
      { path: "posts", component: PostListPage, meta: { title: "게시판 목록", hidden: true, activeMenu: "/work-group/posts" } },
      { path: "posts/write", name: "PostWrite", component: PostWritePage, meta: { title: "게시글 작성", hidden: true, activeMenu: "/work-group/posts" } },
      { path: "posts/:id/edit", name: "PostEdit", component: PostWritePage, meta: { title: "게시글 수정", hidden: true, activeMenu: "/work-group/posts" } },
      { path: "posts/:id", name: "PostDetail", component: PostDetailPage, meta: { title: "게시글 상세", hidden: true, activeMenu: "/work-group/posts" } },
      { path: "files", component: FileListPage, meta: { hidden: true } },
      { path: "equipment-monitor", component: EquipmentMonitorPage, meta: { hidden: true } },
      { path: "request-workflow", component: RequestWorkflowPage, meta: { hidden: true } },
      { path: "work-request-form", component: WorkRequestFormPage, meta: { hidden: true } },
      { path: "equipment-support-request", component: () => import("../pages/EquipmentSupportRequestPage.vue"), meta: { hidden: true } },
      { path: "common-code-groups", component: CommonCodeGroupListPage, meta: { hidden: true } },
      { path: "common-code-groups/:groupId", name: "CommonCodeGroupDetail", component: CommonCodeGroupDetailPage, meta: { hidden: true } },
      { path: "jqx-grid", component: JqxGridPage, meta: { hidden: true } },
      { path: "user-assignment-shared-new", component: () => import("../pages/UserAssignmentSharedNew.vue"), meta: { hidden: true } },
      // 샘플
      {
        path: "sample/barcode-equipment",
        name: "설비 바코드 샘플",
        component: () => import("../pages/sample/BarcodeEquipment.vue"),
        meta: { title: "바코드 샘플", icon: "bi-upc-scan" }
      },
      {
        path: "sample/portal",
        name: "포털 메인 샘플",
        component: () => import("../pages/sample/PortalSample.vue"),
        meta: { title: "포털 샘플", icon: "bi-layout-text-window" }
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
