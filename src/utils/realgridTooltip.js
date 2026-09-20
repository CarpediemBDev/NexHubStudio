/**
 * realgridTooltip.js — RealGrid 툴팁을 공통 툴팁(@/components/common/tooltip)으로 표시
 * =============================================================================
 * 공통 그리드 컴포넌트(RealGridCommonJs / RealGridCommonVue / RealGridTreeJs)가 그리드를 만든 직후 부른다.
 *
 * 무엇을 바꾸나
 *  RealGrid 는 "언제 띄울지"(hover·hintDelay·showTooltip·tooltipEllipsisOnly·onShowTooltip·검증오류 힌트)를
 *  정한 뒤 전부 내부 tooltipManager.show(옵션, x, y, 셀높이) 로 그리고, 셀을 벗어나면 close() 한다.
 *  이 두 메서드만 공통 툴팁으로 넘긴다 → 판단 로직과 컬럼/페이지 설정은 RealGrid 그대로, 모양만 공통 툴팁.
 *
 *  - 페이지는 지금처럼 RealGrid 설정만 한다:
 *      gridView.setDisplayOptions({ showTooltip: true, tooltipEllipsisOnly: true })
 *      column.renderer = { type: 'text', showTooltip: true }
 *      gridView.onShowTooltip = (grid, index, value) => `${value}\n(추가 설명)`
 *  - 기본 툴팁과 달리 값을 innerHTML 로 넣지 않는다(셀 값의 태그가 실행되지 않음).
 *
 * ⚠ tooltipManager 는 RealGrid 비공개 내부(2.10.0 기준)다. 버전이 바뀌어 못 찾으면 경고만 남기고
 *   RealGrid 기본 툴팁이 그대로 동작한다.
 */
import { showTooltip, hideTooltip, closeTooltip } from '@/components/common/tooltip'

let warned = false

/**
 * @param {object} gridView GridView 또는 TreeView
 * @returns {() => void} 해제 함수 (그리드 destroy 전에 호출 — 이 그리드가 띄운 툴팁을 닫는다)
 */
export function bindGridTooltip(gridView) {
  const manager = gridView && gridView._view && gridView._view.tooltipManager
  const host = manager && manager._container && manager._container._container // 기본 툴팁이 붙던 그리드 루트 요소
  if (!manager || !(host instanceof Element) || typeof manager.show !== 'function') {
    if (!warned) console.warn('[RealGrid] tooltipManager 를 찾지 못해 기본 툴팁을 사용합니다. RealGrid 버전을 확인하세요.')
    warned = true
    return () => {}
  }

  const originalShow = manager.show
  const originalClose = manager.close

  manager.show = customShow
  manager.close = customClose

  return () => {
    closeTooltip(gridView)
    if (manager.show === customShow) manager.show = originalShow
    if (manager.close === customClose) manager.close = originalClose
  }

  // x, y: 그리드 루트 기준 좌표. x = 셀 왼쪽, y = 셀 아래쪽, cellHeight = 셀 높이
  function customShow(options, x, y, cellHeight) {
    const text = options && options.message
    if (!text) return false
    const box = host.getBoundingClientRect()
    const shown = showTooltip({
      text,
      rect: { left: box.left + x, top: box.top + y - (cellHeight || 0), bottom: box.top + y },
      owner: gridView,
      className: options.styleName || '',
      hideDuration: options.hideDuration || 0
    })
    this._active = shown // RealGrid 는 visible(= _active) 로 "이미 떠 있는지" 판단한다
    return shown
  }

  function customClose() {
    if (!this._active) return false
    this._active = false
    hideTooltip({ owner: gridView }) // 고정됐거나 마우스가 툴팁 위면 유지
    return true
  }
}
