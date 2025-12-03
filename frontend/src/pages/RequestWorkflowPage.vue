<template>
  <div class="container mt-4">
    <h2 class="mb-4">업무 의뢰 관리</h2>

    <!-- 1. 진행 상태 표시 (상단 스텝바) -->
    <div class="workflow-steps mb-5">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="step-item"
        :class="{
          active: currentStep === step.key,
          completed: isStepCompleted(step.key),
        }"
      >
        <div class="step-circle">
          <i :class="step.icon"></i>
        </div>
        <div class="step-label">{{ step.label }}</div>
        <div v-if="index < steps.length - 1" class="step-line"></div>
      </div>
    </div>

    <!-- 2. 각 단계별 폼 (아코디언 형태) -->
    <div class="accordion" id="workflowAccordion">
      <!-- 의뢰 단계 -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ collapsed: !sections.request, disabled: !canAccessSection('request') }"
            :disabled="!canAccessSection('request')"
            type="button"
            @click="toggleSection('request')"
          >
            <i class="bi bi-file-earmark-text me-2"></i>
            의뢰
            <span class="badge bg-primary ms-2">1단계</span>
          </button>
        </h2>
        <div class="accordion-collapse collapse" :class="{ show: sections.request }">
          <div class="accordion-body">
            <form>
              <div class="mb-3">
                <label class="form-label fw-bold"
                  >의뢰 제목 <span class="text-danger">*</span></label
                >
                <input
                  type="text"
                  class="form-control"
                  v-model="requestData.title"
                  placeholder="의뢰 제목을 입력하세요"
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold"
                  >의뢰 내용 <span class="text-danger">*</span></label
                >
                <textarea
                  class="form-control"
                  rows="5"
                  v-model="requestData.content"
                  placeholder="의뢰 내용을 상세히 입력하세요"
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">우선순위</label>
                <select class="form-select" v-model="requestData.priority">
                  <option value="low">낮음</option>
                  <option value="normal">보통</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">첨부파일</label>
                <div class="file-upload-area border rounded p-3 text-center bg-light">
                  <i class="bi bi-cloud-upload fs-1 text-muted"></i>
                  <p class="mb-2 text-muted">클릭하거나 파일을 드래그하세요</p>
                  <input type="file" class="form-control" multiple />
                  <small class="text-muted">최대 10MB, 여러 파일 선택 가능</small>
                </div>
                <!-- 첨부파일 목록 예시 -->
                <ul class="list-group mt-2" v-if="requestData.files.length > 0">
                  <li
                    v-for="(file, idx) in requestData.files"
                    :key="idx"
                    class="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <span><i class="bi bi-file-earmark me-2"></i>{{ file }}</span>
                    <button class="btn btn-sm btn-outline-danger">
                      <i class="bi bi-x"></i>
                    </button>
                  </li>
                </ul>
              </div>

              <div class="text-end">
                <button type="button" class="btn btn-primary">
                  <i class="bi bi-send me-1"></i>의뢰 제출
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- 접수 단계 -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ collapsed: !sections.receive, disabled: !canAccessSection('receive') }"
            :disabled="!canAccessSection('receive')"
            type="button"
            @click="toggleSection('receive')"
          >
            <i class="bi bi-inbox me-2"></i>
            접수
            <span class="badge bg-success ms-2">2단계</span>
          </button>
        </h2>
        <div class="accordion-collapse collapse" :class="{ show: sections.receive }">
          <div class="accordion-body">
            <!-- 의뢰 내용 요약 (읽기 전용) -->
            <div class="alert alert-info">
              <h6 class="alert-heading"><i class="bi bi-info-circle me-2"></i>접수된 의뢰 정보</h6>
              <p class="mb-1"><strong>제목:</strong> {{ requestData.title || '(의뢰 제목)' }}</p>
              <p class="mb-0">
                <strong>우선순위:</strong>
                <span class="badge bg-warning">{{ getPriorityLabel(requestData.priority) }}</span>
              </p>
            </div>

            <form>
              <div class="mb-3">
                <label class="form-label fw-bold"
                  >접수 담당자 <span class="text-danger">*</span></label
                >
                <input
                  type="text"
                  class="form-control"
                  v-model="receiveData.assignee"
                  placeholder="담당자명을 입력하세요"
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">접수 일시</label>
                <input
                  type="datetime-local"
                  class="form-control"
                  v-model="receiveData.receivedAt"
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">접수 의견</label>
                <textarea
                  class="form-control"
                  rows="4"
                  v-model="receiveData.comment"
                  placeholder="접수 확인 내용 및 예상 처리 기간 등을 입력하세요"
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">예상 완료일</label>
                <input type="date" class="form-control" v-model="receiveData.expectedDate" />
              </div>

              <div class="text-end">
                <button type="button" class="btn btn-success">
                  <i class="bi bi-check-circle me-1"></i>접수 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- 진행 단계 -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ collapsed: !sections.progress, disabled: !canAccessSection('progress') }"
            :disabled="!canAccessSection('progress')"
            type="button"
            @click="toggleSection('progress')"
          >
            <i class="bi bi-gear me-2"></i>
            진행
            <span class="badge bg-warning ms-2">3단계</span>
          </button>
        </h2>
        <div class="accordion-collapse collapse" :class="{ show: sections.progress }">
          <div class="accordion-body">
            <form>
              <div class="mb-3">
                <label class="form-label fw-bold">진행 상태</label>
                <div class="progress" style="height: 30px">
                  <div
                    class="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    :style="{ width: progressData.percentage + '%' }"
                  >
                    {{ progressData.percentage }}%
                  </div>
                </div>
                <input
                  type="range"
                  class="form-range mt-2"
                  min="0"
                  max="100"
                  v-model="progressData.percentage"
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">진행 내용</label>
                <textarea
                  class="form-control"
                  rows="5"
                  v-model="progressData.description"
                  placeholder="현재 진행 상황을 입력하세요"
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">이슈 사항</label>
                <textarea
                  class="form-control"
                  rows="3"
                  v-model="progressData.issues"
                  placeholder="발생한 이슈나 지연 사유를 입력하세요"
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">진행 상황 첨부</label>
                <div class="file-upload-area border rounded p-3 text-center bg-light">
                  <i class="bi bi-image fs-1 text-muted"></i>
                  <p class="mb-2 text-muted">스크린샷 또는 진행 자료 첨부</p>
                  <input type="file" class="form-control" multiple />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- 결과 단계 -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ collapsed: !sections.result, disabled: !canAccessSection('result') }"
            :disabled="!canAccessSection('result')"
            type="button"
            @click="toggleSection('result')"
          >
            <i class="bi bi-check-circle me-2"></i>
            결과
            <span class="badge bg-dark ms-2">4단계</span>
          </button>
        </h2>
        <div class="accordion-collapse collapse" :class="{ show: sections.result }">
          <div class="accordion-body">
            <form>
              <div class="mb-3">
                <label class="form-label fw-bold"
                  >처리 결과 <span class="text-danger">*</span></label
                >
                <select class="form-select" v-model="resultData.status">
                  <option value="completed">완료</option>
                  <option value="partial">부분 완료</option>
                  <option value="rejected">반려</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">결과 상세 내용</label>
                <textarea
                  class="form-control"
                  rows="6"
                  v-model="resultData.description"
                  placeholder="처리 결과를 상세히 입력하세요"
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">완료 일시</label>
                <input
                  type="datetime-local"
                  class="form-control"
                  v-model="resultData.completedAt"
                />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">결과 첨부파일</label>
                <div class="file-upload-area border rounded p-3 text-center bg-light">
                  <i class="bi bi-file-earmark-check fs-1 text-muted"></i>
                  <p class="mb-2 text-muted">최종 결과물 첨부</p>
                  <input type="file" class="form-control" multiple />
                </div>
                <!-- 첨부파일 목록 예시 -->
                <ul class="list-group mt-2" v-if="resultData.files.length > 0">
                  <li
                    v-for="(file, idx) in resultData.files"
                    :key="idx"
                    class="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <span><i class="bi bi-file-earmark-pdf me-2 text-danger"></i>{{ file }}</span>
                    <button class="btn btn-sm btn-outline-danger">
                      <i class="bi bi-x"></i>
                    </button>
                  </li>
                </ul>
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">만족도 평가</label>
                <div class="d-flex gap-2">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    class="btn btn-outline-warning"
                    :class="{ 'btn-warning': resultData.rating >= star }"
                    @click="resultData.rating = star"
                  >
                    <i class="bi bi-star-fill"></i>
                  </button>
                </div>
              </div>

              <div class="text-end">
                <button type="button" class="btn btn-dark">
                  <i class="bi bi-flag-fill me-1"></i>최종 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="text-center mt-4">
      <button class="btn btn-secondary"><i class="bi bi-list me-1"></i>목록으로</button>
      <button class="btn btn-outline-primary ms-2"><i class="bi bi-printer me-1"></i>인쇄</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RequestWorkflowPage',
  data() {
    return {
      currentStep: 'progress', // request, receive, progress, result

      steps: [
        { key: 'request', label: '의뢰', icon: 'bi bi-file-earmark-text' },
        { key: 'receive', label: '접수', icon: 'bi bi-inbox' },
        { key: 'progress', label: '진행', icon: 'bi bi-gear' },
        { key: 'result', label: '결과', icon: 'bi bi-check-circle' },
      ],

      // 아코디언 펼침/접힘 상태
      sections: {
        request: false,
        receive: false,
        progress: true,
        result: false,
      },

      // 의뢰 데이터
      requestData: {
        title: '',
        content: '',
        priority: 'normal',
        files: ['제안서.pdf', '요구사항_정의서.docx'], // 예시
      },

      // 접수 데이터
      receiveData: {
        assignee: '',
        receivedAt: '',
        comment: '',
        expectedDate: '',
      },

      // 진행 데이터
      progressData: {
        percentage: 30,
        description: '',
        issues: '',
      },

      // 결과 데이터
      resultData: {
        status: 'completed',
        description: '',
        completedAt: '',
        rating: 0,
        files: ['최종결과물.pdf', '테스트_결과서.xlsx'], // 예시
      },
    }
  },
  methods: {
    toggleSection(section) {
      // 현재 상태에 따라 접근 가능한 섹션 제한
      if (!this.canAccessSection(section)) {
        return
      }
      this.sections[section] = !this.sections[section]
    },
    canAccessSection(section) {
      const stepOrder = ['request', 'receive', 'progress', 'result']
      const currentIndex = stepOrder.indexOf(this.currentStep)
      const sectionIndex = stepOrder.indexOf(section)
      // 현재 단계 이하만 접근 가능
      return sectionIndex <= currentIndex
    },
    isStepCompleted(stepKey) {
      const stepOrder = ['request', 'receive', 'progress', 'result']
      const currentIndex = stepOrder.indexOf(this.currentStep)
      const checkIndex = stepOrder.indexOf(stepKey)
      return checkIndex < currentIndex
    },
    getPriorityLabel(priority) {
      const labels = {
        low: '낮음',
        normal: '보통',
        high: '높음',
        urgent: '긴급',
      }
      return labels[priority] || '보통'
    },
  },
}
</script>

