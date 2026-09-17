# RealGrid 펼친 셀 셀 안 스크롤 가이드 (긴 셀이 휙 사라짐 · 접기 잘림 방지)

> 대상: RealGrid 2.x (`realgrid` npm, **2.10.0에서 확인**) — GridView
> 전제: **이미 "더보기/접기" 가 동작하는 그리드** (html 렌더러, `rowHeight: -1`, `refCalcHeights: false`).
> 더보기 자체 구현은 `realgrid-긴셀-줄바꿈-더보기-가이드.md`, 펼쳐도 덜 펼쳐지거나 맨 위로 튀면 `realgrid-더보기-문제해결-가이드.md`.
> 이 문서는 그 위에 **"펼친 셀은 M줄까지만 키우고 나머지는 셀 안에서 스크롤"** 하는 부분만 따로 떼어 붙이는 법이다.
> 실제 적용: NexHubStudio `/regulation/info` (규제 정보 목록)

---

## 0. AI 에게 시킬 때 (적용 순서 요약)

1. **그리드 옵션**에 `wheelScrollLines: 1` 추가 (3-1).
2. **렌더러**: 펼친 셀의 내용 div 에 `wrap-scroll` 클래스 + `data-key="PK|컬럼명"` + `style="max-height: M × 줄높이 px"` (3-2). "접기" 링크는 그 div **밖(아래)** 에 둔다.
3. **CSS** `.wrap-scroll { overflow-y: auto; overscroll-behavior: contain; }` (3-3).
4. **4-1 `setupCellScroll` 함수**를 그대로 복사하고 그리드 초기화 뒤 한 번 호출 (휠 분배 + 스크롤 위치 복원).
5. **접을 때** `cellScroll.forget(key)` 로 기억한 위치 삭제 (3-4).
6. 그리드를 없앨 때 `cellScroll.destroy()`.
7. 7장 체크리스트로 **실제 마우스 휠**로 확인.

바꿀 값: `M`(펼친 셀 최대 줄 수, 기본 15), 줄 높이(CSS `line-height` 와 같게).

---

## 1. 왜 필요한가 — RealGrid 는 행 단위로 스크롤한다

RealGrid 에는 **픽셀 단위 스크롤이 없다.** 세로 스크롤 위치는 "맨 위 행 번호(`getTopItem()`)" 라는 정수다. (2.10.0 타입 정의에 `smooth`·`pixelScroll` 류 옵션 없음)

그래서 펼친 셀이 크면 세 가지가 동시에 터진다.

> 실측 (정보관리항목 36개 = 셀 너비에서 66줄, 펼친 셀 높이 제한 없이, 그리드 행 영역 550px)
>
> | 확인 | 결과 |
> |---|---|
> | 펼친 행 높이 | 행 영역 높이 **550px 에서 멈춤** (RealGrid 가 행을 보이는 영역보다 크게 만들지 않음) |
> | 보이는 내용 | 약 30줄. **아래 내용과 "접기" 링크가 잘려 안 보임** → 한 번 펼치면 접을 방법이 없음 |
> | 휠 한 칸 | 맨 위 행이 바뀌며 **550px 짜리 행이 한 번에 사라짐** (기본 `wheelScrollLines: 3` 이라 3행씩) |
> | 스크롤바 | 행 개수 기준이라 그 순간 크기·위치가 튐 |

| 시도 | 결과 (실측) |
|---|---|
| 그리드 `height` 를 크게 | 한계만 올라감. 더 긴 데이터에서 똑같이 잘림 |
| 펼친 셀에 `max-height` + `overflow: auto` **만** | 셀 위에서 휠을 굴려도 **그리드 행이 넘어감**(맨 위 행 1 → 4). 그리드가 셀을 다시 그리면 **셀 스크롤이 맨 위로** |
| 넘치면 팝업 | 동작은 하지만 "그 자리에서 전체 내용" 요구와 다름 |

→ **네 가지를 같이** 해야 자연스럽다(2장).

---

## 2. 해결 — 네 가지를 같이 한다

