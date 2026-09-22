# RealGrid 동적 컬럼 prop 옵션 유지 가이드

예제는 이 프로젝트 소스를 본다.

- 공통 컴포넌트: `src/components/RealGridCommonJs.vue` — `bindColumnDefaults`, `initGrid`
- 트리 컴포넌트: `src/components/RealGridTreeJs.vue` — 같은 `bindColumnDefaults` (셀 병합 없음, autoFilter 만)
- realgrid-vue 컴포넌트: `src/components/RealGridCommonVue.vue` — `setColumns` 와 함께 **`addColumn` 도 감싼다**. realgrid-vue 는 `<RealGridColumn>` 자식이 마운트될 때마다 `addColumn` 을 부르므로 `setColumns` 만 감싸면 효과가 없다
- 동적 화면: `src/pages/regulation/RegulationInfoPage.vue` — `onGridInit`, `applyGridPayload`, `configureGridForView`

---

## 1. 목표와 원칙

업무 화면은 `:editable`, `:checkable`, `:sortable`, `:filterable`, `:group-panel-visible`, `fit-style` 같은 prop 을 화면마다 다르게 선언한다. 동적 화면은 빈 fields/columns 로 시작해 API 응답 뒤 실제 필드/컬럼으로 바꾼다. **바꾼 뒤에도 선언한 prop 설정이 유지되어야 한다.**

prop 은 RealGrid 안에서 두 곳에 나뉘어 산다.

| 종류 | 예 | 새 컬럼을 넣으면 | 담당 |
| --- | --- | --- | --- |
| 그리드 옵션 | editable, checkable, stateBar, sortable, groupPanel, fitStyle, 필터 기능 on/off | **유지된다** (실측) | 없음. 따로 저장·복원하지 않는다 |
| 컬럼 속성 | `filterable` → 컬럼별 `autoFilter`, `mergeMode` → 컬럼별 `mergeRule` | **사라진다** | 공통 컴포넌트: `setColumns` 감싸기 |

필터 아이콘은 필터 기능(`setFilteringOptions`)과 컬럼별 `autoFilter` 가 **둘 다** 켜져야 보인다. 동적 컬럼에서 아이콘이 사라지는 건 뒤쪽이 빠져서다.

> **`getOptions()` → `setOptions()` 로 "초기 옵션 스냅샷 복원" 을 하지 말 것.**
> `getOptions()` 는 값을 복사한 스냅샷이 아니라 그리드가 쓰고 있는 내부 옵션 객체를 그대로 돌려준다 (이후 변경이 그대로 반영됨). 이걸 `setOptions()` 에 다시 넣으면 에디터 옵션 처리 중 `Cannot read properties of undefined (reading 'slice')` 예외가 난다.
> 동적 컬럼 교체 함수 안에서 이 예외가 나면 함수가 중간에 멈춰 **탭 전환 후 그리드가 텅 빈다** (rows/columns 를 비운 뒤 다시 채우지 못함). 첫 진입은 그리드 생성 전이라 복원을 건너뛰어 멀쩡해 보인다. `try/catch` 로 감싸면 증상은 숨지만 옵션이 절반만 적용된 채 넘어간다.

---

## 2. 공통 컴포넌트: `setColumns` 감싸기 (필수)

`initGrid` 에서 `gridView` 를 만든 직후 한 번 호출한다.

```js
bindColumnDefaults() {
  const gv = this.gridView
  const rawSetColumns = gv.setColumns.bind(gv)
  gv.setColumns = (cols) => {
    const result = rawSetColumns((cols || []).map(c => ({ autoFilter: this.resolvedFilterable, ...c })))
    this.applyCellMerging()  // (선택) 셀 병합을 쓸 때만 — 부록 A
    return result
  }
}
```

- watcher 든, 화면의 `@init` 에서 `gridView.setColumns()` 를 직접 부르든, **어디서 부르든** 보정된다. 화면이 지켜야 할 규칙이 없다.
- `autoFilter` 는 하드코딩이 아니라 화면의 `:filterable` 값이다. `:filterable="false"` 면 `false` 가 붙는다. 선언하지 않으면 기본값 `true`.
- 컬럼에 `autoFilter` 를 직접 적으면 그 값이 우선한다 (`...c` 가 뒤).
- `applyCellMerging()` 줄은 선택이다. 필터 아이콘과는 무관하다. 우리처럼 셀 병합 기능을 쓸 때만 넣는다 (부록 A).

