# 배정 목록 X(원복) 구현 가이드 — 되돌리기가 깨지는 이유와 안 깨지는 구조

우측 배정 목록에서 **X를 눌러 항목을 빼면, 좌측 그리드/트리로 정확히 그 하나만 되돌아와야 한다.**
말은 한 줄인데 다른 프로젝트로 옮기면 두 가지 버그가 거의 반드시 나옵니다.

- **증상 A** — X를 눌렀는데 좌측에 다시 안 나타난다. (우측에서만 사라지고 사라진 채로 끝)
- **증상 B** — 하나만 지웠는데 우측 목록이 통째로 비거나, 엉뚱한 항목까지 같이 사라진다.

이 문서는 이 프로젝트에서 동작하는 두 구현을 기준으로, **왜 그 버그가 나는지와 어떻게 구조로 막는지**를 정리합니다.
AI에게 이식을 시킬 때는 8장의 규칙 블록을 그대로 붙여 주면 됩니다.

- 원본 ①(트리, 권장 구조): `src/pages/RealGridTreeToDivPage.vue` (`/grid-studio/tree-to-div`)
- 원본 ②(평면 그리드, provider 직접 조작): `src/pages/RealGridToDivGuidePage.vue` (`/grid-studio/grid-to-div`)
- 배정(드래그·체크) 쪽 이식은 [realtree-배정-이식가이드.md](./realtree-배정-이식가이드.md) 참고. 이 문서는 **되돌리기**만 다룹니다.
- 같은 내용의 **HTML 판**: [realtree-배정-원복-가이드.html](./realtree-배정-원복-가이드.html) (브라우저로 바로 열림. Artifact 게시용 소스이기도 하므로 doctype/html/head/body 는 없다)

---

## 1. 한 줄 규칙

> **우측 배정 목록이 원본(source of truth)이고, 좌측은 그 결과로 파생되는 화면이다.**

되돌리기가 깨지는 구현은 예외 없이 이 관계가 뒤집혀 있거나, 좌우가 **각자** 자기 데이터를 들고 서로를 모릅니다.
그러면 "우측에서 빼기"와 "좌측에 다시 넣기"가 두 개의 별개 작업이 되고, 둘 중 하나만 성공하는 순간 증상 A가 납니다.

좌측을 파생으로 두면 되돌리기 코드는 **한 줄(배열에서 빼기)** 로 끝나고, 좌측은 저절로 복구됩니다.

---

## 2. 권장 구조 — 좌측을 computed 로 파생 (트리·그리드 공통)

`RealGridTreeToDivPage.vue` 가 쓰는 방식입니다. 상태는 두 개뿐입니다.

```js
data() {
  return {
    catalog: [],             // 전체 원본(평면). 이 배열은 배정/원복으로 절대 변하지 않는다
    assignedCategories: []   // 우측으로 옮긴 것들 (여기서는 부모 이름, 모델 단위면 modelId 배열)
  }
},
computed: {
  assignedSet() {
    return new Set(this.assignedCategories)
  },
  // 좌측 = 전체 - 배정됨. 파생이므로 '되돌리는 코드'가 따로 없다
  poolCategories() {
    return CATEGORY_DEFS.filter(cat => !this.assignedSet.has(cat.name) && this.modelsByCategory.get(cat.name).length)
  },
  // 트리 rows 는 매번 통째로 다시 만든다
  treeRows() {
    return this.poolCategories.map(cat => ({ nodeType: 'category', category: cat.name, /* ... */ }))
  }
}
```

되돌리기는 이게 전부입니다.

```js
returnCategory(name) {
  const idx = this.assignedCategories.indexOf(name)
  if (idx < 0) return
  this.assignedCategories.splice(idx, 1)   // ← 두 번째 인자 1 (5-B 참고)

  if (this.openedCategory === name) this.openedCategory = null  // 열려 있던 팝업 닫기
  this.syncRepresentatives()   // 그룹별 대표 모델 승계
  this.syncRepCategory()       // 대표 그룹(우측 라디오) 승계
  this.resetCheckState()       // 트리가 다시 그려지면 체크는 사라진다 → 카운트/블록 기억도 초기화
}
```

`RealGridTreeJs` 는 `rows` prop 을 deep watch 해서 `setTreeRows()` 를 다시 부르므로, `treeRows` 가 바뀌면 좌측이 알아서 복구됩니다.
**RealGrid 노드를 직접 지우고 붙이지 않는 것**이 핵심입니다. 트리에서 그렇게 하면 부모가 빈 채로 남거나 `dataRow` 인덱스가 어긋나는데, 통째로 다시 만들면 그 경우의 수가 아예 없습니다.

> 성능이 걱정되면: 이 방식은 배정/원복이 일어날 때만 재구성됩니다. 수천 행에서도 사람이 클릭하는 빈도로는 문제가 되지 않습니다. 먼저 이 구조로 맞추고, 정말 느릴 때만 부분 갱신을 고민하세요.

---

## 3. 대안 구조 — provider 를 직접 조작 (평면 그리드에서만)

