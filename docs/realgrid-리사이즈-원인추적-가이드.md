# RealGrid 컬럼 리사이즈가 안 될 때 — 원인 추적 키트

> **이 문서의 목적**
> "이게 원인이다"를 알려주는 문서가 아닙니다.
> 작업하는 AI가 **직접 계측해서 원인을 좁혀 나가도록** 만든 절차서입니다.
> 붙여넣기용 코드와, 결과에 따라 갈라지는 판정표로 되어 있습니다.
>
> **증상**: 헤더에 마우스를 대면 커서가 `↔` 로 바뀐다. 그런데 드래그해도 컬럼 폭이 안 변한다.
> (변형) 컬럼 순서를 바꾸면 그제서야 적용된다. / 정렬은 잘 되는데 필터도 안 된다.

---

## 0. 시작 전에 — 이것부터 지키지 않으면 전부 헛수고

### ❗ 드래그는 반드시 **사람 손으로** 하세요

브라우저 자동화의 `left_click_drag` 류는 **mousemove 를 1번만** 발생시킵니다.
실제 마우스는 수십 번 발생시킵니다. 이 차이 때문에 **자동화로는 가짜 증상이 재현됩니다.**

> 실제로 겪은 일: 자동화 드래그로 "기록 198 / 화면 120" 이 나와서 버그를 재현했다고 판단했는데,
> 사람이 같은 화면을 실제 마우스로 끌면 멀쩡히 동작했습니다. **자동화 결과를 근거로 쓰지 마세요.**

AI가 이 작업을 한다면: **계측 코드를 심고, 사람에게 드래그를 요청하고, 그 다음 값을 읽으세요.**

### ❗ 폭을 재는 법이 정해져 있습니다

드래그로 늘린 폭은 `column.width` 에도 `displayWidth` 에도 안 들어갑니다.
**`saveColumnLayout()` 안에만** 있습니다.

```js
// 드래그로 120 → 197 로 넓힌 직후 각 값
gv.columnByName('regNo').width                    // 120  ← 안 변함
gv.getColumnProperty('regNo', 'displayWidth')     // 120  ← 안 변함
widthOf(gv, 'regNo')                              // 197  ← 이것만 진짜
```

이걸 모르면 "드래그가 아예 안 먹는다"고 **오진**합니다. (실제로 한 번 틀렸습니다)

### ❗ 존재하지 않는 API 를 찾지 마세요

- `onColumnResized` — **없습니다.** 리사이즈는 `onLayoutPropertyChanged` 로 옵니다.
- 레이아웃 이벤트의 속성명은 `width` 가 아니라 **`displayWidth`** 입니다.

### ❗ 탭이 숨겨져 있으면 그리드가 아예 안 그려집니다

`document.visibilityState === 'hidden'` 이면 렌더링이 멈춥니다. 탭이 보이면 저절로 풀립니다.
이 문제와 무관하니 **진단 전에 반드시 확인**하세요. (이것 때문에도 한 번 오판했습니다)

---

## 1. 계측 키트 — 콘솔에 통째로 붙여넣기

새로고침 **직후**, 아무것도 클릭하지 말고 붙여넣으세요.

