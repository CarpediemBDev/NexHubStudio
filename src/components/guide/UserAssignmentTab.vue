<template>
  <div class="user-assignment-tab">
    <!-- 1. 사용자 팝업 및 할당 가이드 -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 class="b2b-text-h2 text-theme-primary mb-1"><i class="bi bi-person-gear me-2"></i>UserBasePopup - 사용자 조회 & 할당 팝업</h5>
          <small class="b2b-text-xs text-theme-secondary">조직도 및 부서별 사용자 다중 선택 팝업 모달</small>
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="showCodeUserPopup = !showCodeUserPopup">
          <i class="bi bi-code-slash me-1"></i> {{ showCodeUserPopup ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body p-4">
        <div class="d-flex align-items-center gap-3 mb-3">
          <button class="btn btn-primary" @click="openPopup">
            <i class="bi bi-person-plus me-1"></i> 사용자 선택 팝업 열기
          </button>
          <span class="b2b-text-xs text-muted">선택된 사용자: <strong class="text-primary">{{ selectedCount }}</strong> 명</span>
        </div>

        <!-- Simulated User Base Popup Display -->
        <div class="p-3 border rounded bg-theme-subcard">
          <h6 class="b2b-text-h2 text-theme-primary mb-2">선택된 사용자 목록</h6>
          <div v-if="selectedUsers.length > 0" class="d-flex flex-wrap gap-2">
            <span v-for="user in selectedUsers" :key="user.id" class="badge bg-secondary p-2">
              <i class="bi bi-person-fill me-1"></i> {{ user.name }} ({{ user.dept }})
            </span>
          </div>
          <p v-else class="b2b-text-xs text-muted mb-0">선택된 사용자가 없습니다. 팝업을 열어 사용자를 선택해보세요.</p>
        </div>

        <UserBasePopup
          ref="userPopupRef"
          :is-open="isPopupOpen"
          @close="isPopupOpen = false"
          @confirm="handleConfirmUser"
        />
      </div>

      <div v-if="showCodeUserPopup" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> UserBasePopup 소스코드</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(userPopupCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ userPopupCode }}</code></pre>
      </div>
    </div>

    <!-- 2. CodeTree 트리 컴포넌트 가이드 -->
    <div class="card mb-4 border-0 shadow-sm">
      <div class="card-header bg-theme-subcard d-flex justify-content-between align-items-center py-3">
        <div>
          <h5 class="b2b-text-h2 text-theme-primary mb-1"><i class="bi bi-diagram-3 me-2"></i>CodeTree - 부서 & 계층 트리 컴포넌트</h5>
          <small class="b2b-text-xs text-theme-secondary">계층형 공통 코드 및 조직도 네비게이션 트리</small>
        </div>
        <button class="btn btn-sm btn-outline-secondary" @click="showCodeTree = !showCodeTree">
          <i class="bi bi-code-slash me-1"></i> {{ showCodeTree ? '코드 닫기' : '코드 보기' }}
        </button>
      </div>

      <div class="card-body p-4">
        <div class="p-3 border rounded bg-theme-subcard" style="max-height: 250px; overflow-y: auto;">
          <CodeTree :nodes="treeNodes" @select-node="onSelectNode" />
        </div>
        <small class="text-muted d-block mt-2 b2b-text-xs">
          선택된 트리 노드: <span class="fw-bold text-primary">{{ selectedNodeName || '없음' }}</span>
        </small>
      </div>

      <div v-if="showCodeTree" class="card-footer bg-dark text-white p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <small class="text-info fw-bold"><i class="bi bi-code"></i> CodeTree 소스코드</small>
          <button class="btn btn-xs btn-outline-light" @click="copyCode(treeCode)">
            <i class="bi bi-clipboard me-1"></i> 복사
          </button>
        </div>
        <pre class="m-0 text-light b2b-text-xs"><code>{{ treeCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import UserBasePopup from '../UserBasePopup.vue';
import CodeTree from '../CodeTree.vue';

const showCodeUserPopup = ref(false);
const showCodeTree = ref(false);

const isPopupOpen = ref(false);
const selectedUsers = ref([
  { id: '1', name: '홍길동', dept: '연구소' },
  { id: '2', name: '김철수', dept: '운영팀' }
]);

const selectedCount = computed(() => selectedUsers.value.length);

const openPopup = () => {
  isPopupOpen.value = true;
};

const handleConfirmUser = (users) => {
  if (users) {
    selectedUsers.value = users;
  }
  isPopupOpen.value = false;
};

// Tree Component Data
const selectedNodeName = ref('');
const treeNodes = ref([
  {
    id: '1',
    label: 'NexHub 본사',
    children: [
      {
        id: '1-1',
        label: '경영지원본부',
        children: [
          { id: '1-1-1', label: '인사팀' },
          { id: '1-1-2', label: '재무팀' }
        ]
      },
      {
        id: '1-2',
        label: '기술연구소',
        children: [
          { id: '1-2-1', label: '프론트엔드개발팀' },
          { id: '1-2-2', label: '백엔드개발팀' },
          { id: '1-2-3', label: 'AI/데이터팀' }
        ]
      }
    ]
  }
]);

const onSelectNode = (node) => {
  selectedNodeName.value = node.label || node.id;
};

// Code Snippets
const userPopupCode = `<UserBasePopup
  :is-open="isPopupOpen"
  @close="isPopupOpen = false"
  @confirm="handleConfirmUser"
/>`;

const treeCode = `<CodeTree :nodes="treeNodes" @select-node="onSelectNode" />`;

const copyCode = (text) => {
  navigator.clipboard.writeText(text);
  alert('코드가 클립보드에 복사되었습니다.');
};
</script>
