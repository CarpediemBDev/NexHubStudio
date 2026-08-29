<template>
  <div 
    :class="[
      'vben-sidebar border-end', 
      { 
        'collapsed': isCollapsed && currentToggleStyle !== 'hover',
        'sidebar-mode-hover': currentToggleStyle === 'hover',
        'sidebar-mode-drawer shadow-lg': currentToggleStyle === 'drawer'
      }
    ]"
  >
    <!-- Brand Logo Header -->
    <div 
      class="sidebar-logo d-flex align-items-center border-bottom"
      :class="[
        (isCollapsed && currentToggleStyle !== 'hover') ? 'justify-content-center px-0' : 'justify-content-between px-3',
        (isCollapsed && (currentToggleStyle === 'inline' || currentToggleStyle === 'double-arrow')) ? 'cursor-pointer collapsed-logo-hover' : ''
      ]"
      @click="(isCollapsed && (currentToggleStyle === 'inline' || currentToggleStyle === 'double-arrow')) ? tabStore.toggleSidebar() : null"
      :title="(isCollapsed && (currentToggleStyle === 'inline' || currentToggleStyle === 'double-arrow')) ? '사이드바 펼치기 (Alt+B)' : ''"
    >
      <!-- Logo Mark & Text -->
      <div v-if="!isCollapsed || currentToggleStyle !== 'double-arrow'" class="d-flex align-items-center overflow-hidden">
        <div class="logo-icon-box d-flex align-items-center justify-content-center text-primary flex-shrink-0">
          <i class="bi bi-box-seam fs-5"></i>
        </div>
        <div v-if="!isCollapsed || currentToggleStyle === 'hover'" class="d-flex align-items-center ms-2.5 overflow-hidden logo-text-group">
          <span class="fw-bold logo-brand text-truncate">NexHub</span>
          <span class="logo-edition badge-edition ms-2 font-monospace flex-shrink-0">STUDIO</span>
        </div>
      </div>

      <!-- Mode 1: Notion / Linear Inline Toggle -->
      <button 
        v-if="(!isCollapsed || currentToggleStyle === 'hover') && currentToggleStyle === 'inline'"
        class="btn btn-sidebar-toggle flex-shrink-0"
        @click.stop="tabStore.toggleSidebar()"
        title="사이드바 접기 (Alt+B)"
        type="button"
      >
        <i class="bi bi-layout-sidebar-inset"></i>
      </button>

      <!-- Mode 7: AdminLTE / Metronic Double Arrow Toggle (펼침: ◀◀, 접힘: ▶▶) -->
      <button 
        v-if="currentToggleStyle === 'double-arrow'"
        class="btn btn-sidebar-toggle flex-shrink-0"
        @click.stop="tabStore.toggleSidebar()"
        :title="isCollapsed ? '사이드바 펼치기 (Alt+B)' : '사이드바 접기 (Alt+B)'"
        type="button"
      >
        <i :class="['bi', isCollapsed ? 'bi-chevron-double-right text-primary fs-6' : 'bi-chevron-double-left text-primary']"></i>
      </button>

      <!-- Mode 8: Discord / Mobile Drawer Close Button -->
      <button 
        v-if="currentToggleStyle === 'drawer'"
        class="btn btn-sidebar-toggle flex-shrink-0"
        @click.stop="tabStore.toggleSidebar()"
        title="사이드바 서랍 닫기 (Esc / Alt+B)"
        type="button"
      >
        <i class="bi bi-x-lg text-primary fs-6"></i>
      </button>
    </div>

    <!-- Mode 6: Figma / Raycast Floating Pill Button (Under Logo) -->
    <div v-if="currentToggleStyle === 'pill'" class="px-2 pt-2 pb-1">
      <button
        class="btn btn-floating-pill w-100 d-flex align-items-center justify-content-center gap-1.5 py-1"
        @click="tabStore.toggleSidebar()"
        :title="isCollapsed ? '사이드바 펼치기' : '사이드바 접기'"
        type="button"
      >
        <i :class="['bi', isCollapsed ? 'bi-arrows-angle-expand' : 'bi-arrows-angle-contract', 'small text-primary']"></i>
        <span v-if="!isCollapsed" class="pill-text small fw-medium">패널 접기</span>
      </button>
    </div>
    
    <!-- Sidebar Menu with Generous Inset Padding -->
    <div class="sidebar-menu overflow-auto custom-scrollbar flex-grow-1">
      <ul class="nav flex-column gap-1.5">
        <li v-for="menu in menus" :key="menu.path" class="nav-item">
          <!-- 1-Level Main Menu Item (Has Icon for Collapsed Mode) -->
          <div 
            class="nav-link menu-item-main d-flex align-items-center justify-content-between rounded-3 cursor-pointer"
            :class="{ 'active-menu shadow-sm': isActive(menu.path) && !menu.children, 'expanded-group': isExpanded(menu.path) }"
            @click="handleMenuClick(menu)"
            :title="(isCollapsed && currentToggleStyle !== 'hover') ? (menu.meta?.title || menu.name) : ''"
          >
            <div class="d-flex align-items-center text-truncate">
              <!-- Fixed Width Icon Box for Level 1 -->
              <span class="menu-icon-box d-inline-flex align-items-center justify-content-center">
                <i v-if="menu.meta?.icon" :class="['bi', menu.meta.icon, 'fs-6']"></i>
                <i v-else class="bi bi-folder fs-6"></i>
              </span>
              <span v-if="!isCollapsed || currentToggleStyle === 'hover'" class="menu-label small fw-medium title-text text-truncate">{{ menu.meta?.title || menu.name }}</span>
            </div>
            <i v-if="(!isCollapsed || currentToggleStyle === 'hover') && menu.children" :class="['bi', isExpanded(menu.path) ? 'bi-chevron-down' : 'bi-chevron-right', 'chevron-icon']"></i>
          </div>

          <!-- 2-Level Submenu (Clean Text Only, No Distracting Icons) -->
          <ul v-if="(!isCollapsed || currentToggleStyle === 'hover') && menu.children && isExpanded(menu.path)" class="nav flex-column submenu-list gap-0.5">
            <li v-for="child in menu.children" :key="child.path" class="nav-item">
              <div 
                class="nav-link menu-item-sub d-flex align-items-center rounded-2 cursor-pointer"
                :class="{ 'sub-active': isActive(menu.path + '/' + child.path) }"
                @click="navigate(menu.path + '/' + child.path)"
              >
                <span class="submenu-label text-truncate">{{ child.meta?.title || child.name }}</span>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </div>

    <!-- Mode 2: Bottom Footer Collapse Bar (VS Code / IDE Style) -->
    <div 
      v-if="currentToggleStyle === 'footer'" 
      class="sidebar-footer-toggle border-top d-flex align-items-center cursor-pointer"
      :class="isCollapsed ? 'justify-content-center' : 'justify-content-between px-3'"
      @click="tabStore.toggleSidebar()"
      :title="isCollapsed ? '사이드바 펼치기 (Alt+B)' : '사이드바 축소 (Alt+B)'"
    >
      <div v-if="!isCollapsed" class="d-flex align-items-center gap-2 small text-theme-muted">
        <i class="bi bi-chevron-bar-left"></i>
        <span>사이드바 축소</span>
      </div>
      <div v-else class="text-theme-muted small">
        <i class="bi bi-chevron-bar-right"></i>
      </div>
      <kbd v-if="!isCollapsed" class="footer-kbd">Alt+B</kbd>
    </div>

    <!-- Mode 3: Floating Handle on Right Border (Jira / Stripe / Figma Style) -->
    <button 
      v-if="currentToggleStyle === 'floating'"
      class="btn-floating-handle shadow-sm"
      @click.stop="tabStore.toggleSidebar()"
      :title="isCollapsed ? '사이드바 펼치기 (Alt+B)' : '사이드바 접기 (Alt+B)'"
      type="button"
    >
      <i :class="['bi', isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left']"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTabStore } from '../../stores/tabStore';

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle']);

