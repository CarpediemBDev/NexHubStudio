<template>
  <div class="jqx-custom-grid-wrapper w-100 border rounded-2 overflow-hidden shadow-sm" :style="{ height: containerHeight }">
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
          title="현재 뷰 상태 저장"
          @click="saveCurrentView"
        >
          <i class="bi bi-bookmark-plus text-warning"></i>
          <span>뷰 저장</span>
        </button>
      </div>

      <!-- Right: Dynamic [내 뷰] Chips -->
      <div v-if="showSavedViews && savedViews.length > 0" class="d-flex align-items-center gap-1.5 ms-auto flex-wrap">
        <span class="b2b-text-xs text-muted fw-semibold me-1"><i class="bi bi-star-fill text-warning me-1"></i>내 저장 뷰:</span>
        <div
          v-for="view in savedViews"
          :key="view.id"
          class="badge py-1 px-2 border cursor-pointer d-flex align-items-center gap-1 transition-all fw-normal b2b-text-xs"
          :class="activeViewId === view.id ? 'bg-primary text-white shadow-sm' : 'bg-theme-card text-theme-primary border-theme'"
          @click="applySavedView(view)"
        >
          <span>{{ view.name }}</span>
          <i class="bi bi-x ms-1 text-danger opacity-75" @click.stop="deleteSavedView(view.id)" title="뷰 삭제"></i>
        </div>
      </div>
    </div>

    <!-- Grid Container -->
    <div class="jqx-custom-grid" ref="gridContainerRef">
      <JqxGrid
        v-if="adapter"
        ref="grid"
        width="100%"
        :height="gridHeight"
        :theme="theme"
        :source="adapter"
        :columns="columnsComputed"
        :editable="editable"
        :selectionmode="effectiveSelectionMode"
        :pageable="pageable"
        :pagesize="pagesize"
        :pagesizeoptions="pagesizeoptions"
        :sortable="sortable"
        :filterable="filterable"
        :groupable="resolvedGroupable"
        :localization="localizationObj"
        :columnsresize="columnsresize"
        :columnsreorder="columnsreorder"
        :autoheight="autoheight"
        @cellendedit="onCellEditEnd"
        @rowselect="onRowSelect"
      />
    </div>

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
import JqxGrid from 'jqwidgets-scripts/jqwidgets-vue3/vue_jqxgrid.vue'
import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css'
import 'jqwidgets-scripts/jqwidgets/styles/jqx.bootstrap.css'
import { showToast } from '@/utils/toastUtil.js'
import ColumnPickerModal from '@/components/ColumnPickerModal.vue'

