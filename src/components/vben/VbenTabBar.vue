<template>
  <div class="vben-tab-bar d-flex align-items-center px-2" :class="`tab-style-${currentTabStyle}`">
    <!-- Left Scroll Button -->
    <button
      class="btn btn-tab-nav me-1 flex-shrink-0"
      @click="scrollTabs('left')"
      title="왼쪽으로 스크롤"
      type="button"
    >
      <i class="bi bi-chevron-left"></i>
    </button>

    <!-- Tab Scroll Box Container -->
    <div ref="tabScrollContainer" class="tab-scroll-box d-flex align-items-center flex-grow-1 overflow-x-auto">
      <template v-for="(tab, index) in visitedTabs" :key="tab.path">
        <!-- Vertical divider before inactive tab if previous tab is also inactive (for linear/browser styles) -->
        <span 
          v-if="index > 0 && activeTab !== tab.path && activeTab !== visitedTabs[index - 1]?.path" 
          class="tab-divider flex-shrink-0"
        ></span>

        <!-- Tab Item -->
        <div
          class="vben-tab d-inline-flex align-items-center flex-shrink-0 position-relative"
          :class="{ 'active-tab': activeTab === tab.path }"
          @click="navigateTo(tab.path)"
          @contextmenu.prevent="openContextMenu($event, tab.path)"
        >
          <!-- Top Accent Line (for linear style) -->
          <div v-if="activeTab === tab.path && currentTabStyle === 'linear'" class="tab-top-accent"></div>

          <!-- Bottom Accent Line (for underline style) -->
          <div v-if="activeTab === tab.path && currentTabStyle === 'underline'" class="tab-bottom-accent"></div>

          <!-- Clean Typography Title -->
          <span class="tab-title text-truncate">{{ tab.meta?.title || tab.name }}</span>
          
          <!-- Micro Close (X) Button -->
          <button
            v-if="visitedTabs.length > 1"
            type="button"
            class="tab-close"
            title="탭 닫기 (Ctrl+W)"
            @click.stop="closeTab(tab.path)"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </template>
    </div>

    <!-- Right Scroll Button -->
    <button
      class="btn btn-tab-nav ms-1 flex-shrink-0"
      @click="scrollTabs('right')"
      title="오른쪽으로 스크롤"
      type="button"
    >
      <i class="bi bi-chevron-right"></i>
    </button>

    <!-- Open Tabs Counter & Management Dropdown -->
    <div class="tab-management ms-1.5 flex-shrink-0">
      <button
        type="button"
        class="btn btn-tab-nav d-flex align-items-center gap-1 px-2"
        title="탭 스타일 및 닫기 관리"
        @click.stop="openTabMenu($event)"
      >
        <span class="tab-count-badge">{{ visitedTabs.length }}</span>
        <i class="bi bi-three-dots-vertical"></i>
      </button>
    </div>

    <!-- 우클릭 / 탭 관리 컨텍스트 메뉴 -->
    <teleport to="body">
      <div
        v-if="ctxMenu.show"
        class="tab-ctx-backdrop"
        @click="ctxMenu.show = false"
        @contextmenu.prevent="ctxMenu.show = false"
      >
        <ul class="tab-ctx-menu shadow" :style="{ top: ctxMenu.y + 'px', left: ctxMenu.x + 'px' }" @click.stop>
          <!-- 탭 스타일 즉시 전환 섹션 -->
          <li class="menu-section-header">
            <i class="bi bi-palette me-1.5 text-primary"></i>탭 스타일 변경
          </li>
          <li :class="{ 'style-selected': currentTabStyle === 'linear' }" @click="changeStyle('linear')">
            <i class="bi bi-check2 me-2" :class="currentTabStyle === 'linear' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>1. Linear 인셋 (상단 액센트)</span>
          </li>
          <li :class="{ 'style-selected': currentTabStyle === 'browser' }" @click="changeStyle('browser')">
            <i class="bi bi-check2 me-2" :class="currentTabStyle === 'browser' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>2. Chrome 브라우저 폴더</span>
          </li>
          <li :class="{ 'style-selected': currentTabStyle === 'underline' }" @click="changeStyle('underline')">
            <i class="bi bi-check2 me-2" :class="currentTabStyle === 'underline' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>3. Toss 미니멀 언더라인</span>
          </li>
          <li :class="{ 'style-selected': currentTabStyle === 'capsule' }" @click="changeStyle('capsule')">
            <i class="bi bi-check2 me-2" :class="currentTabStyle === 'capsule' ? 'text-primary fw-bold' : 'opacity-0'"></i>
            <span>4. Apple 플로팅 캡슐</span>
          </li>

          <li class="divider my-1 border-top"></li>

          <!-- 탭 닫기 액션 -->
          <li @click="closeTab(ctxMenu.path); ctxMenu.show = false">
            <i class="bi bi-x-lg me-2 text-theme-secondary"></i>현재 탭 닫기
          </li>
          <li @click="closeOtherTabs(ctxMenu.path); ctxMenu.show = false">
            <i class="bi bi-x-circle me-2 text-theme-secondary"></i>다른 탭 모두 닫기
          </li>
          <li class="danger" @click="closeAllTabs(); ctxMenu.show = false">
            <i class="bi bi-dash-circle me-2 text-danger"></i>모든 탭 닫기
          </li>
        </ul>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTabStore } from '../../stores/tabStore';

