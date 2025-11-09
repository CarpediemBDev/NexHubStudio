<!-- NavBar.vue -->
<template>
  <div>
    <nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom">
      <div class="container-fluid">
        <!-- 모바일: 뒤로가기 버튼 (브랜드 위치에) -->
        <div class="d-flex d-lg-none align-items-center">
          <button
            v-if="canGoBack"
            class="btn btn-outline-secondary btn-sm me-2"
            @click="goBack"
            aria-label="뒤로가기"
          >
            <i class="bi bi-arrow-left"></i>
          </button>
          <span class="navbar-brand fw-semibold mb-0">NexHubStudio</span>
        </div>

        <!-- 데스크톱: 일반 브랜드 -->
        <a class="navbar-brand fw-semibold d-none d-lg-block" href="#">NexHubStudio</a>

        <!-- 모바일: 햄버거 메뉴만 -->
        <button
          class="navbar-toggler d-lg-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#navDrawer"
          aria-controls="navDrawer"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- 데스크톱: 드롭다운 2단 -->
        <div class="navbar-collapse d-none d-lg-flex">
          <ul class="navbar-nav me-auto">
            <li v-for="(grp, i) in menu" :key="`m-${i}`" class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                {{ grp.label }}
              </a>
              <ul class="dropdown-menu">
                <li v-for="(item, j) in grp.children" :key="`mi-${i}-${j}`">
                  <RouterLink v-if="item.to" class="dropdown-item" :to="item.to">
                    {{ item.label }}
                  </RouterLink>
                  <span v-else class="dropdown-item text-muted">{{ item.label }}</span>
                </li>
              </ul>
            </li>
          </ul>
          <span class="navbar-text small text-muted">Vue3 + Bootstrap 5</span>
        </div>
      </div>
    </nav>

    <!-- 모바일: 오프캔버스(상단 사용자 정보 + 콜랩스 2단 메뉴) -->
    <div class="offcanvas offcanvas-start" tabindex="-1" id="navDrawer">
      <!-- 사용자 정보 + 홈 + 로그아웃 -->
      <div class="offcanvas-header border-bottom justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-person-circle fs-4"></i>
          <div class="d-flex flex-column">
            <strong class="lh-1">{{ user.name }}</strong>
            <small class="text-muted">{{ user.email }}</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <!-- 아이콘만 (텍스트 제거) -->
          <RouterLink
            to="/"
            class="btn btn-sm btn-outline-secondary"
            @click="closeOffcanvas"
            aria-label="홈으로 이동"
          >
            <i class="bi bi-house"></i>
          </RouterLink>

          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            @click="onSignOut"
            data-bs-dismiss="offcanvas"
            aria-label="로그아웃"
          >
            <i class="bi bi-box-arrow-right"></i
            ><span class="ms-1 d-none d-sm-inline">로그아웃</span>
          </button>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="닫기"
          ></button>
        </div>
      </div>

      <div class="offcanvas-body p-0">
        <div id="navAccordion" class="list-group list-group-flush">
          <!-- 1단: 그룹 -->
          <template v-for="(grp, i) in menu" :key="`g-${i}`">
            <button
              type="button"
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              data-bs-toggle="collapse"
              :data-bs-target="`#grp-${i}`"
            >
              <span>{{ grp.label }}</span>
              <small class="text-muted">▾</small>
            </button>

            <!-- 2단: 항목 -->
            <div class="collapse" :id="`grp-${i}`" data-bs-parent="#navAccordion">
              <ul class="list-group list-group-flush">
                <li
                  v-for="(item, j) in grp.children"
                  :key="`gi-${i}-${j}`"
                  class="list-group-item ps-4"
                >
                  <RouterLink
                    v-if="item.to"
                    :to="item.to"
                    class="text-decoration-none d-block"
                    @click="closeOffcanvas"
                  >
                    {{ item.label }}
                  </RouterLink>
                  <span v-else>{{ item.label }}</span>
                </li>
              </ul>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { RouterLink } from 'vue-router'

export default {
  name: 'NavBar',
  components: { RouterLink },
  data() {
    return {
      user: { name: '홍길동', email: 'hong@example.com' },
      canGoBack: false,
      // 중간 '사용자 목록' 단계 없이 바로 라우트 연결
      menu: [
        {
          label: '사용자 관리',
          children: [
            { label: '사용자', to: '/' },
            { label: '사용자(검색Grid)', to: '/search-grid' },
            { label: 'JqxGrid 샘플', to: '/jqx-grid' },
            { label: '그룹 관리' },
            { label: '설정' },
          ],
        },
        {
          label: '사용자 배정',
          children: [
            { label: '사용자 배정 (세로)', to: '/user-assignment-vertical' },
            { label: '사용자 배정 (공통목록)', to: '/user-assignment-shared' },
          ],
        },
        {
          label: '교육 관리',
          children: [{ label: '강좌 목록' }, { label: '수강 현황' }, { label: '시험/평가' }],
        },
        {
          label: '개발 가이드',
          children: [{ label: '공통 컴포넌트 가이드', to: '/component-guide' }],
        },
        {
          label: '시스템',
          children: [{ label: '환경설정' }, { label: '공지사항' }],
        },
      ],
    }
  },
  mounted() {
    // 히스토리 상태 체크
    this.checkBackButton()

    // popstate 이벤트로 뒤로가기 버튼 상태 업데이트
    window.addEventListener('popstate', this.checkBackButton)
  },
  beforeUnmount() {
    window.removeEventListener('popstate', this.checkBackButton)
  },
  watch: {
    $route() {
      // 라우트 변경 시 뒤로가기 버튼 상태 체크
      this.$nextTick(this.checkBackButton)
    },
  },
  methods: {
    checkBackButton() {
      // 브라우저 히스토리에 이전 페이지가 있는지 확인
      this.canGoBack = window.history.length > 1
    },
    goBack() {
      // 뒤로가기 실행
      if (this.canGoBack) {
        this.$router.go(-1)
      }
    },
    closeOffcanvas() {
      // Bootstrap 오프캔버스 수동으로 닫기
      const offcanvasElement = document.getElementById('navDrawer')
      if (offcanvasElement) {
        const offcanvas = window.bootstrap?.Offcanvas?.getInstance(offcanvasElement)
        if (offcanvas) {
          offcanvas.hide()
        }
      }
    },
    onSignOut() {
      // TODO: 실제 로그아웃 로직(토큰 삭제, 세션 종료, API 호출 등) 구현
      // 예: localStorage.removeItem('token')
      alert('로그아웃 기능은 아직 구현되지 않았습니다.')
    },
  },
}
</script>

<style scoped>
.list-group-item {
  min-height: 44px;
}
</style>
