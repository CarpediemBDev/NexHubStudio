# RealTree 배정(블록 드래그 & 체크) 이식 가이드

트리에서 **블록으로 고르고, 끌어다 놓거나 체크해서 오른쪽 목록으로 옮기는** 기능을 다른 프로젝트로 옮기기 위한 문서입니다.

- 원본: `src/pages/RealGridTreeToDivPage.vue` (`/grid-studio/tree-to-div`)
- 전제: 트리 컴포넌트 자체의 이식은 [realtree-이식가이드.md](./realtree-이식가이드.md) 참고. 이 문서는 그 위에 얹는 **배정 기능**만 다룹니다.
- 환경: Vue 3 Options API

---

## 0. 옮기는 기능

세 덩어리가 한 페이지에 얹혀 있지만 서로 독립적입니다. 필요한 것만 가져가도 됩니다.

| 기능 | 핵심 | 이 문서 |
|---|---|---|
| 블록 드래그 배정 | 그리드 밖 DIV로 끌어다 놓기. 여러 행을 블록으로 잡고 통째로 | 3 · 4장 |
| 블록 → 자동 체크 | 블록을 씌우면 그 안의 행이 체크됨. 버튼으로 일괄 배정 | 5장 |
| 부모 제외 규칙 | 잎(자식)만 배정 대상. 부모 행은 체크박스가 아예 안 그려짐 | 6장 |

> **가장 값나가는 부분은 3·4장입니다.** RealGrid가 셀 선택을 `pointerdown`에서 처리하기 때문에 생기는 문제로, 한 번 밟지 않으면 존재조차 모르고 지나갑니다. (커밋 `ea9164f`)

---

## 1. 먼저 갖춰야 할 것

### 1-1. 공통 컴포넌트

트리는 `RealGridTreeJs.vue`(TreeView + LocalTreeDataProvider)를 씁니다. 평면 그리드용 공통 컴포넌트로는 계층이 안 나오니 반드시 트리 쪽이어야 합니다. **컴포넌트 자체는 수정할 필요가 없습니다** — 페이지에서 props와 `@init`으로만 제어합니다.

```js
import RealGridTreeJs from '@/components/RealGridTreeJs.vue'
import { showToast } from '@/utils/toastUtil.js'   // 없으면 아무 토스트로 교체
```

### 1-2. `@init`에서 받아 보관하는 두 개

아래 모든 코드가 이 두 개를 전제로 합니다. **반응형으로 만들지 마세요.** `data()`에 넣으면 Vue가 RealGrid 내부까지 프록시로 감싸서 오작동합니다.

```js
onGridInit({ gridView, dataProvider }) {
  this.gridView = gridView          // data() 아님. 인스턴스에 직접
  this.dataProvider = dataProvider

  gridView.setDisplayOptions({
    selectionStyle: 'block',        // 블록 선택이 이 기능의 전제
    rowHoverType: 'row'
  })
}
```

---

## 2. 템플릿 계약

드래그 엔진이 DOM에서 기대하는 것은 세 가지뿐입니다. **클래스명이 곧 계약입니다.**

```html
<div
  class="dnd-grid-wrapper"
  :class="{ 'is-block-drag': isBlockDrag }"
  @pointerdown.capture="onGridPointerDown"   <!-- ① 반드시 capture -->
  @mousedown.capture="onGridMouseDown"
>
  <RealGridTreeJs ref="treeGrid" ... @init="onGridInit" />
</div>

<!-- 드롭 존. 이 클래스명으로 판정한다 -->
<div class="target-div-card"> ... </div>
```

| 계약 | 쓰이는 곳 |
|---|---|
| `ref="treeGrid"` | `onGridMouseDown`에서 그리드 경계 사각형을 잰다. 이름을 바꾸면 그 한 줄도 같이 수정 |
| `.target-div-card` | `checkIsOverDropZone`이 `closest()`로 찾는다 |
| `.is-block-drag` | 블록을 잡고 끄는 동안 커서를 `grabbing`으로 고정 |

### CSS는 두 조각만

```css
.dnd-grid-wrapper { cursor: grab; }

/* RealGrid가 셀 위에 자체 커서를 씌우므로 자손까지 강제한다 */
.dnd-grid-wrapper.is-block-drag,
.dnd-grid-wrapper.is-block-drag * { cursor: grabbing !important; }
```

