<template>
  <div class="vben-tab-bar d-flex align-items-center px-2" :class="`style-${tabStyle}`">
    <!-- Left Scroll Button -->
    <button
      class="btn btn-xs btn-tab-scroll me-1 flex-shrink-0"
      @click="scrollTabs('left')"
      title="왼쪽으로 스크롤"
    >
      <i class="bi bi-chevron-left"></i>
    </button>

    <!-- Tab Scroll Box Container -->
    <div ref="tabScrollContainer" class="tab-scroll-box d-flex align-items-center flex-grow-1 overflow-x-auto">
      <div
        v-for="tab in visitedTabs"
        :key="tab.path"
        class="vben-tab d-flex align-items-center flex-shrink-0"
        :class="{ 'active-tab': activeTab === tab.path }"
        @click="navigateTo(tab.path)"
        @contextmenu.prevent="openContextMenu($event, tab.path)"
      >
        <i v-if="tab.meta?.icon" class="tab-icon bi" :class="tab.meta.icon"></i>
        <span class="tab-title text-truncate">{{ tab.meta?.title || tab.name }}</span>
        <button
          v-if="visitedTabs.length > 1"
          type="button"
          class="tab-close"
          title="탭 닫기"
          @click.stop="closeTab(tab.path)"
        >
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>

    <!-- Right Scroll Button -->
    <button
      class="btn btn-xs btn-tab-scroll ms-1 flex-shrink-0"
      @click="scrollTabs('right')"
      title="오른쪽으로 스크롤"
    >
      <i class="bi bi-chevron-right"></i>
    </button>

    <!-- 임시: 스타일 미리보기 토글 (선택 후 제거 예정) -->
    <div class="tab-style-switch flex-shrink-0 ms-2" title="탭 스타일 미리보기 (임시)">
      <button
        type="button"
        :class="{ active: tabStyle === 'underline' }"
        @click="setStyle('underline')"
      >언더라인</button>
      <button
        type="button"
        :class="{ active: tabStyle === 'pill' }"
        @click="setStyle('pill')"
      >필</button>
    </div>

    <!-- 탭 관리 버튼 (텔레포트 메뉴 사용 → 탭바 overflow:hidden에 안 잘림) -->
    <button
      type="button"
      class="btn btn-xs btn-tab-scroll no-caret ms-1 flex-shrink-0"
      title="탭 관리 (닫기 옵션)"
      @click.stop="openTabMenu($event)"
    >
      <i class="bi bi-three-dots-vertical"></i>
    </button>

    <!-- 우클릭 컨텍스트 메뉴 -->
    <teleport to="body">
      <div
        v-if="ctxMenu.show"
        class="tab-ctx-backdrop"
        @click="ctxMenu.show = false"
        @contextmenu.prevent="ctxMenu.show = false"
      >
        <ul class="tab-ctx-menu shadow" :style="{ top: ctxMenu.y + 'px', left: ctxMenu.x + 'px' }" @click.stop>
          <li @click="closeTab(ctxMenu.path); ctxMenu.show = false">
            <i class="bi bi-x-lg me-2"></i>이 탭 닫기
          </li>
          <li @click="closeOtherTabs(ctxMenu.path); ctxMenu.show = false">
            <i class="bi bi-x-circle me-2"></i>다른 탭 닫기
          </li>
          <li class="danger" @click="closeAllTabs(); ctxMenu.show = false">
            <i class="bi bi-dash-circle me-2"></i>모든 탭 닫기
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

// 임시: 스타일 미리보기 상태 (localStorage 유지 → 새로고침해도 비교 가능)
const tabStyle = ref(localStorage.getItem('tab_style_preview') || 'underline');
const setStyle = (s) => {
  tabStyle.value = s;
  localStorage.setItem('tab_style_preview', s);
};

const ctxMenu = ref({ show: false, x: 0, y: 0, path: '' });

const navigateTo = (path) => {
  router.push(path);
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
    x: Math.min(event.clientX, window.innerWidth - 160),
    y: event.clientY,
    path,
  };
};