```js
(() => {
  const RG = (window.__rg = { log: [], calls: [], pointer: {} })

  // ── gridView 찾기 ───────────────────────────────────────────────
  RG.gv = window.gridView || null
  RG.dp = window.dataProvider || null
  if (!RG.gv) {
    const walk = (vn, d = 0) => {
      if (!vn || d > 80) return null
      if (vn.proxy && vn.proxy.gridView) return vn.proxy
      const subs = []
      const collect = (v) => {
        if (!v) return
        if (v.component) subs.push(v.component)
        if (Array.isArray(v.children)) v.children.forEach(collect)
      }
      if (vn.subTree) collect(vn.subTree)
      for (const s of subs) { const r = walk(s, d + 1); if (r) return r }
      return null
    }
    const app = document.querySelector('#app') || document.body.firstElementChild
    const inst = app && app.__vue_app__ && app.__vue_app__._instance
    const comp = inst && walk(inst)
    if (comp) { RG.gv = comp.gridView; RG.dp = comp.dataProvider; RG.comp = comp }
  }
  if (!RG.gv) { console.error('[RG] gridView 를 못 찾음 — 수동으로 window.__rg.gv 에 넣으세요'); return }

  // ── 폭 읽기 ─────────────────────────────────────────────────────
  RG.lay = (name) => {
    const walk = (arr) => {
      for (const it of arr) {
        if (it && it.column === name) return it.width
        if (it && it.items) { const r = walk(it.items); if (r) return r }
      }
      return null
    }
    return walk(RG.gv.saveColumnLayout())
  }
  RG.dom = (name) => {
    const col = RG.gv.columnByName(name)
    const text = col && col.header && col.header.text
    const el = text && [...document.querySelectorAll('.rg-root td')]
      .find((t) => t.textContent.trim() === text)
    return el ? Math.round(el.getBoundingClientRect().width) : null
  }
  /** 전 컬럼의 '기록 폭' 과 '화면 폭' 비교. 다르면 diff 에 뜬다 */
  RG.snap = () => {
    const rows = RG.gv.getColumns().map((c) => ({ name: c.name, lay: RG.lay(c.name), dom: RG.dom(c.name) }))
    return { rows, diff: rows.filter((r) => r.lay != null && r.dom != null && Math.abs(r.lay - r.dom) > 2) }
  }

  // ── 이벤트 기록 ─────────────────────────────────────────────────
  const prevL = RG.gv.onLayoutPropertyChanged
  RG.gv.onLayoutPropertyChanged = (g, layout, prop, nv, ov) => {
    RG.log.push({ ev: 'layout', col: layout && (layout.column || layout.name), prop, ov, nv })
    if (prevL) return prevL(g, layout, prop, nv, ov)
  }
  const prevC = RG.gv.onColumnPropertyChanged
  RG.gv.onColumnPropertyChanged = (g, col, prop, nv, ov) => {
    RG.log.push({ ev: 'column', col: col && col.name, prop, ov, nv })
    if (prevC) return prevC(g, col, prop, nv, ov)
  }

  // ── 누가 그리드 API 를 부르는지 ─────────────────────────────────
  const wrap = (obj, label, names) => names.forEach((m) => {
    const o = obj && obj[m] && obj[m].bind(obj)
    if (!o) return
    obj[m] = (...a) => {
      RG.calls.push({ m: label + '.' + m, at: new Date().toISOString().slice(11, 23),
                      stack: (new Error().stack || '').split('\n').slice(2, 7).join('\n') })
      return o(...a)
    }
  })
  wrap(RG.gv, 'gv', ['setColumns', 'setColumnLayout', 'setColumnProperty', 'fitColumnWidth',
                     'fitColumnWidthAll', 'setDisplayOptions', 'setFixedOptions', 'resetSize',
                     'refresh', 'beginUpdate', 'endUpdate'])
  wrap(RG.dp, 'dp', ['setFields', 'setRows', 'fillJsonData', 'clearRows'])

  // ── 포인터가 그리드에 닿는지 ────────────────────────────────────
  const root = document.querySelector('.rg-root')
  if (root) ['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mousemove', 'mouseup']
    .forEach((t) => root.addEventListener(t, () => { RG.pointer[t] = (RG.pointer[t] || 0) + 1 }, true))

  // ── 환경 ────────────────────────────────────────────────────────
  RG.env = () => {
    let el = document.querySelector('.rg-root'), scaled = []
    while (el) {
      const s = getComputedStyle(el)
      if (s.transform !== 'none' || (s.zoom !== '1' && s.zoom !== 'normal'))
        scaled.push([el.className || el.tagName, s.transform, s.zoom])
      el = el.parentElement
    }
    const d = RG.gv.getDisplayOptions ? RG.gv.getDisplayOptions() : {}
    const f = RG.gv.getFixedOptions ? RG.gv.getFixedOptions() : {}
    return {
      visibilityState: document.visibilityState,
      '조상 transform/zoom': scaled,
      'rg-root 개수': document.querySelectorAll('.rg-root').length,
      fitStyle: d.fitStyle, columnMovable: d.columnMovable,
      columnResizeThreshold: d.columnResizeThreshold,
      'fixed.colCount': f.colCount, 'fixed.resizable': f.resizable,
      '컬럼 resizable': RG.gv.getColumns().map((c) => c.name + ':' + c.resizable).slice(0, 8)
    }
  }

  RG.reset = () => { RG.log.length = 0; RG.calls.length = 0; Object.keys(RG.pointer).forEach(k => RG.pointer[k] = 0) }

  console.log('[RG] 준비 완료. __rg.env() / __rg.snap() / __rg.log / __rg.calls / __rg.pointer')
  console.table(RG.env())
})()
```