const router = useRouter();
const tabStore = useTabStore();
const tabScrollContainer = ref(null);

const visitedTabs = computed(() => tabStore.visitedTabs);
const activeTab = computed(() => tabStore.activeTab);
const currentTabStyle = computed(() => tabStore.tabStyle || 'linear');

const ctxMenu = ref({ show: false, x: 0, y: 0, path: '' });

const navigateTo = (path) => {
  router.push(path);
};

const changeStyle = (style) => {
  tabStore.setTabStyle(style);
  ctxMenu.value.show = false;
};

const closeTab = (path) => {
  tabStore.closeTab(path);
};

const closeOtherTabs = (path) => {
  tabStore.closeOtherTabs(path);
};

const closeAllTabs = () => {
  tabStore.closeAllTabs();
};

const scrollTabs = (direction) => {
  if (!tabScrollContainer.value) return;
  const scrollAmount = 200;
  tabScrollContainer.value.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  });
};

const openContextMenu = (event, path) => {
  ctxMenu.value = {
    show: true,
    x: Math.min(event.clientX, window.innerWidth - 220),
    y: event.clientY,
    path,
  };
};

const openTabMenu = (event) => {
  const r = event.currentTarget.getBoundingClientRect();
  ctxMenu.value = {
    show: true,
    x: Math.min(r.left - 170, window.innerWidth - 220),
    y: r.bottom + 4,
    path: activeTab.value,
  };
};
</script>

<style scoped>
.vben-tab-bar {
  height: 38px;
  overflow: hidden;
  white-space: nowrap;
  background-color: var(--b2b-color-tab-bg);
  border-bottom: 1px solid var(--b2b-color-border);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.tab-scroll-box {
  scroll-behavior: smooth;
  scrollbar-width: none;
  gap: 2px;
  height: 100%;
  padding: 0 4px;
}

.tab-scroll-box::-webkit-scrollbar {
  height: 0;
}

/* ── 탭 기본 베이스 ───────────────────────────── */
.vben-tab {
  height: 30px;
  padding: 0 14px;
  cursor: pointer;
  font-size: var(--b2b-font-size-body);
  line-height: 1;
  user-select: none;
  color: var(--b2b-color-text-muted);
  background-color: transparent;
  max-width: 210px;
  transition: all 0.15s ease;
}

.vben-tab:hover {
  color: var(--b2b-color-text-main);
}

.tab-title {
  max-width: 145px;
  display: inline-block;
  vertical-align: middle;
  letter-spacing: -0.2px;
}

/* ─────────────────────────────────────────────────────────────
   Style 1: Linear & Raycast 인셋 글로우 탭 (상단 액센트)
   ───────────────────────────────────────────────────────────── */
.tab-style-linear .vben-tab {
  border-radius: 6px;
  border: 1px solid transparent;
}
.tab-style-linear .vben-tab:hover {
  background-color: var(--b2b-color-hover-bg);
}
.tab-style-linear .vben-tab.active-tab {
  color: var(--b2b-color-text-main);
  background-color: var(--b2b-color-bg-card);
  font-weight: 600;
  border-color: var(--b2b-color-border);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
}
.tab-style-linear .tab-top-accent {
  position: absolute;
  top: 0;
  left: 6px;
  right: 6px;
  height: 2.5px;
  border-radius: 0 0 2px 2px;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
}

/* ─────────────────────────────────────────────────────────────
   Style 2: Chrome / VS Code 브라우저 폴더 탭 (일체형)
   ───────────────────────────────────────────────────────────── */
.tab-style-browser {
  height: 38px;
  padding-top: 4px;
}
.tab-style-browser .vben-tab {
  height: 34px;
  border-radius: 8px 8px 0 0;
  border: 1px solid transparent;
  border-bottom: none;
}
.tab-style-browser .vben-tab:hover {
  background-color: var(--b2b-color-hover-bg);
}
.tab-style-browser .vben-tab.active-tab {
  color: var(--b2b-color-primary);
  background-color: var(--b2b-color-bg-body);
  font-weight: 600;
  border-color: var(--b2b-color-border);
  border-bottom: 1px solid var(--b2b-color-bg-body) !important;
  margin-bottom: -1px;
}

/* ─────────────────────────────────────────────────────────────
   Style 3: Toss / GitHub 모던 언더라인 탭
   ───────────────────────────────────────────────────────────── */
.tab-style-underline .vben-tab {
  height: 100%;
  border-radius: 0;
  padding: 0 16px;
}
.tab-style-underline .vben-tab:hover {
  color: var(--b2b-color-text-main);
  background-color: var(--b2b-color-hover-bg);
}
.tab-style-underline .vben-tab.active-tab {
  color: var(--b2b-color-primary);
  font-weight: 600;
  background-color: transparent;
}
.tab-style-underline .tab-bottom-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background-color: var(--b2b-color-primary);
}

