# RealGrid 더보기 문제 해결 가이드 (덜 펼쳐짐 · 접기 잘림 · 맨 위로 튐)

> 대상: RealGrid 2.x (`realgrid` npm, **2.10.0에서 확인**) — GridView
> 전제: 긴 셀을 html 렌더러로 N줄 말줄임 + "더보기/접기" 로 만든 그리드. 기본 구현은 `realgrid-긴셀-줄바꿈-더보기-가이드.md`.
> 이 문서는 그 구현을 다른 프로젝트에 옮겼을 때 실제로 겪은 세 가지 증상의 **원인과 고치는 법**이다.
> 모든 수치는 NexHubStudio `/regulation/info` 에서 **각 증상을 일부러 재현해 잰 값**이다(화면 높이 940px, 그리드 700px, 행 영역 550px, 줄 높이 18px, "접기" 링크 16px).

| # | 증상 | 한 줄 원인 | 고치는 곳 |
|---|---|---|---|
| ① | `gridView.refresh()` 하면 **두 줄만 더** 펼쳐지고 나머지는 잘린다 | 행 높이 상한 `maxRowHeight` 에 걸림 (또는 `refCalcHeights` 가 켜져 있음) | `maxRowHeight: 0`, `refCalcHeights: false` |
| ② | 초기화 함수 + `setRows()` 로 다시 그리면 펼쳐지지만 **"접기" 가 절반쯤 잘린다** | 행 높이가 셀 내용보다 **몇 px 모자라게** 정해짐 (상한·계산 높이·행 영역 경계) | 높이를 직접 정하지 말고 RealGrid 가 재게 + 긴 셀은 셀 안 스크롤 |
| ③ | 더보기를 누르면 그리드가 **맨 위로 올라간다** | 초기화 함수의 `clearRows` / `setFields` / `setColumns` 가 스크롤 위치·현재 행을 초기화 | 초기화 함수를 다시 부르지 말고 `refresh()` |

**세 개는 따로가 아니라 연결돼 있다.** ① 을 피하려고 `refresh()` 대신 초기화 함수를 다시 부르게 되고, 그게 ③ 을 만들고, 그 과정의 높이 처리가 ② 를 남긴다. 그래서 **0장 설정 하나로 셋이 같이 풀린다.**

---

## 0. 한 번에 고치는 최종 설정 (AI 에게 이것부터 시킨다)

### 0-1. 그리드 초기화할 때 — 한 번만

```js
gridView.setDisplayOptions({
  rowHeight: -1,          // 행 높이 = RealGrid 가 그려진 셀을 재서 정함        (① ② )
  refCalcHeights: false,  // refresh() 때마다 행 높이를 다시 잼                  (① ③ )
  maxRowHeight: 0,        // 행 높이 상한 없음 (0 = 제한 없음, RealGrid 기본값)  (① ② )
  minRowHeight: 40,       // 한 줄짜리 행 높이
  wheelScrollLines: 1     // 높은 행이 섞인 목록에서 휠 한 칸에 1행만           (스크롤 튐 방지)
})
```

### 0-2. "더보기/접기" 를 누를 때 — 이것만

```js
// 펼친 셀 목록(Set)에 'PK|컬럼명' 을 넣거나 빼고
gridView.refresh()   // ← 끝. 초기화 함수·clearRows·setFields·setColumns·setRows·setRowHeight 호출 금지
```

### 0-3. 하지 말 것

| 금지 | 이유 (증상) |
|---|---|
| 더보기 클릭마다 **초기화 함수 다시 호출** (`clearRows`, `setFields`, `setColumns`, `setRows`) | 스크롤이 맨 위로 (③), 컬럼 너비·선택 행·편집 값도 초기화될 수 있음 |
| `lineCount` 로 계산한 높이를 **`setRowHeight`** 로 넣기 | `rowHeight: -1` 이면 **무시됨**(실측). 고정 rowHeight 에서는 몇 px 모자라 "접기" 가 잘림 (②) |
| 셀 HTML 에 계산한 **`height` / `max-height` 를 style 로** 넣기 (펼친 셀 최대 줄 수 제외) | RealGrid 가 재는 높이와 어긋나 잘림 (②) |
| `maxRowHeight` 를 걸어 두기 | 그 높이에서 멈춤 (① ②) |
| 펼친 셀을 **무제한**으로 키우기 | 그리드 행 영역(700px 그리드면 약 550px)보다 긴 셀은 아래와 "접기" 가 잘림 (②) → **펼친 셀 최대 15줄 + 셀 안 스크롤** |