---

## 2. 측정 — 사람이 드래그하는 동안 무엇이 일어나는가

```js
__rg.reset()
__rg.before = __rg.snap()
```

👉 **이 시점에 사람이 헤더 경계를 실제 마우스로 드래그합니다.** (늘리거나 줄이거나)

```js
__rg.after = __rg.snap()
console.log('폭이 어긋난 컬럼:', __rg.after.diff)
console.log('이벤트:', __rg.log)
console.log('API 호출:', __rg.calls.map(c => c.m))
console.log('포인터:', __rg.pointer)
```

---

## 3. 판정표 — 여기서 원인이 갈린다

### STEP 1. 레이아웃에 폭이 기록되었는가?

드래그한 컬럼을 `__rg.before` 와 `__rg.after` 의 `lay` 값으로 비교합니다.

| `lay` 값 | 의미 | 다음 |
|---|---|---|
| **바뀌었다** | 드래그는 먹었다. 화면 반영이 안 된 것 | **STEP 2** |
| **안 바뀌었다** | 드래그 자체가 그리드에 안 들어갔거나 즉시 되돌려짐 | **STEP 3** |

---

### STEP 2. 기록은 됐는데 화면이 안 따라옴

#### 2-1. 누가 되돌렸는지 먼저 본다

```js
__rg.calls.filter(c => /setColumns|setColumnLayout|fitColumnWidth/.test(c.m))
  .forEach(c => console.log(c.m, '\n', c.stack))
```

| 결과 | 원인 | 처방 |
|---|---|---|
| `gv.setColumnLayout` 이 찍힘 | **폭 리셋.** 이름만 담긴 배열을 넘기면 폭이 선언값으로 돌아간다 | 저장본을 넘기거나, 부르지 않게 한다 |
| `gv.setColumns` 가 찍힘 | 컬럼 재생성 (필터도 같이 사라진다) | 열 구성이 실제로 바뀐 때만 부른다 |
| `gv.fitColumnWidth*` 가 찍힘 | 폭을 강제로 다시 맞춤 | 호출 제거 |
| 아무것도 안 찍힘 | 되돌린 게 아니라 **안 그려지는 것** | 2-2 로 |

`stack` 에 범인 함수가 그대로 나옵니다. 보통 데이터 로드 콜백이나 Vue watcher 입니다.

#### 2-2. 무엇이 화면을 갱신시키는지 하나씩

폭이 어긋난 상태에서 **한 줄씩** 실행하고 매번 `__rg.snap().diff` 를 확인합니다.

```js
__rg.gv.refresh();                                   __rg.snap().diff   // ①
__rg.gv.resetSize();                                 __rg.snap().diff   // ②
__rg.gv.setColumnLayout(__rg.gv.saveColumnLayout()); __rg.snap().diff   // ③
// ④ 사람이 헤더를 끌어 컬럼 순서를 바꿔 본다
```

| 어디서 `diff` 가 비었나 | 해석 | 처방 후보 |
|---|---|---|
| ① `refresh()` | 단순 재페인트 누락 | 리사이즈 후 `refresh()` |
| ② `resetSize()` | 그리드가 컨테이너 치수를 다시 재야 함 | 리사이즈 후 `resetSize()` |
| ③ `setColumnLayout(저장본)` | 레이아웃 재적용 필요 | 리사이즈 후 저장본 재적용 |
| ④ 순서 변경에서만 | 레이아웃 전체 재구성이 필요 | ③과 같은 계열 |
| 전부 안 됨 | 화면 자체가 갱신 불가 상태 | `beginUpdate()` 불균형 의심 → 2-3 |

