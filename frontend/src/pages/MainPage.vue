<template>
  <div class="main-page container-fluid p-4 bg-light">
    <!-- Hero Section -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm bg-primary text-white overflow-hidden hero-card">
          <div class="card-body p-5 position-relative">
            <div class="position-relative z-1">
              <h1 class="display-5 fw-bold mb-3">Welcome to NexHubStudio</h1>
              <p class="lead mb-4 opacity-75" style="max-width: 600px">
                관리자님, 환영합니다. 오늘도 효율적인 업무 관리를 도와드리겠습니다.<br />
                진행 중인 업무 의뢰 현황과 설비 상태를 확인하세요.
              </p>
              <div class="d-flex gap-3">
                <router-link to="/request-workflow" class="btn btn-light px-4 py-2 fw-semibold">
                  <i class="bi bi-briefcase me-2"></i>업무 의뢰 확인
                </router-link>
                <router-link to="/equipment-monitor" class="btn btn-outline-light px-4 py-2 fw-semibold">
                  <i class="bi bi-activity me-2"></i>설비 모니터링
                </router-link>
              </div>
            </div>
            <!-- Decorative circle -->
            <div class="decorative-circle"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Widgets Row -->
    <div class="row g-4 mb-4">
      <!-- Work Request Status -->
      <div class="col-md-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100 status-card">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-box bg-primary bg-opacity-10 text-primary rounded-3 p-3 me-3">
                <i class="bi bi-file-earmark-text fs-4"></i>
              </div>
              <div>
                <h6 class="text-muted mb-1 text-uppercase small fw-bold">오늘 요청된 업무</h6>
                <h3 class="mb-0 fw-bold">12 <span class="fs-6 text-success fw-normal">(+3)</span></h3>
              </div>
            </div>
            <div class="progress" style="height: 6px">
              <div class="progress-bar" role="progressbar" style="width: 65%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Approvals -->
      <div class="col-md-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100 status-card">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-box bg-warning bg-opacity-10 text-warning rounded-3 p-3 me-3">
                <i class="bi bi-hourglass-split fs-4"></i>
              </div>
              <div>
                <h6 class="text-muted mb-1 text-uppercase small fw-bold">승인 대기</h6>
                <h3 class="mb-0 fw-bold">5</h3>
              </div>
            </div>
            <div class="progress" style="height: 6px">
              <div class="progress-bar bg-warning" role="progressbar" style="width: 45%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Equipment Alerts -->
      <div class="col-md-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100 status-card">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-box bg-danger bg-opacity-10 text-danger rounded-3 p-3 me-3">
                <i class="bi bi-exclamation-triangle fs-4"></i>
              </div>
              <div>
                <h6 class="text-muted mb-1 text-uppercase small fw-bold">설비 알림</h6>
                <h3 class="mb-0 fw-bold">2</h3>
              </div>
            </div>
            <div class="progress" style="height: 6px">
              <div class="progress-bar bg-danger" role="progressbar" style="width: 20%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Users -->
      <div class="col-md-6 col-lg-3">
        <div class="card border-0 shadow-sm h-100 status-card">
          <div class="card-body">
            <div class="d-flex align-items-center mb-3">
              <div class="icon-box bg-info bg-opacity-10 text-info rounded-3 p-3 me-3">
                <i class="bi bi-people fs-4"></i>
              </div>
              <div>
                <h6 class="text-muted mb-1 text-uppercase small fw-bold">접속 사용자</h6>
                <h3 class="mb-0 fw-bold">48</h3>
              </div>
            </div>
            <div class="progress" style="height: 6px">
              <div class="progress-bar bg-info" role="progressbar" style="width: 85%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content & Side Widgets -->
    <div class="row g-4">
      <!-- Main: Recent Notices / Workflow Status -->
      <div class="col-lg-8">
        <!-- Notice Board -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center">
            <h5 class="card-title fw-bold mb-0">📢 최신 공지사항</h5>
            <router-link to="/posts" class="btn btn-sm btn-light">더보기</router-link>
          </div>
          <div class="card-body p-0">
            <div class="list-group list-group-flush">
              <a href="#" class="list-group-item list-group-item-action py-3 d-flex justify-content-between align-items-center" v-for="post in notices" :key="post.id">
                <div>
                  <span class="badge bg-primary bg-opacity-10 text-primary me-2">{{ post.category }}</span>
                  <span class="fw-medium text-dark">{{ post.title }}</span>
                </div>
                <small class="text-muted">{{ post.date }}</small>
              </a>
            </div>
          </div>
        </div>

        <!-- Recent Workflows -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center">
            <h5 class="card-title fw-bold mb-0">📋 최근 업무 의뢰</h5>
            <router-link to="/request-workflow" class="btn btn-sm btn-light">전체보기</router-link>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0 text-nowrap">
              <thead class="bg-light">
                <tr>
                  <th class="border-0 ps-4">제목</th>
                  <th class="border-0">요청자</th>
                  <th class="border-0">상태</th>
                  <th class="border-0 pe-4">일자</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="workflow in workflows" :key="workflow.id">
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="avatar rounded-circle bg-secondary bg-opacity-25 text-secondary me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 0.8rem">
                        {{ workflow.type[0] }}
                      </div>
                      <span class="fw-medium">{{ workflow.title }}</span>
                    </div>
                  </td>
                  <td>{{ workflow.requester }}</td>
                  <td>
                    <span class="badge rounded-pill" 
                      :class="{
                        'bg-success bg-opacity-10 text-success': workflow.status === '완료',
                        'bg-warning bg-opacity-10 text-warning': workflow.status === '진행중',
                        'bg-secondary bg-opacity-10 text-secondary': workflow.status === '대기'
                      }">
                      {{ workflow.status }}
                    </span>
                  </td>
                  <td class="text-muted pe-4">{{ workflow.date }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sidebar: Quick Links & Equipment -->
      <div class="col-lg-4">
        <!-- Quick Links -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white py-3 border-bottom-0">
            <h5 class="card-title fw-bold mb-0">🚀 바로가기</h5>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-6" v-for="link in quickLinks" :key="link.title">
                <router-link :to="link.to" class="d-block p-3 rounded-3 bg-light text-decoration-none text-center hover-up transition-fast text-dark">
                  <i :class="link.icon" class="fs-3 mb-2 d-block" :style="{ color: link.color }"></i>
                  <span class="small fw-semibold">{{ link.title }}</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Equipment Status Mini -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white py-3 border-bottom-0">
            <h5 class="card-title fw-bold mb-0">⚙️ 주요 설비 상태</h5>
          </div>
          <div class="card-body pt-0">
            <div v-for="eq in equipmentStatus" :key="eq.name" class="d-flex align-items-center py-3 border-bottom last-border-0">
              <div class="me-3 position-relative">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-white" 
                  :class="eq.status === 'Normal' ? 'bg-success' : 'bg-danger'"
                  style="width: 40px; height: 40px">
                  <i class="bi" :class="eq.status === 'Normal' ? 'bi-check-lg' : 'bi-exclamation-lg'"></i>
                </div>
              </div>
              <div class="flex-grow-1">
                <h6 class="mb-0 fw-semibold">{{ eq.name }}</h6>
                <small class="text-muted">{{ eq.code }}</small>
              </div>
              <span class="badge" :class="eq.status === 'Normal' ? 'bg-success' : 'bg-danger'">
                {{ eq.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MainPage',
  data() {
    return {
      notices: [
        { id: 1, category: '공지', title: '2026년 상반기 정기 설비 점검 안내', date: '2026.01.20' },
        { id: 2, category: '시스템', title: '시스템 유지보수 일정 안내 (1/25)', date: '2026.01.19' },
        { id: 3, category: '뉴스', title: 'NexHubStudio 2.0 업데이트 기능 소개', date: '2026.01.15' },
      ],
      workflows: [
        { id: 1, type: '유지보수', title: 'A라인 컨베이어 벨트 교체 요청', requester: '김철수', status: '진행중', date: '2026-01-21' },
        { id: 2, type: '설비지원', title: '용접 로봇 센서 오작동 점검', requester: '이영희', status: '대기', date: '2026-01-21' },
        { id: 3, type: '기타', title: '작업장 조명 설비 개선', requester: '박민수', status: '완료', date: '2026-01-20' },
        { id: 4, type: '유지보수', title: '냉각수 펌프 소음 점검', requester: '정지훈', status: '완료', date: '2026-01-19' },
      ],
      quickLinks: [
        { title: '사용자 관리', to: '/users', icon: 'bi-people-fill', color: '#0d6efd' },
        { title: '공통 코드', to: '/common-code-groups', icon: 'bi-code-square', color: '#6610f2' },
        { title: '게시글 작성', to: '/posts/write', icon: 'bi-pencil-square', color: '#198754' },
        { title: '컴포넌트 가이드', to: '/component-guide', icon: 'bi-book-half', color: '#fd7e14' },
      ],
      equipmentStatus: [
        { name: 'CNC Milling #01', code: 'EQ-2023-001', status: 'Normal' },
        { name: 'Welding Robot A', code: 'EQ-2023-005', status: 'Error' },
        { name: 'Conveyor Main', code: 'EQ-2022-104', status: 'Normal' },
      ]
    }
  }
}
</script>

<style scoped>
.hero-card {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
}

.decorative-circle {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
}

.status-card {
  transition: transform 0.2s ease-in-out;
}
.status-card:hover {
  transform: translateY(-5px);
}

.hover-up:hover {
  transform: translateY(-3px);
  background-color: #e9ecef !important;
}

.transition-fast {
  transition: all 0.2s ease;
}

.last-border-0:last-child {
  border-bottom: 0 !important;
}
</style>
