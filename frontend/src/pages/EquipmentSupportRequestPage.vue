<template>
  <div class="container mt-4">
    <h2 class="mb-4">설비지원요청</h2>
    <form @submit.prevent="submitForm">
      <table class="table table-bordered form-table mb-0">
        <colgroup>
          <col style="width: 15%" />
          <col style="width: 85%" />
        </colgroup>
        <tbody>
          <!-- 1행: 제목 -->
          <tr>
            <th class="table-light align-top pt-3">제목 <span class="text-danger">*</span></th>
            <td>
              <textarea
                class="form-control"
                rows="2"
                v-model="formData.title"
                placeholder="제목을 입력하세요"
              ></textarea>
            </td>
          </tr>
          <!-- 2행: 설비, Area -->
          <tr>
            <th class="table-light align-middle">설비 <span class="text-danger">*</span></th>
            <td>
              <div class="d-flex align-items-center gap-2">
                <input
                  type="text"
                  class="form-control"
                  v-model="formData.equipment"
                  placeholder="설비명"
                  style="max-width: 300px"
                />
                <button type="button" class="btn btn-outline-secondary" @click="searchEquipment">
                  <i class="bi bi-search"></i> 검색
                </button>
                <span class="ms-3">Area:</span>
                <input
                  type="text"
                  class="form-control"
                  v-model="formData.area"
                  placeholder="Area"
                  style="max-width: 200px"
                />
              </div>
            </td>
          </tr>
          <!-- 3행: 설비담당자 -->
          <tr>
            <th class="table-light align-middle">설비담당자 <span class="text-danger">*</span></th>
            <td>
              <input
                type="text"
                class="form-control"
                v-model="formData.manager"
                placeholder="담당자명"
              />
            </td>
          </tr>
          <!-- 4행: 완료요청일 -->
          <tr>
            <th class="table-light align-middle">완료요청일</th>
            <td>
              <input type="date" class="form-control" v-model="formData.dueDate" />
            </td>
          </tr>
          <!-- 5행: 내용 -->
          <tr>
            <th class="table-light align-top pt-3">내용 <span class="text-danger">*</span></th>
            <td>
              <textarea
                class="form-control"
                rows="5"
                v-model="formData.content"
                placeholder="내용을 상세히 입력하세요"
              ></textarea>
            </td>
          </tr>
          <!-- 6행: 파일첨부 -->
          <tr>
            <th class="table-light align-top pt-3">파일첨부</th>
            <td>
              <input type="file" class="form-control" @change="handleFileUpload" multiple />
              <small class="text-muted">최대 10MB, 여러 파일 선택 가능</small>
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
        <button class="btn btn-success" type="submit">
          <i class="bi bi-check-circle me-1"></i>저장
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'EquipmentSupportRequestPage',
  data() {
    return {
      formData: {
        title: '',
        equipment: '',
        area: '',
        manager: '',
        dueDate: '',
        content: '',
        files: [],
      },
    }
  },
  methods: {
    searchEquipment() {
      // 설비 검색 팝업 또는 로직 구현 예정
      alert('설비 검색 팝업 (구현 예정)')
    },
    handleFileUpload(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.files.push(files[i].name)
      }
    },
    removeFile(index) {
      this.formData.files.splice(index, 1)
    },
    submitForm() {
      // 폼 제출 로직 구현 예정
      alert('설비지원요청이 제출되었습니다.')
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
</style>