| # | 조치 | 막는 것 |
|---|---|---|
| ① | 펼친 셀은 **M줄(15줄)까지만** 키우고 `overflow-y: auto` | 행이 지나치게 커져 잘리고, 휠 한 번에 통째로 사라지는 것. "접기" 는 스크롤 영역 밖이라 **항상 보임** |
| ② | 펼친 셀 위의 휠을 그리드보다 먼저(**부모 요소 캡처 단계**) 받아, 셀 안에 더 스크롤할 내용이 있으면 `stopPropagation` | 셀 위에서 휠을 굴렸는데 그리드 행이 넘어가는 것. 셀 끝(맨 위/맨 아래)에 닿으면 그대로 보내 그리드가 다음 행으로 |
| ③ | 셀 안 **스크롤 위치를 `PK\|컬럼명` 별로 기억**(`scroll` 캡처), 그리드가 셀을 새로 그리면 **MutationObserver 로 되돌림** | 그리드가 1행 넘어갈 때 셀이 새로 그려져(스크롤 0) **같은 내용을 처음부터 다시 스크롤**하게 되는 것 |
| ④ | `wheelScrollLines: 1` | 휠 한 칸에 3행씩 넘어가 높은 행이 섞인 목록이 크게 튀는 것 |

### 2-1. 셀 위에서 휠을 굴릴 때 (런타임 흐름)

```
wheel (캡처 단계, 그리드 컨테이너의 부모 요소)
  ├─ target 이 .wrap-scroll 안이 아니면 → 그리드가 처리 (wheelScrollLines: 1 → 1행 이동)
  └─ .wrap-scroll 안이면
        ↓ 방향이고 셀 안에 아래 내용이 남음, 또는 ↑ 방향이고 위 내용이 남음
          → e.stopPropagation() → 그리드는 모름 → 브라우저 기본 동작으로 셀 안만 스크롤
             → scroll 이벤트(캡처) → scrollTops["PK|컬럼명"] = scrollTop
        셀 끝에 닿음
          → 그대로 보냄 → 그리드 1행 이동 → RealGrid 가 셀을 새로 그림 (scrollTop 0)
             → MutationObserver 가 DOM 변경 감지 → scrollTops 값으로 되돌림 → 끝 위치 유지
```

### 2-2. 왜 이렇게 (대안이 안 되는 이유)

| 결정 | 대안 | 안 되는 이유 |
|---|---|---|
| 리스너를 **그리드 컨테이너의 부모**에 **캡처 단계**로 | 그리드 컨테이너 자체 / 버블 단계 | RealGrid 가 컨테이너에 먼저 등록한 휠 리스너가 먼저 돈다. 바깥 요소 캡처가 확실히 먼저 |
| 휠을 **조건부로만** 막음 (셀 안에 남은 내용이 있을 때) | 펼친 셀 위 휠을 항상 막음 | 셀 끝에서 그리드가 영영 안 움직여, 긴 셀 위에 마우스가 있으면 목록을 못 내림 |
| `preventDefault` 는 **안 함** (`passive: true`) | `preventDefault` 로 막고 직접 `scrollTop` 조정 | 브라우저 기본 스크롤(관성·속도)을 그대로 쓰는 게 자연스럽고, passive 리스너라 스크롤 성능 경고가 없음 |
| 위치 복원을 **MutationObserver** 로 | 렌더러에서 scrollTop 지정 | 렌더러는 HTML **문자열**만 반환해서 scrollTop 을 줄 수 없다. 그리드가 DOM 을 바꾼 **뒤에** 되돌려야 함 |
| 키를 **`PK\|컬럼명`** 으로 | itemIndex | 정렬·페이지 이동·필터에서 itemIndex 가 다른 행을 가리킨다 |
| "접기" 를 스크롤 영역 **밖**에 | 스크롤 영역 안 끝에 | 끝까지 스크롤해야 접을 수 있게 된다 |

---

## 3. 기존 더보기 구현에 붙이기 (수정 전 → 수정 후)

### 3-1. 그리드 옵션

```js
// 수정 전
gridView.setDisplayOptions({ rowHeight: -1, refCalcHeights: false, minRowHeight: 40 })

// 수정 후
gridView.setDisplayOptions({ rowHeight: -1, refCalcHeights: false, minRowHeight: 40, wheelScrollLines: 1 })
```

### 3-2. 렌더러 — 펼친 셀 내용 div 만 바꾼다

