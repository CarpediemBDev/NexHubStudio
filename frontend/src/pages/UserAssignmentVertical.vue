<template>
  <div class="container-fluid py-3">
    <h2 class="mb-4">사용자 배정 (세로 레이아웃)</h2>

    <!-- 연구원 그룹 -->
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary bg-opacity-10 border-primary">
        <h5 class="mb-0 text-primary">연구원 배정</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- 전체 사용자 목록 -->
          <div class="col-md-5">
            <div class="mb-2">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="selectAllResearcher"
                  :checked="isAllResearcherSelected"
                  @change="toggleSelectAllResearcher"
                />
                <label class="form-check-label" for="selectAllResearcher">
                  전체 선택 <span class="text-muted">({{ availableUsers.length }})</span>
                </label>
              </div>
            </div>
            <div class="transfer-box border rounded" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in availableUsers"
                :key="user.id"
                class="transfer-item"
                :class="{
                  selected: selectedAvailable.researcher.includes(user.id),
                  assigned: getUserAssignedGroup(user.id),
                }"
                @click="toggleAvailableSelect('researcher', user.id)"
              >
                <div class="d-flex align-items-center">
                  <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :checked="selectedAvailable.researcher.includes(user.id)"
                    @click.stop="toggleAvailableSelect('researcher', user.id)"
                  />
                  <span>{{ user.name }}</span>
                  <small class="ms-auto text-muted">{{ user.department }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- 화살표 버튼 -->
          <div class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2">
            <button
              class="btn btn-sm btn-outline-primary transfer-btn"
              @click="moveToResearcher"
              :disabled="selectedAvailable.researcher.length === 0"
              title="연구원으로 추가"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
            <button
              class="btn btn-sm btn-outline-secondary transfer-btn"
              @click="removeFromResearcher"
              :disabled="selectedAssigned.researcher.length === 0"
              title="연구원에서 제거"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
          </div>

          <!-- 선택된 연구원 -->
          <div class="col-md-5">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">선택된 연구원</h6>
              <span class="badge bg-primary">{{ researchers.length }}</span>
            </div>
            <div
              class="transfer-box transfer-box-assigned border rounded"
              style="height: 300px; overflow-y: auto"
            >
              <div
                v-for="user in researchers"
                :key="user.id"
                class="transfer-item assigned"
                :class="{ selected: selectedAssigned.researcher.includes(user.id) }"
                @click="toggleAssignedSelect('researcher', user.id)"
              >
                <div class="d-flex align-items-center">
                  <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :checked="selectedAssigned.researcher.includes(user.id)"
                    @click.stop="toggleAssignedSelect('researcher', user.id)"
                  />
                  <span>{{ user.name }}</span>
                  <small class="ms-auto text-muted">{{ user.department }}</small>
                </div>
              </div>
              <div v-if="researchers.length === 0" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                <small>배정된 연구원이 없습니다</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 오퍼레이션 그룹 -->
    <div class="card mb-4 border-success">
      <div class="card-header bg-success bg-opacity-10 border-success">
        <h5 class="mb-0 text-success">오퍼레이션 배정</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- 전체 사용자 목록 -->
          <div class="col-md-5">
            <div class="mb-2">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="selectAllOperation"
                  :checked="isAllOperationSelected"
                  @change="toggleSelectAllOperation"
                />
                <label class="form-check-label" for="selectAllOperation">
                  전체 선택 <span class="text-muted">({{ availableUsers.length }})</span>
                </label>
              </div>
            </div>
            <div class="transfer-box border rounded" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in availableUsers"
                :key="user.id"
                class="transfer-item"
                :class="{
                  selected: selectedAvailable.operation.includes(user.id),
                  assigned: getUserAssignedGroup(user.id),
                }"
                @click="toggleAvailableSelect('operation', user.id)"
              >
                <div class="d-flex align-items-center">
                  <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :checked="selectedAvailable.operation.includes(user.id)"
                    @click.stop="toggleAvailableSelect('operation', user.id)"
                  />
                  <span>{{ user.name }}</span>
                  <small class="ms-auto text-muted">{{ user.department }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- 화살표 버튼 -->
          <div class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2">
            <button
              class="btn btn-sm btn-outline-success transfer-btn"
              @click="moveToOperation"
              :disabled="selectedAvailable.operation.length === 0"
              title="오퍼레이션으로 추가"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
            <button
              class="btn btn-sm btn-outline-secondary transfer-btn"
              @click="removeFromOperation"
              :disabled="selectedAssigned.operation.length === 0"
              title="오퍼레이션에서 제거"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
          </div>

          <!-- 선택된 오퍼레이션 -->
          <div class="col-md-5">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">선택된 오퍼레이션</h6>
              <span class="badge bg-success">{{ operations.length }}</span>
            </div>
            <div
              class="transfer-box transfer-box-assigned border rounded"
              style="height: 300px; overflow-y: auto"
            >
              <div
                v-for="user in operations"
                :key="user.id"
                class="transfer-item assigned"
                :class="{ selected: selectedAssigned.operation.includes(user.id) }"
                @click="toggleAssignedSelect('operation', user.id)"
              >
                <div class="d-flex align-items-center">
                  <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :checked="selectedAssigned.operation.includes(user.id)"
                    @click.stop="toggleAssignedSelect('operation', user.id)"
                  />
                  <span>{{ user.name }}</span>
                  <small class="ms-auto text-muted">{{ user.department }}</small>
                </div>
              </div>
              <div v-if="operations.length === 0" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                <small>배정된 오퍼레이션이 없습니다</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 실무자 그룹 -->
    <div class="card mb-4 border-warning">
      <div class="card-header bg-warning bg-opacity-10 border-warning">
        <h5 class="mb-0 text-warning">실무자 배정</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <!-- 전체 사용자 목록 -->
          <div class="col-md-5">
            <div class="mb-2">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="selectAllWorker"
                  :checked="isAllWorkerSelected"
                  @change="toggleSelectAllWorker"
                />
                <label class="form-check-label" for="selectAllWorker">
                  전체 선택 <span class="text-muted">({{ availableUsers.length }})</span>
                </label>
              </div>
            </div>
            <div class="transfer-box border rounded" style="height: 300px; overflow-y: auto">
              <div
                v-for="user in availableUsers"
                :key="user.id"
                class="transfer-item"
                :class="{
                  selected: selectedAvailable.worker.includes(user.id),
                  assigned: getUserAssignedGroup(user.id),
                }"
                @click="toggleAvailableSelect('worker', user.id)"
              >
                <div class="d-flex align-items-center">
                  <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :checked="selectedAvailable.worker.includes(user.id)"
                    @click.stop="toggleAvailableSelect('worker', user.id)"
                  />
                  <span>{{ user.name }}</span>
                  <small class="ms-auto text-muted">{{ user.department }}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- 화살표 버튼 -->
          <div class="col-md-2 d-flex flex-column justify-content-center align-items-center gap-2">
            <button
              class="btn btn-sm btn-outline-warning transfer-btn"
              @click="moveToWorker"
              :disabled="selectedAvailable.worker.length === 0"
              title="실무자로 추가"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
            <button
              class="btn btn-sm btn-outline-secondary transfer-btn"
              @click="removeFromWorker"
              :disabled="selectedAssigned.worker.length === 0"
              title="실무자에서 제거"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
          </div>

          <!-- 선택된 실무자 -->
          <div class="col-md-5">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">선택된 실무자</h6>
              <span class="badge bg-warning text-dark">{{ workers.length }}</span>
            </div>
            <div
              class="transfer-box transfer-box-assigned border rounded"
              style="height: 300px; overflow-y: auto"
            >
              <div
                v-for="user in workers"
                :key="user.id"
                class="transfer-item assigned"
                :class="{ selected: selectedAssigned.worker.includes(user.id) }"
                @click="toggleAssignedSelect('worker', user.id)"
              >
                <div class="d-flex align-items-center">
                  <input
                    type="checkbox"
                    class="form-check-input me-2"
                    :checked="selectedAssigned.worker.includes(user.id)"
                    @click.stop="toggleAssignedSelect('worker', user.id)"
                  />
                  <span>{{ user.name }}</span>
                  <small class="ms-auto text-muted">{{ user.department }}</small>
                </div>
              </div>
              <div v-if="workers.length === 0" class="text-center text-muted py-5">
                <i class="bi bi-inbox fs-3 d-block mb-2"></i>
                <small>배정된 실무자가 없습니다</small>
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
      // 선택된 사용자 (다중 선택 - 배열)
      selectedAvailable: {
        researcher: [],
        operation: [],
        worker: [],
      },
      // 선택된 사용자 (오른쪽 - 배열)
      selectedAssigned: {
        researcher: [],
        operation: [],
        worker: [],
      },
    }
  },
  computed: {
    isAllResearcherSelected() {
      return (
        this.availableUsers.length > 0 &&
        this.availableUsers.every((user) => this.selectedAvailable.researcher.includes(user.id))
      )
    },
    isAllOperationSelected() {
      return (
        this.availableUsers.length > 0 &&
        this.availableUsers.every((user) => this.selectedAvailable.operation.includes(user.id))
      )
    },
    isAllWorkerSelected() {
      return (
        this.availableUsers.length > 0 &&
        this.availableUsers.every((user) => this.selectedAvailable.worker.includes(user.id))
      )
    },
  },
  methods: {
    // 사용자가 어느 그룹에 배정되었는지 확인
    getUserAssignedGroup(userId) {
      if (this.researchers.find((u) => u.id === userId)) return 'researcher'
      if (this.operations.find((u) => u.id === userId)) return 'operation'
      if (this.workers.find((u) => u.id === userId)) return 'worker'
      return null
    },

    // 전체 선택/해제
    toggleSelectAllResearcher() {
      if (this.isAllResearcherSelected) {
        this.selectedAvailable.researcher = []
      } else {
        this.selectedAvailable.researcher = this.availableUsers.map((u) => u.id)
      }
    },
    toggleSelectAllOperation() {
      if (this.isAllOperationSelected) {
        this.selectedAvailable.operation = []
      } else {
        this.selectedAvailable.operation = this.availableUsers.map((u) => u.id)
      }
    },
    toggleSelectAllWorker() {
      if (this.isAllWorkerSelected) {
        this.selectedAvailable.worker = []
      } else {
        this.selectedAvailable.worker = this.availableUsers.map((u) => u.id)
      }
    },

    // 다중 선택 토글
    toggleAvailableSelect(group, userId) {
      const index = this.selectedAvailable[group].indexOf(userId)
      if (index > -1) {
        this.selectedAvailable[group].splice(index, 1)
      } else {
        this.selectedAvailable[group].push(userId)
      }
    },
    toggleAssignedSelect(group, userId) {
      const index = this.selectedAssigned[group].indexOf(userId)
      if (index > -1) {
        this.selectedAssigned[group].splice(index, 1)
      } else {
        this.selectedAssigned[group].push(userId)
      }
    },

    // 연구원으로 이동 (다중)
    moveToResearcher() {
      this.selectedAvailable.researcher.forEach((userId) => {
        const user = this.availableUsers.find((u) => u.id === userId)
        if (user && !this.researchers.find((r) => r.id === user.id)) {
          this.researchers.push(user)
        }
      })
      const count = this.selectedAvailable.researcher.length
      this.selectedAvailable.researcher = []
      showToast(`${count}명을 연구원으로 추가했습니다.`, { type: 'success' })
    },
    removeFromResearcher() {
      this.selectedAssigned.researcher.forEach((userId) => {
        const index = this.researchers.findIndex((u) => u.id === userId)
        if (index !== -1) {
          this.researchers.splice(index, 1)
        }
      })
      const count = this.selectedAssigned.researcher.length
      this.selectedAssigned.researcher = []
      showToast(`${count}명을 연구원에서 제거했습니다.`, { type: 'info' })
    },

    // 오퍼레이션으로 이동 (다중)
    moveToOperation() {
      this.selectedAvailable.operation.forEach((userId) => {
        const user = this.availableUsers.find((u) => u.id === userId)
        if (user && !this.operations.find((o) => o.id === user.id)) {
          this.operations.push(user)
        }
      })
      const count = this.selectedAvailable.operation.length
      this.selectedAvailable.operation = []
      showToast(`${count}명을 오퍼레이션으로 추가했습니다.`, { type: 'success' })
    },
    removeFromOperation() {
      this.selectedAssigned.operation.forEach((userId) => {
        const index = this.operations.findIndex((u) => u.id === userId)
        if (index !== -1) {
          this.operations.splice(index, 1)
        }
      })
      const count = this.selectedAssigned.operation.length
      this.selectedAssigned.operation = []
      showToast(`${count}명을 오퍼레이션에서 제거했습니다.`, { type: 'info' })
    },

    // 실무자로 이동 (다중)
    moveToWorker() {
      this.selectedAvailable.worker.forEach((userId) => {
        const user = this.availableUsers.find((u) => u.id === userId)
        if (user && !this.workers.find((w) => w.id === user.id)) {
          this.workers.push(user)
        }
      })
      const count = this.selectedAvailable.worker.length
      this.selectedAvailable.worker = []
      showToast(`${count}명을 실무자로 추가했습니다.`, { type: 'success' })
    },
    removeFromWorker() {
      this.selectedAssigned.worker.forEach((userId) => {
        const index = this.workers.findIndex((u) => u.id === userId)
        if (index !== -1) {
          this.workers.splice(index, 1)
        }
      })
      const count = this.selectedAssigned.worker.length
      this.selectedAssigned.worker = []
      showToast(`${count}명을 실무자에서 제거했습니다.`, { type: 'info' })
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
/* Transfer 박스 스타일 */
.transfer-box {
  background-color: #fafafa;
  padding: 8px;
}

.transfer-box-assigned {
  background-color: #f0f7ff;
}

/* Transfer 아이템 */
.transfer-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.transfer-item:hover {
  border-color: #0d6efd;
  background-color: #f8f9fa;
}

.transfer-item.selected {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.transfer-item.assigned {
  background-color: #f8f9fa;
  opacity: 0.7;
  border-left: 3px solid #198754;
}

.transfer-item.assigned:hover {
  opacity: 0.85;
}

/* Transfer 버튼 */
.transfer-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 4px;
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
</style>
