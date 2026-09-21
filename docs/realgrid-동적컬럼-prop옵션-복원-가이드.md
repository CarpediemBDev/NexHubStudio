# RealGrid 동적 컬럼 prop 옵션 복원 가이드

이 문서는 다른 프로젝트에 그대로 가져가서 적용하기 위한 가이드다.

대상 증상은 다음 조합이다.

- `RealGridCommonJs` 같은 공통 그리드 컴포넌트에 prop을 선언한다.
- 예: `:sortable="true"`, `:filterable="true"`, `:group-panel-visible="true"`, `:editable="false"`, `:checkable="false"`
- 화면에서는 탭, 조회 조건, 크로스탭 등에 따라 같은 RealGrid 인스턴스에 `fields`, `columns`, `rows` 를 동적으로 다시 넣는다.
- 초기에는 옵션이 정상처럼 보이다가 동적 컬럼 전환 후 정렬, 필터, 그룹패널, 체크바, 상태바 같은 설정이 사라지거나 다르게 보인다.
- 특히 `:filterable="true"` 인데 헤더 필터 아이콘이 안 보이거나, `setOptions()` 추가 후 그리드가 비어 보일 수 있다.

결론부터 말하면, 이 문제는 **prop 값을 화면에서 다시 일일이 매핑하는 방식으로 풀지 않는다.**

공통 컴포넌트가 prop을 RealGrid 옵션으로 적용한 뒤, 화면에서는 그 결과를 `gridView.getOptions()` 로 저장하고 동적 컬럼 세팅 전에 `gridView.setOptions()` 로 복원한다.

---

## 1. 한 줄 결론

동적 컬럼 화면에서는 다음 순서를 지킨다.

```txt
onGridInit
  -> gridView.getOptions() 로 초기 옵션 저장

동적 fields/columns/rows 교체 시
  -> 기존 rows 비움
  -> 기존 fields/columns 비움
  -> 저장해 둔 초기 옵션 setOptions()
  -> 새 fields/columns 를 prop으로 주입
  -> rows 주입
  -> 화면별 레이아웃/필터/행높이 설정
```

중요한 점은 `setOptions()` 를 **새 컬럼을 넣은 뒤에 호출하지 않는 것**이다.

`getOptions()` 결과에는 RealGrid 내부의 컬럼/레이아웃 계열 상태가 섞일 수 있다. 그래서 동적 `setColumns()` 이후 `setOptions()` 를 호출하면 방금 넣은 컬럼이 되돌아가거나 빈 그리드처럼 보일 수 있다.

---

## 2. 적용 대상

아래 패턴이 있는 화면이면 이 가이드 대상이다.

```vue
<RealGridCommonJs
  ref="grid"
  :fields="currentGridFields"
  :columns="currentGridColumns"
  :rows="currentGridRows"
  :editable="false"
  :checkable="false"
  :state-bar-visible="false"
  :sortable="true"
  :filterable="true"
  :group-panel-visible="true"
  fit-style="even"
  @init="onGridInit"
/>
```

그리고 화면 코드에서 API 응답이나 탭 상태에 따라 다음처럼 필드/컬럼 구조를 갈아끼운다.

```js
this.currentGridFields = fields
this.currentGridColumns = columns
this.currentGridRows = rows
```

또는 직접 RealGrid API를 호출한다.

```js
dataProvider.setFields(fields)
gridView.setColumns(columns)
dataProvider.setRows(rows)
```

---

## 3. 왜 `grid.$props` 를 그대로 쓰면 안 되나

처음 보면 이렇게 하고 싶어진다.

```js
const gridProps = this.$refs.grid.$props
```

그리고 `setFields`, `setColumns`, `setRows` 쪽에 같이 넣고 싶어진다.

하지만 Vue prop 구조와 RealGrid API 구조는 다르다.

```js
dataProvider.setFields(fields) // 필드 배열만 받음
gridView.setColumns(columns)   // 컬럼 배열만 받음
dataProvider.setRows(rows)     // row 배열만 받음
gridView.setOptions(options)   // RealGrid 옵션 객체를 받음
```

