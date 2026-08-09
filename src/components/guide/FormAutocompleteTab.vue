<template>
  <div class="form-autocomplete-tab">
    <!-- 1. 기본 텍스트 자동완성 (a 입력 테스트) -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-2 px-3">
        <div class="d-flex align-items-center gap-2">
          <h6 class="b2b-text-h2 text-theme-primary mb-0 fw-bold">
            <i class="bi bi-search me-2 text-primary"></i>1. AutoCompleteInput - 기본 텍스트 자동완성
          </h6>
          <span class="badge bg-info text-dark b2b-text-xs">'a' 입력 추천</span>
        </div>
        <button class="btn btn-sm btn-outline-secondary py-1 px-2 b2b-text-xs" @click="showCodeBasic = !showCodeBasic">
          <i class="bi bi-code-slash me-1"></i> {{ showCodeBasic ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body p-3">
        <div class="mb-2">
          <label class="b2b-form-label mb-1">과일/식품 검색</label>
          <AutoCompleteInput
            v-model="fruitValue"
            :items="fruitList"
            placeholder="'a' 입력 (예: Apple, Avocado, Apricot...)"
            icon="bi-basket"
            @select="onSelectFruit"
          />
        </div>
        <div class="p-2 bg-body-tertiary rounded b2b-text-xs mt-2">
          <strong>선택된 값 (v-model):</strong> <span class="text-primary fw-bold">{{ fruitValue || '(선택 없음)' }}</span>
        </div>
      </div>

      <!-- Expandable Code Block -->
      <div v-if="showCodeBasic" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> 기본 AutoCompleteInput 소스코드</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(basicCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ basicCode }}</code></pre>
      </div>
    </div>

    <!-- 2. 리치 데이터 자동완성 -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-2 px-3">
        <div class="d-flex align-items-center gap-2">
          <h6 class="b2b-text-h2 text-theme-primary mb-0 fw-bold">
            <i class="bi bi-person-badge me-2 text-success"></i>2. AutoCompleteInput - 리치 데이터 (아이콘/부서 배지/설명)
          </h6>
        </div>
        <button class="btn btn-sm btn-outline-secondary py-1 px-2 b2b-text-xs" @click="showCodeRich = !showCodeRich">
          <i class="bi bi-code-slash me-1"></i> {{ showCodeRich ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body p-3">
        <div class="mb-2">
          <label class="b2b-form-label mb-1">사용자/부서 검색</label>
          <AutoCompleteInput
            v-model="userValue"
            :items="userList"
            label-key="name"
            value-key="id"
            placeholder="'a' 또는 이름 입력 (예: Admin, Alex, Alice...)"
            icon="bi-person"
            @select="onSelectUser"
          />
        </div>
        <div class="p-2 bg-body-tertiary rounded b2b-text-xs mt-2">
          <strong>선택된 사용자 상세:</strong> <span class="text-success fw-bold">{{ selectedUserDetail || userValue || '(선택 없음)' }}</span>
        </div>
      </div>

      <div v-if="showCodeRich" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> 리치 데이터 AutoCompleteInput 소스코드</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(richCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ richCode }}</code></pre>
      </div>
    </div>

    <!-- 3. MultiSelect 가이드 -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-2 px-3">
        <div>
          <h6 class="b2b-text-h2 text-theme-primary mb-0 fw-bold">
            <i class="bi bi-ui-checks me-2 text-warning"></i>3. MultiSelect - 멀티 셀렉터
          </h6>
        </div>
        <button class="btn btn-sm btn-outline-secondary py-1 px-2 b2b-text-xs" @click="showCodeMultiSelect = !showCodeMultiSelect">
          <i class="bi bi-code-slash me-1"></i> {{ showCodeMultiSelect ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body p-3">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="b2b-form-label mb-1">기본 멀티 선택</label>
            <MultiSelect
              v-model="selectedFruits"
              :options="fruitOptions"
              placeholder="과일을 선택하세요"
            />
            <small class="text-muted d-block mt-1 b2b-text-xs">
              선택된 항목: <span class="fw-bold text-primary">{{ selectedFruits.join(', ') || '없음' }}</span>
            </small>
          </div>

          <div class="col-md-6">
            <label class="b2b-form-label mb-1">최대 3개 제한 선택</label>
            <MultiSelect
              v-model="selectedColors"
              :options="colorOptions"
              :max-selections="3"
              placeholder="색상을 선택하세요 (최대 3개)"
            />
            <small class="text-muted d-block mt-1 b2b-text-xs">
              선택된 개수: <span class="fw-bold text-success">{{ selectedColors.length }} / 3 개</span>
            </small>
          </div>
        </div>
      </div>

      <div v-if="showCodeMultiSelect" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> MultiSelect 소스코드</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(multiSelectCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ multiSelectCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AutoCompleteInput from '../common/AutoCompleteInput.vue';
import MultiSelect from '../MultiSelect.vue';

const showCodeBasic = ref(false);
const showCodeRich = ref(false);
const showCodeMultiSelect = ref(false);

// AutoComplete Data
const fruitValue = ref('');
const userValue = ref('');
const selectedUserDetail = ref('');

const fruitList = [
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

const userList = [
  { id: 'U001', name: 'Admin Administrator', badge: '시스템관리', description: 'admin@nexhub.com', icon: 'bi-shield-lock' },
  { id: 'U002', name: 'Alex Johnson', badge: '개발팀', description: 'alex.j@nexhub.com', icon: 'bi-code-square' },
  { id: 'U003', name: 'Alice Smith', badge: '기획팀', description: 'alice.s@nexhub.com', icon: 'bi-lightbulb' },
  { id: 'U004', name: 'Andrew Miller', badge: '영업팀', description: 'andrew.m@nexhub.com', icon: 'bi-graph-up' },
  { id: 'U005', name: 'Anthony Davis', badge: '생산팀', description: 'anthony.d@nexhub.com', icon: 'bi-gear-fill' },
  { id: 'U006', name: 'Angela White', badge: '품질팀', description: 'angela.w@nexhub.com', icon: 'bi-check-circle' }
];

const onSelectFruit = (payload) => {
  console.log('Selected fruit:', payload);
};

const onSelectUser = (payload) => {
  if (payload && payload.item) {
    selectedUserDetail.value = `${payload.item.name} (${payload.item.badge} - ${payload.item.description})`;
  }
};

// MultiSelect Data
const selectedFruits = ref(['사과', '바나나']);
const fruitOptions = ['사과', '바나나', '오렌지', '포도', '딸기', '수박'];

const selectedColors = ref(['빨강']);
const colorOptions = ['빨강', '파랑', '노랑', '초록', '보라', '검정'];

// Code Snippets
const basicCode = `<AutoCompleteInput
  v-model="fruitValue"
  :items="['Apple', 'Avocado', 'Apricot', 'Almond']"
  placeholder="'a' 입력시 자동완성"
  icon="bi-basket"
/>`;

const richCode = `<AutoCompleteInput
  v-model="userValue"
  :items="userList"
  label-key="name"
  value-key="id"
  placeholder="사용자 검색"
  icon="bi-person"
/>`;

const multiSelectCode = `<MultiSelect
  v-model="selectedFruits"
  :options="['사과', '바나나', '오렌지']"
  placeholder="과일 선택"
/>`;

const copyCode = (text) => {
  navigator.clipboard.writeText(text);
  alert('코드가 클립보드에 복사되었습니다.');
};
</script>
