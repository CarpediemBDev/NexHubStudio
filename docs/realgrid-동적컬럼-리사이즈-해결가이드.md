# RealGrid 동적 컬럼 리사이즈 미반영 해결 가이드

이 문서는 다른 프로젝트에 그대로 가져가서 적용하기 위한 가이드다.

대상 증상은 다음 조합이다.

- 동적 컬럼 API 호출 후 `setFields -> setColumns -> setRows` 로 그리드를 만든다.
- 데이터는 정상으로 보인다.
- 정렬은 된다.
- 컬럼 순서 변경도 된다.
- 그런데 컬럼 경계를 드래그해도 화면 폭이 바로 안 바뀐다.
- 그 상태에서 컬럼 순서를 바꾸면 방금 변경한 폭이 그제서야 화면에 반영된다.
- 필터가 `true` 인데 필터가 사라지거나 기대대로 동작하지 않는 경우도 같이 보일 수 있다.

결론부터 말하면, 동적 컬럼 자체가 원인이 아니다. 대부분은 **RealGrid 내부에는 리사이즈 값이 들어갔는데, 화면 레이아웃 갱신만 막힌 상태**다.

---

## 1. 한 줄 결론

`saveColumnLayout()` 의 width 는 바뀌었는데 DOM 헤더 폭이 그대로라면 리사이즈 실패가 아니다. **값은 들어갔고 화면만 다시 그려지지 않은 것**이다.

이 상태를 만드는 대표 원인은 두 가지다.

1. `gridView.beginUpdate()` 후 `gridView.endUpdate()` 가 보장되지 않아 `_updateLock` 이 남아 있다.
2. RealGrid 2.10.x 계열에서 첫 리사이즈 또는 특정 동적 컬럼 갱신 직후 `displayWidth` 변경이 화면에 즉시 repaint 되지 않는다.

해결은 두 겹으로 한다.

1. `beginUpdate/endUpdate` 짝을 `try/finally` 로 보장한다.
2. `onLayoutPropertyChanged` 의 `displayWidth` 이벤트에서 `setTimeout(() => gridView.resetSize(), 50)` 보정을 건다.

---

## 2. 왜 이런 현상이 생기나

리사이즈 후 폭을 잘못 재면 원인을 놓친다.

다음 값들은 드래그 후에도 안 바뀔 수 있다.

```js
gridView.columnByName('regulationNm').width
gridView.getColumnProperty('regulationNm', 'displayWidth')
```

진짜 사용자가 드래그한 폭은 `saveColumnLayout()` 안에 기록된다.

```js
function layoutWidthOf(gridView, columnName) {
  const walk = (items) => {
    for (const item of items || []) {
      if (item && item.column === columnName) return item.width
      if (item && item.items) {
        const found = walk(item.items)
        if (found != null) return found
      }
    }
    return null
  }
  return walk(gridView.saveColumnLayout())
}
```

예를 들어 화면에서 다음처럼 보이면:

```txt
규제 / 기록 폭 138 / 화면 폭 200 / 화면 미반영
```

이것은 리사이즈가 안 된 게 아니다. RealGrid 내부 레이아웃에는 `138` 이 들어갔고, 화면 DOM만 아직 `200` 으로 남은 것이다.

---

## 3. 왜 정렬과 컬럼 순서 변경은 되나

RealGrid에서 동작별 경로가 다르다.

| 동작 | 내부 성격 | `_updateLock` 영향 |
|---|---|---|
| 정렬 | 데이터/행 순서 갱신 | 상대적으로 영향이 적다 |
| 컬럼 순서 변경 | 레이아웃 전체 재배치 | 강제로 다시 그려지며 밀린 폭도 같이 반영될 수 있다 |
| 컬럼 리사이즈 | `displayWidth` 변경 후 레이아웃 repaint | `_updateLock` 이 남으면 화면 반영이 막힌다 |
| 컬럼 필터 | `setColumns()` 로 컬럼이 새로 만들어질 때 초기화됨 | 동적 컬럼 화면에서 같이 깨져 보일 수 있다 |

