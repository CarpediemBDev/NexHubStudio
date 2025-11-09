<template>
  <div class="container-fluid py-3">
    <h2 class="mb-4">사용자 배정 (세로 레이아웃)</h2>

    <!-- 연구원 그룹 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">연구원 배정</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- 전체 사용자 목록 -->
          <div class="col-md-5">
            <h6>전체 사용자</h6>
            <div class="border rounded p-2" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in availableUsers"
                :key="user.id"
                class="p-2 mb-1 rounded cursor-pointer user-item"
                :class="{
                  'user-selected-primary': selectedAvailable.researcher === user.id,
                  'bg-light': selectedAvailable.researcher !== user.id,
                }"
                @click="selectedAvailable.researcher = user.id"
              >
                {{ user.name }} ({{ user.department }})
              </div>
            </div>
          </div>

          <!-- 화살표 버튼 -->
          <div class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2">
            <button
              class="btn btn-primary btn-arrow"
              @click="moveToResearcher"
              :disabled="!selectedAvailable.researcher"
              title="연구원으로 추가"
            >
              <i class="bi bi-arrow-right-circle fs-4"></i>
            </button>
            <button
              class="btn btn-outline-secondary btn-arrow"
              @click="removeFromResearcher"
              :disabled="!selectedAssigned.researcher"
              title="연구원에서 제거"
            >
              <i class="bi bi-arrow-left-circle fs-4"></i>
            </button>
          </div>

          <!-- 선택된 연구원 -->
          <div class="col-md-5">
            <h6>
              선택된 연구원 <span class="badge bg-primary">{{ researchers.length }}</span>
            </h6>
            <div class="border rounded p-2" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in researchers"
                :key="user.id"
                class="p-2 mb-1 rounded cursor-pointer user-item"
                :class="{
                  'user-selected-success': selectedAssigned.researcher === user.id,
                  'bg-success text-white': selectedAssigned.researcher !== user.id,
                }"
                @click="selectedAssigned.researcher = user.id"
              >
                {{ user.name }} ({{ user.department }})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 오퍼레이션 그룹 -->
    <div class="card mb-4 border-success">
      <div class="card-header bg-success text-white">
        <h5 class="mb-0">오퍼레이션 배정</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- 전체 사용자 목록 -->
          <div class="col-md-5">
            <h6>전체 사용자</h6>
            <div class="border rounded p-2" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in availableUsers"
                :key="user.id"
                class="p-2 mb-1 rounded cursor-pointer user-item"
                :class="{
                  'user-selected-success': selectedAvailable.operation === user.id,
                  'bg-light': selectedAvailable.operation !== user.id,
                }"
                @click="selectedAvailable.operation = user.id"
              >
                {{ user.name }} ({{ user.department }})
              </div>
            </div>
          </div>

          <!-- 화살표 버튼 -->
          <div class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2">
            <button
              class="btn btn-success btn-arrow"
              @click="moveToOperation"
              :disabled="!selectedAvailable.operation"
              title="오퍼레이션으로 추가"
            >
              <i class="bi bi-arrow-right-circle fs-4"></i>
            </button>
            <button
              class="btn btn-outline-secondary btn-arrow"
              @click="removeFromOperation"
              :disabled="!selectedAssigned.operation"
              title="오퍼레이션에서 제거"
            >
              <i class="bi bi-arrow-left-circle fs-4"></i>
            </button>
          </div>

          <!-- 선택된 오퍼레이션 -->
          <div class="col-md-5">
            <h6>
              선택된 오퍼레이션 <span class="badge bg-success">{{ operations.length }}</span>
            </h6>
            <div class="border rounded p-2" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in operations"
                :key="user.id"
                class="p-2 mb-1 rounded cursor-pointer user-item"
                :class="{
                  'user-selected-info': selectedAssigned.operation === user.id,
                  'bg-info text-white': selectedAssigned.operation !== user.id,
                }"
                @click="selectedAssigned.operation = user.id"
              >
                {{ user.name }} ({{ user.department }})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 실무자 그룹 -->
    <div class="card mb-4 border-warning">
      <div class="card-header bg-warning text-dark">
        <h5 class="mb-0">실무자 배정</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- 전체 사용자 목록 -->
          <div class="col-md-5">
            <h6>전체 사용자</h6>
            <div class="border rounded p-2" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in availableUsers"
                :key="user.id"
                class="p-2 mb-1 rounded cursor-pointer user-item"
                :class="{
                  'user-selected-warning': selectedAvailable.worker === user.id,
                  'bg-light': selectedAvailable.worker !== user.id,
                }"
                @click="selectedAvailable.worker = user.id"
              >
                {{ user.name }} ({{ user.department }})
              </div>
            </div>
          </div>

          <!-- 화살표 버튼 -->
          <div class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2">
            <button
              class="btn btn-warning btn-arrow"
              @click="moveToWorker"
              :disabled="!selectedAvailable.worker"
              title="실무자로 추가"
            >
              <i class="bi bi-arrow-right-circle fs-4"></i>
            </button>
            <button
              class="btn btn-outline-secondary btn-arrow"
              @click="removeFromWorker"
              :disabled="!selectedAssigned.worker"
              title="실무자에서 제거"
            >
              <i class="bi bi-arrow-left-circle fs-4"></i>
            </button>
          </div>

          <!-- 선택된 실무자 -->
          <div class="col-md-5">
            <h6>
              선택된 실무자 <span class="badge bg-warning text-dark">{{ workers.length }}</span>
            </h6>
            <div class="border rounded p-2" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in workers"
                :key="user.id"
                class="p-2 mb-1 rounded cursor-pointer user-item"
                :class="{
                  'user-selected-dark': selectedAssigned.worker === user.id,
                  'bg-warning': selectedAssigned.worker !== user.id,
                }"
                @click="selectedAssigned.worker = user.id"
              >
                {{ user.name }} ({{ user.department }})
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 저장 버튼 -->
    <div class="text-end">
      <button class="btn btn-primary btn-lg" @click="saveAssignments">
        <i class="bi bi-save"></i> 저장
      </button>
    </div>
  </div>
