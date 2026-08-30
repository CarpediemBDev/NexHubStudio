<template>
  <div class="realgrid-vue-wrapper w-100 border rounded-2 overflow-hidden shadow-sm" :style="{ height: height }">
    <!-- 1단: 상단 내장 서브 툴바 (컬럼 팝오버 + 뷰 저장 + 내 뷰 칩스) -->
    <div v-if="showColumnPicker || showSavedViews" class="b2b-grid-inner-toolbar d-flex flex-wrap align-items-center justify-content-between px-3 py-2 bg-theme-subcard border-bottom b2b-text-xs">
      <!-- Left: Column Picker & Save View Buttons -->
      <div class="d-flex align-items-center gap-2">
        <!-- 1. [컬럼 설정] 버튼 → 팝업(ColumnPickerModal) -->
        <button
          v-if="showColumnPicker"
          class="btn btn-xs btn-outline-secondary d-flex align-items-center gap-1 py-1 px-2.5 b2b-text-xs shadow-2xs"
          type="button"
          title="컬럼 숨김/표시 설정"
          @click="openColumnModal"
        >
          <i class="bi bi-eye text-primary"></i>
          <span>컬럼 설정</span>
        </button>

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
    <RealGridVue
      ref="realGridComp"
      :autoGenerateField="false"
      :rows="rows"
      :style="{ width: '100%', height: (showColumnPicker || showSavedViews) ? 'calc(100% - 38px)' : '100%' }"
      @onInitialized="initGrid"
    >
      <slot></slot>
    </RealGridVue>

    <!-- 컬럼 표시/숨기기 설정 팝업 -->
    <ColumnPickerModal
      :isOpen="showColumnModal"
      :columns="columnPickerCols"
      @close="showColumnModal = false"
      @toggle-column="onColumnToggle"
    />
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { RealGridVue } from 'realgrid-vue'
import 'realgrid/dist/realgrid-white.css'
import { showToast } from '@/utils/toastUtil.js'
import { useTabStore } from '@/stores/tabStore.js'
import { captureViewState, applyViewState } from '@/utils/realgridOps'
import ColumnPickerModal from '@/components/ColumnPickerModal.vue'

