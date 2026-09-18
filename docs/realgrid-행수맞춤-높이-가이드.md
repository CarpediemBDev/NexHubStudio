# RealGrid 행 수에 맞춘 그리드 높이 가이드 (하단 빈칸 없애기)

> 대상: RealGrid 2.x (`realgrid` npm, 2.10.0에서 확인) — GridView
> 목표: 페이지당 10개처럼 **행 N개가 딱 보이는 높이**로 그리드를 맞춘다.
> 그룹 패널·합계 행을 켜든 끄든 하단 빈칸이 없고, 행이 많으면 **최대 높이에서 멈추고 스크롤**한다.

---

## 1. 이런 증상이면 이 문서

- `height: 500px` 그리드에 페이지당 10개를 보여 준다.
- **그룹 패널(`groupPanel.visible`)을 켜면 빈칸이 없는데, 끄면 마지막 행 아래에 빈칸이 생긴다.**
- 합계 행(`footer.visible`)을 끄는 경우도 똑같다.
- 높이를 숫자로 다시 맞춰 봐도, 옵션을 하나 바꾸면 또 빈칸이 생기거나 세로 스크롤이 생긴다.

---

## 2. 왜 그런가 (런타임 흐름)

1. 그리드 컨테이너의 `height`는 **그리드 전체 높이**다. RealGrid는 그 안을 위에서부터 이렇게 나눈다.

   ```
   컨테이너 height (예: 500px, 고정)
    ├─ 그룹 패널      ← visible: false 면 0
    ├─ 헤더
    ├─ 행 영역 (.rg-body) = 나머지 전부
    ├─ 합계(footer)   ← visible: false 면 0
    └─ 가로 스크롤바   ← 컬럼이 넘칠 때만
   ```

2. 행 높이(`displayOptions.rowHeight`)는 **늘어나지 않는다.** 행은 위에서부터 쌓이고, 행 영역이 남으면 그 아래는 빈칸이다.
3. 그래서 그룹 패널을 끄면, 그 높이만큼 행 영역이 커진다. 들어갈 행은 여전히 10개라 **늘어난 만큼이 빈칸**이 된다.
   반대로 켜면 행 영역이 작아져 10행이 다 안 들어가고 **세로 스크롤**이 생긴다.
4. "그룹 패널을 켰을 때 빈칸이 없었다"는 건, 500px에서 그룹 패널·헤더를 뺀 행 영역이 **우연히 10행 높이와 맞았기** 때문이다.

> 실측 (NexHubStudio `/grid-studio/pivot-a`, rowHeight 32)
>
> | 영역 | 높이 |
> |---|---|
> | 그룹 패널 | 41px |
> | 헤더 | 23px |
> | 합계 | 23px |
> | 가로 스크롤바(생길 때) | 16px |
> | 10행 | 320px |
>
> 높이를 고정하면 그룹 패널을 끄는 순간 행 영역이 41px 커지고, 10행 아래 41px이 빈칸이 된다.

**결론: 높이를 숫자로 맞추는 방식은 옵션이 바뀔 때마다 깨진다.** 고정영역(그룹 패널·헤더·합계·가로 스크롤)을 **실제로 재서** 높이를 계산해야 한다.

### 2-1. 행 높이(rowHeight)는 몇인지 몰라도 된다

계산에 행 높이가 필요하지만, 프로젝트마다 설정이 달라서 **숫자로 박지 않고 실행 중에 읽는다.**

| `displayOptions.rowHeight` | 의미 (RealGrid) | 계산에 쓰는 값 |
|---|---|---|
| 양수 (32, 37 …) | 지정한 높이로 고정 | 그 값 — `gridView.getDisplayOptions().rowHeight` |
| **0 (기본값, 미지정)** | 폰트·패딩을 보고 RealGrid 가 정한 높이로 고정 | 실제 높이 — `gridView.getRowHeight(0)` |
| -1 | 셀 내용에 따라 **행마다** 높이가 다름 | 계산 불가 → **적용 안 함** |