```js
const EXPAND_MAX_LINES = 15   // 펼친 셀 최대 줄 수
const LINE_HEIGHT = 18        // CSS .wrap-text 의 line-height 와 같게

// 수정 전 (펼친 셀)
const body = open
  ? `<div class="wrap-text">${html}</div>`
  : `<div class="wrap-text wrap-clamp" style="-webkit-line-clamp:${CLAMP_LINES}">${html}</div>`

// 수정 후 (펼친 셀만 바뀜)
const key = `${pk}|${column}`                 // 펼침 상태에 쓰는 키와 같은 값
const body = open
  ? `<div class="wrap-text wrap-scroll" data-key="${escapeHtml(key)}" style="max-height:${EXPAND_MAX_LINES * LINE_HEIGHT}px">${html}</div>`
  : `<div class="wrap-text wrap-clamp" style="-webkit-line-clamp:${CLAMP_LINES}">${html}</div>`

// "접기/더보기" 링크는 body 뒤(밖)에 그대로
return `<div class="wrap-cell">${body}<span class="wrap-more" ...>${open ? '접기' : '더보기'}</span></div>`
```

- `data-key` 는 **속성에 넣을 때만 이스케이프**한다. `dataset.key` 로 읽으면 원래 값이 나온다 → 펼침 상태 Set·스크롤 위치 맵의 키와 그대로 비교 가능.
- `max-height` 는 **렌더러가 inline style 로** 넣는다. CSS 에 숫자를 박으면 `EXPAND_MAX_LINES` 와 어긋난다.

### 3-3. CSS

```css
/* 펼친 셀: EXPAND_MAX_LINES 줄을 넘으면 셀 안 스크롤 (max-height 는 렌더러가 inline style 로) */
.wrap-scroll {
  overflow-y: auto;
  overscroll-behavior: contain;   /* 셀 끝에서 페이지까지 스크롤이 번지지 않게 */
}
```

Vue `<style scoped>` 면 그리드 DOM 에 data-v 속성이 없으므로 `:deep()`:

```css
.my-page :deep(.wrap-scroll) { overflow-y: auto; overscroll-behavior: contain; }
```

### 3-4. 함수 연결 + 접을 때 위치 삭제

```js
import { setupCellScroll } from '@/utils/realgridCellScroll'

// 그리드 초기화 뒤 한 번
const cellScroll = setupCellScroll(gridView)

// 더보기/접기 클릭 처리 (기존 코드)
function toggleExpand(key) {
  if (expanded.has(key)) {
    expanded.delete(key)
    cellScroll.forget(key)      // ← 추가: 다시 펼치면 처음부터
  } else {
    expanded.add(key)
  }
  gridView.refresh()
}

// 그리드 제거 시
cellScroll.destroy()
gridView.destroy()
```

Vue (options API):

```js
onGridInit({ gridView }) {
  this.gridView = gridView
  this.cellScroll = setupCellScroll(gridView)
},
beforeUnmount() {
  if (this.cellScroll) this.cellScroll.destroy()
}
```

---

## 4. 코드

### 4-1. `setupCellScroll` — 복사해서 쓰는 함수 하나

`src/utils/realgridCellScroll.js` 같은 파일로 둔다. RealGrid 외 의존성 없음.
**`realgrid-긴셀-줄바꿈-더보기-가이드.md` 6-1 `setupWrapMore` 의 ②③④ 부분을 그대로 떼어 낸 코드**다(그쪽에서 실측, 6장).

