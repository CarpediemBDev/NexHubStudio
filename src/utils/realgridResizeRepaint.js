/**
 * realgridResizeRepaint.js — 컬럼 폭을 드래그해도 화면이 따라오지 않는 것을 보정
 * =============================================================================
 * 공통 그리드 컴포넌트(RealGridCommonJs / RealGridCommonVue / RealGridTreeJs)가 그리드를 만든 직후 부른다.
 *
 * 증상
 *  커서는 ↔ 로 바뀌고 드래그도 먹는데 컬럼이 안 늘어난다. 그 상태에서 컬럼 순서를 바꾸면
 *  그제서야 아까 늘린 폭이 적용된다. 정렬은 처음부터 멀쩡하다.
 *
 * 왜 그런가 (실측)
 *  드래그 결과는 레이아웃에 이미 들어가 있다. saveColumnLayout() 의 width 를 보면 늘어난 값이다.
 *  화면(DOM)만 옛 폭이다. 즉 "값이 안 먹은" 게 아니라 "다시 그리지 않은" 것이다.
 *  두 경우에 생긴다.
 *
 *   1) 새로고침 후 '첫' 리사이즈 한 번 — RealGrid 내부에서 왜 첫 번째만 누락되는지는 미규명.
 *      한 번 겪고 나면 그 페이지에서는 더 안 나와서 "가끔 안 된다"로만 보고된다.
 *   2) gridView 가 beginUpdate() 로 잠겨 있는 동안 계속 — RealGrid 2.10.0 내부는
 *        invalidateLayout(t) { (t || !this._updateLock && !this._loading) && ... }
 *      이라 _updateLock 이 남아 있으면 레이아웃 갱신이 통째로 무시된다.
 *      정렬은 데이터 경로(refreshView)라 lock 과 무관하게 멀쩡하고, 컬럼 순서 변경은
 *      invalidate() 를 직접 불러서 lock 을 우회하므로 그때 밀린 폭이 한꺼번에 튀어나온다.
 *      → 이건 endUpdate() 짝이 빠진 앱 쪽 버그다. 여기서는 화면만 깨워 주고,
 *        같이 막혀 있는 컬럼 필터까지는 못 살린다. 근본 수정은 endUpdate() 를 finally 로 옮기는 것.
 *
 * 처방
 *  resetSize() 로 크기를 다시 재게 한다. _updateLock 과 무관하게 동작한다(실측).
 *  refresh() 와 invalidateLayout(true) 는 둘 다 효과가 없었다.
 *
 * 세 가지를 지켜야 한다. 하나라도 틀리면 안 먹는다.
 *  · 이벤트는 onLayoutPropertyChanged — onColumnResized 라는 콜백은 없다
 *  · 속성명은 displayWidth — width, cellWidth 로는 안 온다
 *  · 반드시 setTimeout — 즉시 호출과 requestAnimationFrame 은 드래그 커밋 전이라 옛 값을 다시 잰다
 *
 * @see docs/realgrid-첫리사이즈-미반영-가이드.md
 */

/** gridView → { enabled, pageCallback } */
const states = new WeakMap()

const DEFAULT_DELAY = 50

/**
 * 리사이즈 후 다시 그리기 보정을 건다.
 *
 * 페이지가 나중에 `gridView.onLayoutPropertyChanged = fn` 으로 자기 콜백을 넣어도
 * 보정이 지워지지 않도록, 대입을 가로채 뒤에 잇는다.
 *
 * @param {object} gridView GridView 또는 TreeView
 * @param {number} [delay] resetSize 까지 미루는 시간(ms)
 * @returns {() => void} 해제 함수 (그리드 destroy 전에 호출)
 */
export function bindResizeRepaint(gridView, delay = DEFAULT_DELAY) {
  if (!gridView || typeof gridView.resetSize !== 'function') return () => {}
  if (states.has(gridView)) return () => unbindResizeRepaint(gridView)

  const state = { enabled: true, pageCallback: null }
  states.set(gridView, state)

  const handler = (grid, layout, prop) => {
    if (state.enabled && prop === 'displayWidth') {
      setTimeout(() => {
        // 그 사이 그리드가 파괴됐을 수 있다
        if (grid && typeof grid.resetSize === 'function') grid.resetSize()
      }, delay)
    }
    return state.pageCallback ? state.pageCallback(grid, layout, prop) : undefined
  }

  Object.defineProperty(gridView, 'onLayoutPropertyChanged', {
    configurable: true,
    enumerable: true,
    get: () => handler,
    set: (fn) => { state.pageCallback = typeof fn === 'function' ? fn : null }
  })

  return () => unbindResizeRepaint(gridView)
}

/** 보정을 떼고, 페이지가 걸어 둔 콜백이 있으면 그것만 남긴다 */
export function unbindResizeRepaint(gridView) {
  const state = states.get(gridView)
  if (!state) return
  states.delete(gridView)
  delete gridView.onLayoutPropertyChanged
  if (state.pageCallback) gridView.onLayoutPropertyChanged = state.pageCallback
}

/**
 * 보정을 껐다 켠다. 증상을 눈으로 대조할 때만 쓴다(그리드 리사이즈 진단 페이지).
 * 페이지 콜백은 건드리지 않는다.
 *
 * @returns {boolean} 적용 여부 — 보정이 걸려 있지 않은 그리드면 false
 */
export function setResizeRepaint(gridView, enabled) {
  const state = states.get(gridView)
  if (!state) return false
  state.enabled = !!enabled
  return true
}

/** 보정이 켜져 있는지. 걸려 있지 않으면 false */
export function isResizeRepaintOn(gridView) {
  const state = states.get(gridView)
  return !!(state && state.enabled)
}