> 실측 (새 GridView, `realgrid-white.css`)
>
> | 설정 | `getDisplayOptions().rowHeight` | `getRowHeight(0)` | 실제 `<tr>` 높이 |
> |---|---|---|---|
> | 미지정 | 0 | **23** | 23 |
> | 0 | 0 | **23** | 23 |
> | 32 | 32 | 32 | 32 |
> | 37 | 37 | 37 | 37 |
>
> 미지정이면 `getDisplayOptions().rowHeight` 는 **0** 이라 그대로 곱하면 계산이 안 된다. 그래서 `getRowHeight(0)` 으로 실제 높이를 읽는다.

주의: `getRowHeight(0)` 은 **행이 0건이면 에러**(`Cannot read properties of null`)가 난다.
그래서 행이 있을 때 읽어 두고, 없을 땐 마지막으로 읽은 값을 쓴다. 미지정(0)인 그리드는 **데이터를 넣은 뒤 한 번 다시 계산**해야 한다(4장 `update()`).

---

## 3. 해결 원리

```
고정영역   = .rg-root 높이 − .rg-body 높이   (그룹패널 + 헤더 + 합계 + 가로스크롤 한 번에)
보일 행 수 = min(N, floor((최대 높이 − 고정영역) / rowHeight))   ← 최대 높이 안에 "온전히" 들어가는 행까지만
그리드 높이 = 고정영역 + 보일 행 수 × rowHeight
```

### N 은 "현재 페이지당 개수"가 아니라 **고정값(가장 작은 페이지당 개수, 예: 10)** 으로 준다

| N 을 주는 방식 | 페이지당 10 → 20 으로 바꾸면 |
|---|---|
| ❌ 현재 페이지당 개수 (`N = pageSize`) | 10행 높이(449px) → 20행을 담으려 최대 높이까지 커져 11행(481px). **바꿀 때마다 그리드 높이가 출렁인다** |
| ✅ 고정값 (`N = 10`) | 높이 그대로 10행. 나머지 10행은 **스크롤로** 본다 |

| 상황 (N = 10) | 결과 |
|---|---|
| 페이지당 10개, 옵션 무엇이든 | 고정영역만큼 자동 조정 → **10행 딱 맞음** |
| 페이지당 20~100개 | **높이 그대로(10행)** → 스크롤, 맨 아래까지 내려도 빈칸 없음 |
| 마지막 페이지(예: 3건) | 높이 그대로 → 아래 빈칸 (**의도된 동작**) |
| 고정영역 + 10행이 최대 높이 초과 (그룹 패널·합계·큰 rowHeight) | 최대 높이 안에 들어가는 행 수로 멈춤 → 스크롤 (허용) |

> **왜 최대 높이에 딱 붙이지 않고 행 배수로 멈추나**
> RealGrid 는 **행 단위로 스크롤**한다(맨 위 행 번호 `topItem` 이 정수). 행 영역이 12.6행 분량이면
> 맨 아래까지 내렸을 때 12행이 채워지고 남은 0.6행(약 19px)이 빈칸이 된다.
> 그래서 최대 높이에 걸릴 때도 행 영역을 `rowHeight` 의 배수로 잘라 둔다. 그리드가 최대 높이보다 1행 미만만큼 짧아진다.
> (N 을 고정값으로 주면 대부분 최대 높이에 걸리지 않지만, 그룹 패널·합계·큰 rowHeight 로 넘칠 때를 위한 안전장치다.)

핵심 구현 포인트 세 가지:

1. **재기 전에 `gridView.resetSize()`** — RealGrid는 컨테이너 크기가 바뀐 뒤 행 영역을 **늦게** 다시 배치한다.
   옛 행 영역 높이로 재면 고정영역이 틀리게 나오고, 높이가 계속 줄어드는 루프에 빠진다(실제로 471 → 430 → 360px으로 줄어듦).
   `resetSize()`는 **즉시(동기)** 다시 배치하므로 이걸 부른 뒤에 재야 정확하다. 그리드 생성 직후엔 행 영역 DOM도 이걸 불러야 생긴다.
2. **높이를 바꾼 뒤에도 `resetSize()`** — 바뀐 컨테이너에 맞춰 즉시 배치해 다음 측정이 흔들리지 않게 한다.
3. **`ResizeObserver`로 `.rg-body`를 감시** — 그룹 패널·합계를 켜고 끄거나 가로 스크롤바가 생기면 행 영역 크기가 바뀌므로, 그때 자동으로 다시 계산된다.

