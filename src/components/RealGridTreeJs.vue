<template>
  <div class="realgrid-tree-wrapper w-100">
    <div ref="treeElement" class="w-100" :style="{ height: height }"></div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-white.css'
import { markRaw } from 'vue'

/**
 * RealGrid 트리 그리드 (계층형) — 자기완결 STANDALONE 버전
 * =========================================================
 * TreeView + LocalTreeDataProvider 기반 계층형 그리드.
 *
 * ⭐ 이식성(Portability): 이 컴포넌트는 프로젝트 전용 모듈에 의존하지 않는다.
 *    - 공통 로직(테마/제어열/엑셀/검색/변경추적/고정)을 mixin 대신 이 파일에 인라인.
 *      → 다른 프로젝트의 realgridCommon(mixin)과 이름 충돌 없음. 파일 1개만 복사하면 동작.
 *    - 외부 import 는 `realgrid`, `vue` 뿐. (@/stores, @/utils, @/mixins 미참조)
 *    - 테마: `theme` prop 또는 <html data-theme> 속성에서 자동 감지(없으면 'light').
 *    - 토스트: `toast` 함수 prop 주입(없으면 'notify' 이벤트 emit + console 폴백).
 *
 * 데이터 모델: 중첩(children) 방식
 *  rows = [
 *    { code: '1000', name: '경영지원본부', children: [
 *        { code: '1100', name: '인사팀' },
 *        { code: '1200', name: '총무팀', children: [ ... ] }
 *    ]}
 *  ]
 */
