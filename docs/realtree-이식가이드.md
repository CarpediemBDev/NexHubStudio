# RealTree(RealGridTreeJs) 이식 가이드

이 프로젝트(NexHubStudio)에서 구현한 **계층형 트리 그리드 컴포넌트**를, 이미 RealGrid/피벗이 적용된 **다른 프로젝트로 무손상 이식**하기 위한 문서입니다.

---

## 0. 핵심 원칙 (먼저 읽기)

1. **`RealGridTreeJs.vue`는 자기완결(standalone)입니다.**
   외부 import가 `realgrid` + `vue`뿐입니다. 프로젝트 전용 모듈(mixin / store / util)을 **일절 참조하지 않습니다.**
   → **파일 1개만 복사**하면 동작합니다.

2. **기존 프로젝트를 수정하지 않습니다 (Add-only).**
   대상 프로젝트에 이미 잘 구현된 RealGrid/피벗 A는 **손대지 않고**, 트리는 **새 파일/새 페이지로만 추가**합니다.

3. **prop 이름을 대상 프로젝트 그리드와 맞출 필요가 없습니다.**
   트리는 자체 prop 계약을 가진 **독립 컴포넌트**입니다. 대상 프로젝트의 그리드 prop명이 달라도 무관합니다.
   → 트리를 쓸 때는 **아래 6장의 prop명을 그대로** 사용하세요. (변환/매핑 불필요)

---

## 1. 이식 대상 파일

| 파일 | 필수 | 설명 |
|---|---|---|
| `src/components/RealGridTreeJs.vue` | ✅ 필수 | 트리 컴포넌트 본체 (자기완결, 이 1개만 있으면 동작) |
| 사용 예제 페이지 | 선택 | 아래 7장 예제를 대상 프로젝트 라우팅에 맞게 새 페이지로 추가 |
| 트리 샘플 데이터 | 선택 | 데모용. 실제로는 대상 프로젝트 데이터를 `:rows`로 주입 |

> 충돌 방지: 대상 프로젝트에 이미 `RealGridTreeJs.vue`가 **있다면** 덮어쓰지 말고 새 경로(예: `src/components/realtree/RealTreeStandalone.vue`)에 고유 이름으로 두고 그 경로로 import 하세요.

---

## 2. 외부 의존성 (딱 3가지만 확인)

| 의존 | 상태 | 조치 |
|---|---|---|
| `realgrid` (npm) + `realgrid/dist/realgrid-white.css` | 대상 프로젝트에 RealGrid가 있으니 **이미 설치됨** | 없으면 `npm i realgrid` |
| **테마** | 컴포넌트가 `<html data-theme>` 속성을 자동 감지 (MutationObserver) | 대상이 `data-theme`를 쓰면 자동 연동. 아니면 `:theme="'light'|'dark'|'dark-navy'"` prop으로 주입. 아무것도 안 주면 `'light'` |
| **토스트** | `toast` 함수 prop 주입 (없으면 `notify` 이벤트 emit + console 폴백) | 대상 프로젝트 토스트를 `:toast="fn"`으로 연결. 안 해도 오류 없음 |

**Pinia / tabStore / toastUtil 등은 필요 없습니다.** (이식 시 흔한 충돌 원인이 여기서 원천 제거됨)

---

## 3. 신규/강화 기능 하이라이트 (이 트리가 가져오는 것)

- **변경 델타 추출** `getChanges()` → `{ created, updated, deleted, moved }`
  - 특히 **`moved`**: 드래그로 부모/순서가 바뀐 노드를 추적 (RealGrid는 이동을 행 상태로 안 남기므로 이벤트로 누적). 각 항목 = `{ row, parentRow, index, dataRow, parentDataRow }`. 서버 차분 저장에 사용.
- **우클릭 컨텍스트 메뉴** (`useFixContextMenu`, 기본 ON): 행/열 고정 + 하위/형제 노드 추가 + 노드 복제 + 전체 펼침/접기.
- **헤더 컬럼 필터** (`useColumnFilter`, 기본 ON): 컬럼별 `autoFilter`로 distinct 값 체크리스트, 트리는 **매칭 노드의 조상 경로 유지**(`includeParentItem`).
- **드래그 앤 드롭 노드 이동**(부모 변경/형제 순서), 소프트 삭제(취소선), 다크테마 제어열 연동.

---

## 4. 이식 절차 (요약)

1. `RealGridTreeJs.vue`를 대상 프로젝트 `src/components/`(또는 고유 폴더)에 복사.
2. `realgrid` 설치 확인.
3. 새 페이지 1개 생성 → `<RealGridTreeJs>` 사용 (7장 예제 참고), `:toast`로 토스트 연결.
4. 라우팅/메뉴에 **새 항목 1개만 추가** (기존 라우트 구조 변경 금지).
5. 검증(9장).

---

## 5. 컴포넌트 API — Props

