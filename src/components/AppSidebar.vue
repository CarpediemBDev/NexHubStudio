<template>
  <div class="app-sidebar bg-theme-card border-end border-theme" :class="{ collapsed: isCollapsed }">
    <!-- 사이드바 헤더 (접기/펼치기 버튼) -->
    <div class="sidebar-header d-flex align-items-center justify-content-end p-3 border-bottom border-theme">
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
          label: '사용자 & 배정 관리',
          icon: 'bi-people',
          children: [
            { label: '사용자 목록', to: '/users' },
            { label: '사용자 (검색Grid)', to: '/search-grid' },
            { label: '사용자 배정 (세로)', to: '/user-assignment-vertical' },
            { label: '사용자 배정 (공통목록)', to: '/user-assignment-shared' },
            { label: '사용자 배정 (신규)', to: '/user-assignment-shared-new' },
          ],
        },
        {
          label: '그리드 & 피벗 Studio',
          icon: 'bi-grid-3x3-gap',
          children: [
            { label: 'RealGrid (바닐라 JS형)', to: '/real-grid' },
            { label: 'RealGrid (Vue3 Slot형)', to: '/real-grid-vue' },
            { label: 'Pivot A (동적 행 그룹핑)', to: '/pivot-alt-a' },
            { label: 'Pivot B (Matrix 교차표)', to: '/pivot-alt-b' },
            { label: 'AI 스마트 피벗 (자체개발)', to: '/real-pivot' },
            { label: 'RealPivot (공식 SDK)', to: '/grid-studio/pivot-sdk' },
            { label: 'JqxGrid 샘플', to: '/jqx-grid' },
          ],
        },
        {
          label: '업무 & 설비 관리',
          icon: 'bi-clipboard-check',
          children: [
            { label: '업무 의뢰', to: '/request-workflow' },
            { label: '업무 의뢰서 작성', to: '/work-request-form' },
            { label: '설비 지원 요청', to: '/equipment-support-request' },
            { label: '설비 모니터링', to: '/equipment-monitor' },
          ],
        },
        {
          label: '게시판 & 파일 관리',
          icon: 'bi-journal-text',
          children: [
            { label: '게시글 목록', to: '/posts' },
            { label: '게시글 작성', to: '/posts/write' },
            { label: '파일 관리', to: '/files' },
          ],
        },
        {
          label: '메일 관리',
          icon: 'bi-envelope-fill',
          children: [
            { label: '메일 스튜디오 통합 허브', to: '/mail/studio-hub' },
            { label: '메일 템플릿 관리', to: '/mail/templates' },
            { label: '메일 발송 매핑 현황', to: '/mail/dispatch-map' },
            { label: '메일 발송 이력', to: '/mail/send-log' },
          ],
        },
        {
          label: '규격/규제 관리',
          icon: 'bi-shield-check',
          children: [
            { label: '규제 정보 관리', to: '/regulation/info' },
          ],
        },
        {
          label: '시스템 & 개발 가이드',
          icon: 'bi-gear',
          children: [
            { label: '공통코드 그룹 관리', to: '/common-code-groups' },
            { label: '공통 컴포넌트 가이드', to: '/sample-group/component-guide' },
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
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 6px;
}
.nav-link:hover {
  background-color: var(--bg-subcard);
  color: var(--b2b-color-primary);
}

/* 활성 링크 */
.router-link-active {
  color: var(--b2b-color-primary);
  font-weight: 600;
  background-color: var(--b2b-color-primary-subtle);
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
  background-color: var(--b2b-color-hover-bg);
  border-radius: 4px;
}
</style>