`RealGridToDivGuidePage.vue` 방식입니다. 계층이 없는 평면 그리드라면 이것도 안전합니다.

```js
// 배정: 우측 배열에 넣고, 좌측 provider 에서 뺀다
this.groupModels.push(...items)
this.dataProvider.removeRows(dataRows)      // 좌측에서 제거

// 원복: 우측 배열에서 빼고, 좌측 provider 에 되돌린다
returnToGrid(modelId) {
  const idx = this.groupModels.findIndex(m => m.modelId === modelId)
  if (idx < 0) return
  const item = this.groupModels.splice(idx, 1)[0]   // ← 뺀 '그 객체'를 그대로 되돌린다
  if (!item) return

  if (this.repModelId === item.modelId) {           // 대표였으면 승계
    this.repModelId = this.groupModels.length > 0 ? this.groupModels[0].modelId : null
  }

  this.dataProvider.addRow(item)                    // ← 이 한 줄을 빼먹는 게 증상 A의 1순위 원인
  this.syncPoolCount()
  this.syncCheckedCount()
}
```

지켜야 할 것:

| 규칙 | 이유 |
|---|---|
| 우측 배열에서 **뺀 객체를 그대로** `addRow` 한다 | 다시 만들면 필드가 빠지거나 타입이 달라져 좌측에서 빈 행처럼 보인다 |
| `addRow` 후 카운트류를 다시 계산한다 | provider 를 직접 만지면 화면 숫자는 자동으로 안 따라온다 |
| **트리에는 쓰지 않는다** | 되돌린 행을 어느 부모 밑에 넣을지 매번 계산해야 하고, 부모가 이미 지워졌으면 붙을 곳이 없다 → 증상 A |

---

## 4. X 버튼의 이벤트 계약

카드 전체가 클릭 대상(팝업 열기, 대표 선택 등)인 경우가 많습니다. X는 **반드시 전파를 끊어야** 합니다.

```html
<!-- 카드 전체 = 팝업 열기 -->
<div class="div-dropped-item" role="button" tabindex="0" @click="openCategoryPopup(group.category)">
  <!-- 라디오도 카드 클릭으로 번지면 안 된다 -->
  <input type="radio" class="rep-radio" @click.stop @change="setRepCategory(group.category)" />

  <span class="item-main">...</span>

  <!-- X: 카드 클릭(팝업)까지 발동하면 '지웠는데 팝업이 뜨는' 이상한 동작이 된다 -->
  <button class="btn-return-grid" title="트리로 되돌리기" @click.stop="returnCategory(group.category)">
    <i class="bi bi-x-lg"></i>
  </button>
</div>
```

- 카드가 `<label>` 인 구조(grid-to-div)라면 `@click.prevent.stop` 을 씁니다. `prevent` 가 없으면 라벨 클릭이 내부 라디오를 토글합니다.
- 드래그로 카드 위에 드롭한 직후의 click 도 막아야 합니다. `finishDrag` 에서 한 틱만 `_suppressCardClick` 을 세워 두면 됩니다.

---

## 5. 버그 도감 — 증상에서 원인 찾기

### 5-A. "X를 눌렀는데 좌측에 안 돌아온다" (증상 A)

| # | 원인 | 확인법 | 고침 |
|---|---|---|---|
| 1 | provider 조작 방식인데 `addRow` 를 안 부름 | 우측 배열 길이만 줄어드는지 콘솔로 확인 | 2장 구조로 바꾸거나 `addRow` 추가 |
| 2 | 좌측 rows 를 **한 번만** 만들고 그 뒤로는 안 건드림 | `treeRows`(또는 rows) 가 computed 가 아니라 `data` 인지 본다 | 좌측을 상태에서 파생시킨다 |
| 3 | rows 배열을 **제자리 수정**만 함 (`push`/`splice`) 인데 watch 가 얕음 | 컴포넌트의 `watch: { rows: { deep: true } }` 여부 | 새 배열로 교체하거나 deep watch |
| 4 | 트리에서 자식만 `removeRow` 해 부모가 사라짐 → 되돌릴 부모가 없음 | 마지막 자식을 옮긴 뒤 부모 행이 남아 있는지 | 트리는 3장 방식 금지, 2장으로 |
| 5 | 배정할 때 원본(catalog)에서 아예 제거함 | `catalog.splice(...)` 같은 코드가 있는지 | 원본은 불변. '배정됨' 목록만 따로 관리 |

### 5-B. "하나 지웠는데 우측이 다 사라진다" (증상 B)

| # | 원인 | 잘못된 코드 | 고침 |
|---|---|---|---|
| 1 | `splice` 두 번째 인자 누락 — 뒤가 전부 잘린다 | `arr.splice(idx)` | `arr.splice(idx, 1)` |
| 2 | `v-for` 의 `:key` 를 인덱스로 줌 | `:key="i"` | `:key="item.modelId"` 처럼 **안정적인 식별자** |
| 3 | 삭제 조건이 그룹/분류 기준 | `filter(m => m.category !== item.category)` | `filter(m => m.modelId !== id)` |
| 4 | 같은 객체 참조를 여러 곳이 공유 | 좌·우가 같은 배열 인스턴스를 씀 | 목록은 항상 새 배열로 만들어 넘긴다 |
| 5 | 삭제 후 목록을 다시 만들면서 조건이 뒤집힘 | `filter(m => assignedSet.has(m.id))` 를 좌우 양쪽에 그대로 씀 | 좌측은 `!has`, 우측은 `has`. 한 곳에서만 정의 |

