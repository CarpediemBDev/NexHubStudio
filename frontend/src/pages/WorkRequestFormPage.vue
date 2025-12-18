<template>
  <div class="container mt-4">
    <h2 class="mb-4">업무 의뢰서</h2>

    <!-- 워크플로우 스텝바 -->
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

    <!-- 아코디언 폼 영역 -->
    <div class="accordion" id="requestFormAccordion">
      <!-- 1단계: 의뢰 -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ collapsed: !sections.request, disabled: !canAccessSection('request') }"
            :disabled="!canAccessSection('request')"
            type="button"
            @click="canAccessSection('request') && toggleSection('request')"
          >
            <i class="bi bi-file-text me-2"></i>지원 의뢰
            <span class="badge bg-primary ms-2">1단계</span>
          </button>
        </h2>
        <div class="accordion-collapse collapse" :class="{ show: sections.request }">
          <div class="accordion-body p-0">
            <table class="table table-bordered form-table mb-0">
              <colgroup>
                <col style="width: 15%" />
                <col style="width: 35%" />
                <col style="width: 15%" />
                <col style="width: 35%" />
              </colgroup>
              <tbody>
                <!-- 1행: 제목 -->
                <tr>
                  <th class="table-light align-middle">제목 <span class="text-danger">*</span></th>
                  <td colspan="3">
                    <input
                      type="text"
                      class="form-control"
                      v-model="formData.title"
                      placeholder="제목을 입력하세요"
                    />
                  </td>
                </tr>
                <!-- 2행: 요청번호, 과제 -->
                <tr>
                  <th class="table-light align-middle">요청번호</th>
                  <td>
                    <input type="text" class="form-control" v-model="formData.requestNo" readonly />
                  </td>
                  <th class="table-light align-middle">과제</th>
                  <td>
                    <input
                      type="text"
                      class="form-control"
                      v-model="formData.project"
                      placeholder="과제명"
                    />
                  </td>
                </tr>
                <!-- 3행: 요청자, 완료요청일 -->
                <tr>
                  <th class="table-light align-middle">
                    요청자 <span class="text-danger">*</span>
                  </th>
                  <td>
                    <input
                      type="text"
                      class="form-control"
                      v-model="formData.requester"
                      placeholder="요청자명"
                    />
                  </td>
                  <th class="table-light align-middle">완료요청일</th>
                  <td>
                    <input type="date" class="form-control" v-model="formData.dueDate" />
                  </td>
                </tr>
                <!-- 4행: 디바이스명, 위치 -->
                <tr>
                  <th class="table-light align-middle">디바이스명</th>
                  <td>
                    <input
                      type="text"
                      class="form-control"
                      v-model="formData.deviceName"
                      placeholder="디바이스명"
                    />
                  </td>
                  <th class="table-light align-middle">위치</th>
                  <td>
                    <input
                      type="text"
                      class="form-control"
                      v-model="formData.location"
                      placeholder="위치"
                    />
                  </td>
                </tr>
                <!-- 5행: 내용 -->
                <tr>
                  <th class="table-light align-top pt-3">
                    내용 <span class="text-danger">*</span>
                  </th>
                  <td colspan="3">
                    <textarea
                      class="form-control"
                      rows="8"
                      v-model="formData.content"
                      placeholder="내용을 상세히 입력하세요"
                    ></textarea>
                  </td>
                </tr>
                <!-- 6행: 파일첨부 -->
                <tr>
                  <th class="table-light align-top pt-3">파일첨부</th>
                  <td colspan="3">
                    <div
                      v-if="uploadProgress === 0"
                      class="file-upload-box border rounded p-3 text-center bg-light"
                    >
                      <i class="bi bi-cloud-upload fs-3 text-muted"></i>
                      <p class="mb-2 mt-2 text-muted">클릭하거나 파일을 드래그하세요</p>
                      <input type="file" class="form-control" @change="handleFileUpload" multiple />
                      <small class="text-muted">최대 10MB, 여러 파일 선택 가능</small>
                    </div>
                    <div
                      v-else-if="uploadProgress > 0 && uploadProgress < 100"
                      class="border rounded p-3 text-center bg-light"
                    >
                      <i class="bi bi-cloud-upload fs-3 text-success mb-2"></i>
                      <div class="progress" style="height: 25px">
                        <div
                          class="progress-bar progress-bar-striped progress-bar-animated bg-success"
                          :style="{ width: uploadProgress + '%' }"
                        >
                          {{ uploadProgress }}%
                        </div>
                      </div>
                      <small class="text-muted mt-2 d-block">파일을 업로드하고 있습니다...</small>
                    </div>
                    <ul class="list-group mt-2" v-if="formData.files.length > 0">
                      <li
                        v-for="(file, idx) in formData.files"
                        :key="idx"
                        class="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <span><i class="bi bi-file-earmark me-2"></i>{{ file }}</span>
                        <button class="btn btn-sm btn-outline-danger" @click="removeFile(idx)">
                          <i class="bi bi-x"></i>
                        </button>
                      </li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="p-3 text-end bg-light">
              <button class="btn btn-primary" @click="submitRequest">
                <i class="bi bi-send me-1"></i>의뢰 제출
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2단계: 접수 -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ collapsed: !sections.receive, disabled: !canAccessSection('receive') }"
            :disabled="!canAccessSection('receive')"
            type="button"
            @click="canAccessSection('receive') && toggleSection('receive')"
          >
            <i class="bi bi-clipboard-check me-2"></i>지원 접수
            <span class="badge bg-success ms-2">2단계</span>
          </button>
        </h2>
        <div class="accordion-collapse collapse" :class="{ show: sections.receive }">
          <div class="accordion-body p-0">
            <div class="alert alert-info m-3">
              <h6 class="alert-heading"><i class="bi bi-info-circle me-2"></i>접수된 의뢰 정보</h6>
              <p class="mb-1"><strong>제목:</strong> {{ formData.title || '(제목)' }}</p>
              <p class="mb-0"><strong>요청자:</strong> {{ formData.requester || '(요청자)' }}</p>
            </div>
            <table class="table table-bordered form-table mb-0">
              <colgroup>
                <col style="width: 15%" />
                <col style="width: 35%" />
                <col style="width: 15%" />
                <col style="width: 35%" />
              </colgroup>
              <tbody>
                <tr>
                  <th class="table-light align-middle">
                    지원 유형 <span class="text-danger">*</span>
                  </th>
                  <td>
                    <select class="form-select" v-model="formData.supportType" style="width: 250px">
                      <option value="">선택하세요</option>
                      <option value="equipment-support">설비지원</option>
                      <option value="failure-repair">고장수리</option>
                      <option value="setup-release">설비셋업해제</option>
                      <option value="modification-improvement">설비개조개선</option>
                    </select>
                  </td>
                  <th class="table-light align-middle">
                    승인 여부 <span class="text-danger">*</span>
                  </th>
                  <td>
                    <div class="d-flex align-items-center gap-3">
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="radio"
                          v-model="formData.approvalStatus"
                          value="approved"
                          id="approval-approved"
                        />
                        <label class="form-check-label" for="approval-approved">승인</label>
                      </div>
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="radio"
                          v-model="formData.approvalStatus"
                          value="rejected"
                          id="approval-rejected"
                        />
                        <label class="form-check-label" for="approval-rejected">반려</label>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th class="table-light align-middle">완료 예정일</th>
                  <td>
                    <input
                      type="datetime-local"
                      class="form-control"
                      v-model="formData.expectedCompletionDate"
                    />
                  </td>
                  <th class="table-light align-middle">처리 방식</th>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <select
                        class="form-select"
                        v-model="formData.processingMethod"
                        style="width: 120px"
                      >
                        <option value="">선택</option>
                        <option value="internal">내부</option>
                        <option value="outsourcing">외주</option>
                      </select>
                      <input
                        type="text"
                        class="form-control"
                        v-model="formData.outsourcingCompany"
                        placeholder="외주 업체명"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th class="table-light align-middle">
                    접수 담당자 <span class="text-danger">*</span>
                  </th>
                  <td colspan="3">
                    <input
                      type="text"
                      class="form-control"
                      v-model="formData.assignee"
                      placeholder="담당자명 (여러 명인 경우 쉼표로 구분)"
                    />
                  </td>
                </tr>
                <tr>
                  <th class="table-light align-middle">처리 유형</th>
                  <td colspan="3">
                    <div class="d-flex align-items-center gap-3">
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="radio"
                          v-model="formData.processingType"
                          value="immediate"
                          id="processing-immediate"
                        />
                        <label class="form-check-label" for="processing-immediate">즉시 처리</label>
                      </div>
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="radio"
                          v-model="formData.processingType"
                          value="scheduled"
                          id="processing-scheduled"
                        />
                        <label class="form-check-label" for="processing-scheduled">예약 처리</label>
                      </div>
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="radio"
                          v-model="formData.processingType"
                          value="pending"
                          id="processing-pending"
                        />
                        <label class="form-check-label" for="processing-pending">보류</label>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th class="table-light align-middle">레시피</th>
                  <td colspan="3">
                    <div class="input-group" style="max-width: 500px">
                      <input
                        type="text"
                        class="form-control"
                        v-model="formData.recipe"
                        placeholder="레시피명"
                        readonly
                      />
                      <button class="btn btn-outline-secondary" @click="openRecipePopup">
                        <i class="bi bi-search"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th class="table-light align-middle">협의자</th>
                  <td colspan="3">
                    <div class="input-group" style="max-width: 500px">
                      <input
                        type="text"
                        class="form-control"
                        v-model="formData.consultants"
                        placeholder="협의자명"
                        readonly
                      />
                      <button class="btn btn-outline-secondary" @click="openConsultantPopup">
                        <i class="bi bi-search"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th class="table-light align-top pt-3">접수 의견</th>
                  <td colspan="3">
                    <textarea
                      class="form-control"
                      rows="4"
                      v-model="formData.receiveComment"
                      placeholder="접수 확인 내용 및 예상 처리 기간 등을 입력하세요"
                    ></textarea>
                  </td>
                </tr>
                <tr>
                  <th class="table-light align-top pt-3">첨부파일</th>
                  <td colspan="3">
                    <input
                      type="file"
                      class="form-control"
                      @change="handleReceiveFileUpload"
                      multiple
                    />
                    <small class="text-muted">최대 10MB, 여러 파일 선택 가능</small>
                    <ul class="list-group mt-2" v-if="formData.receiveFiles.length > 0">
                      <li
                        v-for="(file, idx) in formData.receiveFiles"
                        :key="idx"
                        class="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <span><i class="bi bi-file-earmark me-2"></i>{{ file }}</span>
                        <button
                          class="btn btn-sm btn-outline-danger"
                          @click="removeReceiveFile(idx)"
                        >
                          <i class="bi bi-x"></i>
                        </button>
                      </li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="p-3 text-end bg-light">
              <button class="btn btn-outline-secondary me-2" @click="saveDraftReceive">
                <i class="bi bi-save me-1"></i>임시저장
              </button>
              <button class="btn btn-success" @click="submitReceive">
                <i class="bi bi-check-circle me-1"></i>저장
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3단계: 진행 -->
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button
            class="accordion-button"
            :class="{ collapsed: !sections.progress, disabled: !canAccessSection('progress') }"
            :disabled="!canAccessSection('progress')"
            type="button"
            @click="canAccessSection('progress') && toggleSection('progress')"
          >
            <i class="bi bi-pencil-square me-2"></i>결과 등록
            <span class="badge bg-warning ms-2">3단계</span>
          </button>
        </h2>
        <div class="accordion-collapse collapse" :class="{ show: sections.progress }">
          <div class="accordion-body p-0">
            <table class="table table-bordered form-table mb-0">
              <colgroup>
                <col style="width: 15%" />
                <col style="width: 85%" />
              </colgroup>
              <tbody>
                <!-- 지원 유형별 결과 등록 컴포넌트 -->
                <tr>
                  <td colspan="2" class="p-0">
                    <!-- 설비지원 -->
                    <EquipmentSupportResult v-if="formData.supportType === 'equipment-support'" />

                    <!-- 고장수리 -->
                    <FailureRepairResult v-else-if="formData.supportType === 'failure-repair'" />

                    <!-- 설비셋업해제 -->
                    <SetupReleaseResult
                      v-else-if="
                        formData.supportType === 'setup-release' ||
                        formData.supportType === 'setup-setup'
                      "
                    />

                    <!-- 설비개조개선 -->
                    <ModificationImprovementResult
                      v-else-if="formData.supportType === 'modification-improvement'"
                    />

                    <!-- 지원 유형 미선택 -->
                    <div v-else class="p-4 text-center text-muted">
                      <i class="bi bi-info-circle me-2"></i>
                      먼저 1단계에서 지원 유형을 선택해주세요.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="p-3 bg-light d-flex justify-content-between"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 버튼 영역 -->
    <div class="text-center mt-4 mb-4">
      <button class="btn btn-secondary" @click="goToList">
        <i class="bi bi-list me-1"></i>목록
      </button>
    </div>
  </div>
