<template>
  <header class="vben-header d-flex justify-content-between align-items-center px-3 border-bottom shadow-sm">
    <div class="d-flex align-items-center">
      <button class="btn btn-sm btn-action me-3" @click="$emit('toggle-sidebar')" title="사이드바 토글">
        <i class="bi bi-list fs-5"></i>
      </button>
      <h5 class="m-0 text-primary fw-bold">NexHubStudio</h5>
    </div>
    
    <div class="vben-header-actions d-flex align-items-center gap-2 flex-shrink-0">
      <!-- Global Theme Switcher Button -->
      <button 
        class="btn btn-sm btn-header-action d-flex align-items-center gap-1.5 px-2.5 py-1" 
        @click="tabStore.toggleSidebarTheme()" 
        :title="tabStore.sidebarTheme === 'light' ? '다크 테마 모드로 전환' : '라이트 테마 모드로 전환'"
      >
        <i :class="['bi', tabStore.sidebarTheme === 'light' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-primary']"></i>
        <span class="small font-monospace fw-bold">{{ tabStore.sidebarTheme === 'light' ? 'Light' : 'Dark Navy' }}</span>
      </button>

      <button class="btn btn-sm btn-header-action px-2 py-1" @click="toggleFullscreen" title="전체화면 전환">
        <i class="bi bi-arrows-fullscreen"></i>
      </button>

      <div class="dropdown">
        <button class="btn btn-sm btn-header-action dropdown-toggle d-flex align-items-center gap-1 px-2.5 py-1" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-person-circle text-primary"></i>
          <span class="small fw-semibold">Admin</span>
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow border-0">
          <li><a class="dropdown-item small py-1.5" href="#"><i class="bi bi-person me-2"></i>Profile</a></li>
          <li><a class="dropdown-item small py-1.5" href="#"><i class="bi bi-gear me-2"></i>Settings</a></li>
          <li><hr class="dropdown-divider my-1"></li>
          <li><a class="dropdown-item small py-1.5 text-danger" href="#" @click.prevent="logout"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
        </ul>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useTabStore } from '../../stores/tabStore';

const router = useRouter();
const tabStore = useTabStore();

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
  background-color: var(--b2b-color-header-bg);
  border-color: var(--b2b-color-border) !important;
  color: var(--b2b-color-text-main);
  transition: background-color 0.3s, border-color 0.3s;
}

.btn-header-action {
  background-color: var(--b2b-color-bg-body);
  border: 1px solid var(--b2b-color-border);
  color: var(--b2b-color-text-main);
  transition: all 0.15s ease-in-out;
}

.btn-header-action:hover {
  background-color: var(--b2b-color-tab-bg);
  border-color: var(--b2b-color-primary);
  color: var(--b2b-color-primary);
}
</style>