---

## 4. 코드 — 다른 프로젝트용 (복사해서 쓰는 함수 하나)

`src/utils/fitGridHeightToRows.js` 같은 파일로 둔다. RealGrid 외 의존성 없음.

```js
/**
 * RealGrid 컨테이너 높이를 "행 N개가 딱 보이는 높이"로 맞춘다.
 * 고정영역(그룹패널·헤더·합계·가로스크롤)을 실제로 재서 더하므로 옵션을 켜고 꺼도 빈칸이 안 생긴다.
 * maxHeight 를 넘으면 maxHeight 안에 온전히 들어가는 행 수까지로 멈추고 그리드 안에서 스크롤한다
 * (행 단위 스크롤이라 이렇게 해야 맨 아래까지 내렸을 때도 빈칸이 없다).
 *
 * @param {GridView} gridView
 * @param {HTMLElement} container  new GridView(container) 에 넘긴 요소. 이 요소의 height 를 바꾼다(padding·border 없이 둘 것)
 * @param {{ rows: number, maxHeight: number }} opts  rows: 딱 보일 행 수(예: 페이지당 개수), maxHeight: 최대 높이(px)
 * @returns {{ update(rows?: number): void, destroy(): void }}
 */
export function fitGridHeightToRows(gridView, container, { rows, maxHeight }) {
  let visibleRows = rows
  let observedBody = null
  let autoRowHeight = 0
  let raf = 0

  // 계산에 쓸 행 높이 — rowHeight 를 몇으로 설정했는지 몰라도 된다(2-1 참고)
  const resolveRowHeight = () => {
    const set = gridView.getDisplayOptions().rowHeight
    if (set > 0) return set // 지정값
    if (set < 0) return 0   // -1: 행마다 높이가 달라 계산 불가 → 적용 안 함
    // 0(기본값): 폰트·패딩으로 RealGrid 가 정한 실제 높이. getRowHeight 는 행 0건이면 에러라 마지막 값을 쓴다
    try { if (gridView.getItemCount() > 0) autoRowHeight = gridView.getRowHeight(0) } catch (e) { /* 행 0건 */ }
    return autoRowHeight
  }

  const fit = () => {
    if (!(visibleRows > 0) || !container.offsetHeight) return // 숨겨진 상태는 건너뛴다

    gridView.resetSize() // ① 지금 컨테이너 기준으로 즉시 배치 (안 하면 옛 높이로 재서 계속 줄어든다)
    const rowHeight = resolveRowHeight()
    const root = container.querySelector('.rg-root')
    const body = root && root.querySelector('.rg-body')
    if (!(rowHeight > 0) || !body) return
    if (body !== observedBody) { observer.observe(body); observedBody = body }

    const fixedArea = root.offsetHeight - body.offsetHeight // ② 그룹패널 + 헤더 + 합계 + 가로스크롤
    // ③ 최대 높이 안에 온전히 들어가는 행 수까지만 (행 영역을 rowHeight 배수로 → 스크롤 끝 자투리 빈칸 없음)
    const fitRows = Math.max(1, Math.min(visibleRows, Math.floor((maxHeight - fixedArea) / rowHeight)))
    const next = Math.ceil(fixedArea + fitRows * rowHeight)
    if (Math.abs(container.offsetHeight - next) < 1) return

    container.style.height = `${next}px` // ④ 높이 변경
    gridView.resetSize()                 // ⑤ 바뀐 높이로 즉시 배치
  }

  // 컨테이너·행 영역 크기가 바뀌면(그룹패널/합계 on·off, 가로스크롤 생김, 창 크기) 다시 계산
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(fit)
  })
  observer.observe(container)
  fit()

  return {
    /** 데이터를 넣은 직후, 옵션을 바꾼 직후 호출. 보일 행 수 자체를 바꾸려면 update(n) */
    update(n) {
      if (n !== undefined) visibleRows = n
      fit()
    },
    destroy() {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }
}
```

### 4-1. 순수 JS