#### 2-3. 처방을 이벤트에 걸기

②가 답이었다면:

```js
gridView.onLayoutPropertyChanged = (grid, layout, prop) => {
  if (prop !== 'displayWidth') return      // ← width / cellWidth 아님
  setTimeout(() => grid.resetSize(), 50)   // ← 즉시·rAF 는 드래그 커밋 전이라 실패
}
```

**`setTimeout` 지연이 필수입니다.** 핸들러는 드래그가 확정되기 전에 불립니다.

#### 2-4. `beginUpdate()` 불균형 확인

재페인트가 중단된 채 남아 있으면 무엇을 해도 안 그려집니다.

```js
__rg.calls.filter(c => /beginUpdate|endUpdate/.test(c.m)).map(c => c.m)
// beginUpdate 수 > endUpdate 수 이면 불균형.
// try/finally 없이 중간에 예외가 나면 이렇게 된다.
```

---

### STEP 3. 드래그 자체가 그리드에 안 들어감

#### 3-1. 이벤트가 오기는 했나

```js
__rg.log.filter(e => /Width/i.test(e.prop))
```

| 결과 | 다음 |
|---|---|
| `{ev:'layout', prop:'displayWidth', ov:120, nv:197}` 가 있다 | 이벤트는 왔는데 값이 안 남았다 → **STEP 2 의 2-1** 로 (즉시 되돌려짐) |
| 아무것도 없다 | 리사이즈 동작 자체가 시작조차 안 됐다 → 3-2 |

#### 3-2. 포인터가 그리드에 닿았나

```js
__rg.pointer   // { pointerdown: 1, pointermove: 40, pointerup: 1, ... }
```

| 결과 | 원인 |
|---|---|
| `pointermove` 가 **0** | 투명 오버레이가 이벤트를 가로채거나 `pointer-events: none` |
| `pointerdown` 이 **0** | 헤더 위에 다른 요소가 덮고 있다 |
| 정상적으로 수십 개 | 이벤트는 닿았다 → 3-3 |

오버레이 확인:

```js
// 드래그하려는 경계선의 화면 좌표를 넣는다
document.elementsFromPoint(x, y).slice(0, 5)
  .map(e => [e.tagName, e.className, getComputedStyle(e).pointerEvents, getComputedStyle(e).cursor])
```

#### 3-3. 좌표계가 왜곡되었나

```js
__rg.env()['조상 transform/zoom']   // 빈 배열이어야 정상
```

`transform: scale(...)` 이나 `zoom` 이 걸린 조상이 있으면, **히트테스트(커서 변경)는 맞는데
이동량 계산만 틀어집니다.** 증상 설명과 정확히 일치하는 유일한 환경 요인입니다.
있으면 그걸 제거하거나, 그리드를 배율 밖으로 빼세요.

#### 3-4. 설정으로 막혀 있나

```js
__rg.env()
```

| 항목 | 막히는 조건 | 비고 |
|---|---|---|
| `fixed.resizable` | `false` 면 **고정 컬럼**의 폭 변경 불가 | 기본값이 `false`. 단 이때는 커서가 `col-resize` 가 아니라 `pointer` 로 뜬다 |
| `fixed.colCount` | 앞 N개가 고정 컬럼 | 어느 컬럼이 고정인지 확인용 |
| `컬럼 resizable` | 컬럼별 `false` | 기본값 `true` |
| `columnResizeThreshold` | 경계 인식 범위(px) | 기본 `3`. 너무 작으면 잡기 어렵다 |
| `rg-root 개수` | **2 이상이면** 그리드가 두 번 생성됨 | 보이는 그리드와 조작하는 인스턴스가 다를 수 있다 |

---

## 4. 필터가 같이 안 된다면

