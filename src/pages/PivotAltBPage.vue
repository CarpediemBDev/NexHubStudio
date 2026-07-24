<template>
  <div class="container py-3">
    <!-- Header Title -->
    <div class="mb-3">
      <div class="d-flex align-items-center gap-2">
        <h4 class="fw-bold text-dark m-0">피벗 대안 B: 동적 교차표 (Cross-Tab Matrix)</h4>
        <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">동적 Matrix 가공</span>
      </div>
      <p class="text-muted small mb-0 mt-1">
        행/열 차원 및 집계 대상을 자유롭게 선택하면, 원본 Flat 데이터를 가로/세로 매트릭스 피벗 구조로 동적 변환하여 RealGrid 2 컬럼을 바인딩합니다.
      </p>
    </div>

    <!-- Pivot Control Panel Bar -->
    <div class="card bg-light border-0 mb-3 shadow-sm">
      <div class="card-body p-3">
        <div class="row g-3 align-items-end">
          <!-- 행 축 선택 -->
          <div class="col-md-3">
            <label class="form-label small fw-bold text-secondary mb-1">
              <i class="bi bi-arrow-down-up me-1"></i>행(Row) 축 선택:
            </label>
            <select class="form-select form-select-sm" v-model="pivotOptions.rowField" @change="applyPivot">
              <option value="dept">부서명 (dept)</option>
              <option value="role">직급/역할 (role)</option>
              <option value="region">지역 (region)</option>
            </select>
          </div>

          <!-- 열 축 선택 -->
          <div class="col-md-3">
            <label class="form-label small fw-bold text-secondary mb-1">
              <i class="bi bi-arrow-left-right me-1"></i>열(Column) 축 선택:
            </label>
            <select class="form-select form-select-sm" v-model="pivotOptions.colField" @change="applyPivot">
              <option value="quarter">분기별 (quarter)</option>
              <option value="year">연도별 (year)</option>
              <option value="region">지역별 (region)</option>
              <option value="role">직급별 (role)</option>
            </select>
          </div>

          <!-- 집계 대상 선택 -->
          <div class="col-md-3">
            <label class="form-label small fw-bold text-secondary mb-1">
              <i class="bi bi-calculator me-1"></i>집계 대상 (Value):
            </label>
            <select class="form-select form-select-sm" v-model="pivotOptions.valField" @change="applyPivot">
              <option value="sales">영업실적 (sales)</option>
              <option value="salary">기본급 (salary)</option>
              <option value="bonus">성과급 (bonus)</option>
            </select>
          </div>

          <!-- 집계 수식 선택 -->
          <div class="col-md-3">
            <label class="form-label small fw-bold text-secondary mb-1">
              <i class="bi bi-percent me-1"></i>연산 방식:
            </label>
            <select class="form-select form-select-sm" v-model="pivotOptions.aggType" @change="applyPivot">
              <option value="sum">합계 (Sum)</option>
              <option value="avg">평균 (Average)</option>
              <option value="count">건수 (Count)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid Container Card -->
    <div class="card shadow-sm border-light mb-4">
      <div class="card-header bg-white py-2 px-3 d-flex justify-content-between align-items-center">
        <span class="fw-semibold text-dark small">
          <i class="bi bi-table me-1 text-primary"></i>동적 피벗 생성 결과표
        </span>
        <span class="badge bg-secondary-subtle text-secondary small">
          {{ pivotSummaryText }}
        </span>
      </div>
      <div class="card-body p-0">
        <div ref="gridElement" style="width: 100%; height: 530px;"></div>
      </div>
    </div>
  </div>
</template>

<script>
import RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-style.css'
import { buildPivotMatrix } from '@/utils/pivotUtil.js'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'PivotAltBPage',
  data() {
    return {
      container: null,
      dataProvider: null,
      gridView: null,
      pivotOptions: {
        rowField: 'dept',
        colField: 'quarter',
        valField: 'sales',
        aggType: 'sum'
      },
      pivotSummaryText: '',
      // 샘플 다차원 데이터 (연도, 분기, 지역, 부서, 직급, 실적 데이터 포함)
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
  mounted() {
    this.initGrid()
  },
  beforeUnmount() {
    if (this.gridView) {
      this.gridView.destroy()
      this.dataProvider.destroy()
    }
  },
  methods: {
    initGrid() {
      this.container = this.$refs.gridElement
      this.dataProvider = new RealGrid.LocalDataProvider(true)
      this.gridView = new RealGrid.GridView(this.container)
      this.gridView.setDataSource(this.dataProvider)

      // 그리드 표시 스타일 튜닝
      this.gridView.setDisplayOptions({
        columnMovable: false,
        rowHoverType: 'row'
      })

      this.applyPivot()
    },

    applyPivot() {
      if (!this.gridView || !this.dataProvider) return

      // 행 축과 열 축이 같으면 경고 후 예외 처리
      if (this.pivotOptions.rowField === this.pivotOptions.colField) {
        showToast('행 축과 열 축은 서로 다른 필드를 선택해야 합니다.', { type: 'danger' })
        return
      }

      // pivotUtil을 사용해 Raw -> Matrix 피벗 변환
      const matrixResult = buildPivotMatrix(this.rawSalesData, this.pivotOptions)

      // 1. 기존 필드 & 컬럼 제거 후 동적 구성
      this.dataProvider.clearRows()
      this.dataProvider.setFields(matrixResult.fields)
      this.gridView.setColumns(matrixResult.columns)

      // 2. 피벗 행 데이터 렌더링
      this.dataProvider.setRows(matrixResult.rows)

      // 3. 요약 정보 갱신
      this.pivotSummaryText = `행: ${matrixResult.rows.length}개 그룹 | 피벗 열: ${matrixResult.colKeys.length}개`
      showToast('피벗 매트릭스가 동적으로 새로고침되었습니다.', { type: 'success' })
    }
  }
}
</script>

<style scoped>
.form-select-sm {
  font-size: 13px;
  border-color: #d1d5db;
}
</style>