| prop | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `fields` | Array | `[]` | RealGrid 필드 정의 |
| `columns` | Array | `[]` | RealGrid 컬럼 정의 |
| `rows` | Array | `[]` | **중첩(children) 트리 데이터** |
| `height` | String | `'580px'` | 그리드 높이 |
| `childrenField` | String | `'children'` | 자식 배열 속성명 |
| `iconField` | String | `''` | 노드 아이콘 경로 필드(선택) |
| `treeLineVisible` | Boolean | `true` | 계층 라인 표시 |
| `expandAllOnLoad` | Boolean | `true` | 로드 시 전체 펼침 |
| `enableDragAndDrop` | Boolean | `true` | 드래그 노드 이동 |
| `editable` | Boolean | `true` | 셀 편집/행 추가 |
| `softDeleting` | Boolean | `true` | 소프트 삭제(삭제표시) |
| `hideDeletedRows` | Boolean | `true` | 삭제표시 행 숨김(false=취소선) |
| `useStateBar` | Boolean | `true` | 행 상태 컬러 바 |
| `useCheckBar` | Boolean | `true` | 좌측 체크박스 열 |
| `useIndicator` | Boolean | `true` | 행번호 인디케이터 열 |
| `checkBarExclusive` | Boolean | `false` | 체크박스 단일선택 |
| `checkBarWidth` | Number | `36` | 체크박스 열 너비 |
| `stateBarWidth` | Number | `6` | 상태 바 너비 |
| `useFixContextMenu` | Boolean | `true` | 우클릭 컨텍스트 메뉴 |
| `useColumnFilter` | Boolean | `true` | 헤더 컬럼 필터(자동 값목록) |
| `theme` | String | `''` | `''`이면 `<html data-theme>` 자동 감지 |
| `toast` | Function | `null` | `(message, {type})` 알림 콜백 |

## 5-1. Events

| 이벤트 | payload | 설명 |
|---|---|---|
| `@init` | `{ gridView, dataProvider }` | 초기화 완료. 여기서 추가 커스터마이징 가능 |
| `@notify` | `{ message, type }` | `toast` prop 미주입 시 내부 알림이 이벤트로 나옴 |
| `@node-moved` | `{ row, offset, itemIndex }` | 형제 순서 이동 |
| `@parent-changed` | `{ row, parent, index, itemIndex }` | 부모 변경 |

## 5-2. Ref 메서드 (`this.$refs.tree.메서드()`)

- **데이터/저장**: `getChanges()` → `{created,updated,deleted,moved}`, `clearRowStates()`, `commit()`, `setFields()`, `setColumns()`, `setTreeRows(rows)`
- **검색/내보내기/컬럼**: `searchGrid(query, dir)`, `exportToExcel(fileName?)`, `getColumnsInfo()`, `setColumnVisible(name, visible)`
- **펼치기**: `expandAll()`, `collapseAll()`, `expand(itemIndex)`, `expandLevel(level)`
- **노드 CRUD**: `addChildToCurrent(values, {editColumn})`, `addRootRow(values)`, `addSiblingToCurrent(values, {editColumn})`, `duplicateCurrentNode()`, `removeCurrent(recursive)`, `deleteChecked()`
- **이동/조회**: `moveCurrentUp()`, `moveCurrentDown()`, `changeNodeParent(row, parent, index)`, `getCurrentNode()`, `getCurrentDataRow()`, `getParent(itemIndex)`, `getChildren(itemIndex)`
- **행/열 고정**: `setFixedOptions({colCount,rowCount})`, `handleDynamicFixing(item, clickData)`

---

## 6. prop 이름 이슈 (대상 프로젝트와의 차이) — 결론

대상 프로젝트의 RealGrid/피벗이 **다른 prop명**을 써도 **아무 문제 없습니다.**
- 트리는 **독립 컴포넌트**라 자기 prop만 봅니다.
- 트리를 인스턴스화할 때는 **위 5장 표의 prop명 그대로** 넘기면 됩니다. (대상 그리드 prop명으로 변환·통일할 필요 없음)
- 예: 대상 그리드가 `showCheckbox`를 쓰더라도, 트리는 그냥 `:useCheckBar="false"`처럼 **트리 표준 prop**을 사용합니다.

---

## 7. 최소 사용 예제 (대상 프로젝트 새 페이지)