리사이즈와 **원인이 다릅니다.** 실측된 사실:

| 호출 | 정렬 | 컬럼 필터 | 늘린 폭 |
|---|---|---|---|
| `setColumns(...)` | 유지 | **전부 소멸** (101 → 0) | 유지 |
| `setColumnLayout(이름만 담긴 배열)` | 유지 | 유지 | **선언값으로 리셋** |

정렬은 컬럼 객체가 아니라 **행 순서**에 걸리므로 둘 다에 무관하게 살아남습니다.
따라서 **"정렬만 되고 필터가 안 된다" = `setColumns` 가 반복 호출되고 있다**는 신호입니다.

```js
// 데이터 로드마다 찍히는지 확인
__rg.calls.filter(c => c.m === 'gv.setColumns').length
```

처방:

```js
// ① setColumns 직후에 필터를 반드시 재등록
gridView.setColumns(cols)
setupColumnFilters()      // setColumns 가 지운 필터 정의 복구
applyActiveFilters()      // 사용자가 고른 활성 필터 복구

// ② 열 구성이 실제로 바뀐 때만 setColumns 를 부른다
const sig = columns.map(c => c.name).join(',')     // 동적 열이면 열 목록까지 포함
if (sig !== this.builtSig) {
  dp.setFields(fields); gv.setColumns(cols); this.builtSig = sig
}
dp.setRows(rows)          // 행만 바뀌면 여기만 탄다

// ③ 열을 다시 만들면서 폭은 지키고 싶다면
const saved = gv.saveColumnLayout()   // 항목마다 width/cellWidth/fillWidth 를 들고 있다
gv.setColumns(newColumns)
gv.setColumnLayout(saved)             // 이름만 담긴 배열을 넘기면 폭이 리셋된다
```

---

## 5. 이미 배제된 것 — 여기 시간 쓰지 마세요

NexHubStudio 에서 같은 구조를 만들어 하나씩 껐다 켜며 확인했습니다. **전부 무관합니다.**

| 의심 | 결과 |
|---|---|
| 그리드 컴포넌트 **1개**에 동적 컬럼/필드/행을 주입하는 구조 | **무관.** 똑같이 만들어도 리사이즈 정상 |
| `:columns="[]" :fields="[]" :rows="[]"` 로 두고 함수로 채우는 방식 | **무관** |
| `height: max(700px, calc(100vh - 400px))` | **무관** |
| `rowHeight: -1` (내용 맞춤) | **무관** |
| `fitStyle: 'even'` / `'evenFill'` | **무관** |
| 컬럼 `resizable: true/false` 설정 | 커서가 `↔` 로 바뀐다면 이미 `true` 다 |
| 헤더 그룹(`CellLayoutGroupItem`)의 `resizable: false` | **무관.** 커서도 뜨고 드래그도 먹음 |
| `setColumns` 후 레이아웃이 옛것으로 남는 현상 | 실제로 생기지만 **리사이즈는 정상 동작** |

**구조를 갈아엎어도 증상은 그대로입니다.** 리팩터링부터 제안하지 마세요.

---

## 6. 보고 양식

원인을 찾았으면 이 형태로 남기세요. 추측과 실측을 반드시 구분합니다.

```
증상   : (커서 변화 / 드래그 반응 / 순서 변경 시 동작 / 정렬·필터 상태)
STEP1  : lay 값 변화 →  있음 / 없음
STEP2  : 되돌린 호출 →  (없음 / gv.setColumnLayout @ 함수명:줄)
         화면 갱신   →  refresh ✗ / resetSize ✓ / setColumnLayout ✓ / 순서변경 ✓
STEP3  : 이벤트 →  / 포인터 →  / 조상 배율 →  / 설정 →
원인   : (실측으로 확인된 것만)
미확인 : (추론에 그친 것)
처방   : (코드)
검증   : 사람이 실제 마우스로 드래그해서 동작 확인함 —  예 / 아니오
```

마지막 줄이 제일 중요합니다. **사람 손으로 확인하지 않은 처방은 처방이 아닙니다.**
