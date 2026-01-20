<template>
  <div class="portal-container">
    <!-- 1. 상단 슬라이드 섹션 (캐러셀) -->
    <section class="section-carousel">
      <div id="portalCarousel" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-indicators">
          <button type="button" data-bs-target="#portalCarousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
          <button type="button" data-bs-target="#portalCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
          <button type="button" data-bs-target="#portalCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
        </div>
        <div class="carousel-inner rounded-4 shadow-sm">
          <div class="carousel-item active" data-bs-interval="5000">
             <div class="slide-content bg-dark">
                <div class="slide-text">
                    <h2>스마트 팩토리 모니터링</h2>
                    <p>실시간 설비 현황과 생산성을 한눈에 확인하세요.</p>
                </div>
            </div>
          </div>
          <div class="carousel-item" data-bs-interval="5000">
             <div class="slide-content bg-primary">
                <div class="slide-text">
                    <h2>안전한 작업 환경</h2>
                    <p>작업자 안전을 위한 가이드라인과 수칙을 준수합니다.</p>
                </div>
            </div>
          </div>
          <div class="carousel-item" data-bs-interval="5000">
             <div class="slide-content bg-success">
                <div class="slide-text">
                    <h2>지속 가능한 성장</h2>
                    <p>혁신적인 기술로 미래를 선도하는 기업.</p>
                </div>
            </div>
          </div>
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#portalCarousel" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Previous</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#portalCarousel" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Next</span>
        </button>
      </div>
    </section>

    <!-- 2. 퀵 링크 섹션 -->
    <section class="section-quick-links">
      <h4 class="section-title">Quick Links</h4>
      <div class="flex-row link-grid">
        <div class="link-item" v-for="(link, index) in quickLinks" :key="index">
          <a :href="link.url" target="_blank" class="link-card">
            <div class="card-content">
              <div class="icon-circle" :class="link.colorClass">
                <i :class="['bi', link.icon]"></i>
              </div>
              <span class="link-label">{{ link.label }}</span>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- 3. 대시보드 분할 레이아웃 -->
    <section class="board-container">
        
        <!-- 좌측: 공지사항 -->
        <div class="group-notices">
            <!-- 헤더 영역 -->
            <div class="group-header">
                <h4 class="group-title"><i class="bi bi-megaphone icon-primary"></i>공지사항</h4>
                <a href="#" class="btn-more">More <i class="bi bi-chevron-right"></i></a>
            </div>
            
            <!-- 카드 그리드 -->
            <div class="flex-grid four-columns">
                <div class="grid-item" v-for="(notice, index) in notices" :key="`notice-${index}`">
                    <div class="content-card">
                         <!-- 카드 내부 레이아웃 -->
                        <div class="card-inner">
                            <div class="card-center">
                                <p class="card-desc">{{ notice.preview }}</p>
                            </div>
                            <div class="card-bottom">
                                <span class="card-date">{{ notice.date }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 우측: 업무 매뉴얼 -->
        <div class="group-manuals">
            <div class="group-header">
                <h4 class="group-title"><i class="bi bi-journal-text icon-success"></i>업무 메뉴얼</h4>
                <a href="#" class="btn-more">More <i class="bi bi-chevron-right"></i></a>
            </div>

            <div class="flex-grid two-columns">
                <div class="grid-item" v-for="(manual, index) in manuals" :key="`manual-${index}`">
                    <div class="content-card">
                        <div class="card-inner">
                            <div class="card-center">
                                <p class="card-desc card-title-text">{{ manual.title }}</p>
                            </div>
                            <div class="card-bottom">
                                <span class="card-date">Ver {{ manual.version }}</span>
                                <span class="card-date">{{ manual.date }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'PortalSample',
  data() {
    return {
      quickLinks: [
        { label: '네이버', url: 'https://www.naver.com', icon: 'bi-n-circle', colorClass: 'bg-success' },
        { label: '구글', url: 'https://www.google.com', icon: 'bi-google', colorClass: 'bg-primary' },
        { label: '유튜브', url: 'https://www.youtube.com', icon: 'bi-youtube', colorClass: 'bg-danger' },
        { label: '사내메일', url: '#', icon: 'bi-envelope', colorClass: 'bg-info' },
        { label: '전자결재', url: '#', icon: 'bi-clipboard-check', colorClass: 'bg-warning' },
        { label: '조직도', url: '#', icon: 'bi-people', colorClass: 'bg-secondary' },
      ],
      notices: [
        { 
            date: '2026.01.20', 
            preview: '오는 25일부터 3일간 공장 전체 설비 점검이 진행됩니다. 각 부서 담당자분들은 사전 준비 바랍니다.'
        },
        { 
            date: '2026.01.18', 
            preview: '차세대 ERP 도입에 따른 부서별 핵심 사용자(Key User) 교육 일정을 안내드립니다.'
        },
        { 
            date: '2026.01.15', 
            preview: '개인정보 보호법 개정에 따라 사내 PC 및 모바일 기기 보안 정책이 강화되었습니다.'
        },
        { 
            date: '2026.01.10', 
            preview: '이번 달 생산성 향상과 아이디어 제안 부문에서 우수한 성과를 거둔 사원들을 소개합니다.'
        },
      ],
      manuals: [
        {
             title: '품질 관리 표준',
             version: '2.1',
             date: '2025.12.01',
        },
        {
             title: '설비 장애 대응',
             version: '1.5',
             date: '2025.11.15',
        }
      ]
    }
  }
}
</script>

<style scoped>
.portal-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Pretendard', sans-serif;
}

