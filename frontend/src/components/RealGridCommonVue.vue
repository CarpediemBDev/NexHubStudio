<template>
  <div class="realgrid-vue-wrapper w-100" :style="{ height: height }">
    <RealGridVue
      ref="realGridComp"
      :autoGenerateField="false"
      :rows="rows"
      :gridProps="gridProps"
      style="width: 100%; height: 100%;"
      @onInitialized="initGrid"
    >
      <slot></slot>
    </RealGridVue>
  </div>
</template>

<script>
import { RealGridVue } from 'realgrid-vue'
import 'realgrid/dist/realgrid-white.css'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'RealGridCommonVue',
  components: {
    RealGridVue
  },
  props: {
    rows: { type: Array, default: () => [] },
    height: { type: String, default: '580px' },
    useGroupPanel: { type: Boolean, default: false },
    useFooter: { type: Boolean, default: false },
    softDeleting: { type: Boolean, default: true },
    hideDeletedRows: { type: Boolean, default: true },
    editable: { type: Boolean, default: true }
  },
  data() {
    return {
      gridProps: {
        display: {
          fitStyle: 'evenFill',
          syncGridHeight: 'always',
          rowHeight: 40,
          headerHeight: 40,
          rowHoverType: 'row'
        }
      }
    }
  },
  methods: {
    initGrid(gridView) {
      this.gridView = gridView
      this.dataProvider = gridView.getDataSource()

      // 1:1 완벽 동등한 옵션 바인딩
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

      if (this.useGroupPanel) {
        this.gridView.setDisplayOptions({ columnMovable: true, fitStyle: 'evenFill' })
        this.gridView.setGroupPanel({ visible: true })
        this.gridView.setGroupingOptions({ enabled: true })
        this.gridView.setSortingOptions({ enabled: true })
        this.gridView.setRowGroup({ summaryMode: 'aggregate', mergeMode: true })
      }

      this.$emit('init', { gridView, dataProvider: this.dataProvider })
    },

    // Public API Methods (RealGridCommonJs와 100% 동일)
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
    }
  }
}
</script>

<style scoped>
.realgrid-vue-wrapper {
  position: relative;
}
</style>
