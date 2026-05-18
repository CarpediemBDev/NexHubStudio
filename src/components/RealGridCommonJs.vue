<template>
  <div class="realgrid-js-wrapper w-100">
    <div ref="gridElement" class="w-100" :style="{ height: height }"></div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-white.css'

export default {
  name: 'RealGridCommonJs',
  props: {
    fields: { type: Array, required: true },
    columns: { type: Array, required: true },
    rows: { type: Array, default: () => [] },
    height: { type: String, default: '560px' }
  },
  watch: {
    rows: {
      deep: true,
      handler(newRows) {
        if (this.dataProvider) {
          this.dataProvider.setRows(newRows || [])
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

      // Create instances
      this.dataProvider = new RealGrid.LocalDataProvider(false)
      this.gridView = new RealGrid.GridView(container)
      this.gridView.setDataSource(this.dataProvider)

      // Enterprise default options
      this.dataProvider.softDeleting = true
      this.gridView.hideDeletedRows = true
      
      this.gridView.setEditOptions({
        editable: true,
        insertable: true,
        appendable: true,
        commitWhenLeave: true // auto-commit on cell focus out
      })

      this.gridView.setStateBar({ visible: true })
      this.gridView.setCheckBar({ visible: true })
      this.gridView.setFooter({ visible: false }) // 합계행(Footer) 숨김 처리

      // Set fields and columns from props
      this.dataProvider.setFields(this.fields)
      this.gridView.setColumns(this.columns)

      // Display options
      this.gridView.setDisplayOptions({
        fitStyle: 'evenFill',
        rowHeight: 40,
        headerHeight: 40,
        syncGridHeight: 'always', // 마지막행 자투리 여백제거
      })

      // Load initial rows
      if (this.rows && this.rows.length > 0) {
        this.dataProvider.setRows(this.rows)
      }

      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
    },
    
    // Public API methods exposed via refs
    addRow(rowData) {
      if (this.dataProvider) {
        this.dataProvider.addRow(rowData)
        const count = this.dataProvider.getRowCount()
        this.gridView.setCurrent({ itemIndex: count - 1 })
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
    
    destroyGrid() {
      if (this.gridView) {
        try {
          this.gridView.destroy()
        } catch (e) {
          console.error('Error destroying gridView:', e)
        }
        this.gridView = null
      }
      if (this.dataProvider) {
        try {
          this.dataProvider.destroy()
        } catch (e) {
          console.error('Error destroying dataProvider:', e)
        }
        this.dataProvider = null
      }
    }
  }
}
</script>
