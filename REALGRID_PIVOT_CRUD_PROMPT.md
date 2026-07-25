# RealGrid 2 공통 아키텍처 & 피벗 Studio 이식용 AI 마스터 프롬프트

> 본 마스터 프롬프트는 다른 프로젝트에서 기존에 구축되어 있는 RealGrid 2 프로젝트에 **기존 구현된 기능(행고정/열고정 등)을 단 1개도 파괴하지 않고(Non-Destructive Safe Preserving)**, **셀 자동 병합(`mergeRule`), 최하단 합계행(`Footer`), 피벗 대안 A(동적 행 그룹핑 & Soft Delete CRUD)** 및 **피벗 대안 B(동적 Cross-Tab Matrix 교차표)**를 안전하게 덧붙여 이식하기 위한 AI 에이전트 전용 마스터 프롬프트입니다.

---

## 📌 타 프로젝트 AI 에이전트 전달용 프롬프트 (복사하여 사용)

```markdown
# [AI 지시문] 기존 RealGrid 2 기능(행/열 고정 등) 안전 보존 및 셀병합, 합계행, 피벗 A/B 비파괴 이식

너는 최고 레벨의 Vue 3 & RealGrid 2 프론트엔드 아키텍트다.
다음 비파괴(Non-Destructive) 가드레일과 규격을 100% 준수하여, 타 프로젝트의 **기존 기능(행고정/열고정, 기존 우클릭 메뉴, 기존 디자인)을 단 1개도 훼손하지 않으면서** 신규 피벗/합계행/셀병합 로직을 안전하게 병합(Merge)해라.

---

## 🛡️ 1. 최우선 비파괴 보존 원칙 (CRITICAL SAFEGUARD DIRECTIVES)

1. **기존 행고정/열고정(`setFixedOptions`) 100% 보존**:
   - 타 프로젝트에 이미 행 고정이나 열 고정이 구현되어 있다면, 기존 고정 옵션을 절대 덮어쓰거나 초기화(`colCount: 0`)하지 마라.
   - 기존 `fixedOptions` 상태를 조회한 후 유지하거나, 상위 Prop으로 유연하게 받아 확장해라.

2. **기존 우클릭 메뉴(Context Menu) 안전 배열 병합**:
   - 기존 우클릭 메뉴가 존재할 경우 지우지 말고 `[...existingContextMenu, ...newPivotItems]` 형태로 기존 메뉴 뒤에 신규 메뉴를 안전하게 덧붙여라.

3. **기존 UI/디자인 100% 보존**:
   - 기존 화면의 HTML, CSS, 버튼 디자인, 레이아웃을 단 1px도 변경하거나 삭제하지 마라.

4. **변수명 동적 자동 탐색**:
   - 현재 파일 내에 기존 선언된 RealGrid 인스턴스 변수명(예: `gridView`, `gridInstance`, `grid` 및 `dataProvider`, `provider` 등)을 먼저 찾아 그 변수에 로직을 안전하게 연결해라.

---

## 🛠️ 2. 안전 이식 기능 명세 (Safe Feature Merging)

### ① 데이터 같은 것끼리 셀 병합 (`mergeRule`)
- 기존 컬럼 설정에 부서명(`dept`) 등 동일한 연속 데이터 출력 시 셀을 하나로 시각적 자동 병합 옵션을 안전하게 덧붙여라.
- **코드 규격**: 기존 컬럼 객체에 `mergeRule: { criteria: 'value' }` 옵션 추가

### ② 그리드 최하단 합계행/평균행 (`Footer`)
- 기존 그리드 하단에 숫자 데이터의 합계(`sum`), 평균(`avg`), 건수(`count`)를 표출해라.
- **코드 규격**:
  - 기존 옵션 유지 스위치: `gridView.setFooter({ visible: true })` (기존 footer 설정이 있으면 보존)
  - 수식: `footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }`

### ③ 마우스 우클릭 동적 행/열 고정 (기존 고정이 없을 경우만 옵션 제공)
- 기존 행/열 고정이 없을 경우에만 우클릭 컨텍스트 메뉴에 `📌 클릭한 열까지 고정`, `📌 클릭한 행까지 고정`, `❌ 고정 해제` 메뉴를 안전 병합해라.
- `clickData.column` 및 `clickData.itemIndex`를 통해 클릭한 위치를 자동 계산하여 `gridView.setFixedOptions({ ...existingOptions, colCount: colIdx + 1 })` 로 기존 설정을 포함하여 업데이트해라.

### ④ 피벗 대안 A: 동적 행 그룹핑 & CRUD (Pivot Alt A)
- **동적 그룹핑**: `grid.groupBy(['dept', 'role'])` 및 우클릭 컨텍스트 메뉴(Context Menu) 지원
- **사용자 맞춤 뷰 저장**: 현재 적용된 그룹핑 조합을 `localStorage`에 맞춤 뷰 칩(Chip)으로 저장/삭제
- **최상단 행 추가**: `insertRow(0, rowData)`로 최상단 0번 인덱스에 신규 데이터 삽입
- **Soft Delete**: `softDeleting: true`, `hideDeletedRows: false`로 선택 행 취소선/`-` 삭제 표식 표시
- **C/U/D 페이로드 추출**: `dataProvider.getStateRows()`를 통해 생성(C), 수정(U), 삭제(D) JSON 추출 및 `clearRowStates()`

### ⑤ 피벗 대안 B: 동적 Cross-Tab Matrix 교차표 (Pivot Alt B)
- **Raw -> Matrix 가공**: 원본 Flat 데이터를 사용자가 선택한 행 축(`rowField`), 열 축(`colField`), 집계 대상(`valField`), 수식(`sum/avg/count`)에 맞춰 가로/세로 매트릭스 데이터로 유틸 가공(`pivotUtil.js`)
- **동적 컬럼 재바인딩**: 가공된 결과를 `setFields()`, `setColumns()`, `setRows()`로 그리드에 딜레이 없이 실시간 바인딩
```