그래서 “정렬은 되는데 리사이즈만 안 된다”는 말은 모순이 아니다. 리사이즈 값 저장 경로와 화면 갱신 경로가 다르기 때문이다.

---

## 4. 먼저 확인할 것

타 프로젝트에서 아래 문자열을 검색한다.

```txt
beginUpdate
endUpdate
onLayoutPropertyChanged
setFields
setColumns
setColumnLayout
setColumnProperty
resetSize
fitColumnWidth
```

특히 아래 패턴이 있으면 1순위 범인이다.

```js
gridView.beginUpdate()
const res = await apiCall()
dataProvider.setFields(...)
gridView.setColumns(...)
dataProvider.setRows(...)
gridView.endUpdate()
```

API 호출, 조건 분기, `return`, `throw` 가 `beginUpdate()` 와 `endUpdate()` 사이에 있으면 위험하다. 예외가 한 번만 나도 그리드가 잠긴 채 남을 수 있다.

---

## 5. 올바른 동적 컬럼 주입 패턴

API 호출은 업데이트 잠금 밖에서 한다.

```js
const res = await fetchDynamicColumns()

const fields = buildFields(res.columns)
const columns = buildColumns(res.columns)
const rows = buildRows(res.rows)

gridView.beginUpdate()
try {
  dataProvider.setFields(fields)
  gridView.setColumns(columns)

  // setColumns 이후에 필터를 다시 등록한다.
  setupColumnFilters(gridView)

  dataProvider.setRows(rows)
} finally {
  gridView.endUpdate()
}

setTimeout(() => {
  gridView.resetSize()
}, 50)
```

핵심은 `finally` 다.

```js
gridView.beginUpdate()
try {
  // RealGrid 변경 작업
} finally {
  gridView.endUpdate()
}
```

`endUpdate()` 는 성공했을 때만 부르는 함수가 아니다. 실패해도 반드시 호출되어야 하는 정리 작업이다.

---

## 6. `setColumns()` 는 필요한 때만 호출한다

동적 컬럼 화면에서 자주 하는 실수는 조회나 페이지 변경 때마다 무조건 `setColumns()` 를 부르는 것이다.

`setColumns()` 는 컬럼을 새로 만든다. 그래서 다음 부작용이 생긴다.

- 컬럼 필터 정의가 사라질 수 있다.
- 사용자가 바꾼 폭이 초기화될 수 있다.
- 레이아웃 이벤트와 화면 갱신 타이밍이 꼬일 수 있다.

컬럼 구성이 실제로 바뀌었을 때만 `setFields()` 와 `setColumns()` 를 호출하고, 행만 바뀌면 `setRows()` 만 호출한다.

```js
function columnSignature(columns) {
  return columns.map((c) => c.code || c.name || c.fieldName).join('|')
}

const sig = columnSignature(dynamicColumns)
const needColumns = force || sig !== builtColumnSig

if (needColumns) {
  gridView.beginUpdate()
  try {
    dataProvider.setFields(fields)
    gridView.setColumns(columns)
    setupColumnFilters(gridView)
    builtColumnSig = sig
  } finally {
    gridView.endUpdate()
  }
}

dataProvider.setRows(rows)
```

페이지마다 제품 컬럼이 달라지는 교차표라면, 서명에 제품 코드 목록까지 넣어야 한다.

```js
const sig = 'crosstab:' + productColumns.map((c) => c.code).join(',')
```

탭 이름만 비교하면 2페이지부터 새 제품 열이 안 생기는 반대 버그가 생긴다.

---

## 7. 리사이즈 화면 미반영 보정

RealGrid 2.10.x에서 리사이즈 후 화면 폭만 늦게 반영되는 경우에는 `onLayoutPropertyChanged` 를 사용한다.

주의점:

