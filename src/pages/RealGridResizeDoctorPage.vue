<template>
  <div class="b2b-page-container">
    <!-- Toolbar -->
    <div class="b2b-toolbar">
      <div class="d-flex align-items-center justify-content-between w-100">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
            컬럼 리사이즈 재현
          </span>
          <span class="rd-hint d-none d-lg-inline">
            헤더를 직접 드래그해서 순서 변경은 되고, 리사이즈만 화면에 늦게 반영되는지 확인한다
          </span>
          <div class="rd-tabs ms-2" role="tablist">
            <button
              v-for="t in viewTabs"
              :key="t.key"
              type="button"
              role="tab"
              :class="{ on: viewMode === t.key }"
              :aria-selected="viewMode === t.key"
              @click="selectView(t.key)"
            >
              <i class="bi me-1" :class="t.icon"></i>{{ t.label }}
            </button>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2 ms-auto">
          <button class="btn-b2b-action" title="그리드를 처음부터 다시 만든다 (새로고침과 같은 상태)" @click="remount">
            <i class="bi bi-recycle text-secondary me-0.5"></i>
            <span>그리드 재생성</span>
          </button>
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
            <div v-if="!logs.length" class="rd-log-empty">컬럼 경계나 헤더를 드래그하면 여기에 찍힌다</div>
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
              <b>폭이 안 변한 것처럼 보여서</b> "리사이즈가 아예 안 먹는다"고 오진한다.
            </span>
          </div>
          <div class="rd-note-row">
            <span class="rd-tag rd-tag-ok">기대</span>
            <span>
              기록 폭만 늘고 화면 폭이 그대로면 <b>값은 들어갔는데 다시 그리지 않은 것</b>이다.
              그 상태에서 컬럼 순서를 바꾸면 밀린 폭이 한꺼번에 화면에 적용된다.
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
          {{ currentView.label }} · fields {{ gridFields.length }} · columns {{ gridColumns.length }} · rows {{ gridRows.length }}
        </span>
        <span v-if="loadError" class="rd-badge rd-badge-danger ms-2">{{ loadError }}</span>
        <span v-else-if="loading" class="rd-hint">API 응답을 기다리는 중</span>
        <span v-else class="rd-hint">
          {{ viewMode === 'crosstab'
            ? `제품 열 ${productColumns.length}개 · 전체 ${totalCount}건 — 교차표 API 응답으로 동적 필드를 만든다`
            : `스냅샷 ${totalCount}건 — 초기 빈 배열 후 평면 필드·컬럼·행을 주입한다` }}
        </span>
      </div>
      <div class="b2b-card-body p-2">
        <RealGridCommonJs
          :key="gridKey"
          ref="grid"
          height="420px"
          fit-style="none"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="gridRows"
          :editable="false"
          :checkable="false"
          :state-bar-visible="false"
          :sortable="true"
          :filterable="true"
          :group-panel-visible="false"
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
import { fieldCodes, statusCodes } from '@/data/regulationMock'
import { targetNames } from '@/utils/regulationConflict'
import { itemLines } from '@/utils/regulationTree'