### 5-C. 되돌린 뒤에 남는 잔여물

| 증상 | 원인 | 고침 |
|---|---|---|
| 대표(라디오)가 아무 데도 안 켜져 있음 | 지운 항목이 대표였는데 승계를 안 함 | `syncRepresentatives()` / `syncRepCategory()` 처럼 **"없으면 남은 첫 번째"** 규칙을 한 함수에 모은다 |
| 상단 체크 카운트가 그대로 | 트리를 다시 그리면 RealGrid 체크는 사라지는데 페이지 카운트는 그대로 | `resetCheckState()` 로 카운트·블록 기억을 함께 초기화 |
| 지운 항목의 팝업이 열린 채 남음 | 팝업 대상이 사라졌는데 상태만 남음 | `if (this.openedCategory === name) this.openedCategory = null` |
| 콘솔에 `not exists column ...` | 저장된 그리드 레이아웃이 사라진 컬럼을 참조 | 컬럼 구성을 바꿨으면 `grid-id` 를 `...-v2` 로 올린다 |

---

## 6. 부모(그룹) 단위로 옮길 때의 추가 규칙

자식은 숨기고 부모만 옮기는 화면(`tree-to-div`)에서는, **자식을 복사해 들고 다니지 않습니다.**

```js
// 우측에는 부모 이름만 쌓는다. 자식은 소속(category)으로 언제든 다시 묶인다
assignedCategories: ['센서/전자', ...]

assignedGroups() {
  return this.assignedCategories.map(name => ({
    category: name,
    models: this.modelsByCategory.get(name) || []   // ← 파생
  }))
}
```

이렇게 하면 되돌리기가 이름 하나 빼는 일이 되고, 모델이 추가돼도 자식 수가 저절로 맞습니다.
자식 배열을 우측에 복사해 두면 원복 시 "부모는 돌아왔는데 자식은 옛날 것" 같은 어긋남이 생깁니다.

---

## 7. 이식 후 5분 점검 시나리오

순서대로 해 보고 하나라도 어긋나면 5장 표에서 원인을 찾습니다.

1. 3개를 우측으로 옮긴다 → 좌측에서 정확히 3개가 사라진다.
2. 가운데 것 X → **그것만** 좌측 원래 자리(정렬/부모 밑)에 돌아오고, 우측에는 2개가 남는다.
3. 남은 2개 중 대표였던 것 X → 라디오가 남은 항목으로 옮겨 붙는다.
4. 마지막 하나 X → 우측이 빈 안내 문구로 돌아가고, 좌측은 처음 상태와 같다(개수·순서 모두).
5. X를 눌렀을 때 카드 클릭(팝업/선택)이 같이 발동하지 않는다.
6. 되돌린 항목을 다시 옮긴다 → 중복 없이 한 번만 들어간다.
7. [전체 초기화] → 좌측이 초기 상태와 완전히 동일하다.

---

## 8. AI에게 그대로 주는 규칙 블록

```text
배정 목록의 X(되돌리기)를 구현할 때 지킬 것:

1. 우측 배정 목록만 상태로 들고, 좌측 목록/트리 rows 는 "전체 - 배정됨" computed 로 파생시켜라.
   좌측 rows 를 직접 지우거나 넣지 마라. 특히 트리(RealGrid TreeView)에서는 절대 금지.
2. 되돌리기는 "배정 배열에서 그 항목 하나 빼기"로 끝나야 한다.
   arr.splice(idx, 1) — 두 번째 인자 1 을 반드시 쓴다.
3. v-for 의 :key 는 인덱스가 아니라 항목의 고유 id 로 한다.
4. 삭제 조건은 항상 고유 id 비교다. 분류/그룹/이름 기준으로 filter 하지 마라.
5. 원본 전체 목록(catalog)은 배정/원복으로 변경하지 않는다.
6. 지운 항목이 대표(라디오)였다면 남은 첫 항목으로 승계하고, 목록이 비면 대표를 null 로 만든다.
   이 규칙은 배정·원복·초기화가 모두 같은 함수를 부르게 한 곳에 모은다.
7. X 버튼은 @click.stop (label 안이면 @click.prevent.stop) 으로 카드 클릭과 분리한다.
8. 되돌린 뒤 체크 카운트·블록 기억·열린 팝업 상태를 함께 정리한다.
9. 컬럼 구성을 바꿨다면 저장된 레이아웃 충돌을 피하려 grid-id 를 올린다.

검증: 3개 배정 → 가운데 X → 좌측에 그것만 복귀, 우측 2개 유지 → 대표 X → 라디오 승계
→ 마지막 X → 양쪽 모두 초기 상태. 이 시나리오가 통과해야 완료다.
```
