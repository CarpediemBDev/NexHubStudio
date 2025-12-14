<template>
  <div class="assignment-container container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 px-2">
      <div>
        <h2 class="fw-bold text-dark mb-1">📢 인원 배치 관리</h2>
        <p class="text-muted mb-0 small">
          전체 인원 목록에서 각 파트별 담당자를 선정하여 배정하세요.
        </p>
      </div>
      <button class="btn btn-save shadow-sm px-4 py-2" @click="saveAssignments">
        <i class="bi bi-check-lg me-2"></i>변경사항 저장
      </button>
    </div>

    <div class="row g-4 h-100">
      <div class="col-lg-4 col-md-5 d-flex flex-column h-100">
        <div class="card source-card shadow-sm border-0 h-100">
          <div class="card-header bg-white border-bottom-0 pt-3 pb-0">
            <div class="search-wrapper position-relative mb-3">
              <i
                class="bi bi-search position-absolute text-muted"
                style="top: 12px; left: 15px"
              ></i>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control form-control-lg ps-5 bg-light border-0"
                placeholder="이름, 부서 검색..."
              />
            </div>
            <div class="d-flex align-items-center justify-content-between px-1 mb-2">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="selectAll"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
                <label class="form-check-label fw-semibold text-secondary" for="selectAll">
                  전체 선택
                  <span class="badge bg-secondary rounded-pill ms-1">{{
                    filteredUsers.length
                  }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="card-body p-0 custom-scrollbar source-list-body">
            <div v-if="filteredUsers.length === 0" class="empty-placeholder">
              <i class="bi bi-emoji-dizzy fs-1 text-muted mb-2"></i>
              <p class="text-muted">검색 결과가 없습니다.</p>
            </div>

            <ul class="list-group list-group-flush">
              <li
                v-for="user in filteredUsers"
                :key="user.id"
                class="list-group-item user-item d-flex align-items-center gap-3 py-3"
                :class="{ 'active-item': selectedUsers.includes(user.id) }"
                @click="toggleUserSelect(user.id)"
              >
                <div class="check-indicator">
                  <i
                    v-if="selectedUsers.includes(user.id)"
                    class="bi bi-check-circle-fill text-primary fs-5"
                  ></i>
                  <i v-else class="bi bi-circle text-muted fs-5 opacity-50"></i>
                </div>

                <div class="avatar shadow-sm" :class="getDeptColor(user.department)">
                  {{ user.name.charAt(0) }}
                </div>

                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-dark">{{ user.name }}</span>
                    <span class="badge bg-light text-secondary border">{{ user.department }}</span>
                  </div>
                  <div
                    class="mt-1 d-flex flex-wrap gap-1"
                    v-if="getUserAssignedGroups(user.id).length > 0"
                  >
                    <span v-if="hasGroup(user.id, 'researcher')" class="mini-tag tag-research"
                      >연구</span
                    >
                    <span v-if="hasGroup(user.id, 'operation')" class="mini-tag tag-operation"
                      >오퍼</span
                    >
                    <span v-if="hasGroup(user.id, 'worker')" class="mini-tag tag-worker">현장</span>
                    <span v-if="hasGroup(user.id, 'processWorker')" class="mini-tag tag-process"
                      >공정</span
                    >
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div
        class="col-lg-1 col-md-1 d-flex flex-column justify-content-center align-items-center gap-3 action-column"
      >
        <div class="action-divider"></div>

        <button
          class="btn btn-action btn-research shadow"
          @click="moveToResearcher"
          :disabled="!hasSelection"
          title="연구원으로 이동"
        >
          <i class="bi bi-chevron-right"></i>
          <span class="tooltip-text">연구원</span>
        </button>

        <button
          class="btn btn-action btn-operation shadow"
          @click="moveToOperation"
          :disabled="!hasSelection"
          title="오퍼레이션으로 이동"
        >
          <i class="bi bi-chevron-right"></i>
          <span class="tooltip-text">오퍼</span>
        </button>

        <button
          class="btn btn-action btn-worker shadow"
          @click="moveToWorker"
          :disabled="!hasSelection"
          title="현장사원으로 이동"
        >
          <i class="bi bi-chevron-right"></i>
          <span class="tooltip-text">현장</span>
        </button>

        <button
          class="btn btn-action btn-process shadow"
          @click="moveToProcessWorker"
          :disabled="!hasSelection"
          title="공정사원으로 이동"
        >
          <i class="bi bi-chevron-right"></i>
          <span class="tooltip-text">공정</span>
        </button>

        <div class="action-divider"></div>
      </div>

      <div class="col-lg-7 col-md-6">
        <div class="row g-3 h-100">
          <div class="col-md-6">
            <div class="card target-card border-research h-100 shadow-sm">
              <div
                class="card-header header-research d-flex justify-content-between align-items-center"
              >
                <span class="fw-bold"><i class="bi bi-flask me-2"></i>연구원</span>
                <span class="badge bg-white text-primary rounded-pill"
                  >{{ researchers.length }}명</span
                >
              </div>
              <div class="card-body custom-scrollbar p-2">
                <TransitionGroup name="list" tag="div" class="d-flex flex-wrap gap-2">
                  <div
                    v-for="user in researchers"
                    :key="user.id"
                    class="assigned-chip chip-research shadow-sm"
                    @click="removeFromResearcher(user.id)"
                  >
                    <span class="chip-avatar">{{ user.name.charAt(0) }}</span>
                    <span>{{ user.name }}</span>
                    <i class="bi bi-x ms-1 remove-icon"></i>
                  </div>
                </TransitionGroup>
                <div v-if="researchers.length === 0" class="empty-target">배정 없음</div>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card target-card border-operation h-100 shadow-sm">
              <div
                class="card-header header-operation d-flex justify-content-between align-items-center"
              >
                <span class="fw-bold"
                  ><i class="bi bi-gear-wide-connected me-2"></i>오퍼레이션</span
                >
                <span class="badge bg-white text-success rounded-pill"
                  >{{ operations.length }}명</span
                >
              </div>
              <div class="card-body custom-scrollbar p-2">
                <TransitionGroup name="list" tag="div" class="d-flex flex-wrap gap-2">
                  <div
                    v-for="user in operations"
                    :key="user.id"
                    class="assigned-chip chip-operation shadow-sm"
                    @click="removeFromOperation(user.id)"
                  >
                    <span class="chip-avatar">{{ user.name.charAt(0) }}</span>
                    <span>{{ user.name }}</span>
                    <i class="bi bi-x ms-1 remove-icon"></i>
                  </div>
                </TransitionGroup>
                <div v-if="operations.length === 0" class="empty-target">배정 없음</div>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card target-card border-worker h-100 shadow-sm">
              <div
                class="card-header header-worker d-flex justify-content-between align-items-center"
              >
                <span class="fw-bold"><i class="bi bi-hammer me-2"></i>현장사원</span>
                <span class="badge bg-white text-dark rounded-pill">{{ workers.length }}명</span>
              </div>
              <div class="card-body custom-scrollbar p-2">
                <TransitionGroup name="list" tag="div" class="d-flex flex-wrap gap-2">
                  <div
                    v-for="user in workers"
                    :key="user.id"
                    class="assigned-chip chip-worker shadow-sm"
                    @click="removeFromWorker(user.id)"
                  >
                    <span class="chip-avatar">{{ user.name.charAt(0) }}</span>
                    <span>{{ user.name }}</span>
                    <i class="bi bi-x ms-1 remove-icon"></i>
                  </div>
                </TransitionGroup>
                <div v-if="workers.length === 0" class="empty-target">배정 없음</div>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card target-card border-process h-100 shadow-sm">
              <div
                class="card-header header-process d-flex justify-content-between align-items-center"
              >
                <span class="fw-bold"><i class="bi bi-diagram-3 me-2"></i>공정사원</span>
                <span class="badge bg-white text-secondary rounded-pill"
                  >{{ processWorkers.length }}명</span
                >
              </div>
              <div class="card-body custom-scrollbar p-2">
                <TransitionGroup name="list" tag="div" class="d-flex flex-wrap gap-2">
                  <div
                    v-for="user in processWorkers"
                    :key="user.id"
                    class="assigned-chip chip-process shadow-sm"
                    @click="removeFromProcessWorker(user.id)"
                  >
                    <span class="chip-avatar">{{ user.name.charAt(0) }}</span>
                    <span>{{ user.name }}</span>
                    <i class="bi bi-x ms-1 remove-icon"></i>
                  </div>
                </TransitionGroup>
                <div v-if="processWorkers.length === 0" class="empty-target">배정 없음</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Toast 유틸이 없다면 임시로 alert 사용
// import { showToast } from '@/utils/toastUtil.js'
const showToast = (msg, opt) => console.log(msg) // 임시 대체

export default {
  name: 'ModernUserAssignment',
  data() {
    return {
      searchQuery: '',
      selectedUsers: [],
      // Mock Data (직급/부서 다양화)
      allUsers: [
        { id: 1, name: '홍길동', department: '개발팀' },
        { id: 2, name: '김철수', department: '기획팀' },
        { id: 3, name: '이영희', department: '디자인' },
        { id: 4, name: '박민수', department: '개발팀' },
        { id: 5, name: '정수진', department: '운영팀' },
        { id: 6, name: '최동욱', department: '기획팀' },
        { id: 7, name: '강민지', department: '디자인' },
        { id: 8, name: '윤서준', department: '개발팀' },
        { id: 9, name: '임하늘', department: '운영팀' },
        { id: 10, name: '송지우', department: '기획팀' },
        { id: 11, name: '조현우', department: '개발팀' },
        { id: 12, name: '한소희', department: '디자인' },
        { id: 13, name: '서준혁', department: '운영팀' },
        { id: 14, name: '장미란', department: '기획팀' },
        { id: 15, name: '노태우', department: '개발팀' },
        { id: 16, name: '배수지', department: '디자인' },
        { id: 17, name: '문재인', department: '운영팀' },
        { id: 18, name: '신세경', department: '기획팀' },
      ],
      researchers: [],
      operations: [],
      workers: [],
      processWorkers: [],
    }
  },
  computed: {
    filteredUsers() {
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
    hasSelection() {
      return this.selectedUsers.length > 0
    },
  },
  methods: {
    // 헬퍼: 배정 여부 확인
    hasGroup(userId, groupType) {
      if (groupType === 'researcher') return this.researchers.find((u) => u.id === userId)
      if (groupType === 'operation') return this.operations.find((u) => u.id === userId)
      if (groupType === 'worker') return this.workers.find((u) => u.id === userId)
      if (groupType === 'processWorker') return this.processWorkers.find((u) => u.id === userId)
      return false
    },
    // 헬퍼: 전체 배정 리스트 반환
    getUserAssignedGroups(userId) {
      const groups = []
      if (this.hasGroup(userId, 'researcher')) groups.push('researcher')
      if (this.hasGroup(userId, 'operation')) groups.push('operation')
      if (this.hasGroup(userId, 'worker')) groups.push('worker')
      if (this.hasGroup(userId, 'processWorker')) groups.push('processWorker')
      return groups
    },
    // 헬퍼: 부서별 아바타 색상
    getDeptColor(dept) {
      if (dept.includes('개발')) return 'avatar-blue'
      if (dept.includes('기획')) return 'avatar-green'
      if (dept.includes('디자인')) return 'avatar-pink'
      return 'avatar-gray'
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.filteredUsers.forEach((user) => {
          const index = this.selectedUsers.indexOf(user.id)
          if (index > -1) this.selectedUsers.splice(index, 1)
        })
      } else {
        this.filteredUsers.forEach((user) => {
          if (!this.selectedUsers.includes(user.id)) this.selectedUsers.push(user.id)
        })
      }
    },
    toggleUserSelect(userId) {
      const index = this.selectedUsers.indexOf(userId)
      if (index > -1) this.selectedUsers.splice(index, 1)
      else this.selectedUsers.push(userId)
    },

    // 이동 로직 (리팩토링하여 중복 제거 가능하지만 가독성을 위해 유지)
    moveToResearcher() {
      this.moveUsersTo(this.researchers, '연구원')
    },
    moveToOperation() {
      this.moveUsersTo(this.operations, '오퍼레이션')
    },
    moveToWorker() {
      this.moveUsersTo(this.workers, '현장사원')
    },
    moveToProcessWorker() {
      this.moveUsersTo(this.processWorkers, '공정사원')
    },
    moveUsersTo(targetArray, groupName) {
      let count = 0
      this.selectedUsers.forEach((userId) => {
        const user = this.allUsers.find((u) => u.id === userId)
        if (user && !targetArray.find((u) => u.id === user.id)) {
          targetArray.push(user)
          count++
        }
      })
      this.selectedUsers = []
      if (count > 0) showToast(`${count}명을 ${groupName}으로 배정했습니다.`)
    },

    // 제거 로직
    removeFromResearcher(userId) {
      this.removeUserFrom(this.researchers, userId)
    },
    removeFromOperation(userId) {
      this.removeUserFrom(this.operations, userId)
    },
    removeFromWorker(userId) {
      this.removeUserFrom(this.workers, userId)
    },
    removeFromProcessWorker(userId) {
      this.removeUserFrom(this.processWorkers, userId)
    },
    removeUserFrom(targetArray, userId) {
      const index = targetArray.findIndex((u) => u.id === userId)
      if (index !== -1) targetArray.splice(index, 1)
    },

    saveAssignments() {
      alert('저장 완료! (콘솔 확인)')
      console.log({
        researchers: this.researchers,
        operations: this.operations,
        workers: this.workers,
        processWorkers: this.processWorkers,
      })
    },
  },
}
</script>

<style scoped>
/* 구글 폰트 (Pretendard 느낌) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.assignment-container {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  background-color: #f8f9fa;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 카드 공통 스타일 */
.card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}
.source-card {
  background-color: #ffffff;
}

