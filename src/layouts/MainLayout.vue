<template>
  <div class="vben-layout d-flex h-100 overflow-hidden">
    <!-- Left Collapsible Sidebar -->
    <VbenSidebar :collapsed="isSidebarCollapsed" />

    <!-- Right Workspace -->
    <div class="vben-main-wrapper d-flex flex-column flex-grow-1 overflow-hidden">
      <!-- Header -->
      <VbenHeader @toggle-sidebar="toggleSidebar" />
      
      <!-- Multi-Tab Bar -->
      <VbenTabBar />

      <!-- Main Workspace -->
      <main class="vben-workspace flex-grow-1 overflow-auto p-3 position-relative">
        <!-- Global Breadcrumb Header -->
        <PageHeader />
        <router-view v-slot="{ Component, route }">
          <!-- meta.keepAlive 페이지(목록/검색 등)만 캐시. include 목록은 router meta 에서 자동 도출 -->
          <keep-alive :include="cachedPages">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VbenSidebar from '../components/vben/VbenSidebar.vue';
import VbenHeader from '../components/vben/VbenHeader.vue';
import VbenTabBar from '../components/vben/VbenTabBar.vue';
import PageHeader from '../components/PageHeader.vue';
import { useTabStore } from '../stores/tabStore';

const isSidebarCollapsed = ref(false);
const tabStore = useTabStore();
const route = useRoute();

// keep-alive 대상 = router meta.keepAlive 가 true 인 페이지의 컴포넌트 name 목록 (단일 소스: router meta)
const cachedPages = useRouter()
  .getRoutes()
  .filter((r) => r.meta?.keepAlive)
  .map((r) => r.components?.default?.name)
  .filter(Boolean);

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

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
}
</style>
