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
    <header>
      <NavBar />
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition :name="transitionName" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

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
import '../assets/styles/transitions.css'

export default {
  name: 'MainLayout',
  components: { NavBar },
  data() {
    return {
      transitionName: 'slide-right',
      lastPos: null,
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
}
</script>

<style scoped>
/* 전체 레이아웃 */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  min-height: 0; /* flex item shrinking 허용 */
}

.app-footer {
  background-color: var(--bs-light);
  border-top: 1px solid var(--bs-border-color);
  padding: 1rem 0;
  margin-top: auto;
}
</style>
