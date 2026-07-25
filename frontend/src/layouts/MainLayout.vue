<!-- MainLayout.vue -->
<template>
  <div class="app-layout">
    <!-- Header -->
    <header class="app-header">
      <NavBar />
    </header>

    <!-- Body (Sidebar + Content) -->
    <div class="app-body d-flex">
      <!-- Sidebar (Desktop only) -->
      <aside class="d-none d-lg-block">
        <AppSidebar :is-collapsed="isSidebarCollapsed" @toggle="toggleSidebar" />
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <div class="p-3 h-100">
          <router-view v-slot="{ Component }">
            <transition :name="transitionName" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-6">
            <small class="text-muted"> © 2026 NexHub Grid Studio. All rights reserved. </small>
          </div>
          <div class="col-md-6 text-md-end">
            <small class="text-muted"> Vue 3 + RealGrid 2 + RealPivot + Bootstrap 5 </small>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import NavBar from '../components/NavBar.vue'
import AppSidebar from '../components/AppSidebar.vue'
import '../assets/styles/transitions.css'

export default {
  name: 'MainLayout',
  components: { NavBar, AppSidebar },
  data() {
    return {
      transitionName: 'slide-right',
      lastPos: null,
      isSidebarCollapsed: false,
    }
  },
  watch: {
    $route() {
      const currentPos = history.state?.position || 0
      const isBack = this.lastPos !== null && currentPos < this.lastPos

      this.transitionName = isBack ? 'slide-left' : 'slide-right'
      this.lastPos = currentPos
    },
  },
  methods: {
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
  },
}
</script>

<style scoped>
/* 전체 레이아웃 */
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 헤더 */
.app-header {
  z-index: 1000;
  position: relative;
}

/* 바디: 남은 높이 차지 */
.app-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 메인 컨텐츠 영역 */
.main-content {
  flex: 1;
  min-width: 0;
  background-color: var(--nex-bg, #f0f2f5);
  overflow-y: auto;
  position: relative;
}

.app-footer {
  background-color: var(--bs-light);
  border-top: 1px solid var(--bs-border-color);
  padding: 0.5rem 0;
  z-index: 1000;
}
</style>