`grid.$props` 는 이런 값이다.

```js
{
  editable: false,
  checkable: false,
  stateBarVisible: false,
  sortable: true,
  filterable: true,
  groupPanelVisible: true,
  fields: [...],
  columns: [...],
  rows: [...]
}
```

이 값을 `setColumns()` 나 `setFields()` 에 섞으면 RealGrid가 기대하는 구조와 맞지 않는다.

따라서 화면은 prop을 직접 해석하지 않는다. 공통 컴포넌트가 prop을 RealGrid에 적용한 결과를 `getOptions()` 로 저장한다.

---

## 4. 화면 적용 코드

### 4-1. 초기 옵션 보관 변수

`created()` 또는 초기화 위치에 둔다.

```js
created() {
  this.initGridOptions = null
}
```

반응형일 필요가 없다. RealGrid 옵션 스냅샷을 저장하는 용도다.

### 4-2. 옵션 저장/복원 함수

```js
saveInitOptions(gridView) {
  this.initGridOptions = typeof gridView?.getOptions === 'function' ? gridView.getOptions() : null
},
restoreInitOptions() {
  if (!this.initGridOptions || typeof this.gridView?.setOptions !== 'function') return
  try { this.gridView.setOptions(this.initGridOptions) } catch (e) { /* noop */ }
}
```

역할은 단순하다.

- `saveInitOptions`: 공통 컴포넌트 prop이 RealGrid에 적용된 초기 옵션을 저장한다.
- `restoreInitOptions`: 동적 컬럼을 다시 넣기 전에 초기 옵션을 복원한다.

### 4-3. `onGridInit` 에서 저장

```js
onGridInit({ gridView, dataProvider }) {
  this.gridView = gridView
  this.dataProvider = dataProvider
  this.saveInitOptions(gridView)

  this.configureGridForView()
}
```

`@init` 시점에는 공통 컴포넌트가 이미 `editable`, `checkable`, `sortable`, `filterable`, `groupPanelVisible`, `fitStyle` 같은 prop을 RealGrid에 적용한 뒤다.

그래서 이 시점의 `gridView.getOptions()` 가 “선언된 prop이 반영된 초기 옵션”이다.

### 4-4. 동적 컬럼 주입 순서

핵심은 `restoreInitOptions()` 위치다.

```js
async applyGridPayload({ fields, columns, rows }) {
  this.currentGridRows = []
  if (this.dataProvider) this.dataProvider.setRows([])

  this.currentGridFields = []
  this.currentGridColumns = []
  await this.$nextTick()

  this.restoreInitOptions()

  this.currentGridFields = fields
  this.currentGridColumns = columns
  await this.$nextTick()

  if (this.dataProvider && fields && fields.length) {
    this.dataProvider.setFields(fields)
  }

  this.currentGridRows = rows
  await this.$nextTick()
  if (this.dataProvider) this.dataProvider.setRows(rows || [])

  this.configureGridForView()
}
```

이 순서가 중요한 이유:

- 기존 rows를 먼저 비워 필드/컬럼 구조 변경 중 데이터 불일치를 피한다.
- 기존 fields/columns를 비워 같은 RealGrid 인스턴스에 이전 구조가 남는 것을 줄인다.
- `setOptions()` 는 새 columns를 넣기 전에 호출한다.
- 새 columns는 `currentGridColumns` prop 변경으로 공통 컴포넌트 watcher가 처리하게 둔다.
- 화면별 행 높이, 레이아웃, 국가 필터 같은 설정은 마지막에 다시 적용한다.

---

## 5. 하지 말 것

### 5-1. `setOptions()` 를 컬럼 적용 뒤에 호출하지 말 것

나쁜 예:

```js
this.currentGridColumns = columns
await this.$nextTick()

this.gridView.setOptions(this.initGridOptions)
```

이렇게 하면 `initGridOptions` 안의 초기 컬럼/레이아웃 상태가 새 컬럼을 덮을 수 있다. 그 결과 그리드가 비어 보이거나 레이아웃이 꼬일 수 있다.

### 5-2. 화면에서 prop을 하나씩 다시 매핑하지 말 것

