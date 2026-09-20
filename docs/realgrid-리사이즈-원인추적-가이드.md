# RealGrid 컬럼 리사이즈가 안 될 때 — 원인 추적 키트

> **이 문서의 목적**
> "이게 원인이다"를 알려주는 문서가 아닙니다.
> 작업하는 AI가 **직접 계측해서 원인을 좁혀 나가도록** 만든 절차서입니다.
> 붙여넣기용 코드와, 결과에 따라 갈라지는 판정표로 되어 있습니다.
>
> 이미 증상이 "동적 컬럼 화면에서 정렬·순서 변경은 되는데 리사이즈만 화면에 늦게 반영됨" 으로 좁혀졌다면,
> 먼저 [RealGrid 동적 컬럼 리사이즈 미반영 해결 가이드](./realgrid-동적컬럼-리사이즈-해결가이드.md)를 적용하세요.
>
> **증상**: 헤더에 마우스를 대면 커서가 `↔` 로 바뀐다. 그런데 드래그해도 컬럼 폭이 안 변한다.
> (변형) 컬럼 순서를 바꾸면 그제서야 적용된다. / 정렬은 잘 되는데 필터도 안 된다.
>
> 📌 **원인 하나는 이미 밝혀져 있습니다 → [부록 A](#부록-a--_updatelock-으로-레이아웃-갱신이-통째로-막히는-경우)**
> 증상이 "정렬만 되고 리사이즈·필터는 안 되며 순서를 바꾸면 풀린다" 면 부록 A 부터 확인하세요.
> 거기서 안 걸리면 아래 절차로 내려옵니다.

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
      // ★ true 면 레이아웃 갱신이 통째로 막힌다 → 부록 A
      _updateLock: RG.gv._updateLock, _loading: RG.gv._loading,
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

#### 2-4. `beginUpdate()` 불균형 확인 → **부록 A**

레이아웃 갱신이 잠긴 채 남아 있으면 무엇을 해도 안 그려집니다.

```js
__rg.gv._updateLock                                                  // true 면 확정
__rg.calls.filter(c => /beginUpdate|endUpdate/.test(c.m)).map(c => c.m)
// beginUpdate 수 > endUpdate 수 이면 불균형.

document.querySelectorAll('.rg-data-cell').length
//  0  → 주입 도중 잠김 (예외로 endUpdate 를 못 탐)
// >0  → 주입 뒤 잠김   (짝 없는 beginUpdate 호출)  ← 신고되는 쪽. try/finally 로는 안 고쳐진다
```

RealGrid 내부 소스와 해결법은 **[부록 A](#부록-a--_updatelock-으로-레이아웃-갱신이-통째로-막히는-경우)** 에 있습니다.

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
| 그리드 컴포넌트 **1개**에 동적 컬럼/필드/행을 주입하는 구조 | **무관.** 같은 화면에서 정적 주입과 나란히 놓고 재확인 → A-7 |
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


---

## 부록 A — `_updateLock` 으로 레이아웃 갱신이 통째로 막히는 경우

증상 조합이 **"정렬은 되는데 리사이즈·필터는 안 되고, 컬럼 순서를 바꾸면 그제서야 풀린다"** 라면
십중팔구 이것입니다. RealGrid 내부 소스로 설명됩니다.

### A-1. 확인된 소스 (realgrid 2.10.0, `dist/main.js`)

난독화된 번들에서 그대로 뽑은 것입니다.

```js
r.prototype.beginUpdate = function () { this._updateLock = !0 }

r.prototype.endUpdate = function (t) {
  (t || this._updateLock) && (this._updateLock = !1, this.refreshView())
}

r.prototype.invalidateLayout = function (t) {
  (t || !this._updateLock && !this._loading) && i.prototype.invalidateLayout.call(this)
}
```

읽는 법:

- `beginUpdate()` 가 `_updateLock = true` 로 잠근다
- `invalidateLayout(t)` 는 **`t` 가 참이거나, 잠금도 로딩도 아닐 때만** 상위 구현을 부른다
- 따라서 **`_updateLock` 이 남아 있으면 인자 없는 `invalidateLayout()` 은 통째로 무시된다**
- `_loading` 도 같은 게이트다 — 데이터 로딩 중에도 레이아웃 갱신이 씹힌다

### A-2. 왜 정렬만 멀쩡한가

| 동작 | 타는 경로 | `_updateLock` 영향 |
|---|---|---|
| **정렬** | 데이터 경로 (`refreshView`) | **없음** → 정상 동작 |
| **컬럼 리사이즈** | 레이아웃 경로 (`invalidateLayout()`) | **막힘** → 폭은 기록되는데 안 그려짐 |
| **컬럼 필터** | 레이아웃 경로 | **막힘** |
| **컬럼 순서 변경** | `invalidate()` 를 직접 호출해 게이트를 우회 | **뚫림** → 밀려 있던 폭이 한꺼번에 튀어나옴 |

증상 네 가지가 한 줄로 설명됩니다. 다른 가설로는 이 조합이 설명되지 않습니다.

### A-3. 확인 방법

```js
// 잠겨 있는가
__rg.gv._updateLock          // true 면 이것이 원인
__rg.gv._loading             // true 여도 같은 결과

// beginUpdate / endUpdate 짝이 맞는가 (계측 키트를 심은 뒤)
__rg.calls.filter(c => /beginUpdate|endUpdate/.test(c.m)).map(c => c.m)
```

`beginUpdate` 수 > `endUpdate` 수 이면 **짝이 빠진 것**입니다.

여기서 멈추지 마세요. **짝이 빠진 시점이 언제냐**에 따라 증상도 처방도 갈립니다 → A-4.
가르는 기준은 하나, **행이 그려져 있는가**입니다.

```js
document.querySelectorAll('.rg-data-cell').length
//  0    → 주입 도중 잠김 (유형 ①)
//  >0   → 주입 뒤 잠김   (유형 ②)  ← 리사이즈만 안 된다고 신고되는 쪽
```

유형 ② 는 호출 **순서**를 봐야 잡힙니다. 데이터가 다 그려진 뒤에 찍히는 `beginUpdate` 가 범인입니다.

```js
;['beginUpdate', 'endUpdate'].forEach((m) => {
  const o = gv[m].bind(gv)
  gv[m] = (...a) => { console.trace('[GV] ' + m); return o(...a) }
})
```

`console.trace` 라서 **어느 함수가 불렀는지 스택에 그대로 찍힙니다.**
화면이 다 그려진 뒤, 사용자가 아무것도 안 했는데 찍히는 `beginUpdate` 를 찾으세요.

### A-4. 해결 ① 근본 — 잠근 쪽을 고친다

잠금은 두 가지입니다. **증상이 다르고, 처방도 다릅니다.** 진단 페이지에서 둘 다 재현해 확인했습니다.

| | 화면의 행 | 정렬 | 리사이즈·필터 | 처방 |
|---|---|---|---|---|
| **유형 ① 주입 도중 잠김** | **안 그려짐** | — | — | `try / finally` |
| **유형 ② 주입 뒤 잠김** | 정상 | 정상 | **죽음** | 호출자를 찾아 제거 |

#### 유형 ① — 주입 도중 예외로 `endUpdate()` 를 못 탄다

```js
// ❌ setColumns 에서 throw 되면 endUpdate 는 영영 안 불린다
gv.beginUpdate()
dp.setFields(fields)
gv.setColumns(cols)
dp.setRows(rows)
gv.endUpdate()           // 여기 못 온다
```

```js
// ✅
gv.beginUpdate()
try {
  dp.setFields(fields)
  gv.setColumns(cols)
  dp.setRows(rows)
} finally {
  gv.endUpdate()         // 예외가 나도 반드시 푼다
}
```

데이터 반영까지 함께 밀리므로 **행이 아예 안 그려집니다.** 금방 들키고, 리사이즈 문제로 신고되지 않습니다.

#### 유형 ② — 주입이 끝난 뒤 누군가 `beginUpdate()` 만 부르고 간다

**신고되는 증상은 거의 이쪽입니다.** 데이터도 정렬도 멀쩡하고 리사이즈·필터만 죽습니다.

```js
// 주입은 정상적으로 끝났다 (endUpdate 까지 호출됨)
await fillGrid()

// … 그 뒤 어딘가에서
gv.beginUpdate()         // ❌ 짝이 없다. 여기서부터 레이아웃이 언다
showLoadingOverlay()
```

**`try / finally` 로는 안 고쳐집니다.** 주입 블록에는 문제가 없으니까요.
A-3 의 `console.trace` 로 호출자를 찾아 `endUpdate()` 를 붙이거나, 그 호출을 없애야 합니다.
흔한 자리는 **로딩 오버레이 진입, 일괄 편집/선택 모드 진입, 외부 라이브러리·공통 모듈의 훅**입니다.

잠긴 채로 이미 떠 있는 화면을 즉시 풀어야 한다면 `gv.endUpdate(true)` 로 강제 해제할 수 있습니다
(A-1 의 `t` 인자가 그 용도입니다). 다만 이건 그때 한 번뿐이라, 호출자를 못 찾으면 다음 번에 또 잠깁니다.

### A-5. 해결 ② 보정 — 잠금을 못 건드릴 때

앱 코드를 당장 못 고치거나 `beginUpdate` 를 부르는 곳이 라이브러리 안쪽이라면,
리사이즈 직후 `resetSize()` 로 화면만 깨웁니다. **`_updateLock` 과 무관하게 동작합니다(실측).**

```js
gridView.onLayoutPropertyChanged = (grid, layout, prop) => {
  if (prop !== 'displayWidth') return      // width / cellWidth 로는 안 온다
  setTimeout(() => grid.resetSize(), 50)   // 즉시·rAF 는 드래그 커밋 전이라 옛 값을 다시 잰다
}
```

세 가지 다 지켜야 합니다. 하나라도 틀리면 안 먹습니다.
`refresh()` 와 `invalidateLayout(true)` 는 둘 다 효과가 없었습니다.

**한계**: 이건 화면만 깨우는 대증요법입니다. 같이 막혀 있는 **컬럼 필터는 못 살립니다.**
A-4 를 할 수 있으면 A-4 를 하세요.

### A-6. 공통 컴포넌트에 걸 때

그리드를 감싸는 공통 컴포넌트가 있다면 거기 한 번만 걸면 모든 화면이 덮입니다.
이때 **페이지가 나중에 `gridView.onLayoutPropertyChanged = fn` 으로 자기 콜백을 넣으면
보정이 지워지므로**, 대입을 가로채 뒤에 이어 붙여야 합니다.

```js
const handler = (grid, layout, prop) => {
  if (prop === 'displayWidth') setTimeout(() => grid.resetSize(), 50)
  return pageCallback ? pageCallback(grid, layout, prop) : undefined
}
Object.defineProperty(gridView, 'onLayoutPropertyChanged', {
  configurable: true,
  enumerable: true,
  get: () => handler,
  set: (fn) => { pageCallback = typeof fn === 'function' ? fn : null }
})
```

NexHubStudio 구현: `src/utils/realgridResizeRepaint.js` — `bindResizeRepaint(gridView)` 를
`RealGridCommonJs` / `RealGridCommonVue` / `RealGridTreeJs` 가 그리드 생성 직후 부릅니다.
`setResizeRepaint(gridView, false)` 로 껐다 켜며 증상을 대조할 수 있습니다.

### A-7. 이 프로젝트에서 직접 보는 법 — `/grid-studio/resize-doctor`

**RealGrid 컬럼 리사이즈 진단** 페이지에 스위치로 다 모아 놨습니다.
데이터는 흉내가 아니라 **규제정보 교차표 탭과 같은 API** 를 그대로 부릅니다
(`POST /api/regulations/crosstab`, 컬럼 정의도 `crosstabColumnDefs()` 와 동일 — `mergeRule` 까지).
페이지를 넘기면 제품 열 구성이 매번 달라지는 것도 같습니다.

| 스위치 | 무엇을 가리나 |
|---|---|
| ① 정적 / 동적 주입 | **동적 컬럼 구조가 원인인가** — 아니다. 둘 다 증상이 같다 |
| ② 잠그지 않음 / 주입 도중 / **주입 뒤** | A-4 의 두 유형을 눈으로 대조 |
| ③ `resetSize()` 보정 | 공통 그리드가 기본으로 건 보정을 껐다 켠다 |

계기판이 컬럼마다 **기록 폭**(`saveColumnLayout()`)과 **화면 폭**(`getBoundingClientRect()`)을
300ms 마다 재서 어긋나면 빨갛게 칠하고, `_updateLock` 도 같이 띄웁니다.

실측 (합성 드래그 기준):

```
정적 주입,  보정 OFF              기록 216 / 화면 150 → 280 / 216     한 박자씩 밀림
동적 주입,  보정 OFF              기록 216 / 화면 150 → 321 / 216     똑같다 — 차이 없음
동적 + endUpdate 생략, 보정 OFF   216/150 → 321/150 → 464/150         화면이 150 에 고정
동적 + endUpdate 생략, 보정 ON    543 / 543                           잠긴 채로도 화면이 따라온다
보정 ON (잠금 없음)                340 / 340,  391 / 391               즉시 일치
```

**갈림은 주입 방식이 아니라 잠금 여부입니다.**
잠기지 않았을 때는 화면이 한 박자 뒤에라도 따라오고, 잠기면 처음 값에 그대로 멈춥니다.

> ⚠ 위 수치는 CDP 합성 드래그로 잰 것입니다. 사람이 마우스로 끌면 드래그 도중 `mousemove` 가
> 연속으로 들어가 갱신 기회가 많으므로, 같은 조건에서도 **첫 1회만** 어긋나 보일 수 있습니다.
> 정적/동적 비교는 같은 방식으로 재서 유효하지만, "몇 번째까지 밀리는가"는 사람 손으로 다시 확인하세요(6장).
