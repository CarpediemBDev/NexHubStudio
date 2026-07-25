<template>
  <div class="realgrid-js-wrapper w-100">
    <div ref="gridElement" class="w-100" :style="{ height: height }"></div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-white.css'
import { markRaw } from 'vue'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'RealGridCommonJs',
  props: {
    fields: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    height: { type: String, default: '580px' },
    useGroupPanel: { type: Boolean, default: false },
    useFooter: { type: Boolean, default: false },
    softDeleting: { type: Boolean, default: true },
    hideDeletedRows: { type: Boolean, default: true },
    editable: { type: Boolean, default: true }
  },
  watch: {
    rows: {
      deep: true,
      handler(newRows) {
        if (this.dataProvider) {
          this.dataProvider.setRows(newRows || [])
        }
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
  },
  beforeUnmount() {
    this.destroyGrid()
  },
  methods: {
    initGrid() {
      const container = this.$refs.gridElement
      if (!container) return

      const LocalDataProvider = RealGrid.LocalDataProvider || RealGrid.default?.LocalDataProvider
      const GridView = RealGrid.GridView || RealGrid.default?.GridView

      this.dataProvider = markRaw(new LocalDataProvider(true))
      this.gridView = markRaw(new GridView(container))
      this.gridView.setDataSource(this.dataProvider)

      // Enterprise default options
      this.dataProvider.softDeleting = this.softDeleting
      this.gridView.hideDeletedRows = this.hideDeletedRows
      
      this.gridView.setEditOptions({
        editable: this.editable,
        insertable: this.editable,
        appendable: this.editable,
        commitWhenLeave: true
      })

      this.gridView.setStateBar({ visible: true })
      this.gridView.setCheckBar({ visible: true })
      this.gridView.setFooter({ visible: this.useFooter })

      // 행 그룹핑 패널 지원 (피벗 A용)
      if (this.useGroupPanel) {
        this.gridView.setDisplayOptions({ columnMovable: true, fitStyle: 'evenFill' })
        this.gridView.setGroupPanel({ visible: true })
        this.gridView.setGroupingOptions({ enabled: true })
        this.gridView.setSortingOptions({ enabled: true })
        this.gridView.setRowGroup({ summaryMode: 'aggregate', mergeMode: true })
      } else {
        this.gridView.setDisplayOptions({
          fitStyle: 'evenFill',
          rowHoverType: 'row'
        })
      }

      // Set fields and columns from props
      if (this.fields && this.fields.length > 0) {
        this.dataProvider.setFields(this.fields)
      }
      if (this.columns && this.columns.length > 0) {
        this.gridView.setColumns(this.columns)
      }

      // Load initial rows
      if (this.rows && this.rows.length > 0) {
        this.dataProvider.setRows(this.rows)
      }

      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
    },
    
    // Public API methods exposed via refs
    setFixedOptions(options) {
      if (this.gridView) {
        this.gridView.setFixedOptions(options)
      }
    },

    handleDynamicFixing(item, clickData) {
      if (!this.gridView) return false
      
      const currentFixed = this.gridView.getFixedOptions ? (this.gridView.getFixedOptions() || {}) : {}
      let colCount = currentFixed.colCount || 0
      let rowCount = currentFixed.rowCount || 0

      if (item.tag === 'fixColumn' && clickData.column) {
        const colIdx = this.gridView.getColumnIndex(clickData.column)
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
        const colIdx = this.gridView.getColumnIndex(clickData.column)
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
      }
      return false
    },

    setFields(fields) {
      if (this.dataProvider) this.dataProvider.setFields(fields)
    },
    
    setColumns(columns) {
      if (this.gridView) this.gridView.setColumns(columns)
    },

    setRows(rows) {
      if (this.dataProvider) this.dataProvider.setRows(rows || [])
    },

    groupBy(fieldNames) {
      if (this.gridView) this.gridView.groupBy(fieldNames || [])
    },

    getGroupFieldNames() {
      return this.gridView ? (this.gridView.getGroupFieldNames() || []) : []
    },

    insertRow(index = 0, rowData = {}) {
      if (this.dataProvider) {
        this.dataProvider.insertRow(index, rowData)
        if (this.gridView) this.gridView.setCurrent({ itemIndex: index })
      }
    },

    addRow(rowData) {
      if (this.dataProvider) {
        this.dataProvider.addRow(rowData)
        const count = this.dataProvider.getRowCount()
        if (this.gridView) this.gridView.setCurrent({ itemIndex: count - 1 })
      }
    },
    
    deleteChecked() {
      if (!this.gridView || !this.dataProvider) return 0
      const checkedRows = this.gridView.getCheckedRows()
      if (checkedRows.length > 0) {
        this.dataProvider.removeRows(checkedRows)
        this.gridView.clearCheckedItems()
      }
      return checkedRows.length
    },
    
    getChanges() {
      if (!this.dataProvider) return { created: [], updated: [], deleted: [] }
      
      const createdIdx = this.dataProvider.getStateRows('created') || []
      const updatedIdx = this.dataProvider.getStateRows('updated') || []
      const deletedIdx = this.dataProvider.getStateRows('deleted') || []

      const created = createdIdx.map(idx => this.dataProvider.getJsonRow(idx))
      const updated = updatedIdx.map(idx => this.dataProvider.getJsonRow(idx))
      const deleted = deletedIdx.map(idx => this.dataProvider.getJsonRow(idx))

      return { created, updated, deleted }
    },

    clearRowStates() {
      if (this.dataProvider) this.dataProvider.clearRowStates()
    },
    
    destroyGrid() {
      if (this.gridView) {
        try { this.gridView.destroy() } catch (e) {}
        this.gridView = null
      }
      if (this.dataProvider) {
        try { this.dataProvider.destroy() } catch (e) {}
        this.dataProvider = null
      }
    }
  }
}
</script>

<style scoped>
.realgrid-js-wrapper {
  position: relative;
}
</style>
