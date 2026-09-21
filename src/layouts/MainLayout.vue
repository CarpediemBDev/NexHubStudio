<template>
  <div class="vben-layout d-flex h-100 overflow-hidden position-relative">
    <!-- Left Collapsible Sidebar -->
    <VbenSidebar :collapsed="tabStore.sidebarCollapsed" @toggle="tabStore.toggleSidebar" />

    <!-- Discord Drawer Backdrop Overlay -->
    <div 
      v-if="tabStore.sidebarToggleStyle === 'drawer' && !tabStore.sidebarCollapsed" 
      class="vben-drawer-backdrop position-fixed top-0 start-0 w-100 h-100"
      @click="tabStore.toggleSidebar"
      title="클릭하여 메뉴 닫기"
    ></div>

    <!-- Right Workspace -->
    <div class="vben-main-wrapper d-flex flex-column flex-grow-1 overflow-hidden">
      <!-- Header (TopBar 48px) -->
      <VbenHeader 
        :sidebar-collapsed="tabStore.sidebarCollapsed" 
        @toggle-sidebar="tabStore.toggleSidebar" 
      />
      
      <!-- Multi-Tab Bar (38px) -->
      <VbenTabBar />

      <!-- Main Workspace -->
      <main class="vben-workspace flex-grow-1 overflow-auto px-4 py-3 position-relative">
        <!-- Global Header Component (Compact) -->
        <PageHeader />
        <router-view v-slot="{ Component, route }">
          <component :is="Component" :key="route.fullPath" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import VbenSidebar from '../components/vben/VbenSidebar.vue';
import VbenHeader from '../components/vben/VbenHeader.vue';
import VbenTabBar from '../components/vben/VbenTabBar.vue';
import PageHeader from '../components/PageHeader.vue';
import { useTabStore } from '../stores/tabStore';

const tabStore = useTabStore();
const route = useRoute();

const toggleSidebar = () => {
  tabStore.toggleSidebar();
};

// Global Shortcut: Alt+B (or Ctrl+B) to toggle sidebar
const handleGlobalKeydown = (e) => {
  if (e.altKey && (e.key === 'b' || e.key === 'B' || e.key === 'ㅠ')) {
    e.preventDefault();
    tabStore.toggleSidebar();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

// Add tab when route changes
watch(
  () => route.path,
  () => {
    tabStore.addTab(route);
  },
  { immediate: true }
);
</script>

<style scoped>
.vben-layout {
  height: 100vh;
  width: 100vw;
  background-color: var(--b2b-color-bg-body);
}
.vben-main-wrapper {
  min-width: 0;
}
.vben-workspace {
  background-color: var(--b2b-color-bg-body);
  padding: 18px var(--b2b-space-5) !important;
}

/* Discord Drawer Backdrop Overlay */
.vben-drawer-backdrop {
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  z-index: 1035;
  transition: opacity 0.2s ease;
  cursor: pointer;
}
</style>