나쁜 예:

```js
gridView.setSortingOptions({ enabled: grid.sortable })
gridView.setFilteringOptions({ enabled: grid.filterable })
gridView.setGroupPanel({ visible: grid.groupPanelVisible })
```

이 방식은 당장은 동작하지만 prop이 늘어날 때 누락되기 쉽다. `editable`, `checkable`, `stateBarVisible`, `fitStyle`, `rowResizable`, `useFooter` 같은 옵션을 계속 따라가야 한다.

화면에서는 `getOptions()` / `setOptions()` 로 초기 옵션을 복원한다.

### 5-3. `grid.$props` 를 `setColumns()` 에 섞지 말 것

나쁜 예:

```js
const gridProps = this.$refs.grid.$props
this.gridView.setColumns({ ...columns, ...gridProps })
```

`columns` 는 배열이고 `gridProps` 는 Vue prop 객체다. RealGrid 컬럼 정의 구조가 깨진다.

### 5-4. 공통 컴포넌트 watcher를 우회하지 말 것

동적 컬럼 화면에서 화면 코드가 직접 `gridView.setColumns(columns)` 를 또 호출하면 공통 컴포넌트가 컬럼에 붙이는 옵션을 우회할 수 있다.

예를 들어 공통 컴포넌트가 컬럼 세팅 시 `autoFilter` 를 붙이고 있다면, 화면에서 직접 `setColumns()` 를 호출하는 순간 필터 아이콘이 다시 사라질 수 있다.

가능하면 다음 흐름을 우선한다.

```js
this.currentGridColumns = columns
await this.$nextTick()
```

직접 `setColumns()` 를 꼭 호출해야 한다면, 공통 컴포넌트가 컬럼에 보정하는 옵션도 같이 적용해야 한다.

---

## 6. 공통 컴포넌트 선행 점검

화면에서 옵션 스냅샷을 저장하려면, 공통 컴포넌트가 prop을 실제 RealGrid 옵션에 제대로 반영하고 있어야 한다.

아래 항목을 먼저 확인한다.

### 6-1. 정렬

나쁜 예:

```js
gridView.setSortingOptions({ enabled: true })
```

좋은 예:

```js
gridView.setSortingOptions({ enabled: this.resolvedSortable })
```

### 6-2. 필터

`filterable` prop은 `setFilteringOptions()` 와 컬럼의 `autoFilter` 양쪽에 반영되어야 한다.

```js
gridView.setFilteringOptions({ enabled: this.resolvedFilterable })
gridView.setColumns(columns.map(c => ({
  autoFilter: this.resolvedFilterable,
  ...c
})))
```

필터 기능은 켜져 있는데 헤더 필터 아이콘이 안 보인다면 `autoFilter` 누락을 의심한다.

### 6-3. 편집 옵션

나쁜 예:

```js
gridView.setEditOptions({
  editable: this.editable,
  insertable: true,
  appendable: true,
  commitWhenLeave: true
})
```

좋은 예:

```js
gridView.setEditOptions({
  editable: this.editable,
  insertable: this.resolvedInsertable,
  appendable: this.resolvedInsertable,
  commitWhenLeave: this.resolvedCommitWhenLeave
})
```

### 6-4. 저장 뷰 그룹 포함 여부

나쁜 예:

```js
captureViewState(gridView, { includeGroup: true })
```

좋은 예:

```js
captureViewState(gridView, {
  includeGroup: this.includeGroupInView,
  dataProvider: this.dataProvider
})
```

### 6-5. 그룹 패널과 정렬/필터를 묶지 말 것

`groupPanelVisible` 은 그룹 패널 표시 여부다. 정렬/필터 가능 여부와는 별도 prop이다.

나쁜 구조:

```js
if (this.resolvedGroupPanelVisible) {
  gridView.setSortingOptions({ enabled: true })
}
```

좋은 구조:

```js
if (this.resolvedGroupPanelVisible) {
  gridView.setGroupPanel({ visible: true })
  gridView.setGroupingOptions({ enabled: true })
}

gridView.setSortingOptions({ enabled: this.resolvedSortable })
gridView.setFilteringOptions({ enabled: this.resolvedFilterable })
```

