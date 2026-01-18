<template>
  <div class="setup-release-result">
    <table class="table table-bordered form-table mb-0">
      <colgroup>
        <col style="width: 18%" />
        <col style="width: 82%" />
      </colgroup>
      <tbody>
        <tr>
          <th class="table-light align-top">내용</th>
          <td><textarea class="form-control" rows="2" v-model="formData.content"></textarea></td>
        </tr>
        <tr>
          <th class="table-light align-top">개요(설비)</th>
          <td><textarea class="form-control" rows="2" v-model="formData.summary"></textarea></td>
        </tr>
        <tr>
          <th class="table-light align-top">목적(배경)</th>
          <td><textarea class="form-control" rows="2" v-model="formData.purpose"></textarea></td>
        </tr>
        <tr>
          <th class="table-light align-top">세부일정</th>
          <td><textarea class="form-control" rows="2" v-model="formData.schedule"></textarea></td>
        </tr>
        <tr>
          <th class="table-light align-top">진행내용</th>
          <td><textarea class="form-control" rows="2" v-model="formData.progress"></textarea></td>
        </tr>
        <tr>
          <th class="table-light align-top">결과(Inspection)</th>
          <td>
            <textarea class="form-control" rows="2" v-model="formData.resultInspection"></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top">결과(Hardware)</th>
          <td>
            <textarea class="form-control" rows="2" v-model="formData.resultHardware"></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top">결과(Process)</th>
          <td>
            <textarea class="form-control" rows="2" v-model="formData.resultProcess"></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top">결론(완료)</th>
          <td><textarea class="form-control" rows="2" v-model="formData.conclusion"></textarea></td>
        </tr>
        <tr>
          <th class="table-light align-top">활용계획</th>
          <td><textarea class="form-control" rows="2" v-model="formData.plan"></textarea></td>
        </tr>
        <tr>
          <th class="table-light align-top">미진사항</th>
          <td><textarea class="form-control" rows="2" v-model="formData.issue"></textarea></td>
        </tr>
        <tr>
          <th class="table-light align-top">지연 사유</th>
          <td>
            <textarea class="form-control" rows="2" v-model="formData.delayReason"></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top">작업자/시간</th>
          <td>
            <div class="mb-2 text-end">
              <button class="btn btn-sm btn-primary me-1" @click="addWorkerRow">
                <i class="bi bi-plus-circle me-1"></i>추가
              </button>
            </div>
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th style="width: 50px" class="text-center">
                    <input
                      type="checkbox"
                      @change="toggleAllWorkerRows"
                      v-model="allWorkerSelected"
                    />
                  </th>
                  <th style="width: 25%" class="text-center">작업자</th>
                  <th style="width: 35%" class="text-center">소속부서</th>
                  <th class="text-center">작업시간(분)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in formData.workerRows" :key="idx">
                  <td class="text-center">
                    <input type="checkbox" v-model="row.selected" />
                  </td>
                  <td>
                    <div class="input-group input-group-sm">
                      <input
                        type="text"
                        class="form-control form-control-sm"
                        v-model="row.worker"
                        placeholder="작업자"
                        readonly
                      />
                      <button
                        class="btn btn-outline-secondary"
                        type="button"
                        @click="searchWorker(idx)"
                      >
                        <i class="bi bi-search"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      v-model="row.department"
                      placeholder="소속부서"
                    />
                  </td>
                  <td>
                    <div class="d-flex align-items-center">
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        v-model="row.workTime"
                        placeholder="작업시간(분)"
                      />
                      <button
                        class="btn btn-sm btn-link text-dark p-0 ms-2"
                        @click="deleteWorkerRow(idx)"
                      >
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="formData.workerRows.length === 0">
                  <td colspan="4" class="text-center text-muted">작업자를 추가하세요</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top">파일첨부</th>
          <td>
            <input type="file" class="form-control" @change="handleFileUpload" multiple />
            <small class="text-muted">관련 자료, 사진 등 (최대 10MB)</small>
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

  name: 'SetupReleaseResult',
  data() {
    return {
      allWorkerSelected: false,
      formData: {
        content: '',
        summary: '',
        purpose: '',
        schedule: '',
        progress: '',
        resultInspection: '',
        resultHardware: '',
        resultProcess: '',
        conclusion: '',
        plan: '',
        issue: '',
        delayReason: '',
        workerRows: [],
        files: [],
      },
    }
  },
  methods: {
    handleFileUpload(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.files.push(files[i].name)
      }
    },
    removeFile(idx) {
      this.formData.files.splice(idx, 1)
    },
    addWorkerRow() {
      this.formData.workerRows.push({ selected: false, worker: '', department: '', workTime: 0 })
    },
    deleteWorkerRow(idx) {
      this.formData.workerRows.splice(idx, 1)
    },
    toggleAllWorkerRows() {
      const checked = this.allWorkerSelected
      this.formData.workerRows.forEach((row) => (row.selected = checked))
    },
    searchWorker(idx) {
      // TODO: 작업자 검색 팝업 연동 (필요시 구현)
      alert('작업자 검색 팝업 연동 필요')
    },
    // 결과등록 관련 버튼 메서드
    saveDraft() {
      alert('임시저장되었습니다. (셋업해제)')
    },
    submitComplete() {
      alert('저장되었습니다. (셋업해제)')
      // 필요시 emit 등으로 부모에 완료 알림
    },
    modify() {
      alert('수정 요청되었습니다. (셋업해제)')
    },
    reject() {
      if (confirm('정말로 반려하시겠습니까?')) {
        alert('반려 처리되었습니다. (셋업해제)')
      }
    },
  },
}
</script>

<style scoped>
.setup-release-result {
  /* 필요한 스타일 추가 */
}
</style>
