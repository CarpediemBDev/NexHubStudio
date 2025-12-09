<template>
  <div class="setup-release-result">
    <table class="table table-bordered form-table mb-0">
      <colgroup>
        <col style="width: 15%" />
        <col style="width: 85%" />
      </colgroup>
      <tbody>
        <tr>
          <th class="table-light align-middle">작업 구분</th>
          <td>
            <div class="form-check form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                id="setupTypeSetup"
                value="setup"
                v-model="formData.setupType"
              />
              <label class="form-check-label" for="setupTypeSetup">셋업</label>
            </div>
            <div class="form-check form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                id="setupTypeRelease"
                value="release"
                v-model="formData.setupType"
              />
              <label class="form-check-label" for="setupTypeRelease">해제</label>
            </div>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">작업 내용</th>
          <td>
            <textarea
              class="form-control"
              rows="4"
              v-model="formData.setupContent"
              placeholder="셋업/해제한 작업 내용을 상세히 입력하세요"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-middle">작업 시간</th>
          <td>
            <input
              type="text"
              class="form-control"
              v-model="formData.setupTime"
              placeholder="예: 1시간 30분"
            />
          </td>
        </tr>
        <tr>
          <th class="table-light align-middle">작업 인원</th>
          <td>
            <input
              type="number"
              class="form-control"
              v-model="formData.setupPersonnel"
              placeholder="예: 3"
            />
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">사용 장비/도구</th>
          <td>
            <textarea
              class="form-control"
              rows="2"
              v-model="formData.equipmentUsed"
              placeholder="작업에 사용한 장비나 도구를 입력하세요"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">안전 조치 사항</th>
          <td>
            <textarea
              class="form-control"
              rows="3"
              v-model="formData.safetyMeasures"
              placeholder="작업 중 취한 안전 조치를 입력하세요"
            ></textarea>
          </td>
        </tr>
        <tr>
          <th class="table-light align-top pt-3">첨부파일</th>
          <td>
            <input type="file" class="form-control" @change="handleFileUpload" multiple />
            <small class="text-muted">작업 전/후 사진, 체크리스트 등 (최대 10MB)</small>
            <ul class="list-group mt-2" v-if="formData.setupFiles.length > 0">
              <li
                v-for="(file, idx) in formData.setupFiles"
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
  </div>
</template>

<script>
export default {
  name: 'SetupReleaseResult',
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        setupType: 'setup',
        setupContent: '',
        setupTime: '',
        setupPersonnel: 1,
        equipmentUsed: '',
        safetyMeasures: '',
        setupFiles: [],
      }),
    },
  },
  emits: ['update:modelValue'],
  computed: {
    formData: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      },
    },
  },
  methods: {
    handleFileUpload(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.setupFiles.push(files[i].name)
      }
    },
    removeFile(idx) {
      this.formData.setupFiles.splice(idx, 1)
    },
  },
}
</script>

<style scoped>
.setup-release-result {
  /* 필요한 스타일 추가 */
}
</style>