같이 확인할 것:

- prop 을 하드코딩하지 않는다: `setSortingOptions({ enabled: this.resolvedSortable })`, `setFilteringOptions({ enabled: this.resolvedFilterable })`.
---

## 3. 동적 화면 (필수)

```txt
API 응답 후 (applyGridPayload)
  1. rows 비움 -> fields/columns 비움 -> nextTick
  2. 새 fields/columns 적용 (prop 대입이든 setColumns 직접 호출이든 상관없음)
  3. setFields -> setRows          ← setFields 는 기존 행을 지우므로 반드시 setRows 보다 먼저
  4. configureGridForView()        ← 행 높이, setColumnLayout, 커스텀 컬럼 필터
```

- **화면별 설정은 컬럼을 바꿀 때마다 다시 적용한다.** `setColumnLayout`(헤더 묶음), `setColumnFilters`(커스텀 필터)는 이전 컬럼 기준이라 새 컬럼과 맞지 않는다. `configureGridForView()` 에 모아 매번 부른다. `onGridInit` 에서 한 번만 하면 안 된다.
- 교체 함수가 중간에 예외로 멈추면 비운 상태로 남아 빈 그리드가 된다. 빈 그리드가 보이면 먼저 콘솔 에러를 본다.

---

## 4. 검증

데이터가 들어온 **뒤에** 콘솔에서 확인한다. 첫 화면만 보고 판단하지 않는다.

```js
// 1) 감싸기가 적용됐는가 — 네이티브 함수가 아니어야 한다
gridView.setColumns.toString().includes('autoFilter')   // true

// 2) 필터가 빠진 컬럼 — :filterable="true" 화면에서 빈 배열
gridView.getColumns().filter(c => !c.autoFilter).map(c => c.name)
```

- 새로고침 후, 탭/목록 전환 후 모두 필터 아이콘·정렬·그룹패널·헤더 묶음·행 높이가 유지된다.
- 탭을 **두 번 이상** 오간 뒤에도 데이터가 보이고 콘솔 에러가 없다.
- `:filterable="false"` 화면에는 아이콘이 없다.
- `npm run build -- --logLevel error` 통과.

---

## 5. 그래도 안 될 때: 콘솔 진단

### 5-1. 콘솔에서 gridView 잡기

화면의 `onGridInit` 에 잠시 두 줄을 넣는다 (진단이 끝나면 삭제).

```js
onGridInit({ gridView, dataProvider }) {
  window.__gv = gridView   // 진단용 — 끝나면 삭제
  window.__dp = dataProvider
  // ... 기존 코드
}
```

### 5-2. 지금 상태 한 번에 보기

문제가 보이는 상태(빈 그리드, 아이콘 없음 등)에서 콘솔에 붙여 넣는다.

```js
const gv = __gv, dp = __dp;
({
  감싸기적용: gv.setColumns.toString().includes('autoFilter'),
  필터기능: gv.getFilteringOptions().enabled,
  컬럼수: gv.getColumns().length,
  필터빠진컬럼: gv.getColumns().filter(c => !c.autoFilter).map(c => c.name),
  필드수: dp.getFields().length,
  행수_provider: dp.getRowCount(),
  행수_grid: gv.getItemCount(),
  필드없는컬럼: gv.getColumns().filter(c => c.fieldName && dp.getFieldIndex(c.fieldName) < 0).map(c => c.name),
  첫행키: dp.getRowCount() ? Object.keys(dp.getJsonRow(0)).slice(0, 5) : null,
  그리드크기: [gv.getContainer().clientWidth, gv.getContainer().clientHeight]
})
```