```js
import { GridView, LocalDataProvider } from 'realgrid'
import { fitGridHeightToRows } from '@/utils/fitGridHeightToRows'

const container = document.getElementById('realgrid') // 처음엔 CSS 로 height: 500px(최대 높이)을 준다. 높이가 0 이면 잴 수 없다
const provider = new LocalDataProvider(false)
const gridView = new GridView(container)
gridView.setDataSource(provider)
// rowHeight 는 지정해도, 안 해도 된다(-1 자동만 불가)
gridView.setGroupPanel({ visible: false })
// ...fields / columns

// rows 는 페이지당 개수가 아니라 고정값(가장 작은 페이지당 개수). 20·100개로 바꿔도 높이는 그대로, 스크롤로 본다
const fitter = fitGridHeightToRows(gridView, container, { rows: 10, maxHeight: 500 })

// 데이터를 넣은 뒤 한 번 호출 — rowHeight 미지정(0)이면 행이 있어야 실제 행 높이를 읽을 수 있다
provider.setRows(rows)
fitter.update()

// 페이지당 개수를 바꿀 때는 fitter 를 건드리지 않는다 (update(pageSize) 하면 높이가 출렁인다)

// 그리드 제거 시
fitter.destroy()
gridView.destroy()
```

### 4-2. Vue 3

```vue
<template>
  <!-- 처음 높이는 최대 높이로 준다(0 이면 잴 수 없다). 이후 높이는 함수가 정한다 -->
  <div ref="gridEl" style="height: 500px"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { GridView, LocalDataProvider } from 'realgrid'
import { fitGridHeightToRows } from '@/utils/fitGridHeightToRows'

const gridEl = ref(null)
let gridView, provider, fitter

onMounted(() => {
  provider = new LocalDataProvider(false)
  gridView = new GridView(gridEl.value)
  gridView.setDataSource(provider)
  // ...fields / columns
  // 페이지당 개수(pageSize)가 아니라 고정 10행 — 20·100개는 같은 높이에서 스크롤
  fitter = fitGridHeightToRows(gridView, gridEl.value, { rows: 10, maxHeight: 500 })
})

// 조회 후 데이터를 넣을 때 (rowHeight 미지정이면 행이 있어야 행 높이를 읽는다)
async function search() {
  provider.setRows(await fetchRows())
  fitter.update()
}

// pageSize 를 watch 해서 fitter.update(pageSize) 하지 않는다 → 높이가 출렁인다

onBeforeUnmount(() => {
  fitter && fitter.destroy()
  gridView && gridView.destroy()
  provider && provider.destroy()
})
</script>
```

> 컨테이너가 flex 자식(`flex: 1`)이면 `height` 를 바꿔도 flex 가 무시한다.
> 이때는 **바깥 틀(툴바 포함 wrapper)의 높이**를 계산해 바꿔야 한다 → 5장 공통 컴포넌트 방식 참고.

---

## 5. 코드 — NexHubStudio 공통 그리드 (`RealGridCommonJs` / `RealGridCommonVue` / `RealGridTreeJs`)

> 트리 그리드(`RealGridTreeJs`)도 같은 prop·같은 구현이다. 트리는 펼치고 접으면 보이는 행 수가 바뀌지만,
> 높이는 고정 N행 기준이라 행이 많으면 스크롤, 모두 접어 N행보다 적으면 아래가 빈다.

`visible-rows` prop **기본값이 10** 이라, 공통 그리드를 쓰면 아무것도 안 넣어도 10행에 맞춰진다. `height` 는 **최대 높이**가 된다.

```vue
<!-- 기본: 10행에 맞춤 -->
<RealGridCommonJs height="500px" :rows="pagedRows" />
<Pagination v-model:page="page" v-model:page-size="pageSize" :total="rows.length" />

<!-- 다른 행 수가 필요할 때만 -->
<RealGridCommonJs height="600px" :rows="pagedRows" :visible-rows="15" />

<!-- 끄기(height 그대로 고정) -->
<RealGridCommonJs height="500px" :rows="rows" :visible-rows="0" />
```

