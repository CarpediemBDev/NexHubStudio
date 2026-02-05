<template>
  <div class="app-sidebar bg-white border-end" :class="{ collapsed: isCollapsed }">
    <!-- 사이드바 헤더 (접기/펼치기 버튼) -->
    <div class="sidebar-header d-flex align-items-center justify-content-end p-3 border-bottom">
      <button class="btn btn-sm btn-outline-secondary border-0" @click="$emit('toggle')">
        <i class="bi" :class="isCollapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'"></i>
      </button>
    </div>

    <!-- 메뉴 목록 -->
    <div class="sidebar-content overflow-auto custom-scrollbar">
      <ul class="nav flex-column p-2">
        <li v-for="(grp, i) in menu" :key="`g-${i}`" class="nav-item mb-1">
          <!-- 1단 (그룹) -->
          <div
            class="nav-link d-flex align-items-center justify-content-between"
            :class="{ 'collapsed-mode': isCollapsed }"
            @click="toggleGroup(i)"
            role="button"
          >
            <div class="d-flex align-items-center overflow-hidden">
              <i class="bi fs-5 me-3" :class="grp.icon || 'bi-folder'"></i>
              <span class="menu-label text-nowrap" v-show="!isCollapsed">{{ grp.label }}</span>
            </div>
            <i
              v-show="!isCollapsed"
              class="bi bi-chevron-down small transition-icon"
              :class="{ 'rotate-180': openGroups.includes(i) }"
            ></i>
          </div>

          <!-- 2단 (서브메뉴) -->
          <div class="submenu-container" :class="{ show: openGroups.includes(i) && !isCollapsed }">
            <ul class="nav flex-column ms-3 ps-2 border-start">
              <li v-for="(item, j) in grp.children" :key="`gi-${i}-${j}`" class="nav-item">
                <RouterLink
                  v-if="item.to"
                  :to="item.to"
                  class="nav-link py-1 small text-truncate"
                  :title="item.label"
                >
                  {{ item.label }}
                </RouterLink>
                <span v-else class="nav-link py-1 small text-muted text-truncate">{{
                  item.label
                }}</span>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppSidebar',
  props: {
    isCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['toggle'],
  data() {
    return {
      openGroups: [], // 펼쳐진 그룹 인덱스
      menu: [
        {
          label: '사용자 관리',
          icon: 'bi-people',
          children: [
            { label: '사용자', to: '/users' },
            { label: '사용자(검색Grid)', to: '/search-grid' },
            { label: 'JqxGrid 샘플', to: '/jqx-grid' },
            { label: '그룹 관리' },
            { label: '설정' },
          ],
        },
        {
          label: '사용자 배정',
          icon: 'bi-person-check',
          children: [
            { label: '사용자 배정 (세로)', to: '/user-assignment-vertical' },
            { label: '사용자 배정 (공통목록)', to: '/user-assignment-shared' },
            { label: '사용자 배정 (신규)', to: '/user-assignment-shared-new' },
          ],
        },
        {
          label: '교육 관리',
          icon: 'bi-book',
          children: [{ label: '강좌 목록' }, { label: '수강 현황' }, { label: '시험/평가' }],
        },
        {
          label: '게시판',
          icon: 'bi-journal-text',
          children: [
            { label: '게시글 목록', to: '/posts' },
            { label: '게시글 작성', to: '/posts/write' },
            { label: '파일 관리', to: '/files' },
          ],
        },
        {
          label: '모니터링',
          icon: 'bi-display',
          children: [{ label: '설비 모니터링', to: '/equipment-monitor' }],
        },
        {
          label: '업무 관리',
          icon: 'bi-clipboard-check',
          children: [
            { label: '업무 의뢰', to: '/request-workflow' },
            { label: '업무 의뢰서', to: '/work-request-form' },
            { label: '설비지원요청', to: '/equipment-support-request' },
          ],
        },
        {
          label: '개발 가이드',
          icon: 'bi-code-slash',
          children: [{ label: '공통 컴포넌트 가이드', to: '/component-guide' }],
        },
        {
          label: '시스템',
          icon: 'bi-gear',
          children: [
            { label: '공통코드 그룹', to: '/common-code-groups' },
            { label: '환경설정' },
            { label: '공지사항' },
          ],
        },
        {
          label: '샘플',
          icon: 'bi-box-seam',
          children: [
            { label: '설비 바코드 샘플', to: '/sample/barcode-equipment' },
            { label: '포털 메인 샘플', to: '/sample/portal' },
          ],
        },
      ],
    }
  },
  methods: {
    toggleGroup(index) {
      if (this.isCollapsed) return // 접힌 상태에선 클릭 무시 (혹은 툴팁 처리)

      const idx = this.openGroups.indexOf(index)
      if (idx > -1) {
        this.openGroups.splice(idx, 1)
      } else {
        this.openGroups.push(index)
      }
    },
  },
}
</script>

<style scoped>
.app-sidebar {
  width: 260px;
  height: calc(100vh - 56px); /* Header 높이(56px 가정) 제외 */
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.app-sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  height: 50px;
}

.sidebar-content {
  flex: 1;
}

.nav-link {
  color: #333;
  cursor: pointer;
  border-radius: 6px;
}
.nav-link:hover {
  background-color: #f8f9fa;
  color: #0d6efd;
}

/* 활성 링크 */
.router-link-active {
  color: #0d6efd;
  font-weight: 600;
  background-color: #e7f1ff;
}

/* 서브메뉴 애니메이션 */
.submenu-container {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}
.submenu-container.show {
  max-height: 500px; /* 충분히 큰 값 */
  transition: max-height 0.5s ease-in;
}

.transition-icon {
  transition: transform 0.3s;
}
.rotate-180 {
  transform: rotate(180deg);
}

/* 스크롤바 커스텀 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #dee2e6;
  border-radius: 4px;
}
</style>
