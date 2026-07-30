<template>
  <div class="text-theme-primary d-flex flex-column">
    <!-- 로컬 타이틀 + 툴바 (전역 브레드크럼 헤더는 MainLayout 이 제공) -->
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div>
        <h4 class="b2b-text-h1 fw-bold m-0 d-inline-flex align-items-center gap-2">
          Real Pivot Engine
          <span class="b2b-badge b2b-badge-success">No-License</span>
        </h4>
        <p class="text-theme-secondary b2b-text-sm mb-0 mt-1">
          필드를 드래그해 행·열·값 영역에 배치하면 실시간으로 교차 집계됩니다. (순수 클라이언트 피벗 엔진)
        </p>
      </div>
      <div class="d-flex align-items-center gap-1">
        <button class="btn-b2b-action" title="소계 표시/숨김" @click="showSubtotals = !showSubtotals">
          <i class="bi" :class="showSubtotals ? 'bi-toggle-on text-primary' : 'bi-toggle-off text-secondary'"></i>
          <span>소계</span>
        </button>
        <button class="btn-b2b-action" title="CSV 파일로 내보내기" @click="exportCsv">
          <i class="bi bi-filetype-csv text-success"></i>
          <span>CSV</span>
        </button>
        <button class="btn-b2b-action" title="필드 배치 초기화" @click="resetLayout">
          <i class="bi bi-arrow-counterclockwise text-warning"></i>
          <span>초기화</span>
        </button>
      </div>
    </div>

    <div class="row g-3 align-items-stretch flex-grow-1">
      <!-- ============ 좌측: 필드 설정 패널 (실제 DnD) ============ -->
      <div class="col-xl-3 col-lg-4">
        <div class="b2b-card h-100 d-flex flex-column">
          <div class="b2b-card-header bg-theme-subcard py-2 px-3">
            <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
              <i class="bi bi-grid-3x3-gap text-primary"></i>피벗 필드
            </span>
            <span class="b2b-badge b2b-badge-secondary">드래그 &amp; 드롭</span>
          </div>

          <div class="b2b-card-body p-3 d-flex flex-column gap-3 overflow-auto">
            <!-- 사용 가능한 필드 (미배치) -->
            <div
              class="pivot-zone pivot-zone--pool"
              :class="{ 'pivot-zone--over': dragOverZone === 'none' }"
              @dragover.prevent="dragOverZone = 'none'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('none', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-inbox me-1"></i>사용 가능한 필드
              </div>
              <div class="d-flex flex-wrap gap-1">
                <div
                  v-for="f in poolFields"
                  :key="f.id"
                  class="pivot-chip"
                  :class="`pivot-chip--${f.kind}`"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                  @dragend="dragOverZone = null"
                  @click="cycleZone(f)"
                  :title="'클릭: 다음 영역으로 이동 · 드래그해서 배치'"
                >
                  <i class="bi bi-grip-vertical opacity-50"></i>
                  <span>{{ f.label }}</span>
                  <span class="pivot-chip__type">{{ f.kind === 'measure' ? '값' : '분류' }}</span>
                </div>
                <span v-if="poolFields.length === 0" class="text-theme-secondary b2b-text-sm py-1">
                  모든 필드가 배치되었습니다.
                </span>
              </div>
            </div>

            <!-- 행(Row) 존 -->
            <div
              class="pivot-zone pivot-zone--row"
              :class="{ 'pivot-zone--over': dragOverZone === 'row' }"
              @dragover.prevent="dragOverZone = 'row'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('row', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-list-nested me-1"></i>행 (Rows)
                <span class="text-theme-secondary">· 위→아래 중첩</span>
              </div>
              <div class="d-flex flex-wrap gap-1">
                <div
                  v-for="f in rowFields"
                  :key="f.id"
                  class="pivot-chip pivot-chip--row"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                  @dragover.prevent.stop
                  @drop.stop="onDropBefore(f, $event)"
                >
                  <i class="bi bi-grip-vertical opacity-50"></i>
                  <span>{{ f.label }}</span>
                  <button class="pivot-chip__remove" title="제거" @click.stop="removeField(f)">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
              <span v-if="rowFields.length === 0" class="pivot-zone__hint">분류 필드를 놓으세요</span>
            </div>

            <!-- 열(Column) 존 -->
            <div
              class="pivot-zone pivot-zone--col"
              :class="{ 'pivot-zone--over': dragOverZone === 'col' }"
              @dragover.prevent="dragOverZone = 'col'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('col', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-layout-three-columns me-1"></i>열 (Columns)
                <span class="text-theme-secondary">· 좌→우 중첩</span>
              </div>
              <div class="d-flex flex-wrap gap-1">
                <div
                  v-for="f in colFields"
                  :key="f.id"
                  class="pivot-chip pivot-chip--col"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                  @dragover.prevent.stop
                  @drop.stop="onDropBefore(f, $event)"
                >
                  <i class="bi bi-grip-vertical opacity-50"></i>
                  <span>{{ f.label }}</span>
                  <button class="pivot-chip__remove" title="제거" @click.stop="removeField(f)">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
              <span v-if="colFields.length === 0" class="pivot-zone__hint">분류 필드를 놓으세요</span>
            </div>

            <!-- 값(Value) 존 : 집계함수 선택 포함 -->
            <div
              class="pivot-zone pivot-zone--value"
              :class="{ 'pivot-zone--over': dragOverZone === 'value' }"
              @dragover.prevent="dragOverZone = 'value'"
              @dragleave="dragOverZone = null"
              @drop="onDropZone('value', $event)"
            >
              <div class="pivot-zone__title">
                <i class="bi bi-calculator me-1"></i>값 (Values)
              </div>
              <div class="d-flex flex-column gap-1">
                <div
                  v-for="f in valueFields"
                  :key="f.id"
                  class="pivot-value-row"
                  draggable="true"
                  @dragstart="onDragStart(f, $event)"
                >
                  <i class="bi bi-grip-vertical opacity-50"></i>
                  <select
                    class="form-select form-select-sm pivot-agg-select"
                    :value="f.agg"
                    @change="setAgg(f, $event.target.value)"
                    @click.stop
                  >
                    <option v-for="a in aggOptions(f)" :key="a.value" :value="a.value">{{ a.label }}</option>
                  </select>
                  <span class="pivot-value-row__name">{{ f.label }}</span>
                  <button class="pivot-chip__remove" title="제거" @click.stop="removeField(f)">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <span v-if="valueFields.length === 0" class="pivot-zone__hint">집계할 값 필드를 놓으세요</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 우측: 피벗 결과 + 코드 ============ -->
      <div class="col-xl-9 col-lg-8 d-flex flex-column gap-3">
        <!-- 피벗 결과 그리드 -->
        <div class="b2b-card d-flex flex-column">
          <div class="b2b-card-header bg-theme-card py-2 px-3">
            <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
              <i class="bi bi-table text-warning"></i>피벗 결과
            </span>
            <span class="text-theme-secondary b2b-text-sm">
              {{ pivot.rowKeys.length }}행 × {{ pivot.leafCols.length }}열 · 원본 {{ dataset.length }}건 집계
            </span>
          </div>

          <div class="b2b-card-body p-0">
            <div v-if="valueFields.length === 0" class="pivot-empty">
              <i class="bi bi-arrow-left-circle me-2"></i>좌측 <b>값(Values)</b> 영역에 필드를 배치하면 집계가 시작됩니다.
            </div>

            <div v-else class="pivot-table-scroll">
              <table class="pivot-table tabular-nums">
                <thead>
                  <!-- 상단: 열 필드 그룹 -->
                  <tr>
                    <th class="pivot-corner" :rowspan="pivot.headerDepth" :colspan="1">
                      {{ pivot.rowHeaderLabel }}
                    </th>
                    <template v-if="pivot.hasCols">
                      <th
                        v-for="(g, i) in pivot.colGroups"
                        :key="'cg' + i"
                        class="pivot-colgroup"
                        :colspan="g.colspan"
                      >{{ g.label }}</th>
                      <th class="pivot-colgroup pivot-total-head" :colspan="valueFields.length">총계</th>
                    </template>
                    <template v-else>
                      <th
                        v-for="(lc, i) in pivot.leafCols"
                        :key="'m' + i"
                        class="pivot-measure-head"
                      >{{ lc.headerLabel }}</th>
                    </template>
                  </tr>
                  <!-- 하단: 측정값 라벨 (열 필드가 있을 때만) -->
                  <tr v-if="pivot.hasCols">
                    <th
                      v-for="(lc, i) in pivot.leafColsWithTotal"
                      :key="'ml' + i"
                      class="pivot-measure-head"
                      :class="{ 'pivot-total-head': lc.isTotal }"
                    >{{ lc.headerLabel }}</th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="(row, rIdx) in pivot.bodyRows" :key="'r' + rIdx">
                    <!-- 소계 행 -->
                    <tr v-if="row.type === 'subtotal'" class="pivot-subtotal-row">
                      <th class="pivot-rowhead">{{ row.label }}</th>
                      <td
                        v-for="(v, cIdx) in row.cells"
                        :key="cIdx"
                        :class="{ 'pivot-total-cell': pivot.leafColsWithTotal[cIdx].isTotal }"
                      >{{ fmtCell(v, cIdx) }}</td>
                    </tr>
                    <!-- 데이터 행 -->
                    <tr v-else class="pivot-data-row">
                      <th class="pivot-rowhead" v-html="row.labelHtml"></th>
                      <td
                        v-for="(v, cIdx) in row.cells"
                        :key="cIdx"
                        :class="{ 'pivot-total-cell': pivot.leafColsWithTotal[cIdx].isTotal }"
                      >{{ fmtCell(v, cIdx) }}</td>
                    </tr>
                  </template>
                </tbody>

                <tfoot>
                  <tr class="pivot-grand-row">
                    <th class="pivot-rowhead">총계</th>
                    <td
                      v-for="(v, cIdx) in pivot.footer"
                      :key="cIdx"
                      :class="{ 'pivot-total-cell': pivot.leafColsWithTotal[cIdx].isTotal }"
                    >{{ fmtCell(v, cIdx) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- 하단 좌우: SDK 스니펫 + 구현방식 비교 -->
        <div class="row g-3">
          <div class="col-lg-6">
            <div class="b2b-card h-100 d-flex flex-column">
              <div class="b2b-card-header bg-theme-subcard py-2 px-3">
                <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
                  <i class="bi bi-code-slash text-primary"></i>현재 구성 · 연동 코드
                </span>
                <button class="btn-b2b-action btn-sm" @click="copyCode">
                  <i class="bi bi-clipboard"></i><span>{{ copied ? '복사됨' : '복사' }}</span>
                </button>
              </div>
              <div class="b2b-card-body p-0 flex-grow-1">
                <pre class="pivot-code"><code>{{ sdkCode }}</code></pre>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="b2b-card h-100 d-flex flex-column">
              <div class="b2b-card-header bg-theme-subcard py-2 px-3">
                <span class="b2b-text-h2 text-theme-primary d-flex align-items-center gap-2">
                  <i class="bi bi-check2-circle text-success"></i>피벗 구현 방식 비교
                </span>
              </div>
              <div class="b2b-card-body p-0">
                <table class="table table-sm align-middle mb-0 b2b-text-sm text-center pivot-compare">
                  <thead>
                    <tr>
                      <th class="text-start">구분</th>
                      <th>본 페이지<br>(자체 엔진)</th>
                      <th>RealPivot<br>(전용 라이선스)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-start">라이선스</td>
                      <td><span class="b2b-badge b2b-badge-success">불필요</span></td>
                      <td><span class="b2b-badge b2b-badge-danger">별도 필요</span></td>
                    </tr>
                    <tr>
                      <td class="text-start">동적 드래그 피벗</td>
                      <td>⭕</td><td>⭕</td>
                    </tr>
                    <tr>
                      <td class="text-start">대용량(수십만 행)</td>
                      <td>△ 서버 집계 권장</td>
                      <td>⭕ 가상화 내장</td>
                    </tr>
                    <tr>
                      <td class="text-start">셀 병합·엑셀·인쇄</td>
                      <td>△ 직접 구현</td>
                      <td>⭕ 내장</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 집계함수 정의 (분류형/값형에 따라 선택지 제한)
const AGG_LABELS = { sum: '합계', avg: '평균', min: '최소', max: '최대', count: '건수' }

// db.json fetch 실패 시 사용할 최소 폴백 (동일 스키마)
const FALLBACK_ROWS = [
  { userId: 'u1', name: '김철수', dept: '플랫폼개발팀', role: 'Backend', region: '서울', salary: 6200, joinYear: 2019 },
  { userId: 'u2', name: '이영희', dept: '플랫폼개발팀', role: 'Frontend', region: '판교', salary: 5400, joinYear: 2021 },
  { userId: 'u3', name: '박민수', dept: '데이터팀', role: 'Data', region: '서울', salary: 7100, joinYear: 2018 },
  { userId: 'u4', name: '정수진', dept: '보안팀', role: 'Security', region: '부산', salary: 6800, joinYear: 2020 },
  { userId: 'u5', name: '홍길동', dept: '인프라팀', role: 'DevOps', region: '대전', salary: 5900, joinYear: 2022 },
  { userId: 'u6', name: '강지훈', dept: 'QA팀', role: 'QA', region: '판교', salary: 4800, joinYear: 2023 },
]

export default {
  name: 'RealPivotPage',
  data() {
    return {
      dataset: [],
      loading: true,
      dragOverZone: null,
      showSubtotals: true,
      copied: false,
      // kind: 'dim'(분류) | 'measure'(값). numeric:false 인 값은 건수만 집계 가능.
      // zone: none/row/col/value. 중첩·집계 순서는 배열 순서로 관리.
      fields: [
        { id: 'dept', label: '부서', kind: 'dim', zone: 'row' },
        { id: 'region', label: '근무지', kind: 'dim', zone: 'col' },
        { id: 'role', label: '직군', kind: 'dim', zone: 'none' },
        { id: 'joinYear', label: '입사연도', kind: 'dim', zone: 'none' },
        { id: 'headcount', label: '인원수', kind: 'measure', numeric: false, zone: 'value', agg: 'count' },
        { id: 'salary', label: '연봉(만원)', kind: 'measure', numeric: true, zone: 'value', agg: 'sum' },
      ],
    }
  },
  mounted() {
    this.loadData()
  },
  computed: {
    poolFields() { return this.fields.filter(f => f.zone === 'none') },
    rowFields() { return this.fields.filter(f => f.zone === 'row') },
    colFields() { return this.fields.filter(f => f.zone === 'col') },
    valueFields() { return this.fields.filter(f => f.zone === 'value') },

    // ---- 핵심 피벗 연산 ----
    pivot() {
      const rF = this.rowFields
      const cF = this.colFields
      const vF = this.valueFields
      const data = this.dataset
      const hasCols = cF.length > 0

      // 값 필드가 없으면 빈 모델
      if (vF.length === 0) {
        return {
          rowKeys: [], leafCols: [], leafColsWithTotal: [], colGroups: [],
          bodyRows: [], footer: [], hasCols, headerDepth: 1,
          rowHeaderLabel: '전체',
        }
      }

      const SEP = '␟'
      const distinct = (fieldsArr) => {
        if (fieldsArr.length === 0) return [[]]
        const seen = new Map()
        data.forEach(r => {
          const key = fieldsArr.map(f => r[f.id]).join(SEP)
          if (!seen.has(key)) {
            seen.set(key, fieldsArr.map(f => ({ id: f.id, value: r[f.id] })))
          }
        })
        return [...seen.values()].sort((a, b) => {
          for (let i = 0; i < a.length; i++) {
            const c = String(a[i].value).localeCompare(String(b[i].value), 'ko')
            if (c !== 0) return c
          }
          return 0
        })
      }

      const rowKeys = distinct(rF)
      const colKeys = distinct(cF)

      // 리프 컬럼 = colKey × valueField
      const leafCols = []
      colKeys.forEach(ck => vF.forEach(m => {
        leafCols.push({
          colKey: ck, measure: m, isTotal: false,
          headerLabel: hasCols ? `${AGG_LABELS[m.agg]}·${m.label}` : `${AGG_LABELS[m.agg]}·${m.label}`,
        })
      }))
      // 총계 리프 (열 필드가 있을 때만)
      const totalLeafs = vF.map(m => ({
        colKey: null, measure: m, isTotal: true,
        headerLabel: `${AGG_LABELS[m.agg]}·${m.label}`,
      }))
      const leafColsWithTotal = hasCols ? [...leafCols, ...totalLeafs] : leafCols

      // 상단 열그룹 헤더 (열 필드 조합을 ' · '로 결합해 1행으로 표기)
      const colGroups = colKeys.map(ck => ({
        label: ck.map(x => x.value).join(' · '),
        colspan: vF.length,
      }))

      // 집계기
      const aggregate = (rows, m) => {
        if (m.agg === 'count') return rows.length
        if (rows.length === 0) return null
        const nums = rows.map(r => Number(r[m.id]) || 0)
        switch (m.agg) {
          case 'avg': return nums.reduce((a, b) => a + b, 0) / nums.length
          case 'min': return Math.min(...nums)
          case 'max': return Math.max(...nums)
          case 'sum':
          default: return nums.reduce((a, b) => a + b, 0)
        }
      }
      const match = (r, keyArr) => keyArr.every(k => r[k.id] === k.value)
      // 특정 row/col 키 조합에 대한 리프별 셀 계산
      const cellsFor = (rowKeyArr) => {
        const rowSubset = data.filter(r => match(r, rowKeyArr))
        return leafColsWithTotal.map(lc => {
          const subset = lc.isTotal
            ? rowSubset
            : rowSubset.filter(r => match(r, lc.colKey))
          return aggregate(subset, lc.measure)
        })
      }

      // 본문 행 (소계 삽입)
      const bodyRows = []
      const doSub = this.showSubtotals && rF.length >= 2
      let prevFirst = null
      rowKeys.forEach(rk => {
        if (doSub && prevFirst !== null && rk[0].value !== prevFirst) {
          bodyRows.push(this.buildSubtotal(prevFirst, rF, leafColsWithTotal, data, aggregate, match))
        }
        // 라벨: 이전 행과 겹치는 상위 레벨은 흐리게(머지 느낌)
        const labelHtml = rk.map((x, i) => {
          const cls = i === rk.length - 1 ? 'pivot-lvl-leaf' : 'pivot-lvl-parent'
          return `<span class="${cls}">${this.escapeHtml(x.value)}</span>`
        }).join('<span class="pivot-lvl-sep">›</span>')
        bodyRows.push({ type: 'data', labelHtml, cells: cellsFor(rk) })
        prevFirst = rF.length ? rk[0].value : null
      })
      if (doSub && prevFirst !== null) {
        bodyRows.push(this.buildSubtotal(prevFirst, rF, leafColsWithTotal, data, aggregate, match))
      }

      // 열 합계(footer) = 전체 데이터에 대한 리프별 집계
      const footer = leafColsWithTotal.map(lc => {
        const subset = lc.isTotal ? data : data.filter(r => match(r, lc.colKey))
        return aggregate(subset, lc.measure)
      })

      return {
        rowKeys, colKeys, leafCols, leafColsWithTotal, colGroups, bodyRows, footer,
        hasCols,
        headerDepth: hasCols ? 2 : 1,
        rowHeaderLabel: rF.map(f => f.label).join(' / ') || '전체',
      }
    },

    sdkCode() {
      const rf = this.rowFields.map(f => `"${f.id}"`).join(', ') || '/* 없음 */'
      const cf = this.colFields.map(f => `"${f.id}"`).join(', ') || '/* 없음 */'
      const vf = this.valueFields
        .map(f => `  { field: "${f.id}", agg: "${f.agg}" }`)
        .join(',\n') || '  /* 값 필드를 추가하세요 */'
      return [
        '// 순수 클라이언트 피벗 — 외부 라이선스 불필요',
        'const pivot = createPivot(dataset)',
        `pivot.rows(${rf})`,
        `pivot.cols(${cf})`,
        'pivot.values([',
        vf,
        '])',
        `pivot.subtotals(${this.showSubtotals})`,
        'pivot.render("#pivot-container")',
      ].join('\n')
    },
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('db.json fetch 실패')
        const data = await res.json()
        const rows = Array.isArray(data) ? data : (data.users || [])
        this.dataset = rows.length ? rows : FALLBACK_ROWS
      } catch (e) {
        console.warn('[RealPivot] db.json 로드 실패 → 폴백 사용:', e)
        this.dataset = FALLBACK_ROWS
      } finally {
        this.loading = false
      }
    },
    aggOptions(f) {
      // 숫자형 값 필드만 합계/평균/최소/최대 가능. 그 외(분류형·인원수)는 건수만.
      const canMath = f.kind === 'measure' && f.numeric !== false
      const keys = canMath ? ['sum', 'avg', 'min', 'max', 'count'] : ['count']
      return keys.map(k => ({ value: k, label: AGG_LABELS[k] }))
    },
    setAgg(f, agg) {
      const target = this.fields.find(x => x.id === f.id)
      if (target) target.agg = agg
    },

    // ---- 드래그 앤 드롭 ----
    onDragStart(field, evt) {
      evt.dataTransfer.effectAllowed = 'move'
      evt.dataTransfer.setData('text/plain', field.id)
    },
    onDropZone(zone, evt) {
      this.dragOverZone = null
      const id = evt.dataTransfer.getData('text/plain')
      this.assignZone(id, zone)
    },
    onDropBefore(targetField, evt) {
      // 같은 존 안에서 target 앞에 삽입 (중첩 순서 제어)
      const id = evt.dataTransfer.getData('text/plain')
      if (!id || id === targetField.id) return
      this.moveBefore(id, targetField)
    },
    assignZone(id, zone) {
      const idx = this.fields.findIndex(f => f.id === id)
      if (idx === -1) return
      const field = this.fields[idx]
      // 값 영역엔 값(measure)만 — 분류형이 오면 건수 집계로 허용
      if (zone === 'value' && field.agg == null) field.agg = 'count'
      field.zone = zone
      // 배열 맨 뒤로 이동시켜 해당 존에서 마지막에 렌더(= 드롭 순서 반영)
      this.fields.splice(idx, 1)
      this.fields.push(field)
    },
    moveBefore(id, targetField) {
      const from = this.fields.findIndex(f => f.id === id)
      if (from === -1) return
      const field = this.fields[from]
      field.zone = targetField.zone
      this.fields.splice(from, 1)
      const to = this.fields.findIndex(f => f.id === targetField.id)
      this.fields.splice(to, 0, field)
    },
    cycleZone(f) {
      const cycle = f.kind === 'measure'
        ? ['none', 'row', 'col', 'value']
        : ['none', 'row', 'col']
      const cur = cycle.indexOf(f.zone)
      this.assignZone(f.id, cycle[(cur + 1) % cycle.length])
    },
    removeField(f) {
      this.assignZone(f.id, 'none')
    },
    resetLayout() {
      this.fields.forEach(f => { f.zone = 'none' })
      const def = { dept: 'row', region: 'col', headcount: 'value', salary: 'value' }
      Object.entries(def).forEach(([id, zone]) => {
        const f = this.fields.find(x => x.id === id)
        if (f) f.zone = zone
      })
      // 집계함수도 기본값으로 복구
      const hc = this.fields.find(f => f.id === 'headcount'); if (hc) hc.agg = 'count'
      const sal = this.fields.find(f => f.id === 'salary'); if (sal) sal.agg = 'sum'
      this.showSubtotals = true
    },

    // ---- 소계 행 빌더 ----
    buildSubtotal(firstValue, rF, leafColsWithTotal, data, aggregate, match) {
      const firstId = rF[0].id
      const groupRows = data.filter(r => r[firstId] === firstValue)
      const cells = leafColsWithTotal.map(lc => {
        const subset = lc.isTotal ? groupRows : groupRows.filter(r => match(r, lc.colKey))
        return aggregate(subset, lc.measure)
      })
      return { type: 'subtotal', label: `소계 · ${firstValue}`, cells }
    },

    // ---- 포맷 ----
    fmtCell(v, cIdx) {
      if (v === null || v === undefined) return '–'
      const lc = this.pivot.leafColsWithTotal[cIdx]
      const agg = lc?.measure?.agg
      const digits = agg === 'avg' ? 1 : 0
      return Number(v).toLocaleString('ko-KR', {
        minimumFractionDigits: digits, maximumFractionDigits: digits,
      })
    },
    escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
      ))
    },

    // ---- 내보내기 / 복사 ----
    exportCsv() {
      const p = this.pivot
      if (p.leafColsWithTotal.length === 0) return
      const esc = (s) => {
        const str = String(s ?? '')
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
      }
      const header = [p.rowHeaderLabel, ...p.leafColsWithTotal.map(lc => {
        const grp = lc.isTotal ? '총계' : (lc.colKey || []).map(x => x.value).join(' · ')
        return grp ? `${grp} / ${lc.headerLabel}` : lc.headerLabel
      })]
      const lines = [header.map(esc).join(',')]
      p.bodyRows.forEach(row => {
        const label = row.type === 'subtotal'
          ? row.label
          : row.labelHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        lines.push([label, ...row.cells.map((v, i) => this.fmtCell(v, i).replace(/,/g, ''))].map(esc).join(','))
      })
      lines.push(['총계', ...p.footer.map((v, i) => this.fmtCell(v, i).replace(/,/g, ''))].map(esc).join(','))
      const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pivot_result.csv'
      a.click()
      URL.revokeObjectURL(url)
    },
    async copyCode() {
      try {
        await navigator.clipboard.writeText(this.sdkCode)
        this.copied = true
        setTimeout(() => { this.copied = false }, 1500)
      } catch (e) { /* clipboard 미지원 무시 */ }
    },
  },
}
</script>