export default {
  name: 'RealGridCommonVue',
  components: {
    RealGridVue,
    ColumnPickerModal
  },
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
    mergeable: { type: Boolean, default: undefined },
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
    gridOptions: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      gridView: null,
      dataProvider: null,
      savedViews: [],
      activeViewId: null,
      columnItems: [],
      showColumnModal: false
    }
  },
  created() {
    this.$tabStore = useTabStore()
  },
  mounted() {
    this.loadSavedViews()
    this.$nextTick(() => {
      const realGridComp = this.$refs.realGridComp
      if (realGridComp && realGridComp.gridView && !this.gridView) {
        this.initGrid(realGridComp.gridView)
      }
    })
  },
  beforeUnmount() {
    if (this.gridId) {
      this.saveGridLayout()
    }
  },
  computed: {
    columnPickerCols() {
      return this.columnItems.map(c => ({
        name: c.name,
        headerText: c.header || c.name,
        visible: c.visible
      }))
    },
    currentTheme() {
      return this.$tabStore?.sidebarTheme || 'light'
    },
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
      if (this.mergeable !== undefined) return this.mergeable
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
    currentTheme(newTheme) {
      this.applyGridTheme(newTheme)
    },
    gridId() {
      this.loadSavedViews()
    }
  },
  methods: {
    openColumnModal() {
      this.syncColumnItems()
      this.showColumnModal = true
    },

    onColumnToggle({ name, visible }) {
      this.toggleColumnVisibility(name, visible)
    },

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
        showToast('모든 컬럼이 표시되도록 설정되었습니다.', { type: 'info' })
      } catch (e) {
        console.warn('[RealGrid] resetColumnVisibility error:', e)
      }
    },

    loadSavedViews() {
      const storageKey = this.gridId ? `realgrid-saved-views-${this.gridId}` : 'realgrid-saved-views-default'
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
      const storageKey = this.gridId ? `realgrid-saved-views-${this.gridId}` : 'realgrid-saved-views-default'
      try {
        localStorage.setItem(storageKey, JSON.stringify(this.savedViews))
      } catch (e) {
        console.warn('[RealGrid] persistSavedViews error:', e)
      }
    },

    saveCurrentView() {
      if (!this.gridView) {
        showToast('그리드가 아직 준비되지 않았습니다.', { type: 'warning' })
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
      showToast(`'${newView.name}' 칩이 생성되었습니다!`, { type: 'success' })
    },

    applySavedView(view) {
      if (!this.gridView) return
      applyViewState(this.gridView, view, { dataProvider: this.dataProvider })
      this.activeViewId = view.id
      showToast(`'${view.name}' 뷰가 적용되었습니다.`, { type: 'info' })
    },

    deleteSavedView(viewId) {
      this.savedViews = this.savedViews.filter(v => v.id !== viewId)
      this.persistSavedViews()
      if (this.activeViewId === viewId) this.activeViewId = null
      showToast('저장된 뷰 칩이 삭제되었습니다.', { type: 'warning' })
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
            const allCols = this.gridView.getColumns() || []
            const validColNames = new Set(allCols.map(c => c.name))

            const filterValidLayout = (items) => {
              if (!Array.isArray(items)) return []
              return items.reduce((acc, item) => {
                if (typeof item === 'string') {
                  if (validColNames.has(item)) acc.push(item)
                } else if (item && typeof item === 'object') {
                  if (item.items) {
                    const filteredSub = filterValidLayout(item.items)
                    if (filteredSub.length > 0) {
                      acc.push({ ...item, items: filteredSub })
                    }
                  } else if (item.name && validColNames.has(item.name)) {
                    acc.push(item)
                  }
                }
                return acc
              }, [])
            }

            const cleanLayout = filterValidLayout(state.layout)
            if (cleanLayout.length > 0) {
              validColNames.forEach(name => {
                const exists = cleanLayout.some(it => (typeof it === 'string' ? it === name : it.name === name))
                if (!exists) cleanLayout.push(name)
              })
              this.gridView.setColumnLayout(cleanLayout)
            }
          }
          if (state.fixedOpts && typeof this.gridView.setFixedOptions === 'function') {
            this.gridView.setFixedOptions(state.fixedOpts)
          }
        }
      } catch (e) {
        console.warn('[RealGrid] restoreGridLayout error:', e)
      }
    },

    // =========================================================
    // 셀 병합 (merge-mode / mergeable)
    //  - true 이면 그룹 유무와 무관하게 모든 컬럼에 mergeRule 을 자동 적용한다.
    //  - 컬럼 정의에서 직접 지정한 mergeRule 은 그대로 존중한다.
    // =========================================================
    hasOwnMergeRule(col) {
      const rule = col && col.mergeRule
      if (!rule) return false
      return typeof rule === 'string' ? rule.length > 0 : !!rule.criteria
    },

    applyCellMerging() {
      if (!this.gridView || !this.resolvedMergeMode) return
      try {
        const cols = typeof this.gridView.getColumns === 'function' ? (this.gridView.getColumns() || []) : []
        cols.forEach(col => {
          if (!col || !col.name || this.hasOwnMergeRule(col)) return
          try {
            this.gridView.setColumnProperty(col.name, 'mergeRule', 'value')
          } catch (e) { /* noop */ }
        })
      } catch (e) {
        console.warn('[RealGrid] applyCellMerging error:', e)
      }
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

    // =========================================================
    // 🎨 동적 테마 연동 (제어열 indicator / checkBar / stateBar)
    //   ⚠ RealGrid 2.10.0 GridView에는 setStyles 가 없음 → typeof 가드로 안전 처리.
    //     헤더/바디 셀 색상은 grid-theme.css 의 .rg-* 클래스(styleName)로 적용됨.
    //     (RealGridTreeJs 와 동일 구현으로 통일)
    // =========================================================
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
          showToast(`'${clickData.column}' 컬럼까지 열 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'fixRow' && clickData.itemIndex !== undefined && clickData.itemIndex >= 0) {
        rowCount = clickData.itemIndex + 1
        this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
        showToast(`${rowCount}번째 행까지 행 고정이 적용되었습니다.`, { type: 'success' })
        return true
      } else if (item.tag === 'fixBoth' && clickData.column && clickData.itemIndex !== undefined) {
        const colIdx = this.getColumnIndexByName(clickData.column)
        if (colIdx >= 0 && clickData.itemIndex >= 0) {
          colCount = colIdx + 1
          rowCount = clickData.itemIndex + 1
          this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
          showToast(`${rowCount}행 x '${clickData.column}'열 동시 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'clearFixing') {
        this.gridView.setFixedOptions({ colCount: 0, rowCount: 0 })
        showToast('행/열 고정이 해제되었습니다.', { type: 'info' })
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

    initGrid(arg) {
      const realGridComp = this.$refs.realGridComp
      const gv = (realGridComp && realGridComp.gridView) || arg
      if (!gv) return

      this.gridView = markRaw(gv)
      this.dataProvider = markRaw((realGridComp && realGridComp.dataProvider) || (gv.getDataSource && gv.getDataSource()))

      const customOpts = { ...(this.options || {}), ...(this.gridOptions || {}) }

      if (this.dataProvider) {
        this.dataProvider.softDeleting = true
      }
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
        // 2단 상하 배치: 1단 상단 서브 툴바와 2단 RealGrid 순수 groupPanel이 각각 100% 가로 폭으로 독립 표출되도록 visible: true 적용
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

      if (this.gridId) {
        this.restoreGridLayout()
      }

      this.initContextMenu()
      this.syncColumnItems()
      this.applyCellMerging()
      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
      this.applyGridTheme(this.$tabStore?.sidebarTheme || 'light')
    }
  }
}
</script>

<style scoped>
.realgrid-vue-wrapper {
  position: relative;
}
.b2b-grid-inner-toolbar {
  background-color: var(--b2b-color-bg-subcard, #f8fafc);
}
</style>
