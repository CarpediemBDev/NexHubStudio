<template>
  <div class="container-fluid py-3">
    <h2 class="mb-4">사용자 배정 (공통 목록)</h2>

    <div class="row">
      <!-- 왼쪽: 전체 사용자 목록 -->
      <div class="col-md-4">
        <div class="card border-primary">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">전체 사용자</h5>
          </div>
          <div class="card-body">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control mb-3"
              placeholder="이름 또는 부서 검색..."
            />
            <div class="border rounded p-2" style="height: 600px; overflow-y: auto">
              <div
                v-for="user in filteredUsers"
                :key="user.id"
                class="p-2 mb-1 rounded cursor-pointer user-item"
                :class="{
                  'user-selected': selectedUser === user.id,
                  'bg-light': selectedUser !== user.id,
                }"
                @click="selectedUser = user.id"
              >
                {{ user.name }} ({{ user.department }})
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 중앙: 화살표 버튼 -->
      <div class="col-md-1 d-flex flex-column justify-content-center align-items-center gap-3">
        <button
          class="btn btn-primary btn-arrow-group"
          @click="moveToResearcher"
          :disabled="!selectedUser"
          title="연구원으로 배정"
        >
          <i class="bi bi-arrow-right-circle-fill fs-3"></i>
          <small class="d-block mt-1" style="font-size: 0.7rem">연구원</small>
        </button>
        <button
          class="btn btn-success btn-arrow-group"
          @click="moveToOperation"
          :disabled="!selectedUser"
          title="오퍼레이션으로 배정"
        >
          <i class="bi bi-arrow-right-circle-fill fs-3"></i>
          <small class="d-block mt-1" style="font-size: 0.7rem">오퍼</small>
        </button>
        <button
          class="btn btn-warning btn-arrow-group"
          @click="moveToWorker"
          :disabled="!selectedUser"
          title="실무자로 배정"
        >
          <i class="bi bi-arrow-right-circle-fill fs-3"></i>
          <small class="d-block mt-1" style="font-size: 0.7rem">실무자</small>
        </button>
      </div>

      <!-- 오른쪽: 배정된 그룹들 -->
      <div class="col-md-7">
        <!-- 연구원 그룹 -->
        <div class="card mb-3 border-primary">
          <div
            class="card-header bg-primary text-white d-flex justify-content-between align-items-center"
          >
            <h6 class="mb-0">연구원</h6>
            <span class="badge bg-light text-primary">{{ researchers.length }}</span>
          </div>
          <div class="card-body p-2">
            <div class="d-flex flex-wrap gap-2" style="min-height: 60px">
              <span
                v-for="user in researchers"
                :key="user.id"
                class="badge bg-primary p-2 cursor-pointer"
                style="font-size: 0.9rem"
                @click="removeFromResearcher(user.id)"
                title="클릭하여 제거"
              >
                {{ user.name }} ✕
              </span>
              <span v-if="researchers.length === 0" class="text-muted"
                >배정된 연구원이 없습니다.</span
              >
            </div>
          </div>
        </div>

        <!-- 오퍼레이션 그룹 -->
        <div class="card mb-3 border-success">
          <div
            class="card-header bg-success text-white d-flex justify-content-between align-items-center"
          >
            <h6 class="mb-0">오퍼레이션</h6>
            <span class="badge bg-light text-success">{{ operations.length }}</span>
          </div>
          <div class="card-body p-2">
            <div class="d-flex flex-wrap gap-2" style="min-height: 60px">
              <span
                v-for="user in operations"
                :key="user.id"
                class="badge bg-success p-2 cursor-pointer"
                style="font-size: 0.9rem"
                @click="removeFromOperation(user.id)"
                title="클릭하여 제거"
              >
                {{ user.name }} ✕
              </span>
              <span v-if="operations.length === 0" class="text-muted"
                >배정된 오퍼레이션이 없습니다.</span
              >
            </div>
          </div>
        </div>

        <!-- 실무자 그룹 -->
        <div class="card mb-3 border-warning">
          <div
            class="card-header bg-warning text-dark d-flex justify-content-between align-items-center"
          >
            <h6 class="mb-0">실무자</h6>
            <span class="badge bg-dark">{{ workers.length }}</span>
          </div>
          <div class="card-body p-2">
            <div class="d-flex flex-wrap gap-2" style="min-height: 60px">
              <span
                v-for="user in workers"
                :key="user.id"
                class="badge bg-warning text-dark p-2 cursor-pointer"
                style="font-size: 0.9rem"
                @click="removeFromWorker(user.id)"
                title="클릭하여 제거"
              >
                {{ user.name }} ✕
              </span>
              <span v-if="workers.length === 0" class="text-muted">배정된 실무자가 없습니다.</span>
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
    </div>
  </div>
</template>

