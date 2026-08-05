<template>
  <div class="realgrid-vue-wrapper w-100" :style="{ height: height }">
    <RealGridVue
      ref="realGridComp"
      :autoGenerateField="false"
      :rows="rows"
      style="width: 100%; height: 100%;"
      @onInitialized="initGrid"
    >
      <slot></slot>
    </RealGridVue>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { RealGridVue } from 'realgrid-vue'
import 'realgrid/dist/realgrid-white.css'
import { showToast } from '@/utils/toastUtil.js'
import { useTabStore } from '@/stores/tabStore.js'
import { captureViewState, applyViewState } from '@/utils/realgridOps'

export default {
  name: 'RealGridCommonVue',
  components: {
    RealGridVue
  },
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
    // ⚙️ [2. 세부 모드 및 값 입력 전용 Props]
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
    // 🔄 [4. 레거시 구버전 명칭 호환용]
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
    softDeleting: { type: Boolean, default: undefined }
  },
  data() {
    return {
      gridView: null,
      dataProvider: null,
      savedViews: [],
      activeViewId: null
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
    currentTheme() {
      return this.$tabStore?.sidebarTheme || 'light'
    },
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
      return false
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
    currentTheme(newTheme) {
      this.applyGridTheme(newTheme)
    },
    gridId() {
      this.loadSavedViews()
    }
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
        showToast('그리드가 아직 준비되지 않았습니다.', 'warning')
        return
      }

      const state = captureViewState(this.gridView, { includeGroup: this.includeGroupInView || this.resolvedGroupPanelVisible, dataProvider: this.dataProvider })
      const viewName = prompt('저장할 뷰 이름을 입력하세요 (컬럼 배치·고정·정렬·그룹핑 포함):', '사용자 정의 뷰')
      if (!viewName || !viewName.trim()) return

      const newView = { id: 'view_' + Date.now(), name: viewName.trim(), ...state }
      this.savedViews.push(newView)
      this.persistSavedViews()
      this.applySavedView(newView)
      showToast(`'${newView.name}' 뷰가 저장되었습니다!`, 'success')
    },

    applySavedView(view) {
      if (!this.gridView) return
      applyViewState(this.gridView, view, { dataProvider: this.dataProvider })
      this.activeViewId = view.id
      showToast(`'${view.name}' 뷰가 적용되었습니다.`, 'info')
    },

    deleteSavedView(viewId) {
      this.savedViews = this.savedViews.filter(v => v.id !== viewId)
      this.persistSavedViews()
      if (this.activeViewId === viewId) this.activeViewId = null
      showToast('저장된 뷰가 삭제되었습니다.', 'warning')
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
        showToast('컬럼 레이아웃 설정이 초기화되었습니다.', 'info')
      } catch (e) {
        console.warn('[RealGrid] resetGridLayout error:', e)
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
        this.dataProvider.softDeleting = this.resolvedSoftDeletable
      }
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
      this.gridView.setFooter({ visible: this.resolvedUseFooter, ...(customOpts.footer || {}) })

      if (this.resolvedGroupPanelVisible) {
        this.gridView.setDisplayOptions({ columnMovable: true, fitStyle: fitStyleVal, rowResizable: this.resolvedRowResizable, ...(customOpts.displayOptions || {}) })
        this.gridView.setGroupPanel({ visible: true, prompt: '컬럼 헤더를 이 곳으로 끌어다 놓으시면 그룹화됩니다.', ...(customOpts.groupPanel || {}) })
        this.gridView.setGroupingOptions({ enabled: true, prompt: '컬럼 헤더를 이 곳으로 끌어다 놓으시면 그룹화됩니다.', ...(customOpts.groupingOptions || {}) })
        this.gridView.setSortingOptions({ enabled: this.resolvedSortable, ...(customOpts.sortingOptions || {}) })
        this.gridView.setRowGroup({
          summaryMode: this.resolvedSummaryMode,
          // 그룹핑 시에는 merge-mode prop 과 무관하게 그룹 병합을 강제한다 (옵션 B).
          // 평면 셀 병합만 merge-mode(기본 false)로 제어. customOpts.rowGroup 로는 여전히 override 가능.
          mergeMode: true,
          hideGroupedColumn: this.columnHideable,
          ...(customOpts.rowGroup || {})
        })
      } else {
        this.gridView.setDisplayOptions({ fitStyle: fitStyleVal, rowHoverType: 'row', rowResizable: this.resolvedRowResizable, ...(customOpts.displayOptions || {}) })
        this.applySortingOptions()
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
      this.applyCellMerging()

      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
      this.applyGridTheme(this.$tabStore?.sidebarTheme || 'light')

      this.$nextTick(() => {
        this.applyFixContextMenu()
      })
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
          width: customOpts.stateBar?.width || this.stateBarWidth || 20,
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
          width: customOpts.checkBar?.width || this.checkBarWidth || 36,
          exclusive: this.exclusiveSelectable,
          head: 'check',
          headCheckCallback: null,
          ...(customOpts.checkBar || {})
        })
      } else {
        this.gridView.setCheckBar({ visible: false })
      }
    },

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
          showToast(`'${clickData.column}' 컬럼까지 열 고정이 적용되었습니다.`, 'success')
          return true
        }
      } else if (item.tag === 'fixRow' && clickData.itemIndex !== undefined && clickData.itemIndex >= 0) {
        rowCount = clickData.itemIndex + 1
        this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
        this.saveGridLayout()
        showToast(`${rowCount}번째 행까지 행 고정이 적용되었습니다.`, 'success')
        return true
      } else if (item.tag === 'fixBoth' && clickData.column && clickData.itemIndex !== undefined) {
        const colIdx = this.getColumnIndexByName(clickData.column)
        if (colIdx >= 0 && clickData.itemIndex >= 0) {
          colCount = colIdx + 1
          rowCount = clickData.itemIndex + 1
          this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
          this.saveGridLayout()
          showToast(`${rowCount}행 x '${clickData.column}'열 동시 고정이 적용되었습니다.`, 'success')
          return true
        }
      } else if (item.tag === 'clearFixing') {
        this.gridView.setFixedOptions({ colCount: 0, rowCount: 0 })
        this.saveGridLayout()
        showToast('행/열 고정이 해제되었습니다.', 'info')
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
    // 셀 병합 (merge-mode): 그룹 유무와 무관하게 동일값 셀 병합
    //  - merge-mode=true 이면 모든 컬럼에 mergeRule 자동 적용
    //  - 컬럼 정의에서 직접 지정한 mergeRule 은 그대로 존중
    // =========================================================
    applyCellMerging() {
      if (!this.gridView || !this.resolvedMergeMode) return
      try {
        const cols = typeof this.gridView.getColumns === 'function' ? (this.gridView.getColumns() || []) : []
        cols.forEach(col => {
          if (!col || !col.name) return
          const hasOwnRule = col.mergeRule && col.mergeRule.criteria
          if (!hasOwnRule) {
            try {
              this.gridView.setColumnProperty(col.name, 'mergeRule', { criteria: 'value' })
            } catch (e) { /* noop */ }
          }
        })
      } catch (e) {
        console.warn('[RealGrid] applyCellMerging error:', e)
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

    applyGridTheme(theme) {
      if (!this.gridView) return
      try {
        const isDark = theme === 'dark' || theme === 'dark-navy'
        const isNavy = theme === 'dark-navy'
        let styles
        if (isDark) {
          const bg = isNavy ? '#1e293b' : '#1e293b'
          const headBg = isNavy ? '#0f172a' : '#111827'
          const border = isNavy ? '1px solid #334155' : '1px solid #374151'
          const color = '#f8fafc'
          const cell = { background: bg, color, borderRight: border }
          const head = { background: headBg, color, borderBottom: border }
          styles = { indicator: { ...cell, head }, checkBar: { ...cell, head }, stateBar: { background: bg, borderRight: border } }
        } else {
          const cell = { background: '#FFFFFF', color: '#1E293B', borderRight: '1px solid #E2E8F0' }
          const head = { background: '#F1F5F9', color: '#1E293B', borderBottom: '1px solid #E2E8F0' }
          styles = { indicator: { ...cell, head }, checkBar: { ...cell, head }, stateBar: { background: '#FFFFFF', borderRight: '1px solid #E2E8F0' } }
        }
        if (typeof this.gridView.setStyles === 'function') {
          this.gridView.setStyles(styles)
        }
      } catch (e) {
        console.warn('[RealGrid] applyGridTheme error:', e)
      }
    }
  }
}
</script>

<style scoped>
.realgrid-vue-wrapper {
  position: relative;
}
</style>