드래그 고스트 스타일은 **scoped가 아닌 전역 `<style>`** 에 넣어야 합니다. 고스트를 `document.body`에 붙이기 때문에 scoped 속성이 안 먹습니다.

---

## 3. 블록이 재지정돼 보이던 문제

여러 행을 블록으로 선택한 뒤 그 안쪽을 잡고 끌면, **옮겨지는 행은 처음 블록 그대로인데 화면에서는 블록이 포인터를 따라 계속 다시 그어졌습니다.**

### 3-1. 원인은 이벤트 순서 하나

RealGrid는 셀 선택을 `mousedown`이 아니라 **`pointerdown`에서** 처리합니다. 브라우저는 마우스를 한 번 누르면 `pointerdown → mousedown` 순으로 이벤트를 내므로, `mousedown`에 도달한 시점에는 이미 늦습니다.

3~5행을 블록 선택해둔 상태에서 그 안(4행)을 눌러 각 시점의 그리드 상태를 찍은 **실측값**:

```
1. pointerdown CAPTURE  | current.dataRow=3 | selectedRows=[3,4,5]
2. pointerdown bubble   | current.dataRow=4 | selectedRows=[4]
3. mousedown  CAPTURE   | current.dataRow=4 | selectedRows=[3,4,5]
```

- ①에서 `current.dataRow`가 아직 **3**입니다. 사용자는 4행을 눌렀지만 RealGrid가 처리 전이라 직전 커서가 남아 있습니다.
- ②에서 앵커는 4로 정확해졌지만, 그 대가로 **블록이 `[4]`로 접혔습니다.**
- ③의 `[3,4,5]`는 우리 핸들러가 이미 복원한 결과입니다.

> 필요한 두 정보가 **서로 다른 순간에만** 존재합니다. 누르기 직전의 블록은 ①에서만, 실제로 누른 행(앵커)은 ②부터. **그래서 핸들러가 두 개입니다** — ①은 기억만 하고, 판정은 `mousedown`에서 합니다.

### 3-2. capture가 필수인 이유

이벤트는 캡처(바깥→안쪽) → 타깃 → 버블(안쪽→바깥) 순으로 흐릅니다. 래퍼는 RealGrid 셀의 **조상**이므로, 캡처로 붙여야 RealGrid보다 **먼저** 받습니다. 기본값인 버블로 붙이면 위 표의 ②를 받게 되고 — 블록은 이미 사라진 뒤입니다.

`@pointerdown.capture`는 Vue가 만든 이벤트가 아니라 `addEventListener('pointerdown', fn, { capture: true })`의 축약입니다. `pointerdown`은 W3C Pointer Events 표준이고 `PointerEvent`는 `MouseEvent`를 상속합니다.

`mousedown` 쪽 `.capture`는 **현재 기준으로는 없어도 동작합니다.** `pointerdown`이 통째로 먼저 끝나므로 어느 단계든 RealGrid 처리는 이미 완료입니다. 남겨둔 이유는 (1) 두 핸들러의 단계를 맞춰 순서를 예측 가능하게 두는 것, (2) RealGrid가 나중에 셀에서 `stopPropagation()`을 부르면 버블 핸들러는 아예 안 불리기 때문입니다.

---

## 4. 해결: 네 단계

| 순서 | 함수 | 역할 |
|---|---|---|
| ① | `onGridPointerDown` (pointerdown·capture) | 판단하지 않고 **기억만**. 누르기 직전 선택을 `_prePress`에 스냅샷 |
| · | *RealGrid 내부 (pointerdown)* | 블록을 눌린 한 행으로 접고, current를 그 행으로 옮김 |
| ② | `onGridMouseDown` (mousedown·capture) | ①의 블록과 지금의 앵커를 맞대어 **이동 제스처 판정**. 선택 복원 + 추적 끊기 + window 리스너 등록 |
| ③ | `onDocMouseMove` (window) | 움직임마다 블록 복원. **드래그 시작 판정** |
| ④ | `onDocMouseUp` (window) | 드롭 처리 / 순수 선택 분기 |