</template>

<script>
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'UserAssignmentVertical',
  data() {
    return {
      // 전체 사용자 목록
      availableUsers: [
        { id: 1, name: '홍길동', department: '개발팀' },
        { id: 2, name: '김철수', department: '기획팀' },
        { id: 3, name: '이영희', department: '디자인팀' },
        { id: 4, name: '박민수', department: '개발팀' },
        { id: 5, name: '정수진', department: '운영팀' },
        { id: 6, name: '최동욱', department: '기획팀' },
        { id: 7, name: '강민지', department: '디자인팀' },
        { id: 8, name: '윤서준', department: '개발팀' },
      ],
      // 배정된 사용자
      researchers: [],
      operations: [],
      workers: [],
      // 선택된 사용자 (왼쪽)
      selectedAvailable: {
        researcher: null,
        operation: null,
        worker: null,
      },
      // 선택된 사용자 (오른쪽)
      selectedAssigned: {
        researcher: null,
        operation: null,
        worker: null,
      },
    }
  },
  methods: {
    // 연구원으로 이동
    moveToResearcher() {
      const user = this.availableUsers.find((u) => u.id === this.selectedAvailable.researcher)
      if (user && !this.researchers.find((r) => r.id === user.id)) {
        this.researchers.push(user)
        this.selectedAvailable.researcher = null
        showToast(`${user.name}을(를) 연구원으로 추가했습니다.`, { type: 'success' })
      }
    },
    removeFromResearcher() {
      const index = this.researchers.findIndex((u) => u.id === this.selectedAssigned.researcher)
      if (index !== -1) {
        const user = this.researchers[index]
        this.researchers.splice(index, 1)
        this.selectedAssigned.researcher = null
        showToast(`${user.name}을(를) 연구원에서 제거했습니다.`, { type: 'info' })
      }
    },

    // 오퍼레이션으로 이동
    moveToOperation() {
      const user = this.availableUsers.find((u) => u.id === this.selectedAvailable.operation)
      if (user && !this.operations.find((o) => o.id === user.id)) {
        this.operations.push(user)
        this.selectedAvailable.operation = null
        showToast(`${user.name}을(를) 오퍼레이션으로 추가했습니다.`, { type: 'success' })
      }
    },
    removeFromOperation() {
      const index = this.operations.findIndex((u) => u.id === this.selectedAssigned.operation)
      if (index !== -1) {
        const user = this.operations[index]
        this.operations.splice(index, 1)
        this.selectedAssigned.operation = null
        showToast(`${user.name}을(를) 오퍼레이션에서 제거했습니다.`, { type: 'info' })
      }
    },

    // 실무자로 이동
    moveToWorker() {
      const user = this.availableUsers.find((u) => u.id === this.selectedAvailable.worker)
      if (user && !this.workers.find((w) => w.id === user.id)) {
        this.workers.push(user)
        this.selectedAvailable.worker = null
        showToast(`${user.name}을(를) 실무자로 추가했습니다.`, { type: 'success' })
      }
    },
    removeFromWorker() {
      const index = this.workers.findIndex((u) => u.id === this.selectedAssigned.worker)
      if (index !== -1) {
        const user = this.workers[index]
        this.workers.splice(index, 1)
        this.selectedAssigned.worker = null
        showToast(`${user.name}을(를) 실무자에서 제거했습니다.`, { type: 'info' })
      }
    },

    // 저장
    saveAssignments() {
      const data = {
        researchers: this.researchers.map((u) => u.id),
        operations: this.operations.map((u) => u.id),
        workers: this.workers.map((u) => u.id),
      }
      console.log('저장할 데이터:', data)
      showToast('사용자 배정이 저장되었습니다.', { type: 'success' })
    },
  },
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.user-item {
  transition: all 0.2s ease;
}

