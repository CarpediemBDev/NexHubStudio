<template>
  <div class="modification-improvement-result">
    <table class="table table-bordered form-table mb-0">
      <colgroup>
        <col style="width: 15%" />
        <col style="width: 85%" />
      </colgroup>
      <tbody>
        <tr>
          <th class="table-light align-top pt-3">개조/개선 내용</th>
          <td>
            <textarea
              class="form-control"
              rows="5"
              v-model="formData.modificationContent"
              placeholder="개조 또는 개선한 내용을 상세히 입력하세요"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">개선 목적</th>
          <td>
            <textarea
              class="form-control"
              rows="3"
              v-model="formData.improvementPurpose"
              placeholder="개선을 하게 된 배경이나 목적을 입력하세요"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">개선 효과</th>
          <td>
            <textarea
              class="form-control"
              rows="4"
              v-model="formData.improvementEffect"
              placeholder="개선으로 인한 효과를 구체적으로 입력하세요 (예: 생산성 20% 향상, 불량률 5% 감소 등)"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-middle">투입 비용</th>
          <td>
            <input
              type="text"
              class="form-control"
              v-model="formData.modificationCost"
              placeholder="예: 1,500,000원"
            />
          </td>
        </tr>
        <tr>
          <th class="table-light align-middle">작업 기간</th>
          <td>
            <div class="row">
              <div class="col-md-6">
                <label class="form-label">시작일</label>
                <input type="date" class="form-control" v-model="formData.workStartDate" />
              </div>
              <div class="col-md-6">
                <label class="form-label">완료일</label>
                <input type="date" class="form-control" v-model="formData.workEndDate" />
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <th class="table-light align-middle">참여 인원</th>
          <td>
            <input
              type="text"
              class="form-control"
              v-model="formData.participants"
              placeholder="예: 홍길동, 김철수, 이영희"
            />
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">기술 문서</th>
          <td>
            <textarea
              class="form-control"
              rows="3"
              v-model="formData.technicalDocs"
              placeholder="개조/개선 관련 기술 문서나 참고 자료를 입력하세요"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">첨부파일</th>
          <td>
            <input type="file" class="form-control" @change="handleFileUpload" multiple />
            <small class="text-muted">작업 전/후 비교 사진, 도면, 보고서 등 (최대 10MB)</small>
            <ul class="list-group mt-2" v-if="formData.modificationFiles.length > 0">
              <li
                v-for="(file, idx) in formData.modificationFiles"
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
    <!-- 결과등록 버튼 영역 (폼 하단) -->
    <div class="p-3 bg-light d-flex justify-content-between">
      <div>
        <button class="btn btn-outline-secondary me-2" @click="modify">
          <i class="bi bi-pencil me-1"></i>수정
        </button>
        <button class="btn btn-outline-secondary" @click="reject">
          <i class="bi bi-x-circle me-1"></i>반려
        </button>
      </div>
      <div>
        <button class="btn btn-outline-secondary me-2" @click="saveDraft">
          <i class="bi bi-save me-1"></i>임시저장
        </button>
        <button class="btn btn-success" @click="submitComplete">
          <i class="bi bi-check-circle me-1"></i>저장
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {

  name: 'ModificationImprovementResult',
  data() {
    return {
      formData: {
        modificationContent: '',
        improvementPurpose: '',
        improvementEffect: '',
        modificationCost: '',
        workStartDate: '',
        workEndDate: '',
        participants: '',
        technicalDocs: '',
        modificationFiles: [],
      },
    }
  },
  methods: {
    // 결과등록 관련 버튼 메서드
    saveDraft() {
      alert('임시저장되었습니다. (개선/개조)')
    },
    submitComplete() {
      alert('저장되었습니다. (개선/개조)')
      // 필요시 emit 등으로 부모에 완료 알림
    },
    modify() {
      alert('수정 요청되었습니다. (개선/개조)')
    },
    reject() {
      if (confirm('정말로 반려하시겠습니까?')) {
        alert('반려 처리되었습니다. (개선/개조)')
      }
    },
    handleFileUpload(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.modificationFiles.push(files[i].name)
      }
    },
    removeFile(idx) {
      this.formData.modificationFiles.splice(idx, 1)
    },
  },
}
</script>

<style scoped>
.modification-improvement-result {
  /* 필요한 스타일 추가 */
}
</style>
