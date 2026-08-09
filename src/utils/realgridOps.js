/**
 * realgridOps.js — RealGrid 2 공용 순수 로직 (프레임워크 무관 · this/DOM/Vue 미참조)
 * =============================================================================
 * 여러 그리드 페이지가 공유하는, RealGrid 내장 API만으로는 안 되는 조합 로직을 모은다.
 *  - `searchGrid`        : 손으로 짠 "전 셀 통합 검색"(그룹/트리 접힘 자동 펼침 포함).
 *  - `captureViewState`  : 현재 뷰(컬럼 배치/고정/정렬, 옵션으로 그룹)를 직렬화 캡처.
 *  - `applyViewState`    : 캡처한 뷰 상태를 그리드에 복원.
 *
 * 공통 규약: gridView / dataProvider 를 인자로 받는다(페이지는 @init 으로 받은
 * this.gridView 로 직접 호출, refs 불필요). 알림은 toast(message, opts) 콜백에 위임.
 *
 * 그 외 단순 조작(commit/removeRows/clearRowStates/expandGroup/exportGrid 등)은 전부
 * RealGrid 내장 API 이므로 페이지에서 직접 호출한다 — 별도 유틸 불필요.
 */

const noop = () => {}

// =============================================================================
// 뷰 상태(레이아웃/그룹/고정/정렬) 캡처 · 복원 — 순수 함수
// -----------------------------------------------------------------------------
// "뷰 저장"을 행 그룹핑에 국한하지 않고, 사용자가 바꾼 컬럼 배치(이동/너비/표시),
// 행·열 고정, 정렬까지 포괄적으로 직렬화한다. gridView 만 있으면 어느 페이지든 쓴다.
//  - includeGroup: true 면 행 그룹핑 필드도 포함(피벗형 그리드 전용).
//  - 반환 객체는 그대로 JSON.stringify 가능(localStorage 저장용).
// =============================================================================

/** saveColumnLayout() 의 중첩(그룹) 구조를 평탄화해 컬럼 항목만 뽑는다. */
function flattenColumnLayout(items, out = []) {
  if (!Array.isArray(items)) return out
  for (const it of items) {
    if (!it) continue
    if (it.type === 'group' || Array.isArray(it.items)) {
      flattenColumnLayout(it.items, out)
    } else if (it.column) {
      out.push(it)
    }
  }
  return out
}

/** LocalTreeDataProvider 가 바인딩된 경우 노드의 계층 및 형제 순서를 캡처한다. */
function captureTreeOrder(dp, keyField) {
  if (!dp || typeof dp.getChildren !== 'function' || typeof dp.getJsonRow !== 'function') return null

  if (!keyField) {
    let sample = {}
    const rowCount = typeof dp.getRowCount === 'function' ? dp.getRowCount() : 0
    for (let r = 0; r < Math.min(rowCount, 30); r++) {
      const json = dp.getJsonRow(r)
      if (json && Object.keys(json).length > 0) {
        sample = json
        break
      }
    }
    const candidates = ['deptCode', 'code', 'id', 'menuName', 'deptName', 'name', 'path']
    keyField = candidates.find(k => sample[k] !== undefined)
    if (!keyField) {
      const keys = Object.keys(sample)
      if (keys.length > 0) keyField = keys[0]
    }
  }
  if (!keyField) return null

  const getChildTree = (parentRow) => {
    const children = dp.getChildren(parentRow) || []
    const list = []
    for (const childRow of children) {
      const rowJson = dp.getJsonRow(childRow)
      if (!rowJson) continue
      const keyValue = rowJson[keyField]
      if (keyValue === undefined || keyValue === null) continue
      const nodeInfo = { key: String(keyValue) }
      const subChildren = getChildTree(childRow)
      if (subChildren.length > 0) {
        nodeInfo.children = subChildren
      }
      list.push(nodeInfo)
    }
    return list
  }

  const nodes = getChildTree(-1)
  return { keyField, nodes }
}