.user-item:not([class*='user-selected']):hover {
  background-color: #e9ecef !important;
  transform: translateX(5px);
}

/* Primary 선택 스타일 (연구원 왼쪽) */
.user-selected-primary {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%) !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.4);
  border: 2px solid #0d6efd;
  transform: translateX(5px);
}

.user-selected-primary:hover {
  background: linear-gradient(135deg, #0a58ca 0%, #084298 100%) !important;
  box-shadow: 0 3px 12px rgba(13, 110, 253, 0.5);
}

/* Success 선택 스타일 (연구원 오른쪽, 오퍼레이션 왼쪽) */
.user-selected-success {
  background: linear-gradient(135deg, #198754 0%, #157347 100%) !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(25, 135, 84, 0.4);
  border: 2px solid #198754;
  transform: translateX(5px);
}

.user-selected-success:hover {
  background: linear-gradient(135deg, #157347 0%, #0d5132 100%) !important;
  box-shadow: 0 3px 12px rgba(25, 135, 84, 0.5);
}

/* Info 선택 스타일 (오퍼레이션 오른쪽) */
.user-selected-info {
  background: linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%) !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(13, 202, 240, 0.4);
  border: 2px solid #0dcaf0;
  transform: translateX(5px);
}

.user-selected-info:hover {
  background: linear-gradient(135deg, #0aa2c0 0%, #087990 100%) !important;
  box-shadow: 0 3px 12px rgba(13, 202, 240, 0.5);
}

/* Warning 선택 스타일 (실무자 왼쪽) */
.user-selected-warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%) !important;
  color: #000 !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
  border: 2px solid #ffc107;
  transform: translateX(5px);
}

.user-selected-warning:hover {
  background: linear-gradient(135deg, #e0a800 0%, #cc9a06 100%) !important;
  box-shadow: 0 3px 12px rgba(255, 193, 7, 0.5);
}

/* Dark 선택 스타일 (실무자 오른쪽) */
.user-selected-dark {
  background: linear-gradient(135deg, #212529 0%, #000000 100%) !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  border: 2px solid #212529;
  transform: translateX(5px);
}

.user-selected-dark:hover {
  background: linear-gradient(135deg, #000000 0%, #000000 100%) !important;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
}

.btn-arrow {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-arrow:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-arrow:active:not(:disabled) {
  transform: scale(0.95);
}

.btn-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