| 결과 | 원인 | 조치 |
| --- | --- | --- |
| `감싸기적용: false` | 공통 컴포넌트에 감싸기가 없거나 `initGrid` 에서 호출 안 함 | 2장 |
| `필터기능: false` | `setFilteringOptions` 가 prop 을 안 따르거나 `:filterable="false"` | 2장 "같이 확인할 것" |
| `필터빠진컬럼` 에 이름이 있음 | 감싸기를 거치지 않은 `setColumns` 가 있음 | 5-3 추적 |
| `컬럼수: 0` 또는 이전 탭의 컬럼 수 | 컬럼 교체가 중간에 멈춤 | 콘솔 에러 확인, 5-3 추적 |
| `행수_provider: 0` | 행을 다시 안 넣었거나 `setRows` 뒤에 `setFields` 를 불러 행이 지워짐 | 3장 순서 (`setFields` → `setRows`) |
| 행 수는 정상인데 셀이 빔, `필드없는컬럼` 에 이름이 있음 | 컬럼 `fieldName` 과 필드 이름 불일치 | 필드/컬럼 정의 확인 |
| 행 수 정상, `첫행키` 가 필드 이름과 다름 (대소문자 등) | 행 데이터 키와 필드 이름 불일치 | API 응답 키 확인. `dp.getFields()` 는 이름을 대문자로 돌려주므로 그 결과를 다시 `setFields` 에 쓰지 말 것 |
| `그리드크기` 가 0 | 숨겨진 상태에서 그려짐 | 보이게 된 뒤 `gv.resetSize()` |

### 5-3. 호출 순서 추적

탭 전환·조회 중에 누가 무엇을 어떤 순서로 부르는지 찍는다. `onGridInit` 안에서 5-1 다음에 넣고 문제 동작을 재현한다 (끝나면 삭제).

```js
const trace = (obj, name, fmt) => {
  const raw = obj[name].bind(obj)
  obj[name] = (...args) => {
    console.log(`[${name}]`, fmt ? fmt(...args) : '')
    console.trace()   // 호출 위치. 너무 길면 이 줄을 지운다
    try { return raw(...args) } catch (e) { console.error(`[${name}] 예외`, e); throw e }
  }
};
trace(gridView, 'setColumns', cols => (cols || []).length + '개');
trace(gridView, 'setOptions');
trace(dataProvider, 'setFields', f => (f || []).length + '개');
trace(dataProvider, 'setRows', rows => (rows || []).length + '행');
```

정상이면 탭 전환마다 이런 순서가 찍힌다.

```txt
[setRows] 0행          ← 비우기
[setFields] 31개
[setColumns] 24개
[setRows] 20행
```

필터 아이콘 여부는 이 로그로 보지 않는다. 추적 코드는 감싸기 바깥에 씌워져서 `autoFilter` 가 붙기 전 값이 찍힌다. 아이콘은 5-2 `필터빠진컬럼` 으로 판단한다.

| 로그 | 원인 |
| --- | --- |
| `[setOptions]` 가 찍힘 | 스냅샷 복원 코드가 남아 있음. 1장 경고대로 지운다 |
| `[xxx] 예외` 뒤로 로그가 끊김 | 그 호출에서 교체 함수가 멈췄다. 빈 그리드의 직접 원인 |
| `[setRows] 20행` 다음에 `[setFields]` | 행이 지워진다. `setFields` 를 앞으로 |
| `[setRows] 0행` 이후 아무것도 없음 | 새 데이터를 넣는 코드가 실행되지 않음 (조건문, await 누락, 예외) |

### 5-4. 감싸기 안쪽에서 바로 판정하기

2장 코드가 있는데도 실패하면 바깥 추적만으로는 부족하다. 잠깐 `bindColumnDefaults()` 를 아래처럼 바꿔서 **감싼 함수 안쪽**을 본다. 진단이 끝나면 원래 코드로 되돌린다.

```js
bindColumnDefaults() {
  const gv = this.gridView
  if (!gv || gv.__columnDefaultsBound) return

  const rawSetColumns = gv.setColumns.bind(gv)
  gv.__columnDefaultsBound = true

  gv.setColumns = (cols) => {
    const input = Array.isArray(cols) ? cols : []
    const patched = input.map(c => ({ autoFilter: this.resolvedFilterable, ...c }))

    console.groupCollapsed(`[RealGrid setColumns] in=${input.length}, filterable=${this.resolvedFilterable}`)
    console.log('입력 컬럼', input.map(c => ({
      name: c.name,
      fieldName: c.fieldName,
      autoFilter: c.autoFilter
    })))
    console.log('보정 후 false/누락', patched
      .filter(c => c.autoFilter !== true)
      .map(c => ({ name: c.name, autoFilter: c.autoFilter })))

    try {
      const result = rawSetColumns(patched)
      const after = typeof gv.getColumns === 'function' ? (gv.getColumns() || []) : []
      const readAutoFilter = (col) => {
        try {
          return typeof gv.getColumnProperty === 'function'
            ? gv.getColumnProperty(col.name, 'autoFilter')
            : col.autoFilter
        } catch (e) {
          return col.autoFilter
        }
      }

      console.log('적용 후 false/누락', after
        .filter(c => readAutoFilter(c) !== true)
        .map(c => ({ name: c.name, autoFilter: readAutoFilter(c) })))

      if (typeof this.applyCellMerging === 'function') this.applyCellMerging()
      return result
    } catch (e) {
      console.error('[RealGrid setColumns] 예외', e)
      throw e
    } finally {
      console.groupEnd()
    }
  }
}
```

