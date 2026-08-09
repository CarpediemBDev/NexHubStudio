<template>
  <div class="realgrid-js-wrapper w-100 border rounded-2 overflow-hidden shadow-sm" :style="{ height: height }">
    <!-- 1단: 상단 내장 서브 툴바 (컬럼 팝오버 + 뷰 저장 + 내 뷰 칩스) -->
    <div v-if="showColumnPicker || showSavedViews" class="b2b-grid-inner-toolbar d-flex flex-wrap align-items-center justify-content-between px-3 py-2 bg-theme-subcard border-bottom b2b-text-xs">
      <!-- Left: Column Picker & Save View Buttons -->
      <div class="d-flex align-items-center gap-2">
        <!-- 1. [컬럼] 버튼 & Dropdown Popover -->
        <div v-if="showColumnPicker" class="dropdown">
          <button
            class="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1 py-1 px-2.5 b2b-text-xs shadow-2xs"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            title="컬럼 숨김/표시 설정"
            @click="syncColumnItems"
          >
            <i class="bi bi-eye text-primary"></i>
            <span>컬럼 설정</span>
            <i class="bi bi-chevron-down opacity-50 ms-0.5"></i>
          </button>
          <div class="dropdown-menu p-2 shadow border-0 b2b-text-xs" style="min-width: 210px; max-height: 320px; overflow-y: auto;">
            <div class="d-flex align-items-center justify-content-between pb-1.5 mb-1.5 border-bottom px-1">
              <span class="fw-bold text-dark"><i class="bi bi-layout-three me-1 text-primary"></i>컬럼 표시 설정</span>
              <button class="btn btn-link p-0 text-decoration-none b2b-text-xs text-primary" @click="resetColumnVisibility">전체표시</button>
            </div>
            <div v-for="col in columnItems" :key="col.name" class="form-check py-1 px-3 m-0">
              <input
                class="form-check-input cursor-pointer"
                type="checkbox"
                :id="'col_chk_js2_' + col.name"
                :checked="col.visible"
                @change="toggleColumnVisibility(col.name, $event.target.checked)"
              />
              <label class="form-check-label cursor-pointer text-dark text-truncate d-block" :for="'col_chk_js2_' + col.name" style="max-width: 150px;">
                {{ col.header || col.name }}
              </label>
            </div>
          </div>
        </div>

        <!-- 2. [뷰 저장] 버튼 -->
        <button
          v-if="showSavedViews"
          class="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1 py-1 px-2.5 b2b-text-xs shadow-2xs"
          title="현재 컬럼 순서·너비·고정·그룹핑 상태 뷰 저장"
          @click="saveCurrentView"
        >
          <i class="bi bi-bookmark-plus text-warning"></i>
          <span>뷰 저장</span>
        </button>
      </div>

      <!-- Right: Dynamic [내 뷰] Chips (독립 우측 분리) -->
      <div v-if="showSavedViews && savedViews.length > 0" class="d-flex align-items-center gap-1.5 ms-auto flex-wrap">
        <span v-if="savedViews.length > 0" class="b2b-text-xs text-muted fw-semibold me-1">
          <i class="bi bi-star-fill text-warning me-1"></i>내 저장 뷰:
        </span>
        <div
          v-for="view in savedViews"
          :key="view.id"
          class="badge py-1 px-2 border cursor-pointer d-flex align-items-center gap-1 transition-all fw-normal b2b-text-xs"
          :class="activeViewId === view.id ? 'bg-primary text-white shadow-sm' : 'bg-theme-card text-theme-primary border-theme'"
          @click="applySavedView(view)"
        >
          <span>{{ view.name }}</span>
          <i class="bi bi-x ms-1 text-danger opacity-75 hover-opacity-100" @click.stop="deleteSavedView(view.id)" title="뷰 삭제"></i>
        </div>
      </div>
    </div>

    <!-- 2단: RealGrid Canvas Container (하단 100% 가로 폭 그룹핑 패널 포함) -->
    <div ref="gridElement" class="w-100" :style="{ height: (showColumnPicker || showSavedViews) ? 'calc(100% - 38px)' : '100%' }"></div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-white.css'
