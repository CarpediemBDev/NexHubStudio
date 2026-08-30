<template>
  <div class="container-fluid py-3 bg-theme-main text-theme-primary min-vh-100 d-flex flex-column">
    <!-- Page Header (타이틀과 우측 브레드크럼 수직 중앙 정렬 align-items: center 맞춤) -->
    <PageHeader
      title="사용자 배정 (공통 목록)"
      description="좌측 목록에서 사용자를 다중 선택 후, 중앙의 직무별 배정 버튼을 클릭하여 이동하세요."
    />

    <div class="row g-3 align-items-stretch flex-grow-1">
      <!-- 왼쪽: 전체 사용자 목록 (col-md-5) -->
      <div class="col-md-5">
        <div class="b2b-card h-100 d-flex flex-column">
          <div class="b2b-card-header bg-theme-subcard py-2 px-3">
            <div class="d-flex align-items-center gap-2">
              <div class="form-check mb-0 d-flex align-items-center">
                <input
                  class="form-check-input me-2"
                  type="checkbox"
                  id="selectAll"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
                <label class="form-check-label b2b-text-body fw-bold text-theme-primary" for="selectAll">
                  전체 선택 <span class="text-theme-secondary b2b-text-sm">({{ filteredUsers.length }})</span>
                </label>
              </div>
            </div>
            <span v-if="selectedUsers.length > 0" class="b2b-badge b2b-badge-primary">
              {{ selectedUsers.length }}명 선택됨
            </span>
          </div>

          <div class="b2b-card-body p-3 d-flex flex-column flex-grow-1">
            <!-- 검색 필터 -->
            <div class="input-group input-group-sm mb-3">
              <span class="input-group-text bg-theme-card border-theme text-theme-secondary">
                <i class="bi bi-search"></i>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control form-control-sm b2b-text-body bg-theme-card text-theme-primary border-theme search-input"
                placeholder="이름 또는 부서 검색..."
              />
            </div>

            <!-- 사용자 목록 스크롤 박스 -->
            <div class="shared-user-box border border-theme rounded-2 flex-grow-1">
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
                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      :checked="selectedUsers.includes(user.id)"
                      @click.stop="toggleUserSelect(user.id)"
                    />
                    <span class="b2b-text-body fw-bold text-theme-primary">{{ user.name }}</span>
                    <span class="b2b-badge b2b-badge-secondary ms-1">{{ user.department }}</span>
                  </div>
                  
                  <!-- 배정된 그룹 표시 태그 -->
                  <div v-if="getUserAssignedGroups(user.id).length > 0" class="d-flex gap-1">
                    <span
                      v-if="getUserAssignedGroups(user.id).includes('researcher')"
                      class="b2b-badge b2b-badge-primary"
                    >연구원</span>
                    <span
                      v-if="getUserAssignedGroups(user.id).includes('operation')"
                      class="b2b-badge b2b-badge-success"
                    >오퍼레이션</span>
                    <span
                      v-if="getUserAssignedGroups(user.id).includes('worker')"
                      class="b2b-badge b2b-badge-warning"
                    >현장사원</span>
                    <span
                      v-if="getUserAssignedGroups(user.id).includes('processWorker')"
                      class="b2b-badge b2b-badge-secondary"
                    >공정사원</span>
                  </div>
                </div>
              </div>

              <div v-if="filteredUsers.length === 0" class="text-center text-theme-secondary py-5">
                <i class="bi bi-search fs-3 d-block mb-2 text-theme-secondary"></i>
                <span class="b2b-text-sm text-theme-secondary">검색 결과가 없습니다</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 중앙: 수직 중앙 정렬 배정 버튼 컬럼 (col-md-2) -->
      <div class="col-md-2 d-flex flex-column justify-content-center align-items-center">
        <div class="middle-transfer-column">
          <div class="text-center mb-1">
            <span class="b2b-text-xs text-theme-secondary fw-semibold">직무 배정</span>
          </div>

          <button
            class="btn-b2b-primary transfer-btn"
            @click="moveToResearcher"
            :disabled="selectedUsers.length === 0"
            title="연구원으로 배정"
          >
            <span>연구원</span>
            <i class="bi bi-arrow-right-short fs-5"></i>
          </button>

          <button
            class="btn-b2b-success transfer-btn"
            @click="moveToOperation"
            :disabled="selectedUsers.length === 0"
            title="오퍼레이션으로 배정"
          >
            <span>오퍼레이션</span>
            <i class="bi bi-arrow-right-short fs-5"></i>
          </button>

          <button
            class="btn-b2b-warning transfer-btn"
            @click="moveToWorker"
            :disabled="selectedUsers.length === 0"
            title="현장사원으로 배정"
          >
            <span>현장사원</span>
            <i class="bi bi-arrow-right-short fs-5"></i>
          </button>

          <button
            class="btn-b2b-action transfer-btn"
            @click="moveToProcessWorker"
            :disabled="selectedUsers.length === 0"
            title="공정사원으로 배정"
          >
            <span>공정사원</span>
            <i class="bi bi-arrow-right-short fs-5"></i>
          </button>
        </div>
      </div>

      <!-- 오른쪽: 4개 직무 카드 (col-md-5) -->
      <div class="col-md-5">
        <div class="d-flex flex-column gap-3">
          <!-- 1. 연구원 그룹 -->
          <div class="b2b-card">
            <div class="b2b-card-header bg-theme-subcard py-2 px-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-people-fill text-primary fs-6"></i>
                <h6 class="b2b-text-h2 text-theme-primary mb-0">연구원</h6>
                <span class="b2b-badge b2b-badge-primary">{{ researchers.length }}명</span>
              </div>
            </div>
            <div class="b2b-card-body p-2">
              <div class="assigned-box bg-theme-subcard rounded-2 border border-theme">
                <span
                  v-for="user in researchers"
                  :key="user.id"
                  class="b2b-badge b2b-badge-primary cursor-pointer py-1 px-2.5 b2b-text-sm"
                  @click="removeFromResearcher(user.id)"
                  title="클릭하여 제거"
                >
                  {{ user.name }} ({{ user.department }})
                  <i class="bi bi-x-lg ms-1"></i>
                </span>
                <div v-if="researchers.length === 0" class="empty-state py-2">
                  <span class="b2b-text-sm text-theme-secondary">배정된 연구원이 없습니다</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 오퍼레이션 그룹 -->
          <div class="b2b-card">
            <div class="b2b-card-header bg-theme-subcard py-2 px-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-gear-fill text-success fs-6"></i>
                <h6 class="b2b-text-h2 text-theme-primary mb-0">오퍼레이션</h6>
                <span class="b2b-badge b2b-badge-success">{{ operations.length }}명</span>
              </div>
            </div>
            <div class="b2b-card-body p-2">
              <div class="assigned-box bg-theme-subcard rounded-2 border border-theme">
                <span
                  v-for="user in operations"
                  :key="user.id"
                  class="b2b-badge b2b-badge-success cursor-pointer py-1 px-2.5 b2b-text-sm"
                  @click="removeFromOperation(user.id)"
                  title="클릭하여 제거"
                >
                  {{ user.name }} ({{ user.department }})
                  <i class="bi bi-x-lg ms-1"></i>
                </span>
                <div v-if="operations.length === 0" class="empty-state py-2">
                  <span class="b2b-text-sm text-theme-secondary">배정된 오퍼레이션이 없습니다</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 현장사원 그룹 -->
          <div class="b2b-card">
            <div class="b2b-card-header bg-theme-subcard py-2 px-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-person-badge-fill text-warning fs-6"></i>
                <h6 class="b2b-text-h2 text-theme-primary mb-0">현장사원</h6>
                <span class="b2b-badge b2b-badge-warning">{{ workers.length }}명</span>
              </div>
            </div>
            <div class="b2b-card-body p-2">
              <div class="assigned-box bg-theme-subcard rounded-2 border border-theme">
                <span
                  v-for="user in workers"
                  :key="user.id"
                  class="b2b-badge b2b-badge-warning cursor-pointer py-1 px-2.5 b2b-text-sm"
                  @click="removeFromWorker(user.id)"
                  title="클릭하여 제거"
                >
                  {{ user.name }} ({{ user.department }})
                  <i class="bi bi-x-lg ms-1"></i>
                </span>
                <div v-if="workers.length === 0" class="empty-state py-2">
                  <span class="b2b-text-sm text-theme-secondary">배정된 현장사원이 없습니다</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. 공정사원 그룹 -->
          <div class="b2b-card">
            <div class="b2b-card-header bg-theme-subcard py-2 px-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-tools text-secondary fs-6"></i>
                <h6 class="b2b-text-h2 text-theme-primary mb-0">공정사원</h6>
                <span class="b2b-badge b2b-badge-secondary">{{ processWorkers.length }}명</span>
              </div>
            </div>
            <div class="b2b-card-body p-2">
              <div class="assigned-box bg-theme-subcard rounded-2 border border-theme">
                <span
                  v-for="user in processWorkers"
                  :key="user.id"
                  class="b2b-badge b2b-badge-secondary cursor-pointer py-1 px-2.5 b2b-text-sm"
                  @click="removeFromProcessWorker(user.id)"
                  title="클릭하여 제거"
                >
                  {{ user.name }} ({{ user.department }})
                  <i class="bi bi-x-lg ms-1"></i>
                </span>
                <div v-if="processWorkers.length === 0" class="empty-state py-2">
                  <span class="b2b-text-sm text-theme-secondary">배정된 공정사원이 없습니다</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 고정 배정 사항 저장 바 (Sticky Bottom Action Bar) -->
    <div class="sticky-save-bar d-flex align-items-center justify-content-between px-4 py-2.5 rounded-3 bg-theme-card border border-theme shadow-lg mt-4 position-sticky bottom-0 z-3">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-info-circle text-primary fs-6"></i>
        <span class="b2b-text-sm text-theme-secondary">
          연구원({{ researchers.length }}명), 오퍼레이션({{ operations.length }}명), 현장사원({{ workers.length }}명), 공정사원({{ processWorkers.length }}명) 배정 중
        </span>
      </div>
      <button class="btn-b2b-primary btn-lg px-4 shadow-sm" @click="saveAssignments">
        <i class="bi bi-check2-circle me-1 fs-6"></i> 배정 사항 저장
      </button>
    </div>
  </div>
