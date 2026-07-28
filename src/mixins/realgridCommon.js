/**
 * RealGrid 공통 로직 Mixin
 * =========================================================
 * GridView(일반 그리드)와 TreeView(트리 그리드)가 공유하는 로직을 모아둔 믹스인.
 * RealGrid의 TreeView / GridView 는 모두 GridBase 를 상속하므로,
 * 아래 메서드들은 this.gridView(GridView | TreeView) / this.dataProvider 에 대해 동일하게 동작한다.
 *
 * 사용하는 컴포넌트는 다음을 보장해야 한다:
 *  - this.gridView       : GridView 또는 TreeView 인스턴스
 *  - this.dataProvider   : LocalDataProvider 또는 LocalTreeDataProvider 인스턴스
 *  - this.$tabStore      : Pinia 테마 스토어 (각 컴포넌트 created() 에서 연결)
 *
 * ⚠️ 이 믹스인은 tabStore(→router→pages→components) 를 import 하지 않는다.
 *    믹스인은 컴포넌트 모듈 평가 시점(mixins: [...])에 참조되므로, 순환 참조에
 *    포함되면 HMR 시 TDZ 오류가 발생한다. 따라서 leaf 모듈로 유지하고
 *    스토어 연결은 각 컴포넌트의 created() 에서 직접 수행한다.
 */
import { showToast } from '@/utils/toastUtil.js'