/* ---------------- 데이터 ----------------
 * 규제정보 교차표 탭과 같은 API 를 그대로 쓴다 (POST /api/regulations/crosstab).
 * 응답의 columns 로 제품 열을 동적으로 만든다.
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
const VIEW_TABS = [
  { key: 'flat', label: '평면', icon: 'bi-list-ul' },
  { key: 'crosstab', label: '교차표', icon: 'bi-grid-3x3' }
]

const FLAT_FIELDS = [
  { fieldName: 'regInfoId', dataType: 'number' },
  { fieldName: 'statusCd', dataType: 'text' },
  { fieldName: 'regNo', dataType: 'text' },
  { fieldName: 'title', dataType: 'text' },
  { fieldName: 'itemTxt', dataType: 'text' },
  { fieldName: 'fieldNm', dataType: 'text' },
  { fieldName: 'markNm', dataType: 'text' },
  { fieldName: 'divisionTxt', dataType: 'text' },
  { fieldName: 'productGroupTxt', dataType: 'text' },
  { fieldName: 'productTxt', dataType: 'text' },
  { fieldName: 'regionTxt', dataType: 'text' },
  { fieldName: 'countryTxt', dataType: 'text' },
  { fieldName: 'effectiveDt', dataType: 'text' },
  { fieldName: 'modDt', dataType: 'text' }
]

export default {
  name: 'RealGridResizeDoctorPage',
  components: { RealGridCommonJs },
  data() {
    return {
      gridView: null,
      dataProvider: null,
      gridKey: 0,

      viewMode: 'flat',
      viewTabs: VIEW_TABS,
      repaintOn: false,

      store: useRegulationStore(),
      loadError: '',
      loading: false,

      totalCount: 0,
      productColumns: [],
      gridFields: [],
      gridColumns: [],
      gridRows: [],

      measures: [],
      logs: [],
      lockState: false
    }
  },
  computed: {
    currentView() {
      return VIEW_TABS.find((t) => t.key === this.viewMode) || VIEW_TABS[0]
    },
    mismatchCount() {
      return this.measures.filter((m) => m.bad).length
    }
  },
  async created() {
    // 서버 응답이 그리드 생성보다 늦으면 onGridInit 이 빈 열 목록으로 채우고 끝난다.
    // loadGridData 는 처음에는 빈 배열을 넘기고, API 응답 뒤 fields/columns/rows 배열을 채운다.
    await this.loadGridData(this.viewMode)
  },
  mounted() {
    this._timer = setInterval(this.measure, 300)
  },
  beforeUnmount() {
    clearInterval(this._timer)
    this.unbindResizeDoctorInteractions()
    this.releaseGridLock()
  },
  methods: {
    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider
      this.applyRepaint()

      this.applyHeaderDragOptions()

      // 공통 그리드의 보정 뒤에 이어 붙는다 (보정을 지우지 않는다 — realgridResizeRepaint.js)
      gridView.onLayoutPropertyChanged = (grid, layout, prop) => {
        this.logs.unshift({
          time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
          prop,
          detail: prop === 'displayWidth' ? `${layout && layout.column} → ${layout && layout.displayWidth}` : ''
        })
        if (this.logs.length > 12) this.logs.pop()
      }

      this.bindResizeDoctorInteractions(gridView)
    },

    selectView(mode) {
      if (this.viewMode === mode) return
      this.viewMode = mode
      this.loadGridData(mode)
    },

    async loadGridData(mode = this.viewMode) {
      this.loading = true
      this.loadError = ''
      try {
        this.releaseGridLock()

        const payload = mode === 'crosstab'
          ? await this.createCrosstabPayload()
          : await this.createFlatPayload()

        if (mode !== this.viewMode) return
        await this.applyGridPayload(payload)
      } catch (e) {
        this.loadError = `그리드 데이터 주입 실패 — ${e && e.message ? e.message : e}`
      } finally {
        if (mode === this.viewMode) this.loading = false
      }
    },

    async applyGridPayload({ fields, columns, rows, totalCount, productColumns = [] }) {
      this.productColumns = productColumns
      this.totalCount = totalCount == null ? rows.length : totalCount
      this.measures = []

      // 타 프로젝트 재현용: 처음에는 빈 배열을 넘기고, 응답 후 fields/columns/rows 를 순서대로 채운다.
      this.gridRows = []
      this.gridFields = []
      this.gridColumns = []
      await this.$nextTick()

      this.gridFields = fields
      this.gridColumns = columns
      await this.$nextTick()

      this.gridRows = rows
      await this.$nextTick()

      if (this.gridView && typeof this.gridView.resetSize === 'function') {
        this.applyHeaderDragOptions()
        this.bindResizeDoctorInteractions(this.gridView)
        this.gridView.resetSize()
      }
      setTimeout(() => {
        if (this.gridView) {
          this.applyHeaderDragOptions()
          this.bindResizeDoctorInteractions(this.gridView)
        }
        this.measure()
      }, 60)
    },

    async createFlatPayload() {
      await this.store.ensureLoaded()
      const records = this.store.records.slice(0, PAGE_SIZE)
      return {
        fields: [...FLAT_FIELDS],
        columns: this.createFlatColumns(),
        rows: this.createFlatRows(records),
        totalCount: this.store.records.length,
        productColumns: []
      }
    },

    async createCrosstabPayload() {
      const res = await this.store.fetchCrosstab([], { page: 1, size: PAGE_SIZE })
      const cols = (res && res.columns) || []
      const rows = (res && res.rows) || []
      return {
        fields: BASE_FIELDS.concat(cols.map((c) => ({ fieldName: prodField(c.code), dataType: 'text' }))),
        columns: this.createCrosstabColumns(cols),
        rows: this.createCrosstabRows(rows, cols),
        totalCount: (res && res.totalCount) || 0,
        productColumns: cols
      }
    },

    createFlatColumns() {
      return [
        {
          name: 'statusCd',
          fieldName: 'statusCd',
          width: '80',
          header: { text: '상태' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const code = model?.value || 'REVIEW'
              return `<span class="b2b-badge b2b-badge-${STATUS_CLS[code] || 'secondary'}">${escapeHtml(this.statusName(code))}</span>`
            }
          }
        },
        { name: 'regNo', fieldName: 'regNo', width: '120', header: { text: '규제번호' }, styles: { textAlignment: 'center' } },
        { name: 'title', fieldName: 'title', width: '240', header: { text: '규제명' } },
        { name: 'itemTxt', fieldName: 'itemTxt', width: '260', header: { text: '정보관리항목' } },
        { name: 'fieldNm', fieldName: 'fieldNm', width: '90', header: { text: '분야' }, styles: { textAlignment: 'center' } },
        { name: 'markNm', fieldName: 'markNm', width: '150', header: { text: '인증마크/표시' } },
        { name: 'divisionTxt', fieldName: 'divisionTxt', width: '100', header: { text: '사업부' }, styles: { textAlignment: 'center' } },
        { name: 'productGroupTxt', fieldName: 'productGroupTxt', width: '100', header: { text: '제품군' }, styles: { textAlignment: 'center' } },
        { name: 'productTxt', fieldName: 'productTxt', width: '120', header: { text: '제품' }, styles: { textAlignment: 'center' } },
        { name: 'regionTxt', fieldName: 'regionTxt', width: '80', header: { text: '권역' }, styles: { textAlignment: 'center' } },
        { name: 'countryTxt', fieldName: 'countryTxt', width: '140', header: { text: '국가' } },
        { name: 'effectiveDt', fieldName: 'effectiveDt', width: '96', header: { text: '시행일' }, styles: { textAlignment: 'center' } },
        { name: 'modDt', fieldName: 'modDt', width: '96', header: { text: '최종수정일' }, styles: { textAlignment: 'center' } }
      ]
    },

    createFlatRows(records) {
      return records.map((r) => ({
        regInfoId: r.regInfoId,
        statusCd: r.statusCd,
        regNo: r.regNo,
        title: r.title,
        itemTxt: itemLines(this.store.itemsOf(r.regInfoId)),
        fieldNm: this.fieldName(r.fieldCd),
        markNm: r.markNm,
        divisionTxt: this.summarize(targetNames(r, 'DIVISION')),
        productGroupTxt: this.summarize(targetNames(r, 'PRODUCT_GROUP')),
        productTxt: this.summarize(targetNames(r, 'PRODUCT')) || '전체',
        regionTxt: this.summarize(targetNames(r, 'REGION')),
        countryTxt: targetNames(r, 'COUNTRY').join(', ') || '전체',
        effectiveDt: r.effectiveDt,
        modDt: r.modDt
      }))
    },

    createCrosstabColumns(cols) {
      const byRecord = { mergeRule: "values['recKey']" }
      return [
        { name: 'fieldNm', fieldName: 'fieldNm', width: '110', header: { text: '분야' }, styles: { textAlignment: 'center' }, mergeRule: "values['fieldKey']" },
        {
          name: 'statusCd',
          fieldName: 'statusCd',
          width: '80',
          header: { text: '상태' },
          styles: { textAlignment: 'center' },
          ...byRecord,
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const code = model?.value || ''
              return `<span class="b2b-badge b2b-badge-${STATUS_CLS[code] || 'secondary'}">${escapeHtml(STATUS_NM[code] || code)}</span>`
            }
          }
        },
        { name: 'regNo', fieldName: 'regNo', width: '120', header: { text: '규제번호' }, styles: { textAlignment: 'center' }, ...byRecord },
        { name: 'regulationNm', fieldName: 'regulationNm', width: '200', header: { text: '규제' }, mergeRule: "values['ruleKey']" },
        { name: 'standardNm', fieldName: 'standardNm', width: '200', header: { text: '규격' }, mergeRule: "values['stdKey']" },
        { name: 'certNm', fieldName: 'certNm', width: '180', header: { text: '관리항목' } },
        ...cols.map((c) => ({
          name: prodField(c.code),
          fieldName: prodField(c.code),
          width: '96',
          header: { text: c.name },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => (model?.value === 'Y'
              ? '<span class="rd-on" title="적용">●</span>'
              : '<span class="rd-off" title="해당 없음">·</span>')
          }
        }))
      ]
    },

    createCrosstabRows(rows, cols) {
      return rows.map((r) => {
        const row = { ...r }
        const has = new Set(r.productCds || [])
        cols.forEach((c) => { row[prodField(c.code)] = has.has(c.code) ? 'Y' : 'N' })
        return row
      })
    },

    statusName(code) {
      return (statusCodes.find((s) => s.code === code) || {}).name || STATUS_NM[code] || code
    },

    fieldName(code) {
      return (fieldCodes.find((f) => f.code === code) || {}).name || code
    },

    summarize(list, max = 2) {
      const arr = (list || []).filter(Boolean)
      if (!arr.length) return ''
      return arr.length > max ? `${arr.slice(0, max).join(', ')} 외 ${arr.length - max}` : arr.join(', ')
    },

    /** 그리드를 처음부터 다시 만든다 (새로고침과 같은 상태 — '첫 리사이즈' 증상을 다시 보려면 필요) */
    remount() {
      this.unbindResizeDoctorInteractions()
      this.releaseGridLock()
      this.gridView = null
      this.dataProvider = null
      this.logs = []
      this.measures = []
      this.gridFields = []
      this.gridColumns = []
      this.gridRows = []
      this.gridKey += 1
      this.$nextTick(() => this.loadGridData(this.viewMode))
    },

    applyRepaint() {
      if (this.gridView) setResizeRepaint(this.gridView, this.repaintOn)
    },

    applyHeaderDragOptions() {
      if (!this.gridView || typeof this.gridView.setDisplayOptions !== 'function') return
      this.gridView.setDisplayOptions({
        columnMovable: true,
        selectAndImmediateDrag: true
      })
    },

    isGridLocked(gv = this.gridView) {
      const inner = gv && ((gv._container && gv._container._gridView) || gv)
      return !!(inner && inner._updateLock)
    },

    releaseGridLock() {
      if (!this.gridView || !this.isGridLocked(this.gridView)) return
      try { this.gridView.endUpdate(true) } catch (e) { /* noop */ }
    },

    bindResizeDoctorInteractions(gv) {
      this.unbindResizeDoctorInteractions()
      if (!gv || typeof gv.getContainer !== 'function') return
      const initialContainer = gv.getContainer()
      const eventRoot = document
      if (!initialContainer || !eventRoot || typeof eventRoot.addEventListener !== 'function') return

      const mark = (prop, detail) => {
        this.logs.unshift({
          time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
          prop,
          detail
        })
        if (this.logs.length > 12) this.logs.pop()
      }

      const currentContainer = () => {
        try { return (gv.getContainer && gv.getContainer()) || initialContainer } catch (e) { return initialContainer }
      }

      const findHeaderCell = (event) => {
        const container = currentContainer()
        if (!container) return null

        const direct = event.target && event.target.closest
          ? event.target.closest('.rg-header-cell')
          : null
        if (direct && container.contains(direct)) return direct

        // RealGrid can replace or layer header/body nodes while dynamic columns are injected.
        // In that case the event target may be a renderer/body layer even though the pointer
        // is visually on the header edge, so resolve the header by coordinates as a fallback.
        const cells = [...container.querySelectorAll('.rg-header-cell')]
        return cells.find((cell) => {
          const rect = cell.getBoundingClientRect()
          return rect.width > 0 &&
            rect.height > 0 &&
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        }) || null
      }

      const onMouseDown = (event) => {
        const cell = findHeaderCell(event)
        if (!cell) return

        const rect = cell.getBoundingClientRect()
        const nearResizeEdge = Math.abs(event.clientX - rect.right) <= 6

        if (nearResizeEdge) {
          if (!this.isGridLocked(gv)) {
            try {
              gv.beginUpdate()
              mark('doctorLock', '리사이즈 드래그 시작: 화면 갱신 잠금')
            } catch (e) { /* noop */ }
          }
          return
        }

        if (this.isGridLocked(gv)) {
          try {
            gv.endUpdate(true)
            if (typeof gv.resetSize === 'function') gv.resetSize()
            mark('doctorUnlock', '컬럼 순서 드래그 시작: 밀린 폭 반영')
          } catch (e) { /* noop */ }
        }
      }

      eventRoot.addEventListener('mousedown', onMouseDown, true)
      this._unbindResizeDoctorInteractions = () => {
        eventRoot.removeEventListener('mousedown', onMouseDown, true)
        this._unbindResizeDoctorInteractions = null
      }
    },

    unbindResizeDoctorInteractions() {
      if (this._unbindResizeDoctorInteractions) this._unbindResizeDoctorInteractions()
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

      this.lockState = this.isGridLocked(gv)

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
.rd-tabs { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.15rem; border: 1px solid var(--bs-border-color); border-radius: 0.35rem; background: var(--bs-body-bg); }
.rd-tabs button { border: 0; background: transparent; color: var(--bs-secondary-color); font-size: 0.76rem; font-weight: 600; padding: 0.25rem 0.55rem; border-radius: 0.25rem; }
.rd-tabs button.on { background: var(--bs-primary-bg-subtle); color: var(--bs-primary-text-emphasis); }

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
