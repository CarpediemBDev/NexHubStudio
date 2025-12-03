<template>
  <div class="container-fluid py-3">
    <h2 class="mb-4">사용자 배정 (공통 목록)</h2>

    <div class="row">
      <!-- 왼쪽: 전체 사용자 목록 -->
      <div class="col-md-4">
        <div class="card border-secondary">
          <div class="card-header bg-light border-secondary">
            <div class="d-flex align-items-center gap-2">
              <div class="form-check mb-0">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="selectAll"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
                <label class="form-check-label" for="selectAll">
                  전체 선택 <span class="text-muted">({{ filteredUsers.length }})</span>
                </label>
              </div>
            </div>
          </div>
          <div class="card-body">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control mb-3"
              placeholder="🔍 이름 또는 부서 검색..."
            />
            <div class="shared-user-box border rounded" style="height: 600px; overflow-y: auto">
              <div
                v-for="user in filteredUsers"
                :key="user.id"
                class="shared-user-item"
                :class="{
                  selected: selectedUsers.includes(user.id),
                  assigned: getUserAssignedGroups(user.id).length > 0,
                }"
                @click="toggleUserSelect(user.id)"
              >
                <div class="d-flex align-items-center">
                  <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :checked="selectedUsers.includes(user.id)"
                    @click.stop="toggleUserSelect(user.id)"
                  />
                  <span>{{ user.name }}</span>
                  <small class="ms-auto text-muted">{{ user.department }}</small>
                  <!-- 배정된 그룹 표시 (모든 그룹) -->
                  <span v-if="getUserAssignedGroups(user.id).length > 0" class="ms-2 d-flex gap-1">
                    <span
                      v-if="getUserAssignedGroups(user.id).includes('researcher')"
                      class="badge bg-primary"
                      style="font-size: 0.65rem"
                      >연구원</span
                    >
                    <span
                      v-if="getUserAssignedGroups(user.id).includes('operation')"
                      class="badge bg-success"
                      style="font-size: 0.65rem"
                      >오퍼</span
                    >
                    <span
                      v-if="getUserAssignedGroups(user.id).includes('worker')"
                      class="badge bg-warning text-dark"
                      style="font-size: 0.65rem"
                      >실무자</span
                    >
                  </span>
                </div>
              </div>
              <div v-if="filteredUsers.length === 0" class="text-center text-muted py-5">
                <i class="bi bi-search fs-3 d-block mb-2"></i>
                <small>검색 결과가 없습니다</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 중앙: 화살표 버튼 -->
      <div class="col-md-1 d-flex flex-column justify-content-center align-items-center gap-3">
        <button
          class="btn btn-outline-primary shared-arrow-btn"
          @click="moveToResearcher"
          :disabled="selectedUsers.length === 0"
          title="연구원으로 배정"
        >
          <i class="bi bi-arrow-right fs-5"></i>
          <small class="d-block">연구원</small>
        </button>
        <button
          class="btn btn-outline-success shared-arrow-btn"
          @click="moveToOperation"
          :disabled="selectedUsers.length === 0"
          title="오퍼레이션으로 배정"
        >
          <i class="bi bi-arrow-right fs-5"></i>
          <small class="d-block">오퍼</small>
        </button>
        <button
          class="btn btn-outline-warning shared-arrow-btn"
          @click="moveToWorker"
          :disabled="selectedUsers.length === 0"
          title="실무자로 배정"
        >
          <i class="bi bi-arrow-right fs-5"></i>
          <small class="d-block">실무자</small>
        </button>
      </div>

      <!-- 오른쪽: 배정된 그룹들 -->
      <div class="col-md-7">
        <!-- 연구원 그룹 -->
        <div class="card mb-3 border-primary">
          <div class="card-header bg-primary bg-opacity-10 border-primary">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0 text-primary"><i class="bi bi-people-fill me-2"></i>연구원</h6>
              <span class="badge bg-primary">{{ researchers.length }}</span>
            </div>
          </div>
          <div class="card-body p-3">
            <div class="assigned-box" style="min-height: 80px">
              <span
                v-for="user in researchers"
                :key="user.id"
                class="assigned-badge badge-primary"
                @click="removeFromResearcher(user.id)"
                title="클릭하여 제거"
              >
                {{ user.name }}
                <i class="bi bi-x-circle ms-1"></i>
              </span>
              <div v-if="researchers.length === 0" class="empty-state">
                <i class="bi bi-inbox fs-4 d-block mb-2 text-muted"></i>
                <small class="text-muted">배정된 연구원이 없습니다</small>
              </div>
            </div>
          </div>
        </div>

        <!-- 오퍼레이션 그룹 -->
        <div class="card mb-3 border-success">
          <div class="card-header bg-success bg-opacity-10 border-success">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0 text-success"><i class="bi bi-gear-fill me-2"></i>오퍼레이션</h6>
              <span class="badge bg-success">{{ operations.length }}</span>
            </div>
          </div>
          <div class="card-body p-3">
            <div class="assigned-box" style="min-height: 80px">
              <span
                v-for="user in operations"
                :key="user.id"
                class="assigned-badge badge-success"
                @click="removeFromOperation(user.id)"
                title="클릭하여 제거"
              >
                {{ user.name }}
                <i class="bi bi-x-circle ms-1"></i>
              </span>
              <div v-if="operations.length === 0" class="empty-state">
                <i class="bi bi-inbox fs-4 d-block mb-2 text-muted"></i>
                <small class="text-muted">배정된 오퍼레이션이 없습니다</small>
              </div>
            </div>
          </div>
        </div>

        <!-- 실무자 그룹 -->
        <div class="card mb-3 border-warning">
          <div class="card-header bg-warning bg-opacity-10 border-warning">
            <div class="d-flex justify-content-between align-items-center">
              <h6 class="mb-0 text-warning"><i class="bi bi-person-badge-fill me-2"></i>실무자</h6>
              <span class="badge bg-warning text-dark">{{ workers.length }}</span>
            </div>
          </div>
          <div class="card-body p-3">
            <div class="assigned-box" style="min-height: 80px">
              <span
                v-for="user in workers"
                :key="user.id"
                class="assigned-badge badge-warning"
                @click="removeFromWorker(user.id)"
                title="클릭하여 제거"
              >
                {{ user.name }}
                <i class="bi bi-x-circle ms-1"></i>
              </span>
              <div v-if="workers.length === 0" class="empty-state">
                <i class="bi bi-inbox fs-4 d-block mb-2 text-muted"></i>
                <small class="text-muted">배정된 실무자가 없습니다</small>
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
      selectedUsers: [], // 다중 선택
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
      // 검색어 필터링만 적용
      let users = this.allUsers

      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        users = users.filter(
          (user) =>
            user.name.toLowerCase().includes(query) || user.department.toLowerCase().includes(query)
        )
      }

      return users
    },
    isAllSelected() {
      return (
        this.filteredUsers.length > 0 &&
        this.filteredUsers.every((user) => this.selectedUsers.includes(user.id))
      )
    },
  },
  methods: {
    // 사용자가 배정된 모든 그룹 확인 (배열 반환)
    getUserAssignedGroups(userId) {
      const groups = []
      if (this.researchers.find((u) => u.id === userId)) groups.push('researcher')
      if (this.operations.find((u) => u.id === userId)) groups.push('operation')
      if (this.workers.find((u) => u.id === userId)) groups.push('worker')
      return groups
    },

    // 전체 선택/해제
    toggleSelectAll() {
      if (this.isAllSelected) {
        // 현재 필터된 사용자들을 선택 해제
        this.filteredUsers.forEach((user) => {
          const index = this.selectedUsers.indexOf(user.id)
          if (index > -1) {
            this.selectedUsers.splice(index, 1)
          }
        })
      } else {
        // 현재 필터된 사용자들을 선택
        this.filteredUsers.forEach((user) => {
          if (!this.selectedUsers.includes(user.id)) {
            this.selectedUsers.push(user.id)
          }
        })
      }
    },

    // 다중 선택 토글
    toggleUserSelect(userId) {
      const index = this.selectedUsers.indexOf(userId)
      if (index > -1) {
        this.selectedUsers.splice(index, 1)
      } else {
        this.selectedUsers.push(userId)
      }
    },

    // 연구원으로 이동 (다중)
    moveToResearcher() {
      let count = 0
      this.selectedUsers.forEach((userId) => {
        const user = this.allUsers.find((u) => u.id === userId)
        if (user && !this.researchers.find((r) => r.id === user.id)) {
          this.researchers.push(user)
          count++
        }
      })
      this.selectedUsers = []
      if (count > 0) {
        showToast(`${count}명을 연구원으로 배정했습니다.`, { type: 'success' })
      }
    },

    // 오퍼레이션으로 이동 (다중)
    moveToOperation() {
      let count = 0
      this.selectedUsers.forEach((userId) => {
        const user = this.allUsers.find((u) => u.id === userId)
        if (user && !this.operations.find((o) => o.id === user.id)) {
          this.operations.push(user)
          count++
        }
      })
      this.selectedUsers = []
      if (count > 0) {
        showToast(`${count}명을 오퍼레이션으로 배정했습니다.`, { type: 'success' })
      }
    },

    // 실무자로 이동 (다중)
    moveToWorker() {
      let count = 0
      this.selectedUsers.forEach((userId) => {
        const user = this.allUsers.find((u) => u.id === userId)
        if (user && !this.workers.find((w) => w.id === user.id)) {
          this.workers.push(user)
          count++
        }
      })
      this.selectedUsers = []
      if (count > 0) {
        showToast(`${count}명을 실무자로 배정했습니다.`, { type: 'success' })
      }
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
      showToast('사용자 배정이 저장되었습니다.', { type: 'success' })
    },
  },
}
</script>