// (HMR 순환참조 회피 검증됨: 이 모듈은 leaf 로 유지)
export default {
  // =========================================================
  // 공통 옵션 props (그리드 · 트리 공용)
  //  부모에서 <RealGridTreeJs :use-check-bar="false" /> 처럼 제어 가능.
  // =========================================================
  props: {
    editable: { type: Boolean, default: true },          // 셀 편집/행 추가 가능
    softDeleting: { type: Boolean, default: true },       // 소프트 삭제(삭제표시)
    hideDeletedRows: { type: Boolean, default: true },    // 삭제표시 행 숨김
    useStateBar: { type: Boolean, default: true },        // 행 상태 컬러 바
    useCheckBar: { type: Boolean, default: true },        // 좌측 체크박스 열
    useIndicator: { type: Boolean, default: true },       // 행번호 인디케이터 열
    checkBarExclusive: { type: Boolean, default: false }, // 체크박스 단일선택 모드
    checkBarWidth: { type: Number, default: 36 },         // 체크박스 열 너비
    stateBarWidth: { type: Number, default: 6 }           // 상태 바 너비
  },
  computed: {
    currentTheme() {
      return this.$tabStore?.sidebarTheme || 'light'
    }
  },
  watch: {
    // computed 경유로 Pinia 테마 변경 감지 → 그리드 제어열 테마 적용
    currentTheme(newTheme) {
      this.applyGridTheme(newTheme)
    }
  },
  beforeUnmount() {
    this.destroyGrid()
  },
  methods: {
    // =========================================================
    // 🎨 동적 테마 연동: 제어열(indicator / checkBar / stateBar)
    // =========================================================
    getGridThemeStyles(theme) {
      const isDark = theme === 'dark' || theme === 'dark-navy'
      const isNavy = theme === 'dark-navy'

      if (isDark) {
        const bg     = isNavy ? '#1e293b' : '#1e293b'  // slate-800
        const headBg = isNavy ? '#0f172a' : '#111827'  // slate-900
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
        this.gridView.setStyles(styles)
      } catch (e) {
        console.warn('[RealGrid] applyGridTheme error:', e)
      }
    },

    // =========================================================
    // 제어열(Indicator / StateBar / CheckBar) 공통 설정
    //  props(useStateBar/useCheckBar/useIndicator/...)로 켜고 끈다.
    // =========================================================
    applyControlBars() {
      if (!this.gridView) return

      // Indicator: 행번호 열
      try {
        this.gridView.setIndicator({ visible: this.useIndicator })
      } catch (e) { /* noop */ }

      // StateBar: 행 상태 컬러 뱃지 (추가=초록, 수정=파랑, 삭제=빨강)
      if (this.useStateBar) {
        this.gridView.setStateBar({
          visible: true,
          width: this.stateBarWidth,
          stateStyles: {
            insert: { background: '#22c55e' },   // 추가 → 초록
            update: { background: '#3b82f6' },   // 수정 → 파랑
            delete: { background: '#ef4444' },   // 삭제 → 빨강
            read:   { background: 'transparent' } // 기본 → 투명
          }
        })
      } else {
        this.gridView.setStateBar({ visible: false })
      }

      // CheckBar: 좌측 체크박스 열 (다중선택 / exclusive=단일선택)
      if (this.useCheckBar) {
        this.gridView.setCheckBar({
          visible: true,
          width: this.checkBarWidth,
          exclusive: this.checkBarExclusive,
          head: 'check',
          headCheckCallback: null
        })
      } else {
        this.gridView.setCheckBar({ visible: false })
      }
    },

    // =========================================================
    // 행/열 고정
    // =========================================================
    setFixedOptions(options) {
      if (this.gridView) {
        this.gridView.setFixedOptions(options)
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

    // =========================================================
    // 엑셀 내보내기
    // =========================================================
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

    // =========================================================
    // 컬럼 정보 / 표시 제어
    // =========================================================
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

    // =========================================================
    // 펼치기 / 접기 (트리 + 그룹 공통)
    //  - expandAll/collapseAll/expand : GridBase native
    //    (TreeView 노드, GridView 그룹 모두 지원)
    //  - expandAllGroups/collapseAllGroups : RowGroup 그리드용 멀티패스
    // =========================================================
    /** 트리 노드/그룹 전체 펼치기 (native) */
    expandAll(...args) {
      if (this.gridView && typeof this.gridView.expandAll === 'function') {
        try { this.gridView.expandAll(...args) } catch (e) {}
      }
    },

    /** 트리 노드/그룹 전체 접기 (native) */
    collapseAll(...args) {
      if (this.gridView && typeof this.gridView.collapseAll === 'function') {
        try { this.gridView.collapseAll(...args) } catch (e) {}
      }
    },

    /** 특정 아이템(노드/그룹) 펼치기 */
    expand(itemIndex, ...args) {
      if (this.gridView && typeof this.gridView.expand === 'function') {
        try { this.gridView.expand(itemIndex, ...args) } catch (e) {}
      }
    },

    /**
     * 그룹 행 전체 펼치기 (RowGroup 그리드 전용, 멀티패스).
     * 완전히 접힌 상태에서도 1·2차 모든 그룹을 100% 펼치기 위해 기본 2회 순회한다.
     */
    expandAllGroups(passes = 2) {
      if (!this.gridView) return
      for (let pass = 0; pass < passes; pass++) {
        const count = this.gridView.getItemCount()
        for (let i = 0; i < count; i++) {
          try { this.gridView.expandGroup(i, true, true) } catch (e) {}
        }
      }
    },

    /** 그룹 행 전체 접기 (RowGroup 그리드 전용) */
    collapseAllGroups() {
      if (!this.gridView) return
      const count = this.gridView.getItemCount()
      for (let i = count - 1; i >= 0; i--) {
        try { this.gridView.collapseGroup(i, true) } catch (e) {}
      }
    },

    // =========================================================
    // 그리드 검색 (전수 검사 + 그룹 자동 펼침)
    // =========================================================
    searchGrid(query, direction = 'next') {
      if (!this.gridView || !this.dataProvider || !query || !query.trim()) {
        return { count: 0, current: 0 }
      }

      try {
        const keyword = query.trim().toLowerCase()
        const rowCount = this.dataProvider.getRowCount()
        const matches = []

        // RealGrid DataProvider 전수 검사하여 매칭되는 (itemIndex, column) 수집
        for (let r = 0; r < rowCount; r++) {
          const rowJson = this.dataProvider.getJsonRow(r) || {}

          for (const [colKey, val] of Object.entries(rowJson)) {
            if (val !== undefined && val !== null && String(val).toLowerCase().includes(keyword)) {
              let itemIdx = typeof this.gridView.getItemIndexOfRow === 'function'
                ? this.gridView.getItemIndexOfRow(r)
                : r

              // 만약 그룹/트리가 접혀서 숨겨져 있으면(itemIdx < 0), 자동으로 펼쳐서 노출
              if (itemIdx < 0) {
                if (typeof this.gridView.expandAll === 'function') {
                  try { this.gridView.expandAll() } catch (e) {}
                } else if (typeof this.gridView.getItemCount === 'function') {
                  const totalItems = this.gridView.getItemCount()
                  for (let i = 0; i < totalItems; i++) {
                    try { this.gridView.expandGroup(i, true, true) } catch (e) {}
                  }
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
    },

    // =========================================================
    // 변경사항 추적 (C / U / D)
    // =========================================================
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

    // =========================================================
    // 공통 데이터/편집 API (그리드 · 트리 공용)
    //  ⚠️ 그룹화(groupBy/setGroupPanel/setRowGroup)는 GridView 전용이라
    //     여기 두지 않는다. TreeView 는 그룹화를 지원하지 않는다.
    // =========================================================
    setFields(fields) {
      if (this.dataProvider) this.dataProvider.setFields(fields)
    },

    setColumns(columns) {
      if (this.gridView) this.gridView.setColumns(columns)
    },

    /**
     * 체크된 행 삭제.
     * removeRows 의 2번째 인자는 그리드=rowEvents, 트리=recursive 로 의미가
     * 다르지만 둘 다 true 가 무해(그리드는 이벤트 발생, 트리는 하위 포함)하다.
     */
    deleteChecked() {
      if (!this.gridView || !this.dataProvider) return 0
      const checkedRows = (this.gridView.getCheckedRows ? this.gridView.getCheckedRows(false) : []) || []
      if (checkedRows.length > 0) {
        this.dataProvider.removeRows(checkedRows, true)
        if (this.gridView.clearCheckedItems) this.gridView.clearCheckedItems()
      }
      return checkedRows.length
    },

    /** 편집 중인 값 커밋 */
    commit() {
      if (this.gridView && typeof this.gridView.commit === 'function') {
        try { this.gridView.commit(true) } catch (e) {}
      }
    },

    // =========================================================
    // 소멸
    // =========================================================
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
