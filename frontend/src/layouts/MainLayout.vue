<!-- MainLayout.vue -->
<template>
  <!-- 
  transition name 옵션:
    "fade" - 페이드 인/아웃
    "slide" - 좌우 슬라이드
    "slide-up" - 상하 슬라이드
    "scale" - 스케일 
  mode 설명:
    out-in:  [페이지A 사라짐] → [빈 화면] → [페이지B 나타남]
    in-out:  [페이지A + 페이지B 겹침] → [페이지A 사라짐]
    기본값:   [페이지A 사라짐 + 페이지B 나타남 동시에]
    -->
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
            <small class="text-muted"> © 2025 NexHubStudio. All rights reserved. </small>
          </div>
          <div class="col-md-6 text-md-end">
            <small class="text-muted"> Vue 3 + Bootstrap 5 + JqWidgets </small>
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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 헤더는 고정 높이 또는 자연스럽게 */
.app-header {
  z-index: 1000;
  position: relative;
}

/* 바디: 남은 높이 모두 차지 */
.app-body {
  flex: 1;
  min-height: 0; /* 중요: 내부 스크롤을 위해 */
  overflow: hidden; /* 전체 페이지 스크롤 방지, 내부 스크롤 권장 */
}

/* 메인 컨텐츠 영역 */
.main-content {
  flex: 1;
  min-width: 0; /* Flex item shrinking 문제 방지 */
  background-color: #f8f9fa; /* 배경색 살짝 */
  overflow-y: auto; /* 내용 많을 때 스크롤 */
  position: relative;
}

.app-footer {
  background-color: var(--bs-light);
  border-top: 1px solid var(--bs-border-color);
  padding: 0.5rem 0;
  z-index: 1000;
}
</style>