<style scoped>
/* ===== 필드 존 (드롭 타깃) ===== */
.pivot-zone {
  border: 1.5px dashed var(--border-color);
  border-radius: 6px;
  padding: 8px 10px 10px;
  background: var(--bg-subcard);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.pivot-zone--over {
  border-color: var(--b2b-color-primary);
  border-style: solid;
  background: var(--b2b-color-primary-subtle);
  box-shadow: 0 0 0 3px var(--b2b-color-primary-subtle);
}
.pivot-zone--pool { background: transparent; }
.pivot-zone__title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 6px;
  letter-spacing: 0.01em;
}
.pivot-zone__hint {
  display: inline-block;
  font-size: 11px;
  color: var(--text-muted);
  padding: 4px 2px;
}

/* ===== 필드 칩 ===== */
.pivot-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px 4px 4px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  cursor: grab;
  user-select: none;
  border: 1px solid transparent;
  background: var(--bg-card);
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
.pivot-chip:active { cursor: grabbing; }
.pivot-chip--dim,
.pivot-chip--measure { border-color: var(--border-color); }
.pivot-chip--row { border-left: 3px solid #2563EB; }
.pivot-chip--col { border-left: 3px solid #0891B2; }
.pivot-chip__type {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 999px;
  background: var(--bg-subcard);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
.pivot-chip__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 10px;
}
.pivot-chip__remove:hover { background: var(--b2b-color-danger); color: #fff; }

/* ===== 값 필드 행 (집계 셀렉트 포함) ===== */
.pivot-value-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px 3px 4px;
  border-radius: 5px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-left: 3px solid #16A34A;
  cursor: grab;
}
.pivot-value-row__name { font-size: 12px; font-weight: 600; flex: 1 1 auto; }
.pivot-agg-select {
  width: auto;
  min-width: 66px;
  height: 24px;
  padding: 0 20px 0 6px;
  font-size: 11px;
  font-weight: 600;
}

/* ===== 피벗 테이블 ===== */
.pivot-table-scroll {
  overflow: auto;
  max-height: 62vh;
}
.pivot-empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
.pivot-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-size: 12.5px;
  white-space: nowrap;
}
.pivot-table th,
.pivot-table td {
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 5px 10px;
}
.pivot-table thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: var(--bg-header);
  color: var(--text-primary);
  font-weight: 700;
  text-align: center;
  border-top: 1px solid var(--border-color);
}
.pivot-corner,
.pivot-rowhead {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--bg-subcard);
  text-align: left;
  font-weight: 600;
}
.pivot-corner { z-index: 4; }
.pivot-table td { text-align: right; color: var(--text-primary); }
.pivot-data-row:nth-child(even) td { background: color-mix(in srgb, var(--bg-subcard) 45%, transparent); }
.pivot-data-row:hover td,
.pivot-data-row:hover .pivot-rowhead { background: var(--b2b-color-primary-subtle); }

