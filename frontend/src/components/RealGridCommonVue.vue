<template>
  <div class="realgrid-vue-wrapper w-100" :style="{ height: height }">
    <!-- Pass gridProps reactively to RealGridVue component to ensure display options (fitStyle: evenFill) are enforced natively -->
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

export default {
  name: 'RealGridCommonVue',
  components: {
    RealGridVue
  },
  props: {
    rows: { type: Array, default: () => [] },
    height: { type: String, default: '560px' }
  },
  data() {
    return {
      // Define reactive grid options including fitStyle and row dimensions
      gridProps: {
        display: {
          fitStyle: 'evenFill',
          syncGridHeight: 'always', // 마지막행 자투리 여백제거
          rowHeight: 40,
          headerHeight: 40
        }
      }
    }
  },
  methods: {
    initGrid(gridView) {
      this.gridView = gridView
      this.dataProvider = gridView.getDataSource()

      // Configure advanced options on instances
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

      this.$emit('init', { gridView, dataProvider: this.dataProvider })
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
    }
  }
}
</script>
