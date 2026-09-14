# RealGrid 행 색상 단일색 가이드 (홀짝 줄무늬 끄기)

> 대상: RealGrid 2.x (`realgrid` npm, 2.10.0에서 확인) — GridView / TreeView 공통
> 목표: 흰색·회색이 번갈아 나오는 행 배경을 **한 가지 색**으로 통일

---

## 1. 결론 (이것만 하면 됨)

그리드를 만들고 **데이터를 넣기 전에** 아래 한 줄을 넣는다.

```js
gridView.setDisplayOptions({ useAlternateRowStyle: false })
// TreeView 도 동일
treeView.setDisplayOptions({ useAlternateRowStyle: false })
```

이미 행이 그려진 뒤에 옵션을 바꿨다면 다시 그려야 반영된다.

```js
gridView.setDisplayOptions({ useAlternateRowStyle: false })
gridView.refresh(true)
```

---

## 2. 왜 줄무늬가 생기나 (런타임 흐름)

1. RealGrid가 행(`<tr>`)을 그릴 때마다 클래스를 붙인다.
   - 짝수 번째: `rg-data-row`
   - 홀수 번째: `rg-data-row rg-alternate-row`  ← `displayOptions.useAlternateRowStyle`(기본값 **true**)일 때만
   - 왼쪽 No./체크 칸: `rg-row-bar` / `rg-row-bar rg-alternate-row-bar`
2. 함께 import 한 테마 CSS가 이 클래스에 배경색을 칠한다.

   | 테마 CSS | `.rg-alternate-row` 배경 |
   |---|---|
   | `realgrid-white.css` | `#f8f9fa` |
   | `realgrid-style.css`, `galaxy-blue`, `red-wine` | `#fafafa` |
   | `realgrid-sky-blue.css` | `#f7f7f7` |
   | `realgrid-dark.css` | `#333333` |
   | `realgrid-high-contrast.css` | `#2e2e2e` |

3. 그래서 **옵션을 false 로 하면 `rg-alternate-row` 클래스 자체가 안 붙고**, CSS가 칠할 대상이 없어져 단일색이 된다.
   (`rg-alternate-row-bar` 도 같이 빠진다. 기본 테마 CSS엔 이 클래스 규칙이 없어서 원래 No. 칸은 줄무늬가 없다.)

> 실제 확인 결과 (NexHubStudio `/grid-studio/js`, `/grid-studio/tree`)
> - 적용 전: `tr.rg-alternate-row` 14개(GridView) / 8개(TreeView), 홀수 행 배경 `rgb(248, 249, 250)`
> - `setDisplayOptions({ useAlternateRowStyle: false })` + `refresh(true)` 후: 둘 다 **0개**, 모든 행 배경 투명(단일색)

---

## 3. 적용 위치 예시

### 3-1. 순수 JS

```js
import { GridView, LocalDataProvider } from 'realgrid'
import 'realgrid/dist/realgrid-white.css'

const provider = new LocalDataProvider(false)
const gridView = new GridView('realgrid')
gridView.setDataSource(provider)

gridView.setDisplayOptions({
  useAlternateRowStyle: false,   // ← 홀짝 줄무늬 끄기
  // rowHeight 등 기존 displayOptions 가 있으면 같은 객체에 합쳐도 됨
})

provider.setFields(fields)
gridView.setColumns(columns)
provider.setRows(rows)            // 데이터는 옵션 설정 뒤에
```

### 3-2. Vue (`onMounted` / `@init` 등 그리드 생성 직후)

```js
onMounted(() => {
  gridView = new GridView(gridEl.value)
  gridView.setDataSource(provider)
  gridView.setDisplayOptions({ useAlternateRowStyle: false })
  // ...fields / columns / rows
})
```

### 3-3. 프로젝트 전체에 한 번에 적용하고 싶을 때

그리드 생성 공통 함수(예: `createGrid`, `initGrid`, 공통 컴포넌트의 init)가 있으면 **거기에 한 줄**만 넣는다.
페이지마다 넣으면 빠뜨리는 화면이 생긴다.

---

## 4. 대안: CSS로 덮기 (옵션을 못 건드릴 때만)

JS를 수정할 수 없는 경우에만 쓴다. **전역 CSS**에 넣는다.

```css
/* 홀수 행 배경을 짝수 행과 같게 */
.rg-root .rg-body .rg-alternate-row {
  background: none;
}
```