const router = useRouter();
const route = useRoute();
const tabStore = useTabStore();
const currentToggleStyle = computed(() => tabStore.sidebarToggleStyle || 'inline');
const isCollapsed = computed(() => tabStore.sidebarCollapsed);
const expandedGroups = ref(['system', 'grid-studio', 'user-group']);

const menus = computed(() => {
  const mainRoute = router.options.routes.find(r => r.path === '/');
  if (!mainRoute || !mainRoute.children) return [];
  return mainRoute.children.filter(c => !c.meta?.hidden && !c.path.includes(':'));
});

const isActive = (path) => {
  if (!path && route.path === '/') return true;
  if (!path) return false;
  const currentPath = route.meta?.activeMenu || route.path;
  return currentPath === `/${path}` || currentPath.endsWith(path);
};

const isExpanded = (path) => {
  return expandedGroups.value.includes(path);
};

const handleMenuClick = (menu) => {
  if (menu.children && menu.children.length > 0) {
    const idx = expandedGroups.value.indexOf(menu.path);
    if (idx >= 0) {
      expandedGroups.value.splice(idx, 1);
    } else {
      expandedGroups.value.push(menu.path);
    }
  } else {
    navigate(menu.path);
  }
};

const navigate = (path) => {
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  router.push(fullPath);
};
</script>