// ⋮ 버튼: 현재 활성 탭 기준으로 같은 닫기 메뉴를 버튼 아래에 연다.
const openTabMenu = (event) => {
  const r = event.currentTarget.getBoundingClientRect();
  ctxMenu.value = {
    show: true,
    x: Math.min(r.left, window.innerWidth - 160),
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
  transition: background-color 0.3s, border-color 0.3s;
}

.tab-scroll-box {
  scroll-behavior: smooth;
  scrollbar-width: none;
  gap: 2px;
  height: 100%;
}

.tab-scroll-box::-webkit-scrollbar {
  height: 0;
}

/* ── 공통 탭 베이스 ───────────────────────────── */
.vben-tab {
  cursor: pointer;
  font-size: 0.82rem;
  line-height: 1;
  user-select: none;
  color: var(--b2b-color-text-muted, #64748b);
  max-width: 180px;
  transition: color 0.15s, background-color 0.15s, box-shadow 0.15s;
}

.tab-icon {
  font-size: 0.85rem;
  margin-right: 6px;
  opacity: 0.85;
}

.tab-title {
  max-width: 130px;
  display: inline-block;
  vertical-align: middle;
}

.tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font-size: 0.8rem;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s, background-color 0.15s;
}

.vben-tab:hover .tab-close,
.vben-tab.active-tab .tab-close {
  opacity: 0.65;
}

.tab-close:hover {
  opacity: 1 !important;
  background-color: var(--b2b-color-hover-bg, #e2e8f0);
  color: var(--b2b-color-danger, #dc2626);
}

/* ── A. 언더라인 스타일 ──────────────────────── */
.style-underline .vben-tab {
  height: 100%;
  padding: 0 14px;
  border-radius: 0;
  box-shadow: inset 0 -2px 0 0 transparent;
}

.style-underline .vben-tab:hover {
  color: var(--b2b-color-text-main, #1e293b);
  background-color: var(--b2b-color-hover-bg, #f1f5f9);
}

.style-underline .vben-tab.active-tab {
  color: var(--b2b-color-primary, #2563eb);
  font-weight: 600;
  background-color: transparent;
  box-shadow: inset 0 -2px 0 0 var(--b2b-color-primary, #2563eb);
}

/* ── B. 필(pill) 스타일 ─────────────────────── */
.style-pill .vben-tab {
  height: 26px;
  padding: 0 12px;
  border-radius: 999px;
}

.style-pill .vben-tab:hover {
  color: var(--b2b-color-text-main, #1e293b);
  background-color: var(--b2b-color-hover-bg, #f1f5f9);
}

.style-pill .vben-tab.active-tab {
  color: var(--b2b-color-primary, #2563eb);
  font-weight: 600;
  background-color: color-mix(in srgb, var(--b2b-color-primary, #2563eb) 14%, transparent);
}

/* ── 스크롤/관리 버튼 ───────────────────────── */
.btn-tab-scroll {
  background-color: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}

.btn-tab-scroll:hover {
  background-color: var(--b2b-color-hover-bg);
  color: var(--text-primary);
}

.no-caret::after {
  display: none;
}

/* ── 임시 스타일 토글 ───────────────────────── */
.tab-style-switch {
  display: inline-flex;
  border: 1px solid var(--b2b-color-border, #e2e8f0);
  border-radius: 6px;
  overflow: hidden;
}

.tab-style-switch button {
  border: none;
  background: transparent;
  color: var(--b2b-color-text-muted, #64748b);
  font-size: 0.72rem;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-style-switch button.active {
  background: var(--b2b-color-primary, #2563eb);
  color: #fff;
  font-weight: 600;
}

/* ── 우클릭 컨텍스트 메뉴 ───────────────────── */
.tab-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

.tab-ctx-menu {
  position: fixed;
  min-width: 148px;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--b2b-color-bg-card, #fff);
  border: 1px solid var(--b2b-color-border, #e2e8f0);
  border-radius: 8px;
}

.tab-ctx-menu li {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 0.8rem;
  color: var(--b2b-color-text-main, #1e293b);
  cursor: pointer;
  transition: background-color 0.12s;
}

.tab-ctx-menu li:hover {
  background-color: var(--b2b-color-hover-bg, #f1f5f9);
}

.tab-ctx-menu li.danger {
  color: var(--b2b-color-danger, #dc2626);
}
</style>