</template>

<script>
import PageHeader from '@/components/PageHeader.vue'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'UserAssignmentShared',
  components: {
    PageHeader,
  },
  data() {
    return {
      searchQuery: '',
      selectedUsers: [], // 다중 선택
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
  },
  methods: {
    getUserAssignedGroups(userId) {
      const groups = []
      if (this.researchers.find((u) => u.id === userId)) groups.push('researcher')
      if (this.operations.find((u) => u.id === userId)) groups.push('operation')
      if (this.workers.find((u) => u.id === userId)) groups.push('worker')
      if (this.processWorkers.find((u) => u.id === userId)) groups.push('processWorker')
      return groups
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.filteredUsers.forEach((user) => {
          const index = this.selectedUsers.indexOf(user.id)
          if (index > -1) {
            this.selectedUsers.splice(index, 1)
          }
        })
      } else {
        this.filteredUsers.forEach((user) => {
          if (!this.selectedUsers.includes(user.id)) {
            this.selectedUsers.push(user.id)
          }
        })
      }
    },

    toggleUserSelect(userId) {
      const index = this.selectedUsers.indexOf(userId)
      if (index > -1) {
        this.selectedUsers.splice(index, 1)
      } else {
        this.selectedUsers.push(userId)
      }
    },

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
        showToast(`${count}명을 현장사원으로 배정했습니다.`, { type: 'success' })
      }
    },

    moveToProcessWorker() {
      let count = 0
      this.selectedUsers.forEach((userId) => {
        const user = this.allUsers.find((u) => u.id === userId)
        if (user && !this.processWorkers.find((p) => p.id === user.id)) {
          this.processWorkers.push(user)
          count++
        }
      })
      this.selectedUsers = []
      if (count > 0) {
        showToast(`${count}명을 공정사원으로 배정했습니다.`, { type: 'success' })
      }
    },

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
        showToast(`${user.name}을(를) 현장사원에서 제거했습니다.`, { type: 'info' })
      }
    },

    removeFromProcessWorker(userId) {
      const index = this.processWorkers.findIndex((u) => u.id === userId)
      if (index !== -1) {
        const user = this.processWorkers[index]
        this.processWorkers.splice(index, 1)
        showToast(`${user.name}을(를) 공정사원에서 제거했습니다.`, { type: 'info' })
      }
    },

    saveAssignments() {
      showToast('사용자 배정이 성공적으로 저장되었습니다.', { type: 'success' })
    },
  },
}
</script>

