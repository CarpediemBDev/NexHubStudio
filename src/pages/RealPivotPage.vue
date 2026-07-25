<template>
  <div class="container py-3">
    <!-- Page Header -->
    <div class="mb-3">
      <div class="d-flex align-items-center gap-2">
        <h4 class="fw-bold text-dark m-0">RealPivot (전용 피벗 솔루션) 체험 및 가이드</h4>
        <span class="badge bg-warning-subtle text-dark border border-warning-subtle px-2 py-1">별도 라이선스 제품</span>
      </div>
      <p class="text-muted small mb-0 mt-1">
        RealPivot은 엑셀과 100% 동일하게 마우스 드래그 앤 드롭으로 **행/열/값 필드를 동적으로 구성**할 수 있는 전용 피벗 그리드입니다.
      </p>
    </div>

    <!-- RealPivot Drag & Drop Interactive Simulator -->
    <div class="row g-3 mb-4">
      <!-- Left: Interactive Pivot Field Setup Panel (Simulator) -->
      <div class="col-lg-4">
        <div class="card shadow-sm border-light h-100">
          <div class="card-header bg-dark text-white py-2 px-3 d-flex justify-content-between align-items-center">
            <span class="fw-semibold small"><i class="bi bi-grid-3x3-gap me-1"></i>RealPivot 필드 목록</span>
            <span class="badge bg-secondary extra-small">드래그 시뮬레이터</span>
          </div>
          <div class="card-body p-3 d-flex flex-column gap-3">
            <!-- Available Fields -->
            <div>
              <label class="form-label small fw-bold text-muted mb-2">사용 가능한 필드:</label>
              <div class="d-flex flex-wrap gap-1">
                <button
                  v-for="field in availableFields"
                  :key="field.id"
                  class="btn btn-outline-secondary btn-sm py-1 px-2 text-dark small"
                  @click="toggleFieldLocation(field)"
                >
                  <i class="bi bi-grip-vertical text-muted me-1"></i>{{ field.label }}
                  <span class="badge bg-light text-dark ms-1 border">{{ getFieldZoneLabel(field.zone) }}</span>
                </button>
              </div>
            </div>

            <hr class="my-1 text-muted">

            <!-- Drop Zones -->
            <div class="d-flex flex-column gap-2">
              <!-- 행(Row) 영역 -->
              <div class="p-2 border rounded bg-light">
                <div class="fw-bold extra-small text-secondary mb-1"><i class="bi bi-list-nested me-1"></i>행 (Rows) 축:</div>
                <div class="d-flex flex-wrap gap-1 min-h-30">
                  <span v-for="f in rowFields" :key="f.id" class="badge bg-primary px-2 py-1">
                    {{ f.label }} <i class="bi bi-x ms-1 cursor-pointer" @click="f.zone = 'none'"></i>
                  </span>
                  <span v-if="rowFields.length === 0" class="text-muted extra-small">필드를 이곳으로 배치하세요</span>
                </div>
              </div>

              <!-- 열(Column) 영역 -->
              <div class="p-2 border rounded bg-light">
                <div class="fw-bold extra-small text-secondary mb-1"><i class="bi bi-layout-three-columns me-1"></i>열 (Columns) 축:</div>
                <div class="d-flex flex-wrap gap-1 min-h-30">
                  <span v-for="f in colFields" :key="f.id" class="badge bg-info text-dark px-2 py-1">
                    {{ f.label }} <i class="bi bi-x ms-1 cursor-pointer" @click="f.zone = 'none'"></i>
                  </span>
                  <span v-if="colFields.length === 0" class="text-muted extra-small">필드를 이곳으로 배치하세요</span>
                </div>
              </div>

              <!-- 값(Values) 영역 -->
              <div class="p-2 border rounded bg-light">
                <div class="fw-bold extra-small text-secondary mb-1"><i class="bi bi-calculator me-1"></i>값 (Values) 영역:</div>
                <div class="d-flex flex-wrap gap-1 min-h-30">
                  <span v-for="f in valueFields" :key="f.id" class="badge bg-success px-2 py-1">
                    합계({{ f.label }}) <i class="bi bi-x ms-1 cursor-pointer" @click="f.zone = 'none'"></i>
                  </span>
                  <span v-if="valueFields.length === 0" class="text-muted extra-small">집계할 필드를 배치하세요</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: RealPivot Preview Grid Simulation -->
      <div class="col-lg-8">
        <div class="card shadow-sm border-light h-100">
          <div class="card-header bg-white py-2 px-3 d-flex justify-content-between align-items-center">
            <span class="fw-semibold text-dark small"><i class="bi bi-display me-1 text-warning"></i>RealPivot 렌더링 뷰</span>
            <span class="text-muted extra-small">실시간 드래그 반영 결과</span>
          </div>
          <div class="card-body p-0 d-flex flex-column justify-content-between">
            <div class="table-responsive p-3">
              <table class="table table-bordered table-hover align-middle mb-0 text-center small">
                <thead class="table-dark">
                  <tr>
                    <th>{{ rowFields.map(f => f.label).join(' > ') || '행(Row)' }}</th>
                    <th v-for="col in simulatedCols" :key="col">{{ col }}</th>
                    <th class="bg-secondary">총계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in simulatedRows" :key="idx">
                    <td class="fw-semibold bg-light">{{ row.name }}</td>
                    <td v-for="(val, cIdx) in row.values" :key="cIdx">{{ val.toLocaleString() }}</td>
                    <td class="fw-bold bg-light text-primary">{{ row.total.toLocaleString() }}</td>
                  </tr>
                </tbody>
                <tfoot class="table-secondary fw-bold">
                  <tr>
                    <td>합계 / 총계</td>
                    <td v-for="(colTot, cIdx) in simulatedColTotals" :key="cIdx">{{ colTot.toLocaleString() }}</td>
                    <td class="text-danger">{{ grandTotal.toLocaleString() }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Tech Integration Code Guide -->
            <div class="p-3 bg-light border-top">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold small text-dark"><i class="bi bi-code-slash me-1"></i>RealPivot 연동 소스코드 예시:</span>
                <span class="badge bg-dark">JS SDK</span>
              </div>
              <pre class="bg-dark text-light p-2 rounded extra-small mb-0 font-monospace"><code>// RealPivot 연동 예시 코드 (라이선스 발급 시 사용)
const pivot = new RealPivot("pivot-container");
pivot.setDataProvider(dataProvider);
pivot.setPivotFields([
  { fieldName: "dept", setup: { type: "row" } },
  { fieldName: "quarter", setup: { type: "column" } },
  { fieldName: "sales", setup: { type: "value", expression: "sum" } }
]);
pivot.draw();</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comparison Summary Table -->
    <div class="card shadow-sm border-light">
      <div class="card-header bg-white py-2 px-3">
        <span class="fw-semibold text-dark small"><i class="bi bi-check2-circle me-1 text-success"></i>피벗 구현 방식 3종 종합 비교표</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-striped table-bordered align-middle mb-0 text-center small">
            <thead class="table-light">
              <tr>
                <th>구분</th>
                <th>RealPivot (전용 피벗)</th>
                <th>대안 A (Grouping + Subtotal)</th>
                <th>대안 B (Dynamic Cross-Tab)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-semibold">라이선스 필요 여부</td>
                <td><span class="badge bg-danger">별도 라이선스 필요</span></td>
                <td><span class="badge bg-success">기존 RealGrid 2 로 즉시 가능</span></td>
                <td><span class="badge bg-success">기존 RealGrid 2 로 즉시 가능</span></td>
              </tr>
              <tr>
                <td class="fw-semibold">사용자 동적 피벗 (드래그)</td>
                <td>행/열/값 드롭존 드래그 지원 ⭕</td>
                <td>상단 행(Row) 그룹핑 드래그 지원 ⭕</td>
                <td>드롭다운 드래그 대신 셀렉트 변경 ⭕</td>
              </tr>
              <tr>
                <td class="fw-semibold">가로/세로 매트릭스 뷰</td>
                <td>동적 자동 렌더링 ⭕</td>
                <td>행 트리구조 방식 (세로 확장) ⭕</td>
                <td>Matrix 변환 연산으로 매트릭스 뷰 ⭕</td>
              </tr>
              <tr>
                <td class="fw-semibold">구현 난이도 및 기간</td>
                <td>라이선스 발급 후 바로 적용 가능</td>
                <td>1시간 내 즉시 구현 가능</td>
                <td>반나절 (피벗 연산 유틸 바인딩)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RealPivotPage',
  data() {
    return {
      fields: [
        { id: 'dept', label: '부서명', zone: 'row' },
        { id: 'quarter', label: '분기', zone: 'col' },
        { id: 'sales', label: '영업실적', zone: 'value' },
        { id: 'role', label: '직급', zone: 'none' },
        { id: 'region', label: '지역', zone: 'none' },
        { id: 'salary', label: '기본급', zone: 'none' }
      ]
    }
  },
  computed: {
    availableFields() {
      return this.fields
    },
    rowFields() {
      return this.fields.filter(f => f.zone === 'row')
    },
    colFields() {
      return this.fields.filter(f => f.zone === 'col')
    },
    valueFields() {
      return this.fields.filter(f => f.zone === 'value')
    },
    simulatedCols() {
      if (this.colFields.length === 0) return ['전체 집계']
      const colName = this.colFields[0].label
      if (colName === '분기') return ['1분기', '2분기', '3분기', '4분기']
      if (colName === '지역') return ['서울', '판교', '부산']
      if (colName === '직급') return ['수석', '책임', '선임', '과장']
      return ['구분 A', '구분 B', '구분 C']
    },
    simulatedRows() {
      const colsCount = this.simulatedCols.length
      const rName = this.rowFields.length > 0 ? this.rowFields[0].label : '전체'
      
      let baseNames = ['개발 1팀', '개발 2팀', '영업 1팀', '영업 2팀']
      if (rName === '직급') baseNames = ['수석연구원', '책임연구원', '선임연구원', '부장']
      if (rName === '지역') baseNames = ['서울본사', '판교센터', '부산지사']

      return baseNames.map((name, rIdx) => {
        const values = Array.from({ length: colsCount }, (_, cIdx) => (rIdx + 1) * 3500 + (cIdx + 1) * 1200)
        const total = values.reduce((a, b) => a + b, 0)
        return { name, values, total }
      })
    },
    simulatedColTotals() {
      const colsCount = this.simulatedCols.length
      const totals = new Array(colsCount).fill(0)
      this.simulatedRows.forEach(r => {
        r.values.forEach((v, idx) => {
          totals[idx] += v
        })
      })
      return totals
    },
    grandTotal() {
      return this.simulatedRows.reduce((acc, r) => acc + r.total, 0)
    }
  },
  methods: {
    toggleFieldLocation(field) {
      const cycle = ['none', 'row', 'col', 'value']
      const currentIdx = cycle.indexOf(field.zone)
      field.zone = cycle[(currentIdx + 1) % cycle.length]
    },
    getFieldZoneLabel(zone) {
      const map = { row: '행', col: '열', value: '값', none: '미배치' }
      return map[zone] || '미배치'
    }
  }
}
</script>

<style scoped>
.extra-small {
  font-size: 11px;
}
.min-h-30 {
  min-height: 32px;
  align-items: center;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