```js
/**
 * RealGrid 펼친 셀의 셀 안 스크롤: 휠 분배 + 스크롤 위치 복원
 *
 * 전제: 펼친 셀 내용 div 에 class="<boxClass>" data-key="PK|컬럼명" style="max-height:…px", CSS overflow-y: auto
 *       displayOptions.wheelScrollLines = 1 권장
 *
 * @param {GridView} gridView
 * @param {object}  [opts]
 * @param {string}  [opts.boxClass='wrap-scroll']  펼친 셀 스크롤 div 의 클래스
 * @returns {{ forget(key: string): void, destroy(): void }}
 *   forget  — 접을 때 호출. 기억한 스크롤 위치 삭제(다시 펼치면 처음부터)
 *   destroy — 그리드를 없앨 때 호출(리스너·옵저버 해제)
 */
export function setupCellScroll(gridView, { boxClass = 'wrap-scroll' } = {}) {
  const container = gridView.getContainer()
  const host = container.parentElement // 그리드보다 바깥 요소 — 캡처 단계로 그리드 리스너보다 먼저 받는다
  const scrollTops = {} // { 'PK|컬럼명': scrollTop }

  // ② 펼친 셀 위의 휠: 셀 안에 더 스크롤할 내용이 있으면 그리드까지 안 보내 셀만 스크롤.
  //    셀 끝(맨 위/맨 아래)에 닿으면 그대로 보내 그리드가 다음 행으로 넘어간다
  const onWheel = (e) => {
    const box = e.target.closest && e.target.closest(`.${boxClass}`)
    if (!box || !container.contains(box)) return
    const canUp = box.scrollTop > 0
    const canDown = box.scrollTop + box.clientHeight < box.scrollHeight - 1
    if ((e.deltaY < 0 && canUp) || (e.deltaY > 0 && canDown)) e.stopPropagation()
  }

  // ③ 셀 안 스크롤 위치 기억 (scroll 은 버블링하지 않아 캡처로 받는다)
  const onScroll = (e) => {
    const box = e.target
    if (box.classList && box.classList.contains(boxClass)) scrollTops[box.dataset.key] = box.scrollTop
  }

  // ④ RealGrid 는 그리드를 스크롤·refresh 할 때마다 셀을 새로 그려 셀 안 스크롤이 맨 위로 돌아간다 → 되돌린다
  const restorer = new MutationObserver(() => {
    container.querySelectorAll(`.${boxClass}`).forEach((box) => {
      const top = scrollTops[box.dataset.key]
      if (top && Math.abs(box.scrollTop - top) > 1) box.scrollTop = top
    })
  })

  host.addEventListener('wheel', onWheel, { capture: true, passive: true })
  host.addEventListener('scroll', onScroll, true)
  restorer.observe(container, { childList: true, subtree: true })

  return {
    forget(key) {
      delete scrollTops[key]
    },
    destroy() {
      host.removeEventListener('wheel', onWheel, { capture: true })
      host.removeEventListener('scroll', onScroll, true)
      restorer.disconnect()
    }
  }
}
```

> `setupWrapMore` 를 이미 쓰고 있다면 이 함수는 필요 없다(같은 처리가 들어 있다). `expandMaxLines` 옵션만 확인한다.

### 4-2. 이미 더보기 클릭을 부모 캡처로 받고 있다면

더보기 가이드처럼 클릭 리스너를 `container.parentElement` 에 캡처로 달았다면, 같은 요소에 휠·스크롤 리스너를 더 다는 것뿐이라 충돌이 없다. 클릭 처리의 `stopPropagation` 은 클릭 계열 이벤트만, 휠 처리는 `wheel` 만 다룬다.

---

## 5. 바꾸고 싶을 때

| 바꾸고 싶은 것 | 수정할 곳 | 같이 바꿀 곳 |
|---|---|---|
| **펼친 셀 최대 줄 수** (15 → 10) | 렌더러 `EXPAND_MAX_LINES` | 없음 (max-height 는 inline style) |
| **줄 간격** (18 → 20px) | CSS `.wrap-text { line-height }` | 렌더러 `LINE_HEIGHT` |
| **휠 한 칸에 넘기는 행** | `displayOptions.wheelScrollLines` | 없음. 2 이상이면 높은 행이 섞일 때 다시 튄다 |
| **스크롤 div 클래스 이름** | 렌더러 class, CSS | `setupCellScroll(gridView, { boxClass })` |
| **셀 안 스크롤 끄기** | 렌더러에서 `wrap-scroll`·`max-height` 제거, `setupCellScroll` 호출 제거 | 긴 셀은 다시 잘리고 휙 사라진다(1장) |

`EXPAND_MAX_LINES` 고르는 기준: 펼친 행 높이(≈ M × 줄높이 + 링크·여백 약 30px)가 **그리드 행 영역보다 충분히 작게.** 700px 그리드(행 영역 약 550px)면 15줄(행 약 300px)이 무난하다. 줄이면 행은 덜 커지고 셀 안 스크롤이 길어진다.

---

## 6. 실측 결과 (NexHubStudio, RealGrid 2.10.0, Chromium, 실제 마우스 휠)

