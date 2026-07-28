<template>
  <div class="realgrid-js-wrapper w-100">
    <div ref="gridElement" class="w-100" :style="{ height: height }"></div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-white.css'
import { markRaw } from 'vue'
import realgridCommon from '@/mixins/realgridCommon.js'
import { useTabStore } from '@/stores/tabStore.js'

export default {
  name: 'RealGridCommonJs',
  mixins: [realgridCommon],
  props: {
    // 공통 옵션(editable/softDeleting/hideDeletedRows/useStateBar/useCheckBar/
    // useIndicator/checkBarExclusive/checkBarWidth/stateBarWidth)은 공통 mixin에서 선언.
    fields: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    height: { type: String, default: '580px' },
    useGroupPanel: { type: Boolean, default: false },
    useFooter: { type: Boolean, default: false }
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
  created() {
    // Pinia 테마 스토어 연결 (믹스인이 아닌 컴포넌트에서 직접 → 순환참조 회피)
    this.$tabStore = useTabStore()
  },
  mounted() {
    this.initGrid()
    // 마운트 시 현재 테마 1회 적용
    this.$nextTick(() => {
      this.applyGridTheme(this.$tabStore?.sidebarTheme || 'light')
    })
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

      // Indicator / StateBar / CheckBar 공통 제어열 (mixin, props로 제어)
      this.applyControlBars()
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
      // 초기 테마 적용
      this.applyGridTheme(this.$tabStore?.sidebarTheme || 'light')
    },

    // 그리드 전용 Public API (setFields/setColumns/deleteChecked/commit 은 공통 mixin 제공)
    // 그룹화(groupBy 등)는 GridView 전용 — 트리에는 없음.
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
    }
  }
}
</script>

<style scoped>
.realgrid-js-wrapper {
  position: relative;
}
</style>
