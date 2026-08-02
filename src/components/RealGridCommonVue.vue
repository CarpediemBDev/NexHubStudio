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

export default {
  name: 'RealGridCommonVue',
  components: {
    RealGridVue
  },
  props: {
    // -------------------------------------------------------------------------
    // 📦 [기본 데이터 및 컨테이너 설정]
    // -------------------------------------------------------------------------
    // 그리드에 바인딩할 데이터 행 배열
    rows: { type: Array, default: () => [] },
    // 그리드 컨테이너 높이 (예: '580px', '100%')
    height: { type: String, default: '580px' },
    // 셀 수정 및 편집 허용 여부 (-able)
    editable: { type: Boolean, default: true },
    // 소프트 삭제된 행을 화면에서 즉시 숨길지 여부
    hideDeletedRows: { type: Boolean, default: false },

    // -------------------------------------------------------------------------
    // ✨ [1. True / False 온-오프 전용] 글로벌 표준 형용사형 (-able / -ible) Props
    // -------------------------------------------------------------------------
    // 컬럼 헤더 클릭 시 데이터 오름/내림차순 정렬 기능 (-able)
    sortable: { type: Boolean, default: true },
    // 컬럼 헤더 자동 드롭다운 필터 기능 (-able)
    filterable: { type: Boolean, default: true },
    // 좌측 체크박스 선택열(CheckBar) 표시 여부 (-able)
    checkable: { type: Boolean, default: true },
    // 좌측 행번호(Indicator) 열 표시 여부 (-able)
    indicatable: { type: Boolean, default: true },
    // 좌측 행 상태(StateBar: 추가/수정/삭제 상태색) 열 표시 여부 (-ible)
    stateBarVisible: { type: Boolean, default: true },
    // 마우스 우클릭 행/열 동적 고정 메뉴 허용 여부 (-able)
    pinnable: { type: Boolean, default: true },
    // 상단 행 그룹핑 드래그앤드롭 패널 표시 여부 (-able)
    groupable: { type: Boolean, default: undefined },
    // 행 그룹핑 시 그룹화된 셀의 상하 병합 여부 (-able)
    mergeable: { type: Boolean, default: true },
    // 행 그룹핑 시 본문 컬럼 숨김 허용 여부 (-able)
    columnHideable: { type: Boolean, default: false },
    // 체크바 단일 선택(Radio: true) / 다중 선택(Checkbox: false)
    exclusiveSelectable: { type: Boolean, default: false },
    // 셀 이탈 시 편집 내용 자동 커밋 가능 여부 (-able)
    autoCommittable: { type: Boolean, default: true },
    // 하단 합계/소계 푸터(Footer) 영역 표시 여부
    showFooter: { type: Boolean, default: undefined },
    // 행 삭제 시 DB 즉시삭제 대신 삭제상태(Deleted) 표기 여부 (-able)
    softDeletable: { type: Boolean, default: undefined },

    // -------------------------------------------------------------------------
    // ⚙️ [2. 세부 모드 및 값 입력 전용] RealGrid 2 원본 명칭 그대로 유연 입력 Props
    // -------------------------------------------------------------------------
    // 체크바 선택열 너비(px)
    checkBarWidth: { type: Number, default: 36 },
    // 상태바 열 너비(px)
    stateBarWidth: { type: Number, default: 20 },
    // 그룹핑 소계 행 계산/표시 방식 ('aggregate' / 'none')
    groupSummaryMode: { type: String, default: 'aggregate' },
    // 컬럼 너비 화면 채움 방식 ('evenFill' / 'none' / 'fill')
    fitStyle: { type: String, default: 'evenFill' },
    // 초기 좌측 고정 열 개수 (0이면 미고정)
    fixedColCount: { type: Number, default: 0 },
    // 초기 상단 고정 행 개수 (0이면 미고정)
    fixedRowCount: { type: Number, default: 0 },

    // -------------------------------------------------------------------------
    // 🌐 [3. 하이브리드 통-객체 주입] 세부 RealGrid 옵션 오버라이드 객체 Props
    // -------------------------------------------------------------------------
    // 통-객체로 세부 RealGrid 옵션 일괄 넘기기 (Hybrid Pattern)
    options: { type: Object, default: () => ({}) },
    // options 와 동의어 (Hybrid Pattern)
    gridOptions: { type: Object, default: () => ({}) },

    // -------------------------------------------------------------------------
    // 🔄 [4. 레거시 구버전 명칭 호환용] (Legacy Fallback Props)
    // -------------------------------------------------------------------------
    // groupable 의 구버전 호환 이름
    useGroupPanel: { type: Boolean, default: false },
    // showFooter 의 구버전 호환 이름
    useFooter: { type: Boolean, default: false },
    // softDeletable 의 구버전 호환 이름
    softDeleting: { type: Boolean, default: true },
  },
  data() {
    return {
      gridView: null,
      dataProvider: null
    }
  },
  created() {
    this.$tabStore = useTabStore()
  },
  mounted() {
    this.$nextTick(() => {
      const realGridComp = this.$refs.realGridComp
      if (realGridComp && realGridComp.gridView && !this.gridView) {
        this.initGrid(realGridComp.gridView)
      }
    })
  },
  computed: {
    currentTheme() {
      return this.$tabStore?.sidebarTheme || 'light'
    },
    resolvedSortable() {
      return this.sortable
    },
    resolvedFilterable() {
      return this.filterable
    },
    resolvedCheckable() {
      return this.checkable
    },
    resolvedIndicatable() {
      return this.indicatable
    },
    resolvedStateBarVisible() {
      return this.stateBarVisible
    },
    resolvedPinnable() {
      return this.pinnable
    },
    resolvedGroupable() {
      return this.groupable !== undefined ? this.groupable : this.useGroupPanel
    },
    resolvedShowFooter() {
      return this.showFooter !== undefined ? this.showFooter : this.useFooter
    },
    resolvedSoftDeletable() {
      return this.softDeletable !== undefined ? this.softDeletable : this.softDeleting
    }
  },
  watch: {
    // ✨ computed 경유로 Pinia 테마 변경 감지
    currentTheme(newTheme) {
      this.applyGridTheme(newTheme)
    }
  },
  methods: {
    initGrid(arg) {
      const realGridComp = this.$refs.realGridComp
      const gv = (realGridComp && realGridComp.gridView) || arg
      if (!gv) return

      this.gridView = markRaw(gv)
      this.dataProvider = markRaw((realGridComp && realGridComp.dataProvider) || (gv.getDataSource && gv.getDataSource()))

      // 🏆 하이브리드 패턴: 낱개 Prop 기본값 + options/gridOptions 객체 오버라이드 병합
      const customOpts = { ...(this.options || {}), ...(this.gridOptions || {}) }

      // 1:1 완벽 동등한 옵션 바인딩
      if (this.dataProvider) {
        this.dataProvider.softDeleting = this.resolvedSoftDeletable
      }
      this.gridView.hideDeletedRows = this.hideDeletedRows

      this.gridView.setEditOptions({
        editable: this.editable,
        insertable: this.editable,
        appendable: this.editable,
        commitWhenLeave: this.autoCommittable,
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
      this.gridView.setFooter({ visible: this.resolvedShowFooter, ...(customOpts.footer || {}) })

      if (this.resolvedGroupable) {
        this.gridView.setDisplayOptions({ columnMovable: true, fitStyle: fitStyleVal, ...(customOpts.displayOptions || {}) })
        this.gridView.setGroupPanel({ visible: true, ...(customOpts.groupPanel || {}) })
        this.gridView.setGroupingOptions({ enabled: true, ...(customOpts.groupingOptions || {}) })
        this.gridView.setSortingOptions({ enabled: this.resolvedSortable, ...(customOpts.sortingOptions || {}) })
        this.gridView.setRowGroup({
          summaryMode: this.groupSummaryMode,
          mergeMode: this.mergeable,
          hideGroupedColumn: this.columnHideable,
          ...(customOpts.rowGroup || {})
        })
      } else {
        this.gridView.setDisplayOptions({ fitStyle: fitStyleVal, rowHoverType: 'row', ...(customOpts.displayOptions || {}) })
        this.applySortingOptions()
      }

      this.applyFixContextMenu()
      this.applyColumnFilters()

      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
      // 초기 테마 적용
      this.applyGridTheme(this.$tabStore?.sidebarTheme || 'light')

      this.$nextTick(() => {
        this.applyFixContextMenu()
      })
    },

    applyControlBars(customOpts = {}) {
      if (!this.gridView) return

      try {
        this.gridView.setIndicator({
          visible: this.resolvedIndicatable,
          draggableSelectedRows: false,
          ...(customOpts.indicator || {})
        })
      } catch (e) { /* noop */ }

      if (this.resolvedStateBarVisible) {
        this.gridView.setStateBar({
          visible: true,
          width: customOpts.stateBar?.width || this.stateBarWidth || 20,
          stateStyles: {
            insert: { background: '#22c55e' },   // 추가 → 초록
            update: { background: '#3b82f6' },   // 수정 → 파랑
            delete: { background: '#ef4444' },   // 삭제 → 빨강
            read:   { background: 'transparent' } // 기본 → 투명
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

    onContextMenuPopup() {
      return true
    },

    onContextMenuItemClicked(grid, item, clickData) {
      this.handleDynamicFixing(item, clickData)
    },

    applyFixContextMenu() {
      if (!this.gridView || !this.resolvedPinnable) return
      if (typeof this.gridView.setContextMenu !== 'function') return
      try {
        this.gridView.setContextMenu([
          { label: '📌 선택한 열까지 고정', tag: 'fixColumn' },
          { label: '📌 선택한 행까지 고정', tag: 'fixRow' },
          { label: '📌 선택한 행/열 모두 고정', tag: 'fixBoth' },
          { label: '-' },
          { label: '❌ 고정 해제 (초기화)', tag: 'clearFixing' }
        ])
        
        // 바닐라 RealGrid2 direct 이벤트 설정 (100% 안전 바인딩)
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
    // 🎨 동적 테마 연동: 제어열(indicator / checkBar / stateBar)
    // =========================================================
    getGridThemeStyles(theme) {
      const isDark = theme === 'dark' || theme === 'dark-navy'
      const isNavy = theme === 'dark-navy'

      if (isDark) {
        const bg     = isNavy ? '#1e293b' : '#1e293b'
        const headBg = isNavy ? '#0f172a' : '#111827'
        const border = isNavy ? '1px solid #334155' : '1px solid #374151'
        const color  = '#f8fafc'
        const cell   = { background: bg, color, borderRight: border }
        const head   = { background: headBg, color, borderBottom: border }
        return {
          indicator: { ...cell, head },
          checkBar:  { ...cell, head },
          stateBar:  { background: bg, borderRight: border },
        }
      } else {
        // Light 테마 — tokens.css 정확히 일치
        const cell = { background: '#FFFFFF', color: '#1E293B', borderRight: '1px solid #E2E8F0' }
        const head = { background: '#F1F5F9', color: '#1E293B', borderBottom: '1px solid #E2E8F0' }
        return {
          indicator: { ...cell, head },
          checkBar:  { ...cell, head },
          stateBar:  { background: '#FFFFFF', borderRight: '1px solid #E2E8F0' },
        }
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

    // Public API Methods (RealGridCommonJs와 100% 동일)
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
      }
      return false
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
            showProgress: true,
            indicator: 'visible',
            header: 'visible',
            footer: 'visible'
          })
          showToast(`'${name}' 엑셀 내보내기를 실행했습니다.`, { type: 'success' })
        } else {
          showToast('RealGrid exportGrid 내장 메서드를 호출할 수 없습니다.', { type: 'warning' })
        }
      } catch (err) {
        console.error('Excel export error:', err)
        showToast('엑셀 파일 내보내기에 실패했습니다.', { type: 'danger' })
      }
    },

    getColumnsInfo() {
      if (!this.gridView) return []
      try {
        const cols = this.gridView.getColumns() || []
        return cols.map(c => ({
          name: c.name,
          headerText: c.header?.text || c.name,
          visible: c.visible !== false
        }))
      } catch (e) {
        return []
      }
    },

    setColumnVisible(colName, visible) {
      if (!this.gridView) return
      try {
        this.gridView.setColumnProperty(colName, 'visible', visible)
      } catch (e) {
        console.warn('setColumnVisible failed:', e)
      }
    },

    searchGrid(query, direction = 'next') {
      if (!this.gridView || !this.dataProvider || !query || !query.trim()) {
        return { count: 0, current: 0 }
      }

      try {
        const keyword = query.trim().toLowerCase()
        const rowCount = this.dataProvider.getRowCount()
        const matches = []

        for (let r = 0; r < rowCount; r++) {
          const rowJson = this.dataProvider.getJsonRow(r) || {}

          for (const [colKey, val] of Object.entries(rowJson)) {
            if (val !== undefined && val !== null && String(val).toLowerCase().includes(keyword)) {
              let itemIdx = typeof this.gridView.getItemIndexOfRow === 'function'
                ? this.gridView.getItemIndexOfRow(r)
                : r

              if (itemIdx < 0 && typeof this.gridView.getItemCount === 'function') {
                const totalItems = this.gridView.getItemCount()
                for (let i = 0; i < totalItems; i++) {
                  try { this.gridView.expandGroup(i, true, true) } catch (e) {}
                }
                itemIdx = typeof this.gridView.getItemIndexOfRow === 'function'
                  ? this.gridView.getItemIndexOfRow(r)
                  : r
              }

              if (itemIdx >= 0) {
                matches.push({ itemIndex: itemIdx, dataRow: r, column: colKey })
              }
            }
          }
        }

        if (matches.length === 0) {
          showToast(`'${query}' 검색 결과가 없습니다.`, { type: 'warning' })
          return { count: 0, current: 0 }
        }

        const currentCell = this.gridView.getCurrent()
        const startIndex = currentCell && currentCell.itemIndex >= 0 ? currentCell.itemIndex : -1
        const startColumn = currentCell && currentCell.column ? currentCell.column : ''

        let targetIdx = 0
        if (direction === 'next') {
          const found = matches.findIndex(m =>
            m.itemIndex > startIndex || (m.itemIndex === startIndex && m.column > startColumn)
          )
          targetIdx = found >= 0 ? found : 0
        } else if (direction === 'prev') {
          const reversed = [...matches].reverse()
          const found = reversed.findIndex(m =>
            m.itemIndex < startIndex || (m.itemIndex === startIndex && m.column < startColumn)
          )
          if (found >= 0) {
            targetIdx = matches.length - 1 - found
          } else {
            targetIdx = matches.length - 1
          }
        }

        const target = matches[targetIdx]
        if (target) {
          this.gridView.setCurrent({ itemIndex: target.itemIndex, column: target.column })
          if (typeof this.gridView.showCell === 'function') {
            try { this.gridView.showCell(target.itemIndex, target.column) } catch (e) {}
          }
          this.gridView.setFocus()
        }

        return { count: matches.length, current: targetIdx + 1 }
      } catch (e) {
        console.error('searchGrid error:', e)
        return { count: 0, current: 0 }
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