| 동작 | 결과 |
|---|---|
| 적용 전: 36개 항목(66줄) 펼침 | 행 550px 에서 멈춤, 약 30줄만, "접기" 안 보임, 휠 한 칸에 행 통째로 사라짐 |
| 적용 전: 셀에 `max-height` + `overflow: auto` 만 | 셀 위 휠 → 그리드 행 넘어감(1 → 4), 재그리기로 셀 스크롤 초기화 |
| 적용 후: 펼침 | 행 **302px** (15줄 270 + 링크·여백), 셀 안 스크롤(내용 1188px), "접기" 보임 |
| 셀 위 휠 ↓ | 셀 안만 0 → 300 → 918(끝), **그리드 맨 위 행 그대로** |
| 셀 끝에서 휠 ↓ 1칸 | 그리드 **1행만** 이동, 새로 그려진 셀 스크롤 **918 유지** |
| 1칸 더 ↓ | 다음 행으로 (맨 위 행 1 → 2) |
| 셀 밖에서 휠 ↑ → 셀 위에서 휠 ↑ | 그리드 1행 올라옴(918 유지) → 셀 안이 위로(918 → 718) |
| 접기 → 다시 펼침 | 셀 스크롤 처음(0)부터 |
| 테스트 그리드, `expandMaxLines` 6, PK `A<2>&"` | 셀 108px, 0 → 450(끝), 끝에서 1칸 → 1행 이동 + 450 유지, 특수문자 키 정상 |
| 101줄 셀 | 행 303px, 15줄 + 스크롤(내용 1818px), 마지막 줄까지 셀 안에 있음 (휠 끝까지는 미확인) |

---

## 7. 검증 체크리스트 (실제 마우스 휠로)

| 확인 | 기대 |
|---|---|
| M줄 넘는 셀 더보기 | 행이 약 M × 줄높이 + 30px, 셀 오른쪽 스크롤바, 아래 "접기" 보임 |
| 펼친 셀 위 휠 ↓ | 셀 안만 스크롤, `gridView.getTopItem()` 그대로 |
| 셀 끝에서 휠 ↓ 1칸 | `getTopItem()` +1, 다시 그려진 셀 스크롤 위치 유지 |
| 셀 밖에서 휠 | 그리드가 1행씩 이동 |
| 휠 ↑ 로 돌아옴 | 셀 스크롤 위치 유지된 채 보임, 셀 위 ↑ 로 셀 안이 올라감 |
| 접기 → 다시 더보기 | 셀 스크롤 맨 위부터 |
| 정렬·페이지 이동 후 같은 셀 | 펼친 상태와 스크롤 위치 유지 |
| 콘솔 | 에러·passive 경고 없음 |

---

## 8. 한계

- **스크롤은 여전히 행 단위다.** 펼친 셀(약 300px)을 지나갈 때 그 행 높이만큼은 한 번에 넘어간다. `EXPAND_MAX_LINES` 를 줄이면 덜 튄다.
- **휠 기준으로만 실측했다.** 터치 스와이프·트랙패드 관성 스크롤·키보드(↑↓·PageDown)는 확인 안 함. 키보드는 그리드 포커스 이동이라 셀 안 스크롤과 무관하게 동작할 수 있다.
- **MutationObserver** 는 그리드 DOM 이 바뀔 때마다 펼친 셀만 찾아 위치를 되돌린다. 펼친 셀이 없으면 할 일이 없다. 수천 행이 한 화면에 그려지는 그리드는 미실측.
- 스크롤 위치는 **메모리에만** 있다. 화면을 떠났다 오면 사라진다.
- TreeView, 행 그룹핑, Firefox/Safari 는 미실측.

---

## 9. NexHubStudio 적용 위치 (참고)

`src/pages/regulation/RegulationInfoPage.vue` — **현재 셀 안 스크롤은 적용하지 않았다.** 더보기를 누르면 셀 전체 내용을 그대로 펼친다.

이 가이드의 실측(6장)은 이 화면에 셀 안 스크롤을 넣었던 버전(커밋 `545a280`~`7278067`)에서 잰 값이다. "15줄만 펼쳐지는 게 어색하다" 는 판단으로 뺐고, 그래서 행 영역보다 긴 셀(700px 그리드면 약 29줄 초과)은 1장의 문제가 그대로 남는다. 긴 데이터가 흔해지면 3장대로 다시 붙인다.

| 가이드 | 페이지 (현재) |
|---|---|
| `EXPAND_MAX_LINES` / `LINE_HEIGHT` | **없음** |
| `wrap-scroll` 클래스 | **없음** — 펼친 셀은 `reg-wrap` 만 (max-height 없음) |
| `setupCellScroll` 의 휠·스크롤·옵저버 | **없음** — `bindMoreLinks()` 는 더보기 클릭 처리만 |
| `scrollTops` / `forget(key)` | **없음** |
| `wheelScrollLines: 1` | **있음** — `onGridInit` 의 `gridView.setDisplayOptions({ ... })` (행 높이 설정과 한곳). 높은 행이 섞인 목록에서 휠 한 칸에 1행씩 |
