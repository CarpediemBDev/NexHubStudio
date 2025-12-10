<template>
  <div class="equipment-support-result">
    <table class="table table-bordered form-table mb-0">
      <colgroup>
        <col style="width: 15%" />
        <col style="width: 85%" />
      </colgroup>
      <tbody>
        <tr>
          <th class="table-light align-middle">지원 내용</th>
          <td>
            <textarea
              class="form-control"
              rows="4"
              v-model="formData.supportContent"
              placeholder="지원한 내용을 상세히 입력하세요"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-middle">소요 시간</th>
          <td>
            <input
              type="text"
              class="form-control"
              v-model="formData.supportTime"
              placeholder="예: 2시간 30분"
            />
          </td>
        </tr>
        <tr>
          <th class="table-light align-middle">지원 인원</th>
          <td>
            <input
              type="number"
              class="form-control"
              v-model="formData.supportPersonnel"
              placeholder="예: 2"
            />
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">특이 사항</th>
          <td>
            <textarea
              class="form-control"
              rows="3"
              v-model="formData.supportNotes"
              placeholder="특이 사항이나 추가 메모를 입력하세요"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">첨부파일</th>
          <td>
            <input type="file" class="form-control" @change="handleFileUpload" multiple />
            <small class="text-muted">최대 10MB, 여러 파일 선택 가능</small>
            <ul class="list-group mt-2" v-if="formData.supportFiles.length > 0">
              <li
                v-for="(file, idx) in formData.supportFiles"
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
        <!-- 진행 내역 그리드 -->
        <tr>
          <th class="table-light align-top pt-3">진행 내역</th>
          <td>
            <div class="mb-2 text-end">
              <button class="btn btn-sm btn-primary me-1" @click="addProgressRow">
                <i class="bi bi-plus-circle me-1"></i>추가
              </button>
              <button class="btn btn-sm btn-danger" @click="deleteProgressRow">
                <i class="bi bi-trash me-1"></i>삭제
              </button>
            </div>
            <!-- JqxCustomeGrid는 실제 프로젝트에서 import 필요 -->
            <JqxCustomeGrid
              ref="progressGrid"
              :localdata="progressRows"
              :datafields="progressDatafields"
              :columns="progressColumns"
              selectionmode="checkbox"
              :height="300"
              theme="bootstrap"
            />
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">첨부파일 1</th>
          <td>
            <input type="file" class="form-control" @change="handleResultFileUpload1" multiple />
            <small class="text-muted">최대 10MB, 여러 파일 선택 가능</small>
            <ul class="list-group mt-2" v-if="resultFiles1.length > 0">
              <li
                v-for="(file, idx) in resultFiles1"
                :key="idx"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span><i class="bi bi-file-earmark me-2"></i>{{ file }}</span>
                <button class="btn btn-sm btn-outline-danger" @click="removeResultFile1(idx)">
                  <i class="bi bi-x"></i>
                </button>
              </li>
            </ul>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">첨부파일 2</th>
          <td>
            <input type="file" class="form-control" @change="handleResultFileUpload2" multiple />
            <small class="text-muted">최대 10MB, 여러 파일 선택 가능</small>
            <ul class="list-group mt-2" v-if="resultFiles2.length > 0">
              <li
                v-for="(file, idx) in resultFiles2"
                :key="idx"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span><i class="bi bi-file-earmark me-2"></i>{{ file }}</span>
                <button class="btn btn-sm btn-outline-danger" @click="removeResultFile2(idx)">
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
import JqxCustomeGrid from '@/components/JqxCustomeGrid.vue'
export default {
  data() {
    return {
      equipmentSupportData: {
        supportContent: '',
        supportTime: '',
        supportPersonnel: 1,
        supportNotes: '',
        supportFiles: [],
      },
    }
  },
  name: 'EquipmentSupportResult',
  components: {
    JqxCustomeGrid,
  },
  data() {
    return {
      formData: {
        supportContent: '',
        supportTime: '',
        supportPersonnel: 1,
        supportNotes: '',
        supportFiles: [],
      },
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
      resultFiles1: [],
      resultFiles2: [],
    }
  },
  methods: {
    handleFileUpload(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.supportFiles.push(files[i].name)
      }
    },
    removeFile(idx) {
      this.formData.supportFiles.splice(idx, 1)
    },
    addProgressRow() {
      this.progressRows.push({
        progressDate: '',
        progressContent: '',
        worker: '',
        status: '',
        remark: '',
      })
    },
    deleteProgressRow() {
      this.progressRows = this.progressRows.filter((row, idx) => !this.progressRows[idx].selected)
    },
    handleResultFileUpload1(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.resultFiles1.push(files[i].name)
      }
    },
    removeResultFile1(idx) {
      this.resultFiles1.splice(idx, 1)
    },
    handleResultFileUpload2(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.resultFiles2.push(files[i].name)
      }
    },
    removeResultFile2(idx) {
      this.resultFiles2.splice(idx, 1)
    },
    // 결과등록 관련 버튼 메서드
    saveDraft() {
      alert('임시저장되었습니다. (설비지원)')
    },
    submitComplete() {
      alert('저장되었습니다. (설비지원)')
      // 필요시 emit 등으로 부모에 완료 알림
    },
    modify() {
      alert('수정 요청되었습니다. (설비지원)')
    },
    reject() {
      if (confirm('정말로 반려하시겠습니까?')) {
        alert('반려 처리되었습니다. (설비지원)')
      }
    },
  },
}
</script>

<style scoped>
.equipment-support-result {
  /* 필요한 스타일 추가 */
}
</style>