/* 커스텀 스크롤바 */
.custom-scrollbar {
  overflow-y: auto;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 왼쪽 사용자 리스트 스타일 */
.source-list-body {
  height: 100%; /* 부모 높이 채움 */
}
.user-item {
  border: none;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
}
.user-item:hover {
  background-color: #f8fafc;
  transform: translateX(4px);
}
.user-item.active-item {
  background-color: #eff6ff; /* 선택된 항목 배경 */
}
.user-item:last-child {
  border-bottom: none;
}

/* 아바타 스타일 */
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
}
.avatar-blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}
.avatar-green {
  background: linear-gradient(135deg, #10b981, #059669);
}
.avatar-pink {
  background: linear-gradient(135deg, #ec4899, #db2777);
}
.avatar-gray {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

/* 중앙 액션 버튼 스타일 */
.action-column {
  height: 100%;
}
.btn-action {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}
.btn-action:hover:not(:disabled) {
  transform: scale(1.15);
  z-index: 10;
}
.btn-action:disabled {
  background-color: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: scale(1);
}

/* 툴팁 효과 */
.tooltip-text {
  visibility: hidden;
  position: absolute;
  right: 120%; /* 버튼 왼쪽으로 */
  background-color: #1e293b;
  color: #fff;
  text-align: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
}
.btn-action:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

/* 그룹별 버튼 색상 */
.btn-research {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}
.btn-operation {
  background: linear-gradient(135deg, #10b981, #059669);
}
.btn-worker {
  background: linear-gradient(135deg, #f59e0b, #d97706);
} /* 현장사원: 주황/엠버 */
.btn-process {
  background: linear-gradient(135deg, #64748b, #475569);
} /* 공정사원: 쿨그레이 */

/* 오른쪽 타겟 카드 스타일 */
.target-card {
  background-color: #ffffff;
  border-top: 4px solid transparent; /* 상단 포인트 컬러 */
}
.border-research {
  border-top-color: #3b82f6;
}
.border-operation {
  border-top-color: #10b981;
}
.border-worker {
  border-top-color: #f59e0b;
}
.border-process {
  border-top-color: #64748b;
}

.card-header {
  background: transparent;
  border-bottom: 1px dashed #e2e8f0;
  padding: 12px 16px;
}
.header-research {
  color: #2563eb;
}
.header-operation {
  color: #059669;
}
.header-worker {
  color: #d97706;
}
.header-process {
  color: #475569;
}

/* 배정된 칩 스타일 */
.assigned-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px 6px 6px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  border: 1px solid transparent;
}
.assigned-chip:hover {
  transform: translateY(-2px);
  background-color: #fff1f2; /* 삭제 느낌의 붉은 배경 */
  border-color: #fda4af;
  color: #e11d48;
}
.assigned-chip:hover .chip-avatar {
  background-color: #e11d48;
  color: white;
}

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  margin-right: 8px;
  font-weight: bold;
}

/* 칩 그룹별 테두리 포인트 */
.chip-research {
  border-left: 3px solid #3b82f6;
}
.chip-operation {
  border-left: 3px solid #10b981;
}
.chip-worker {
  border-left: 3px solid #f59e0b;
}
.chip-process {
  border-left: 3px solid #64748b;
}

.remove-icon {
  font-size: 1.1em;
  opacity: 0.5;
}
.assigned-chip:hover .remove-icon {
  opacity: 1;
}

/* 빈 상태 */
.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  opacity: 0.5;
}
.empty-target {
  text-align: center;
  color: #cbd5e1;
  font-size: 0.85rem;
  margin-top: 20px;
  font-style: italic;
}

/* 리스트 애니메이션 (Vue TransitionGroup) */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 미니 태그 스타일 (왼쪽 리스트 내) */
.mini-tag {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  color: white;
  font-weight: bold;
}
.tag-research {
  background-color: #3b82f6;
  opacity: 0.8;
}
.tag-operation {
  background-color: #10b981;
  opacity: 0.8;
}
.tag-worker {
  background-color: #f59e0b;
  opacity: 0.8;
}
.tag-process {
  background-color: #64748b;
  opacity: 0.8;
}

/* 저장 버튼 */
.btn-save {
  background-color: #0f172a;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-save:hover {
  background-color: #1e293b;
  transform: translateY(-2px);
}
</style>
