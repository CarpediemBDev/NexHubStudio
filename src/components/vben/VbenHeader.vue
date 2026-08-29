<template>
  <header class="vben-header d-flex justify-content-between align-items-center px-3">
    <!-- Left: Sidebar Expand Trigger & Interactive Breadcrumbs -->
    <div class="d-flex align-items-center gap-2 overflow-hidden me-3">
      <!-- Show toggle/expand button based on active toggle style -->
      <button 
        v-if="currentToggleStyle === 'header' || currentToggleStyle === 'drawer' || (tabStore.sidebarCollapsed && currentToggleStyle === 'inline')"
        class="btn btn-ghost-icon flex-shrink-0" 
        @click="tabStore.toggleSidebar()" 
        :title="tabStore.sidebarCollapsed ? '메뉴 열기 (Alt+B)' : '메뉴 닫기 (Alt+B)'"
        type="button"
      >
        <i :class="['bi', currentToggleStyle === 'drawer' ? (tabStore.sidebarCollapsed ? 'bi-list fs-5 text-primary' : 'bi-x-lg text-theme-secondary') : (tabStore.sidebarCollapsed ? 'bi-layout-sidebar-inset-reverse text-primary' : 'bi-layout-sidebar text-theme-secondary')]"></i>
      </button>

      <!-- Breadcrumbs with Toggle Style Selector (Replacing Home icon) -->
      <nav aria-label="breadcrumb" class="d-flex align-items-center text-truncate">
        <ol class="breadcrumb mb-0 align-items-center">
          <!-- 🎨 토글 스타일 하이엔드 드롭다운 (집 모양 대체) -->
          <li class="breadcrumb-item d-inline-flex align-items-center">
            <button 
              class="btn btn-toggle-switcher d-inline-flex align-items-center gap-1.5 px-2 py-0.5 rounded-2"
              type="button"
              @click.stop="openToggleMenu($event)"
              title="사이드바 토글 스타일 변경"
            >
              <i class="bi bi-layout-sidebar-inset text-primary small"></i>
              <span class="switcher-text fw-medium">토글: {{ toggleStyleLabel }}</span>
              <i class="bi bi-chevron-down switcher-arrow opacity-50"></i>
            </button>
          </li>

          <!-- Dynamic Path Breadcrumbs -->
          <li
            v-for="(crumb, idx) in computedCrumbs"
            :key="idx"
            class="breadcrumb-item d-inline-flex align-items-center text-truncate"
            :class="{ active: idx === computedCrumbs.length - 1 }"
          >
            <span
              v-if="idx === computedCrumbs.length - 1"
              class="crumb-current fw-semibold text-truncate"
            >
              {{ crumb }}
            </span>
            <span v-else class="crumb-parent text-truncate">
              {{ crumb }}
            </span>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Right Utility Area -->
    <div class="vben-header-actions d-flex align-items-center gap-1.5 flex-shrink-0">
      <!-- Global Theme Switcher Button -->
      <button 
        class="btn btn-ghost-icon theme-toggle-btn" 
        @click="tabStore.toggleSidebarTheme()" 
        :title="tabStore.sidebarTheme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'"
        type="button"
      >
        <i :class="['bi', tabStore.sidebarTheme === 'light' ? 'bi-sun text-warning' : 'bi-moon-stars text-primary']"></i>
      </button>

      <!-- Fullscreen Toggle Button -->
      <button 
        class="btn btn-ghost-icon" 
        @click="toggleFullscreen" 
        :title="isFullscreen ? '전체화면 종료' : '전체화면 전환'"
        type="button"
      >
        <i :class="['bi', isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen', 'text-theme-secondary']"></i>
      </button>

      <!-- User Profile Avatar Chip -->
      <div class="dropdown ms-1">
        <button 
          class="btn-user-chip d-flex align-items-center gap-2 px-2 py-1 dropdown-toggle" 
          type="button" 
          data-bs-toggle="dropdown" 
          aria-expanded="false"
        >
          <div class="user-avatar-circle">
            <span>AD</span>
          </div>
          <span class="user-name small fw-medium d-none d-sm-inline">Admin</span>
          <i class="bi bi-chevron-down chevron-icon small text-theme-muted"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm border py-1">
          <li class="dropdown-header small text-theme-muted py-1.5 px-3">
            관리자 계정
          </li>
          <li><a class="dropdown-item small py-1.5 px-3" href="#"><i class="bi bi-person me-2 text-theme-secondary"></i>내 프로필</a></li>
          <li><a class="dropdown-item small py-1.5 px-3" href="#"><i class="bi bi-sliders me-2 text-theme-secondary"></i>환경설정</a></li>
          <li><hr class="dropdown-divider my-1"></li>
          <li><a class="dropdown-item small py-1.5 px-3 text-danger" href="#" @click.prevent="logout"><i class="bi bi-box-arrow-right me-2"></i>로그아웃</a></li>
        </ul>
      </div>
    </div>

    <!-- 텔레포트 토글 스타일 메뉴 (VbenTabBar와 100% 동일한 하이엔드 팝업) -->
    <teleport to="body">
      <div
        v-if="toggleMenu.show"
        class="tab-ctx-backdrop"
        @click="toggleMenu.show = false"
        @contextmenu.prevent="toggleMenu.show = false"
      >
        <ul class="tab-ctx-menu shadow" :style="{ top: toggleMenu.y + 'px', left: toggleMenu.x + 'px' }" @click.stop>
          <li class="menu-section-header">
            <i class="bi bi-sliders me-1.5 text-primary"></i>사이드바 토글 스타일 (8종)
          </li>
          <li :class="{ 'style-selected': currentToggleStyle === 'inline' }" @click="selectToggleStyle('inline')">
            <i class="bi bi-check2 me-2" :class="currentToggleStyle === 'inline' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>1. Notion 로고 인라인</span>
          </li>
          <li :class="{ 'style-selected': currentToggleStyle === 'footer' }" @click="selectToggleStyle('footer')">
            <i class="bi bi-check2 me-2" :class="currentToggleStyle === 'footer' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>2. VS Code 하단 푸터 바</span>
          </li>
          <li :class="{ 'style-selected': currentToggleStyle === 'floating' }" @click="selectToggleStyle('floating')">
            <i class="bi bi-check2 me-2" :class="currentToggleStyle === 'floating' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>3. Jira 경계선 플로팅 핀</span>
          </li>
          <li :class="{ 'style-selected': currentToggleStyle === 'header' }" @click="selectToggleStyle('header')">
            <i class="bi bi-check2 me-2" :class="currentToggleStyle === 'header' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>4. GitHub 헤더 툴바 버튼</span>
          </li>
          <li :class="{ 'style-selected': currentToggleStyle === 'hover' }" @click="selectToggleStyle('hover')">
            <i class="bi bi-check2 me-2" :class="currentToggleStyle === 'hover' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>5. Stripe 스마트 호버 확장</span>
          </li>
          <li :class="{ 'style-selected': currentToggleStyle === 'pill' }" @click="selectToggleStyle('pill')">
            <i class="bi bi-check2 me-2" :class="currentToggleStyle === 'pill' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>6. Figma 플로팅 캡슐 알약</span>
          </li>
          <li :class="{ 'style-selected': currentToggleStyle === 'double-arrow' }" @click="selectToggleStyle('double-arrow')">
            <i class="bi bi-check2 me-2" :class="currentToggleStyle === 'double-arrow' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>7. AdminLTE 쉐브론 화살표</span>
          </li>
          <li :class="{ 'style-selected': currentToggleStyle === 'drawer' }" @click="selectToggleStyle('drawer')">
            <i class="bi bi-check2 me-2" :class="currentToggleStyle === 'drawer' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>8. Discord 오버레이 드로어</span>
          </li>
        </ul>
      </div>
    </teleport>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTabStore } from '../../stores/tabStore';

