<template>
  <div class="grid-list-tab">
    <!-- 1. SearchGrid 가이드 -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-2 px-3">
        <div>
          <h6 class="b2b-text-h2 text-theme-primary mb-0 fw-bold">
            <i class="bi bi-search me-2 text-info"></i>SearchGrid - 검색 조건 통합 그리드
          </h6>
        </div>
        <button class="btn btn-sm btn-outline-secondary py-1 px-2 b2b-text-xs" @click="showCodeSearchGrid = !showCodeSearchGrid">
          <i class="bi bi-code-slash me-1"></i> {{ showCodeSearchGrid ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body p-3">
        <SearchGrid ref="searchGrid" @search="handleSearch" @open-user-popup="handlePopup" />
      </div>

      <div v-if="showCodeSearchGrid" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> SearchGrid 소스코드</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(searchGridCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ searchGridCode }}</code></pre>
      </div>
    </div>

    <!-- 2. PagedList 가이드 -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-2 px-3">
        <div>
          <h6 class="b2b-text-h2 text-theme-primary mb-0 fw-bold">
            <i class="bi bi-list-stars me-2 text-warning"></i>PagedList - 페이징 카드 리스트
          </h6>
        </div>
        <button class="btn btn-sm btn-outline-secondary py-1 px-2 b2b-text-xs" @click="showCodePagedList = !showCodePagedList">
          <i class="bi bi-code-slash me-1"></i> {{ showCodePagedList ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body p-3">
        <PagedList
          :items="pagedItems"
          :page-size="3"
          :current-page="currentPage"
          @page-change="currentPage = $event"
        >
          <template #item="{ item }">
            <div class="card mb-2 border">
              <div class="card-body py-2 px-3 d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-0 b2b-text-h2 text-theme-primary">{{ item.name }}</h6>
                  <p class="mb-0 text-muted b2b-text-xs">{{ item.description }}</p>
                </div>
                <span class="badge bg-primary-subtle text-primary">{{ item.status || '정상' }}</span>
              </div>
            </div>
          </template>
        </PagedList>
      </div>

      <div v-if="showCodePagedList" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> PagedList 소스코드</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(pagedListCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ pagedListCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SearchGrid from '../SearchGrid.vue';
import PagedList from '../PagedList.vue';

const showCodeSearchGrid = ref(false);
const showCodePagedList = ref(false);

// SearchGrid Handlers
const handleSearch = (params) => {
  console.log('Search Grid params:', params);
};

const handlePopup = () => {
  alert('사용자 선택 팝업 오픈');
};

// PagedList Data
const currentPage = ref(1);
const pagedItems = ref([
  { id: 1, name: '설비 모니터링 시스템 A', description: '실시간 가동율 및 센서 로그 수집', status: '운영중' },
  { id: 2, name: '공통 코드 관리 서브모듈', description: '공통 코드 그룹 및 하위 코드 등록 API', status: '정상' },
  { id: 3, name: '사용자 배정 공유 컴포넌트', description: '부서별 사용자 다중 할당 인터페이스', status: '정상' },
  { id: 4, name: 'RealGrid 피벗 스튜디오', description: '다차원 통계 피벗 분석 그리드 모듈', status: '점검중' },
  { id: 5, name: '바코드 라벨 출력 서비스', description: 'Zebra 바코드 프린터 직접 연결 SDK', status: '정상' }
]);

// Code Snippets
const searchGridCode = `<SearchGrid @search="handleSearch" @open-user-popup="handlePopup" />`;

const pagedListCode = `<PagedList :items="pagedItems" :page-size="3">
  <template #item="{ item }">
    <h6 class="b2b-text-body">{{ item.name }}</h6>
  </template>
</PagedList>`;

const copyCode = (text) => {
  navigator.clipboard.writeText(text);
  alert('코드가 클립보드에 복사되었습니다.');
};
</script>