<style scoped>
/* 좌측 사용자 목록 */
.shared-user-box {
  background-color: #f8f9fa;
  padding: 12px;
}

.shared-user-item {
  padding: 12px 16px;
  margin-bottom: 6px;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.shared-user-item:hover {
  border-color: #0d6efd;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.shared-user-item.selected {
  border-color: #0d6efd;
  background-color: #e7f1ff;
  box-shadow: 0 2px 6px rgba(13, 110, 253, 0.2);
}

.shared-user-item.assigned {
  background-color: #f8f9fa;
  opacity: 0.7;
}

.shared-user-item.assigned:hover {
  opacity: 0.85;
}

/* 중앙 화살표 버튼 */
.shared-arrow-btn {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-width: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.shared-arrow-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.shared-arrow-btn small {
  margin-top: 2px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* 우측 배정된 그룹 */
.assigned-box {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
  padding: 8px;
}

.assigned-badge {
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.assigned-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.assigned-badge i {
  font-size: 0.75rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.assigned-badge:hover i {
  opacity: 1;
}

.badge-primary {
  background-color: #e7f1ff;
  color: #0d6efd;
  border-color: #0d6efd;
}

.badge-primary:hover {
  background-color: #cfe2ff;
}

.badge-success {
  background-color: #d1f4e0;
  color: #198754;
  border-color: #198754;
}

.badge-success:hover {
  background-color: #b8eed3;
}

.badge-warning {
  background-color: #fff3cd;
  color: #cc9a06;
  border-color: #ffc107;
}

.badge-warning:hover {
  background-color: #ffe69c;
}

/* 체크박스 스타일 */
.form-check-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.form-check-label {
  cursor: pointer;
  user-select: none;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 20px 0;
  width: 100%;
}
</style>