const props = defineProps({
  sidebarCollapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggle-sidebar']);

const router = useRouter();
const route = useRoute();
const tabStore = useTabStore();
const isFullscreen = ref(false);
const toggleMenu = ref({ show: false, x: 0, y: 0 });

const currentToggleStyle = computed(() => tabStore.sidebarToggleStyle || 'inline');

const openToggleMenu = (event) => {
  const r = event.currentTarget.getBoundingClientRect();
  toggleMenu.value = {
    show: true,
    x: Math.min(r.left, window.innerWidth - 240),
    y: r.bottom + 4,
  };
};

const selectToggleStyle = (style) => {
  tabStore.setSidebarToggleStyle(style);
  toggleMenu.value.show = false;
};

const toggleStyleLabel = computed(() => {
  switch (currentToggleStyle.value) {
    case 'inline':
      return 'Notion 인라인';
    case 'footer':
      return 'VS Code 푸터';
    case 'floating':
      return 'Jira 플로팅';
    case 'header':
      return 'GitHub 헤더';
    case 'hover':
      return 'Stripe 호버확장';
    case 'pill':
      return 'Figma 캡슐';
    case 'double-arrow':
      return 'AdminLTE 화살표';
    case 'drawer':
      return 'Discord 드로어';
    default:
      return '인라인';
  }
});

const computedCrumbs = computed(() => {
  const crumbs = [];
  if (route && route.matched) {
    route.matched.forEach((record) => {
      if (record.meta && record.meta.title && record.path !== '/' && record.path !== route.path) {
        crumbs.push(record.meta.title);
      }
    });
  }
  const currentTitle = (route && route.meta && route.meta.title) || '';
  if (currentTitle && !crumbs.includes(currentTitle)) {
    crumbs.push(currentTitle);
  }
  return crumbs.length > 0 ? crumbs : ['대시보드'];
});

const checkFullscreen = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  document.addEventListener('fullscreenchange', checkFullscreen);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', checkFullscreen);
});

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