- 선택자를 기본 규칙(`.rg-alternate-row`)보다 **구체적으로** 써야 한다. 그래야 CSS 로드 순서와 상관없이 이긴다.
- 틀고정 영역(`.rg-fixed-body .rg-alternate-row`)은 기본 테마에서 이미 짝수·홀수가 같은 색(`#ededed`)이라 손댈 필요 없다.

---

## 5. 다크모드 — 색은 신경 쓸 필요 없다

1번·4번 방식은 **색을 지정하는 게 아니라 줄무늬만 없앤다.**
행은 원래 투명이라 뒤의 그리드 본문 색이 보이고, 그 색은 테마가 정한다.
그래서 라이트에선 흰색, 다크에선 어두운 색으로 **자동으로 따라간다.** 다크모드 동작은 줄무늬 끄기 전과 똑같다.

**하지 말 것: "단일색"을 "흰색으로 칠하기"로 구현**

```css
/* ❌ 다크모드에서 흰 배경에 흰 글자가 되어 내용이 안 보인다 */
.rg-data-row, .rg-alternate-row { background: #fff; }
.rg-data-cell { background-color: white !important; }
```

---

## 6. 다른 시도가 실패하는 흔한 원인 (하지 말 것)

| 시도 | 왜 안 되나 |
|---|---|
| `gridView.setStyles({ body: { ... } })` 로 행 색 지정 | RealGrid **1.x** API. 2.x 에선 에러 없이 **아무 일도 안 일어난다** |
| `alternateRow`, `rowAlternate`, `evenRowStyle`, `oddRowStyle` 같은 옵션명 추측 | 2.x 에 없는 이름. `setDisplayOptions` 가 조용히 무시한다. 정확한 이름은 **`useAlternateRowStyle`** (`main.d.ts` 의 `DisplayOptions`) |
| 데이터가 이미 보이는 상태에서 옵션만 바꾸고 새로고침 안 함 | 옵션 값은 바뀌지만 **이미 그려진 `<tr>` 클래스는 그대로**라 화면 변화가 없다 → "안 된다"고 오판. 생성 직후에 넣거나 `refresh(true)` 호출 |
| Vue `<style scoped>` 안에 `.rg-alternate-row { ... }` 작성 | scoped 는 `[data-v-xxxx]` 속성이 붙은 요소만 매칭하는데, RealGrid가 만든 DOM엔 그 속성이 없다. 전역 CSS 또는 `:deep(.rg-alternate-row)` 사용 |
| `.rg-data-cell`(td)에만 배경색 지정 | 줄무늬 색은 **`<tr>`** 에 칠해진다. td에 불투명 배경을 칠하면 가려지긴 하지만, hover·상태색 등 다른 규칙과 얽혀서 부작용이 난다. 원인(`tr` 클래스)을 끄는 게 맞다 |
| 전역 CSS에 `.rg-alternate-row { background: none }` (특정도 동일) | 컴포넌트에서 `realgrid-white.css` 를 import 하면 그 CSS가 **나중에** 로드되어 같은 특정도의 기본 규칙이 이긴다. 4번처럼 선택자를 더 구체적으로 |

---

## 7. 검증 방법

브라우저 개발자도구 콘솔에서:

```js
document.querySelectorAll('.rg-alternate-row').length
```

- `0` → 적용 성공 (1번 방식)
- `0` 보다 크면 → 옵션이 안 들어갔거나, 옵션 설정 이후 다시 그리지 않은 것. `gridView.displayOptions.useAlternateRowStyle` 값과 `refresh(true)` 호출 여부 확인

4번(CSS) 방식을 썼다면 클래스는 남아 있으니 배경색으로 확인:

```js
[...document.querySelectorAll('.rg-body .rg-data-row')].slice(0, 4)
  .map(tr => getComputedStyle(tr).backgroundColor)
// 네 값이 모두 같으면 성공
```

다크모드로 바꿨을 때 행이 흰색으로 남아 있으면, 누군가 흰색을 직접 칠한 것(5장의 "하지 말 것")이다.

---

## 8. 참고

- `rowStyleCallback` 으로 행에 `styleName` 을 돌려주는 행에는 RealGrid가 원래 `rg-alternate-row` 를 붙이지 않는다. 그래서 조건부 행 색은 이 설정과 충돌하지 않는다.
- 줄무늬를 **다시 켜고** 색만 바꾸고 싶다면 옵션은 기본값(true)으로 두고 전역 CSS에서 `.rg-root .rg-body .rg-alternate-row { background: 원하는색; }` 로 덮는다.