/* 1. 캐러셀 스타일 */
.section-carousel {
  margin-bottom: 3rem;
}
.slide-content {
  height: 300px;
  display: flex;             /* 콘텐츠 중앙 정렬을 위한 Flexbox */
  align-items: center;       /* 수직 중앙 */
  justify-content: center;   /* 수평 중앙 */
  color: white;
}
.slide-text {
  text-align: center;
}

/* 2. 퀵 링크 섹션 */
.section-quick-links {
  margin-bottom: 3rem;
  padding: 0 0.5rem;
}
.section-title {
  margin-bottom: 1rem;
  font-weight: bold;
  opacity: 0.6;
  text-transform: uppercase;
  font-size: 0.9rem;
}

.flex-row {
  display: flex;            /* Flex 컨테이너 */
  flex-wrap: wrap;          /* 줄바꿈 허용 */
  gap: 1rem;                /* 아이템 간격 */
}

.link-item {
  flex: 1 1 150px;          
  min-width: 140px;
}

.link-card {
  display: block;
  text-decoration: none;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}
.link-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  height: 100%;
}

.icon-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: white;
  font-size: 1.25rem;
}

/* 3. 대시보드 분할 레이아웃 */
.board-container {
  display: flex;            
  flex-wrap: wrap;          
  gap: 2rem;                
}

/* 그룹별 영역 설정 */
.group-notices {
  flex: 2 1 600px;          /* 2비율, 최소 600px */
}
.group-manuals {
  flex: 1 1 300px;          /* 1비율, 최소 300px */
}

/* 그룹 헤더 */
.group-header {
  display: flex;                   
  justify-content: space-between;  
  align-items: flex-end;           
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}
.group-title {
  margin: 0;
  font-weight: bold;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
}
.icon-primary { color: #0d6efd; margin-right: 0.5rem; }
.icon-success { color: #198754; margin-right: 0.5rem; }

.btn-more {
  text-decoration: none;
  color: #6c757d;
  font-size: 0.875rem;
}
.btn-more:hover {
  text-decoration: underline;
  color: #000;
}

/* 내부 카드 그리드 */
.flex-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.grid-item {
  min-width: 200px; 
}

/* 4컬럼 그리드 계산 */
.four-columns .grid-item {
  flex: 1 1 calc(25% - 1rem); 
  max-width: 100%; 
}

/* 2컬럼 그리드 계산 */
.two-columns .grid-item {
  flex: 1 1 calc(50% - 1rem); 
}

/* 카드 스타일 */
.content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  min-height: 380px;        /* 기존 trump-shape 스타일 병합 */
  height: 100%;
}
.content-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.card-inner {
  height: 100%;
  padding: 1.5rem;
  display: flex;            
  flex-direction: column;   
  justify-content: space-between;
}

.card-center {
  flex: 1;                  
  display: flex;
  align-items: center;      
  justify-content: center;
  text-align: center;
}

.card-desc {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  line-height: 1.6;
  font-weight: 500;
  
  /* 3줄 말줄임 처리 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-title-text {
  font-size: 1.25rem;
  font-weight: bold;
}

.card-bottom {
  margin-top: 1rem;
  text-align: center;
  border-top: 1px solid #f8f8f8;
  padding-top: 1rem;
}

.card-date {
  display: block;
  font-size: 0.85rem;
  color: #888;
}

/* 반응형 처리 */
@media (max-width: 992px) {
  .four-columns .grid-item {
    flex: 1 1 calc(50% - 1rem); /* 태블릿: 한 줄에 2개 */
  }
}
@media (max-width: 576px) {
  .four-columns .grid-item,
  .two-columns .grid-item {
    flex: 1 1 100%; /* 모바일: 한 줄에 1개 */
  }
  .board-container {
    flex-direction: column; 
  }
}

/* 유틸리티 (필요 시 부트스트랩 클래스로 대체 가능) */
.bg-success { background-color: #198754 !important; }
.bg-primary { background-color: #0d6efd !important; }
.bg-danger { background-color: #dc3545 !important; }
.bg-info { background-color: #0dcaf0 !important; }
.bg-warning { background-color: #ffc107 !important; }
.bg-secondary { background-color: #6c757d !important; }
.bg-dark { background-color: #212529 !important; }
</style>
