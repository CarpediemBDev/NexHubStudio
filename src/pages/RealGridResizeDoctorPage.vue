<template>
  <div class="b2b-page-container">
    <!-- Toolbar -->
    <div class="b2b-toolbar">
      <div class="d-flex align-items-center justify-content-between w-100">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
            컬럼 리사이즈 진단
          </span>
          <span class="rd-hint d-none d-lg-inline">
            컬럼 경계를 드래그한 뒤 아래 <b>기록 폭</b> 과 <b>화면 폭</b> 이 같은지 본다
          </span>
        </div>
        <div class="d-flex align-items-center gap-2 ms-auto">
          <button class="btn-b2b-action" title="컬럼 순서를 교체해 봅니다 (분야 ↔ 상태)" @click="reorderColumns">
            <i class="bi bi-arrow-left-right text-info me-0.5"></i>
            <span>컬럼 순서 교체 테스트</span>
          </button>
          <button class="btn-b2b-action" title="열 구성을 바꿔 다시 받아온다 (교차표에서 페이지를 넘기는 것과 같다)" @click="loadPage(nextPageNo)">
            <i class="bi bi-arrow-repeat text-primary me-0.5"></i>
            <span>{{ nextPageNo }}페이지 불러오기</span>
          </button>
          <button class="btn-b2b-action" title="그리드를 처음부터 다시 만든다 (새로고침과 같은 상태)" @click="remount">
            <i class="bi bi-recycle text-secondary me-0.5"></i>
            <span>그리드 재생성</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 스위치 -->
    <div class="b2b-card mb-3">
      <div class="b2b-card-header">
        <span class="rd-title"><i class="bi bi-sliders text-primary me-1"></i>재현 스위치</span>
        <span class="rd-hint">
          하나씩 켜 보면 <b>무엇이 증상을 만드는지</b> 갈린다. 스위치를 바꾸면 그리드를 다시 만든다.
        </span>
      </div>
      <div class="b2b-card-body">
        <div class="rd-switches">
          <!-- ① 주입 방식 -->
          <div class="rd-group">
            <div class="rd-group-title">① 컬럼·데이터를 어떻게 넣나</div>
            <label class="form-check rd-radio">
              <input class="form-check-input" type="radio" value="static" v-model="injectMode">
              <span class="form-check-label">
                <b>정적</b> — prop 으로 한 번에 넘긴다 (<code>:columns :fields :rows</code>)
              </span>
            </label>
            <label class="form-check rd-radio">
              <input class="form-check-input" type="radio" value="dynamic" v-model="injectMode">
              <span class="form-check-label">
                <b>동적</b> — 교차표 탭과 같다. 서버에서 열 목록을 받은 뒤
                <code>setFields → setColumns → setRows</code>
              </span>
            </label>
          </div>

          <!-- ② 잠금 -->
          <div class="rd-group">
            <div class="rd-group-title">② 그리드가 <code>beginUpdate</code> 로 잠길 때</div>
            <label class="form-check rd-radio">
              <input class="form-check-input" type="radio" value="none" v-model="lockMode">
              <span class="form-check-label">
                <b>잠그지 않음</b> — <code>try / finally</code> 로 반드시 <code>endUpdate()</code>
              </span>
            </label>
            <label class="form-check rd-radio rd-switch-danger">
              <input class="form-check-input" type="radio" value="during" v-model="lockMode" :disabled="injectMode === 'static'">
              <span class="form-check-label">
                <b>주입 도중 잠김</b> — <code>endUpdate()</code> 누락
                <span class="rd-sub">주입 중 예외가 난 경우. 행이 아예 안 그려져 금방 들킨다</span>
              </span>
            </label>
            <label class="form-check rd-radio rd-switch-danger">
              <input class="form-check-input" type="radio" value="after" v-model="lockMode">
              <span class="form-check-label">
                <b>주입 뒤 잠김</b> — 주입은 정상, 그 뒤 <code>beginUpdate()</code> 만 호출
                <span class="rd-sub">데이터·정렬은 멀쩡하고 리사이즈·필터만 죽는다 — 신고되는 증상</span>
              </span>
            </label>
          </div>

          <!-- ③ 보정 -->
          <div class="rd-group">
            <div class="rd-group-title">③ 보정</div>
            <label class="form-check form-switch rd-switch">
              <input class="form-check-input" type="checkbox" v-model="repaintOn" @change="applyRepaint">
              <span class="form-check-label">
                <code>onLayoutPropertyChanged → resetSize()</code> 보정
                <span class="rd-sub">공통 그리드가 기본으로 걸어 둔 것. 여기서만 끌 수 있다</span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 계기판 -->
    <div class="b2b-card mb-3">
      <div class="b2b-card-header">
        <span class="rd-title"><i class="bi bi-speedometer2 text-primary me-1"></i>실측</span>
        <div class="d-flex align-items-center gap-2 ms-auto">
          <span class="rd-badge" :class="lockState ? 'rd-badge-danger' : 'rd-badge-ok'">
            _updateLock = {{ lockState }}
          </span>
          <span class="rd-badge" :class="mismatchCount ? 'rd-badge-danger' : 'rd-badge-ok'">
            어긋난 컬럼 {{ mismatchCount }}개
          </span>
        </div>
      </div>
      <div class="b2b-card-body">
        <div class="rd-measure">
          <table class="rd-table">
            <thead>
              <tr><th>컬럼</th><th>기록 폭</th><th>화면 폭</th><th>상태</th></tr>
            </thead>
            <tbody>
              <tr v-for="m in measures" :key="m.name" :class="{ 'rd-row-bad': m.bad }">
                <td>{{ m.header }}</td>
                <td class="rd-num">{{ m.layout }}</td>
                <td class="rd-num">{{ m.dom }}</td>
                <td>
                  <span v-if="m.bad" class="rd-badge rd-badge-danger">화면 미반영</span>
                  <span v-else class="rd-badge rd-badge-ok">일치</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="rd-log">
            <div class="rd-log-title">onLayoutPropertyChanged</div>
            <div v-if="!logs.length" class="rd-log-empty">컬럼 경계를 드래그하면 여기에 찍힌다</div>
            <div v-for="(l, i) in logs" :key="i" class="rd-log-row">
              <span class="rd-log-time">{{ l.time }}</span>
              <span class="rd-log-prop">{{ l.prop }}</span>
              <span class="rd-log-val">{{ l.detail }}</span>
            </div>
          </div>
        </div>

        <div class="rd-note">
          <div class="rd-note-row">
            <span class="rd-tag rd-tag-warn">읽는 법</span>
            <span>
              <b>기록 폭</b> 은 <code>saveColumnLayout()</code> 의 <code>width</code>, <b>화면 폭</b> 은 헤더 셀의
              <code>getBoundingClientRect().width</code> 다.
              <code>column.width</code> 나 <code>getColumnProperty(name,'displayWidth')</code> 로 재면
              <b>드래그해도 안 변해서</b> "리사이즈가 아예 안 먹는다"고 오진한다.
            </span>
          </div>
          <div class="rd-note-row">
            <span class="rd-tag rd-tag-ok">기대</span>
            <span>
              기록 폭만 늘고 화면 폭이 그대로면 <b>값은 들어갔는데 다시 그리지 않은 것</b>이다.
              그 상태에서 컬럼 순서를 바꿔 보면 밀린 폭이 한꺼번에 적용된다.
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 그리드 -->
    <div class="b2b-card">
      <div class="b2b-card-header">
        <span class="rd-title">
          <i class="bi bi-grid-3x3 text-primary me-1"></i>
          {{ injectMode === 'dynamic' ? '동적 주입' : '정적 주입' }} · {{ pageNo }}페이지
        </span>
        <span v-if="loadError" class="rd-badge rd-badge-danger ms-2">{{ loadError }}</span>
        <span v-else class="rd-hint">
          제품 열 {{ productColumns.length }}개 · 전체 {{ totalCount }}건 — 페이지마다 열 구성이 달라진다 (교차표와 같다)
        </span>
      </div>
      <div class="b2b-card-body p-2">
        <!--
          동적 주입일 때는 fields/columns/rows prop 을 아예 넘기지 않는다.
          공통 그리드의 rows 워처만 빈 배열을 그대로 반영하기 때문에(fields·columns 는 length>0 일 때만),
          :rows="[]" 로 두면 재렌더마다 새 빈 배열이 만들어져 fillGrid() 가 넣은 행을 지운다.
        -->
        <RealGridCommonJs
          :key="gridKey"
          ref="grid"
          height="420px"
          fit-style="none"
          v-bind="injectMode === 'static' ? { fields: gridFields, columns: gridColumns, rows: gridRows } : {}"
          :editable="false"
          :checkable="false"
          :state-bar-visible="false"
          :sortable="true"
          :filterable="true"
          :show-column-picker="false"
          :show-saved-views="false"
          @init="onGridInit"
        />
      </div>
    </div>
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import { setResizeRepaint } from '@/utils/realgridResizeRepaint'
import { useRegulationStore } from '@/stores/regulationStore'
import { escapeHtml } from '@/utils/stringUtil.js'

