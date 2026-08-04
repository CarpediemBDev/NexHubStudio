<template>
  <div class="realgrid-js-wrapper w-100">
    <div ref="gridElement" class="w-100" :style="{ height: height }"></div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-white.css'
import { markRaw } from 'vue'
import { captureViewState, applyViewState } from '@/utils/realgridOps'

/**
 * RealGrid 일반 그리드 — 자기완결 STANDALONE 버전
 * =========================================================
 * GridView + LocalDataProvider 기반 그리드.
 */
export default {
  name: 'RealGridCommonJs',
  props: {
    // -------------------------------------------------------------------------
    // 📦 [기본 데이터 및 컨테이너 설정]
    // -------------------------------------------------------------------------
    fields: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    gridId: { type: String, default: '' },
    height: { type: String, default: '580px' },
    editable: { type: Boolean, default: true },
    hideDeletedRows: { type: Boolean, default: false },

    // -------------------------------------------------------------------------
    // 🔖 [뷰 저장 내장 캡슐화 Props]
    // -------------------------------------------------------------------------
    showSavedViews: { type: Boolean, default: true },
    includeGroupInView: { type: Boolean, default: false },

    // -------------------------------------------------------------------------
    // ✨ [1. 타겟 표준 명칭 Props] (Target Project Standard Spec)
    // -------------------------------------------------------------------------
    showRowNumber: { type: Boolean, default: undefined },
    stateBarVisible: { type: Boolean, default: undefined },
    insertable: { type: Boolean, default: undefined },
    sortable: { type: Boolean, default: true },
    filterable: { type: Boolean, default: undefined },
    checkable: { type: Boolean, default: undefined },
    mergeMode: { type: Boolean, default: undefined },
    useFooter: { type: Boolean, default: undefined },
    commitWhenLeave: { type: Boolean, default: undefined },
    rowResizable: { type: Boolean, default: undefined },
    summaryMode: { type: String, default: undefined },
    groupPanelVisible: { type: Boolean, default: undefined },

    // -------------------------------------------------------------------------
    // ⚙️ [2. 세부 모드 및 입력 전용 Props]
    // -------------------------------------------------------------------------
    fitStyle: { type: String, default: 'evenFill' },
    checkBarWidth: { type: Number, default: 36 },
    stateBarWidth: { type: Number, default: 20 },
    fixedColCount: { type: Number, default: 0 },
    fixedRowCount: { type: Number, default: 0 },
    columnHideable: { type: Boolean, default: false },
    exclusiveSelectable: { type: Boolean, default: false },
    pinnable: { type: Boolean, default: undefined },

    // -------------------------------------------------------------------------
    // 🌐 [3. 하이브리드 통-객체 주입]
    // -------------------------------------------------------------------------
    options: { type: Object, default: () => ({}) },
    gridOptions: { type: Object, default: () => ({}) },

    // -------------------------------------------------------------------------
    // 🔄 [4. 레거시/기존 호환 명칭 Fallback Props]
    // -------------------------------------------------------------------------
    indicatable: { type: Boolean, default: undefined },
    useIndicator: { type: Boolean, default: undefined },
    autoCommittable: { type: Boolean, default: undefined },
    groupable: { type: Boolean, default: undefined },
    useGroupPanel: { type: Boolean, default: undefined },
    groupSummaryMode: { type: String, default: undefined },
    mergeable: { type: Boolean, default: undefined },
    showFooter: { type: Boolean, default: undefined },
    useStateBar: { type: Boolean, default: undefined },
    useCheckBar: { type: Boolean, default: undefined },
    useFixContextMenu: { type: Boolean, default: undefined },
    useColumnFilter: { type: Boolean, default: undefined },
    softDeletable: { type: Boolean, default: undefined },
    softDeleting: { type: Boolean, default: undefined },

    // -------------------------------------------------------------------------
    // 🔌 [5. 이식성 의존성 주입]
    // -------------------------------------------------------------------------
    theme: { type: String, default: '' },
    toast: { type: Function, default: null }
  },
  emits: ['init', 'notify'],
  data() {
    return {
      savedViews: [],
      activeViewId: null
    }
  },
  computed: {
    resolvedShowRowNumber() {
      if (this.showRowNumber !== undefined) return this.showRowNumber
      if (this.indicatable !== undefined) return this.indicatable
      if (this.useIndicator !== undefined) return this.useIndicator
      return true
    },
    resolvedStateBarVisible() {
      if (this.stateBarVisible !== undefined) return this.stateBarVisible
      if (this.useStateBar !== undefined) return this.useStateBar
      return true
    },
    resolvedCheckable() {
      if (this.checkable !== undefined) return this.checkable
      if (this.useCheckBar !== undefined) return this.useCheckBar
      return true
    },
    resolvedFilterable() {
      if (this.filterable !== undefined) return this.filterable
      if (this.useColumnFilter !== undefined) return this.useColumnFilter
      return true
    },
    resolvedUseFooter() {
      if (this.useFooter !== undefined) return this.useFooter
      if (this.showFooter !== undefined) return this.showFooter
      return false
    },
    resolvedGroupPanelVisible() {
      if (this.groupPanelVisible !== undefined) return this.groupPanelVisible
      if (this.groupable !== undefined) return this.groupable
      if (this.useGroupPanel !== undefined) return this.useGroupPanel
      return true
    },
    resolvedMergeMode() {
      if (this.mergeMode !== undefined) return this.mergeMode
      if (this.mergeable !== undefined) return this.mergeable
      return true
    },
    resolvedSummaryMode() {
      if (this.summaryMode !== undefined) return this.summaryMode
      if (this.groupSummaryMode !== undefined) return this.groupSummaryMode
      return 'aggregate'
    },
    resolvedCommitWhenLeave() {
      if (this.commitWhenLeave !== undefined) return this.commitWhenLeave
      if (this.autoCommittable !== undefined) return this.autoCommittable
      return true
    },
    resolvedInsertable() {
      if (this.insertable !== undefined) return this.insertable
      return true
    },
    resolvedRowResizable() {
      if (this.rowResizable !== undefined) return this.rowResizable
      return false
    },
    resolvedPinnable() {
      if (this.pinnable !== undefined) return this.pinnable
      if (this.useFixContextMenu !== undefined) return this.useFixContextMenu
      return true
    },
    resolvedSortable() {
      return this.sortable
    },
    resolvedSoftDeletable() {
      if (this.softDeletable !== undefined) return this.softDeletable
      if (this.softDeleting !== undefined) return this.softDeleting
      return true
    }
  },
  watch: {
    theme() {
      this.applyGridTheme(this._resolveTheme())
    },
    gridId() {
      this.loadSavedViews()
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
    this.loadSavedViews()
    this.$nextTick(() => {
      this.applyGridTheme(this._resolveTheme())
    })
    this._watchTheme()
  },
  beforeUnmount() {
    if (this.gridId) {
      this.saveGridLayout()
    }
    if (this._themeObserver) {
      try { this._themeObserver.disconnect() } catch (e) { /* noop */ }
      this._themeObserver = null
    }
    this.destroyGrid()
  },
  methods: {
    // =========================================================
    // 🔖 뷰 저장 (Saved Views) 캡슐화 관리
    // =========================================================
    loadSavedViews() {
      if (!this.gridId) return
      try {
        const stored = localStorage.getItem(`realgrid-saved-views-${this.gridId}`)
        if (stored) {
          this.savedViews = JSON.parse(stored) || []
        }
      } catch (e) {
        console.warn('[RealGrid] loadSavedViews error:', e)
      }
    },

    persistSavedViews() {
      if (!this.gridId) return
      try {
        localStorage.setItem(`realgrid-saved-views-${this.gridId}`, JSON.stringify(this.savedViews))
      } catch (e) {
        console.warn('[RealGrid] persistSavedViews error:', e)
      }
    },

    saveCurrentView() {
      if (!this.gridView) {
        this._notify('그리드가 아직 준비되지 않았습니다.', { type: 'warning' })
        return
      }

      const state = captureViewState(this.gridView, { includeGroup: this.includeGroupInView || this.resolvedGroupPanelVisible, dataProvider: this.dataProvider })
      const viewName = prompt('저장할 뷰 이름을 입력하세요 (컬럼 배치·고정·정렬·그룹핑 포함):', '사용자 정의 뷰')
      if (!viewName || !viewName.trim()) return

      const newView = { id: 'view_' + Date.now(), name: viewName.trim(), ...state }
      this.savedViews.push(newView)
      this.persistSavedViews()
      this.applySavedView(newView)
      this._notify(`'${newView.name}' 뷰가 저장되었습니다!`, { type: 'success' })
    },

    applySavedView(view) {
      if (!this.gridView) return
      applyViewState(this.gridView, view, { dataProvider: this.dataProvider })
      this.activeViewId = view.id
      this._notify(`'${view.name}' 뷰가 적용되었습니다.`, { type: 'info' })
    },

    deleteSavedView(viewId) {
      this.savedViews = this.savedViews.filter(v => v.id !== viewId)
      this.persistSavedViews()
      if (this.activeViewId === viewId) this.activeViewId = null
      this._notify('저장된 뷰가 삭제되었습니다.', { type: 'warning' })
    },

    // =========================================================
    // 💾 로컬스토리지 레이아웃 상태 저장 및 복원 (gridId 설정 시)
    // =========================================================
    saveGridLayout() {
      if (!this.gridId || !this.gridView) return
      try {
        const layout = typeof this.gridView.saveColumnLayout === 'function' ? this.gridView.saveColumnLayout() : null
        const fixedOpts = typeof this.gridView.getFixedOptions === 'function' ? (this.gridView.getFixedOptions() || {}) : {}
        const state = { layout, fixedOpts }
        localStorage.setItem(`realgrid-layout-${this.gridId}`, JSON.stringify(state))
      } catch (e) {
        console.warn('[RealGrid] saveGridLayout error:', e)
      }
    },

    restoreGridLayout() {
      if (!this.gridId || !this.gridView) return
      try {
        const saved = localStorage.getItem(`realgrid-layout-${this.gridId}`)
        if (saved) {
          const state = JSON.parse(saved)
          if (state.layout && typeof this.gridView.setColumnLayout === 'function') {
            this.gridView.setColumnLayout(state.layout)
          }
          if (state.fixedOpts && typeof this.gridView.setFixedOptions === 'function') {
            this.gridView.setFixedOptions(state.fixedOpts)
          }
        }
      } catch (e) {
        console.warn('[RealGrid] restoreGridLayout error:', e)
      }
    },

    resetGridLayout() {
      if (!this.gridId) return
      try {
        localStorage.removeItem(`realgrid-layout-${this.gridId}`)
        if (this.columns && this.columns.length > 0) {
          this.gridView.setColumns(this.columns)
        }
        this._notify('컬럼 레이아웃 설정이 초기화되었습니다.', { type: 'info' })
      } catch (e) {
        console.warn('[RealGrid] resetGridLayout error:', e)
      }
    },

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
          visible: this.resolvedShowRowNumber,
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
          this.saveGridLayout()
          this._notify(`'${clickData.column}' 컬럼까지 열 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'fixRow' && clickData.itemIndex !== undefined && clickData.itemIndex >= 0) {
        rowCount = clickData.itemIndex + 1
        this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
        this.saveGridLayout()
        this._notify(`${rowCount}번째 행까지 행 고정이 적용되었습니다.`, { type: 'success' })
        return true
      } else if (item.tag === 'fixBoth' && clickData.column && clickData.itemIndex !== undefined) {
        const colIdx = this.getColumnIndexByName(clickData.column)
        if (colIdx >= 0 && clickData.itemIndex >= 0) {
          colCount = colIdx + 1
          rowCount = clickData.itemIndex + 1
          this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
          this.saveGridLayout()
          this._notify(`${rowCount}행 x '${clickData.column}'열 동시 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'clearFixing') {
        this.gridView.setFixedOptions({ colCount: 0, rowCount: 0 })
        this.saveGridLayout()
        this._notify('행/열 고정이 해제되었습니다.', { type: 'info' })
        return true
      } else if (item.tag === 'saveView') {
        this.saveCurrentView()
        return true
      } else if (item.tag === 'resetLayout') {
        this.resetGridLayout()
        return true
      }
      return false
    },

    applyFixContextMenu() {
      if (!this.gridView || !this.resolvedPinnable) return
      if (typeof this.gridView.setContextMenu !== 'function') return
      try {
        const menuItems = [
          { label: '📌 선택한 열까지 고정', tag: 'fixColumn' },
          { label: '📌 선택한 행까지 고정', tag: 'fixRow' },
          { label: '📌 선택한 행/열 모두 고정', tag: 'fixBoth' },
          { label: '-' },
          { label: '❌ 고정 해제 (초기화)', tag: 'clearFixing' }
        ]
        if (this.gridId) {
          menuItems.push({ label: '🔖 현재 뷰 저장...', tag: 'saveView' })
          menuItems.push({ label: '🔄 컬럼 레이아웃 저장값 초기화', tag: 'resetLayout' })
        }
        this.gridView.setContextMenu(menuItems)
        this.gridView.onContextMenuPopup = () => true
        this.gridView.onContextMenuItemClicked = (grid, item, clickData) => {
          this.handleDynamicFixing(item, clickData)
        }
      } catch (e) {
        console.warn('[RealGrid] applyFixContextMenu error:', e)
      }
    },

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
            showProgress: true
          })
        }
      } catch (e) {
        console.warn('[RealGrid] exportToExcel error:', e)
      }
    },

    // =========================================================
    // 데이터 조작 API
    // =========================================================
    addRow(defaultValues = {}) {
      if (!this.dataProvider) return -1
      const itemIndex = this.dataProvider.addRow(defaultValues)
      if (this.gridView && itemIndex >= 0) {
        this.gridView.setCurrent({ itemIndex, fieldIndex: 0 })
      }
      return itemIndex
    },

    deleteSelectedRows() {
      if (!this.gridView || !this.dataProvider) return 0
      const checkedRows = this.gridView.getCheckedRows()
      if (checkedRows && checkedRows.length > 0) {
        this.dataProvider.removeRows(checkedRows)
        return checkedRows.length
      } else {
        const current = this.gridView.getCurrent()
        if (current && current.dataRow !== undefined && current.dataRow >= 0) {
          this.dataProvider.removeRow(current.dataRow)
          return 1
        }
      }
      return 0
    },

    commit() {
      if (this.gridView) {
        this.gridView.commit()
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

      const customOpts = { ...(this.options || {}), ...(this.gridOptions || {}) }

      this.dataProvider.softDeleting = this.resolvedSoftDeletable
      this.gridView.hideDeletedRows = this.hideDeletedRows

      this.gridView.setEditOptions({
        editable: this.editable,
        insertable: this.resolvedInsertable,
        appendable: this.resolvedInsertable,
        commitWhenLeave: this.resolvedCommitWhenLeave,
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

      if (this.resolvedGroupPanelVisible) {
        this.gridView.setDisplayOptions({ columnMovable: true, fitStyle: fitStyleVal, rowResizable: this.resolvedRowResizable, ...(customOpts.displayOptions || {}) })
        this.gridView.setGroupPanel({ visible: true, prompt: '컬럼 헤더를 이 곳으로 끌어다 놓으시면 그룹화됩니다.', ...(customOpts.groupPanel || {}) })
        this.gridView.setGroupingOptions({ enabled: true, prompt: '컬럼 헤더를 이 곳으로 끌어다 놓으시면 그룹화됩니다.', ...(customOpts.groupingOptions || {}) })
        this.gridView.setSortingOptions({ enabled: this.resolvedSortable, ...(customOpts.sortingOptions || {}) })
        this.gridView.setRowGroup({
          summaryMode: this.resolvedSummaryMode,
          mergeMode: this.resolvedMergeMode,
          hideGroupedColumn: this.columnHideable,
          ...(customOpts.rowGroup || {})
        })
      } else {
        this.gridView.setDisplayOptions({ fitStyle: fitStyleVal, rowHoverType: 'row', rowResizable: this.resolvedRowResizable, ...(customOpts.displayOptions || {}) })
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

      if (this.gridId) {
        this.restoreGridLayout()
        try {
          this.gridView.onColumnMoved = () => this.saveGridLayout()
          this.gridView.onColumnResized = () => this.saveGridLayout()
          this.gridView.onColumnVisibleChanged = () => this.saveGridLayout()
        } catch (e) { /* noop */ }
      }

      this.applyFixContextMenu()
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