<style scoped>
/* 검색 인풋 placeholder 선명도 */
.search-input::placeholder {
  color: var(--text-secondary) !important;
  opacity: 0.85 !important;
}

/* 좌측 사용자 목록 박스 */
.shared-user-box {
  background-color: var(--bg-subcard) !important;
  padding: var(--b2b-space-2);
  min-height: 480px;
  max-height: 560px;
  overflow-y: auto;
}

.shared-user-item {
  padding: var(--b2b-space-2) var(--b2b-space-3);
  margin-bottom: var(--b2b-space-2);
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 6px;
  color: var(--text-primary) !important;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.shared-user-item:hover {
  border-color: var(--b2b-color-primary) !important;
  background-color: var(--bg-subcard) !important;
  transform: translateY(-1px);
}

.shared-user-item.selected {
  border-color: var(--b2b-color-primary) !important;
  background-color: var(--b2b-color-primary-subtle) !important;
  color: var(--text-primary) !important;
}

.shared-user-item.assigned {
  opacity: 0.88;
}

/* 중앙 정렬 수직 버튼 컬럼 */
.middle-transfer-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--b2b-space-4) !important;
  width: 100%;
}

.transfer-btn {
  width: 100% !important;
  max-width: 150px !important;
  height: 38px !important;
  padding: 0 var(--b2b-space-3) !important;
  font-size: var(--b2b-font-size-body) !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  border-radius: 6px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
  cursor: pointer !important;
  transition: all 0.15s ease-in-out !important;
}

.transfer-btn:hover:not(:disabled) {
  transform: scale(1.04) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
}

.transfer-btn:disabled {
  opacity: 0.55 !important;
  cursor: not-allowed !important;
  box-shadow: none !important;
  transform: none !important;
}

/* 우측 배정 박스 */
.assigned-box {
  display: flex;
  flex-wrap: wrap;
  gap: var(--b2b-space-2);
  align-items: center;
  padding: var(--b2b-space-2) 10px;
  min-height: 64px;
  overflow-y: auto;
}

.cursor-pointer {
  cursor: pointer;
}

/* 하단 고정 저장 바 (Sticky Save Bar) */
.sticky-save-bar {
  background-color: var(--bg-card) !important;
  backdrop-filter: blur(8px);
  border-color: var(--border-color) !important;
  bottom: 12px;
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
  width: 100%;
}
</style>