const logout = () => {
  router.push('/login');
};
</script>

<style scoped>
.vben-header {
  height: 48px;
  z-index: 1000;
  padding: 0 var(--b2b-space-4);
  background-color: var(--b2b-color-header-bg);
  border-bottom: 1px solid var(--b2b-color-border);
  color: var(--b2b-color-text-main);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

/* Ghost Icon Button */
.btn-ghost-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--b2b-color-text-muted);
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.btn-ghost-icon:hover {
  background-color: var(--b2b-color-hover-bg);
  color: var(--b2b-color-text-main);
}

.btn-ghost-icon:active {
  transform: scale(0.95);
}

.theme-toggle-btn i {
  font-size: 0.95rem;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.theme-toggle-btn:hover i {
  transform: rotate(15deg);
}

/* Breadcrumb Styling */
.breadcrumb {
  font-size: var(--b2b-font-size-body, 13px);
}

.breadcrumb-item + .breadcrumb-item {
  padding-left: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: '/';
  color: var(--b2b-color-text-faint);
  padding: 0 6px;
  font-size: 11px;
}

/* Toggle Switcher Button in Header (Replacing home icon) */
.btn-toggle-switcher {
  height: 26px;
  border: 1px solid var(--b2b-color-border);
  background-color: var(--b2b-color-bg-card);
  color: var(--b2b-color-text-main);
  font-size: var(--b2b-font-size-xs);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.15s ease;
}

.btn-toggle-switcher:hover {
  background-color: var(--b2b-color-hover-bg);
  border-color: var(--b2b-color-primary);
  color: var(--b2b-color-primary);
}

.switcher-text {
  font-size: var(--b2b-font-size-xs);
  color: inherit;
}

.switcher-arrow {
  font-size: 9px;
}

.crumb-parent {
  color: var(--b2b-color-text-muted);
  font-size: var(--b2b-font-size-sm);
}

.crumb-current {
  color: var(--b2b-color-text-main);
  font-size: var(--b2b-font-size-body);
}

/* User Profile Avatar Chip */
.btn-user-chip {
  height: 32px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 20px;
  color: var(--b2b-color-text-main);
  transition: all 0.15s ease;
}

.btn-user-chip:hover,
.btn-user-chip:focus {
  background-color: var(--b2b-color-hover-bg);
  border-color: var(--b2b-color-border);
}

.user-avatar-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--b2b-color-primary, #2563eb), #60a5fa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.user-name {
  font-size: var(--b2b-font-size-sm);
  color: var(--b2b-color-text-main);
}

.chevron-icon {
  font-size: 10px;
  transition: transform 0.2s ease;
}

.btn-user-chip[aria-expanded="true"] .chevron-icon {
  transform: rotate(180deg);
}

.btn-user-chip::after {
  display: none !important;
}

.dropdown-menu {
  background-color: var(--b2b-color-bg-card);
  border-color: var(--b2b-color-border) !important;
  border-radius: 8px;
  min-width: 160px;
}

.dropdown-item {
  color: var(--b2b-color-text-main);
  transition: background-color 0.12s ease;
}

.dropdown-item:hover {
  background-color: var(--b2b-color-hover-bg);
  color: var(--b2b-color-text-main);
}

/* ── 텔레포트 팝업 메뉴 스타일 (VbenTabBar와 100% 일치) ── */
.tab-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

.tab-ctx-menu {
  position: fixed;
  min-width: 210px;
  margin: 0;
  padding: var(--b2b-space-1);
  list-style: none;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: 8px;
  z-index: 3010;
}

.menu-section-header {
  font-size: 11px;
  font-weight: 700;
  color: var(--b2b-color-text-muted);
  padding: 6px 10px var(--b2b-space-1) 10px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.tab-ctx-menu li:not(.divider):not(.menu-section-header) {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: var(--b2b-font-size-sm);
  color: var(--b2b-color-text-main);
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.tab-ctx-menu li:not(.divider):not(.menu-section-header):hover {
  background-color: var(--b2b-color-hover-bg);
}

.style-selected {
  background-color: var(--b2b-sidebar-active-bg);
  font-weight: 600;
  color: var(--b2b-color-primary) !important;
}
</style>