- `onColumnResized` 라는 콜백은 없다.
- 이벤트 속성명은 `width` 가 아니라 `displayWidth` 다.
- `resetSize()` 는 즉시 호출하면 너무 빠를 수 있다.
- `requestAnimationFrame()` 도 드래그 커밋 전이라 실패할 수 있다.
- `setTimeout(..., 50)` 정도로 살짝 늦춰야 한다.

기본형:

```js
const previous = gridView.onLayoutPropertyChanged

gridView.onLayoutPropertyChanged = (grid, layout, prop) => {
  if (prop === 'displayWidth') {
    setTimeout(() => {
      if (grid && typeof grid.resetSize === 'function') {
        grid.resetSize()
      }
    }, 50)
  }

  if (typeof previous === 'function') {
    return previous(grid, layout, prop)
  }
}
```

공통 그리드 컴포넌트에서 안전하게 넣으려면, 페이지가 나중에 `gridView.onLayoutPropertyChanged = ...` 를 덮어써도 보정이 지워지지 않게 해야 한다.

```js
const resizeRepaintStates = new WeakMap()

export function bindResizeRepaint(gridView, delay = 50) {
  if (!gridView || typeof gridView.resetSize !== 'function') return () => {}
  if (resizeRepaintStates.has(gridView)) return () => unbindResizeRepaint(gridView)

  const state = { pageCallback: null }
  resizeRepaintStates.set(gridView, state)

  const handler = (grid, layout, prop) => {
    if (prop === 'displayWidth') {
      setTimeout(() => {
        if (grid && typeof grid.resetSize === 'function') grid.resetSize()
      }, delay)
    }
    return state.pageCallback ? state.pageCallback(grid, layout, prop) : undefined
  }

  Object.defineProperty(gridView, 'onLayoutPropertyChanged', {
    configurable: true,
    enumerable: true,
    get: () => handler,
    set: (fn) => {
      state.pageCallback = typeof fn === 'function' ? fn : null
    }
  })

  return () => unbindResizeRepaint(gridView)
}

export function unbindResizeRepaint(gridView) {
  const state = resizeRepaintStates.get(gridView)
  if (!state) return

  resizeRepaintStates.delete(gridView)
  delete gridView.onLayoutPropertyChanged

  if (state.pageCallback) {
    gridView.onLayoutPropertyChanged = state.pageCallback
  }
}
```

그리드 생성 직후 한 번 바인딩한다.

```js
this._unbindResizeRepaint = bindResizeRepaint(this.gridView)
```

그리드 파괴 전에 해제한다.

```js
if (this._unbindResizeRepaint) {
  this._unbindResizeRepaint()
  this._unbindResizeRepaint = null
}
```

---

## 8. 컬럼 순서 저장/복원 시 폭을 버리지 말 것

컬럼 순서를 바꾸거나 저장된 뷰를 복원할 때 이름 배열만 넘기면 폭 정보가 빠질 수 있다.

위험한 코드:

```js
gridView.setColumnLayout(['statusCd', 'fieldNm', 'regNo', 'regulationNm'])
```

폭까지 유지하려면 `saveColumnLayout()` 이 반환한 레이아웃 객체를 보존해야 한다.

```js
const layout = gridView.saveColumnLayout()
gridView.setColumnLayout(layout)
```

저장된 레이아웃을 적용한 뒤에는 폭을 다시 확정하는 것도 안전하다.

```js
function applyLayoutWidths(gridView, layout) {
  const walk = (items) => {
    for (const item of items || []) {
      if (!item) continue
      const column = item.column || item.name
      if (column && typeof item.width === 'number' && item.width > 0) {
        gridView.setColumnProperty(column, 'width', item.width)
      }
      if (Array.isArray(item.items)) walk(item.items)
    }
  }
  walk(layout)
}

const layout = gridView.saveColumnLayout()
gridView.setColumnLayout(layout)
applyLayoutWidths(gridView, layout)
gridView.resetSize()
```

---

## 9. 필터가 같이 안 되는 경우