</template>

<script>
import JqxCustomeGrid from '@/components/JqxCustomeGrid.vue'
import { openUserPopup } from '@/utils/showPop.js'
import EquipmentSupportResult from '@/components/EquipmentSupportResult.vue'
import FailureRepairResult from '@/components/FailureRepairResult.vue'
import SetupReleaseResult from '@/components/SetupReleaseResult.vue'
import ModificationImprovementResult from '@/components/ModificationImprovementResult.vue'

export default {
  name: 'WorkRequestFormPage',
  components: {
    JqxCustomeGrid,
    EquipmentSupportResult,
    FailureRepairResult,
    SetupReleaseResult,
    ModificationImprovementResult,
  },
  data() {
    return {
      currentStep: 'request', // request, receive, progress, complete
      currentUser: 'hong',
      steps: [
        { key: 'request', label: '의뢰', icon: 'bi bi-file-text' },
        { key: 'receive', label: '접수', icon: 'bi bi-clipboard-check' },
        { key: 'progress', label: '진행', icon: 'bi bi-arrow-repeat' },
        { key: 'complete', label: '완료', icon: 'bi bi-check-circle' },
      ],
      sections: {
        request: false,
        receive: false,
        progress: false,
      },
      uploadProgress: 0,
      progressRows: [],
      progressDatafields: [
        { name: 'progressDate', type: 'string' },
        { name: 'progressContent', type: 'string' },
        { name: 'worker', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'remark', type: 'string' },
      ],
      progressColumns: [
        { text: '진행일자', datafield: 'progressDate', width: 120, editable: true },
        { text: '진행내용', datafield: 'progressContent', width: 250, editable: true },
        { text: '작업자', datafield: 'worker', width: 100, editable: true },
        { text: '상태', datafield: 'status', width: 100, editable: true },
        { text: '비고', datafield: 'remark', width: 200, editable: true },
      ],
      formData: {
        requestNo: 'REQ-2024-0001',
        title: '',
        project: '',
        requester: '',
        dueDate: '',
        deviceName: '',
        location: '',
        content: '',
        files: [],
        supportType: '',
        approvalStatus: '',
        expectedCompletionDate: '',
        processingMethod: '',
        assignee: '',
        outsourcingCompany: '',
        processingType: '',
        expectedDate: '',
        receiveComment: '',
        receiveFiles: [],
        progressPercentage: 0,
        progressDescription: '',
        issues: '',
        resultStatus: '',
        completedAt: '',
        resultDescription: '',
        resultFiles: [],
        resultFiles1: [],
        resultFiles2: [],
        rating: 0,
        consultants: '',
        recipe: '',
      },
    }
  },
  computed: {
    isEditable() {
      if (!this.formData.assignee) return false
      return this.formData.assignee
        .split(',')
        .map((s) => s.trim())
        .includes(this.currentUser)
    },
  },
  watch: {
    currentStep: {
      immediate: true,
      handler(newStep) {
        // currentStep 변경 시 해당 섯션 자동으로 열기
        this.sections.request = false
        this.sections.receive = false
        this.sections.progress = false

        if (newStep === 'request') {
          this.sections.request = true
        } else if (newStep === 'receive') {
          this.sections.receive = true
        } else if (newStep === 'progress' || newStep === 'complete') {
          this.sections.progress = true
        }
      },
    },
  },
  mounted() {
    // 페이지 로드 시 DB에서 데이터 조회
    this.loadWorkRequestData()
  },
  methods: {
    async loadWorkRequestData() {
      // TODO: 실제로는 API 호출로 DB에서 데이터 조회
      // const requestId = this.$route.params.id
      // const response = await fetch(`/api/work-requests/${requestId}`)
      // const data = await response.json()

      // 임시 데이터 (실제로는 DB에서 조회)
      const mockData = {
        requestNo: 'REQ-2024-0001',
        title: '생산라인 A 설비 고장',
        supportType: 'failure-repair', // equipment-support, failure-repair, setup-release, modification-improvement
        // ... 기본 formData

        // 지원 유형별 결과 데이터 (DB에 JSON으로 저장되어 있음)
        resultData: {
          vendorManager: '김철수',
          purchaseCost: '500,000원',
          project: 'PJ-2024-001',
          failureStatus: '생산라인 A 모터 베어링 마모로 인한 이상 소음 및 진동 발생',
          selectedCauses: ['마모', '노후'],
          causeRows: [
            { selected: false, detail: '모터 베어링 장기간 사용으로 인한 마모' },
            { selected: false, detail: '정기 점검 미실시' },
          ],
          repairAction: '베어링 교체 및 윤활유 보충, 정렬 조정',
          selectedMeasures: ['개조개선', '횡전개'],
          measureDetails: {
            개조개선: '진동 센서 설치 및 모니터링 시스템 구축',
            횡전개: '동일 모델 모터 20대 점검 실시',
            'OPLS/SOP': '',
            기타: '',
          },
          partRows: [
            {
              selected: false,
              name: '모터 베어링',
              spec: 'SKF-6205',
              quantity: 2,
              note: '교체완료',
            },
            {
              selected: false,
              name: '윤활유',
              spec: 'Shell Omala S2 G 220',
              quantity: 1,
              note: '보충',
            },
          ],
          delayReason: '',
          workerRows: [
            { selected: false, worker: '홍길동', department: '설비팀', workTime: 120 },
            { selected: false, worker: '이영희', department: '설비팀', workTime: 90 },
          ],
          repairFiles: ['repair_before.jpg', 'repair_after.jpg'],
        },
      }

      // 기본 formData 설정
      this.formData.requestNo = mockData.requestNo
      this.formData.title = mockData.title
      this.formData.supportType = mockData.supportType
      // this.currentStep = mockData.currentStep // currentStep은 mockData를 따르지 않고 기존 값 사용

      // 결과등록 데이터는 자식에서 관리하므로 별도 세팅하지 않음
    },

    toggleSection(section) {
      this.sections[section] = !this.sections[section]
    },
    canAccessSection(sectionKey) {
      // 아코디언은 3개만 있음 (request, receive, progress)
      const sectionOrder = ['request', 'receive', 'progress']
      const stepOrder = ['request', 'receive', 'progress', 'complete']

      const currentIndex = stepOrder.indexOf(this.currentStep)
      const sectionIndex = sectionOrder.indexOf(sectionKey)

      // 현재 단계 이하만 접근 가능
      return sectionIndex !== -1 && sectionIndex <= currentIndex
    },
    isStepCompleted(stepKey) {
      const stepOrder = ['request', 'receive', 'progress', 'complete']
      const currentIndex = stepOrder.indexOf(this.currentStep)
      const stepIndex = stepOrder.indexOf(stepKey)
      return stepIndex < currentIndex
    },
    handleFileUpload(event) {
      const files = event.target.files
      if (files.length > 0) {
        this.uploadProgress = 1
        const interval = setInterval(() => {
          this.uploadProgress += 5
          if (this.uploadProgress >= 100) {
            clearInterval(interval)
            for (let i = 0; i < files.length; i++) {
              this.formData.files.push(files[i].name)
            }
            setTimeout(() => {
              this.uploadProgress = 0
            }, 500)
          }
        }, 400)
      }
    },
    removeFile(index) {
      this.formData.files.splice(index, 1)
    },
    handleReceiveFileUpload(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.receiveFiles.push(files[i].name)
      }
    },
    removeReceiveFile(index) {
      this.formData.receiveFiles.splice(index, 1)
    },
    handleResultFileUpload(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.resultFiles.push(files[i].name)
      }
    },
    removeResultFile(index) {
      this.formData.resultFiles.splice(index, 1)
    },
    handleResultFileUpload1(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.resultFiles1.push(files[i].name)
      }
    },
    removeResultFile1(index) {
      this.formData.resultFiles1.splice(index, 1)
    },
    handleResultFileUpload2(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.resultFiles2.push(files[i].name)
      }
    },
    removeResultFile2(index) {
      this.formData.resultFiles2.splice(index, 1)
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
    submitRequest() {
      // 1단계 의뢰 제출
      const requestData = {
        requestNo: this.formData.requestNo,
        title: this.formData.title,
        project: this.formData.project,
        requester: this.formData.requester,
        dueDate: this.formData.dueDate,
        deviceName: this.formData.deviceName,
        location: this.formData.location,
        content: this.formData.content,
        files: this.formData.files,
      }
      console.log('의뢰 제출 데이터:', requestData)
      alert('의뢰가 제출되었습니다.')
      this.currentStep = 'receive'
      this.sections.request = false
      this.sections.receive = true
    },
    submitReceive() {
      // 2단계 접수 완료
      const receiveData = {
        supportType: this.formData.supportType,
        approvalStatus: this.formData.approvalStatus,
        expectedCompletionDate: this.formData.expectedCompletionDate,
        processingMethod: this.formData.processingMethod,
        outsourcingCompany: this.formData.outsourcingCompany,
        assignee: this.formData.assignee,
        processingType: this.formData.processingType,
        receiveComment: this.formData.receiveComment,
        receiveFiles: this.formData.receiveFiles,
      }
      console.log('접수 완료 데이터:', receiveData)
      alert('접수가 완료되었습니다.')
      this.currentStep = 'progress'
      this.sections.receive = false
      this.sections.progress = true
    },
    updateProgress() {
      // 3단계 진행 상황 업데이트
      alert('진행 상황이 업데이트되었습니다.')
    },
    submitComplete() {
      // 3단계 결과 등록 완료 → 4단계(완료)로 이동
      // 결과등록 데이터는 자식에서 관리하므로 별도 수집하지 않음
    },
    goToList() {
      this.$router.push('/request-workflow')
    },
    saveDraftReceive() {
      const draftData = {
        supportType: this.formData.supportType,
        approvalStatus: this.formData.approvalStatus,
        expectedCompletionDate: this.formData.expectedCompletionDate,
        processingMethod: this.formData.processingMethod,
        outsourcingCompany: this.formData.outsourcingCompany,
        assignee: this.formData.assignee,
        processingType: this.formData.processingType,
        receiveComment: this.formData.receiveComment,
        receiveFiles: this.formData.receiveFiles,
      }
      console.log('접수 임시저장 데이터:', draftData)
      alert('임시저장되었습니다.')
    },

    addProgressRow() {
      this.$refs.progressGrid?.add({
        progressDate: '',
        progressContent: '',
        worker: '',
        status: '',
        remark: '',
      })
    },
    deleteProgressRow() {
      this.$refs.progressGrid?.deleteSelected()
    },
    async openConsultantPopup() {
      const selectedList = await openUserPopup()
      if (Array.isArray(selectedList) && selectedList.length > 0) {
        this.formData.consultants = selectedList.map((u) => u.name).join(', ')
      }
    },
    openRecipePopup() {
      // 레시피 팝업 로직 추가 예정
      alert('레시피 검색 팝업 (구현 예정)')
    },
  },
}
</script>