<style scoped>
.vben-sidebar {
  position: relative;
  width: 256px;
  height: 100%;
  flex-shrink: 0;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;
  background-color: var(--b2b-sidebar-bg);
  border-color: var(--b2b-sidebar-border) !important;
}
.vben-sidebar.collapsed {
  width: 64px;
}

/* Mode 5: Stripe / AWS Hover Expand Mode */
.vben-sidebar.sidebar-mode-hover {
  width: 64px;
  position: relative;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 64px 기본 상태에서는 아이콘만 깔끔하게 중앙 정렬, 텍스트 완전 숨김 */
.vben-sidebar.sidebar-mode-hover .sidebar-logo {
  justify-content: center !important;
  padding: 0 !important;
}
.vben-sidebar.sidebar-mode-hover .logo-text-group,
.vben-sidebar.sidebar-mode-hover .menu-label,
.vben-sidebar.sidebar-mode-hover .chevron-icon,
.vben-sidebar.sidebar-mode-hover .submenu-list {
  display: none !important;
}
.vben-sidebar.sidebar-mode-hover .menu-item-main {
  justify-content: center !important;
  padding: 8px 0 !important;
}
.vben-sidebar.sidebar-mode-hover .menu-icon-box {
  margin-right: 0 !important;
}

/* 마우스 호버 시 256px 확장 및 텍스트 부드럽게 노출 */
.vben-sidebar.sidebar-mode-hover:hover {
  width: 256px !important;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
}
.vben-sidebar.sidebar-mode-hover:hover .sidebar-logo {
  justify-content: flex-start !important;
  padding: 0 16px !important;
}
.vben-sidebar.sidebar-mode-hover:hover .logo-text-group {
  display: flex !important;
}
.vben-sidebar.sidebar-mode-hover:hover .menu-label,
.vben-sidebar.sidebar-mode-hover:hover .chevron-icon {
  display: inline-block !important;
}
.vben-sidebar.sidebar-mode-hover:hover .submenu-list {
  display: flex !important;
}
.vben-sidebar.sidebar-mode-hover:hover .menu-item-main {
  justify-content: space-between !important;
  padding: 8px 12px !important;
}
.vben-sidebar.sidebar-mode-hover:hover .menu-icon-box {
  margin-right: 11px !important;
}

/* Mode 8: Discord Drawer Overlay Mode (본문 100% 풀 와이드 지원) */
.vben-sidebar.sidebar-mode-drawer {
  position: fixed !important;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1050;
  width: 256px !important;
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.22);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
}
.vben-sidebar.sidebar-mode-drawer.collapsed {
  transform: translateX(-100%) !important;
  opacity: 0;
  pointer-events: none;
}
.vben-sidebar.sidebar-mode-drawer:not(.collapsed) {
  transform: translateX(0) !important;
  opacity: 1;
  pointer-events: auto;
}

/* Mode 6: Figma Floating Pill */
.btn-floating-pill {
  border: 1px dashed var(--b2b-color-border);
  background-color: var(--b2b-color-bg-card);
  border-radius: 20px;
  color: var(--b2b-color-text-muted);
  font-size: var(--b2b-font-size-xs);
  transition: all 0.15s ease;
}
.btn-floating-pill:hover {
  background-color: var(--b2b-color-hover-bg);
  border-color: var(--b2b-color-primary);
  color: var(--b2b-color-primary);
}
.sidebar-menu {
  flex: 1 1 auto;
  padding: 16px 14px;
}

.sidebar-logo {
  height: 48px;
  padding: 0 18px 0 16px;
  background-color: var(--b2b-sidebar-logo-bg);
  border-color: var(--b2b-sidebar-border) !important;
  user-select: none;
  transition: background-color 0.15s ease;
}
.collapsed-logo-hover:hover {
  background-color: var(--b2b-sidebar-hover);
}
.collapsed-logo-hover:hover .logo-icon-box {
  transform: scale(1.1);
}
.logo-icon-box {
  width: 30px;
  height: 30px;
  transition: transform 0.15s ease;
}
.logo-brand {
  color: var(--b2b-color-text-main);
  font-size: 16px;
  letter-spacing: -0.3px;
  white-space: nowrap;
}
.badge-edition {
  font-size: var(--b2b-font-size-2xs);
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--b2b-color-primary-subtle, #eff6ff);
  color: var(--b2b-color-primary, #2563eb);
}

/* Inline Sidebar Toggle Button */
.btn-sidebar-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  margin-right: 2px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--b2b-color-text-muted);
  font-size: var(--b2b-font-size-body);
  transition: all 0.15s ease;
}