export default {
  name: 'JqxCustomGrid',
  components: { JqxGrid, ColumnPickerModal },
  props: {
    localdata: { type: Array, default: () => [] },
    datafields: { type: Array, required: true },
    columns: { type: Array, required: true },
    width: { type: [Number, String], default: '100%' },
    height: { type: [Number, String], default: '350px' },
    theme: { type: String, default: 'bootstrap' },
    editable: { type: Boolean, default: true },
    selectionmode: { type: String, default: 'singlerow' },
    checkable: { type: Boolean, default: false },
    gridId: { type: String, default: '' },
    showRowNumber: { type: Boolean, default: true },
    showRowStatus: { type: Boolean, default: true },
    stateBarVisible: { type: Boolean, default: undefined },
    showToolbar: { type: Boolean, default: true },
    showColumnPicker: { type: Boolean, default: true },
    showSavedViews: { type: Boolean, default: true },
    showSaveButton: { type: Boolean, default: true },
    showQuickSearch: { type: Boolean, default: true },
    pageable: { type: Boolean, default: true },
    pagesize: { type: Number, default: 10 },
    pagesizeoptions: { type: Array, default: () => [10, 20, 50, 100] },
    sortable: { type: Boolean, default: true },
    filterable: { type: Boolean, default: true },
    groupable: { type: Boolean, default: undefined },
    groupPanelVisible: { type: Boolean, default: undefined },
    columnsresize: { type: Boolean, default: true },
    columnsreorder: { type: Boolean, default: true },
    autoheight: { type: Boolean, default: false },
    autofill: { type: Boolean, default: true }
  },

  emits: ['save', 'row-select', 'cell-edit-end', 'change'],

  data() {
    return {
      adapter: null,
      source: null,
      internalData: [],
      quickSearchQuery: '',
      resizeObserver: null,
      savedViews: [],
      activeViewId: null,
      columnItems: [],
      showColumnModal: false,
      hiddenColumnSet: new Set(),
      // 그룹 패널 안내문 한글화 (RealGrid 문구와 통일)
      localizationObj: {
        groupsheaderstring: '컬럼 헤더를 이 곳으로 끌어다 놓으시면 그룹화됩니다.'
      }
    }
  },

  computed: {
    columnPickerCols() {
      return this.columnItems.map(c => ({
        name: c.datafield,
        headerText: c.text || c.datafield,
        visible: !c.hidden
      }))
    },
    containerHeight() {
      if (typeof this.height === 'number') return `${this.height}px`
      return this.height
    },
    gridHeight() {
      // jqxGrid의 height 속성은 calc() 를 파싱하지 못하므로 '100%' 로 전달하고,
      // 툴바를 제외한 남은 높이는 .jqx-custom-grid 의 flex:1 이 담당한다.
      return '100%'
    },
    effectiveSelectionMode() {
      if (this.checkable) return 'checkbox'
      return this.selectionmode
    },
    resolvedGroupable() {
      if (this.groupable !== undefined) return this.groupable
      if (this.groupPanelVisible !== undefined) return this.groupPanelVisible
      return false
    },
    augmentedDatafields() {
      let fields = [...this.datafields]

      if (!fields.some((f) => f.name === 'rowStatus')) {
        fields.push({ name: 'rowStatus', type: 'string' })
      }
      if (!fields.some((f) => f.name === '_rowId')) {
        fields.push({ name: '_rowId', type: 'string' })
      }

      return fields
    },
    columnsComputed() {
      let cols = [...this.columns]

      // 0. AutoFill Mode: RealGrid fitStyle처럼 데이터 컬럼의 너비를 백분율(%)로 자동 환산하여 대형 모니터에서도 우측 여백 없이 100% 가득 채움
      if (this.autofill && cols.length > 0) {
        const numericTotal = cols.reduce((sum, c) => {
          const w = typeof c.width === 'number' ? c.width : parseFloat(c.width) || 100
          return sum + w
        }, 0)

        if (numericTotal > 0) {
          cols = cols.map((c) => {
            const w = typeof c.width === 'number' ? c.width : parseFloat(c.width) || 100
            const pct = ((w / numericTotal) * 100).toFixed(2) + '%'
            return {
              ...c,
              width: pct
            }
          })
        }
      }

      // 1. 행 번호 컬럼 (Row Indicator - No.)
      if (this.showRowNumber && !cols.some((c) => c.datafield === '_rowNum')) {
        const rowNumCol = {
          text: 'No.',
          datafield: '_rowNum',
          width: 36,
          editable: false,
          align: 'center',
          cellsalign: 'center',
          pinned: true,
          cellsrenderer: (row, columnfield, value) => {
            return `<div class="jqs-rownum-cell text-muted b2b-text-xs d-flex align-items-center justify-content-center h-100">${row + 1}</div>`
          }
        }
        cols = [rowNumCol, ...cols]
      }

      // 2. 행 상태 컬럼 (StateBar - RealGrid 1:1 컴팩트 24px)
      const shouldShowStatus = this.stateBarVisible !== undefined ? this.stateBarVisible : this.showRowStatus
      if (shouldShowStatus && !cols.some((c) => c.datafield === 'rowStatus')) {
        const statusCol = {
          text: ' ',
          datafield: 'rowStatus',
          width: 24,
          editable: false,
          align: 'center',
          cellsalign: 'center',
          pinned: true,
          cellsrenderer: (row, col, val) => {
            return `<div class="jqs-state-cell d-flex align-items-center justify-content-center h-100"></div>`
          },
          cellclassname: (row, datafield, value, rowData) => {
            if (rowData.rowStatus === 'A') return 'jqs-row-a'
            if (rowData.rowStatus === 'U') return 'jqs-row-u'
            if (rowData.rowStatus === 'D') return 'jqs-row-d'
            return ''
          }
        }
        cols = [statusCol, ...cols]
      }

      return cols
    }
  },

  watch: {
    localdata: {
      handler(newVal) {
        this.initInternalData(newVal)
      },
      deep: true,
      immediate: true
    }
  },

  created() {
    this.bind()
  },

  mounted() {
    this.loadSavedViews()
    this.syncColumnItems()
    if (window.ResizeObserver && this.$refs.gridContainerRef) {
      this.resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => {
          // 그리드가 화면에 붙어있을 때만 refresh. 페이지 이탈(keepAlive)·HMR 로 DOM 이
          // 분리되면 isConnected 가 false → 파괴된 그리드에 refresh 호출을 막아 jqx 셀렉터 에러 방지.
          if (this.$refs.grid && this.$refs.gridContainerRef?.isConnected) {
            this.$refs.grid.refresh()
          }
        })
      })
      this.resizeObserver.observe(this.$refs.gridContainerRef)
    }
  },

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
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
      if (!this.columns) return
      this.columnItems = this.columns.map((c) => ({
        datafield: c.datafield,
        text: c.text || c.datafield,
        hidden: c.hidden === true || this.hiddenColumnSet.has(c.datafield)
      }))
    },

    toggleColumnVisibility(datafield, visible) {
      if (visible) {
        this.hiddenColumnSet.delete(datafield)
        this.$refs.grid?.showcolumn(datafield)
      } else {
        this.hiddenColumnSet.add(datafield)
        this.$refs.grid?.hidecolumn(datafield)
      }
      this.syncColumnItems()
    },

    resetColumnVisibility() {
      this.hiddenColumnSet.clear()
      this.columns.forEach((c) => {
        if (c.datafield) this.$refs.grid?.showcolumn(c.datafield)
      })
      this.syncColumnItems()
      showToast('모든 컬럼이 표시되도록 설정되었습니다.', { type: 'info' })
    },

    loadSavedViews() {
      const key = this.gridId ? `jqxgrid-saved-views-${this.gridId}` : 'jqxgrid-saved-views-default'
      try {
        const stored = localStorage.getItem(key)
        if (stored) this.savedViews = JSON.parse(stored) || []
      } catch (e) {}
    },

    persistSavedViews() {
      const key = this.gridId ? `jqxgrid-saved-views-${this.gridId}` : 'jqxgrid-saved-views-default'
      try {
        localStorage.setItem(key, JSON.stringify(this.savedViews))
      } catch (e) {}
    },

    saveCurrentView() {
      const defaultName = `내 뷰 ${this.savedViews.length + 1}`
      const name = prompt('저장할 뷰 이름을 입력하세요:', defaultName)
      if (!name || !name.trim()) return

      const hidden = Array.from(this.hiddenColumnSet)
      const newView = { id: 'view_' + Date.now(), name: name.trim(), hidden }
      this.savedViews.push(newView)
      this.persistSavedViews()
      this.applySavedView(newView)
      showToast(`'${newView.name}' 뷰가 저장되었습니다!`, { type: 'success' })
    },

    applySavedView(view) {
      this.hiddenColumnSet = new Set(view.hidden || [])
      this.columns.forEach((c) => {
        if (c.datafield) {
          if (this.hiddenColumnSet.has(c.datafield)) {
            this.$refs.grid?.hidecolumn(c.datafield)
          } else {
            this.$refs.grid?.showcolumn(c.datafield)
          }
        }
      })
      this.activeViewId = view.id
      this.syncColumnItems()
      showToast(`'${view.name}' 뷰가 적용되었습니다.`, { type: 'info' })
    },

    deleteSavedView(id) {
      this.savedViews = this.savedViews.filter((v) => v.id !== id)
      this.persistSavedViews()
      if (this.activeViewId === id) this.activeViewId = null
      showToast('저장된 뷰가 삭제되었습니다.', { type: 'warning' })
    },

    initInternalData(val) {
      const arr = Array.isArray(val) ? val : []
      this.internalData = arr.map((item, idx) => ({
        ...item,
        rowStatus: item.rowStatus || '',
        _rowId: item._rowId || `row_${Date.now()}_${idx}`
      }))
      if (this.source) {
        this.source.localdata = this.internalData
        this.$refs.grid?.updatebounddata('cells')
      }
    },

    bind() {
      this.source = {
        datatype: 'array',
        localdata: this.internalData,
        datafields: this.augmentedDatafields,

        addrow: (rowid, rowdata, position, commit) => {
          rowdata.rowStatus = 'A'
          rowdata._rowId = `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

          if (position === 'last') {
            this.internalData.push(rowdata)
          } else {
            this.internalData.unshift(rowdata)
          }

          this.source.localdata = this.internalData
          commit(true)
          this.refreshGrid()
          this.$emit('change', this.getChanges())
        },

        updaterow: (rowid, newdata, commit) => {
          const idx = typeof rowid === 'number' ? rowid : this.internalData.findIndex((r) => r._rowId === rowid)
          if (idx < 0 || idx >= this.internalData.length) return commit(false)

          const prev = this.internalData[idx]
          const newStatus = prev.rowStatus === 'A' ? 'A' : 'U'

          const updated = {
            ...newdata,
            rowStatus: newStatus
          }

          this.internalData.splice(idx, 1, updated)
          this.source.localdata = this.internalData
          commit(true)
          this.refreshGrid()
          this.$emit('change', this.getChanges())
        }
      }

      this.adapter = new jqx.dataAdapter(this.source)
    },

    refreshGrid() {
      this.$nextTick(() => {
        this.$refs.grid?.updatebounddata('cells')
      })
    },

    // -------------------------------------------------------------------------
    // 🚀 Public API Methods for Parent Components
    // -------------------------------------------------------------------------
    
    // 행 추가
    add(initialObj = {}, position = 'first') {
      const newRow = {
        ...initialObj,
        rowStatus: 'A',
        _rowId: `row_${Date.now()}`
      }
      this.$refs.grid?.addrow(null, newRow, position)
      showToast('새 행이 추가되었습니다.', { type: 'info' })
    },

    // 선택된 행 삭제
    deleteSelected() {
      const selectedIndexes = this.$refs.grid?.getselectedrowindexes() || []
      if (selectedIndexes.length === 0) {
        showToast('삭제할 행을 선택해주세요.', { type: 'warning' })
        return
      }

      const sortedIndexes = [...selectedIndexes].sort((a, b) => b - a)

      sortedIndexes.forEach((idx) => {
        if (idx >= 0 && idx < this.internalData.length) {
          const row = this.internalData[idx]
          if (row.rowStatus === 'A') {
            this.internalData.splice(idx, 1)
          } else {
            this.internalData[idx] = { ...row, rowStatus: 'D' }
          }
        }
      })

      this.source.localdata = this.internalData
      this.refreshGrid()
      this.$refs.grid?.clearselection()
      this.$emit('change', this.getChanges())
      showToast(`${sortedIndexes.length}개 행이 삭제 처리되었습니다.`, { type: 'danger' })
    },

    // CUD 변경 데이터 페이로드 반환
    getChanges() {
      return {
        created: this.internalData.filter((r) => r.rowStatus === 'A'),
        updated: this.internalData.filter((r) => r.rowStatus === 'U'),
        deleted: this.internalData.filter((r) => r.rowStatus === 'D'),
        all: [...this.internalData]
      }
    },

    // CUD 상태 초기화 (저장 성공 후 호출)
    commit() {
      // D(삭제) 상태 행 제거 및 A/U 상태를 기본('') 상태로 전환
      this.internalData = this.internalData
        .filter((r) => r.rowStatus !== 'D')
        .map((r) => ({ ...r, rowStatus: '' }))

      this.source.localdata = this.internalData
      this.refreshGrid()
      showToast('변경사항이 저장 완료되었습니다.', { type: 'success' })
    },

    // 원복 (Rollback)
    rollback() {
      this.initInternalData(this.localdata)
      showToast('초기 데이터로 원복되었습니다.', { type: 'warning' })
    },

    // 선택된 데이터 행 객체 목록 반환
    getCheckedRows() {
      const selectedIndexes = this.$refs.grid?.getselectedrowindexes() || []
      return selectedIndexes.map((i) => this.internalData[i]).filter(Boolean)
    },

    // 엑셀 다운로드
    exportExcel(fileName = 'grid_export') {
      try {
        this.$refs.grid?.exportdata('xlsx', fileName)
        showToast('엑셀 파일이 다운로드되었습니다.', { type: 'success' })
      } catch (err) {
        console.warn('[JqxCustomGrid] xlsx export failed, trying csv fallback:', err)
        try {
          this.$refs.grid?.exportdata('csv', fileName)
          showToast('CSV 파일로 내보내졌습니다.', { type: 'info' })
        } catch (e) {
          showToast('엑셀 내보내기에 실패했습니다.', { type: 'danger' })
        }
      }
    },

    // 🌐 Cross-Grid Standard Parity Aliases
    exportToExcel(fileName = 'grid_export') {
      return this.exportExcel(fileName)
    },
    addRow(initialObj = {}, position = 'first') {
      return this.add(initialObj, position)
    },
    deleteSelectedRows() {
      return this.deleteSelected()
    },

    // 퀵 검색
    onQuickSearch() {
      const query = (this.quickSearchQuery || '').trim().toLowerCase()
      if (!query) {
        this.source.localdata = this.internalData
      } else {
        this.source.localdata = this.internalData.filter((row) => {
          return Object.values(row).some((val) =>
            String(val || '').toLowerCase().includes(query)
          )
        })
      }
      this.refreshGrid()
    },

    clearQuickSearch() {
      this.quickSearchQuery = ''
      this.onQuickSearch()
    },

    onCellEditEnd(event) {
      this.$emit('cell-edit-end', event.args)
    },

    onRowSelect(event) {
      this.$emit('row-select', event.args)
    }
  }
}
</script>

<style scoped>
.jqx-custom-grid-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 상단 내장 툴바 — RealGrid와 동일 서브카드 톤 */
.b2b-grid-inner-toolbar {
  background-color: var(--b2b-color-bg-subcard, #f8fafc);
}

/* 그리드 컨테이너 — 테두리/라운드/그림자는 wrapper의 부트스트랩 유틸이 담당.
   wrapper(flex column)에서 툴바를 제외한 남은 높이를 flex로 채워, jqxGrid가
   height='100%'로 전체 높이를 정확히 잡도록 한다(페이저 아래 빈 공간 제거). */
.jqx-custom-grid {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
}

/* jqx 기본 보더/배경 초기화 → 앱 디자인 토큰으로 통일 */
.jqx-custom-grid :deep(.jqx-grid),
.jqx-custom-grid :deep(.jqx-border-bootstrap),
.jqx-custom-grid :deep(.jqx-widget-content) {
  border-width: 0 !important;
  background-color: var(--bg-card) !important;
  color: var(--text-primary) !important;
}

/* 컬럼 헤더 — 회색 그라데이션 제거, RealGrid 헤더 톤(--bg-header) 적용 */
.jqx-custom-grid :deep(.jqx-grid-column-header) {
  background: var(--bg-header) !important;
  border-bottom: 1px solid var(--border-color) !important;
  border-right: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  font-weight: 600;
  font-size: 0.8125rem;
}

/* 데이터 셀 */
.jqx-custom-grid :deep(.jqx-grid-cell) {
  background-color: var(--bg-card) !important;
  color: var(--text-primary) !important;
  border-color: var(--border-color) !important;
}

/* Hover & Selected — 토큰 기반(라이트/다크 자동 대응) */
.jqx-custom-grid :deep(.jqx-grid-cell-hover) {
  background-color: var(--b2b-color-hover-bg) !important;
  color: var(--text-primary) !important;
}

.jqx-custom-grid :deep(.jqx-grid-cell-selected) {
  background-color: var(--b2b-color-primary-subtle) !important;
  color: var(--b2b-color-primary) !important;
}

/* Row Number / State 셀 중앙 정렬 */
.jqx-custom-grid :deep(.jqs-rownum-cell),
.jqx-custom-grid :deep(.jqs-state-cell) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ==========================================================================
   ROW STATUS — 추가=초록 / 수정=파랑 / 삭제=빨강
   RealGrid state bar와 동일 컨벤션. rgba 오버레이라 라이트/다크 양쪽 자연스러움
   ========================================================================== */
.jqx-custom-grid :deep(.jqs-row-a) { background-color: rgba(34, 197, 94, 0.12) !important; }   /* green-500 */
.jqx-custom-grid :deep(.jqs-row-u) { background-color: rgba(59, 130, 246, 0.12) !important; }  /* blue-500 */
.jqx-custom-grid :deep(.jqs-row-d) {
  background-color: rgba(239, 68, 68, 0.12) !important;                                          /* red-500 */
  text-decoration: line-through;
  opacity: 0.7;
}

.jqx-custom-grid :deep(.jqs-state-cell) {
  font-size: 11px;
  font-weight: bold;
}

/* 상태 마커 — 추가=+ / 수정=✓체크 / 삭제=− (심볼만, 하단 점 없이 정중앙).
   솔리드 컬러 바 위에서 또렷하게 보이도록 흰색 SVG 로 렌더. */
.jqx-custom-grid :deep(.jqs-row-a .jqs-state-cell),
.jqx-custom-grid :deep(.jqs-row-u .jqs-state-cell),
.jqx-custom-grid :deep(.jqs-row-d .jqs-state-cell) {
  background-repeat: no-repeat;
  background-position: center;
  background-size: 15px 15px;
}

/* 추가(A) → 초록 + 흰색 '+' */
.jqx-custom-grid :deep(.jqs-row-a .jqs-state-cell) {
  background-color: #22c55e !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='7' y='3.5' width='2' height='9' rx='1' fill='white'/%3E%3Crect x='3.5' y='7' width='9' height='2' rx='1' fill='white'/%3E%3C/svg%3E");
}

/* 수정(U) → 파랑 + 흰색 체크(✓) */
.jqx-custom-grid :deep(.jqs-row-u .jqs-state-cell) {
  background-color: #3b82f6 !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpolyline points='3.5 8.5 6.5 11.5 12.5 4.5' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

/* 삭제(D) → 빨강 + 흰색 '−' */
.jqx-custom-grid :deep(.jqs-row-d .jqs-state-cell) {
  background-color: #ef4444 !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='3.5' y='7' width='9' height='2' rx='1' fill='white'/%3E%3C/svg%3E");
}
</style>