/* ---------------- 데이터 ----------------
 * 규제정보 교차표 탭과 같은 API 를 그대로 쓴다 (POST /api/regulations/crosstab).
 * 응답의 columns 가 이 페이지에 나온 제품만 담고 있어, 페이지를 넘기면 열 구성이 달라진다.
 *   { columns: [{ code, name, parentCode, parentName }],
 *     rows:    [{ regInfoId, regNo, fieldNm, regulationNm, standardNm, certNm, productCds: [...], ...Key }],
 *     totalCount }
 */

/* ---------------- 그리드 정의 (규제정보 교차표 탭과 같은 구성) ---------------- */
const BASE_FIELDS = [
  { fieldName: 'regInfoId', dataType: 'number' }, { fieldName: 'statusCd', dataType: 'text' },
  { fieldName: 'regNo', dataType: 'text' }, { fieldName: 'fieldNm', dataType: 'text' },
  { fieldName: 'regulationNm', dataType: 'text' }, { fieldName: 'standardNm', dataType: 'text' },
  { fieldName: 'certNm', dataType: 'text' }, { fieldName: 'fieldKey', dataType: 'text' },
  { fieldName: 'recKey', dataType: 'text' }, { fieldName: 'ruleKey', dataType: 'text' },
  { fieldName: 'stdKey', dataType: 'text' }
]
/** 제품 컬럼의 필드명. 코드가 숫자로 시작할 수 있어 접두사를 붙인다 (교차표와 같은 규칙) */
const prodField = (code) => `p_${code}`

