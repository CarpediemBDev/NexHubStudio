/**
 * realgridRowHeight.js — RealGrid 행 높이 규약 (상수 · 옵션 조립 · 개발용 가드)
 * =============================================================================
 * 행 높이는 반드시 `displayOptions.rowHeight` 로만 정한다. CSS 로 만들면 안 된다.
 *
 * 왜:
 *   RealGrid 는 셀을 DOM <table> 로 그리지만, 데이터 영역과 로우바(No./state/check)
 *   영역은 별도 컨테이너다. CSS 로 셀 높이를 키우면(line-height/padding 등) 두 영역이
 *   서로 다른 높이로 자라고, 선택/포커스 표시는 그리드가 계산한 좌표를 쓰기 때문에
 *   그 차이가 행마다 누적돼 셀렉터가 행과 어긋난다.
 *
 * 실제로 이 프로젝트에서 났던 사고(2026-09 수정):
 *   grid-theme.css 가 `.rg-data-cell { line-height: 32px }` 로 행을 키웠는데
 *   그리드가 아는 행 간격은 32, 로우바의 실제 DOM 간격은 32.8 이었다.
 *   테마가 얹은 border-bottom 1px 만큼 어긋난 것으로, 행당 0.8px 이 누적돼
 *   40행쯤에서 한 행 높이가 되어 "50번째 행을 고르면 행 사이에 걸친다" 로 나타났다.
 *
 * 이 모듈이 갖는 것:
 *   - GRID_ROW_HEIGHT        : 공통 기본값(px)
 *   - warnIfRowHeightMismatch: 개발 모드에서 규약 위반을 잡아내는 가드
 *
 * (realgridOps.js 는 DOM 을 참조하지 않는다는 규약이라 DOM 을 재는 가드는 여기 둔다.)
 */

/**
 * 공통 기본 행 높이(px).
 *
 * RealGrid 기본값은 `0` = "폰트와 padding 을 보고 알아서 계산"(≈23px)이고 그것도
 * 정상 동작한다. 32 를 쓰는 건 순전히 디자인 요구다 — 이 앱은 JqxGrid 페이지와 섞여
 * 있어서 행 밀도를 맞춰야 한다(grid-theme.css 참고). 즉 이 숫자는 RealGrid 격식이
 * 아니라 "우리가 원하는 높이"이고, 그래서 CSS 가 아니라 여기에 적는다.
 */
export const GRID_ROW_HEIGHT = 32

/**
 * rowHeight 값을 setDisplayOptions 에 넣을 옵션 조각으로 만든다.
 *
 * `-1`(셀 내용에 맞춘 가변 높이)이면 두 옵션을 세트로 묶는다. 가변 높이를 켜는 쪽은
 * 대개 이미지·버튼 때문인데, `-1` 만 켜면 두 군데서 다시 어긋나기 때문이다.
 *
 *  - `minRowHeight`   : 내용이 한 줄뿐인 행이 너무 납작해지는 걸 막는 바닥값.
 *                       RealGrid 공식 가이드도 `rowHeight = -1` 과 함께 쓰라고 안내한다.
 *  - `refCalcHeights` : 기본값 `true` 는 한 번 계산한 행 높이를 캐시하고 스크롤 시 다시
 *                       재지 않는다. 이미지가 "측정 이후에" 로드되면 캐시에 옛 높이가
 *                       남아 결국 어긋나므로 `false` 로 다시 재게 한다.
 *                       (화면에 나올 때마다 재측정하므로 행이 아주 많으면 느려질 수 있다.)
 *
 * @param {number} rowHeight  0=자동 고정, -1=셀 내용 기준 가변, >0=지정 높이
 * @returns {object} setDisplayOptions 에 spread 할 옵션
 */
export function buildRowHeightOptions(rowHeight = GRID_ROW_HEIGHT) {
  return rowHeight === -1
    ? { rowHeight: -1, minRowHeight: GRID_ROW_HEIGHT, refCalcHeights: false }
    : { rowHeight }
}