<style scoped>
/* 워크플로우 스텝바 */
.workflow-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  padding: 20px 0;
}

.step-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.step-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #e9ecef;
  border: 3px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #6c757d;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.step-item.active .step-circle {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
  box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.1);
}

.step-item.completed .step-circle {
  background-color: #198754;
  border-color: #198754;
  color: white;
}

.step-label {
  font-weight: 600;
  color: #6c757d;
  margin-top: 8px;
}

.step-item.active .step-label {
  color: #0d6efd;
}

.step-item.completed .step-label {
  color: #198754;
}

.step-line {
  position: absolute;
  top: 30px;
  left: 50%;
  width: 100%;
  height: 3px;
  background-color: #dee2e6;
  z-index: -1;
}

.step-item.completed .step-line {
  background-color: #198754;
}

/* 파일 업로드 영역 */
.file-upload-area {
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-upload-area:hover {
  background-color: #f8f9fa !important;
  border-color: #0d6efd !important;
}

/* 아코디언 커스텀 */
.accordion-button:not(.collapsed) {
  background-color: #e7f1ff;
  color: #0d6efd;
}

.accordion-button:focus {
  box-shadow: none;
  border-color: rgba(0, 0, 0, 0.125);
}

.accordion-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #e9ecef;
}

.accordion-button:disabled {
  pointer-events: none;
}

/* 반응형 */
@media (max-width: 768px) {
  .workflow-steps {
    flex-direction: column;
  }

  .step-line {
    display: none;
  }

  .step-item {
    margin-bottom: 20px;
  }
}
</style>
