<template>
  <div class="b2b-page-container">
    <!-- Pivot Control Panel Bar -->
    <div class="b2b-toolbar">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 w-100">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <!-- Inline quick selects -->
          <div class="d-flex align-items-center gap-1.5">
            <span class="small fw-bold text-secondary"><i class="bi bi-arrow-down-up me-1"></i>행 축:</span>
            <select class="form-select form-select-sm py-1 px-2" style="width: auto;" v-model="pivotOptions.rowField" @change="applyPivot">
              <option value="dept">부서명 (dept)</option>
              <option value="role">직급/역할 (role)</option>
              <option value="region">지역 (region)</option>
            </select>
          </div>

          <div class="d-flex align-items-center gap-1.5 ps-2 border-start">
            <span class="small fw-bold text-secondary"><i class="bi bi-arrow-left-right me-1"></i>열 축:</span>
            <select class="form-select form-select-sm py-1 px-2" style="width: auto;" v-model="pivotOptions.colField" @change="applyPivot">
              <option value="quarter">분기별 (quarter)</option>
              <option value="year">연도별 (year)</option>
              <option value="region">지역별 (region)</option>
              <option value="role">직급별 (role)</option>
            </select>
          </div>

          <div class="d-flex align-items-center gap-1.5 ps-2 border-start">
            <span class="small fw-bold text-secondary"><i class="bi bi-calculator me-1"></i>집계 대상:</span>
            <select class="form-select form-select-sm py-1 px-2" style="width: auto;" v-model="pivotOptions.valField" @change="applyPivot">
              <option value="sales">영업실적 (sales)</option>
              <option value="salary">기본급 (salary)</option>
              <option value="bonus">성과급 (bonus)</option>
            </select>
          </div>

          <div class="d-flex align-items-center gap-1.5 ps-2 border-start">
            <span class="small fw-bold text-secondary"><i class="bi bi-percent me-1"></i>연산:</span>
            <select class="form-select form-select-sm py-1 px-2" style="width: auto;" v-model="pivotOptions.aggType" @change="applyPivot">
              <option value="sum">합계 (Sum)</option>
              <option value="avg">평균 (Average)</option>
              <option value="count">건수 (Count)</option>
            </select>
          </div>
        </div>

        <div class="d-flex align-items-center gap-1.5 ms-auto">
          <!-- Smart Expandable Search Bar -->
          <QuickSearchBar
            :searchResult="searchResult"
            @search="onGridSearch"
            @clear="searchResult = { count: 0, current: 0 }"
          />

          <!-- Open Pivot Field Dialog Button -->
          <button class="btn-b2b-action" title="피벗 필드 상세 구성 대화상자 모달" @click="openPivotModal">
            <i class="bi bi-sliders text-primary me-0.5"></i>
            <span>피벗 필드</span>
          </button>

          <!-- Column Picker -->
          <button class="btn-b2b-action" title="컬럼 숨김/표시 설정" @click="openColumnPicker">
            <i class="bi bi-eye text-primary me-0.5"></i>
            <span>컬럼</span>
          </button>

          <!-- Excel Export -->
          <button class="btn-b2b-action" title="엑셀 파일 내보내기" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
            <span>엑셀</span>
          </button>

          <!-- 추가 (Disabled in Pivot Matrix view) -->
          <button
            class="btn-b2b-action"
            disabled
            title="동적 매트릭스 피벗 뷰에서는 행 추가가 제한됩니다"
            @click="addRow"
          >
            <i class="bi bi-plus-lg text-success me-0.5"></i>
            <span>추가</span>
          </button>

          <!-- 삭제 (Disabled in Pivot Matrix view) -->
          <button
            class="btn-b2b-action"
            disabled
            title="동적 매트릭스 피벗 뷰에서는 행 삭제가 제한됩니다"
            @click="deleteChecked"
          >
            <i class="bi bi-dash-lg text-danger me-0.5"></i>
            <span>삭제</span>
          </button>

          <!-- 저장 -->
          <button class="btn-b2b-primary ms-1" title="피벗 데이터 저장" @click="saveData">
            <i class="bi bi-check2 me-0.5"></i>
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid Container Card (RealGridCommonJs 기반 계층 조립) -->
    <div class="b2b-grid-card mb-4">
      <div class="card-header bg-theme-card border-theme py-2 px-3 d-flex justify-content-between align-items-center">
        <span class="fw-semibold text-theme-primary small">
          <i class="bi bi-table me-1 text-primary"></i>동적 피벗 생성 결과표
        </span>
        <span class="badge bg-secondary-subtle text-secondary small">
          {{ pivotSummaryText }}
        </span>
      </div>
      <div class="b2b-grid-wrapper">
        <RealGridCommonJs
          ref="realgridComp"
          :sortable="true"
          :filterable="true"
          :checkable="true"
          :indicatable="true"
          :stateBarVisible="true"
          :stateBarWidth="20"
          :checkBarWidth="36"
          :pinnable="true"
          :groupable="true"
          :mergeable="true"
          :columnHideable="false"
          :exclusiveSelectable="false"
          :autoCommittable="true"
          :showFooter="true"
          :softDeletable="true"
          :groupSummaryMode="'aggregate'"
          :fitStyle="'evenFill'"
          :toast="gridToast"
          @init="onGridInit"
        />
      </div>
    </div>

    <!-- 🎛️ 피벗 필드 선택 모달 (Pivot Field Selection Dialog Modal) -->
    <div v-if="isModalOpen" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
      <div class="modal-card-custom bg-theme-card rounded-3 shadow-lg border-theme overflow-hidden" style="width: 540px; max-width: 95vw;">
        <!-- Modal Header -->
        <div class="px-4 py-3 bg-theme-subcard border-bottom border-theme d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-sliders text-primary fs-5"></i>
            <h5 class="fw-bold text-theme-primary m-0 fs-6">피벗 필드 상세 구성 대화상자</h5>
          </div>
          <button type="button" class="btn-close" @click="closePivotModal"></button>
        </div>

        <!-- Modal Body -->
        <div class="p-4">
          <p class="text-muted small mb-3">
            행/열 배치 필드 및 집계 연산 방식을 원클릭 칩으로 선택 후 하단의 <strong>[피벗 구성 적용]</strong>을 눌러주세요.
          </p>

          <!-- 1. 행(Row) 축 선택 -->
          <div class="mb-3">
            <label class="form-label small fw-bold text-theme-primary d-flex align-items-center gap-1 mb-2">
              <i class="bi bi-arrow-down-up text-primary"></i> 1. 행(Row) 배치 필드 선택
            </label>
            <div class="d-flex flex-wrap gap-2">
              <button
                v-for="opt in rowOptions"
                :key="opt.value"
                type="button"
                class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 transition-all"
                :class="{ 'btn-primary text-white active border-primary': tempPivotOptions.rowField === opt.value }"
                @click="tempPivotOptions.rowField = opt.value"
              >
                <i class="bi bi-check2 me-1" v-if="tempPivotOptions.rowField === opt.value"></i>
                {{ opt.label }}
              </button>
            </div>
          </div>

          <hr class="my-3 text-secondary opacity-25" />

          <!-- 2. 열(Column) 축 선택 -->
          <div class="mb-3">
            <label class="form-label small fw-bold text-theme-primary d-flex align-items-center gap-1 mb-2">
              <i class="bi bi-arrow-left-right text-success"></i> 2. 열(Column) 배치 필드 선택
            </label>
            <div class="d-flex flex-wrap gap-2">
              <button
                v-for="opt in colOptions"
                :key="opt.value"
                type="button"
                class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 transition-all"
                :class="{ 'btn-success text-white active border-success': tempPivotOptions.colField === opt.value }"
                @click="tempPivotOptions.colField = opt.value"
              >
                <i class="bi bi-check2 me-1" v-if="tempPivotOptions.colField === opt.value"></i>
                {{ opt.label }}
              </button>
            </div>
          </div>

          <hr class="my-3 text-secondary opacity-25" />

          <!-- 3. 집계 대상 및 연산 방식 -->
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label small fw-bold text-theme-primary d-flex align-items-center gap-1 mb-2">
                <i class="bi bi-calculator text-warning"></i> 3. 집계 수치 필드
              </label>
              <div class="d-flex flex-column gap-1.5">
                <button
                  v-for="opt in valOptions"
                  :key="opt.value"
                  type="button"
                  class="btn btn-sm btn-outline-secondary text-start px-3 py-1.5 transition-all"
                  :class="{ 'btn-warning text-dark active border-warning fw-semibold': tempPivotOptions.valField === opt.value }"
                  @click="tempPivotOptions.valField = opt.value"
                >
                  <i class="bi bi-check-circle-fill me-1 text-dark" v-if="tempPivotOptions.valField === opt.value"></i>
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label small fw-bold text-theme-primary d-flex align-items-center gap-1 mb-2">
                <i class="bi bi-percent text-info"></i> 4. 연산 방식 (Aggregation)
              </label>
              <div class="d-flex flex-column gap-1.5">
                <button
                  v-for="opt in aggOptions"
                  :key="opt.value"
                  type="button"
                  class="btn btn-sm btn-outline-secondary text-start px-3 py-1.5 transition-all"
                  :class="{ 'btn-info text-white active border-info fw-semibold': tempPivotOptions.aggType === opt.value }"
                  @click="tempPivotOptions.aggType = opt.value"
                >
                  <i class="bi bi-check-circle-fill me-1 text-white" v-if="tempPivotOptions.aggType === opt.value"></i>
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-4 py-3 bg-theme-subcard border-top border-theme d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-sm btn-secondary px-3" @click="closePivotModal">취소</button>
          <button type="button" class="btn btn-sm btn-primary px-4 fw-semibold shadow-sm" @click="applyPivotFromModal">
            <i class="bi bi-check-lg me-1"></i>피벗 구성 적용
          </button>
        </div>
      </div>
    </div>

    <!-- Column Picker Modal -->
    <ColumnPickerModal
      :isOpen="isColumnPickerOpen"
      :columns="columnPickerCols"
      @close="isColumnPickerOpen = false"
      @toggle-column="onToggleColumn"
    />
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import ColumnPickerModal from '@/components/ColumnPickerModal.vue'
import QuickSearchBar from '@/components/QuickSearchBar.vue'
import PageHeader from '@/components/PageHeader.vue'
import { buildPivotMatrix } from '@/utils/pivotUtil.js'
import { showToast } from '@/utils/toastUtil.js'
import { searchGrid } from '@/utils/realgridOps'

