<template>
  <div class="failure-repair-result">
    <table class="table table-bordered form-table mb-0">
      <colgroup>
        <col style="width: 15%" />
        <col style="width: 35%" />
        <col style="width: 15%" />
        <col style="width: 35%" />
      </colgroup>
      <tbody>
        <!-- 1. 업체담당자 / 구매비용 -->
        <tr>
          <th class="table-light align-middle text-center">업체담당자</th>
          <td>
            <input
              type="text"
              class="form-control"
              v-model="formData.vendorManager"
              placeholder="업체 담당자명을 입력하세요"
            />
          </td>
          <th class="table-light align-middle text-center">구매비용</th>
          <td>
            <input
              type="text"
              class="form-control"
              v-model="formData.purchaseCost"
              placeholder="예: 500,000원"
            />
          </td>
        </tr>

        <!-- 2. 과제 -->
        <tr>
          <th class="table-light align-middle text-center">과제</th>
          <td colspan="3">
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                v-model="formData.project"
                placeholder="과제를 입력하거나 검색하세요"
                readonly
              />
              <button class="btn btn-outline-secondary" type="button" @click="searchProject">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </td>
        </tr>

        <!-- 3. 고장현황 -->
        <tr>
          <th class="table-light align-top pt-3 text-center">고장현황</th>
          <td colspan="3">
            <textarea
              class="form-control"
              rows="4"
              v-model="formData.failureStatus"
              placeholder="고장 현황을 상세히 입력하세요"
            ></textarea>
          </td>
        </tr>

        <!-- 4. 주요원인 체크박스 -->
        <tr>
          <th class="table-light align-top pt-3 text-center">주요원인</th>
          <td colspan="3">
            <div class="row g-2 mb-3">
              <div class="col-6 col-md-3" v-for="cause in mainCauses" :key="cause">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :id="'cause-' + cause"
                    :value="cause"
                    v-model="formData.selectedCauses"
                  />
                  <label class="form-check-label" :for="'cause-' + cause">
                    {{ cause }}
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label class="form-label">비고</label>
              <textarea
                class="form-control"
                rows="2"
                v-model="formData.causeNote"
                placeholder="주요원인에 대한 추가 설명을 입력하세요"
                :disabled="!isEtcSelected"
              ></textarea>
            </div>
          </td>
        </tr>

        <!-- 5. 발생원인 Grid -->
        <tr>
          <th class="table-light align-top pt-3 text-center">발생원인</th>
          <td colspan="3">
            <div class="mb-2 text-end">
              <button class="btn btn-sm btn-primary me-1" @click="addCauseRow">
                <i class="bi bi-plus-circle me-1"></i>추가
              </button>
            </div>
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th style="width: 80px" class="text-center">No</th>
                  <th class="text-center">발생원인 상세</th>
                  <th style="width: 50px" class="text-center"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in formData.causeRows" :key="idx">
                  <td class="text-center">{{ idx + 1 }}</td>
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      v-model="row.detail"
                      placeholder="발생원인을 입력하세요"
                    />
                  </td>
                  <td class="text-center">
                    <button class="btn btn-sm btn-link text-dark p-0" @click="deleteCauseRow(idx)">
                      <i class="bi bi-x"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="formData.causeRows.length === 0">
                  <td colspan="3" class="text-center text-muted">발생원인을 추가하세요</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <!-- 6. 조치 수리역 -->
        <tr>
          <th class="table-light align-top pt-3 text-center">조치 수리역</th>
          <td colspan="3">
            <textarea
              class="form-control"
              rows="4"
              v-model="formData.repairAction"
              placeholder="조치 및 수리 내역을 입력하세요"
            ></textarea>
          </td>
        </tr>

        <!-- 7. 추가 대책 -->
        <tr>
          <th class="table-light align-top pt-3 text-center">추가 대책</th>
          <td colspan="3">
            <table class="table table-sm table-bordered mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 180px" class="text-center">구분</th>
                  <th class="text-center">상세내역</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="measure in measureTypes" :key="measure">
                  <td>
                    <div class="form-check">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :id="'measure-' + measure"
                        :value="measure"
                        v-model="formData.selectedMeasures"
                      />
                      <label class="form-check-label" :for="'measure-' + measure">
                        {{ measure }}
                      </label>
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      v-model="formData.measureDetails[measure]"
                      placeholder="상세내역을 입력하세요"
                      :disabled="!formData.selectedMeasures.includes(measure)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <!-- 8. 사용부품 Grid -->
        <tr>
          <th class="table-light align-top pt-3 text-center">사용부품</th>
          <td colspan="3">
            <div class="mb-2 text-end">
              <button class="btn btn-sm btn-primary me-1" @click="addPartRow">
                <i class="bi bi-plus-circle me-1"></i>추가
              </button>
              <button class="btn btn-sm btn-danger" @click="deletePartRow">
                <i class="bi bi-trash me-1"></i>삭제
              </button>
            </div>
            <table class="table table-sm table-bordered">
              <thead class="table-light">
                <tr>
                  <th style="width: 50px" class="text-center">
                    <input type="checkbox" @change="toggleAllPartRows" v-model="allPartSelected" />
                  </th>
                  <th style="width: 15%" class="text-center">설비</th>
                  <th style="width: 20%" class="text-center">부품명</th>
                  <th style="width: 15%" class="text-center">Maker</th>
                  <th style="width: 15%" class="text-center">규격</th>
                  <th style="width: 10%" class="text-center">수량</th>
                  <th style="width: 15%" class="text-center">출고일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in formData.partRows" :key="idx">
                  <td class="text-center">
                    <input type="checkbox" v-model="row.selected" />
                  </td>
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      v-model="row.equipment"
                      placeholder="설비"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      v-model="row.name"
                      placeholder="부품명"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      v-model="row.maker"
                      placeholder="Maker"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-sm"
                      v-model="row.spec"
                      placeholder="규격"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      class="form-control form-control-sm"
                      v-model="row.quantity"
                      placeholder="수량"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      class="form-control form-control-sm"
                      v-model="row.releaseDate"
                    />
                  </td>
                </tr>
                <tr v-if="formData.partRows.length === 0">
                  <td colspan="7" class="text-center text-muted">사용부품을 추가하세요</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <!-- 9. 지연사유 -->
        <tr>
          <th class="table-light align-top pt-3 text-center">지연사유</th>
          <td colspan="3">
            <textarea
              class="form-control"
              rows="3"
              v-model="formData.delayReason"
              placeholder="지연 사유를 입력하세요"
            ></textarea>
          </td>
        </tr>

        <!-- 10. 작업자/시간 Grid -->
        <tr>
          <th class="table-light align-top pt-3 text-center">작업자/시간</th>
          <td colspan="3">
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

        <!-- 11. 파일첨부 -->
        <tr>
          <th class="table-light align-top pt-3 text-center">파일첨부</th>
          <td colspan="3">
            <input type="file" class="form-control" @change="handleFileUpload" multiple />
            <small class="text-muted">수리 전/후 사진, 부품 영수증 등 (최대 10MB)</small>
            <ul class="list-group mt-2" v-if="formData.repairFiles.length > 0">
              <li
                v-for="(file, idx) in formData.repairFiles"
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
  name: 'FailureRepairResult',
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        vendorManager: '',
        purchaseCost: '',
        project: '',
        failureStatus: '',
        selectedCauses: [],
        causeNote: '',
        causeRows: [],
        repairAction: '',
        selectedMeasures: [],
        measureDetails: {
          개조개선: '',
          횡전개: '',
          'OPLS/SOP': '',
          기타: '',
        },
        partRows: [],
        delayReason: '',
        workerRows: [],
        repairFiles: [],
      }),
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      mainCauses: [
        '공정',
        '구조',
        '균열',
        '노후',
        '누설',
        '단선',
        '마모',
        '막힘',
        '변형',
        '부식',
        '부품',
        '사람',
        '열화',
        '오염',
        '오진',
        '재료',
        '조작',
        '측정',
        '파손',
        '풀림',
        '환경',
        'S/W',
        'ETC',
      ],
      measureTypes: ['개조개선', '횡전개', 'OPLS/SOP', '기타'],
      allPartSelected: false,
      allWorkerSelected: false,
    }
  },
  computed: {
    formData: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      },
    },
    isEtcSelected() {
      return this.formData.selectedCauses.includes('ETC')
    },
  },
  methods: {
    searchProject() {
      // TODO: 과제 검색 팝업 또는 API 호출
      alert('과제 검색 기능 구현 예정')
    },

    // 발생원인 Grid
    addCauseRow() {
      this.formData.causeRows.push({ detail: '' })
    },
    deleteCauseRow(idx) {
      this.formData.causeRows.splice(idx, 1)
    },

    // 사용부품 Grid
    addPartRow() {
      this.formData.partRows.push({
        selected: false,
        equipment: '',
        name: '',
        maker: '',
        spec: '',
        quantity: 1,
        releaseDate: '',
      })
    },
    deletePartRow() {
      this.formData.partRows = this.formData.partRows.filter((row) => !row.selected)
      this.allPartSelected = false
    },
    toggleAllPartRows() {
      this.formData.partRows.forEach((row) => {
        row.selected = this.allPartSelected
      })
    },

    // 작업자/시간 Grid
    addWorkerRow() {
      this.formData.workerRows.push({ selected: false, worker: '', department: '', workTime: 0 })
    },
    deleteWorkerRow(idx) {
      this.formData.workerRows.splice(idx, 1)
    },
    toggleAllWorkerRows() {
      this.formData.workerRows.forEach((row) => {
        row.selected = this.allWorkerSelected
      })
    },

    // 검색
    searchProject() {
      // 팝업 구현 필요
      console.log('프로젝트 검색 팝업 열기')
    },
    searchWorker(idx) {
      // 팝업 구현 필요
      console.log('작업자 검색 팝업 열기 - row index:', idx)
    },

    // 파일 처리
    handleFileUpload(event) {
      const files = event.target.files
      for (let i = 0; i < files.length; i++) {
        this.formData.repairFiles.push(files[i].name)
      }
    },
    removeFile(idx) {
      this.formData.repairFiles.splice(idx, 1)
    },
  },
}
</script>

<style scoped></style>