### ① 스냅샷 — 판단하지 않는다

```js
onGridPointerDown(e) {
  if (e.button !== 0 || !this.gridView) return
  this._prePress = {
    rows: this.snapshotSelectedRows(),
    selection: this.snapshotSelection()
  }
}
```

`snapshotSelection()`이 `getSelection()` 결과를 그대로 들고 있지 않고 **순수 값으로 복사**하는 게 중요합니다. RealGrid는 그 객체를 계속 고쳐 씁니다.

```js
snapshotSelection() {
  const sel = this.gridView.getSelection()
  if (!sel || sel.startItem == null) return null
  return {                       // 참조로 들고 있으면 안 된다
    cellType: sel.cellType, style: sel.style,
    startItem: sel.startItem, startColumn: sel.startColumn,
    endItem: sel.endItem, endColumn: sel.endColumn
  }
}
```

### ② 판정과 동결

```js
const cur = this.gridView.getCurrent()
const anchor = (cur && cur.itemIndex >= 0)
  ? { itemIndex: cur.itemIndex, dataRow: cur.dataRow, column: cur.column } : null

// 여러 행이 선택돼 있었고(①), 그 블록 안쪽을 눌렀다(②) = 옮기려는 제스처
const canFreeze = !!(anchor && anchor.dataRow >= 0 &&
  preSelectedRows.length > 1 && pre.selection &&
  preSelectedRows.includes(anchor.dataRow))

if (canFreeze) {
  this.gridView.setSelection(pre.selection, false)   // 접힌 걸 되돌리고
  this.releaseGridPointer(e)                         // 추적을 끊고
  this.isBlockDrag = true
}
```

`pointerdown`과 `mousedown` 사이에는 **리페인트가 없습니다.** 그래서 접혔다가 되돌아온 게 화면에 안 보입니다 — 깜빡임 없이 블록이 고정된 것처럼 보이는 이유입니다.

### 합성 이벤트로 추적 끊기

```js
releaseGridPointer(e) {
  const base = { bubbles: true, cancelable: true,
    clientX: e.clientX, clientY: e.clientY, button: 0, buttons: 0 }

  const pointerUp = new PointerEvent('pointerup',
    { ...base, pointerId: 1, pointerType: 'mouse' })
  pointerUp.__nexhubSynthetic = true     // 우리가 되받지 않도록 표시
  e.target.dispatchEvent(pointerUp)

  const mouseUp = new MouseEvent('mouseup', base)
  mouseUp.__nexhubSynthetic = true
  e.target.dispatchEvent(mouseUp)
}
```

표시해서 보낸 이벤트는 `onDocMouseUp` 첫 줄에서 걸러집니다.

```js
if (e && e.__nexhubSynthetic) return
```

> **이 한 줄을 빠뜨리면 드래그가 즉시 종료됩니다.**

### ③ 그래도 다시 긋는다 — 움직임마다 되돌리기

```js
keepBlockSelection() {
  const frozen = this._press && this._press.blockSelection
  if (!frozen || !this.gridView) return
  const cur = this.gridView.getSelection()
  if (cur && cur.startItem === frozen.startItem && cur.endItem === frozen.endItem &&
      cur.startColumn === frozen.startColumn && cur.endColumn === frozen.endColumn) return
  this.gridView.setSelection(frozen, false)
}
```

합성 `pointerup`만으로는 그리드 안쪽 움직임까지 끊지 못합니다. 이 핸들러는 **window 버블**이라 그리드 자신의 갱신 **뒤에** 돌고, 그 사이 화면을 다시 그리지 않으므로 사용자 눈에는 처음부터 고정돼 보입니다.

### ③ 드래그 시작 조건 — 거리가 아니라 경계

```js
const rect = this._press.gridRect
const isPointerOutsideRight = e.clientX > rect.right - 10
const isOverZone = this.checkIsOverDropZone(e.clientX, e.clientY)

// 그리드 '안'에서의 움직임은 RealGrid의 블록 선택이다. 가로채면 안 된다.
if (!this._press.moveGesture && !isPointerOutsideRight && !isOverZone) return
```