const PAGE_SIZE = 30

const STATUS_NM = { ACTIVE: '시행', REVIEW: '검토', EXPIRED: '만료', DRAFT: '작성중' }
const STATUS_CLS = { ACTIVE: 'success', REVIEW: 'warning', EXPIRED: 'secondary', DRAFT: 'info' }

export default {
  name: 'RealGridResizeDoctorPage',
  components: { RealGridCommonJs },
  data() {
    return {
      gridView: null,
      dataProvider: null,
      gridKey: 0,

      injectMode: 'dynamic',
      lockMode: 'none',
      repaintOn: true,

      store: useRegulationStore(),
      loadError: '',

      pageNo: 1,
      totalCount: 0,
      productColumns: [],
      serverRows: [],

      measures: [],
      logs: [],
      lockState: false
    }
  },
  computed: {
    nextPageNo() {
      const last = Math.max(1, Math.ceil(this.totalCount / PAGE_SIZE))
      return this.pageNo >= last ? 1 : this.pageNo + 1
    },
    mismatchCount() {
      return this.measures.filter((m) => m.bad).length
    },
    gridFields() {
      return BASE_FIELDS.concat(this.productColumns.map((c) => ({ fieldName: prodField(c.code), dataType: 'text' })))
    },
    gridColumns() {
      // 규제정보 교차표 탭의 crosstabColumnDefs() 와 같은 구성 (병합 규칙까지)
      const byRecord = { mergeRule: "values['recKey']" }
      return [
        { name: 'fieldNm', fieldName: 'fieldNm', width: '110', header: { text: '분야' }, styles: { textAlignment: 'center' }, mergeRule: "values['fieldKey']" },
        {
          name: 'statusCd', fieldName: 'statusCd', width: '80', header: { text: '상태' }, styles: { textAlignment: 'center' }, ...byRecord,
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const code = (model && model.value) || ''
              return `<span class="b2b-badge b2b-badge-${STATUS_CLS[code] || 'secondary'}">${escapeHtml(STATUS_NM[code] || code)}</span>`
            }
          }
        },
        { name: 'regNo', fieldName: 'regNo', width: '120', header: { text: '규제번호' }, styles: { textAlignment: 'center' }, ...byRecord },
        { name: 'regulationNm', fieldName: 'regulationNm', width: '200', header: { text: '규제' }, mergeRule: "values['ruleKey']" },
        { name: 'standardNm', fieldName: 'standardNm', width: '200', header: { text: '규격' }, mergeRule: "values['stdKey']" },
        { name: 'certNm', fieldName: 'certNm', width: '180', header: { text: '관리항목' } },
        ...this.productColumns.map((c) => ({
          name: prodField(c.code),
          fieldName: prodField(c.code),
          width: '96',
          header: { text: c.name },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => (model && model.value === 'Y'
              ? '<span class="rd-on" title="적용">●</span>'
              : '<span class="rd-off" title="해당 없음">·</span>')
          }
        }))
      ]
    },
    gridRows() {
      // productCds 배열을 제품 열로 편다 (실제 피벗은 여기)
      return this.serverRows.map((r) => {
        const row = { ...r }
        const has = new Set(r.productCds || [])
        this.productColumns.forEach((c) => { row[prodField(c.code)] = has.has(c.code) ? 'Y' : 'N' })
        return row
      })
    }
  },
  watch: {
    // 스위치를 바꾸면 처음 상태에서 다시 본다 — '첫 리사이즈' 증상이 한 번뿐이라 그래야 비교가 된다
    injectMode() { this.remount() },
    lockMode() { this.remount() }
  },
  async created() {
    // 서버 응답이 그리드 생성보다 늦으면 onGridInit 이 빈 열 목록으로 채우고 끝난다.
    // loadPage 가 끝난 뒤 그리드가 이미 있으면 다시 채워 준다(fill 기본값).
    await this.loadPage(1)
  },
  mounted() {
    this._timer = setInterval(this.measure, 300)
  },
  beforeUnmount() {
    clearInterval(this._timer)
    // 잠긴 채로 떠나지 않는다
    if (this.gridView && this.lockState) {
      try { this.gridView.endUpdate(true) } catch (e) { /* noop */ }
    }
  },
  methods: {
    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider
      this.applyRepaint()

      if (gridView && typeof gridView.setDisplayOptions === 'function') {
        gridView.setDisplayOptions({
          columnMovable: true,
          selectAndImmediateDrag: true
        })
      }

      // 공통 그리드의 보정 뒤에 이어 붙는다 (보정을 지우지 않는다 — realgridResizeRepaint.js)
      gridView.onLayoutPropertyChanged = (grid, layout, prop) => {
        this.logs.unshift({
          time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
          prop,
          detail: prop === 'displayWidth' ? `${layout && layout.column} → ${layout && layout.displayWidth}` : ''
        })
        if (this.logs.length > 12) this.logs.pop()
      }

      if (this.injectMode === 'dynamic') this.fillGrid()
      // 정적 주입은 공통 컴포넌트가 prop 으로 이미 넣었다. 잠금만 여기서 건다
      else if (this.lockMode === 'after') gridView.beginUpdate()
    },

    /** 컬럼 순서를 교체해 본다 (1번째와 2번째 컬럼 위치 swap) */
    reorderColumns() {
      const gv = this.gridView
      if (!gv) return
      try {
        const raw = gv.saveColumnLayout() || []
        if (raw.length >= 2) {
          const colNames = raw.map((it) => it.column || it.name).filter(Boolean)
          const swapped = [colNames[1], colNames[0], ...colNames.slice(2)]
          gv.setColumnLayout(swapped)
          // _updateLock 상태에서도 화면이 즉시 반영되도록 resetSize 호출
          setTimeout(() => {
            if (gv && typeof gv.resetSize === 'function') gv.resetSize()
          }, 30)
        }
      } catch (e) {
        console.error('reorderColumns error:', e)
      }
    },

    /**
     * 교차표 탭과 같은 주입 순서. setFields 가 행을 날리므로 순서가 강제된다.
     *   dp.setFields → gv.setColumns → dp.setRows
     *
     * lockMode 가 잠금 시점을 정한다.
     *  during : 주입을 beginUpdate 로 감싸고 endUpdate 를 부르지 않는다 (주입 중 예외와 같은 상태).
     *           데이터 반영까지 함께 밀려 행이 아예 안 그려진다.
     *  after  : 주입은 정상으로 끝내고(endUpdate 호출), 그 뒤 beginUpdate 만 한 번 더 건다.
     *           데이터·정렬은 멀쩡하고 레이아웃 갱신만 막힌다 — 실제로 신고되는 증상이 이 모양이다.
     */
    fillGrid() {
      const gv = this.gridView
      const dp = this.dataProvider
      if (!gv || !dp) return

      const wrap = this.lockMode !== 'none'
      if (wrap) gv.beginUpdate()
      try {
        dp.setFields(this.gridFields)
        gv.setColumns(this.gridColumns)
        dp.setRows(this.gridRows)
      } finally {
        // during 이면 일부러 풀지 않는다
        if (wrap && this.lockMode !== 'during') gv.endUpdate()
      }

      // 주입이 끝난 뒤 누군가 beginUpdate 만 부르고 간 상태
      if (this.lockMode === 'after') gv.beginUpdate()
    },

    /**
     * 규제정보 교차표 탭과 같은 API 를 그대로 부른다.
     * regInfoIds 를 빈 배열로 주면 서버가 전체를 대상으로 삼는다.
     */
    async loadPage(pageNo, { fill = true } = {}) {
      try {
        const res = await this.store.fetchCrosstab([], { page: pageNo, size: PAGE_SIZE })
        this.pageNo = pageNo
        this.productColumns = (res && res.columns) || []
        this.serverRows = (res && res.rows) || []
        this.totalCount = (res && res.totalCount) || 0
        this.loadError = ''
      } catch (e) {
        this.loadError = `교차표 API 호출 실패 — ${e && e.message ? e.message : e}`
        return
      }
      if (fill && this.injectMode === 'dynamic') {
        await this.$nextTick()
        this.fillGrid()
      }
    },

    /** 그리드를 처음부터 다시 만든다 (새로고침과 같은 상태 — '첫 리사이즈' 증상을 다시 보려면 필요) */
    remount() {
      if (this.gridView && this.lockState) {
        try { this.gridView.endUpdate(true) } catch (e) { /* noop */ }
      }
      this.gridView = null
      this.dataProvider = null
      this.logs = []
      this.measures = []
      this.gridKey += 1
    },

    applyRepaint() {
      if (this.gridView) setResizeRepaint(this.gridView, this.repaintOn)
    },

    /* ---------------- 실측 ---------------- */
    /** 레이아웃에 기록된 폭. column.width 는 드래그해도 안 변하므로 여기를 봐야 한다 */
    layoutWidthOf(name) {
      const walk = (arr) => {
        for (const it of arr) {
          if (it && it.column === name) return it.width
          if (it && it.items) { const r = walk(it.items); if (r) return r }
        }
        return null
      }
      try { return walk(this.gridView.saveColumnLayout()) } catch (e) { return null }
    },
    measure() {
      const gv = this.gridView
      if (!gv) { this.measures = []; return }

      const inner = (gv._container && gv._container._gridView) || gv
      this.lockState = !!inner._updateLock

      const cells = [...this.$el.querySelectorAll('.rg-header-cell')]

      // saveColumnLayout 순서대로 계기판 표시 (컬럼 순서 변경 시 계기판도 실시간 연동)
      let layoutCols = []
      try {
        const walk = (arr) => {
          for (const it of arr) {
            if (typeof it === 'string') layoutCols.push(it)
            else if (it && (it.column || it.name)) layoutCols.push(it.column || it.name)
            if (it && it.items) walk(it.items)
          }
        }
        walk(gv.saveColumnLayout() || [])
      } catch (e) { /* noop */ }

      const colDefMap = new Map(this.gridColumns.map((c) => [c.name, c]))
      const targetList = layoutCols.length > 0
        ? layoutCols.map((name) => colDefMap.get(name)).filter(Boolean)
        : this.gridColumns

      this.measures = targetList.map((col) => {
        const text = col.header.text
        const cell = cells.find((e) => e.textContent.trim() === text)
        const dom = cell ? Math.round(cell.getBoundingClientRect().width) : null
        const layout = this.layoutWidthOf(col.name)
        return {
          name: col.name,
          header: text,
          layout: layout == null ? '-' : layout,
          dom: dom == null ? '-' : dom,
          // 화면에 안 보이는 컬럼(가로 스크롤 밖)은 판정하지 않는다
          bad: layout != null && dom != null && dom > 0 && Math.abs(layout - dom) > 1
        }
      })
    }
  }
}
</script>