.btn-sidebar-toggle:hover {
  background-color: var(--b2b-color-hover-bg);
  color: var(--b2b-color-text-main);
}

/* Mode 2: Footer Collapse Bar (VS Code style) */
.sidebar-footer-toggle {
  height: 40px;
  background-color: var(--b2b-sidebar-logo-bg);
  border-color: var(--b2b-sidebar-border) !important;
  user-select: none;
  transition: background-color 0.15s ease;
}
.sidebar-footer-toggle:hover {
  background-color: var(--b2b-sidebar-hover);
}
.sidebar-footer-toggle:hover .text-theme-muted {
  color: var(--b2b-color-text-main) !important;
}
.footer-kbd {
  font-size: 10px;
  font-family: var(--b2b-font-family-mono);
  background-color: var(--b2b-color-bg-body);
  border: 1px solid var(--b2b-color-border);
  color: var(--b2b-color-text-muted);
  padding: 1px 4px;
  border-radius: 4px;
}

/* Mode 3: Floating Handle (Jira / Stripe style) */
.btn-floating-handle {
  position: absolute;
  top: 50%;
  right: -13px;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  color: var(--b2b-color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  cursor: pointer;
  z-index: 1050;
  transition: all 0.18s ease;
}
.btn-floating-handle:hover {
  background-color: var(--b2b-color-primary);
  color: #fff;
  border-color: var(--b2b-color-primary);
  transform: translateY(-50%) scale(1.15);
}

.sidebar-menu {
  flex: 1 1 auto;
  padding: 12px 8px;
  overflow-x: hidden !important;
  overflow-y: auto;
  width: 100%;
}

.sidebar-menu ul.nav {
  width: 100%;
  padding: 0;
  margin: 0;
}

.sidebar-menu .nav-item {
  width: 100%;
}

/* 1-Level Menu Main Item */
.menu-item-main {
  width: 100%;
  box-sizing: border-box;
  min-height: 38px;
  padding: 8px 8px 8px 10px;
  color: var(--b2b-sidebar-text);
  transition: all 0.15s ease;
}
.menu-item-main:hover {
  background-color: var(--b2b-sidebar-hover);
  color: var(--b2b-color-text-main) !important;
}
.menu-item-main.active-menu {
  background-color: var(--b2b-color-primary) !important;
  color: #ffffff !important;
  font-weight: 600;
}
.menu-item-main.active-menu .title-text, 
.menu-item-main.active-menu .menu-icon-box i {
  color: #ffffff !important;
}
.menu-item-main.expanded-group {
  background-color: var(--b2b-sidebar-hover);
  color: var(--b2b-color-text-main) !important;
  font-weight: 600;
}

/* 1-Level Menu Icon */
.menu-icon-box {
  width: 22px;
  height: 22px;
  margin-right: 10px;
  flex-shrink: 0;
  opacity: 0.85;
}

.menu-label {
  font-size: var(--b2b-font-size-body);
  line-height: 1.3;
}

/* 2-Level Submenu (가로 삐져나옴 완전 방지) */
.submenu-list {
  width: calc(100% - 14px) !important;
  margin-left: 14px !important;
  margin-top: 4px;
  padding-left: 10px !important;
  border-left: 1.5px solid var(--b2b-color-border);
  box-sizing: border-box;
}

.menu-item-sub {
  width: 100%;
  box-sizing: border-box;
  min-height: 32px;
  padding: 6px 10px;
  color: var(--b2b-sidebar-text);
  transition: all 0.12s ease;
}
.menu-item-sub:hover {
  background-color: var(--b2b-sidebar-hover);
  color: var(--b2b-color-text-main) !important;
}
.menu-item-sub.sub-active {
  background-color: var(--b2b-sidebar-active-bg) !important;
  color: var(--b2b-sidebar-active-text) !important;
  font-weight: 600 !important;
}

.submenu-label {
  font-size: var(--b2b-font-size-sm);
  line-height: 1.35;
}

/* 우측 쉐브론 화살표 - 살짝 더 우측으로 이동 (카드 내부 8px / 테두리 기준 16px) */
.chevron-icon {
  font-size: 10px;
  margin-left: 6px;
  margin-right: 0px;
  color: var(--b2b-color-text-muted);
  opacity: 0.6;
  flex-shrink: 0;
  transition: transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease, color 0.15s ease;
}
.menu-item-main:hover .chevron-icon {
  opacity: 1;
  color: var(--b2b-color-text-main);
}
.cursor-pointer { cursor: pointer; }

/* Custom Thin Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--b2b-color-border);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: var(--b2b-color-text-muted);
}
</style>
