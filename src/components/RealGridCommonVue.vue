<template>
  <div class="realgrid-vue-wrapper w-100 border rounded-2 overflow-hidden shadow-sm" :style="{ height: height }">
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
                :id="'col_chk_v2_' + col.name"
                :checked="col.visible"
                @change="toggleColumnVisibility(col.name, $event.target.checked)"
              />
              <label class="form-check-label cursor-pointer text-dark text-truncate d-block" :for="'col_chk_v2_' + col.name" style="max-width: 150px;">
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
    <RealGridVue
      ref="realGridComp"
      :autoGenerateField="false"
      :rows="rows"
      :style="{ width: '100%', height: (showColumnPicker || showSavedViews) ? 'calc(100% - 38px)' : '100%' }"
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
    gridOptions: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      gridView: null,
      dataProvider: null,
      savedViews: [],
      activeViewId: null,
      columnItems: []
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
      return true
    },
    resolvedStateBarVisible() {
      if (this.stateBarVisible !== undefined) return this.stateBarVisible
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
    currentTheme(newTheme) {
      this.applyGridTheme(newTheme)
    },
    gridId() {
      this.loadSavedViews()
    }
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
        showToast('모든 컬럼이 표시되도록 설정되었습니다.', 'info')
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
        showToast('그리드가 아직 준비되지 않았습니다.', 'warning')
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
      showToast(`'${newView.name}' 칩이 생성되었습니다!`, 'success')
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
      showToast('저장된 뷰 칩이 삭제되었습니다.', 'warning')
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

      this.syncColumnItems()
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
