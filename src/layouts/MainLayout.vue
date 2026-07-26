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
          <keep-alive>
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import VbenSidebar from '../components/vben/VbenSidebar.vue';
import VbenHeader from '../components/vben/VbenHeader.vue';
import VbenTabBar from '../components/vben/VbenTabBar.vue';
import PageHeader from '../components/PageHeader.vue';
import { useTabStore } from '../stores/tabStore';

const isSidebarCollapsed = ref(false);
const tabStore = useTabStore();
const route = useRoute();

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