/** captureTreeOrder 로 캡처된 트리 노드 순서를 LocalTreeDataProvider 에 복원한다. */
function applyTreeOrder(dp, treeOrder) {
  if (!dp || !treeOrder || !Array.isArray(treeOrder.nodes) || typeof dp.getChildren !== 'function') return
  const keyField = treeOrder.keyField
  if (!keyField) return

  const totalRows = typeof dp.getRowCount === 'function' ? dp.getRowCount() : 0
  const keyToRowMap = new Map()
  for (let r = 0; r < totalRows; r++) {
    const rowJson = dp.getJsonRow(r)
    if (rowJson && rowJson[keyField] !== undefined && rowJson[keyField] !== null) {
      keyToRowMap.set(String(rowJson[keyField]), r)
    }
  }

  const restoreNodes = (parentRow, nodeList) => {
    if (!Array.isArray(nodeList)) return
    nodeList.forEach((node, targetIdx) => {
      const childRow = keyToRowMap.get(node.key)
      if (childRow !== undefined && childRow >= 0) {
        try {
          const currentParent = typeof dp.getParent === 'function' ? dp.getParent(childRow) : -1
          const currentChildren = dp.getChildren(currentParent) || []
          const currentIdx = currentChildren.indexOf(childRow)

          if (currentParent !== parentRow || currentIdx !== targetIdx) {
            if (typeof dp.changeRowParent === 'function') {
              dp.changeRowParent(childRow, parentRow, targetIdx)
            } else if (currentParent === parentRow && typeof dp.moveRowSibling === 'function') {
              dp.moveRowSibling(childRow, targetIdx - currentIdx)
            }
          }
        } catch (e) {
          console.warn('[applyTreeOrder] node restore warning:', e)
        }

        if (Array.isArray(node.children) && node.children.length > 0) {
          restoreNodes(childRow, node.children)
        }
      }
    })
  }

  restoreNodes(-1, treeOrder.nodes)
}

/**
 * 현재 그리드의 뷰 상태를 직렬화 가능한 순수 객체로 캡처한다.
 * @param {object} gridView
 * @param {{ includeGroup?: boolean, dataProvider?: object, treeKeyField?: string }} [opts]
 * @returns {object|null} { v, layout, fixed, sort, [group], [treeOrder] }
 */
export function captureViewState(gridView, opts = {}) {
  if (!gridView) return null
  const state = { v: 1 }

  try { state.layout = gridView.saveColumnLayout() } catch (e) { /* noop */ }

  try {
    const f = gridView.getFixedOptions() || {}
    state.fixed = { colCount: f.colCount || 0, rowCount: f.rowCount || 0 }
  } catch (e) { /* noop */ }

  try {
    const cols = gridView.getColumns() || []
    state.sort = cols
      .filter(c => c && c.sortDirection && c.sortDirection !== 'none')
      .map(c => ({
        field: c.fieldName || c.name,
        dir: c.sortDirection,
        order: (typeof c.sortOrder === 'number' && c.sortOrder >= 0) ? c.sortOrder : 0
      }))
      .sort((a, b) => a.order - b.order)
  } catch (e) { /* noop */ }

  if (opts.includeGroup) {
    try { state.group = gridView.getGroupFieldNames() || [] } catch (e) { /* noop */ }
  }

  const dp = opts.dataProvider || (gridView && typeof gridView.getDataSource === 'function' ? gridView.getDataSource() : null)
  if (dp) {
    try {
      const treeOrder = captureTreeOrder(dp, opts.treeKeyField)
      if (treeOrder) state.treeOrder = treeOrder
    } catch (e) { /* noop */ }
  }

  return state
}

/**
 * captureViewState 로 저장한 상태를 그리드에 복원한다.
 * 복원 순서: 레이아웃 → 트리 노드 순서 → 그룹 → 고정 → 정렬.
 * @param {object} gridView
 * @param {object} state captureViewState 반환 객체
 * @param {{ dataProvider?: object }} [opts]
 */
