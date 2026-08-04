<template>
  <div class="realgrid-js-wrapper w-100">
    <div ref="gridElement" class="w-100" :style="{ height: height }"></div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-white.css'
import { markRaw } from 'vue'

/**
 * RealGrid 일반 그리드 — 자기완결 STANDALONE 버전
 * =========================================================
 * GridView + LocalDataProvider 기반 그리드.
 *
 * ⭐ 이식성(Portability): 프로젝트 전용 모듈에 의존하지 않는다.
 *    - 공통 로직(테마/제어열/엑셀/검색/변경추적/고정)을 mixin 대신 이 파일에 인라인.
 *    - 외부 import 는 `realgrid`, `vue` 뿐. (@/stores, @/utils, @/mixins 미참조)
 *    - 테마: `theme` prop 또는 <html data-theme> 자동 감지(없으면 'light').
 *    - 토스트: `toast` 함수 prop 주입(없으면 'notify' 이벤트 emit + console 폴백).
 *    → 계층 트리(RealGridTreeJs)와 동일한 자기완결 규약. 파일 1개만 복사하면 동작.
 */
export default {
  name: 'RealGridCommonJs',
  props: {
    // -------------------------------------------------------------------------
    // 📦 [기본 데이터 및 컨테이너 설정]
    // -------------------------------------------------------------------------
    // 그리드 데이터필드 정의 스키마 배열
    fields: { type: Array, default: () => [] },
    // 그리드 visual 컬럼 정의 스키마 배열
    columns: { type: Array, default: () => [] },
    // 바인딩할 데이터 행 배열
    rows: { type: Array, default: () => [] },
    // 그리드 컨테이너 높이 (예: '580px', '100%')
    height: { type: String, default: '580px' },
    // 셀 수정 및 편집 허용 여부 (-able)
    editable: { type: Boolean, default: true },
    // 소프트 삭제된 행을 화면에서 즉시 숨길지 여부
    hideDeletedRows: { type: Boolean, default: false },

    // -------------------------------------------------------------------------
    // ✨ [1. True / False 온-오프 전용] 글로벌 표준 형용사형 (-able / -ible) Props
    // -------------------------------------------------------------------------
    // 컬럼 헤더 클릭 시 데이터 오름/내림차순 정렬 기능 (-able)
    sortable: { type: Boolean, default: true },
    // 컬럼 헤더 자동 드롭다운 필터 기능 (-able)
    filterable: { type: Boolean, default: undefined },
    // 좌측 체크박스 선택열(CheckBar) 표시 여부 (-able)
    checkable: { type: Boolean, default: undefined },
    // 좌측 행번호(Indicator) 열 표시 여부 (-able)
    indicatable: { type: Boolean, default: undefined },
    // 좌측 행 상태(StateBar: 추가/수정/삭제 상태색) 열 표시 여부 (-ible)
    stateBarVisible: { type: Boolean, default: undefined },
    // 마우스 우클릭 행/열 동적 고정 메뉴 허용 여부 (-able)
    pinnable: { type: Boolean, default: undefined },
    // 상단 행 그룹핑 드래그앤드롭 패널 표시 여부 (-able)
    groupable: { type: Boolean, default: undefined },
    // 행 그룹핑 시 그룹화된 셀의 상하 병합 여부 (-able)
    mergeable: { type: Boolean, default: true },
    // 행 그룹핑 시 본문 컬럼 숨김 허용 여부 (-able)
    columnHideable: { type: Boolean, default: false },
    // 체크바 단일 선택(Radio: true) / 다중 선택(Checkbox: false)
    exclusiveSelectable: { type: Boolean, default: false },
    // 셀 이탈 시 편집 내용 자동 커밋 가능 여부 (-able)
    autoCommittable: { type: Boolean, default: true },
    // 하단 합계/소계 푸터(Footer) 영역 표시 여부
    showFooter: { type: Boolean, default: undefined },
    // 행 삭제 시 DB 즉시삭제 대신 삭제상태(Deleted) 표기 여부 (-able)
    softDeletable: { type: Boolean, default: undefined },

    // -------------------------------------------------------------------------
    // ⚙️ [2. 세부 모드 및 값 입력 전용] RealGrid 2 원본 명칭 그대로 유연 입력 Props
    // -------------------------------------------------------------------------
    // 그룹핑 소계 행 계산/표시 방식 ('aggregate' / 'none')
    groupSummaryMode: { type: String, default: 'aggregate' },
    // 컬럼 너비 화면 채움 방식 ('evenFill' / 'none' / 'fill')
    fitStyle: { type: String, default: 'evenFill' },
    // 체크바 선택열 너비(px)
    checkBarWidth: { type: Number, default: 36 },
    // 상태바 열 너비(px)
    stateBarWidth: { type: Number, default: 20 },
    // 초기 좌측 고정 열 개수 (0이면 미고정)
    fixedColCount: { type: Number, default: 0 },
    // 초기 상단 고정 행 개수 (0이면 미고정)
    fixedRowCount: { type: Number, default: 0 },

    // -------------------------------------------------------------------------
    // 🌐 [3. 하이브리드 통-객체 주입] 세부 RealGrid 옵션 오버라이드 객체 Props
    // -------------------------------------------------------------------------
    // 통-객체로 세부 RealGrid 옵션 일괄 넘기기 (Hybrid Pattern)
    options: { type: Object, default: () => ({}) },
    // options 와 동의어 (Hybrid Pattern)
    gridOptions: { type: Object, default: () => ({}) },

    // -------------------------------------------------------------------------
    // 🔄 [4. 레거시 구버전 명칭 호환용] (Legacy Fallback Props)
    // -------------------------------------------------------------------------
    // groupable 의 구버전 호환 이름
    useGroupPanel: { type: Boolean, default: false },
    // showFooter 의 구버전 호환 이름
    useFooter: { type: Boolean, default: false },
    // softDeletable 의 구버전 호환 이름
    softDeleting: { type: Boolean, default: true },
    // stateBarVisible 의 구버전 호환 이름
    useStateBar: { type: Boolean, default: true },
    // checkable 의 구버전 호환 이름
    useCheckBar: { type: Boolean, default: true },
    // indicatable 의 구버전 호환 이름
    useIndicator: { type: Boolean, default: true },
    // pinnable 의 구버전 호환 이름
    useFixContextMenu: { type: Boolean, default: true },
    // filterable 의 구버전 호환 이름
    useColumnFilter: { type: Boolean, default: true },

    // -------------------------------------------------------------------------
    // 🔌 [5. 이식성 의존성 주입 (선택)]
    // -------------------------------------------------------------------------
    // '' 이면 <html data-theme>에서 자동 감지
    theme: { type: String, default: '' },
    // (message, {type}) 알림 콜백
    toast: { type: Function, default: null }
  },
  emits: ['init', 'notify'],
  computed: {
    resolvedSortable() {
      return this.sortable
    },
    resolvedFilterable() {
      return this.filterable !== undefined ? this.filterable : this.useColumnFilter
    },
    resolvedCheckable() {
      return this.checkable !== undefined ? this.checkable : this.useCheckBar
    },
    resolvedIndicatable() {
      return this.indicatable !== undefined ? this.indicatable : this.useIndicator
    },
    resolvedStateBarVisible() {
      return this.stateBarVisible !== undefined ? this.stateBarVisible : this.useStateBar
    },
    resolvedPinnable() {
      return this.pinnable !== undefined ? this.pinnable : this.useFixContextMenu
    },
    resolvedGroupable() {
      return this.groupable !== undefined ? this.groupable : this.useGroupPanel
    },
    resolvedShowFooter() {
      return this.showFooter !== undefined ? this.showFooter : this.useFooter
    },
    resolvedSoftDeletable() {
      return this.softDeletable !== undefined ? this.softDeletable : this.softDeleting
    }
  },
  watch: {
    theme() {
      this.applyGridTheme(this._resolveTheme())
    },
    rows: {
      deep: true,
      handler(newRows) {
        if (this.dataProvider) this.dataProvider.setRows(newRows || [])
      }
    },
    fields: {
      deep: true,
      handler(newFields) {
        if (this.dataProvider && newFields && newFields.length > 0) {
          this.dataProvider.setFields(newFields)
        }
      }
    },
    columns: {
      deep: true,
      handler(newColumns) {
        if (this.gridView && newColumns && newColumns.length > 0) {
          this.gridView.setColumns(newColumns)
        }
      }
    }
  },
  mounted() {
    this.initGrid()
    this.$nextTick(() => {
      this.applyGridTheme(this._resolveTheme())
    })
    this._watchTheme()
  },
  beforeUnmount() {
    if (this._themeObserver) {
      try { this._themeObserver.disconnect() } catch (e) { /* noop */ }
      this._themeObserver = null
    }
    this.destroyGrid()
  },
  methods: {
    // =========================================================
    // 🔌 이식성 헬퍼: 테마 감지 / 알림 (프로젝트 의존성 제거)
    // =========================================================
    _resolveTheme() {
      if (this.theme) return this.theme
      if (typeof document !== 'undefined') {
        return document.documentElement.getAttribute('data-theme') || 'light'
      }
      return 'light'
    },

    _watchTheme() {
      if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return
      this._themeObserver = new MutationObserver(() => {
        this.applyGridTheme(this._resolveTheme())
      })
      this._themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      })
    },

    _notify(message, opts = {}) {
      const type = opts.type || 'info'
      if (typeof this.toast === 'function') {
        try { this.toast(message, opts) } catch (e) { /* noop */ }
        return
      }
      this.$emit('notify', { message, type })
      try { console.log(`[RealGrid:${type}] ${message}`) } catch (e) { /* noop */ }
    },

    // =========================================================
    // 🎨 동적 테마 연동: 제어열(indicator / checkBar / stateBar)
    // =========================================================
    getGridThemeStyles(theme) {
      const isDark = theme === 'dark' || theme === 'dark-navy'
      const isNavy = theme === 'dark-navy'

      if (isDark) {
        const bg     = isNavy ? '#1e293b' : '#1e293b'
        const headBg = isNavy ? '#0f172a' : '#111827'
        const border = isNavy ? '1px solid #334155' : '1px solid #374151'
        const color  = '#f8fafc'
        const cell   = { background: bg, color, borderRight: border }
        const head   = { background: headBg, color, borderBottom: border }
        return {
          indicator: { ...cell, head },
          checkBar:  { ...cell, head },
          stateBar:  { background: bg, borderRight: border },
        }
      } else {
        const cell = { background: '#FFFFFF', color: '#1E293B', borderRight: '1px solid #E2E8F0' }
        const head = { background: '#F1F5F9', color: '#1E293B', borderBottom: '1px solid #E2E8F0' }
        return {
          indicator: { ...cell, head },
          checkBar:  { ...cell, head },
          stateBar:  { background: '#FFFFFF', borderRight: '1px solid #E2E8F0' },
        }
      }
    },

    applyGridTheme(theme) {
      if (!this.gridView) return
      try {
        if (typeof this.gridView.setStyles === 'function') {
          this.gridView.setStyles(this.getGridThemeStyles(theme))
        }
      } catch (e) {
        console.warn('[RealGrid] applyGridTheme error:', e)
      }
    },

    // =========================================================
    // 제어열(Indicator / StateBar / CheckBar)
    // =========================================================
    applyControlBars(customOpts = {}) {
      if (!this.gridView) return

      try {
        this.gridView.setIndicator({
          visible: this.resolvedIndicatable,
          draggableSelectedRows: false,
          ...(customOpts.indicator || {})
        })
      } catch (e) { /* noop */ }

      if (this.resolvedStateBarVisible) {
        this.gridView.setStateBar({
          visible: true,
          width: this.stateBarWidth,
          stateStyles: {
            insert: { background: '#22c55e' },
            update: { background: '#3b82f6' },
            delete: { background: '#ef4444' },
            read:   { background: 'transparent' }
          },
          ...(customOpts.stateBar || {})
        })
      } else {
        this.gridView.setStateBar({ visible: false })
      }

      if (this.resolvedCheckable) {
        this.gridView.setCheckBar({
          visible: true,
          width: this.checkBarWidth,
          exclusive: this.exclusiveSelectable,
          head: 'check',
          headCheckCallback: null,
          ...(customOpts.checkBar || {})
        })
      } else {
        this.gridView.setCheckBar({ visible: false })
      }
    },

    // =========================================================
    // 행/열 고정 + 우클릭 컨텍스트 메뉴
    // =========================================================
    getColumnIndexByName(colName) {
      if (!this.gridView || !colName) return -1
      try {
        if (typeof this.gridView.getColumnIndex === 'function') {
          return this.gridView.getColumnIndex(colName)
        }
        if (typeof this.gridView.columnByName === 'function') {
          const col = this.gridView.columnByName(colName)
          if (col) {
            if (typeof col.displayIndex === 'number' && col.displayIndex >= 0) return col.displayIndex
            if (typeof col.index === 'number' && col.index >= 0) return col.index
          }
        }
        if (typeof this.gridView.getColumns === 'function') {
          const cols = this.gridView.getColumns() || []
          const idx = cols.findIndex(c => c.name === colName || c.fieldName === colName)
          if (idx >= 0) return idx
        }
      } catch (e) {
        console.warn('getColumnIndexByName error:', e)
      }
      return -1
    },

    handleDynamicFixing(item, clickData) {
      if (!this.gridView) return false

      const currentFixed = this.gridView.getFixedOptions ? (this.gridView.getFixedOptions() || {}) : {}
      let colCount = currentFixed.colCount || 0
      let rowCount = currentFixed.rowCount || 0

      if (item.tag === 'fixColumn' && clickData.column) {
        const colIdx = this.getColumnIndexByName(clickData.column)
        if (colIdx >= 0) {
          colCount = colIdx + 1
          this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
          this._notify(`'${clickData.column}' 컬럼까지 열 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'fixRow' && clickData.itemIndex !== undefined && clickData.itemIndex >= 0) {
        rowCount = clickData.itemIndex + 1
        this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
        this._notify(`${rowCount}번째 행까지 행 고정이 적용되었습니다.`, { type: 'success' })
        return true
      } else if (item.tag === 'fixBoth' && clickData.column && clickData.itemIndex !== undefined) {
        const colIdx = this.getColumnIndexByName(clickData.column)
        if (colIdx >= 0 && clickData.itemIndex >= 0) {
          colCount = colIdx + 1
          rowCount = clickData.itemIndex + 1
          this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
          this._notify(`${rowCount}행 x '${clickData.column}'열 동시 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'clearFixing') {
        this.gridView.setFixedOptions({ colCount: 0, rowCount: 0 })
        this._notify('행/열 고정이 해제되었습니다.', { type: 'info' })
        return true
      }
      return false
    },

    /**
     * 우클릭 컨텍스트 메뉴(행/열 고정) 배선. resolvedPinnable prop(기본 true)일 때만.
     * emit('init') 직전에 호출 → 부모가 @init 에서 setContextMenu 재정의하면 그쪽 우선.
     */
    applyFixContextMenu() {
      if (!this.gridView || !this.resolvedPinnable) return
      if (typeof this.gridView.setContextMenu !== 'function') return
      try {
        this.gridView.setContextMenu([
          { label: '📌 선택한 열까지 고정', tag: 'fixColumn' },
          { label: '📌 선택한 행까지 고정', tag: 'fixRow' },
          { label: '📌 선택한 행/열 모두 고정', tag: 'fixBoth' },
          { label: '-' },
          { label: '❌ 고정 해제 (초기화)', tag: 'clearFixing' }
        ])
        // RealGrid 2 우클릭 메뉴 팝업 허용 필수 이벤트 (트리와 동일)
        this.gridView.onContextMenuPopup = () => true
        this.gridView.onContextMenuItemClicked = (grid, item, clickData) => {
          this.handleDynamicFixing(item, clickData)
        }
      } catch (e) {
        console.warn('[RealGrid] applyFixContextMenu error:', e)
      }
    },

    /**
     * 정렬 기능 활성화/비활성화 (sortable prop)
     */
    applySortingOptions() {
      if (!this.gridView) return
      try {
        if (typeof this.gridView.setSortingOptions === 'function') {
          this.gridView.setSortingOptions({ enabled: this.resolvedSortable })
        }
      } catch (e) {
        console.warn('[RealGrid] applySortingOptions error:', e)
      }
    },

    /**
     * 헤더 컬럼 필터 활성화. resolvedFilterable(기본 true)면 filteringOptions 를 켜고
     * 각 컬럼 autoFilter=true 로 설정 → 헤더 필터 아이콘 클릭 시 distinct 값 목록 자동 생성.
     * (RealGrid 공식: column.autoFilter + gridView.setFilteringOptions)
     */
    applyColumnFilters() {
      if (!this.gridView) return
      try {
        this.gridView.setFilteringOptions({ enabled: this.resolvedFilterable })
        if (this.resolvedFilterable) {
          const cols = typeof this.gridView.getColumns === 'function' ? (this.gridView.getColumns() || []) : []
          cols.forEach(c => {
            try { this.gridView.setColumnProperty(c.name, 'autoFilter', true) } catch (e) { /* noop */ }
          })
        }
      } catch (e) {
        console.warn('[RealGrid] applyColumnFilters error:', e)
      }
    },

    // =========================================================
    // 엑셀 내보내기
    // =========================================================
    exportToExcel(fileName = 'RealGrid_Data.xlsx') {
      if (!this.gridView) return
      try {
        const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
        if (typeof this.gridView.exportGrid === 'function') {
          this.gridView.exportGrid({
            type: 'excel',
            target: 'local',
            fileName: name,
            showConfirm: false,
            showProgress: true,
            indicator: 'visible',
            header: 'visible',
            footer: 'visible'
          })
          this._notify(`'${name}' 엑셀 내보내기를 실행했습니다.`, { type: 'success' })
        } else {
          this._notify('RealGrid exportGrid 내장 메서드를 호출할 수 없습니다.', { type: 'warning' })
        }
      } catch (err) {
        console.error('Excel export error:', err)
        this._notify('엑셀 파일 내보내기에 실패했습니다.', { type: 'danger' })
      }
    },

    // =========================================================
    // 컬럼 정보 / 표시 제어
    // =========================================================
    getColumnsInfo() {
      if (!this.gridView) return []
      try {
        const cols = this.gridView.getColumns() || []
        return cols.map(c => ({
          name: c.name,
          headerText: c.header?.text || c.name,
          visible: c.visible !== false
        }))
      } catch (e) {
        return []
      }
    },

    setColumnVisible(colName, visible) {
      if (!this.gridView) return
      try {
        this.gridView.setColumnProperty(colName, 'visible', visible)
      } catch (e) {
        console.warn('setColumnVisible failed:', e)
      }
    },

    // =========================================================
    // 펼치기 / 접기 (그룹)
    // =========================================================
    /** 그룹 행 전체 펼치기 (RowGroup 그리드 전용, 멀티패스). */
    expandAllGroups(passes = 2) {
      if (!this.gridView) return
      for (let pass = 0; pass < passes; pass++) {
        const count = this.gridView.getItemCount()
        for (let i = 0; i < count; i++) {
          try { this.gridView.expandGroup(i, true, true) } catch (e) { /* noop */ }
        }
      }
    },

    /** 그룹 행 전체 접기 (RowGroup 그리드 전용). */
    collapseAllGroups() {
      if (!this.gridView) return
      const count = this.gridView.getItemCount()
      for (let i = count - 1; i >= 0; i--) {
        try { this.gridView.collapseGroup(i, true) } catch (e) { /* noop */ }
      }
    },

    // =========================================================
    // 변경사항 추적 (C / U / D)
    // =========================================================
    getChanges() {
      if (!this.dataProvider) return { created: [], updated: [], deleted: [] }
      const createdIdx = this.dataProvider.getStateRows('created') || []
      const updatedIdx = this.dataProvider.getStateRows('updated') || []
      const deletedIdx = this.dataProvider.getStateRows('deleted') || []
      return {
        created: createdIdx.map(idx => this.dataProvider.getJsonRow(idx)),
        updated: updatedIdx.map(idx => this.dataProvider.getJsonRow(idx)),
        deleted: deletedIdx.map(idx => this.dataProvider.getJsonRow(idx))
      }
    },

    destroyGrid() {
      if (this.gridView) {
        try { this.gridView.destroy() } catch (e) { /* noop */ }
        this.gridView = null
      }
      if (this.dataProvider) {
        try { this.dataProvider.destroy() } catch (e) { /* noop */ }
        this.dataProvider = null
      }
    },

    // =========================================================
    // 그리드 초기화
    // =========================================================
    initGrid() {
      const container = this.$refs.gridElement
      if (!container) return

      const LocalDataProvider = RealGrid.LocalDataProvider || RealGrid.default?.LocalDataProvider
      const GridView = RealGrid.GridView || RealGrid.default?.GridView

      this.dataProvider = markRaw(new LocalDataProvider(true))
      this.gridView = markRaw(new GridView(container))
      this.gridView.setDataSource(this.dataProvider)

      // 🏆 하이브리드 패턴: 낱개 형용사 Prop 기본값 + options/gridOptions 객체 오버라이드 병합
      const customOpts = { ...(this.options || {}), ...(this.gridOptions || {}) }

      this.dataProvider.softDeleting = this.resolvedSoftDeletable
      this.gridView.hideDeletedRows = this.hideDeletedRows

      this.gridView.setEditOptions({
        editable: this.editable,
        insertable: this.editable,
        appendable: this.editable,
        commitWhenLeave: this.autoCommittable,
        ...(customOpts.editOptions || {})
      })

      if (this.fixedColCount > 0 || this.fixedRowCount > 0 || customOpts.fixedOptions) {
        this.gridView.setFixedOptions({
          colCount: this.fixedColCount,
          rowCount: this.fixedRowCount,
          resizable: true,
          ...(customOpts.fixedOptions || {})
        })
      }

      const fitStyleVal = customOpts.fitStyle || this.fitStyle

      this.applyControlBars(customOpts)
      this.gridView.setFooter({ visible: this.resolvedShowFooter, ...(customOpts.footer || {}) })

      // 행 그룹핑 패널 지원 (피벗 A용)
      if (this.resolvedGroupable) {
        this.gridView.setDisplayOptions({ columnMovable: true, fitStyle: fitStyleVal, ...(customOpts.displayOptions || {}) })
        this.gridView.setGroupPanel({ visible: true, ...(customOpts.groupPanel || {}) })
        this.gridView.setGroupingOptions({ enabled: true, ...(customOpts.groupingOptions || {}) })
        this.gridView.setSortingOptions({ enabled: this.resolvedSortable, ...(customOpts.sortingOptions || {}) })
        this.gridView.setRowGroup({
          summaryMode: this.groupSummaryMode,
          mergeMode: this.mergeable,
          hideGroupedColumn: this.columnHideable,
          ...(customOpts.rowGroup || {})
        })
      } else {
        this.gridView.setDisplayOptions({ fitStyle: fitStyleVal, rowHoverType: 'row', ...(customOpts.displayOptions || {}) })
        this.applySortingOptions()
      }

      if (this.fields && this.fields.length > 0) {
        this.dataProvider.setFields(this.fields)
      }
      if (this.columns && this.columns.length > 0) {
        this.gridView.setColumns(this.columns)
      }

      if (this.rows && this.rows.length > 0) {
        this.dataProvider.setRows(this.rows)
      }

      // 우클릭 컨텍스트 메뉴(행/열 고정) 자동 배선 — emit('init') 직전(부모 @init 이 최종 우선)
      this.applyFixContextMenu()
      // 헤더 컬럼 필터 활성화 (filterable / useColumnFilter)
      this.applyColumnFilters()

      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
      this.applyGridTheme(this._resolveTheme())
    }
  }
}
</script>

<style scoped>
.realgrid-js-wrapper {
  position: relative;
}
</style>