- `visible-rows` 는 **고정값**을 준다. `:visible-rows="pageSize"` 로 주면 페이지당 개수를 바꿀 때마다 높이가 출렁인다(3장).
- `height="100%"` 처럼 px 가 아닌 그리드(부모 높이를 채우는 드래그드롭 화면 등)는 최대 높이를 알 수 없어 **기본값이어도 영향이 없다.**
- px 높이인데 페이징이 아닌 그리드도 10행 높이로 줄고 나머지는 스크롤이 된다. 원래 높이를 유지하려면 `:visible-rows="0"`.
- 공통 그리드는 툴바가 그리드 위에 있고 그리드 영역이 flex 로 나머지를 채우는 구조라,
  **wrapper 높이 = 툴바·테두리 + 고정영역 + 보일 행 수 × rowHeight** 로 계산해 wrapper 에 준다(4장 함수와 원리 동일).
- `height` 가 `px` 가 아니면(`100%` 등) 최대 높이를 알 수 없어 동작하지 않는다.

> 실측 1 — 그룹 패널·합계 조합 (페이지당 10개, rowHeight 32, height 500px.
> `/grid-studio/pivot-a`: 컬럼이 넘쳐 가로 스크롤 16px 있음 / `/grid-studio/vue`: 가로 스크롤 없음)
>
> | 그룹 패널 | 합계 | pivot-a 높이 · 행 영역 | vue 높이 · 행 영역 | 빈칸 |
> |---|---|---|---|---|
> | O | X | 449 · 10행 | 433 · 10행 | **0** |
> | X | X | 408 · 10행 | 392 · 10행 | **0** |
> | O | O | 472 · 10행 | 456 · 10행 | **0** |
> | X | O | 431 · 10행 | 415 · 10행 | **0** |
>
> 두 화면의 차이 16px 은 가로 스크롤바다. 스크롤바가 생기고 없어지는 것까지 실측으로 반영된다.
>
> 실측 2 — `:visible-rows="10"` 고정, 페이지당 개수만 변경 (그룹 패널·합계 켠 상태)
>
> | 페이지당 | 10 | 20 | 30 | 100 | 다시 10 |
> |---|---|---|---|---|---|
> | pivot-a 그리드 높이 | 472 | 472 | 472 | 472 | 472 |
> | vue 그리드 높이 | 456 | 456 | 456 | 456 | 456 |
> | 행 영역 | 10행 | 10행 + 스크롤 | 10행 + 스크롤 | 10행 + 스크롤 | 10행 |
> | 맨 아래 스크롤 시 빈칸 | 0 | 0 | 0 | 0 | 0 |

---

## 6. 다른 시도가 실패하는 흔한 원인 (하지 말 것)

| 시도 | 왜 안 되나 |
|---|---|
| `displayOptions.syncGridHeight: 'always'` | 항상 **모든 행**에 높이를 맞춘다. 10개일 땐 깔끔하지만 100개면 그리드가 3,000px 이상 길어지고 **그리드 안 스크롤이 없다** |
| `syncGridHeight: 'over'` | 행이 영역보다 **많을 때만** 늘린다. 적을 때 빈칸은 그대로라 원하는 것과 반대 |
| 옵션 조합별로 `height` 숫자를 맞춰 둠 (예: 패널 끈 화면은 459px) | 합계·가로스크롤·rowHeight·헤더 줄 수 중 하나만 바뀌어도 다시 어긋난다 |
| N 에 현재 페이지당 개수를 넘김 (`:visible-rows="pageSize"`, `update(pageSize)`) | 10 → 20 으로 바꾸면 20행을 담으려 그리드가 최대 높이까지 커진다(10행 → 11행). 페이지당 개수를 바꿀 때마다 **그리드 높이가 출렁인다**. N 은 고정값 |
| 최대 높이에 걸릴 때 `min(계산값, 최대 높이)` 로 딱 붙임 | 행 영역이 행 높이의 배수가 아니게 되어, 맨 아래까지 스크롤하면 1행 미만 자투리가 빈칸으로 남는다(행 단위 스크롤). 들어가는 행 수로 `floor` |
| `resetSize()` 없이 `.rg-body` 높이를 바로 잼 | 행 영역이 옛 높이로 남아 있어 고정영역이 작게 계산 → 높이가 **계속 줄어드는 루프** |
| CSS 로 행(`tr`, `td`) 높이를 키워 빈칸을 메움 | RealGrid 가 모르는 높이가 생겨 셀 선택 표시·스크롤 위치가 행과 어긋난다. 행 높이는 `rowHeight` 로만 |
| 행 높이를 숫자로 가정 (예: `10 * 32`) | 프로젝트·테마마다 다르고, 미지정이면 RealGrid 가 23 등으로 정한다. 실행 중에 읽어야 한다(2-1) |
| `getDisplayOptions().rowHeight` 만 읽음 | 미지정(기본값)이면 **0** 이 나와 계산이 안 된다. 0 이면 `getRowHeight(0)` |
| 행이 0건일 때 `getRowHeight(0)` 호출 | 에러가 난다. 행이 있을 때만 읽고 값을 기억해 둔다 |
| `rowHeight: -1`(행마다 자동) 에 적용 | 행마다 높이가 달라 `N × rowHeight` 가 성립하지 않는다. 이 방식은 **행 높이가 모두 같은 그리드 전용** |
| flex 자식 컨테이너의 `style.height` 만 변경 | `flex: 1` 이 높이를 덮어써서 안 바뀐다. 바깥 wrapper 높이를 바꿔야 한다 |