export default {
  name: 'PivotAltBPage',
  components: {
    PageHeader,
    RealGridCommonJs,
    ColumnPickerModal,
    QuickSearchBar
  },
  data() {
    return {
      searchResult: { count: 0, current: 0 },
      isColumnPickerOpen: false,
      columnPickerCols: [],
      isModalOpen: false,
      pivotOptions: {
        rowField: 'dept',
        colField: 'quarter',
        valField: 'sales',
        aggType: 'sum'
      },
      tempPivotOptions: {
        rowField: 'dept',
        colField: 'quarter',
        valField: 'sales',
        aggType: 'sum'
      },
      rowOptions: [
        { label: '부서명 (dept)', value: 'dept' },
        { label: '직급/역할 (role)', value: 'role' },
        { label: '지역 (region)', value: 'region' }
      ],
      colOptions: [
        { label: '분기별 (quarter)', value: 'quarter' },
        { label: '연도별 (year)', value: 'year' },
        { label: '지역별 (region)', value: 'region' },
        { label: '직급별 (role)', value: 'role' }
      ],
      valOptions: [
        { label: '영업실적 (sales)', value: 'sales' },
        { label: '기본급 (salary)', value: 'salary' },
        { label: '성과급 (bonus)', value: 'bonus' }
      ],
      aggOptions: [
        { label: '합계 (Sum)', value: 'sum' },
        { label: '평균 (Average)', value: 'avg' },
        { label: '건수 (Count)', value: 'count' }
      ],
      pivotSummaryText: '',
      rawSalesData: [
        { dept: '개발 1팀', role: '수석', region: '서울', year: '2025년', quarter: '1분기', sales: 3200, salary: 1800, bonus: 150 },
        { dept: '개발 1팀', role: '책임', region: '서울', year: '2025년', quarter: '2분기', sales: 4500, salary: 1800, bonus: 200 },
        { dept: '개발 1팀', role: '선임', region: '서울', year: '2025년', quarter: '3분기', sales: 2800, salary: 1800, bonus: 100 },
        { dept: '개발 1팀', role: '수석', region: '서울', year: '2025년', quarter: '4분기', sales: 5100, salary: 1800, bonus: 250 },
        
        { dept: '개발 2팀', role: '수석', region: '판교', year: '2025년', quarter: '1분기', sales: 4100, salary: 1900, bonus: 200 },
        { dept: '개발 2팀', role: '책임', region: '판교', year: '2025년', quarter: '2분기', sales: 3900, salary: 1900, bonus: 180 },
        { dept: '개발 2팀', role: '선임', region: '판교', year: '2025년', quarter: '3분기', sales: 4800, salary: 1900, bonus: 220 },
        { dept: '개발 2팀', role: '선임', region: '판교', year: '2025년', quarter: '4분기', sales: 5600, salary: 1900, bonus: 300 },

        { dept: '영업 1팀', role: '부장', region: '서울', year: '2025년', quarter: '1분기', sales: 12000, salary: 2000, bonus: 500 },
        { dept: '영업 1팀', role: '차장', region: '서울', year: '2025년', quarter: '2분기', sales: 15000, salary: 2000, bonus: 650 },
        { dept: '영업 1팀', role: '과장', region: '서울', year: '2025년', quarter: '3분기', sales: 11000, salary: 2000, bonus: 400 },
        { dept: '영업 1팀', role: '부장', region: '서울', year: '2025년', quarter: '4분기', sales: 18000, salary: 2000, bonus: 800 },

        { dept: '영업 2팀', role: '부장', region: '부산', year: '2025년', quarter: '1분기', sales: 9500, salary: 2100, bonus: 400 },
        { dept: '영업 2팀', role: '차장', region: '부산', year: '2025년', quarter: '2분기', sales: 13500, salary: 2100, bonus: 550 },
        { dept: '영업 2팀', role: '차장', region: '부산', year: '2025년', quarter: '3분기', sales: 14000, salary: 2100, bonus: 600 },
        { dept: '영업 2팀', role: '부장', region: '부산', year: '2025년', quarter: '4분기', sales: 16500, salary: 2100, bonus: 750 }
      ]
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('db.json fetch 실패')
        const data = await res.json()
        const rows = Array.isArray(data) ? data : (data.users || [])
        if (rows.length) {
          const quarters = ['1분기', '2분기', '3분기', '4분기']
          const years = ['2024년', '2025년']
          this.rawSalesData = rows.map((r, i) => ({
            ...r,
            year: years[i % 2],
            quarter: quarters[i % 4],
            sales: r.sales ?? Math.floor((r.salary || 6000) * 1.2 + (i * 17) % 3000),
            bonus: r.bonus ?? Math.floor((r.salary || 6000) * 0.1 + (i * 7) % 500)
          }))
          if (this.gridView && this.dataProvider) {
            this.applyPivot()
          }
        }
      } catch (e) {
        console.warn('[PivotAltB] db.json 로드 실패 → 폴백 데이터 사용:', e)
      }
    },

    gridToast(message, opts = {}) {
      showToast(message, opts)
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      gridView.setFixedOptions({
        colCount: 1,
        resizable: true
      })

      // 우클릭 행/열 고정 메뉴는 RealGridCommonJs 컴포넌트가 내부에서 처리(refs 불필요)
      this.applyPivot()
    },

    applyPivot() {
      if (!this.gridView || !this.dataProvider) return

      if (this.pivotOptions.rowField === this.pivotOptions.colField) {
        showToast('행 축과 열 축은 서로 다른 필드를 선택해야 합니다.', { type: 'danger' })
        return
      }

      // pivotUtil을 사용해 Raw -> Matrix 피벗 변환
      const matrixResult = buildPivotMatrix(this.rawSalesData, this.pivotOptions)

      // RealGrid2 순수 API를 통한 동적 필드/컬럼/행 업데이트
      this.dataProvider.setFields(matrixResult.fields)
      this.gridView.setColumns(matrixResult.columns)
      this.dataProvider.setRows(matrixResult.rows)

      // 요약 정보 갱신
      this.pivotSummaryText = `행: ${matrixResult.rows.length}개 그룹 | 피벗 열: ${matrixResult.colKeys.length}개`
      showToast('피벗 매트릭스가 동적으로 새로고침되었습니다.', { type: 'success' })
    },

    exportExcel() {
      if (!this.gridView) return
      this.gridView.exportGrid({
        type: 'excel',
        target: 'local',
        fileName: 'Pivot_AltB_Matrix_Export.xlsx',
        showProgress: true
      })
    },

    openColumnPicker() {
      if (!this.gridView) return
      const cols = this.gridView.getColumns() || []
      this.columnPickerCols = cols.map(c => ({
        name: c.name,
        header: c.header?.text || c.name,
        visible: c.visible !== false
      }))
      this.isColumnPickerOpen = true
    },

    onToggleColumn({ name, visible }) {
      if (this.gridView) {
        this.gridView.setColumnProperty(name, 'visible', visible)
      }
    },

    onGridSearch({ query, direction }) {
      if (this.gridView) {
        this.searchResult = searchGrid(this.gridView, this.dataProvider, query, direction, showToast)
      }
    },

    addRow() {
      showToast('동적 피벗 매트릭스 뷰에서는 행 추가가 제한됩니다.', { type: 'warning' })
    },

    deleteChecked() {
      showToast('동적 피벗 매트릭스 뷰에서는 행 삭제가 제한됩니다.', { type: 'warning' })
    },

    saveData() {
      if (!this.gridView) return
      this.gridView.commit(true) // RealGrid2 표준 편집 커밋
      showToast('피벗 매트릭스 설정이 저장되었습니다.', { type: 'success' })
    }
  }
}
</script>

<style scoped>
.form-select-sm {
  font-size: 13px;
  background-color: var(--bg-card);
  color: var(--text-primary);
  border-color: var(--border-color);
}
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  z-index: 1050;
}
.modal-card-custom {
  animation: fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.transition-all {
  transition: all 0.15s ease-in-out;
}
</style>
