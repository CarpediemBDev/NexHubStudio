<template>
  <div class="container-fluid py-4">
    <!-- Page Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1 text-theme-primary fw-bold">
          <i class="bi bi-search me-2 text-primary"></i>AutoCompleteInput 미리보기 & 데모 갤러리
        </h2>
        <p class="text-theme-secondary b2b-text-xs mb-0">
          'a' 또는 원하는 키워드를 입력해보세요. 하단에 실시간 드롭다운 자동완성 목록이 주르륵 노출됩니다.
        </p>
      </div>

      <router-link to="/sample-group/component-guide" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-book me-1"></i> 전체 UI 가이드로 이동
      </router-link>
    </div>

    <!-- Main Interactive Demo Grid -->
    <div class="row g-4 mb-4">
      <!-- Demo 1: 과일/식품 자동완성 (a 입력 가이드) -->
      <div class="col-lg-6">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-header bg-primary text-white py-3">
            <h5 class="card-title mb-0 b2b-text-h2">
              <i class="bi bi-basket me-2"></i>1. 기본 단어 자동완성 테스트
            </h5>
            <small class="text-white-50 b2b-text-xs">입력창에 'a'를 입력하면 Apple, Avocado, Apricot 등이 나타납니다.</small>
          </div>

          <div class="card-body p-4">
            <div class="mb-3">
              <label class="b2b-form-label fw-bold mb-2">검색어 입력</label>
              <AutoCompleteInput
                v-model="demo1Value"
                :items="demo1Items"
                placeholder="'a' 입력 (예: Apple, Avocado, Apricot...)"
                icon="bi-search"
                :max-suggestions="8"
                @select="onSelectDemo1"
              />
            </div>

            <!-- Value Status Card -->
            <div class="p-3 bg-body-tertiary rounded-2 border">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="b2b-text-xs text-muted">현재 입력/선택 값 (v-model):</span>
                <span class="badge bg-primary rounded-pill b2b-text-xs">
                  {{ demo1Value.length }} 자
                </span>
              </div>
              <div class="h5 mb-0 text-primary fw-bold font-monospace">
                {{ demo1Value || '(입력값이 없습니다)' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Demo 2: 객체 데이터셋 (사용자/시스템 관리자) -->
      <div class="col-lg-6">
        <div class="card h-100 border-0 shadow-sm">
          <div class="card-header bg-success text-white py-3">
            <h5 class="card-title mb-0 b2b-text-h2">
              <i class="bi bi-people me-2"></i>2. 사용자/부서 데이터 자동완성
            </h5>
            <small class="text-white-50 b2b-text-xs">'a' 또는 사용자 이름을 검색하세요 (아이콘, 부서 배지 지원)</small>
          </div>

          <div class="card-body p-4">
            <div class="mb-3">
              <label class="b2b-form-label fw-bold mb-2">사용자 검색</label>
              <AutoCompleteInput
                v-model="demo2Value"
                :items="demo2Users"
                label-key="name"
                value-key="id"
                placeholder="'a' 또는 이름 검색 (예: Admin, Alex, Alice...)"
                icon="bi-person-badge"
                :max-suggestions="6"
                @select="onSelectDemo2"
              />
            </div>

            <!-- Selected Detail Box -->
            <div class="p-3 bg-body-tertiary rounded-2 border">
              <span class="b2b-text-xs text-muted d-block mb-1">선택된 사용자 상세 정보:</span>
              <div v-if="selectedUserObj" class="d-flex align-items-center gap-2">
                <div class="bg-primary text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style="width:36px; height:36px;">
                  <i :class="['bi', selectedUserObj.icon || 'bi-person']"></i>
                </div>
                <div>
                  <h6 class="mb-0 fw-bold text-theme-primary">{{ selectedUserObj.name }}</h6>
                  <small class="text-muted b2b-text-xs">{{ selectedUserObj.badge }} · {{ selectedUserObj.description }}</small>
                </div>
              </div>
              <div v-else class="text-muted b2b-text-xs italic">
                사용자를 검색하여 선택하면 상세 정보가 표시됩니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features & Keybinding Showcase -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-theme-subcard py-3">
        <h5 class="b2b-text-h2 text-theme-primary mb-0"><i class="bi bi-stars me-2"></i>AutoCompleteInput 주요 사양 및 특징</h5>
      </div>
      <div class="card-body">
        <div class="row g-4">
          <div class="col-md-3">
            <div class="p-3 border rounded h-100 bg-theme-subcard">
              <h6 class="fw-bold text-primary mb-2"><i class="bi bi-keyboard me-1"></i>키보드 내비게이션</h6>
              <ul class="b2b-text-xs ps-3 mb-0 text-theme-secondary">
                <li><code>↓ (Down)</code>: 다음 항목으로 이동</li>
                <li><code>↑ (Up)</code>: 이전 항목으로 이동</li>
                <li><code>Enter</code>: 현재 항목 선택</li>
                <li><code>Esc</code>: 드롭다운 닫기</li>
              </ul>
            </div>
          </div>

          <div class="col-md-3">
            <div class="p-3 border rounded h-100 bg-theme-subcard">
              <h6 class="fw-bold text-success mb-2"><i class="bi bi-highlighter me-1"></i>텍스트 하이라이트</h6>
              <p class="b2b-text-xs mb-0 text-theme-secondary">
                사용자가 입력한 키워드와 일치하는 문자를 <mark class="bg-warning-subtle text-dark p-0 rounded-1 fw-bold">노란색 하이라이트</mark>로 자동 강조합니다.
              </p>
            </div>
          </div>

          <div class="col-md-3">
            <div class="p-3 border rounded h-100 bg-theme-subcard">
              <h6 class="fw-bold text-info mb-2"><i class="bi bi-mouse me-1"></i>외곽 클릭 자동 Close</h6>
              <p class="b2b-text-xs mb-0 text-theme-secondary">
                입력창 외부 영역 클릭 감지 기능이 내장되어 있어 드롭다운 팝업이 자동으로 깔끔하게 닫힙니다.
              </p>
            </div>
          </div>

          <div class="col-md-3">
            <div class="p-3 border rounded h-100 bg-theme-subcard">
              <h6 class="fw-bold text-warning mb-2"><i class="bi bi-x-circle me-1"></i>원클릭 초기화</h6>
              <p class="b2b-text-xs mb-0 text-theme-secondary">
                입력값이 있을 때 우측에 <code>X</code> 버튼이 표시되며, 클릭 시 즉시 텍스트를 지우고 포커스를 유지합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AutoCompleteInput from '../../components/common/AutoCompleteInput.vue';

// Demo 1 State
const demo1Value = ref('a');
const demo1Items = [
  'Apple (사과)',
  'Avocado (아보카도)',
  'Apricot (살구)',
  'Almond (아몬드)',
  'Amazon Berry (아마존 베리)',
  'Banana (바나나)',
  'Blueberry (블루베리)',
  'Cherry (체리)',
  'Grape (포도)',
  'Mango (망고)',
  'Orange (오렌지)',
  'Peach (복숭아)'
];

const onSelectDemo1 = (payload) => {
  console.log('Demo 1 selected:', payload);
};

// Demo 2 State
const demo2Value = ref('a');
const selectedUserObj = ref(null);

const demo2Users = [
  { id: 'U1', name: 'Admin System', badge: '시스템관리', description: 'admin@nexhub.com', icon: 'bi-shield-lock-fill' },
  { id: 'U2', name: 'Alex Johnson', badge: '연구소', description: 'alex.j@nexhub.com', icon: 'bi-code-slash' },
  { id: 'U3', name: 'Alice Smith', badge: '기획팀', description: 'alice.s@nexhub.com', icon: 'bi-kanban' },
  { id: 'U4', name: 'Andrew Miller', badge: '영업팀', description: 'andrew.m@nexhub.com', icon: 'bi-graph-up-arrow' },
  { id: 'U5', name: 'Anthony Davis', badge: '생산팀', description: 'anthony.d@nexhub.com', icon: 'bi-gear-wide-connected' },
  { id: 'U6', name: 'Angela White', badge: '품질검사팀', description: 'angela.w@nexhub.com', icon: 'bi-check-all' }
];

const onSelectDemo2 = (payload) => {
  if (payload && payload.item) {
    selectedUserObj.value = payload.item;
  }
};
</script>
