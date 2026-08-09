<template>
  <div class="jqx-custom-grid-wrapper w-100" :style="{ height: containerHeight }">
    <!-- Built-in B2B Toolbar -->
    <div v-if="showToolbar" class="jqx-grid-toolbar d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
      <div class="d-flex align-items-center gap-1">
        <slot name="toolbar-left">
          <button v-if="editable" type="button" class="btn btn-sm btn-outline-primary b2b-text-xs" @click="add()">
            <i class="bi bi-plus-lg me-1"></i> 행 추가
          </button>
          <button v-if="editable" type="button" class="btn btn-sm btn-outline-danger b2b-text-xs" @click="deleteSelected()">
            <i class="bi bi-dash-lg me-1"></i> 선택 삭제
          </button>
          <button type="button" class="btn btn-sm btn-outline-success b2b-text-xs" @click="exportExcel()">
            <i class="bi bi-file-earmark-excel me-1"></i> 엑셀
          </button>
          <button v-if="showSaveButton" type="button" class="btn btn-sm btn-primary b2b-text-xs" @click="$emit('save', getChanges())">
            <i class="bi bi-floppy me-1"></i> 저장
          </button>
        </slot>
      </div>

      <div class="d-flex align-items-center gap-2">
        <slot name="toolbar-right">
          <!-- Quick Search Filter -->
          <div v-if="showQuickSearch" class="input-group input-group-sm" style="width: 220px;">
            <span class="input-group-text bg-theme-subcard text-muted">
              <i class="bi bi-search"></i>
            </span>
            <input
              type="text"
              class="form-control b2b-text-xs"
              v-model="quickSearchQuery"
              placeholder="그리드 빠른 검색..."
              @input="onQuickSearch"
            />
            <button v-if="quickSearchQuery" class="btn btn-outline-secondary border-0 text-muted" type="button" @click="clearQuickSearch">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </slot>
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
        :columnsresize="columnsresize"
        :columnsreorder="columnsreorder"
        :autoheight="autoheight"
        @cellendedit="onCellEditEnd"
        @rowselect="onRowSelect"
      />
    </div>
  </div>
</template>

<script>
import JqxGrid from 'jqwidgets-scripts/jqwidgets-vue3/vue_jqxgrid.vue'
import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css'
import 'jqwidgets-scripts/jqwidgets/styles/jqx.bootstrap.css'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'JqxCustomGrid',
  components: { JqxGrid },
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
    showRowNumber: { type: Boolean, default: true },
    showRowStatus: { type: Boolean, default: true },
    showToolbar: { type: Boolean, default: false },
    showSaveButton: { type: Boolean, default: true },
    showQuickSearch: { type: Boolean, default: true },
    pageable: { type: Boolean, default: true },
    pagesize: { type: Number, default: 10 },
    pagesizeoptions: { type: Array, default: () => [10, 20, 50, 100] },
    sortable: { type: Boolean, default: true },
    filterable: { type: Boolean, default: true },
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
      resizeObserver: null
    }
  },

  computed: {
    containerHeight() {
      if (typeof this.height === 'number') return `${this.height}px`
      return this.height
    },
    gridHeight() {
      if (this.showToolbar) {
        return 'calc(100% - 42px)'
      }
      return '100%'
    },
    effectiveSelectionMode() {
      if (this.checkable) return 'checkbox'
      return this.selectionmode
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
      if (this.showRowStatus && !cols.some((c) => c.datafield === 'rowStatus')) {
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
    // Auto-Resize Observer
    if (window.ResizeObserver && this.$refs.gridContainerRef) {
      this.resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => {
          if (this.$refs.grid) {
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
        // Fallback to csv if xlsx export module is not present
        this.$refs.grid?.exportdata('csv', fileName)
      }
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

.jqx-grid-toolbar {
  padding: 4px 8px;
  background-color: var(--bs-tertiary-bg, #f8f9fa);
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
}

/* Header Gradient & B2B styling */
.jqx-custom-grid :deep(.jqx-grid-column-header) {
  background: linear-gradient(180deg, #f8f9fa, #f1f3f5);
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 0.8125rem;
}

/* Hover & Selected styles */
.jqx-custom-grid :deep(.jqx-grid-cell-hover) {
  background-color: #f1f5f9 !important;
  color: #0f172a !important;
}

.jqx-custom-grid :deep(.jqx-grid-cell-selected) {
  background-color: #e0f2fe !important;
  color: #0284c7 !important;
}

/* Row Numbering */
.jqx-custom-grid :deep(.jqs-rownum-cell) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Row Status Icons */
.jqx-custom-grid :deep(.jqs-state-cell) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.jqx-custom-grid :deep(.jqs-row-a) {
  background-color: #f0fdf4 !important;
}
.jqx-custom-grid :deep(.jqs-row-u) {
  background-color: #fffbe6 !important;
}
.jqx-custom-grid :deep(.jqs-row-d) {
  background-color: #fef2f2 !important;
  text-decoration: line-through;
  opacity: 0.7;
}

.jqx-custom-grid :deep(.jqs-state-cell) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 11px;
  font-weight: bold;
}

.jqx-custom-grid :deep(.jqs-row-a .jqs-state-cell) {
  background-color: #dbeafe !important;
}
.jqx-custom-grid :deep(.jqs-row-a .jqs-state-cell::after) {
  content: '+';
  color: #1d4ed8;
  font-weight: bold;
}

.jqx-custom-grid :deep(.jqs-row-u .jqs-state-cell) {
  background-color: #fef3c7 !important;
}
.jqx-custom-grid :deep(.jqs-row-u .jqs-state-cell::after) {
  content: '✏';
  color: #d97706;
  font-size: 10px;
}

.jqx-custom-grid :deep(.jqs-row-d .jqs-state-cell) {
  background-color: #fee2e2 !important;
}
.jqx-custom-grid :deep(.jqs-row-d .jqs-state-cell::after) {
  content: '-';
  color: #dc2626;
  font-weight: bold;
}

/* Dark theme styling */
[data-bs-theme="dark"] .jqx-grid-toolbar {
  background-color: #212529;
  border-color: #343a40;
}

[data-bs-theme="dark"] .jqx-custom-grid :deep(.jqx-grid-column-header) {
  background: #2b3035;
  border-color: #373b3e;
  color: #e9ecef;
}

[data-bs-theme="dark"] .jqx-custom-grid :deep(.jqx-grid-cell) {
  background-color: #212529;
  color: #f8f9fa;
  border-color: #343a40;
}

/* Container Border fix */
.jqx-custom-grid {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  overflow: hidden;
}

.jqx-custom-grid :deep(.jqx-grid),
.jqx-custom-grid :deep(.jqx-border-bootstrap),
.jqx-custom-grid :deep(.jqx-widget-content) {
  border-width: 0px !important;
}
</style>