> ⚠️ **여기를 `dist > 15` 같은 거리 조건으로 두면 기능이 깨집니다.**
> 사용자가 행을 훑어 블록을 그리는 제스처를 드래그로 가로채게 되고, 그러면 `mouseup`이 "드래그였다"로 처리되어 블록을 기억하는 경로가 통째로 건너뛰어집니다. 결과적으로 **블록 이동이 아예 안 됩니다.**
> 예외는 `moveGesture` 하나 — ②에서 이미 RealGrid의 선택 추적을 끊었으니 경쟁 상대가 없습니다.

### ④ 끌지 않았을 때

```js
if (!wasDragging) {
  // 블록 안을 그냥 클릭했다 = 그 행 하나만 고르려는 의도
  if (press && press.moveGesture && press.anchor) this.collapseSelectionTo(press.anchor)
  this.rememberBlockFromGrid()    // 이때의 선택만 블록으로 기억한다
  return
}
this.finishDrag(e)
```

블록 기억을 **선택 이벤트로 갱신하지 않는 것**이 핵심입니다. 누르고 있는 동안에는 RealGrid가 선택을 계속 바꾸고, 그 통보가 우리 드래그 시작보다 먼저 올지 나중에 올지 정해져 있지 않습니다. 그래서 `onSelectionEnded`는 이렇게 막습니다.

```js
gridView.onSelectionEnded = () => {
  if (this._press) return        // 누르는 중이면 무시. 키보드 선택만 통과
  this.rememberBlockFromGrid()
}
```

---

## 5. 블록 → 자동 체크

새 이벤트를 만들 필요가 없습니다. `rememberBlockFromGrid()`가 이미 **마우스 블록과 키보드 Shift 선택이 함께 합류하는 "선택 제스처가 끝난 시점"** 입니다.

```js
rememberBlockFromGrid() {
  const selected = this.snapshotSelectedRows()
  this._blockRows = selected.length > 1 ? selected : []
  if (selected.length > 1) this.syncChecksToBlock(selected)
}

syncChecksToBlock(dataRows) {
  const items = []
  dataRows.forEach(row => {
    const info = this.nodeInfo(row)
    if (!info || info.nodeType !== 'model') return   // 부모 행은 걸러진다
    const itemIndex = this.gridView.getItemIndex(row)
    if (itemIndex >= 0) items.push(itemIndex)
  })

  // (checked, visibleOnly, checkableOnly, checkEvent)
  this.gridView.checkAll(false, false, true, false)  // 이전 블록 체크 해제
  if (items.length) this.gridView.checkItems(items, true, false)
  this.syncCheckedCount()
}
```

규칙은 하나입니다 — **체크 상태 = 지금 화면의 블록.**

- **블록을 그으면** 그 안의 모델만 체크되고, 이전 블록의 체크는 지워집니다. `checkAll`의 두 번째 인자를 `false`로 줘야 **접혀 있는 카테고리 안의 체크까지** 해제됩니다.
- **블록이 사라지면**(블록 밖 클릭 등) 체크도 같이 비웁니다. 화면에 블록이 없는데 체크만 남아 있으면 무엇이 배정될지 화면만 보고는 알 수 없습니다.
- **예외는 체크바 직접 클릭.** 그것도 '한 행 선택'이라 그냥 지우면 수동 체크가 아예 불가능해집니다.

### 체크바 클릭은 이벤트 순서로 구분할 수 없다

`onItemChecked`(RealGrid의 체크 토글)는 **우리 `mouseup`보다 뒤에** 옵니다. 그래서 "체크 이벤트가 왔으면 지우지 않는다"로 짜면 그 사이에 이미 지워진 뒤라, 방금 켜진 체크가 사라집니다. **누른 위치로 판별해야 합니다.**

```js
/** 그 좌표가 체크바(제어열)인가. RealGrid 는 체크바 셀을 .rg-checkbar-cell 로 그린다. */
isCheckbarPoint(x, y) {
  const el = document.elementFromPoint(x, y)
  return !!(el && el.closest('[class*="rg-checkbar"]'))
}
```

`onGridPointerDown`에서 `this._pressOnCheckbar = this.isCheckbarPoint(e.clientX, e.clientY)` 로 한 번 재두고, `rememberBlockFromGrid`에서 그 값이 참이면 지우지 않습니다.