### 0-4. 긴 셀(행 영역보다 긴 경우)까지 처리

`realgrid-긴셀-줄바꿈-더보기-가이드.md` **6-1 `setupWrapMore`** 를 그대로 쓴다. 위 0-1·0-2 와 함께 **펼친 셀 최대 줄 수(15줄) + 셀 안 스크롤 + 휠 분배 + 셀 스크롤 위치 복원**이 들어 있다.
더보기 구현은 그대로 두고 **셀 안 스크롤만** 붙이려면 `realgrid-펼친셀-셀안스크롤-가이드.md` 의 `setupCellScroll`.

```js
const wm = setupWrapMore(gridView, { rowKey: 'id', clampLines: 5, expandMaxLines: 15 })
// 줄바꿈할 컬럼에 renderer: wm.renderer  — 더보기 클릭 처리와 refresh() 는 함수 안에서 한다
```

---

## 1. 증상 ① — `refresh()` 하면 두 줄만 펼쳐지고 나머지가 잘린다

### 1-1. 더보기를 누르면 일어나는 일

```
더보기 클릭 → 펼침 상태 토글 → gridView.refresh()
  │
  ├─ RealGrid 가 셀 HTML 을 다시 그림 (펼친 셀: 전체 내용 + "접기")      ← 여기까지는 됨
  │
  └─ 행 높이를 정함
       refCalcHeights: true (기본)  → 처음 잰 높이를 재사용 → 행이 안 커짐
       refCalcHeights: false        → 그려진 셀 높이를 다시 잼
                                        └─ maxRowHeight > 0 이면 그 값에서 멈춤  ← "두 줄만 더"
  │
  ▼
.rg-renderer 에 max-height = 행 높이 − 2px, overflow: hidden → 넘치는 아래쪽(= "접기")부터 잘림
```

### 1-2. 실측 (20줄 셀, 접힌 상태 행 123px ≈ 6줄 보임)

| 설정 | 펼친 뒤 행 | 보이는 줄 | "접기" |
|---|---|---|---|
| `rowHeight: -1` 만 (`refCalcHeights` 기본 `true`) + `refresh()` | **123px 그대로** | 약 6줄 (안 늘어남) | 안 보임 (264px 아래) |
| `refresh(true)` 로 바꿔도 | 123px 그대로 | 약 6줄 | 안 보임 |
| **`refCalcHeights: false` + `maxRowHeight: 160`** | **160px 에서 멈춤** | **약 8줄 — "두 줄만 더"** | 안 보임 |
| `refCalcHeights: false` + `maxRowHeight: 0` | **393px** (내용 392px) | 20줄 전부 | **보임** |
| 처음엔 `true`, 펼치기 직전에 `false` 로 바꿔도 | 393px | 20줄 전부 | 보임 |

- 행이 **전혀 안 커지면** `refCalcHeights` 문제, **조금만 커지고 멈추면** `maxRowHeight` 문제다.
- `maxRowHeight` 는 RealGrid 기본값이 0 이다. 걸려 있다면 **프로젝트 공통 그리드·기본 옵션 어딘가에서 넣은 것**이다.

### 1-3. 확인

더보기를 누른 상태에서 콘솔 (`.wrap-more` 는 그 프로젝트의 링크 클래스, `gridView` 는 그 화면 그리드):

```js
const link = [...document.querySelectorAll('.wrap-more')].find((l) => l.textContent === '접기')
const renderer = link.closest('.rg-renderer')
const o = gridView.getDisplayOptions()
console.log({
  rowHeight: o.rowHeight,           // -1 이어야 함
  refCalcHeights: o.refCalcHeights, // false 여야 함
  maxRowHeight: o.maxRowHeight,     // 0 이어야 함
  행높이: link.closest('.rg-data-row').getBoundingClientRect().height,
  셀최대높이: renderer.style.maxHeight,
  내용높이: link.parentNode.scrollHeight
})
```