---

## 7. `rowGroup.mergeMode` 는 별도 판단

`mergeMode` prop과 `rowGroup.mergeMode` 는 이름이 비슷하지만 성격이 다를 수 있다.

공통 컴포넌트의 `mergeMode` prop이 셀 병합용 `mergeRule` 자동 적용을 뜻한다면:

```js
gridView.setColumnProperty(col.name, 'mergeRule', 'value')
```

`rowGroup.mergeMode` 는 그룹핑 행의 병합 표시 방식이다.

```js
gridView.setRowGroup({
  summaryMode: this.resolvedSummaryMode,
  mergeMode: true
})
```

이 값은 기존 화면에서 그룹 셀 표시를 의도적으로 켜기 위해 `true` 일 수 있다. 따라서 다른 prop 누락처럼 바로 `this.resolvedMergeMode` 로 바꾸지 말고, 해당 프로젝트에서 `mergeMode` prop이 무엇을 의미하는지 확인한 뒤 결정한다.

---

## 8. 타 프로젝트 적용 체크리스트

### 화면 파일에서 검색

```txt
setFields
setColumns
setRows
getOptions
setOptions
configureGrid
onGridInit
currentGridFields
currentGridColumns
currentGridRows
```

확인할 것:

- 같은 RealGrid 인스턴스에 다른 fields/columns 구조를 다시 넣는가?
- `setOptions()` 를 동적 컬럼 적용 뒤에 호출하고 있지 않은가?
- 화면에서 직접 `gridView.setColumns()` 를 호출해 공통 컴포넌트 watcher를 우회하고 있지 않은가?
- 화면별 설정은 동적 컬럼 적용 후 다시 적용되는가?

### 공통 컴포넌트에서 검색

```txt
sortable
filterable
groupPanelVisible
editable
insertable
commitWhenLeave
checkable
stateBarVisible
autoFilter
setSortingOptions
setFilteringOptions
setColumns
```

확인할 것:

- prop이 선언만 되어 있고 실제 RealGrid API 호출에 쓰이지 않는 것은 없는가?
- `true` / `false` 로 하드코딩되어 prop을 무시하는 부분은 없는가?
- `filterable` 이 `setFilteringOptions` 뿐 아니라 컬럼 `autoFilter` 에도 반영되는가?

---

## 9. 검증 방법

수정 후 아래를 확인한다.

- 첫 진입 시 데이터가 보인다.
- 탭 전환 또는 크로스탭 전환 후에도 데이터가 보인다.
- `:sortable="true"` 컬럼 정렬이 된다.
- `:filterable="true"` 헤더 필터 아이콘이 보인다.
- `:group-panel-visible="true"` 그룹 패널이 보인다.
- `:editable="false"` 인 화면에서 셀 편집이 되지 않는다.
- `:checkable="false"` 인 화면에서 체크바가 보이지 않는다.
- `:state-bar-visible="false"` 인 화면에서 상태바가 보이지 않는다.
- 컬럼 레이아웃, 행 높이, 화면별 필터가 동적 컬럼 적용 후에도 유지된다.

빌드는 최소 한 번 확인한다.

```bash
npm run build -- --logLevel error
```

---

## 10. 최종 패턴 요약

화면은 RealGrid prop을 직접 재해석하지 않는다.

```txt
Vue 선언 prop
  -> 공통 컴포넌트가 RealGrid 옵션으로 적용
  -> 화면 onGridInit 에서 getOptions() 로 저장
  -> 동적 컬럼 세팅 전에 setOptions() 로 복원
  -> 새 fields/columns/rows 주입
  -> 화면별 설정 재적용
```

이 패턴을 쓰면 화면마다 `sortable`, `filterable`, `groupPanelVisible`, `editable`, `checkable` 등을 하나씩 다시 매핑하지 않아도 된다. 그리고 prop이 새로 추가되어도 공통 컴포넌트가 제대로 적용만 해주면 동적 컬럼 화면은 초기 옵션 스냅샷을 그대로 복원할 수 있다.