`filterable: true` 는 “필터 UI를 쓸 수 있다”는 기본 옵션이지, 동적 컬럼을 다시 만들 때 필터 정의를 보존한다는 뜻이 아니다.

`setColumns()` 를 호출하면 컬럼 객체가 새로 만들어지고, 기존 컬럼에 달아둔 필터 정의가 사라질 수 있다.

따라서 필터는 `setColumns()` 후에 다시 등록한다.

```js
gridView.setColumns(columns)

for (const col of columns) {
  if (col.filters) {
    gridView.setColumnFilters(col.name, col.filters)
  }
}
```

사용자가 활성화해 둔 필터까지 유지해야 한다면, `setColumns()` 전에 활성 필터 상태를 저장하고, 이후 다시 활성화한다.

```js
const activeFilters = {}

for (const col of gridView.getColumns()) {
  activeFilters[col.name] = gridView.getActiveColumnFilters(col.name).map((f) => f.name)
}

gridView.setColumns(columns)
setupColumnFilters(gridView)

for (const [columnName, filters] of Object.entries(activeFilters)) {
  if (filters.length) {
    gridView.activateColumnFilters(columnName, filters, true)
  }
}
```

---

## 10. 절대 먼저 하지 말 것

아래는 이번 재현에서 원인으로 보기 어렵거나, 먼저 할 일이 아니다.

- 동적 컬럼 구조를 정적 컬럼 구조로 갈아엎기
- RealGrid 컴포넌트를 새로 만들기
- 테스트 파일만 만들고 실제 브라우저 드래그를 하지 않기
- `column.width` 나 `getColumnProperty(name, 'displayWidth')` 만 보고 “폭이 안 바뀐다”고 결론내기
- `onColumnResized` 같은 존재하지 않는 콜백을 찾기
- `setColumns()` 를 매 조회마다 무조건 호출하기
- `setColumnLayout()` 에 이름 배열만 넘겨 사용자 폭을 버리기

---

## 11. 검증 절차

반드시 실제 브라우저에서 사람이 드래그하듯 확인한다. 자동 테스트나 synthetic drag만으로 완료 처리하지 않는다.

1. 화면 진입 직후 첫 번째 헤더를 두 번째 헤더 위치로 드래그한다.
   - 기대: 컬럼 순서가 바뀐다.
2. 그리드를 초기화하거나 새로고침한다.
3. `규제` 같은 넓은 컬럼의 오른쪽 경계를 왼쪽으로 드래그한다.
   - 기대: 기록 폭과 화면 폭이 모두 바뀐다.
   - 실패 상태: 기록 폭만 바뀌고 화면 폭은 그대로다.
4. 실패 상태라면 다시 컬럼 순서를 바꾼다.
   - 만약 그때 폭이 반영된다면 이 문서의 증상과 일치한다.
5. 수정 후에는 3번에서 바로 화면 폭이 바뀌어야 한다.
6. 필터도 함께 확인한다.
   - `setColumns()` 이후 필터 정의가 유지되는지 확인한다.
7. 동적 컬럼을 다시 주입한 뒤에도 계측/이벤트 훅이 살아 있는지 확인한다.
   - RealGrid는 `setColumns()` 과정에서 헤더 DOM/레이어를 다시 만들 수 있다.
   - 헤더 DOM에 직접 붙인 리스너나 진단용 훅은 다시 바인딩하거나, 안정적인 부모/문서 캡처 리스너에서 현재 헤더를 좌표로 다시 찾아야 한다.

진단용으로는 다음 화면을 참고한다.

```txt
http://localhost:5173/grid-studio/resize-doctor
```

이 화면은 리사이즈 값은 들어갔지만 화면 repaint가 막힌 상태를 재현하기 위해 만든 것이다.

---

## 12. 타 프로젝트용 Cline 작업 지시문

아래 내용을 Cline에게 그대로 전달한다.