> `rememberBlockFromGrid` 는 한 제스처에 **두 번** 불립니다(`onDocMouseUp`, `onSelectionEnded`). 그래서 이 표시를 그 안에서 소비(리셋)하면 안 됩니다 — 첫 호출이 소비해 버리면 두 번째 호출이 방금 켜진 체크를 지웁니다. 표시를 내리는 곳은 제스처 시작 한 군데뿐입니다.
---

## 6. RealGrid 트리 함정 넷

에러가 안 나고 **조용히 틀리는** 것들이라 미리 알고 가는 게 쌉니다.

### 6-1. 잎 노드에 `children: []`를 넣으면 펼침 화살표가 그려진다

`setNestedRows`의 `childrenProp`은 "자식 배열"이 아니라 **자식이 있는지를 지시하는 속성**입니다. 빈 배열도 "자식 있음"으로 읽힙니다. 잎에는 키 자체를 넣지 않아야 RealGrid가 잎으로 보고 화살표 자리를 비웁니다.

```js
// 잘못
{ modelName: '...', children: [] }
// 맞음
{ modelName: '...' }
```

### 6-2. 트리의 `getCheckedRows`는 인자 의미가 다르다

`GridBase`는 `getCheckedRows(sort, visibleOnly, allRows)`지만 `TreeView`는 `getCheckedRows(visibleOnly)`입니다. 접혀 있는 노드까지 포함하려면 `false`를 넘겨야 합니다.

```js
this.gridView.getCheckedRows(false)   // visibleOnly = false
```

### 6-3. 부모를 체크 대상에서 빼려면 `checkableCallback`

공통 컴포넌트가 설정한 체크바를 `@init`에서 덮어씁니다. 나머지 옵션도 같이 넘겨야 유실되지 않습니다. `checkAll`과 헤더 전체체크도 이 콜백을 존중합니다.

```js
gridView.setCheckBar({
  visible: true, width: 34, exclusive: false, head: 'check',
  checkableCallback: (dataSource, item) => {
    const info = this.nodeInfo(item && item.dataRow)
    return !!(info && info.nodeType === 'model')
  }
})
```

### 6-4. 트리 provider의 `getJsonRow`는 기본이 재귀다

하위까지 통째로 묶어 줍니다. 한 행의 값만 필요하면 재귀를 명시적으로 꺼야 합니다.

```js
nodeInfo(dataRow) {
  if (!this.dataProvider || dataRow == null || dataRow < 0) return null
  try { return this.dataProvider.getJsonRow(dataRow, false, false) || null }
  catch (e) { return null }
}
```

---

## 7. 복붙 인벤토리

- **복붙** — 도메인을 모릅니다. 그대로 가져가면 됩니다.
- **교체** — 여기만 대상 프로젝트 데이터로.

| 메서드 | 구분 | 역할 |
|---|---|---|
| `onGridPointerDown` | 복붙 | 누르기 직전 선택 스냅샷 |
| `onGridMouseDown` | 복붙 | 이동 제스처 판정, 블록 동결, window 리스너 등록 |
| `releaseGridPointer` | 복붙 | 합성 pointerup/mouseup으로 추적 끊기 |
| `onDocMouseMove` | 교체 | 드래그 시작 판정. `rowsToModelIds`·`createGhost` 호출부만 손댐 |
| `keepBlockSelection` | 복붙 | 움직임마다 블록 복원 |
| `onDocMouseUp` | 복붙 | 드롭 / 순수 선택 분기 |
| `collapseSelectionTo` | 복붙 | 블록을 눌린 셀 하나로 접기 |
| `endDragListeners` | 복붙 | window 리스너 해제 |
| `snapshotSelection` | 복붙 | 선택 영역 순수 값 복사 |
| `snapshotSelectedRows` | 복붙 | 선택 dataRow 정렬·중복 제거 |
| `resolveDragRows` | 복붙 | 블록/앵커로 대상 행 확정 |
| `rememberBlockFromGrid` | 교체 | 블록 기억 + 자동 체크 훅 |
| `syncChecksToBlock` | 교체 | 잎 판별 조건(`nodeType`)만 교체 |
| `clearAllChecks` | 복붙 | 접힌 노드 포함 전체 체크 해제 |
| `isCheckbarPoint` | 복붙 | 누른 좌표가 체크바인지 판별 |
| `checkIsOverDropZone` | 복붙 | 드롭 존 판정 (클래스명만 확인) |
| `createGhost` / `moveGhost` / `removeGhost` | 교체 | 고스트. 라벨 문구만 도메인 |
| `finishDrag` | 교체 | 드롭 시 실제 이동 호출 |
| `nodeInfo` / `rowsToModelIds` | 교체 | 행 → 도메인 ID 변환 |