<style scoped>
.rd-title { font-size: 0.9rem; font-weight: 600; }
.rd-hint { font-size: 0.78rem; color: var(--bs-secondary-color); margin-left: 0.5rem; }
.rd-sub { display: block; font-size: 0.72rem; color: var(--bs-secondary-color); }

.rd-switches { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
.rd-group { border: 1px solid var(--bs-border-color); border-radius: 0.5rem; padding: 0.75rem; }
.rd-group-title { font-size: 0.78rem; font-weight: 600; color: var(--bs-secondary-color); margin-bottom: 0.5rem; }
.rd-radio, .rd-switch { font-size: 0.82rem; margin-bottom: 0.4rem; }
.rd-switch-danger .form-check-label { color: var(--bs-danger-text-emphasis); }

.rd-measure { display: grid; grid-template-columns: minmax(320px, 1fr) minmax(260px, 1fr); gap: 1rem; }
@media (max-width: 992px) { .rd-measure { grid-template-columns: 1fr; } }

.rd-table { width: 100%; font-size: 0.8rem; border-collapse: collapse; }
.rd-table th, .rd-table td { padding: 0.3rem 0.5rem; border-bottom: 1px solid var(--bs-border-color); }
.rd-table th { font-weight: 600; color: var(--bs-secondary-color); text-align: left; }
.rd-num { text-align: right; font-variant-numeric: tabular-nums; }
.rd-row-bad { background: var(--bs-danger-bg-subtle); }

.rd-badge { display: inline-block; font-size: 0.72rem; padding: 0.1rem 0.4rem; border-radius: 0.25rem; }
.rd-badge-ok { background: var(--bs-success-bg-subtle); color: var(--bs-success-text-emphasis); }
.rd-badge-danger { background: var(--bs-danger-bg-subtle); color: var(--bs-danger-text-emphasis); }

.rd-log { border: 1px solid var(--bs-border-color); border-radius: 0.5rem; padding: 0.5rem; overflow: auto; max-height: 260px; }
.rd-log-title { font-size: 0.75rem; font-weight: 600; color: var(--bs-secondary-color); margin-bottom: 0.35rem; }
.rd-log-empty { font-size: 0.78rem; color: var(--bs-secondary-color); }
.rd-log-row { display: flex; gap: 0.5rem; font-size: 0.75rem; font-family: var(--bs-font-monospace); padding: 0.1rem 0; }
.rd-log-time { color: var(--bs-secondary-color); }
.rd-log-prop { font-weight: 600; }

.rd-note { margin-top: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem; }
.rd-note-row { display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.78rem; }
.rd-tag { flex: none; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 0.25rem; }
.rd-tag-ok { background: var(--bs-success-bg-subtle); color: var(--bs-success-text-emphasis); }
.rd-tag-warn { background: var(--bs-warning-bg-subtle); color: var(--bs-warning-text-emphasis); }
</style>

<style>
.rd-on { color: var(--bs-primary); font-size: 0.9rem; }
.rd-off { color: var(--bs-secondary-color); opacity: 0.5; }
</style>