판정은 이렇게 한다.

| 로그 | 원인 | 조치 |
| --- | --- | --- |
| 로그가 아예 안 찍힘 | 실제 화면의 `gridView` 가 이 공통 컴포넌트 인스턴스의 `gridView` 가 아님, 또는 `bindColumnDefaults()` 호출 전/후가 잘못됨 | `initGrid` 에서 `this.gridView` 만든 직후, 첫 `setColumns` 보다 먼저 호출 |
| `filterable=false` | 화면 prop 이 false 로 들어왔거나 resolver 가 잘못됨 | 선언부 `:filterable="true"` 와 `resolvedFilterable` 확인 |
| `입력 컬럼` 에 이미 `autoFilter: false` | 컬럼 생성 함수가 false 를 명시함. `...c` 가 뒤라 명시값이 우선한다 | 해당 컬럼 정의 제거 또는 의도 확인 |
| `보정 후 false/누락` 이 있음 | `name` 없는 그룹/가짜 컬럼이 섞였거나 컬럼 구조가 예상과 다름 | leaf 컬럼만 `setColumns` 에 넣는지 확인 |
| `보정 후` 는 비었는데 `적용 후 false/누락` 이 있음 | RealGrid 가 컬럼 정의를 받는 과정에서 속성을 버렸거나, `getColumns()` 로는 안 보이는 버전 | `getColumnProperty(name, 'autoFilter')` 결과를 우선 신뢰. 그래도 false 면 `setColumnProperty` 후처리 방식으로 변경 |
| `rawSetColumns` 예외 | 컬럼 정의 자체가 RealGrid 형식과 맞지 않음 | 예외가 난 컬럼명/fieldName 을 보고 컬럼 생성 함수 확인 |

`setColumns` 감싸기를 여러 번 호출하면 감싸기 위에 감싸기가 쌓여 로그가 헷갈린다. 그래서 진단 코드처럼 `gv.__columnDefaultsBound` 마커를 둔다. 운영 코드에도 이 가드를 넣어두면 중복 감싸기를 피할 수 있다.

### 5-5. 누가 나중에 덮는지 추적하기

5-4 에서 `적용 후 false/누락` 은 없는데 화면에서는 아이콘이 사라지면, `setColumns` 이후 다른 코드가 다시 덮는 것이다. 이때는 아래를 `onGridInit` 에 임시로 넣는다.

```js
const traceMethod = (obj, name, fmt) => {
  if (!obj || typeof obj[name] !== 'function') return
  const raw = obj[name].bind(obj)
  obj[name] = (...args) => {
    const msg = fmt ? fmt(...args) : ''
    if (msg !== false) {
      console.log(`[${name}]`, msg)
      console.trace()
    }
    return raw(...args)
  }
}

traceMethod(gridView, 'setColumnProperty', (col, prop, value) => {
  if (prop !== 'autoFilter' && prop !== 'visible' && prop !== 'filters') return false
  return { col, prop, value }
})
traceMethod(gridView, 'setFilteringOptions', opts => opts)
traceMethod(gridView, 'setColumnLayout', layout => layout)
traceMethod(gridView, 'setColumnFilters', (col, filters) => ({
  col,
  count: (filters || []).length
}))
traceMethod(gridView, 'setOptions', () => 'setOptions 호출됨')
```

판정:

| 로그 | 의미 |
| --- | --- |
| `[setColumnProperty] { prop: 'autoFilter', value: false }` | 누군가 컬럼 필터를 끄고 있다 |
| `[setFilteringOptions] { enabled: false }` | 필터 기능 자체가 꺼졌다 |
| `[setOptions]` | 옵션 스냅샷 복원 코드가 남아 있다. 이 가이드에서는 제거 대상 |
| `[setColumnLayout]` 이후 특정 컬럼만 안 보임 | 레이아웃에 없는 컬럼이 숨거나 헤더 묶음이 잘못됨 |
| `[setColumnFilters]` 예외 또는 잘못된 컬럼명 | 커스텀 필터가 이전 컬럼 기준으로 적용됨. `configureGridForView()` 에서 새 컬럼 뒤 다시 설정 |