import { markRaw } from 'vue'
import { captureViewState, applyViewState } from '@/utils/realgridOps'

export default {
  name: 'RealGridCommonJs',
  props: {
    fields: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    gridId: { type: String, default: '' },
    height: { type: String, default: '580px' },
    editable: { type: Boolean, default: true },
    hideDeletedRows: { type: Boolean, default: false },
    showColumnPicker: { type: Boolean, default: true },
    showSavedViews: { type: Boolean, default: true },
    includeGroupInView: { type: Boolean, default: false },
    showRowNumber: { type: Boolean, default: undefined },
    stateBarVisible: { type: Boolean, default: undefined },
    showRowStatus: { type: Boolean, default: undefined },
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
    fitStyle: { type: String, default: 'evenFill' },
    checkBarWidth: { type: Number, default: 36 },
    stateBarWidth: { type: Number, default: 20 },
    fixedColCount: { type: Number, default: 0 },
    fixedRowCount: { type: Number, default: 0 },
    columnHideable: { type: Boolean, default: false },
    exclusiveSelectable: { type: Boolean, default: false },
    pinnable: { type: Boolean, default: undefined },
    options: { type: Object, default: () => ({}) },
    gridOptions: { type: Object, default: () => ({}) },
    theme: { type: String, default: '' },
    toast: { type: Function, default: null }
  },
  emits: ['init', 'notify'],
  data() {
    return {
      savedViews: [],
      activeViewId: null,
      columnItems: []
    }
  },
  computed: {
    resolvedShowRowNumber() {
      if (this.showRowNumber !== undefined) return this.showRowNumber
      return true
    },
    resolvedStateBarVisible() {
      if (this.stateBarVisible !== undefined) return this.stateBarVisible
      if (this.showRowStatus !== undefined) return this.showRowStatus
      return true
    },
    resolvedCheckable() {
      if (this.checkable !== undefined) return this.checkable
      return true
    },
    resolvedFilterable() {
      if (this.filterable !== undefined) return this.filterable
      return true
    },
    resolvedUseFooter() {
      if (this.useFooter !== undefined) return this.useFooter
      return false
    },
    resolvedGroupPanelVisible() {
      if (this.groupPanelVisible !== undefined) return this.groupPanelVisible
      return true
    },
    resolvedMergeMode() {
      if (this.mergeMode !== undefined) return this.mergeMode
      return false
    },
    resolvedSummaryMode() {
      if (this.summaryMode !== undefined) return this.summaryMode
      return 'aggregate'
    },
    resolvedCommitWhenLeave() {
      if (this.commitWhenLeave !== undefined) return this.commitWhenLeave
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
      return true
    },
    resolvedSortable() {
      return this.sortable
    },
    resolvedSoftDeletable() {
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
          this.syncColumnItems()
        }
      }
    }
  },
  mounted() {
    this.initGrid()
    this.loadSavedViews()
  },
  beforeUnmount() {
    if (this.gridId) {
      this.saveGridLayout()
    }
    this.destroyGrid()
  },
  methods: {
    syncColumnItems() {
      if (!this.gridView) return
      try {
        const cols = typeof this.gridView.getColumns === 'function' ? (this.gridView.getColumns() || []) : []
        this.columnItems = cols.map(c => ({
          name: c.name,
          header: (c.header && c.header.text) || c.name,
          visible: c.visible !== false
        }))
      } catch (e) {
        console.warn('[RealGrid] syncColumnItems error:', e)
      }
    },

    toggleColumnVisibility(colName, visible) {
      if (!this.gridView || !colName) return
      try {
        this.gridView.setColumnProperty(colName, 'visible', visible)
        this.syncColumnItems()
      } catch (e) {
        console.warn('[RealGrid] toggleColumnVisibility error:', e)
      }
    },

    resetColumnVisibility() {
      if (!this.gridView) return
      try {
        const cols = typeof this.gridView.getColumns === 'function' ? (this.gridView.getColumns() || []) : []
        cols.forEach(c => {
          this.gridView.setColumnProperty(c.name, 'visible', true)
        })
        this.syncColumnItems()
        this._notify('모든 컬럼이 표시되도록 설정되었습니다.', { type: 'info' })
      } catch (e) {
        console.warn('[RealGrid] resetColumnVisibility error:', e)
      }
    },

    loadSavedViews() {
      const storageKey = this.gridId ? `realgrid-saved-views-${this.gridId}` : 'realgrid-saved-views-js-default'
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          this.savedViews = JSON.parse(stored) || []
        }
      } catch (e) {
        console.warn('[RealGrid] loadSavedViews error:', e)
      }
    },

    persistSavedViews() {
      const storageKey = this.gridId ? `realgrid-saved-views-${this.gridId}` : 'realgrid-saved-views-js-default'
      try {
        localStorage.setItem(storageKey, JSON.stringify(this.savedViews))
      } catch (e) {
        console.warn('[RealGrid] persistSavedViews error:', e)
      }
    },

    saveCurrentView() {
      if (!this.gridView) {
        this._notify('그리드가 아직 준비되지 않았습니다.', { type: 'warning' })
        return
      }

      const state = captureViewState(this.gridView, { includeGroup: true, dataProvider: this.dataProvider })
      const defaultName = `내 뷰 ${this.savedViews.length + 1}`
      const viewName = prompt('저장할 뷰 이름을 입력하세요 (컬럼 배치·너비·고정·그룹핑 포함):', defaultName)
      if (!viewName || !viewName.trim()) return

      const newView = { id: 'view_' + Date.now(), name: viewName.trim(), ...state }
      this.savedViews.push(newView)
      this.persistSavedViews()
      this.applySavedView(newView)
      this._notify(`'${newView.name}' 칩이 생성되었습니다!`, { type: 'success' })
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
      this._notify('저장된 뷰 칩이 삭제되었습니다.', { type: 'warning' })
    },

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

    _resolveTheme() {
      if (this.theme) return this.theme
      if (typeof document !== 'undefined') {
        return document.documentElement.getAttribute('data-theme') || 'light'
      }
      return 'light'
    },

    // 🎨 동적 테마 연동 — RealGrid 2.10.0엔 setStyles가 없어 typeof 가드 처리.
    //    헤더/바디 색상은 grid-theme.css 의 .rg-* 클래스로 적용됨. (RealGridTreeJs와 동일)
    getGridThemeStyles(theme) {
      const isDark = theme === 'dark' || theme === 'dark-navy'
      if (isDark) {
        const bg = '#1E293B'
        const headBg = theme === 'dark-navy' ? '#0F172A' : '#111827'
        const border = '1px solid #334155'
        const color = '#F8FAFC'
        const cell = { background: bg, color, borderRight: border }
        const head = { background: headBg, color, borderBottom: border }
        return {
          indicator: { ...cell, head },
          checkBar: { ...cell, head },
          stateBar: { background: bg, borderRight: border }
        }
      }
      const cell = { background: '#FFFFFF', color: '#1E293B', borderRight: '1px solid #E2E8F0' }
      const head = { background: '#F1F5F9', color: '#1E293B', borderBottom: '1px solid #E2E8F0' }
      return {
        indicator: { ...cell, head },
        checkBar: { ...cell, head },
        stateBar: { background: '#FFFFFF', borderRight: '1px solid #E2E8F0' }
      }
    },

    applyGridTheme(theme) {
      if (!this.gridView) return
      try {
        const styles = this.getGridThemeStyles(theme)
        if (typeof this.gridView.setStyles === 'function') {
          this.gridView.setStyles(styles)
        }
      } catch (e) {
        console.warn('[RealGrid] applyGridTheme error:', e)
      }
    },

    _notify(message, opts = {}) {
      const type = opts.type || 'info'
      if (typeof this.toast === 'function') {
        try { this.toast(message, opts) } catch (e) { /* noop */ }
        return
      }
      this.$emit('notify', { message, type })
    },

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

    // -------------------------------------------------------------------------
    // 🌐 Alias Methods for Cross-Grid Standard Parity
    // -------------------------------------------------------------------------
    add(initialObj = {}) {
      return this.addRow(initialObj)
    },
    deleteSelected() {
      return this.deleteSelectedRows()
    },
    exportExcel(fileName = 'RealGrid_Data.xlsx') {
      return this.exportToExcel(fileName)
    },

    // -------------------------------------------------------------------------
    // 📌 Right-Click Row/Column Fixing Context Menu
    // -------------------------------------------------------------------------
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
      } else if (item.tag === 'saveView') {
        this.saveCurrentView()
        return true
      }
      return false
    },

    initContextMenu() {
      if (!this.gridView || this.resolvedPinnable === false) return
      const menuItems = [
        { label: '📌 선택한 열까지 고정', tag: 'fixColumn' },
        { label: '📌 선택한 행까지 고정', tag: 'fixRow' },
        { label: '📌 선택한 행/열 모두 고정', tag: 'fixBoth' },
        { label: '❌ 고정 해제 (초기화)', tag: 'clearFixing' }
      ]
      if (this.showSavedViews) {
        menuItems.push({ label: '-' })
        menuItems.push({ label: '💾 현재 뷰 상태 저장', tag: 'saveView' })
      }
      this.gridView.setContextMenu(menuItems)
      this.gridView.onContextMenuPopup = () => true
      this.gridView.onContextMenuItemClicked = (grid, item, clickData) => {
        this.handleDynamicFixing(item, clickData)
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

    initGrid() {
      const container = this.$refs.gridElement
      if (!container) return

      const LocalDataProvider = RealGrid.LocalDataProvider || RealGrid.default?.LocalDataProvider
      const GridView = RealGrid.GridView || RealGrid.default?.GridView

      this.dataProvider = markRaw(new LocalDataProvider(true))
      this.gridView = markRaw(new GridView(container))
      this.gridView.setDataSource(this.dataProvider)

      const customOpts = { ...(this.options || {}), ...(this.gridOptions || {}) }

      this.dataProvider.softDeleting = true
      this.gridView.hideDeletedRows = this.hideDeletedRows

      this.gridView.setEditOptions({
        editable: this.editable,
        insertable: true,
        appendable: true,
        commitWhenLeave: true,
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
      this.gridView.setFooter({ visible: this.resolvedUseFooter, ...(customOpts.footer || {}) })

      if (this.resolvedGroupPanelVisible) {
        this.gridView.setDisplayOptions({ columnMovable: true, fitStyle: fitStyleVal, rowResizable: this.resolvedRowResizable, ...(customOpts.displayOptions || {}) })
        this.gridView.setGroupPanel({ visible: true, prompt: '컬럼 헤더를 이 곳으로 끌어다 놓으시면 그룹화됩니다.', ...(customOpts.groupPanel || {}) })
        this.gridView.setGroupingOptions({ enabled: true, prompt: '컬럼 헤더를 이 곳으로 끌어다 놓으시면 그룹화됩니다.', ...(customOpts.groupingOptions || {}) })
        this.gridView.setSortingOptions({ enabled: true, ...(customOpts.sortingOptions || {}) })
        this.gridView.setRowGroup({
          summaryMode: this.resolvedSummaryMode,
          mergeMode: true,
          hideGroupedColumn: this.columnHideable,
          ...(customOpts.rowGroup || {})
        })
      } else {
        this.gridView.setDisplayOptions({ fitStyle: fitStyleVal, rowHoverType: 'row', rowResizable: this.resolvedRowResizable, ...(customOpts.displayOptions || {}) })
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
      }

      this.initContextMenu()
      this.syncColumnItems()
      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
    }
  }
}
</script>

<style scoped>
.realgrid-js-wrapper {
  position: relative;
}
.b2b-grid-inner-toolbar {
  background-color: var(--b2b-color-bg-subcard, #f8fafc);
}
</style>
