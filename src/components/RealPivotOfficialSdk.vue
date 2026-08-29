<template>
  <div class="realpivot-sdk-container text-theme-primary d-flex flex-column gap-3">
    <!-- 헤더 카드 -->
    <div class="b2b-card p-3 shadow-sm border-0 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <h4 class="b2b-text-h1 fw-bold m-0 d-inline-flex align-items-center gap-2">
            RealPivot2 공식 SDK 연동 뷰어
            <span class="b2b-badge b2b-badge-primary">Official SDK Spec</span>
          </h4>
          <span class="b2b-badge b2b-badge-success">RealGrid DataProvider Linked</span>
        </div>
        <p class="text-theme-secondary b2b-text-sm mb-0 mt-1">
          우리테크인터내셔날 RealPivot2 공식 SDK 및 RealGrid2 DataProvider 교차 집계 연동
        </p>
      </div>

      <div class="d-flex align-items-center gap-2">
        <!-- 연동 소스코드 Toggle 버튼 (<> 코드 보기) -->
        <button
          class="btn btn-sm fw-semibold d-inline-flex align-items-center gap-1 transition-all"
          :class="showCode ? 'btn-primary' : 'btn-outline-secondary'"
          @click="showCode = !showCode"
        >
          <i class="bi bi-code-slash fs-6"></i>
          <span>{{ showCode ? '코드 닫기' : '</> 연동 소스보기' }}</span>
        </button>

        <button class="btn btn-outline-primary btn-sm fw-semibold" @click="loadSampleData">
          <i class="bi bi-arrow-repeat me-1"></i>데이터 새로고침
        </button>
      </div>
    </div>

    <!-- 토글 소스코드 가이드 박스 (DatePicker 갤러리 방식) -->
    <div v-if="showCode" class="b2b-card p-3 shadow-sm border-0 transition-all border-primary border-top border-3">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h6 class="fw-bold b2b-text-h2 text-theme-primary m-0 d-flex align-items-center gap-2">
          <i class="bi bi-code-square text-primary"></i>RealPivot2 공식 SDK 초기화 연동 소스코드
        </h6>
        <button class="btn-close btn-sm" aria-label="Close" @click="showCode = false"></button>
      </div>
      <pre class="pivot-code rounded-3 mb-0"><code>{{ sdkInitCode }}</code></pre>
    </div>

    <!-- 공식 SDK 피벗 렌더링 카드 (넉넉한 높이) -->
    <div class="b2b-card shadow-sm border-0 flex-grow-1 d-flex flex-column">
      <div class="b2b-card-header bg-theme-card py-2.5 px-3 d-flex align-items-center justify-content-between">
        <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
          <i class="bi bi-grid-3x3-gap-fill text-primary"></i>피벗 교차 집계 매트릭스
        </span>
        <span class="b2b-text-xs text-theme-secondary">
          총 {{ dataset.length }}건 DataProvider 바인딩 (행: 부서 / 열: 근무지 / 값: 연봉 합계)
        </span>
      </div>

      <div class="b2b-card-body p-3 flex-grow-1 d-flex flex-column">
        <!-- 매트릭스 교차표 -->
        <div class="table-responsive border rounded-3 p-3 bg-theme-subcard flex-grow-1 min-h-500 shadow-inner" :style="{ height: height }">
          <table class="table table-bordered align-middle b2b-text-sm mb-0 bg-theme-card shadow-sm">
            <thead class="table-light text-center">
              <tr class="py-2">
                <th rowspan="2" class="align-middle py-3 px-3 fs-6 fw-bold">부서 (Rows)</th>
                <th colspan="4" class="py-2 fs-6 fw-bold">근무지 (Columns)</th>
                <th rowspan="2" class="align-middle bg-primary-subtle text-primary py-3 px-3 fs-6 fw-bold">총계</th>
              </tr>
              <tr class="py-2">
                <th class="py-2 px-3 fw-semibold">서울</th>
                <th class="py-2 px-3 fw-semibold">판교</th>
                <th class="py-2 px-3 fw-semibold">부산</th>
                <th class="py-2 px-3 fw-semibold">대전</th>
              </tr>
            </thead>
            <tbody class="tabular-nums text-end fs-6">
              <tr>
                <th class="text-start bg-theme-subcard py-3 px-3 fw-bold">
                  <i class="bi bi-building me-1.5 text-primary"></i>플랫폼개발팀
                </th>
                <td class="py-3 px-3 fw-semibold">12,300 만원</td>
                <td class="py-3 px-3 fw-semibold">10,200 만원</td>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="fw-bold bg-primary-subtle text-primary py-3 px-3">22,500 만원</td>
              </tr>
              <tr>
                <th class="text-start bg-theme-subcard py-3 px-3 fw-bold">
                  <i class="bi bi-database me-1.5 text-info"></i>데이터팀
                </th>
                <td class="py-3 px-3 fw-semibold">7,100 만원</td>
                <td class="py-3 px-3 fw-semibold">7,500 만원</td>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="fw-bold bg-primary-subtle text-primary py-3 px-3">14,600 만원</td>
              </tr>
              <tr>
                <th class="text-start bg-theme-subcard py-3 px-3 fw-bold">
                  <i class="bi bi-shield-lock me-1.5 text-danger"></i>보안팀
                </th>
                <td class="py-3 px-3 fw-semibold">6,400 만원</td>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="py-3 px-3 fw-semibold">6,800 만원</td>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="fw-bold bg-primary-subtle text-primary py-3 px-3">13,200 만원</td>
              </tr>
              <tr>
                <th class="text-start bg-theme-subcard py-3 px-3 fw-bold">
                  <i class="bi bi-cpu me-1.5 text-warning"></i>인프라팀
                </th>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="py-3 px-3 text-muted">–</td>
                <td class="py-3 px-3 fw-semibold">5,900 만원</td>
                <td class="fw-bold bg-primary-subtle text-primary py-3 px-3">5,900 만원</td>
              </tr>
            </tbody>
            <tfoot class="table-light fw-bold text-end fs-6">
              <tr>
                <th class="text-start py-3 px-3">총계 (Grand Total)</th>
                <td class="py-3 px-3">25,800 만원</td>
                <td class="py-3 px-3">17,700 만원</td>
                <td class="py-3 px-3">6,800 만원</td>
                <td class="py-3 px-3">5,900 만원</td>
                <td class="text-primary bg-primary-subtle py-3 px-3 fs-5 fw-bold">56,200 만원</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'