```vue
<template>
  <div>
    <button @click="save">저장</button>
    <RealGridTreeJs
      ref="tree"
      :fields="fields"
      :columns="columns"
      :rows="rows"
      childrenField="children"
      :toast="toastFn"
      @node-moved="onMoved"
      @parent-changed="onMoved"
    />
  </div>
</template>

<script>
import RealGridTreeJs from '@/components/RealGridTreeJs.vue' // 복사한 경로에 맞게
// 대상 프로젝트의 토스트 유틸이 있으면 연결 (없으면 이 줄과 :toast 제거 → console 폴백)
import { showToast } from '@/utils/toast' // ← 대상 프로젝트 경로

export default {
  components: { RealGridTreeJs },
  data() {
    return {
      fields: [
        { fieldName: 'deptCode', dataType: 'text' },
        { fieldName: 'deptName', dataType: 'text' },
        { fieldName: 'manager',  dataType: 'text' },
      ],
      columns: [
        { name: 'deptName', fieldName: 'deptName', width: 260, header: { text: '조직명' } },
        { name: 'deptCode', fieldName: 'deptCode', width: 120, header: { text: '코드' } },
        { name: 'manager',  fieldName: 'manager',  width: 100, header: { text: '책임자' } },
      ],
      rows: [
        { deptCode: '1000', deptName: '본사', manager: '홍길동', children: [
          { deptCode: '1100', deptName: '인사팀', manager: '김철수' },
          { deptCode: '1200', deptName: '총무팀', manager: '이영희' },
        ]},
      ],
    }
  },
  methods: {
    toastFn(message, opts = {}) { showToast(message, opts) }, // 대상 토스트 시그니처에 맞춰 조정
    onMoved() { /* 이동 알림 등 */ },
    save() {
      this.$refs.tree.commit()
      const c = this.$refs.tree.getChanges() // { created, updated, deleted, moved }
      console.log('서버 차분 전송:', c)
      // c.moved = [{ row, parentRow, index, ... }] → 서버 API로 신규/수정/삭제/이동만 전송
      this.$refs.tree.clearRowStates()
    },
  },
}
</script>
```

---

## 8. 다른 프로젝트 AI에게 줄 이식 프롬프트 (복붙용)

> **목표:** 첨부한 자기완결 트리 컴포넌트 `RealGridTreeJs.vue`를 이 프로젝트에 **추가만** 해줘. 이미 잘 구현된 **RealGrid/피벗 A 등 기존 파일은 절대 수정하지 마.**
>
> **제약 (엄수):**
> 1. `src/components/`(또는 새 폴더 `src/components/realtree/`)에 첨부 파일을 **새로 추가**. 대상 프로젝트에 동명 파일이 **이미 있으면 덮어쓰지 말고** 고유 이름(`RealTreeStandalone.vue`)으로 넣고 그 경로로 import.
> 2. 이 컴포넌트는 자기완결이야. import는 `realgrid` + `vue`뿐 → **기존 mixin/store/util에 연결하거나 병합하지 마.**
> 3. **prop명을 이 프로젝트 기존 그리드 컨벤션에 맞추지 마.** 트리는 독립 컴포넌트이고, 첨부 문서 5장의 prop명을 그대로 사용해.
> 4. 트리를 보여줄 **새 페이지 1개 + 새 라우트/메뉴 1개만** 추가. 기존 라우트/레이아웃/메뉴 구조는 변경 금지.
> 5. `package.json`은 `realgrid` 존재 여부만 확인(없을 때만 설치 안내). 버전 임의 변경 금지.
>
> **의존성 조정:**
> - **테마**: 컴포넌트가 `<html data-theme>`를 자동 감지해. 이 프로젝트가 `data-theme`를 안 쓰면 `:theme` prop으로 현재 테마를 주입하거나 그대로 두면 light로 동작(무해).
> - **토스트**: 이 프로젝트에 토스트 유틸이 있으면 새 페이지에서 `:toast="(msg,opts)=>표준토스트(msg,opts)"`로 연결. 없으면 `@notify`로 받거나 생략(console 폴백). **컴포넌트 내부는 수정하지 마.**
>
> **검증(끝나고 보고):**
> - `npm run build` 통과.
> - **기존 페이지·라우트(RealGrid/피벗 A 포함)가 그대로 동작**(트리 추가가 아무것도 안 깨뜨림) 확인.
> - 새 트리 페이지에서: 렌더 · 우클릭 컨텍스트 메뉴 · 헤더 컬럼 필터 · 드래그 노드 이동 후 `getChanges().moved`에 이동이 잡히는지 확인.
>
> **첨부:** [여기에 RealGridTreeJs.vue 전체 소스 붙여넣기]

---

## 9. 이식 후 검증 체크리스트

- [ ] `npm run build` 성공
- [ ] 기존 RealGrid/피벗 A 페이지 정상 (콘솔 에러 0)
- [ ] 트리 렌더 + 데이터 표시
- [ ] 우클릭 메뉴(고정/노드추가/복제/펼침) 동작
- [ ] 컬럼 헤더 필터 아이콘 → 값 체크리스트 → 비매칭 숨김(조상 유지)
- [ ] 드래그로 노드 이동 → `getChanges().moved` 에 반영 → 저장 시 차분 전송
- [ ] 다크테마 토글 시 제어열 색 반응(또는 `:theme` 주입)

---

### 요약
- **복사할 파일**: `RealGridTreeJs.vue` 1개
- **조정할 것**: `realgrid` 설치 확인 + 토스트(`:toast`) + 테마(`data-theme`/`:theme`)
- **건드리지 말 것**: 대상 프로젝트의 기존 그리드/피벗/라우트
- **prop명**: 대상과 통일 불필요, 트리 표준 prop 그대로 사용