---

## 7. 한계 (알고 쓸 것)

- **마지막 페이지**(행이 N 보다 적을 때)는 아래가 빈다. 높이를 고정 N행으로 두는 게 의도다(페이지를 넘기거나 페이지당 개수를 바꿔도 그리드 높이가 출렁이지 않게).
- **그룹핑(행 그룹)** 을 하면 그룹 헤더/푸터 행이 추가돼 표시 행 수가 N 보다 많아진다 → 스크롤이 생길 수 있다. (원리상 그렇고, 실측은 안 함)
- 4장 함수 컨테이너의 **처음 높이가 0** 이면 잴 수 없다. CSS 로 최대 높이를 먼저 준다.
- `rowHeight` **미지정(0)** 그리드는 데이터가 들어오기 전엔 행 높이를 모른다 → 데이터를 넣은 뒤 `update()` 를 부른다. (NexHubStudio 공통 그리드는 `rowHeight` 기본값이 32 라 해당 없음. `:row-height="0"` 으로 쓸 거면 데이터가 늦게 올 때 다시 계산되지 않으니 이 점을 고려한다)
- `rowHeight: -1`(행마다 자동)은 지원하지 않는다. 설정해도 에러 없이 `height` 고정으로 동작한다.
- **탭 전환 등으로 숨겨진 그리드**는 높이를 잴 수 없어 건너뛰고, 다시 보일 때 `ResizeObserver` 가 계산한다.
- `.rg-root`, `.rg-body` 는 RealGrid 가 만드는 DOM 클래스다(2.10.0 확인). 메이저 업그레이드 시 7장 검증 방법으로 한 번 확인한다.

---

## 8. 검증 방법

브라우저 콘솔에서 (페이지당 10개 상태로):

```js
const root = document.querySelector('.rg-root')
const body = root.querySelector('.rg-body')
const rowHeight = gridView.getRowHeight(0) // 설정값이 아니라 실제 행 높이 (미지정이면 0 이 아닌 23 등)
console.log('행 영역', body.offsetHeight, '/ 10행', 10 * rowHeight)
// 두 값이 같으면 성공 (빈칸 0, 스크롤 없음)
```

그룹 패널을 켜고 끈 뒤 다시 실행해도 두 값이 같아야 한다.

```js
gridView.setGroupPanel({ visible: false })  // 또는 true
fitter.update()                             // 4장 함수를 쓴 경우 (ResizeObserver 가 자동으로도 부른다)
```

- 행 영역 > 10행 → 빈칸이 남음: `resetSize()` 순서 확인. `rowHeight` 미지정인데 데이터를 넣은 뒤 `update()` 를 안 불렀는지 확인
- 아무 변화가 없음 → `gridView.getDisplayOptions().rowHeight` 가 `-1` 인지 확인(지원 안 함)
- 행 영역 < 10행 → 스크롤: 최대 높이(`maxHeight` / `height`)에 걸린 것. 고정영역 + 10행이 최대 높이보다 크면 정상

페이지당 20개 이상으로 바꿨을 때는 **그리드 높이가 10개일 때와 같은지**, 행 영역이 **행 높이의 배수**인지 본다:

```js
console.log(body.offsetHeight / rowHeight) // 정수(예: 12)면 성공. 12.6 처럼 소수면 맨 아래 스크롤 시 빈칸이 남는다
```