/* ─────────────────────────────────────────────────────────────
   Style 4: Apple / Figma 플로팅 캡슐 (Pill)
   ───────────────────────────────────────────────────────────── */
.tab-style-capsule .vben-tab {
  height: 26px;
  padding: 0 14px;
  border-radius: 20px;
}
.tab-style-capsule .vben-tab:hover {
  background-color: var(--b2b-color-hover-bg);
}
.tab-style-capsule .vben-tab.active-tab {
  color: var(--b2b-color-primary);
  background-color: var(--b2b-color-bg-card);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--b2b-color-border);
}

/* 비활성 탭 사이 미세 구분선 */
.tab-divider {
  width: 1px;
  height: 12px;
  background-color: var(--b2b-color-border);
  opacity: 0.8;
  margin: 0 1px;
}

/* ── 탭 닫기 (X) 마이크로 버튼 ───────────────────────────── */
.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 8px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--b2b-color-text-muted);
  font-size: 11.5px;
  line-height: 1;
  opacity: 0;
  transition: all 0.15s ease;
}

.vben-tab:hover .tab-close,
.vben-tab.active-tab .tab-close {
  opacity: 0.6;
}

.tab-close:hover {
  opacity: 1 !important;
  background-color: rgba(220, 38, 38, 0.12);
  color: var(--b2b-color-danger);
  transform: scale(1.1);
}

/* ── 탭 스크롤 / 관리 버튼 ───────────────────────── */
.btn-tab-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 6px;
  border: none;
  background-color: transparent;
  border-radius: 5px;
  color: var(--b2b-color-text-muted);
  font-size: 11px;
  line-height: 1;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.btn-tab-nav:hover {
  background-color: var(--b2b-color-hover-bg);
  color: var(--b2b-color-text-main);
}

.tab-count-badge {
  font-size: 10px;
  font-family: var(--b2b-font-family-mono);
  font-weight: 600;
  background-color: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  padding: 1px 5px;
  border-radius: 10px;
  color: var(--b2b-color-text-muted);
}

/* ── 컨텍스트 메뉴 ───────────────────── */
.tab-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

.tab-ctx-menu {
  position: fixed;
  min-width: 200px;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--b2b-color-bg-card);
  border: 1px solid var(--b2b-color-border);
  border-radius: 8px;
}

.menu-section-header {
  font-size: 11px;
  font-weight: 700;
  color: var(--b2b-color-text-muted);
  padding: 6px 10px 4px 10px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.tab-ctx-menu li:not(.divider):not(.menu-section-header) {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 12.5px;
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

.tab-ctx-menu li.danger {
  color: var(--b2b-color-danger);
}

.tab-ctx-menu li.danger:hover {
  background-color: rgba(220, 38, 38, 0.08);
}
</style>
