/**
 * realgridOps.js — RealGrid 2 그리드 통합 검색 (프레임워크 무관 · 순수 함수)
 * =============================================================================
 * `searchGrid` 하나만 이곳에 둔다.
 *  - RealGrid 내장 API가 아니라 손으로 짠 70줄짜리 "전 셀 검색" 로직이고,
 *    여러 그리드 페이지(QuickSearchBar)가 공유하므로 한 곳에 모아 중복을 없앤다.
 *  - gridView / dataProvider 를 인자로 받는다(this·DOM·Vue 미참조).
 *    → 페이지는 @init 으로 받은 this.gridView 로 직접 호출한다(refs 불필요).
 *  - 검색 결과 없음 알림은 toast(message, opts) 콜백으로 위임(기본 no-op).
 *
 * 그 외 그리드 조작(commit/removeRows/clearRowStates/expandGroup/setFixedOptions/
 * getStateRows/exportGrid 등)은 전부 RealGrid 내장 API 이므로 페이지에서
 * this.gridView / this.dataProvider 로 직접 호출한다 — 별도 유틸 불필요.
 */

const noop = () => {}

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