/** 정렬된 좌표 목록에서 가장 흔한 간격(최빈값)을 구한다. 첫 행 앞뒤의 이상치를 무시하려는 것. */
function dominantStep(tops) {
  if (tops.length < 3) return null
  const counts = new Map()
  for (let i = 1; i < tops.length; i++) {
    const step = +(tops[i] - tops[i - 1]).toFixed(2)
    if (step <= 0) continue
    counts.set(step, (counts.get(step) || 0) + 1)
  }
  if (counts.size === 0) return null
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

/** 화면에 그려진 요소들의 top 좌표를 중복 없이 정렬해 돌려준다. */
function sortedTops(nodes) {
  return [...new Set([...nodes].map((el) => +el.getBoundingClientRect().top.toFixed(2)))]
    .sort((a, b) => a - b)
}

/**
 * 그리드가 아는 행 간격과 실제 DOM 의 행 간격을 비교한다.
 * @returns {{ modelStep:number, domStep:number, diff:number, ok:boolean }|null}
 *          측정할 수 없으면(행이 아직 없음 등) null.
 */
export function measureRowHeightConsistency(gridView, container) {
  if (!gridView || !container) return null

  // 1) 그리드가 아는 간격 — 렌더된 행들의 셀 좌표를 그리드에게 직접 묻는다.
  const columns = (typeof gridView.getColumns === 'function' && gridView.getColumns()) || []
  let modelStep = null
  for (const col of columns) {
    const name = col && col.name
    if (!name) continue
    const ys = []
    for (let i = 0; i < 200 && ys.length < 12; i++) {
      const bounds = gridView.getCellBounds(i, name)
      if (bounds) ys.push(+bounds.y.toFixed(2))
    }
    modelStep = dominantStep(ys)
    if (modelStep) break
  }
  if (!modelStep) return null

  // 2) 실제 DOM 간격 — 로우바(No./state/check)가 가장 신뢰할 만한 기준이다.
  //    CSS 가 셀 높이를 키우면 데이터 영역보다 이쪽이 먼저 어긋난다.
  //    로우바를 안 쓰는 그리드는 데이터 셀로 대체한다.
  const bars = container.querySelectorAll('.rg-row-bar')
  const domStep = dominantStep(sortedTops(bars.length ? bars : container.querySelectorAll('.rg-data-cell')))
  if (!domStep) return null

  const diff = +(domStep - modelStep).toFixed(2)
  return { modelStep, domStep, diff, ok: Math.abs(diff) < 0.5 }
}

/**
 * 개발 모드에서만, 행 높이 규약이 깨졌는지 한 번 검사하고 경고한다.
 * 배포 번들에서는 아무 일도 하지 않는다.
 *
 * 조용히 지나가는 게 이 버그의 가장 나쁜 성질이었다 — 죽지도, 찍히지도 않고,
 * 행이 20개 이하인 화면에서는 눈에도 안 띈다. 그래서 시끄럽게 만든다.
 *
 * @param {object} gridView
 * @param {HTMLElement} container  그리드가 붙은 엘리먼트
 * @param {string} [label]         어느 그리드인지 알아보기 위한 이름
 */
export function warnIfRowHeightMismatch(gridView, container, label = 'RealGrid') {
  if (!import.meta.env.DEV) return

  // 측정하려면 그리드가 실제로 화면에 그려져 있어야 한다. 이 앱은 탭으로 여러 그리드를
  // 띄워두기 때문에 숨은 채로 마운트되는 경우가 흔하고, 그때는 모든 좌표가 0 이라
  // 잴 수가 없다. 그래서 한 번만 보고 포기하지 않고, 잴 수 있게 될 때까지 몇 번 다시 본다.
  // (레이아웃·웹폰트가 자리잡을 시간을 버는 효과도 겸한다.)
  const RETRY_LIMIT = 10
  const RETRY_INTERVAL = 700
  let tries = 0

  const attempt = () => {
    let result = null
    try {
      const visible = container && container.offsetParent !== null && container.offsetHeight > 0
      if (visible) result = measureRowHeightConsistency(gridView, container)
    } catch (e) {
      return // 가드 때문에 앱이 깨지면 안 된다
    }

    if (!result) {
      if (++tries < RETRY_LIMIT) setTimeout(attempt, RETRY_INTERVAL)
      return // 끝내 못 쟀으면 조용히 포기한다 (거짓 경고보다는 침묵이 낫다)
    }
    if (result.ok) return

    console.warn(
      `[${label}] 행 높이 불일치 — 그리드가 아는 행 간격 ${result.modelStep}px, 실제 화면 ${result.domStep}px ` +
      `(행당 ${result.diff > 0 ? '+' : ''}${result.diff}px). ` +
      '이 차이는 행마다 누적돼 셀 선택 표시가 행과 어긋난다. ' +
      'CSS(line-height/padding/border)로 셀 높이를 키우고 있지 않은지 확인하고, ' +
      '행 높이는 rowHeight prop 으로 지정할 것. 내용에 맞춘 가변 높이가 필요하면 rowHeight="-1".'
    )
  }

  setTimeout(attempt, 500)
}