export function applyViewState(gridView, state, opts = {}) {
  if (!gridView || !state) return

  // 1) 컬럼 배치(순서/그룹헤더). setColumnLayout 이 순서는 잡지만 너비/표시는
  //    보장되지 않으므로, 평탄화한 컬럼 항목으로 width/visible 를 다시 확정한다.
  if (Array.isArray(state.layout)) {
    try { gridView.setColumnLayout(state.layout) } catch (e) { /* noop */ }
    try {
      for (const col of flattenColumnLayout(state.layout)) {
        if (typeof col.visible === 'boolean') {
          gridView.setColumnProperty(col.column, 'visible', col.visible)
        }
        if (typeof col.width === 'number' && col.width > 0) {
          gridView.setColumnProperty(col.column, 'width', col.width)
        }
      }
    } catch (e) { /* noop */ }
  }

  // 1.5) 트리 노드 계층/형제 순서 복원 (있을 때만)
  const dp = opts.dataProvider || (gridView && typeof gridView.getDataSource === 'function' ? gridView.getDataSource() : null)
  if (state.treeOrder && dp) {
    try { applyTreeOrder(dp, state.treeOrder) } catch (e) { /* noop */ }
  }

  // 2) 행 그룹핑(있을 때만)
  if (Array.isArray(state.group)) {
    try { gridView.groupBy(state.group) } catch (e) { /* noop */ }
  }

  // 3) 행·열 고정
  if (state.fixed) {
    try {
      gridView.setFixedOptions({
        colCount: state.fixed.colCount || 0,
        rowCount: state.fixed.rowCount || 0
      })
    } catch (e) { /* noop */ }
  }

  // 4) 정렬
  if (Array.isArray(state.sort)) {
    try {
      const fields = state.sort.map(s => s.field).filter(Boolean)
      const dirs = state.sort.map(s => s.dir)
      gridView.orderBy(fields, dirs)
    } catch (e) { /* noop */ }
  }
}

/**
 * 그리드 전수 검색 (그룹/트리 접힘 자동 펼침 포함).
 * @returns {{count:number, current:number}} 전체 매칭 수와 현재 위치(1-base)
 */
export function searchGrid(gridView, dataProvider, query, direction = 'next', toast = noop) {
  if (!gridView || !dataProvider || !query || !query.trim()) {
    return { count: 0, current: 0 }
  }

  try {
    const keyword = query.trim().toLowerCase()
    const rowCount = dataProvider.getRowCount()
    const matches = []

    for (let r = 0; r < rowCount; r++) {
      const rowJson = dataProvider.getJsonRow(r) || {}

      for (const [colKey, val] of Object.entries(rowJson)) {
        if (val !== undefined && val !== null && String(val).toLowerCase().includes(keyword)) {
          let itemIdx = typeof gridView.getItemIndexOfRow === 'function'
            ? gridView.getItemIndexOfRow(r)
            : r

          // 그룹/트리가 접혀서 숨은 매칭이면 자동으로 펼쳐서 노출
          if (itemIdx < 0) {
            if (typeof gridView.expandAll === 'function') {
              try { gridView.expandAll() } catch (e) { /* noop */ }
            } else if (typeof gridView.getItemCount === 'function') {
              const totalItems = gridView.getItemCount()
              for (let i = 0; i < totalItems; i++) {
                try { gridView.expandGroup(i, true, true) } catch (e) { /* noop */ }
              }
            }
            itemIdx = typeof gridView.getItemIndexOfRow === 'function'
              ? gridView.getItemIndexOfRow(r)
              : r
          }

          if (itemIdx >= 0) {
            matches.push({ itemIndex: itemIdx, dataRow: r, column: colKey })
          }
        }
      }
    }

    if (matches.length === 0) {
      toast(`'${query}' 검색 결과가 없습니다.`, { type: 'warning' })
      return { count: 0, current: 0 }
    }

    const currentCell = gridView.getCurrent()
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
      gridView.setCurrent({ itemIndex: target.itemIndex, column: target.column })
      if (typeof gridView.showCell === 'function') {
        try { gridView.showCell(target.itemIndex, target.column) } catch (e) { /* noop */ }
      }
      gridView.setFocus()
    }

    return { count: matches.length, current: targetIdx + 1 }
  } catch (e) {
    console.error('searchGrid error:', e)
    return { count: 0, current: 0 }
  }
}