```md
RealGrid 동적 컬럼 화면에서 컬럼 리사이즈가 화면에 바로 반영되지 않는 문제를 고쳐줘.

증상:
- 동적 컬럼 API 호출 후 데이터와 컬럼은 정상 표시됨
- 정렬은 됨
- 컬럼 순서 변경도 됨
- 컬럼 경계 드래그 후 폭이 화면에 바로 안 바뀜
- 그 상태에서 컬럼 순서를 바꾸면 방금 변경한 폭이 반영됨
- 필터가 true인데 동적 컬럼에서 필터가 사라지거나 동작하지 않을 수 있음

반드시 확인할 것:
1. beginUpdate/endUpdate 사용처를 전부 찾아라.
2. beginUpdate 후 endUpdate가 try/finally로 보장되는지 확인하라.
3. API 호출, await, return, throw가 beginUpdate와 endUpdate 사이에 있으면 밖으로 빼라.
4. setColumns는 컬럼 구성이 실제로 바뀔 때만 호출하라.
5. setColumns 후 필터 정의를 다시 등록하라.
6. 리사이즈 보정은 onLayoutPropertyChanged에서 prop === 'displayWidth'일 때 setTimeout(() => gridView.resetSize(), 50)으로 처리하라.
7. onLayoutPropertyChanged를 덮어쓸 때 기존 콜백을 보존하라.
8. 컬럼 폭 확인은 column.width가 아니라 saveColumnLayout()의 width로 하라.
9. setColumnLayout에 이름 배열만 넘겨 사용자 폭을 버리지 마라.
10. setColumns 이후 헤더 DOM/레이어가 다시 만들어질 수 있으니, DOM에 직접 붙인 계측/이벤트 훅은 재바인딩하거나 안정적인 부모/문서 캡처에서 현재 헤더를 다시 찾아라.
11. 수정 후 실제 브라우저에서 마우스 드래그로 확인하라. 테스트 코드 결과만으로 성공 처리하지 마라.

기대 결과:
- 컬럼 순서 변경 정상
- 컬럼 리사이즈 즉시 화면 반영
- 리사이즈 후 saveColumnLayout() width와 DOM 헤더 폭이 일치
- 필터 정의 유지
```

---

## 13. 이 프로젝트에서 참고할 파일

NexHubStudio 기준 참고 파일:

- `src/pages/RealGridResizeDoctorPage.vue`
  - 증상 재현 화면
  - `기록 폭(saveColumnLayout)` 과 `화면 폭(DOM)` 을 비교하는 방식 참고
- `src/utils/realgridResizeRepaint.js`
  - `onLayoutPropertyChanged -> displayWidth -> setTimeout(resetSize)` 보정 참고
- `src/components/RealGridCommonJs.vue`
  - 공통 그리드 생성 직후 보정 바인딩 위치 참고
- `src/pages/regulation/RegulationInfoPage.vue`
  - 동적 컬럼에서 `setColumns()` 를 컬럼 구성이 바뀐 때만 호출하는 방식 참고

---

## 14. 최종 체크리스트

수정 완료 전에 아래가 모두 참이어야 한다.

- [ ] `beginUpdate()` 는 모두 `finally { endUpdate() }` 로 닫힌다.
- [ ] `beginUpdate()` 와 `endUpdate()` 사이에 API `await` 가 없다.
- [ ] 동적 컬럼 서명을 비교해서 필요한 때만 `setColumns()` 를 호출한다.
- [ ] `setColumns()` 후 필터 정의를 다시 등록한다.
- [ ] `onLayoutPropertyChanged` 의 `displayWidth` 이벤트에서 지연 `resetSize()` 를 호출한다.
- [ ] 페이지별 `onLayoutPropertyChanged` 콜백을 덮어써도 공통 보정이 지워지지 않는다.
- [ ] 컬럼 레이아웃 저장/복원 시 width가 보존된다.
- [ ] 동적 컬럼 재주입 뒤에도 계측/이벤트 훅이 새 헤더 DOM 기준으로 동작한다.
- [ ] 실제 브라우저 드래그로 컬럼 순서 변경과 컬럼 리사이즈를 모두 확인했다.