| 결과 | 원인 |
|---|---|
| `refCalcHeights: true` | 행이 안 커짐 → `false` |
| `maxRowHeight` 가 0 이 아니고 `행높이` ≈ 그 값 | 상한에 걸림 → `0` (긴 셀은 0-4 셀 안 스크롤로 대신 제한) |
| 셋 다 정상인데 `셀최대높이` 가 `내용높이` 보다 **크고** 그래도 잘림 | RealGrid 가 아니라 **셀 HTML/CSS 가 자름** — 펼친 셀에 `-webkit-line-clamp`·`max-height`·`height` 가 남아 있는지 확인 (접을 때 붙인 클래스·style 을 펼칠 때 안 뗀 경우가 흔함) |

> 공통 그리드 컴포넌트에 `rowHeight` prop 이 없으면 `:row-height="-1"` 은 조용히 무시된다. `gridView.getDisplayOptions().rowHeight` 로 실제 값을 확인하고, 안 들어가면 `@init` 에서 `setDisplayOptions` 로 직접 넣는다.

### 1-4. 고치기

```js
// 수정 전
gridView.setDisplayOptions({ rowHeight: -1 })            // + 어딘가의 maxRowHeight

// 수정 후
gridView.setDisplayOptions({ rowHeight: -1, refCalcHeights: false, maxRowHeight: 0, minRowHeight: 40, wheelScrollLines: 1 })
```

---

## 2. 증상 ② — `setRows()` 로 다시 그리면 펼쳐지지만 "접기" 가 절반쯤 잘린다

### 2-1. 왜 `setRows()` 로 가게 되나

`refCalcHeights: true` 에서 `refresh()` 로는 행이 안 커져서(1-2) "렌더링이 안 된다" 고 보고, **초기화 함수를 다시 불러 `setRows()`** 하게 된다.
`setRows()` 는 데이터를 다시 넣으면서 **행 높이 캐시를 버리고 새로 재기** 때문에 행은 커진다.

| 설정 | 다시 그리는 법 | 20줄 셀 행 | 9줄 셀 행 | "접기" |
|---|---|---|---|---|
| `refCalcHeights: true` | `refresh()` | 123px 그대로 | 123px 그대로 | 안 보임 |
| `refCalcHeights: true` | `setRows()` | 393px | 195px | **보임** |
| `refCalcHeights: true` | `setColumns` + `setRows` | 393px | 195px | 보임 |

즉 **`setRows()` 자체는 높이를 제대로 잰다.** 절반 잘림은 여기에 **다른 요인이 겹쳐서** 생긴다.

### 2-2. "접기" 가 절반쯤 잘리는 조건 (재현한 것)

공통점: **행 높이가 셀 내용보다 링크 한 줄(16px) 이내로 모자람** → `.rg-renderer` 가 `행 높이 − 2px` 에서 자르면서 맨 아래 "접기" 만 걸린다.

