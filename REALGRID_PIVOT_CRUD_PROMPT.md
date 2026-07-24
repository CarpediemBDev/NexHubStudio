# RealGrid 2 피벗/행그룹핑 & C.R.U.D 이식용 AI 마스터 프롬프트

> 본 마스터 프롬프트는 다른 프로젝트에서 기존에 구축된 RealGrid 2 그리드에 **동적 행 그룹핑(Pivot A), 마우스 우클릭 컨텍스트 메뉴, Soft Delete(- 표식) 및 C, U, D 페이로드 추출 저장 기능**을 기존 디자인 변경 없이 순수 자바스크립트 로직으로 100% 안전하게 이식하기 위한 AI 에이전트 전용 마스터 프롬프트입니다.

---

## 📌 타 프로젝트 AI 에이전트 전달용 프롬프트 (복사하여 사용)

```markdown
# [AI 지시문] 기존 RealGrid 2 화면에 동적 피벗/행그룹핑, 우클릭 메뉴 및 C/U/D 저장 로직 비파괴 이식

## 🚨 최우선 원칙 (CRITICAL DIRECTIVES)
1. **기존 UI/디자인 100% 보존**: 기존 화면의 HTML, CSS, 버튼 디자인, 레이아웃을 단 1px도 변경하거나 삭제하지 마세요.
2. **변수명 동적 탐색**: 현재 파일 내에 기존 선언된 RealGrid 인스턴스 변수명(예: `gridView`, `gridInstance`, `grid` 및 `dataProvider`, `provider` 등)을 먼저 찾아 그 변수에 로직을 연결하세요.
3. **피벗 로직만 쏙 추가**: 기존 그리드 기능은 그대로 유지하면서 아래 5가지 피벗/그룹핑 로직만 기존 초기화 함수 및 핸들러에 덧붙여 주세요.

---

## 1. 세부 이식 로직 명세

### ① 헤더 드래그 앤 드롭 행 그룹핑 및 소계(Subtotal) 설정
- 기존 그리드 인스턴스 생성 직후 아래 옵션 추가:
  - `gridView.setDisplayOptions({ columnMovable: true, fitStyle: 'evenFill' })`
  - `gridView.setGroupPanel({ visible: true })`
  - `gridView.setGroupingOptions({ enabled: true })`
  - `gridView.setSortingOptions({ enabled: true })`
  - `gridView.setRowGroup({ summaryMode: 'aggregate', mergeMode: true })` (소계 자동 집계 및 셀 병합)

### ② 마우스 우클릭 컨텍스트 메뉴 (Context Menu)
- `gridView.setContextMenu`를 이용하여 우클릭 메뉴 추가:
  - `📌 이 컬럼 기준으로 행 그룹화` (클릭한 컬럼 기반 `grid.groupBy([colName])`)
  - `❌ 그룹화 해제` (`grid.groupBy([])`)
  - `➕ 모든 그룹 펼치기` / `➖ 모든 그룹 접기` (`grid.expandGroup(null, true, true)` / `collapseGroup`)
- `gridView.onContextMenuItemClicked` 핸들러 등록

### ③ 최상단 행 추가 함수 (`addRow`)
- 기존 행추가 버튼/함수에 연동: `dataProvider.insertRow(0, { ... defaultValues ... })` 방식으로 최상단 0번 인덱스에 행 추가 및 `gridView.setCurrent({ itemIndex: 0 })` 커서 이동
- **안전 규칙 (방식 B)**: 현재 그룹핑이 적용된 상태(`gridView.getGroupFieldNames()?.length > 0`)일 때는 *"그룹핑(피벗) 상태에서는 원본 보기에서만 추가가 가능합니다"* 안내 후 조작 차단

### ④ Soft Delete 행 삭제 함수 (`deleteChecked`)
- `dataProvider.softDeleting = true` 및 `gridView.hideDeletedRows = false` 적용하여 삭제 행이 지워지지 않고 `-` (삭제 대기) 표식으로 시각화되도록 설정
- 기존 행삭제 버튼/함수에 연동: `dataProvider.removeRows(checkedRows)` 및 `gridView.checkAll(false)` 처리
- 그룹핑 적용 중일 때는 추가와 마찬가지로 안전 차단

### ⑤ C, U, D 페이로드 추출 저장 함수 (`saveData`)
- 기존 저장 버튼/함수 상단에 `gridView.commit()` 수행 후 RealGrid 내장 메서드로 C, U, D 데이터 추출:
  - `created`: `dataProvider.getStateRows('created').map(i => dataProvider.getJsonRow(i))`
  - `updated`: `dataProvider.getStateRows('updated').map(i => dataProvider.getJsonRow(i))`
  - `deleted`: `dataProvider.getStateRows('deleted').map(i => dataProvider.getJsonRow(i))`
- 추출된 `{ created, updated, deleted }` 페이로드를 기존 백엔드 저장 API로 전달
- 저장 성공 후 `dataProvider.clearRowStates()` 호출하여 상태 클리어

### ⑥ Vue 3 반응성 프록시 이슈 방지 (Vue 3 프로젝트 환경인 경우)
- `LocalDataProvider` 및 `GridView` 인스턴스는 Vue `data()`의 반응형 객체로 등록하지 말고, `markRaw(...)` 또는 non-reactive 멤버로 관리하세요.

---

위 로직을 기존 코드에 비파괴(Non-destructive) 방식으로 정확하게 덧붙여 주세요.
```