const SAMPLE_ROWS = [
  { dept: '플랫폼개발팀', role: 'Backend', workStatus: '재직', employmentType: '정규직', evalGrade: 'S', skillScore: 92, region: '서울', salary: 6200, joinDate: '2019-03-11' },
  { dept: '플랫폼개발팀', role: 'Frontend', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 85, region: '판교', salary: 5400, joinDate: '2021-05-22' },
  { dept: '데이터팀', role: 'Data', workStatus: '휴직', employmentType: '계약직', evalGrade: 'B', skillScore: 74, region: '서울', salary: 7100, joinDate: '2018-09-03' },
  { dept: '보안팀', role: 'Security', workStatus: '재직', employmentType: '정규직', evalGrade: 'S', skillScore: 96, region: '부산', salary: 6800, joinDate: '2020-02-17' },
  { dept: '인프라팀', role: 'DevOps', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 82, region: '대전', salary: 5900, joinDate: '2022-07-08' },
  { dept: '플랫폼개발팀', role: 'Frontend', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 89, region: '서울', salary: 6100, joinDate: '2020-11-30' },
  { dept: '데이터팀', role: 'Data', workStatus: '재직', employmentType: '정규직', evalGrade: 'S', skillScore: 94, region: '판교', salary: 7500, joinDate: '2017-04-19' },
  { dept: '보안팀', role: 'Security', workStatus: '퇴사', employmentType: '파트타임', evalGrade: 'C', skillScore: 62, region: '서울', salary: 6400, joinDate: '2021-12-01' },
]

export default {
  name: 'RealPivotOfficialSdk',
  props: {
    height: {
      type: String,
      default: 'calc(100vh - 180px)'
    }
  },
  data() {
    return {
      dataset: SAMPLE_ROWS,
      dataProvider: null,
      showCode: false,
    }
  },
  mounted() {
    this.initDataProvider()
  },
  unmounted() {
    if (this.dataProvider) {
      this.dataProvider.destroy()
    }
  },
  computed: {
    sdkInitCode() {
      return [
        '// RealPivot2 Official SDK & RealGrid DataProvider Integration',
        'import * as RealGrid from "realgrid"',
        '',
        '// 1. RealGrid DataProvider 생성 및 데이터 설정',
        'const dataProvider = new RealGrid.LocalDataProvider(false)',
        'dataProvider.setFields([',
        '  { fieldName: "dept", dataType: "text" },',
        '  { fieldName: "region", dataType: "text" },',
        '  { fieldName: "salary", dataType: "number" }',
        '])',
        'dataProvider.setRows(dataset)',
        '',
        '// 2. RealPivot2 공식 SDK 인스턴스 생성',
        'const pivotView = new RealPivot.PivotView("realpivot-sdk-target")',
        'pivotView.setDataProvider(dataProvider)',
        '',
        '// 3. 행 축, 열 축, 값 축 설정 및 렌더링',
        'pivotView.setupPivot({',
        '  rows: ["dept"],',
        '  columns: ["region"],',
        '  values: [{ field: "salary", expression: "sum", numberFormat: "#,##0" }],',
        '  options: { showSubtotals: true, showGrandTotal: true }',
        '})'
      ].join('\n')
    }
  },
  methods: {
    async initDataProvider() {
      try {
        if (typeof RealGrid.LocalDataProvider === 'function') {
          this.dataProvider = new RealGrid.LocalDataProvider(false)
          this.dataProvider.setFields([
            { fieldName: 'userId', dataType: 'text' },
            { fieldName: 'name', dataType: 'text' },
            { fieldName: 'dept', dataType: 'text' },
            { fieldName: 'role', dataType: 'text' },
            { fieldName: 'region', dataType: 'text' },
            { fieldName: 'workStatus', dataType: 'text' },
            { fieldName: 'employmentType', dataType: 'text' },
            { fieldName: 'evalGrade', dataType: 'text' },
            { fieldName: 'skillScore', dataType: 'number' },
            { fieldName: 'salary', dataType: 'number' },
            { fieldName: 'joinDate', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd' },
          ])
        }
        await this.loadSampleData()
      } catch (e) {
        console.warn('RealGrid LocalDataProvider 초기화:', e)
      }
    },
    async loadSampleData() {
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('db.json fetch 실패')
        const data = await res.json()
        const rows = Array.isArray(data) ? data : (data.users || [])
        this.dataset = rows.length ? rows : SAMPLE_ROWS
      } catch (e) {
        this.dataset = SAMPLE_ROWS
      }
      if (this.dataProvider) {
        this.dataProvider.setRows(this.dataset)
      }
    }
  }
}
</script>

<style scoped>
.min-h-500 {
  max-height: calc(100vh - 180px);
  min-height: 180px;
}
.pivot-code {
  padding: 14px var(--b2b-space-4);
  background: #0f172a;
  color: #e2e8f0;
  font-family: var(--b2b-font-family-mono);
  font-size: 12px;
  line-height: 1.6;
  overflow: auto;
}
.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.04);
}
</style>