| 조건 | 행 높이 | 내용 | "접기" 16px 중 잘림 |
|---|---|---|---|
| (a) `maxRowHeight` 가 내용보다 조금 작음 (384px) | 384px | 392px | 3px |
| (b) 펼친 셀이 그리드 **행 영역보다 조금만 김** (행 영역 919px, 50줄) | 919px | 932px | **8px — 절반** |
| (c) 고정 `rowHeight` + `setRowHeight(줄수×18 + 링크16)` — 셀 위아래 여백 누락 | 376px | 392px | **11px** |
| (c') 같은 방식, 링크 줄 높이 누락 (`줄수×18 + 여백12`) | 372px | 392px | 15px |
| (c'') 같은 방식, 줄 수만 (`줄수×18`) | 360px | 392px | 27px (통째로) |

- **(c) `lineCount` 로 높이를 직접 계산하는 경우** 가 가장 흔하다. 실제 셀 높이는 `줄 수 × line-height` 외에 **셀 위아래 padding, 링크 줄 높이와 margin, inline-block 기준선 여백(약 3px)** 이 더해진다. 하나만 빠져도 모자라고, `lineCount` 가 한 줄만 적게 세도 18px 모자라 통째로 사라진다.
- 단 `rowHeight: -1` 에서는 `setRowHeight` 가 **무시된다**(실측: `setRowHeight(178)` 호출 → 123px 그대로, `eachRowResizable: true` 여도 동일). 그래서 `rowHeight: -1` 프로젝트라면 (a)·(b) 나 셀 HTML 의 고정 높이를 먼저 의심한다.
- **(d) 초기화 함수가 컬럼 너비를 다시 잡는 경우**(`fitStyle`, 저장된 레이아웃 복원 등) 높이를 잰 **뒤에** 셀 너비가 줄면 줄이 늘어 잘릴 수 있다. — **재현하지 못함**(시도 중 상태가 섞여 결과를 채택하지 않음). 가능성으로만 둔다.

### 2-3. 확인

1-3 스니펫에 더해:

```js
// ① 행 높이가 내용보다 얼마나 모자라나
const cut = link.getBoundingClientRect().bottom - renderer.getBoundingClientRect().bottom  // > 0 이면 그만큼 잘림
// ② 행 영역 높이 — 내용이 이보다 크면 (b)
const bodyH = document.querySelector('.rg-body').offsetHeight
// ③ 셀 HTML 에 높이를 박았나 — 펼친 셀 안에 height/max-height style 이 있으면 그게 자름
const fixedHeights = [...link.parentNode.querySelectorAll('[style]')].map((e) => e.getAttribute('style')).filter((s) => /height/.test(s))
console.log({ cut, bodyH, 내용높이: link.parentNode.scrollHeight, maxRowHeight: gridView.getDisplayOptions().maxRowHeight, fixedHeights })
```

코드에서 검색: `setRowHeight`, `maxRowHeight`, `fitRowHeight`, 렌더러 콜백 안의 `height:` / `max-height:`.

### 2-4. 고치기

```js
// 수정 전: 펼칠 때마다
initGrid()                     // clearRows / setFields / setColumns / setRows ...
gridView.setRowHeight(i, lineCount(text) * 18 + 16)   // 있는 경우

// 수정 후
gridView.setDisplayOptions({ rowHeight: -1, refCalcHeights: false, maxRowHeight: 0 })   // 초기화 때 한 번
// 펼칠 때
gridView.refresh()             // 높이는 RealGrid 가 그려진 셀을 재서 정한다
```

- `lineCount` 는 **"더보기를 붙일지" 판단에만** 쓰고 높이 계산에는 쓰지 않는다.
- 행 영역보다 긴 셀 (b) 는 설정으로 안 풀린다 → **0-4 펼친 셀 최대 줄 수 + 셀 안 스크롤**. "접기" 는 셀 스크롤 영역 **밖(아래)** 에 두어 항상 보이게 한다.

실측 (고친 설정, 20줄 셀): 행 393px / 내용 392px / "접기" 0px 잘림. 36줄·101줄 셀(셀 안 스크롤 적용): 행 302~303px, 15줄 + 스크롤, "접기" 보임.

---

## 3. 증상 ③ — 더보기를 누르면 그리드가 맨 위로 올라간다

### 3-1. 실측 (그리드를 스크롤해 맨 위 행 8, 10번 행이 보이는 상태에서 10번 행 펼침)

| 다시 그리는 법 | 전 | 후 |
|---|---|---|
| `setRows()` 만 | 맨 위 행 8 | **8 유지** |
| 10번 행이 현재 행(포커스)인 상태에서 `setRows()` 만 | 맨 위 8, 현재 행 9 | **유지** |
| **`clearRows()` → `setRows()`** | 맨 위 행 8 | **0 — 맨 위로** |
| **`setFields` + `setColumns` + `setRows`** (초기화 함수 통째로) | 맨 위 행 8 | **0 — 맨 위로** |
| 현재 행 9 에서 `clearRows()` → `setRows()` | 맨 위 8, 현재 행 9 | **0, 현재 행 -1 (선택 풀림)** |
| `refCalcHeights: false` + **`refresh()`** | 맨 위 8, 현재 행 9 | **유지** |

### 3-2. 원인

`clearRows` 나 `setFields`·`setColumns` 는 RealGrid 입장에서 **그리드를 새로 만드는 것**이다. 행이 0개가 되는 순간 **맨 위 행(스크롤)과 현재 행이 초기화**되고, 데이터를 다시 넣어도 맨 위부터 그린다.
증상 ① 을 피하려고 더보기마다 초기화 함수를 부르는 구조가 이걸 만든다.

### 3-3. 고치기

**권장** — 초기화 함수를 부르지 않는다 (0-1 설정 + `refresh()`). 스크롤·현재 행·선택·컬럼 너비·정렬이 모두 유지된다.

**초기화 함수를 꼭 다시 불러야 한다면** — 부르기 전에 기억했다가 되돌린다 (실측: `clearRows + setFields + setColumns + setRows` 후 맨 위 행 8, 현재 행 9 그대로 복원).

```js
const top = gridView.getTopItem()
const current = gridView.getCurrent()
initGrid()   // clearRows / setFields / setColumns / setRows ...
gridView.setTopItem(top)
if (current.itemIndex >= 0) gridView.setCurrent(current)
```

> 이 우회는 스크롤·현재 행만 되돌린다. 컬럼 너비 조정·정렬·필터·편집 중인 값·체크 상태는 초기화 함수가 무엇을 하느냐에 따라 사라질 수 있다.

### 3-4. 같이 확인할 것 — `onCurrentRowChanged` 가 `-1` 을 받는다

`clearRows` 처럼 행이 비는 순간 `onCurrentRowChanged(grid, oldRow, newRow)` 가 **`newRow = -1`** 로 불린다. 핸들러가 `dataProvider.getJsonRow(newRow)` 를 바로 부르면 **`row is out of bounds: -1` 에러**가 난다(실측). 초기화 함수를 다시 부르는 구조라면 특히 확인한다.

```js
gridView.onCurrentRowChanged = (grid, oldRow, newRow) => {
  const row = newRow >= 0 ? dataProvider.getJsonRow(newRow) : null   // -1 거르기
  selectedId = row ? row.id : null
}
```

---

## 4. 고친 뒤 검증 (그 프로젝트 화면에서)

| 확인 | 기대 |
|---|---|
| 콘솔 `gridView.getDisplayOptions()` | `rowHeight: -1`, `refCalcHeights: false`, `maxRowHeight: 0` |
| 10~20줄 셀 더보기 | 전부 펼쳐지고 "접기" 온전히 보임 (1-3 스니펫 `cut ≤ 0`) |
| 행 영역보다 긴 셀(예: 50줄) 더보기 | 15줄 + 셀 안 스크롤, "접기" 보임 (셀 안 스크롤을 넣었을 때) |
| 그리드를 10행쯤 내린 뒤 더보기 | **맨 위 행 그대로** (`gridView.getTopItem()` 전후 같음), 선택 행 유지 |
| 접기 | 원래 높이로 줄어듦 |
| 더보기 클릭 코드 | 초기화 함수·`clearRows`·`setFields`·`setColumns`·`setRows`·`setRowHeight` 호출 없음 — `refresh()` 만 |
| 콘솔 에러 | 없음 (`row is out of bounds` 포함) |

---

## 5. 실측 요약과 미확인

**실측 (NexHubStudio, RealGrid 2.10.0, Chromium)**

- `refCalcHeights: true` + `refresh()` / `refresh(true)`: 행 안 커짐
- `refCalcHeights: false` + `maxRowHeight: 160`: 160px 에서 멈춤 — "두 줄만 더"
- `refCalcHeights: true` + `setRows()` / `setColumns + setRows`: 행 제대로 커짐
- "접기" 부분 잘림: `maxRowHeight` 384(3px), 행 영역 경계 919 vs 932(8px), 고정 rowHeight + `setRowHeight` 계산 누락(11·15·27px)
- `rowHeight: -1` 에서 `setRowHeight`: 무시됨 (`eachRowResizable` 와 무관)
- `clearRows` / `setFields + setColumns` 후 맨 위 행 0·현재 행 -1, `setRows` 만은 유지, `refresh()` 유지
- `getTopItem` / `getCurrent` 기억 → 초기화 후 `setTopItem` / `setCurrent`: 복원됨
- `clearRows` 시 `onCurrentRowChanged(newRow = -1)` → `getJsonRow(-1)` 에러

**미확인 — 그 프로젝트 코드로 확인 필요**

- 그 프로젝트의 "절반 잘림" 이 2-2 의 (a)·(b)·(c)·(d)·셀 HTML 고정 높이 중 **어느 것인지** — 2-3 스니펫 결과로 판정한다. 0장 설정 + 셀 안 스크롤을 적용하면 어느 경우든 해결된다.
- (d) 초기화 함수가 컬럼 너비를 다시 잡아 높이 측정 뒤 줄이 늘어나는 경우 — 재현 못 함.
- 트랙패드·터치·키보드 스크롤, TreeView, 행 그룹핑 — 미실측.