<script>
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'UserAssignmentShared',
  data() {
    return {
      searchQuery: '',
      selectedUser: null,
      // 전체 사용자 목록
      allUsers: [
        { id: 1, name: '홍길동', department: '개발팀' },
        { id: 2, name: '김철수', department: '기획팀' },
        { id: 3, name: '이영희', department: '디자인팀' },
        { id: 4, name: '박민수', department: '개발팀' },
        { id: 5, name: '정수진', department: '운영팀' },
        { id: 6, name: '최동욱', department: '기획팀' },
        { id: 7, name: '강민지', department: '디자인팀' },
        { id: 8, name: '윤서준', department: '개발팀' },
        { id: 9, name: '임하늘', department: '운영팀' },
        { id: 10, name: '송지우', department: '기획팀' },
        { id: 11, name: '조현우', department: '개발팀' },
        { id: 12, name: '한소희', department: '디자인팀' },
        { id: 13, name: '서준혁', department: '운영팀' },
        { id: 14, name: '장미란', department: '기획팀' },
        { id: 15, name: '노태우', department: '개발팀' },
        { id: 16, name: '배수지', department: '디자인팀' },
        { id: 17, name: '문재인', department: '운영팀' },
        { id: 18, name: '신세경', department: '기획팀' },
        { id: 19, name: '고아라', department: '개발팀' },
        { id: 20, name: '이민호', department: '디자인팀' },
      ],
      // 배정된 사용자
      researchers: [],
      operations: [],
      workers: [],
    }
  },
  computed: {
    filteredUsers() {
      if (!this.searchQuery) return this.allUsers

      const query = this.searchQuery.toLowerCase()
      return this.allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query) || user.department.toLowerCase().includes(query)
      )
    },
  },
  methods: {
    // 연구원으로 이동
    moveToResearcher() {
      const user = this.allUsers.find((u) => u.id === this.selectedUser)
      if (!user) return

      if (this.researchers.find((r) => r.id === user.id)) {
        showToast(`${user.name}은(는) 이미 연구원으로 배정되어 있습니다.`, { type: 'warning' })
        return
      }

      this.researchers.push(user)
      this.selectedUser = null
      showToast(`${user.name}을(를) 연구원으로 배정했습니다.`, { type: 'success' })
    },

    // 오퍼레이션으로 이동
    moveToOperation() {
      const user = this.allUsers.find((u) => u.id === this.selectedUser)
      if (!user) return

      if (this.operations.find((o) => o.id === user.id)) {
        showToast(`${user.name}은(는) 이미 오퍼레이션으로 배정되어 있습니다.`, { type: 'warning' })
        return
      }

      this.operations.push(user)
      this.selectedUser = null
      showToast(`${user.name}을(를) 오퍼레이션으로 배정했습니다.`, { type: 'success' })
    },

    // 실무자로 이동
    moveToWorker() {
      const user = this.allUsers.find((u) => u.id === this.selectedUser)
      if (!user) return

      if (this.workers.find((w) => w.id === user.id)) {
        showToast(`${user.name}은(는) 이미 실무자로 배정되어 있습니다.`, { type: 'warning' })
        return
      }

      this.workers.push(user)
      this.selectedUser = null
      showToast(`${user.name}을(를) 실무자로 배정했습니다.`, { type: 'success' })
    },

    // 제거 메서드
    removeFromResearcher(userId) {
      const index = this.researchers.findIndex((u) => u.id === userId)
      if (index !== -1) {
        const user = this.researchers[index]
        this.researchers.splice(index, 1)
        showToast(`${user.name}을(를) 연구원에서 제거했습니다.`, { type: 'info' })
      }
    },

    removeFromOperation(userId) {
      const index = this.operations.findIndex((u) => u.id === userId)
      if (index !== -1) {
        const user = this.operations[index]
        this.operations.splice(index, 1)
        showToast(`${user.name}을(를) 오퍼레이션에서 제거했습니다.`, { type: 'info' })
      }
    },

    removeFromWorker(userId) {
      const index = this.workers.findIndex((u) => u.id === userId)
      if (index !== -1) {
        const user = this.workers[index]
        this.workers.splice(index, 1)
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

.user-item:not(.user-selected):hover {
  background-color: #e9ecef !important;
  transform: translateX(5px);
}

.user-selected {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%) !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.4);
  border: 2px solid #0d6efd;
  transform: translateX(5px);
}

.user-selected:hover {
  background: linear-gradient(135deg, #0a58ca 0%, #084298 100%) !important;
  box-shadow: 0 3px 12px rgba(13, 110, 253, 0.5);
}

.badge.cursor-pointer:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.btn-arrow-group {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: none;
}

.btn-arrow-group:hover:not(:disabled) {
  transform: scale(1.1) translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.btn-arrow-group:active:not(:disabled) {
  transform: scale(0.95);
}

.btn-arrow-group:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-arrow-group i {
  transition: transform 0.3s ease;
}

.btn-arrow-group:hover:not(:disabled) i {
  transform: translateX(3px);
}
</style>