<style scoped>
.form-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.form-table td,
.form-table th {
  padding: 12px;
  vertical-align: middle;
}

.file-upload-box input[type='file'] {
  margin-top: 10px;
}

.workflow-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
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
  position: relative;
  z-index: 2;
  background-color: white;
}

/* 활성 스텝: 깜빡이는 그림자 효과 */
.step-item.active .step-circle {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
  box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.2);
  animation: pulseShadow 2s ease-in-out infinite;
}

/* 활성 스텝 아이콘: 둥둥 떠있는 효과 */
.step-item.active .step-circle i {
  animation: floatingIcon 2s ease-in-out infinite;
}

/* 완료된 스텝: 눌러진 느낌 (축소 + 안쪽 그림자 + 아래로 이동) */
.step-item.completed .step-circle {
  background-color: #198754;
  border-color: #198754;
  color: white;
  transform: scale(0.92) translateY(2px);
  box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.2);
}

/* 깜빡이는 그림자 애니메이션 */
@keyframes pulseShadow {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(13, 110, 253, 0.1);
  }
}

/* 둥둥 떠있는 아이콘 애니메이션 */
@keyframes floatingIcon {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.step-label {
  margin-top: 10px;
  font-weight: 600;
  color: #6c757d;
  font-size: 14px;
}

.step-item.active .step-label {
  color: #0d6efd;
  font-size: 15px;
}

.step-item.completed .step-label {
  color: #198754;
}

.step-line {
  position: absolute;
  top: 30px;
  left: 50%;
  width: 100%;
  height: 4px;
  background-color: #dee2e6;
  z-index: 0;
  overflow: hidden;
}

/* 완료된 스텝의 연결선 - 흐르는 그라데이션 */
.step-item.completed .step-line {
  background: linear-gradient(90deg, #198754 0%, #20c997 50%, #198754 100%);
  background-size: 200% 100%;
  animation: flowGradient 3s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(25, 135, 84, 0.4);
}

@keyframes flowGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.step-item:last-child .step-line {
  display: none;
}

.accordion-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