### 5-6. 중첩 컬럼 구조를 쓰는 프로젝트

이 프로젝트는 컬럼 배열을 평평하게 만들고 헤더 묶음은 `setColumnLayout()` 으로 만든다. 다른 프로젝트가 아래처럼 중첩 컬럼을 `setColumns()` 에 직접 넣는다면 단순 `map` 으로는 leaf 컬럼까지 기본값이 들어가지 않을 수 있다.

```js
[
  {
    name: 'productGroup',
    header: { text: '제품' },
    columns: [
      { name: 'productCd', fieldName: 'productCd' },
      { name: 'productNm', fieldName: 'productNm' }
    ]
  }
]
```

그 경우에는 leaf 컬럼까지 내려가서 보정한다.

```js
const withColumnDefaults = (cols) => (cols || []).map(c => {
  const next = { autoFilter: this.resolvedFilterable, ...c }
  if (Array.isArray(c.columns)) next.columns = withColumnDefaults(c.columns)
  if (Array.isArray(c.items)) next.items = withColumnDefaults(c.items)
  return next
})

gv.setColumns = (cols) => rawSetColumns(withColumnDefaults(cols))
```

다만 RealGrid2 에서는 보통 컬럼 정의는 평평하게 두고, 헤더 그룹은 `setColumnLayout()` 으로 만든다. 중첩 컬럼을 실제로 지원하는지 프로젝트의 기존 코드와 버전을 먼저 확인한다.

---

## 부록 A. 감싸기 안의 후처리 (선택)

필터 아이콘 문제와는 무관하다. 공통 컴포넌트에 같은 기능이 있고 **우리처럼 쓸 거면** 참고한다. 없으면 무시한다.

### A-1. `applyCellMerging()` — 셀 병합. 쓰면 감싸기에 넣는다

`:merge-mode="true"`(= `:mergeable="true"`) 화면에서 컬럼마다 같은 값끼리 셀을 합치는 `mergeRule` 을 붙인다.

```js
applyCellMerging() {
  if (!this.gridView || !this.resolvedMergeMode) return   // merge-mode 안 쓰는 화면은 바로 끝
  this.gridView.getColumns().forEach(col => {
    if (!col || !col.name || this.hasOwnMergeRule(col)) return  // 컬럼에 mergeRule 을 직접 적었으면 그대로
    this.gridView.setColumnProperty(col.name, 'mergeRule', 'value')
  })
}
```

`mergeRule` 도 `autoFilter` 처럼 컬럼 정의 안에 있어서 새 컬럼과 함께 사라진다. 그래서 `setColumns` 감싸기 안에서 매번 다시 부른다.

테스트 (`:merge-mode="true"` 화면에서 `setColumns` 로 컬럼 재설정):

| 상태 | 컬럼 `mergeRule` |
| --- | --- |
| 처음 | `"value"` |
| 감싸기에 `applyCellMerging()` 없음 | `undefined` — 병합이 풀림 |
| 감싸기에 `applyCellMerging()` 있음 | `"value"` 유지 |

### A-2. `syncColumnItems()` — 컬럼 표시/숨김 메뉴. 감싸기에 넣지 않는다

그리드의 현재 컬럼을 읽어 "컬럼 설정" 팝업 목록(`columnItems`)을 다시 만든다.

```js
syncColumnItems() {
  const cols = this.gridView.getColumns() || []
  this.columnItems = cols.map(c => ({
    name: c.name,
    header: (c.header && c.header.text) || c.name,
    visible: c.visible !== false
  }))
}
```

이 목록은 팝업 안에서만 쓰이고, 팝업을 열 때(`openColumnModal`) 매번 이 함수를 부른다. 컬럼을 바꿀 때마다 갱신할 필요가 없다.

테스트 (평면 → 교차표 전환, 감싸기에 `syncColumnItems()` 없음): 전환 직후 목록은 옛 상태였지만, 팝업을 열자 교차표 컬럼 24개가 정확히 나왔다.

> 목록을 팝업 밖(툴바 드롭다운 등)에서 항상 보여 주는 컴포넌트라면 사정이 다르다. 그때는 감싸기 안에 넣는다.