### 필요한 상태

| 값 | 어디에 | 왜 |
|---|---|---|
| `gridView`, `dataProvider` | 인스턴스 직접 | `@init`에서 받는다. `data()`에 넣으면 Vue가 프록시로 감싼다 |
| `isBlockDrag`, `isHoverDropZone` | `data()` | 커서·드롭 존 하이라이트. 화면에 반영돼야 한다 |
| `selectionStyle` | `data()` | `'block'` 고정. `setSelection`에 같이 넘긴다 |
| `_prePress`, `_press`, `_blockRows`, `_dragIds`, `_ghost` | 인스턴스 직접 | mousemove마다 바뀐다. 반응형이면 매 프레임 리렌더가 돈다 |

> **`_` 프리픽스 다섯 개를 `data()`에 넣지 마세요.** 드래그 중 초당 수십 번 갱신되는 값이라 반응형으로 만들면 프레임마다 렌더가 돌고, `_press.gridRect`처럼 DOM 객체가 섞인 값은 프록시로 감싸이면서 비교가 어긋납니다.

---

## 8. 갈아끼울 곳은 넷

엔진이 도메인을 만나는 접점은 이게 전부입니다.

| 훅 | 계약 | 부르는 곳 |
|---|---|---|
| `nodeInfo(dataRow)` | 행 → 노드 객체 (잎 판별용 필드 포함) | 전역 |
| `rowsToModelIds(rows)` | dataRow 배열 → 도메인 ID 배열. 대상 아닌 행은 여기서 걸러낸다 | `onDocMouseMove`, `checkedModelIds` |
| `assignModels(ids)` | 실제 이동. 성공 개수 반환 | `finishDrag`, `assignChecked` |
| `createGhost(ids)` | 따라다니는 라벨 문구 | `onDocMouseMove` |

**계층 해석을 `rowsToModelIds` 한 곳에 몰아두는 게 요령입니다.** 드래그·체크·블록 혼합이 모두 이 함수로 합류하므로, "부모는 제외" 든 "부모는 하위 전체로 펼침" 이든 정책을 여기 한 곳에서만 바꾸면 됩니다. 중복은 `Set`으로 거릅니다.

```js
rowsToModelIds(dataRows) {
  const ids = []
  const seen = new Set()
  ;(dataRows || []).forEach(row => {
    const info = this.nodeInfo(row)
    if (!info || info.nodeType !== 'model' || !info.modelId) return   // ← 정책
    if (seen.has(info.modelId)) return
    seen.add(info.modelId)
    ids.push(info.modelId)
  })
  return ids
}
```

---

## 9. 이식 체크리스트

1. `RealGridTreeJs.vue` 복사, `@init`에서 `gridView`·`dataProvider` 보관 — **`data()`에 넣지 않는다**
2. `setDisplayOptions({ selectionStyle: 'block' })` — 블록 선택이 전제
3. 래퍼에 `@pointerdown.capture` + `@mousedown.capture` — **capture를 빼면 블록을 못 본다**
4. 드롭 존에 `.target-div-card`, 그리드에 `ref`
5. 인벤토리의 **복붙** 12개를 그대로 붙여넣기
6. 도메인 훅 4개 구현 (8장)
7. 고스트 CSS를 **전역** `<style>`에 (scoped 아님)
8. 잎 노드에서 `children` 키 제거 — 안 그러면 잎마다 화살표가 뜬다
9. `beforeUnmount` 정리 — 빠뜨리기 쉽다

```js
beforeUnmount() {
  this.endDragListeners()   // window mousemove/mouseup
  this.removeGhost()        // document.body에 붙인 고스트
}
```