export default {
  name: 'RealGridTreeJs',
  props: {
    // ---- 데이터/표시 ----
    fields: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    height: { type: String, default: '580px' },
    // ---- 트리 계층 매핑 ----
    childrenField: { type: String, default: 'children' }, // 자식 배열이 담긴 속성명(중첩 모델)
    iconField: { type: String, default: '' },             // 아이콘 경로 필드명(선택)
    treeLineVisible: { type: Boolean, default: true },
    expandAllOnLoad: { type: Boolean, default: true },
    enableDragAndDrop: { type: Boolean, default: true },   // 드래그 노드 이동
    // ---- 공통 제어열/편집 옵션 (기존 mixin에서 인라인) ----
    editable: { type: Boolean, default: true },            // 셀 편집/행 추가 가능
    softDeleting: { type: Boolean, default: true },        // 소프트 삭제(삭제표시)
    hideDeletedRows: { type: Boolean, default: true },     // 삭제표시 행 숨김
    useStateBar: { type: Boolean, default: true },         // 행 상태 컬러 바
    useCheckBar: { type: Boolean, default: true },         // 좌측 체크박스 열
    useIndicator: { type: Boolean, default: true },        // 행번호 인디케이터 열
    checkBarExclusive: { type: Boolean, default: false },  // 체크박스 단일선택
    checkBarWidth: { type: Number, default: 36 },
    stateBarWidth: { type: Number, default: 20 },
    useFixContextMenu: { type: Boolean, default: true },   // 우클릭 컨텍스트 메뉴
    useColumnFilter: { type: Boolean, default: true },     // 헤더 컬럼 필터(자동 값목록) 활성화

    // ---- ✨ 글로벌 표준 형용사형 Props (글로벌 UI 그리드 스탠다드) ----
    sortable: { type: Boolean, default: true },             // 헤더 컬럼 정렬 기능 활성화
    filterable: { type: Boolean, default: undefined },      // 헤더 컬럼 필터 활성화 (fallback: useColumnFilter)
    checkable: { type: Boolean, default: undefined },       // 체크박스 선택열 (fallback: useCheckBar)
    indicatable: { type: Boolean, default: undefined },     // 행번호 인디케이터열 (fallback: useIndicator)
    stateBarVisible: { type: Boolean, default: undefined }, // 행상태 바 (fallback: useStateBar)
    pinnable: { type: Boolean, default: undefined },        // 우클릭 고정 메뉴 (fallback: useFixContextMenu)
    draggable: { type: Boolean, default: undefined },       // 트리 노드 드래그앤드롭 (fallback: enableDragAndDrop)
    autoExpandAll: { type: Boolean, default: undefined },   // 로드 시 전체 자동 펼침 (fallback: expandAllOnLoad)
    showTreeLines: { type: Boolean, default: undefined },   // 트리 가이드 라인 (fallback: treeLineVisible)
    softDeletable: { type: Boolean, default: undefined },   // 소프트 삭제 (fallback: softDeleting)

    // ---- 이식성 의존성 주입 (선택) ----
    theme: { type: String, default: '' },                  // '' 이면 <html data-theme>에서 자동 감지
    toast: { type: Function, default: null }               // (message, {type}) 알림 콜백. 없으면 'notify' emit + console
  },
  emits: ['init', 'notify', 'node-moved', 'parent-changed'],
  computed: {
    resolvedSortable() {
      return this.sortable
    },
    resolvedFilterable() {
      return this.filterable !== undefined ? this.filterable : this.useColumnFilter
    },
    resolvedCheckable() {
      return this.checkable !== undefined ? this.checkable : this.useCheckBar
    },
    resolvedIndicatable() {
      return this.indicatable !== undefined ? this.indicatable : this.useIndicator
    },
    resolvedStateBarVisible() {
      return this.stateBarVisible !== undefined ? this.stateBarVisible : this.useStateBar
    },
    resolvedPinnable() {
      return this.pinnable !== undefined ? this.pinnable : this.useFixContextMenu
    },
    resolvedDraggable() {
      return this.draggable !== undefined ? this.draggable : this.enableDragAndDrop
    },
    resolvedAutoExpandAll() {
      return this.autoExpandAll !== undefined ? this.autoExpandAll : this.expandAllOnLoad
    },
    resolvedShowTreeLines() {
      return this.showTreeLines !== undefined ? this.showTreeLines : this.treeLineVisible
    },
    resolvedSoftDeletable() {
      return this.softDeletable !== undefined ? this.softDeletable : this.softDeleting
    }
  },
  watch: {
    theme() {
      this.applyGridTheme(this._resolveTheme())
    },
    enableDragAndDrop(newVal) {
      this.applyDragAndDropOptions(newVal)
    },
    rows: {
      deep: true,
      handler(newRows) {
        this.setTreeRows(newRows || [])
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
    this.$nextTick(() => {
      this.applyGridTheme(this._resolveTheme())
    })
    this._watchTheme()
  },
  beforeUnmount() {
    if (this._themeObserver) {
      try { this._themeObserver.disconnect() } catch (e) { /* noop */ }
      this._themeObserver = null
    }
    this.destroyGrid()
  },
  methods: {
    // =========================================================
    // 🔌 이식성 헬퍼: 테마 감지 / 알림 (프로젝트 의존성 제거)
    // =========================================================
    /** theme prop → <html data-theme> → 'light' 순으로 현재 테마 해석 */
    _resolveTheme() {
      if (this.theme) return this.theme
      if (typeof document !== 'undefined') {
        return document.documentElement.getAttribute('data-theme') || 'light'
      }
      return 'light'
    },

    /** <html data-theme> 변경 감지 → 제어열 테마 재적용 (Pinia 불필요) */
    _watchTheme() {
      if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return
      this._themeObserver = new MutationObserver(() => {
        this.applyGridTheme(this._resolveTheme())
      })
      this._themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      })
    },

    /** 알림: toast prop 우선 → 없으면 'notify' 이벤트 emit + console 폴백 */
    _notify(message, opts = {}) {
      const type = opts.type || 'info'
      if (typeof this.toast === 'function') {
        try { this.toast(message, opts) } catch (e) { /* noop */ }
        return
      }
      this.$emit('notify', { message, type })
      try { console.log(`[RealTree:${type}] ${message}`) } catch (e) { /* noop */ }
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
        console.warn('[RealGridTree] applyGridTheme error:', e)
      }
    },

    // =========================================================
    // 제어열(Indicator / StateBar / CheckBar) — props로 제어
    // =========================================================
    applyControlBars() {
      if (!this.gridView) return

      try {
        this.gridView.setIndicator({
          visible: this.resolvedIndicatable,
          draggableSelectedRows: this.resolvedDraggable !== false
        })
      } catch (e) { /* noop */ }

      if (this.resolvedStateBarVisible) {
        this.gridView.setStateBar({
          visible: true,
          width: this.stateBarWidth,
          stateStyles: {
            insert: { background: '#22c55e' },
            update: { background: '#3b82f6' },
            delete: { background: '#ef4444' },
            read:   { background: 'transparent' }
          }
        })
      } else {
        this.gridView.setStateBar({ visible: false })
      }

      if (this.resolvedCheckable) {
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
      if (this.gridView) this.gridView.setFixedOptions(options)
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
          this._notify(`'${clickData.column}' 컬럼까지 열 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'fixRow' && clickData.itemIndex !== undefined && clickData.itemIndex >= 0) {
        rowCount = clickData.itemIndex + 1
        this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
        this._notify(`${rowCount}번째 행까지 행 고정이 적용되었습니다.`, { type: 'success' })
        return true
      } else if (item.tag === 'fixBoth' && clickData.column && clickData.itemIndex !== undefined) {
        const colIdx = this.getColumnIndexByName(clickData.column)
        if (colIdx >= 0 && clickData.itemIndex >= 0) {
          colCount = colIdx + 1
          rowCount = clickData.itemIndex + 1
          this.gridView.setFixedOptions({ colCount, rowCount, resizable: true })
          this._notify(`${rowCount}행 x '${clickData.column}'열 동시 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'clearFixing') {
        this.gridView.setFixedOptions({ colCount: 0, rowCount: 0 })
        this._notify('행/열 고정이 해제되었습니다.', { type: 'info' })
        return true
      }
      return false
    },

    // =========================================================
    // 엑셀 내보내기
    // =========================================================
    exportToExcel(fileName = 'RealGrid_Tree.xlsx') {
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
          this._notify(`'${name}' 엑셀 내보내기를 실행했습니다.`, { type: 'success' })
        } else {
          this._notify('RealGrid exportGrid 내장 메서드를 호출할 수 없습니다.', { type: 'warning' })
        }
      } catch (err) {
        console.error('Excel export error:', err)
        this._notify('엑셀 파일 내보내기에 실패했습니다.', { type: 'danger' })
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
    // 펼치기 / 접기 (트리 노드)
    // =========================================================
    expandAll(...args) {
      if (this.gridView && typeof this.gridView.expandAll === 'function') {
        try { this.gridView.expandAll(...args) } catch (e) { /* noop */ }
      }
    },

    collapseAll(...args) {
      if (this.gridView && typeof this.gridView.collapseAll === 'function') {
        try { this.gridView.collapseAll(...args) } catch (e) { /* noop */ }
      }
    },

    expand(itemIndex, ...args) {
      if (this.gridView && typeof this.gridView.expand === 'function') {
        try { this.gridView.expand(itemIndex, ...args) } catch (e) { /* noop */ }
      }
    },

    // =========================================================
    // 트리 검색 (전수 검사 + 트리 자동 펼침)
    // =========================================================
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

              // 트리가 접혀서 숨겨져 있으면 자동으로 펼쳐서 노출
              if (itemIdx < 0) {
                if (typeof this.gridView.expandAll === 'function') {
                  try { this.gridView.expandAll() } catch (e) { /* noop */ }
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
          this._notify(`'${query}' 검색 결과가 없습니다.`, { type: 'warning' })
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
          targetIdx = found >= 0 ? matches.length - 1 - found : matches.length - 1
        }

        const target = matches[targetIdx]
        if (target) {
          this.gridView.setCurrent({ itemIndex: target.itemIndex, column: target.column })
          if (typeof this.gridView.showCell === 'function') {
            try { this.gridView.showCell(target.itemIndex, target.column) } catch (e) { /* noop */ }
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
      if (!this.dataProvider) return { created: [], updated: [], deleted: [], moved: [] }
      const dp = this.dataProvider
      const createdIdx = dp.getStateRows('created') || []
      const updatedIdx = dp.getStateRows('updated') || []
      const deletedIdx = dp.getStateRows('deleted') || []

      // moved: 이벤트로 누적한 이동 노드 중 created/deleted 는 제외한다.
      //  - created 는 최종 위치가 생성 payload 로 처리(별도 재배치 불필요)
      //  - deleted 는 이동이 무의미
      const createdSet = new Set(createdIdx)
      const deletedSet = new Set(deletedIdx)
      const moved = [...(this._movedRows || [])]
        .filter(r => !createdSet.has(r) && !deletedSet.has(r))
        .map(r => this._buildMovedEntry(r))
        .filter(Boolean)

      return {
        created: createdIdx.map(idx => dp.getJsonRow(idx)),
        updated: updatedIdx.map(idx => dp.getJsonRow(idx)),
        deleted: deletedIdx.map(idx => dp.getJsonRow(idx)),
        moved
      }
    },

    /**
     * 이동 노드 1건의 델타 엔트리 생성.
     *  { row: 노드 JSON, parentRow: 새 부모 JSON(루트면 null), index: 형제 내 순서(0-base),
     *    dataRow, parentDataRow(내부 참조) }
     * 서버 전송 시 소비 페이지가 row/parentRow 에서 자신의 비즈니스 키를 매핑한다.
     */
    _buildMovedEntry(dataRow) {
      const dp = this.dataProvider
      if (!dp) return null
      const row = dp.getJsonRow(dataRow)
      if (!row) return null // 이미 제거된 행 방어
      let parentDataRow = -1
      let parentRow = null
      let index = -1
      try {
        parentDataRow = typeof dp.getParent === 'function' ? dp.getParent(dataRow) : -1
        const siblings = typeof dp.getChildren === 'function'
          ? (dp.getChildren(parentDataRow >= 0 ? parentDataRow : -1) || [])
          : []
        index = siblings.indexOf(dataRow)
        parentRow = parentDataRow >= 0 ? dp.getJsonRow(parentDataRow) : null
      } catch (e) {
        console.warn('[RealGridTree] _buildMovedEntry error:', e)
      }
      return { row, parentRow, index, dataRow, parentDataRow }
    },

    clearRowStates() {
      if (this.dataProvider) this.dataProvider.clearRowStates()
      if (this._movedRows) this._movedRows.clear() // 이동 델타 추적 초기화
    },

    // =========================================================
    // 공통 데이터/편집 API
    // =========================================================
    setFields(fields) {
      if (this.dataProvider) this.dataProvider.setFields(fields)
    },

    setColumns(columns) {
      if (this.gridView) this.gridView.setColumns(columns)
    },

    /** 체크된 행 삭제 (트리는 하위 포함) */
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
        try { this.gridView.commit(true) } catch (e) { /* noop */ }
      }
    },

    // =========================================================
    // 소멸
    // =========================================================
    destroyGrid() {
      if (this.gridView) {
        try { this.gridView.destroy() } catch (e) { /* noop */ }
        this.gridView = null
      }
      if (this.dataProvider) {
        try { this.dataProvider.destroy() } catch (e) { /* noop */ }
        this.dataProvider = null
      }
    },

    // =========================================================
    // 트리 초기화
    // =========================================================
    initGrid() {
      const container = this.$refs.treeElement
      if (!container) return

      const LocalTreeDataProvider = RealGrid.LocalTreeDataProvider || RealGrid.default?.LocalTreeDataProvider
      const TreeView = RealGrid.TreeView || RealGrid.default?.TreeView

      if (!LocalTreeDataProvider || !TreeView) {
        console.error('[RealGridTree] TreeView / LocalTreeDataProvider 를 찾을 수 없습니다. realgrid 버전을 확인하세요.')
        return
      }

      this.dataProvider = markRaw(new LocalTreeDataProvider())
      this.gridView = markRaw(new TreeView(container))
      this.gridView.setDataSource(this.dataProvider)

      this.dataProvider.softDeleting = this.resolvedSoftDeletable
      this.gridView.hideDeletedRows = this.hideDeletedRows

      this.gridView.setEditOptions({
        editable: this.editable,
        insertable: this.editable,
        appendable: this.editable,
        commitWhenLeave: true
      })

      this.applyControlBars()
      this.applyDragAndDropOptions(this.resolvedDraggable)
      this.applySortingOptions()
      this.bindTreeEvents()

      this.gridView.setDisplayOptions({
        fitStyle: 'evenFill',
        rowHoverType: 'row'
      })
      try {
        this.gridView.setTreeOptions({ lineVisible: this.resolvedShowTreeLines })
      } catch (e) {
        console.warn('[RealGridTree] setTreeOptions 실패:', e)
      }

      this.applyDeletedRowStyle()

      if (this.fields && this.fields.length > 0) {
        this.dataProvider.setFields(this.fields)
      }
      if (this.columns && this.columns.length > 0) {
        this.gridView.setColumns(this.columns)
      }

      if (this.rows && this.rows.length > 0) {
        this.setTreeRows(this.rows)
      }

      // 동적 우클릭 컨텍스트 메뉴(CRUD, 고정, 펼침, 이동) 자동 배선
      this.initTreeContextMenu()
      // 헤더 컬럼 필터 활성화 (filterable/useColumnFilter, 트리는 조상 유지 includeParentItem)
      this.applyColumnFilters()

      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
      this.applyGridTheme(this._resolveTheme())
    },

    /**
     * 정렬 기능 활성화/비활성화 (sortable prop)
     */
    applySortingOptions() {
      if (!this.gridView) return
      try {
        if (typeof this.gridView.setSortingOptions === 'function') {
          this.gridView.setSortingOptions({ enabled: this.resolvedSortable })
        }
      } catch (e) {
        console.warn('[RealGridTree] applySortingOptions error:', e)
      }
    },

    /**
     * 헤더 컬럼 필터 활성화. resolvedFilterable(기본 true)면 filteringOptions 를 켜고
     * (TreeView 는 includeParentItem:true 로 매칭 노드의 조상 경로를 유지) 각 컬럼
     * autoFilter=true 로 설정 → 필터 아이콘 클릭 시 distinct 값 목록 자동 생성.
     */
    applyColumnFilters() {
      if (!this.gridView) return
      try {
        this.gridView.setFilteringOptions({ enabled: this.resolvedFilterable, includeParentItem: true })
        if (this.resolvedFilterable) {
          const cols = typeof this.gridView.getColumns === 'function' ? (this.gridView.getColumns() || []) : []
          cols.forEach(c => {
            try { this.gridView.setColumnProperty(c.name, 'autoFilter', true) } catch (e) { /* noop */ }
          })
        }
      } catch (e) {
        console.warn('[RealGridTree] applyColumnFilters error:', e)
      }
    },

    /**
     * 삭제 상태(deleted) 행에 취소선 CSS 클래스를 부여한다.
     * RealGrid 는 styleName 클래스의 computed `text-decoration-line` 을 읽어
     * 캔버스에 취소선을 렌더링한다. (.rg-deleted-row 는 전역 CSS 에 정의)
     */
    applyDeletedRowStyle() {
      if (!this.gridView || typeof this.gridView.setRowStyleCallback !== 'function') return
      const provider = this.dataProvider
      this.gridView.setRowStyleCallback((grid, item /*, fixed */) => {
        try {
          if (item && item.dataRow >= 0 && provider) {
            if (provider.getRowState(item.dataRow) === 'deleted') {
              return 'rg-deleted-row'
            }
          }
        } catch (e) { /* noop */ }
        return undefined
      })
    },

    /**
     * 트리 데이터 주입 (중첩 children 모델).
     * LocalTreeDataProvider.setNestedRows(json, rowsProp='', childRowsProp, childrenProp, iconProp)
     */
    setTreeRows(rows) {
      if (!this.dataProvider || typeof this.dataProvider.setNestedRows !== 'function') return
      try {
        this.dataProvider.setNestedRows(
          rows || [],
          '',
          this.childrenField,
          this.childrenField,
          this.iconField || undefined
        )
        if (this.resolvedAutoExpandAll && this.gridView) {
          try { this.gridView.expandAll() } catch (e) { /* noop */ }
        }
      } catch (e) {
        console.error('[RealGridTree] setTreeRows error:', e)
      }
    },

    // =========================================================
    // 트리 전용 Public API
    // =========================================================
    getParent(itemIndex) {
      return this.gridView && typeof this.gridView.getParent === 'function'
        ? this.gridView.getParent(itemIndex)
        : -1
    },

    getChildren(itemIndex) {
      return this.gridView && typeof this.gridView.getChildren === 'function'
        ? this.gridView.getChildren(itemIndex)
        : []
    },

    getCurrentItemIndex() {
      if (!this.gridView) return -1
      const cur = this.gridView.getCurrent()
      return cur && cur.itemIndex >= 0 ? cur.itemIndex : -1
    },

    getCurrentDataRow() {
      const item = this.getCurrentItemIndex()
      if (item < 0) return -1
      return this.gridView.getDataRow(item)
    },

    getCurrentNode() {
      const dr = this.getCurrentDataRow()
      if (dr < 0 || !this.dataProvider) return null
      return this.dataProvider.getJsonRow(dr)
    },

    _itemOfDataRow(dataRow) {
      const gv = this.gridView
      if (!gv || dataRow < 0) return -1
      if (typeof gv.getItemIndexOfRow === 'function') {
        const i = gv.getItemIndexOfRow(dataRow)
        if (i >= 0) return i
      }
      const n = gv.getItemCount ? gv.getItemCount() : 0
      for (let i = 0; i < n; i++) {
        if (gv.getDataRow(i) === dataRow) return i
      }
      return -1
    },

    // ---- 자식 추가 / 삭제 -------------------------------------
    addChildToCurrent(values = {}, opts = {}) {
      if (!this.dataProvider || !this.gridView) return -1
      const parentDataRow = this.getCurrentDataRow()
      if (parentDataRow < 0) return -1
      const newRow = this.dataProvider.addChildRow(parentDataRow, values, -1, false)

      this.$nextTick(() => {
        try {
          const parentItem = this._itemOfDataRow(parentDataRow)
          if (parentItem >= 0) this.gridView.expand(parentItem, false, true)
          const childItem = this._itemOfDataRow(newRow)
          if (childItem >= 0) {
            this.gridView.setCurrent({ itemIndex: childItem, column: opts.editColumn || undefined })
            if (opts.editColumn && typeof this.gridView.showEditor === 'function') {
              this.gridView.showEditor()
            }
            if (typeof this.gridView.setFocus === 'function') this.gridView.setFocus()
          }
        } catch (e) {
          console.warn('[RealGridTree] addChildToCurrent focus error:', e)
        }
      })
      return newRow
    },

    addRootRow(values = {}) {
      if (!this.dataProvider) return -1
      return this.dataProvider.addChildRow(-1, values, -1, false)
    },

    addSiblingToCurrent(values = {}, opts = {}) {
      if (!this.dataProvider || !this.gridView) return -1
      const currentItem = this.getCurrentItemIndex()
      if (currentItem < 0) return this.addRootRow(values)

      const parentItem = this.gridView.getParent(currentItem)
      const parentDataRow = parentItem >= 0 ? this.gridView.getDataRow(parentItem) : -1

      const newRow = this.dataProvider.addChildRow(parentDataRow, values, -1, false)

      this.$nextTick(() => {
        try {
          const childItem = this._itemOfDataRow(newRow)
          if (childItem >= 0) {
            this.gridView.setCurrent({ itemIndex: childItem, column: opts.editColumn || undefined })
            if (opts.editColumn && typeof this.gridView.showEditor === 'function') {
              this.gridView.showEditor()
            }
            if (typeof this.gridView.setFocus === 'function') this.gridView.setFocus()
          }
        } catch (e) { /* noop */ }
      })
      return newRow
    },

    /** 현재 선택 노드 및 모든 하위 자식 노드 재귀 전체 복제 */
    duplicateCurrentNode(targetRow = -1) {
      if (!this.dataProvider) return -1

      const dataRow = targetRow >= 0 ? targetRow : this.getCurrentDataRow()
      if (dataRow < 0) return -1

      const mainRow = this.dataProvider.getJsonRow(dataRow)
      if (!mainRow) return -1

      const childRows = this.dataProvider.getJsonRows(dataRow, true)
      const cleanNode = (item) => {
        const copy = { ...item }
        const children = copy.rows || copy.children || []
        delete copy.rows
        delete copy.children
        delete copy.__rowId
        delete copy.__rowState
        delete copy.iconIndex
        if (Array.isArray(children) && children.length > 0) {
          copy.children = children.map(c => cleanNode(c))
        }
        return copy
      }

      const nodeTree = cleanNode(mainRow)
      if (Array.isArray(childRows) && childRows.length > 0) {
        nodeTree.children = childRows.map(c => cleanNode(c))
      }

      const itemIdx = this._itemOfDataRow(dataRow)
      const parentItem = (itemIdx >= 0 && this.gridView) ? this.gridView.getParent(itemIdx) : -1
      const parentDataRow = parentItem >= 0 ? this.gridView.getDataRow(parentItem) : -1

      const cloned = JSON.parse(JSON.stringify(nodeTree))

      let isFirstNode = true
      const prepareClonedTree = (node) => {
        const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
        if (isFirstNode) {
          if (node.deptName) node.deptName += ' (복사본)'
          if (node.menuName) node.menuName += ' (복사본)'
          if (node.name) node.name += ' (복사본)'
          isFirstNode = false
        }
        if (node.deptCode) node.deptCode = 'COPY-' + rnd
        if (node.code) node.code = 'COPY-' + rnd
        if (node.path) node.path += '-copy'

        const children = node[this.childrenField] || node.children
        if (Array.isArray(children)) {
          children.forEach(child => prepareClonedTree(child))
        }
      }
      prepareClonedTree(cloned)

      const addTreeNodesRecursively = (prov, pRow, node) => {
        const rowValues = { ...node }
        const children = rowValues[this.childrenField] || rowValues.children
        delete rowValues[this.childrenField]
        delete rowValues.children

        const newRow = prov.addChildRow(pRow, rowValues, -1, false)
        if (Array.isArray(children) && children.length > 0) {
          for (const child of children) {
            addTreeNodesRecursively(prov, newRow, child)
          }
        }
        return newRow
      }

      const newParentRow = addTreeNodesRecursively(this.dataProvider, parentDataRow, cloned)

      this.$nextTick(() => {
        const childItem = this._itemOfDataRow(newParentRow)
        if (childItem >= 0 && this.gridView) {
          try {
            this.gridView.expand(childItem, false, true)
            this.gridView.setCurrent({ itemIndex: childItem })
          } catch (e) { /* noop */ }
        }
      })
      return newParentRow
    },

    /** 지정한 계층(레벨) 깊이까지만 전체 노드 펼치기 */
    expandLevel(level = 1) {
      if (!this.gridView) return
      try {
        this.gridView.collapseAll()
        const count = this.gridView.getItemCount()
        for (let i = 0; i < count; i++) {
          const itemLevel = typeof this.gridView.getLevel === 'function' ? this.gridView.getLevel(i) : 1
          if (itemLevel <= level) {
            this.gridView.expand(i, false, false)
          }
        }
      } catch (e) {
        console.warn('[RealGridTree] expandLevel error:', e)
      }
    },

    /** 현재 선택 노드 삭제 (recursive=true 면 하위 포함) */
    removeCurrent(recursive = true) {
      if (!this.dataProvider) return false
      const dataRow = this.getCurrentDataRow()
      if (dataRow < 0) return false
      try {
        this.dataProvider.removeRow(dataRow, recursive)
        return true
      } catch (e) {
        console.warn('[RealGridTree] removeCurrent error:', e)
        return false
      }
    },

    // ---- 노드 이동 / 부모 변경 -------------------------------
    applyDragAndDropOptions(enable) {
      if (!this.gridView) return
      try {
        this.gridView.setEditOptions({
          movable: enable,
          movableWhenFocusedOnly: false
        })
        if (typeof this.gridView.setDataDropOptions === 'function') {
          this.gridView.setDataDropOptions({ dropMode: enable ? 'move' : 'none' })
        }
        if (typeof this.gridView.setIndicator === 'function') {
          this.gridView.setIndicator({
            visible: this.useIndicator,
            draggableSelectedRows: enable
          })
        }
      } catch (e) {
        console.warn('[RealGridTree] applyDragAndDropOptions error:', e)
      }
    },

    bindTreeEvents() {
      if (!this.dataProvider) return
      // 이동(부모변경/형제순서변경) 노드 누적 Set. RealGrid 는 이동을 행 상태(updated)로
      // 마킹하지 않으므로 getStateRows 로는 못 잡는다 → 이벤트에서 dataRow 를 직접 모은다.
      if (!this._movedRows) this._movedRows = new Set()

      this.dataProvider.onRowParentChanging = (provider, row, parent, index) => {
        if (row === parent) return false
        try {
          if (typeof provider.getAncestors === 'function' && parent >= 0) {
            const ancestors = provider.getAncestors(parent) || []
            if (ancestors.includes(row)) {
              console.warn('[RealGridTree] 하위 노드를 상위 부모로 지정할 수 없습니다.')
              return false
            }
          }
        } catch (e) { /* noop */ }
        return true
      }

      this.dataProvider.onRowParentChanged = (provider, row, parent, index) => {
        this._movedRows.add(row) // 이동 델타 추적
        const itemIdx = this._itemOfDataRow(row)
        this.$emit('parent-changed', { row, parent, index, itemIndex: itemIdx })
      }

      this.dataProvider.onRowSiblingMoved = (provider, row, offset) => {
        this._movedRows.add(row) // 이동 델타 추적
        const itemIdx = this._itemOfDataRow(row)
        this.$emit('node-moved', { row, offset, itemIndex: itemIdx })
      }

      this.dataProvider.onRowsSiblingMoved = (provider, rows, offset) => {
        (rows || []).forEach(r => this._movedRows.add(r)) // 이동 델타 추적
        this.$emit('node-moved', { rows, offset })
      }
    },

    moveCurrentUp() {
      if (!this.dataProvider) return false
      const dataRow = this.getCurrentDataRow()
      if (dataRow < 0) return false
      try {
        const ok = this.dataProvider.moveRowSibling(dataRow, -1)
        if (ok && this.gridView) {
          const itemIdx = this._itemOfDataRow(dataRow)
          if (itemIdx >= 0) this.gridView.setCurrent({ itemIndex: itemIdx })
        }
        return ok
      } catch (e) {
        console.warn('[RealGridTree] moveCurrentUp error:', e)
        return false
      }
    },

    moveCurrentDown() {
      if (!this.dataProvider) return false
      const dataRow = this.getCurrentDataRow()
      if (dataRow < 0) return false
      try {
        const ok = this.dataProvider.moveRowSibling(dataRow, 1)
        if (ok && this.gridView) {
          const itemIdx = this._itemOfDataRow(dataRow)
          if (itemIdx >= 0) this.gridView.setCurrent({ itemIndex: itemIdx })
        }
        return ok
      } catch (e) {
        console.warn('[RealGridTree] moveCurrentDown error:', e)
        return false
      }
    },

    changeNodeParent(row, parent, index = -1) {
      if (!this.dataProvider || row < 0) return false
      try {
        return this.dataProvider.changeRowParent(row, parent, index)
      } catch (e) {
        console.warn('[RealGridTree] changeNodeParent error:', e)
        return false
      }
    },

    /**
     * 동적 우클릭 트리 전용 컨텍스트 메뉴 바인딩.
     * 데이터 스키마와 무관하게 어떤 필드가 들어오든 동적으로 탐색하여 CRUD/이동/고정/펼침 실행.
     */
    initTreeContextMenu() {
      if (!this.gridView || this.resolvedPinnable === false) return

      this.gridView.setContextMenu([
        { label: '📌 선택한 열까지 고정', tag: 'fixColumn' },
        { label: '📌 선택한 행까지 고정', tag: 'fixRow' },
        { label: '📌 선택한 행/열 모두 고정', tag: 'fixBoth' },
        { label: '❌ 고정 해제 (초기화)', tag: 'clearFixing' },
        { label: '-' },
        { label: '➕ 하위 자식 노드 추가', tag: 'addChild' },
        { label: '➕ 동일 레벨(형제) 노드 추가', tag: 'addSibling' },
        { label: '📋 선택 노드 복제', tag: 'duplicateNode' },
        { label: '-' },
        { label: '➕ 모든 노드 전체 펼치기', tag: 'expandAll' },
        { label: '➖ 모든 노드 접기', tag: 'collapseAll' }
      ])

      // RealGrid 2 우클릭 메뉴 팝업 허용 필수 이벤트
      this.gridView.onContextMenuPopup = () => true

      this.gridView.onContextMenuItemClicked = (grid, item, clickData) => {
        if (clickData && clickData.itemIndex >= 0) {
          try { this.gridView.setCurrent({ itemIndex: clickData.itemIndex }) } catch (e) { /* noop */ }
        }

        // 1. 공통 행/열 고정 헬퍼
        if (this.handleDynamicFixing(item, clickData)) return

        // 2. 동적 텍스트 필드명 탐색 (하드코딩 금지)
        const textFields = (this.fields || []).filter(f => !f.dataType || f.dataType === 'text')
        const mainField = textFields.length > 0
          ? textFields[0].fieldName
          : (this.fields && this.fields[0] ? this.fields[0].fieldName : '')

        const defaultValues = {}
        if (mainField) defaultValues[mainField] = '신규 노드'

        if (item.tag === 'addChild') {
          this.addChildToCurrent(defaultValues, { editColumn: mainField })
          this._notify('하위 자식 노드가 추가되었습니다.', { type: 'success' })
        } else if (item.tag === 'addSibling') {
          this.addSiblingToCurrent(defaultValues, { editColumn: mainField })
          this._notify('동일 계층(형제 노드)이 추가되었습니다.', { type: 'success' })
        } else if (item.tag === 'duplicateNode') {
          const targetRow = clickData ? clickData.dataRow : -1
          const okRow = this.duplicateCurrentNode(targetRow)
          if (okRow >= 0) this._notify('선택한 노드가 복제되었습니다.', { type: 'success' })
        } else if (item.tag === 'expandAll') {
          this.expandAll()
          this._notify('모든 노드가 펼쳐졌습니다.', { type: 'info' })
        } else if (item.tag === 'collapseAll') {
          this.collapseAll()
          this._notify('모든 노드가 접혔습니다.', { type: 'info' })
        }
      }
    }
  }
}
</script>

<style scoped>
.realgrid-tree-wrapper {
  position: relative;
}
</style>

<!--
  전역(non-scoped) 스타일: RealGrid 는 setRowStyleCallback 이 반환한 클래스명의
  computed `text-decoration-line` 을 읽어 캔버스에 취소선을 렌더링한다.
  따라서 scoped 가 아닌 전역 클래스로 정의해야 한다.
-->
<style>
.rg-deleted-row {
  text-decoration-line: line-through;
  color: #ef4444;
}
</style>