.pivot-total-head { background: var(--bg-subcard) !important; color: var(--b2b-color-primary) !important; }
.pivot-total-cell { background: color-mix(in srgb, var(--b2b-color-primary-subtle) 60%, transparent); font-weight: 700; }

.pivot-subtotal-row td,
.pivot-subtotal-row .pivot-rowhead {
  background: color-mix(in srgb, var(--bg-header) 70%, transparent);
  font-weight: 700;
  color: var(--text-primary);
}
.pivot-grand-row td,
.pivot-grand-row .pivot-rowhead {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--bg-header);
  font-weight: 800;
  color: var(--b2b-color-primary);
  border-top: 2px solid var(--b2b-color-primary);
}
.pivot-grand-row .pivot-rowhead { z-index: 3; }

/* 행 라벨 계층 표시 */
:deep(.pivot-lvl-parent) { color: var(--text-secondary); font-weight: 500; }
:deep(.pivot-lvl-leaf) { color: var(--text-primary); font-weight: 700; }
:deep(.pivot-lvl-sep) { color: var(--text-muted); margin: 0 5px; }

/* ===== 코드 스니펫 ===== */
.pivot-code {
  margin: 0;
  height: 100%;
  min-height: 180px;
  padding: 12px 14px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: var(--b2b-font-family-mono);
  font-size: 11.5px;
  line-height: 1.6;
  overflow: auto;
  border-radius: 0 0 var(--b2b-radius-md) var(--b2b-radius-md);
}

/* ===== 비교표 ===== */
.pivot-compare th { color: var(--text-secondary); font-weight: 600; }
.pivot-compare td { color: var(--text-primary); }
</style>
