# RealGrid 긴 셀 줄바꿈 + N줄 말줄임 + 더보기 가이드

> 대상: RealGrid 2.x (`realgrid` npm, **2.10.0에서 확인**) — GridView
> 목표: 내용이 긴 셀을 `...` 한 줄로 자르고 툴팁으로 보여 주는 대신 **셀 안에서 줄바꿈해서 보여 준다.**
> 필요하면 **N줄(예: 5줄)을 넘는 셀만** N줄째 끝에 `...`을 붙이고 아래에 **"더보기"** 를 단다.
> 누르면 **그 셀만** 그 자리에서 전체 내용으로 펼쳐지고 "접기"로 바뀐다.
> 실제 적용: NexHubStudio `/regulation/info` (규제 정보 목록)

이 문서는 두 가지 방식을 다룬다. 요구사항에 맞는 쪽을 고른다.

| 방식 | 모습 | 난이도 | 장 |
|---|---|---|---|
| **A. 너비를 넘으면 개행만** | 긴 셀이 몇 줄이든 전부 보인다. 행이 그만큼 높아진다 | CSS 한 규칙 + 옵션 1개 | **3장** |
| **B. 개행 + N줄 말줄임 + 더보기** | N줄까지만 보이고 `...` + "더보기". 누르면 그 셀만 펼침 | 함수 하나 복사 + 옵션 + CSS | **4장** |

---

## 0. AI 에게 시킬 때 (적용 순서 요약)

### A. 개행만 (3장)

1. 그리드 옵션에 `rowHeight: -1` (행 높이 = 내용에 맞춤).
2. 줄바꿈할 컬럼에 `styleName: 'wrap-col'`.
3. CSS `.rg-data-cell.wrap-col { white-space: pre-wrap; word-break: keep-all; overflow-wrap: anywhere; text-align: left; }`
4. **그리드 전체 높이(`height`)를 직접 준다.** `rowHeight: -1` 이면 "행 N개에 맞춰 틀 줄이기"가 꺼진다(Q4).

### B. 5줄 + ... + 더보기 (4장)

1. **6-1 `setupWrapMore` 함수를 그대로 파일 하나로 추가한다** (RealGrid 외 의존성 없음).
2. **그리드 옵션 3개**: `rowHeight: -1`, `minRowHeight: 40`, `refCalcHeights: false`.
3. **그리드 전체 높이**: 내용이 많은 그리드는 `max(700px, calc(100vh - 400px))` (Q4). 400 은 그리드 위 영역 높이에 맞춰 조정.
4. `setupWrapMore(gridView, { rowKey, clampLines: 5 })`.
5. **줄바꿈할 컬럼에만** `renderer: wm.renderer` (기존 `renderer`·`styleName` 줄바꿈 설정은 뺀다).
6. **CSS** (6-3). Vue `scoped` 면 `:deep()` 으로 감싼다.
7. 셀에 `"한국 외 3"` 같은 **요약을 넘기고 있었다면 전체 값**을 넘긴다.
8. 그리드를 없앨 때 `wm.destroy()`.
9. 8장 검증 스크립트로 확인한다.

바꿀 수 있는 값: `clampLines`(몇 줄에서 자를지), `rowKey`(행 PK 필드명), `cellPadX`(셀 좌우 여백).

---

## 1. 완성 모습 (방식 B, 5줄)

```
┌────────┬──────────────────────────────┬──────────────────────────────┐
│ 상태   │ 규제명                        │ 정보관리항목                   │
├────────┼──────────────────────────────┼──────────────────────────────┤
│ 시행중 │ KC 안전확인 (전기용품 및 생활 │ 전파법(방송통신기자재 적합성)  │   ← 5줄 이하: 그대로, 링크 없음
│        │ 용품 안전관리법)              │  └ KN 32 (전자파 방사 기준)    │
├────────┼──────────────────────────────┼──────────────────────────────┤
│ 시행중 │ 방송통신기자재 적합성평가     │ 전파법(방송통신기자재 적합성)  │
│        │ (적합등록) - EMC 전자파 적합  │  └ KN 32 (전자파 방사 기준)    │
│        │ 성 평가 절차, 시험성적서 제출 │     └ 적합등록필증             │
│        │ 요건, 적합등록필증 표시 방법, │  └ KN 32 방사시험성적서         │
│        │ 사후관리 및 변경신고 기준...  │  └ KN 35 (전자파 내성 기준)... │   ← 6줄 이상: 5줄째 끝 "..."
│        │ 더보기                        │ 더보기                         │   ← 넘치는 셀마다 링크
└────────┴──────────────────────────────┴──────────────────────────────┘

규제명 "더보기"      → 규제명 셀만 7줄 전부 + "접기" (정보관리항목은 5줄 + 더보기 그대로)
정보관리항목 "더보기" → 정보관리항목 셀만 전부 + "접기"
```

- 행 높이는 **행마다 내용에 맞춰** 다르다(짧은 행 40px, 5줄 셀 행 약 120px).
- 링크는 **글자**("더보기"/"접기")다. RealGrid 셀 버튼(16px 아이콘)이 아니다.
- 사용자 입력이 html 로 해석되지 않는다(`<img onerror>` 넣어도 글자로 보임).
- **펼친 행은 그리드 행 영역보다 커지지 않는다.** 아주 긴 셀은 펼쳐도 아래가 잘린다 → 그리드 높이로 여유를 둔다(Q5).

---

## 2. 자주 묻는 질문 — 원리

### Q1. `...` 은 글자 수로 나오나, 줄 수로 나오나?

**줄 수다.** 글자 수는 기준이 아니다. 같은 글자 수라도 **컬럼이 좁으면 `...`이 생기고 넓히면 사라진다.**

`...` 을 붙이는 주체가 둘이고, 둘이 같은 줄 수(`clampLines`)를 본다.

| 무엇 | 누가 | 어떻게 |
|---|---|---|
| 이 셀에 "더보기"를 달지 판단 | **스크립트** `lineCount()` | 콜백이 받은 **셀 너비**에서, 그리드와 **같은 폰트**로 canvas 에 글자 폭을 재서 몇 줄이 되는지 센다. `clampLines` 초과면 링크 + `wrap-clamp` 클래스 |
| `...` 그리기 | **CSS** `-webkit-line-clamp` | N줄째 끝을 자르고 `...` 을 붙인다. 스크립트가 `...` 문자를 넣는 게 아니다 |

### Q2. 5줄을 넘을 때만 `...` + 더보기가 나오게 할 수 있나?

`clampLines: 5` 한 곳만 바꾸면 된다. 렌더러가 **같은 값을 inline style `-webkit-line-clamp:5` 로 내려주므로** CSS 파일은 안 바꾼다(4-2).

> ⚠ CSS 에 `-webkit-line-clamp: 2` 처럼 **숫자를 따로 박지 않는다.** 스크립트 값과 어긋나면
> "더보기는 있는데 `...` 이 없다"(CSS 가 더 큼) 또는 "`...` 은 있는데 더보기가 없다"(CSS 가 더 작음)가 된다.

줄 수를 늘리면 긴 행이 그만큼 높아진다(5줄 ≈ 5×18 + 링크 + 여백 ≈ 120px). 그리드 행 영역 550px 이면 긴 행이 많을 때 한 화면에 4~5행.

### Q3. 개행은 데이터에 들어 있는 건가, CSS 가 하는 건가?

**너비를 넘을 때의 개행은 CSS 가 한다.** 데이터에 개행 문자를 넣을 필요가 없다.

```
셀 값: "아주 긴 텍스트입니다. 셀 너비를 넘으면 다음 줄로 넘어가야 하고 ..."   ← 개행 없음

CSS  white-space: pre-wrap   → 셀 너비를 넘으면 브라우저가 다음 줄로 넘긴다
     word-break            → 어디서 끊을지 (keep-all: 단어 단위 / break-all: 글자 단위)
     (pre-wrap 이라 값에 \n 이 들어 있으면 그 위치에서도 줄이 바뀐다)

rowHeight: -1               → 줄이 늘어난 만큼 RealGrid 가 행 높이를 키운다
```

RealGrid 기본 CSS 가 `.rg-data-cell { white-space: nowrap }` 이라 원래는 한 줄로 막혀 있다. 그걸 컬럼 단위로 풀어 주는 게 전부다(3장).

### Q4. 그리드 전체 높이(`height`)는 어떻게 주나?

**`rowHeight: -1` 이면 "행 N개에 맞춰 그리드 틀을 줄이는" 기능이 꺼지므로 `height` 를 직접 정해야 한다.** 방식 A·B 공통.

프로젝트에 행수맞춤(`realgrid-행수맞춤-높이-가이드.md`)이 들어가 있으면 보통 그리드는 이렇게 높이가 정해진다.

```
보통 그리드 (rowHeight 32, height 500px, 행수맞춤 10행)
  그리드 높이 = min(height, 툴바 + 그룹패널 + 헤더 + 합계 + 10 × 32)
             → 10행 높이가 500px 보다 작으면 그만큼 "줄어든다"  (height = 최대 높이)

줄바꿈 그리드 (rowHeight -1)
  행마다 높이가 달라 "10 × 행 높이" 를 계산할 수 없다 → 맞춤을 건너뛴다
  그리드 높이 = height 그대로  (height = 고정 높이)
```

> 실측 (NexHubStudio 규제 목록, `height="520px"`, 툴바·그룹패널·2줄 헤더)
>
> | 설정 | 그리드 높이 |
> |---|---|
> | `rowHeight: 32` + 행수맞춤 10행 | 491px (10행에 맞춰 줄어듦) |
> | `rowHeight: -1` | 520px (height 그대로) |

**내용이 많은 그리드는 화면 높이에 맞추되 최소값을 둔다.**

```vue
<MyRealGrid height="max(700px, calc(100vh - 400px))" :row-height="-1" ... />
```

- `max(A, B)` 는 "둘 중 큰 값" → **700px 이 바닥(최소값)** 이다. `100vh` 만 쓰면 낮은 화면에서 그리드가 너무 작아진다.
- `400px` 은 **그리드 위쪽 영역**(앱 헤더·검색 폼·필터 등)에 맞춰 조정한다. `height` 가 px 가 아니어도 공통 그리드 wrapper 의 CSS height 로 그대로 들어간다(행수맞춤은 어차피 꺼져 있음).
- 행 영역은 그리드 높이에서 **고정영역(툴바·그룹패널·헤더·가로스크롤)** 을 뺀 값이다. 규제 목록은 149px.

> 실측 (규제 목록, 고정영역 149px, 최소값 400px 로 쟀을 때 포함)
>
> | 브라우저 안쪽 높이 | `max(400px, …)` 그리드 / 행 영역 | `max(700px, …)` 그리드 / 행 영역 |
> |---|---|---|
> | 700 | 400 / 251 | 700 / 551 |
> | 940 (1080p) | 540 / 391 | **700 / 550** |
> | 1200 | 800 / 651 | 800 / 651 |
>
> 창 크기를 바꾸면 RealGrid 행 영역도 바로 따라 바뀌었다(추가 코드 없음).

- 1080p 모니터에서는 사실상 **700px 고정**이다(`100vh - 400px` 이 700 을 넘으려면 안쪽 높이 1100px 이상).
- 노트북(768px 화면)에서는 한 화면에 안 들어가 페이지를 조금 더 스크롤한다. 노트북 사용자가 많으면 최소값 600px.
- 행수맞춤이 없는 프로젝트(원래 `height` 고정)라면 높이는 변하지 않는다. 필요할 때만 조정한다.

### Q5. 펼친 셀이 아주 길면? (규제항목 36개 같은 경우)

**펼친 행은 그리드 행 영역보다 커지지 않는다. 그보다 긴 셀은 펼쳐도 아래가 잘린다.**

> 실측 (규제 목록, 정보관리항목 36개)
>
> | 조건 | 결과 |
> |---|---|
> | 행 영역 353px (그리드 500px), 셀 너비에서 66줄 | 행 **353px 에서 멈춤**, **19줄**만 보이고 나머지와 **"접기" 링크가 잘림** |
> | 행 영역 550px (그리드 700px) | 행 **550px 에서 멈춤** (약 29줄까지 보임) |
> | 휠 스크롤 | 셀 안이 아니라 **그리드가 다음 행으로** 넘어감 (맨 위 행 1 → 4) |
> | 그리드 전체 높이 | 변하지 않음 |

RealGrid 는 **행 단위로 스크롤**한다(맨 위 행 번호가 정수). 행 하나의 중간으로 내려갈 수 없어서, 행 영역보다 긴 행은 아래가 안 보인다.

**대응: 그리드 높이로 여유를 둔다(Q4).** `max(700px, …)` 이면 행 영역 약 550px, 한 셀 약 29줄까지 펼쳐서 볼 수 있다. 이보다 긴 데이터가 흔하면 최소 높이를 올린다.

| 시도한 다른 방법 | 결과 |
|---|---|
| 펼친 셀에 `max-height` + 셀 안 스크롤 | 셀 위에서 휠을 굴리면 **그리드 행이 넘어갔고**(1 → 4), RealGrid 가 셀을 다시 그리면서 **스크롤 위치도 사라졌다** |
| 행 영역보다 길면 팝업으로 전체 내용 | 동작은 했지만 요구사항("더보기 누르면 그 자리에서 전체 내용")과 달라 쓰지 않았다 |

> 펼친 뒤 "접기"가 잘려 안 보이면 **그 셀을 다시 접을 링크가 없다.** 펼친 상태는 메모리에 남아서 페이지 이동·정렬 후에도 펼쳐진 채이고,
> 화면을 새로 열어야 접힌다. 긴 데이터가 흔하면 그리드 높이를 먼저 늘린다.

---

## 3. 너비를 넘을 때 개행 처리 방법 (방식 A — 더보기 없이)

"잘리지 않고 전부 보이기만 하면 된다"면 이것만 한다. **html 렌더러도, 스크립트도 필요 없다.**

### 3-1. 수정할 곳 4개

**① 그리드 옵션 — 행 높이를 내용에 맞춤**

```js
// 수정 전
gridView.setDisplayOptions({ rowHeight: 32 })

// 수정 후
gridView.setDisplayOptions({
  rowHeight: -1,       // 셀 내용 높이에 맞춰 행마다 다르게
  minRowHeight: 32     // 한 줄짜리 행 높이 (선택)
})
```

**② 컬럼 — 줄바꿈할 컬럼에만 클래스**

```js
// 수정 전
{ name: 'title', fieldName: 'title', width: 240, header: { text: '제목' }, renderer: { type: 'text', showTooltip: true } }

// 수정 후 — styleName 추가, 툴팁은 필요 없으면 제거
{ name: 'title', fieldName: 'title', width: 240, header: { text: '제목' }, styleName: 'wrap-col' }
```

**③ CSS**

```css
/* RealGrid 기본 .rg-data-cell { white-space: nowrap } 을 이 컬럼만 푼다 */
.rg-data-cell.wrap-col {
  white-space: pre-wrap;      /* 너비를 넘으면 다음 줄로 (값의 \n 도 줄바꿈) */
  word-break: keep-all;       /* 한글·영문 단어 중간에서 안 끊음 */
  overflow-wrap: anywhere;    /* 단어 하나가 셀보다 길면 그때만 글자 단위로 */
  text-align: left;           /* 기본이 가운데 정렬이라 여러 줄이면 읽기 어렵다 */
}
```

Vue `<style scoped>` 면 그리드 DOM 에 data-v 속성이 없어서 **`:deep()` 필수**:

```css
.my-page :deep(.rg-data-cell.wrap-col) { white-space: pre-wrap; word-break: keep-all; overflow-wrap: anywhere; text-align: left; }
```

**④ 그리드 전체 높이 — 직접 준다 (Q4)**

```vue
<!-- 수정 전: 행수맞춤이 줄여 주던 넉넉한 값 --> <MyRealGrid height="520px" ... />
<!-- 수정 후 -->                                  <MyRealGrid height="max(700px, calc(100vh - 400px))" :row-height="-1" ... />
```

### 3-2. `word-break` 고르기

| 값 | 끊는 위치 | 끊기는 모양 (예시) | 쓸 때 |
|---|---|---|---|
| `keep-all` + `overflow-wrap: anywhere` | **단어 단위**, 너무 긴 단어만 글자 단위 | `생산자책임재활용` / `(EPR) 분담금` | **방식 A 권장** |
| `normal` | 한글은 글자 단위, 영문은 단어 단위 | `생산자책임재활용(E` / `PR)` ← 영문은 단어 유지 | 기본값 |
| `break-all` | **모든 글자** 단위 | `생산자책임재활용(E` / `PR) 분담` | 방식 B (줄 수 계산을 글자 단위로 하므로 맞춘다) |

### 3-3. 확인 결과 (text 렌더러 + `styleName` + CSS, 컬럼 260px)

| 행 값 | `rowHeight: -1` | `rowHeight: 32` (고정) |
|---|---|---|
| `짧음` | 23px, 1줄 | 32px |
| 긴 문장(3줄 분량) | **64px, 3줄 전부 보임** | 32px — **1줄만 보이고 잘림**(`...` 도 없음) |
| `줄1\n줄2\n줄3` | **64px** | 32px, 잘림 |

`keep-all` 로 바꿔도 동일하게 64px. `text-align: left` 적용 확인.

### 3-4. 방식 A 의 한계

- **몇 줄이든 전부 보인다.** 아주 긴 값이 있으면 그 행이 매우 높아진다 → 방식 B.
- **행 영역보다 긴 셀은 아래가 잘린다**(Q5 와 같은 이유, 행 단위 스크롤).
- **여러 줄일 때 `...` 이 안 붙는다.** RealGrid 의 말줄임은 한 줄일 때만 동작한다.
- 고정 `rowHeight`(양수)에서는 줄바꿈은 되지만 **행이 안 늘어나서 잘린다** — 반드시 `-1`.
- text 렌더러라 값이 글자로 들어간다 → **XSS 걱정 없음**(방식 B 는 html 렌더러라 이스케이프 필요).

---

## 4. 5줄 + ... + 더보기로 수정하는 방법 (방식 B)

### 4-1. 일반 그리드에서 바꾸는 순서 (수정 전 → 수정 후)

출발점: 긴 셀이 한 줄 `...` + 툴팁으로 보이는 보통 그리드.

**① 함수 파일 추가** — 6-1 의 `setupWrapMore` 를 `src/utils/realgridWrapMore.js` 로 그대로 복사.

**② 그리드 옵션 + 전체 높이**

```js
// 수정 전
gridView.setDisplayOptions({ rowHeight: 32, fitStyle: 'evenFill' })

// 수정 후
gridView.setDisplayOptions({
  rowHeight: -1,          // 필수: 행 높이 = 내용 (펼치면 늘고 접으면 줄어듦)
  minRowHeight: 40,       // 한 줄짜리 행 높이
  refCalcHeights: false,  // 필수: 기본값 true 면 접어도 행 높이가 안 줄어든다(실측)
  fitStyle: 'even'        // 선택: 컬럼이 많으면 evenFill 이 너비를 줄여 다 잘린다 (5장)
})
```

```vue
<!-- 그리드 컨테이너 높이 (Q4, Q5) -->
<!-- 수정 전 --> <MyRealGrid height="520px" ... />
<!-- 수정 후 --> <MyRealGrid height="max(700px, calc(100vh - 400px))" :row-height="-1" ... />
```

**③ 함수 연결 + 컬럼 렌더러**

```js
// 수정 전
gridView.setColumns([
  { name: 'id', fieldName: 'id', width: 80 },
  { name: 'title', fieldName: 'title', width: 240, renderer: { type: 'text', showTooltip: true } },
  { name: 'items', fieldName: 'items', width: 260, styleName: 'wrap-col' }   // 방식 A 를 쓰고 있었다면
])

// 수정 후
import { setupWrapMore } from '@/utils/realgridWrapMore'
const wm = setupWrapMore(gridView, { rowKey: 'id', clampLines: 5 })   // rowKey = PK 필드명

gridView.setColumns([
  { name: 'id', fieldName: 'id', width: 80 },
  { name: 'title', fieldName: 'title', width: 240, renderer: wm.renderer },  // showTooltip 제거
  { name: 'items', fieldName: 'items', width: 260, renderer: wm.renderer }   // styleName: 'wrap-col' 제거 (A 와 섞지 않는다)
])
```

- `renderer` 객체 하나를 **여러 컬럼이 같이 써도 된다.** 펼침은 **셀 단위**(`PK|컬럼명`)라 서로 영향 없다.
- `rowKey` 필드는 **컬럼으로 안 보여도 fields 에만 있으면 된다**(`grid.getValue` 로 읽음). PK 가 없으면 행을 구분할 고유값 필드를 만든다.
- 컬럼 `name` 과 `fieldName` 이 달라도 된다(실측).
- 이미 `renderer: { type: 'html', callback }` 을 쓰던 컬럼(배지, 링크 등)은 그대로 둔다. 긴 텍스트 컬럼만 바꾼다.

**④ CSS** — 6-3 을 그대로 추가. 방식 A 의 `.wrap-col` 규칙이 있었다면 해당 컬럼에서 뺐으므로 남겨 둬도 영향 없다.

**⑤ 데이터** — 셀 값을 요약하고 있었다면 전체로.

```js
// 수정 전: 펼쳐도 요약만 보인다
countryTxt: names.length > 1 ? `${names[0]} 외 ${names.length - 1}` : names[0]

// 수정 후
countryTxt: names.join(', ')
```

> 요약을 전체로 바꾸면 **엑셀 내보내기·키워드 검색 대상**도 같이 바뀌는지 확인한다(검색이 요약 문자열을 보고 있으면 화면에 보이는 이름이 검색 안 된다).

**⑥ 정리**

```js
// 그리드 제거 시
wm.destroy()      // 클릭 리스너 해제
gridView.destroy()
```

#### Vue 3 — 공통 그리드 컴포넌트가 `@init` 으로 gridView 를 넘겨주는 구조

컬럼을 prop 으로 먼저 넘기는 구조면 그 시점엔 gridView 가 없다. **`@init` 에서 만들고 `setColumnProperty` 로 렌더러를 붙인다**(실측 확인).

```vue
<template>
  <MyRealGrid
    :columns="columns" :rows="rows"
    height="max(700px, calc(100vh - 400px))" :row-height="-1" :options="gridOptions"
    @init="onGridInit"
  />
</template>

<script>
import { setupWrapMore } from '@/utils/realgridWrapMore'

const WRAP_COLUMNS = ['title', 'itemTxt', 'countryTxt']

export default {
  data() {
    return {
      gridView: null,
      // 컴포넌트가 displayOptions 를 병합해 주는 경우. 아니면 onGridInit 에서 gridView.setDisplayOptions 로
      gridOptions: { displayOptions: { minRowHeight: 40, refCalcHeights: false } }
    }
  },
  methods: {
    onGridInit({ gridView }) {
      this.gridView = gridView
      this.wrapMore = setupWrapMore(gridView, { rowKey: 'regInfoId', clampLines: 5 })
      WRAP_COLUMNS.forEach((name) => gridView.setColumnProperty(name, 'renderer', this.wrapMore.renderer))
    }
  },
  beforeUnmount() {
    if (this.wrapMore) this.wrapMore.destroy()
  }
}
</script>
```

> 컴포넌트가 `columns` prop 이 바뀔 때 `setColumns()` 를 다시 부르면 렌더러가 빠진다.
> 그런 구조면 columns 를 바꾼 뒤 `setColumnProperty` 를 다시 부르거나, 컬럼 정의 자체에 `renderer` 를 넣는다
> (NexHubStudio 는 페이지 메서드로 렌더러를 만들어 컬럼 정의에 직접 넣었다 — 11장).

### 4-2. 적용한 뒤 바꾸고 싶을 때 (수정 포인트)

| 바꾸고 싶은 것 | 수정할 곳 | 같이 바꿔야 하는 곳 |
|---|---|---|
| **몇 줄에서 자를지** (5 → 3) | `setupWrapMore(..., { clampLines: 3 })` | 없음. CSS 에 줄 수를 쓰지 않는다(Q2) |
| **적용 컬럼 추가/제거** | 컬럼의 `renderer: wm.renderer` 추가/삭제 | 추가하는 컬럼 값이 요약이면 전체 값으로(4-1 ⑤) |
| **그리드 전체 높이 / 펼칠 수 있는 최대 길이** | `height="max(최소값, calc(100vh - 위쪽영역))"` | 없음. 행 영역(= 그리드 높이 − 고정영역)이 한 셀을 펼쳐 볼 수 있는 최대 높이(Q5) |
| **셀 좌우 여백** (8 → 12px) | CSS `.rg-data-cell .rg-renderer { padding: 0 12px }` | `cellPadX: 26` (좌 + 우 + 테두리 2). 어긋나면 경계에서 줄 수를 1 적게 세서 **N+1줄인데 링크가 없다** |
| **글자 크기·폰트** | 테마/페이지 CSS `.rg-root { font-size }` | 없음. `lineCount` 가 그려진 `.rg-root` 폰트를 읽는다 |
| **줄 간격** (18 → 20px) | CSS `.wrap-text { line-height: 20px }` | 8장 검증 스크립트의 `LINE_H` |
| **링크 문구** ("더보기" → "전체보기") | 6-1 렌더러의 `'더보기' : '접기'` | 없음 |
| **링크 색·크기** | CSS `.wrap-more` | 없음 |
| **짧은 행 높이** | `minRowHeight` | 없음 |
| **단어 단위로 끊기** | CSS `word-break` + `lineCount` 루프 | **둘 다** (7장) — CSS 만 바꾸면 줄 수 판단이 어긋난다 |
| **기능 끄기(원래대로)** | 컬럼에서 `renderer: wm.renderer` 제거, `wm.destroy()` 호출 제거 | 개행만 남기려면 방식 A 로, 한 줄로 되돌리려면 `rowHeight`·`height` 를 원래 값으로 |

---

## 5. 보기 좋게 (선택) — 컬럼이 많아 답답할 때

NexHubStudio 규제 목록(컬럼 18개)에서 줄바꿈을 붙인 뒤 "잘리고 답답하다"는 피드백으로 같이 바꾼 것.

| 증상 | 원인 | 조치 |
|---|---|---|
| `REG-...`, `202...`, `로가기`(바로가기 앞이 잘림) | `fitStyle: 'evenFill'` 이 **너비 합 2180px 을 1200px 에 욱여넣음**(55%로 축소) | `fitStyle: 'even'`(모자랄 때만 늘리고 줄이지 않음) → 넘치면 가로 스크롤 |
| 가로 스크롤하면 어느 행인지 모름 | 기준 컬럼도 같이 밀려남 | `setFixedOptions({ colCount: 3 })` — 상태·번호·제목 고정 |
| 배지가 진하고 무거움 | 원색 배경 + 흰 글씨 + 굵게 | 옅은 배경 + 같은 계열 글자색 배지(프로젝트 공통 배지 클래스) |
| 여백 없음 | `.rg-renderer` 기본 padding `0 4px` | `0 8px` + 행 `minRowHeight: 40` (6-3) |
| 수정 안 하는 목록에 빈 컬럼 | 상태바(stateBar) | `setStateBar({ visible: false })` |

---

## 6. 코드 (방식 B)

### 6-1. `setupWrapMore` — 복사해서 쓰는 함수 하나

`src/utils/realgridWrapMore.js` 같은 파일로 둔다. RealGrid 외 의존성 없음. **NexHubStudio 에서 실측한 코드다(10장).**

```js
/**
 * RealGrid 긴 셀: 줄바꿈 + N줄 말줄임(...) + 더보기/접기 (셀 단위)
 *
 * 전제: displayOptions.rowHeight = -1, refCalcHeights = false
 *
 * @param {GridView} gridView
 * @param {object}   opts
 * @param {string}   opts.rowKey         행을 구분하는 필드명(PK). 펼친 상태를 'PK|컬럼명' 으로 기억한다
 * @param {number}  [opts.clampLines=5]  이 줄 수를 넘으면 ... + 더보기
 * @param {number}  [opts.cellPadX=18]   셀 좌우 padding 합 + 테두리(px). CSS 의 .rg-renderer padding 과 맞춘다
 * @returns {{ renderer: object, destroy(): void }}
 *   renderer — 줄바꿈할 컬럼의 column.renderer 에 그대로 넣는다
 *   destroy  — 그리드를 없앨 때 호출(클릭 리스너 해제)
 */
export function setupWrapMore(gridView, { rowKey, clampLines = 5, cellPadX = 18 }) {
  const expanded = new Set() // 펼친 셀 'PK|컬럼명'
  const ctx = document.createElement('canvas').getContext('2d')
  let fontReady = false

  const escapeHtml = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])

  // 그리드 폰트(테마 CSS 가 정함)를 그려진 그리드에서 읽는다. 처음엔 .rg-root 가 없을 수 있어 찾을 때까지 확인
  const measure = () => {
    if (!fontReady) {
      const root = gridView.getContainer().querySelector('.rg-root')
      if (root) {
        ctx.font = getComputedStyle(root).font
        fontReady = true
      }
    }
    return ctx
  }

  // 셀 너비에서 몇 줄이 되는지. CSS 가 word-break: break-all(글자 단위)이라 글자 폭을 더해 가며 센다
  const lineCount = (text, maxWidth) => {
    if (!text) return 0
    if (!(maxWidth > 0)) return 1
    const c = measure()
    let lines = 0
    text.split('\n').forEach((para) => {
      lines += 1
      let acc = 0
      for (const ch of para) {
        const w = c.measureText(ch).width
        if (acc > 0 && acc + w > maxWidth) {
          lines += 1
          acc = 0
        }
        acc += w
      }
    })
    return lines
  }

  const renderer = {
    type: 'html',
    callback: (grid, model, width) => {
      const text = String(model.value ?? '')
      const html = escapeHtml(text) // 사용자 입력이 html 로 해석되지 않게 반드시
      if (lineCount(text, width - cellPadX) <= clampLines) {
        return `<div class="wrap-cell"><div class="wrap-text">${html}</div></div>`
      }
      const column = typeof model.index.column === 'string' ? model.index.column : model.index.column.name
      const key = `${grid.getValue(model.index.itemIndex, rowKey)}|${column}`
      const open = expanded.has(key)
      const body = open
        ? `<div class="wrap-text">${html}</div>`
        : `<div class="wrap-text wrap-clamp" style="-webkit-line-clamp:${clampLines}">${html}</div>`
      return `<div class="wrap-cell">${body}<span class="wrap-more" data-key="${escapeHtml(key)}">${open ? '접기' : '더보기'}</span></div>`
    }
  }

  // 더보기 클릭: 그리드보다 바깥 요소에서 캡처 단계로 먼저 받고 그리드까지 안 보낸다
  // → 행 선택 변경·더블클릭 이벤트로 번지지 않는다
  const host = gridView.getContainer().parentElement
  const types = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'dblclick', 'touchstart']
  const handler = (e) => {
    const link = e.target.closest && e.target.closest('.wrap-more')
    if (!link || !gridView.getContainer().contains(link)) return // 같은 부모에 그리드가 여러 개여도 자기 것만
    e.stopPropagation()
    if (e.type !== 'click') return
    const key = link.dataset.key
    if (expanded.has(key)) expanded.delete(key)
    else expanded.add(key)
    gridView.refresh() // 다시 그리면 rowHeight -1 이 바뀐 내용으로 행 높이를 다시 잰다
  }
  types.forEach((t) => host.addEventListener(t, handler, true))

  return {
    renderer,
    destroy() {
      types.forEach((t) => host.removeEventListener(t, handler, true))
    }
  }
}
```

### 6-2. 순수 JS 전체 예

```js
import { GridView, LocalDataProvider } from 'realgrid'
import { setupWrapMore } from '@/utils/realgridWrapMore'

// 부모 요소가 있어야 한다(클릭을 부모에서 받음). 높이는 CSS 로: height: max(700px, calc(100vh - 400px))
const container = document.getElementById('realgrid')
const provider = new LocalDataProvider(false)
const gridView = new GridView(container)
gridView.setDataSource(provider)

gridView.setDisplayOptions({
  rowHeight: -1,          // ① 행 높이 = 셀 내용에 맞춤 (필수)
  minRowHeight: 40,       // ② 한 줄짜리 행 최소 높이
  refCalcHeights: false   // ③ 그릴 때마다 높이를 다시 잼 → 접으면 줄어듦 (필수)
})

const wm = setupWrapMore(gridView, { rowKey: 'id', clampLines: 5 })

provider.setFields([{ fieldName: 'id' }, { fieldName: 'title' }, { fieldName: 'items' }])
gridView.setColumns([
  { name: 'id', fieldName: 'id', width: 80, header: { text: 'ID' } },
  { name: 'title', fieldName: 'title', width: 240, header: { text: '제목' }, renderer: wm.renderer }, // 줄바꿈 컬럼만
  { name: 'items', fieldName: 'items', width: 260, header: { text: '항목' }, renderer: wm.renderer }
])
provider.setRows(rows)

// 그리드 제거 시
wm.destroy()
gridView.destroy()
```

### 6-3. CSS

html 렌더러가 만든 DOM 에 적용된다. **Vue `<style scoped>` 면 반드시 `:deep()`** (그리드 DOM 에는 data-v 속성이 없다).

```css
/* 셀 좌우 여백 — 바꾸면 setupWrapMore 의 cellPadX(= 좌 + 우 + 테두리 2) 도 같이 */
.rg-data-cell .rg-renderer {
  padding: 0 8px;
}

/* RealGrid 기본 .rg-data-cell { text-align: center } 를 긴 셀만 왼쪽으로 */
.wrap-cell {
  text-align: left;
  padding: 6px 0;
}

/* 너비를 넘으면 개행(pre-wrap) + 글자 단위로 끊기(break-all, lineCount 와 같은 기준) */
.wrap-text {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 18px;
}

/* N줄 말줄임. 몇 줄인지(-webkit-line-clamp)는 여기 쓰지 않는다 — 렌더러가 inline style 로 넣는다 */
.wrap-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wrap-more {
  display: inline-block;
  margin-top: 1px;
  font-size: 11px;
  line-height: 16px;
  color: #2563eb;
  cursor: pointer;
}

.wrap-more:hover {
  text-decoration: underline;
}
```

Vue scoped 예:

```css
.my-page :deep(.rg-data-cell .rg-renderer) { padding: 0 8px; }
.my-page :deep(.wrap-text) { white-space: pre-wrap; word-break: break-all; line-height: 18px; }
/* ...나머지도 같은 방식 */
```

> 방식 B 가 `break-all` 인 이유: `lineCount` 가 글자 폭을 더해 가며 줄 수를 세기 때문에, 브라우저도 글자 단위로 끊어야 계산과 실제가 맞는다.
> 단어 단위로 끊고 싶으면 7장.

---

## 7. 방식 B 에서 단어 단위로 끊기 (미실측)

한글·영문 단어 중간에서 안 끊기게 하려면 **CSS 와 `lineCount` 를 같이** 바꿔야 한다. CSS 만 바꾸면 줄 수 판단이 어긋난다.

```css
.wrap-text { white-space: pre-wrap; word-break: keep-all; overflow-wrap: anywhere; line-height: 18px; }
```

```js
// setupWrapMore 의 lineCount 안, 문단 루프를 단어 단위로 교체
text.split('\n').forEach((para) => {
  lines += 1
  let acc = 0
  para.split(/(\s+)/).forEach((token) => {
    const w = c.measureText(token).width
    if (acc > 0 && acc + w > maxWidth && token.trim()) { lines += 1; acc = 0 }
    if (w > maxWidth) { // 단어 하나가 셀보다 길면 글자 단위로 끊긴다(overflow-wrap: anywhere)
      for (const ch of token) {
        const cw = c.measureText(ch).width
        if (acc > 0 && acc + cw > maxWidth) { lines += 1; acc = 0 }
        acc += cw
      }
    } else {
      acc += w
    }
  })
})
```

> 이 변형은 NexHubStudio 에서 실측하지 않았다. 적용 시 8장 검증 스크립트로 `판단 틀린 셀 []` 인지 반드시 확인한다.
> (방식 A 의 `keep-all` CSS 는 실측했다 — 3-3.)

---

## 8. 검증 방법 (방식 B)

그리드가 그려진 화면의 브라우저 콘솔에서. **각 셀의 실제 줄 수와 "더보기" 유무가 일치하는지** 본다.

```js
const N = 5          // clampLines
const LINE_H = 18    // .wrap-text line-height
const res = [...document.querySelectorAll('.wrap-text')].filter((w) => w.clientWidth > 0).map((w) => {
  // 말줄임을 뺀 복제본으로 실제 줄 수를 잰다
  const clone = w.cloneNode(true)
  clone.classList.remove('wrap-clamp')
  clone.removeAttribute('style')
  clone.style.cssText = `position:absolute;visibility:hidden;width:${w.clientWidth}px`
  w.parentNode.appendChild(clone)
  const real = Math.round(clone.scrollHeight / LINE_H)
  clone.remove()
  return { text: w.textContent.slice(0, 15), real, more: !!w.parentNode.querySelector('.wrap-more') }
})
console.table(res)
console.log('판단 틀린 셀', res.filter((r) => r.real > N !== r.more)) // [] 이면 성공
console.log('행 영역 높이', document.querySelector('.rg-body').offsetHeight) // 한 셀을 펼쳐 볼 수 있는 최대 높이
```

추가로 눈으로 확인:

| 확인 | 기대 |
|---|---|
| 짧은 셀 | 링크 없음, 행 높이 `minRowHeight` |
| N줄 초과 셀 | N줄째 끝 `...` + "더보기" |
| 더보기 클릭 | **그 셀만** 그 자리에서 전체 내용, "접기"로 바뀜, 같은 행 다른 긴 셀은 5줄 + 더보기 그대로, **행 선택 안 바뀜** |
| 접기 클릭 | 원래 높이로 줄어듦(빈칸 남으면 `refCalcHeights` 확인) |
| 행 영역보다 긴 셀 펼침 | 행이 행 영역 높이에서 멈춤(Q5). 자주 생기면 그리드 높이를 올린다 |
| 링크 더블클릭 | `onCellDblClicked` 안 불림 |
| 정렬 / 페이지 이동 후 | 같은 PK 의 같은 셀이 계속 펼쳐져 있음 |
| 창 높이 변경 | 그리드 높이가 `max(최소값, 100vh - …)` 로 따라 바뀜 |
| 값에 `<b>x</b>` 저장 | 굵게가 아니라 글자 `<b>x</b>` 로 보임 |

---

## 9. 런타임 흐름과 설계 이유 (방식 B)

### 9-1. 그리드가 셀을 그릴 때

```
RealGrid 가 행 표시 → 줄바꿈 컬럼 셀마다 renderer.callback(grid, model, width) 호출
  │
  ├─ text = model.value
  ├─ lineCount(text, width − cellPadX)
  │     canvas.font = getComputedStyle(.rg-root).font   ← 그리드 실제 폰트(테마 CSS)
  │     \n 으로 문단 분리 → 문단마다 글자 폭을 더해 가며 셀 너비를 넘으면 줄 +1
  │
  ├─ ≤ clampLines  → <div class="wrap-cell"><div class="wrap-text">이스케이프된 text</div></div>
  │
  └─ > clampLines
        key = "PK|컬럼명"   (PK = grid.getValue(itemIndex, rowKey))
        펼친 셀(Set)에 key 가 있으면  → 전체 text + <span class="wrap-more">접기</span>
        없으면 → <div class="wrap-text wrap-clamp" style="-webkit-line-clamp:N">text</div>
                 + <span class="wrap-more" data-key="PK|컬럼명">더보기</span>
  │
  ▼
rowHeight: -1 → RealGrid 가 그려진 셀 내용 높이를 재서 행 높이를 정한다 (행 영역 높이가 상한)
```

### 9-2. "더보기"를 누를 때

```
pointerdown / mousedown / pointerup / mouseup / click / dblclick
  │
  ▼ (캡처 단계) 그리드 컨테이너의 "부모" 요소 리스너가 먼저 받음
  ├─ target 이 .wrap-more 가 아니면 → 아무것도 안 함 (그리드 평소대로)
  └─ .wrap-more 면
        e.stopPropagation()   → 그리드까지 이벤트가 안 감 = 행 선택 안 바뀜, onCellDblClicked 안 불림
        click 일 때만:
          Set 에 data-key("PK|컬럼명") 토글
          gridView.refresh()  → 콜백 다시 호출 → 그 셀만 전체/접기로 그려짐
                              → refCalcHeights:false 라 행 높이를 다시 잼
```

### 9-3. 페이지 이동 · 정렬 · 데이터 교체

- 펼친 상태는 **행 번호(itemIndex)가 아니라 `PK|컬럼명`** 으로 기억한다.
- 정렬로 순서가 바뀌거나 `setRows()` 로 데이터를 갈아 끼워도, 같은 PK 행이 다시 그려질 때 콜백이 Set 을 보고 그 셀을 펼쳐서 그린다.

### 9-4. 설계 결정 — 대안이 안 되는 이유 (실측)

| 결정 | 대안 | 대안이 안 되는 이유 |
|---|---|---|
| **html 렌더러**로 셀 안에 "더보기" 글자 링크 | 셀 버튼 `button: 'action'` + `onCellButtonClicked` | 버튼이 **16×16 아이콘**(`.rg-button-action`)이라 "더보기" 글자를 못 넣는다. 컬럼 단위라 **짧은 셀에도 버튼이 붙는다** |
| | 방식 A(text 렌더러 + CSS) 에 링크만 추가 | text 렌더러는 글자만 넣는다. 링크를 넣을 수 없고, **여러 줄이면 `...` 이 안 붙는다** |
| **`rowHeight: -1`** | 고정 rowHeight + 클릭 시 `setRowHeight(i, 높이)` | 펼친 높이를 **직접 계산**해야 한다. `setRowHeight(i, 0)`(문서상 "자동")은 **행이 1px 로 접혔고**, 이후 `setRowHeight(i, 58)`·`clearRowHeights(true)` 로도 복구 안 됨(새로고침해야 복구) |
| **`refCalcHeights: false`** | 기본값 `true` | 한 번 잰 높이를 재사용해서 **접어도 행이 124px 그대로** 남는다(아래 빈칸) |
| **셀 단위** 펼침 (`PK\|컬럼명`) | 행 단위 펼침 (`PK`) | 한 셀을 눌렀는데 같은 행 다른 긴 셀까지 펼쳐진다. 행이 불필요하게 높아지고, 긴 옆 셀 때문에 행 영역 상한에 먼저 걸린다 |
| **그리드 높이로 여유** (`max(700px, …)`) | 펼친 셀 안 스크롤 | 휠이 **그리드 행을 넘기고**, 재그리기 때 **스크롤 위치가 사라진다**(Q5) |
| 줄 수를 **canvas 로 계산** | 그려진 DOM 의 `scrollHeight` 로 판단 | 렌더러는 **문자열을 반환**만 해서 그 시점에 DOM 이 없다. 그린 뒤 DOM 을 고치면 스크롤·재그리기 때마다 RealGrid 가 다시 덮어쓴다 |
| 클릭을 **부모 요소 캡처 단계**에서 받고 `stopPropagation` | `gridView.onCellClicked` | 링크인지 셀 빈 곳인지 구분 못 함. 링크 더블클릭이 `onCellDblClicked`(예: 수정 화면 이동)로 번진다 |
| | 그리드 컨테이너 자체에 리스너 | RealGrid 가 컨테이너에 먼저 등록한 리스너가 있으면 그게 먼저 돈다. **바깥 요소 캡처**가 확실히 먼저다 |
| 값을 **반드시 `escapeHtml`** | 그대로 `${model.value}` | text 렌더러는 글자로 넣지만 **html 렌더러는 HTML 로 해석**한다. 사용자가 `<img src=x onerror=...>` 를 저장하면 목록을 여는 모든 사람의 브라우저에서 실행된다(XSS) |

---

## 10. 실측 결과 (NexHubStudio, RealGrid 2.10.0, Chromium)

### 방식 A

| 항목 | 결과 |
|---|---|
| text 렌더러 + `styleName` + `pre-wrap`, `rowHeight: -1` | 1줄 23px / 3줄 분량 64px / `\n` 3줄 64px — 전부 보임 |
| 같은 설정, `rowHeight: 32` | 전부 32px, 첫 줄만 보이고 잘림 |
| `word-break: keep-all` + `overflow-wrap: anywhere` | 동일하게 64px, `text-align: left` 적용 |

### 그리드 전체 높이 (방식 A·B 공통)

| 항목 | 결과 |
|---|---|
| 규제 목록 `height="520px"` + `rowHeight: 32` + 행수맞춤 10행 | 491px |
| 같은 화면 `rowHeight: -1` | 520px (행수맞춤 건너뜀) |
| `max(700px, calc(100vh - 400px))`, 안쪽 높이 940 | 그리드 700 / 행 영역 550 |
| `max(400px, calc(100vh - 400px))`, 안쪽 높이 700 / 940 / 1200 | 400 / 540 / 800 (행 영역 251 / 391 / 651), 창 크기 변경 즉시 반영 |

### 방식 B

| 항목 | 결과 |
|---|---|
| 줄 수 판단 (clampLines 2, 테스트 행) | 셀 9개 전부 실제 줄 수와 일치 |
| 줄 수 판단 (clampLines 5, 규제 목업 25건 화면) | 보이는 셀 16개 전부 일치. 6줄 셀 1개만 5줄 + `...` + 더보기, **5줄 딱 맞는 셀은 링크 없음** |
| 줄 수 판단 (clampLines 3, `setupWrapMore` 단독 그리드) | 셀 6개 전부 일치 |
| 행 높이 (minRowHeight 40) | 짧은 행 40 / 2줄 49 / 3줄+링크 88 → 펼침 124 |
| **셀 단위 펼침** (같은 행에 긴 규제명 7줄 + 긴 항목 36개) | 규제명 더보기 → **규제명만** 펼침(141px), 항목은 5줄 + 더보기 그대로 / 항목 더보기 → **항목만** 펼침 |
| 셀 단위 펼침 (`setupWrapMore` 단독, 컬럼 name ≠ fieldName) | 이름 셀만 펼침(88 → 106), 항목 셀은 그대로 |
| 행 영역보다 긴 셀 펼침 | 그리드 500(행 영역 353): 353 에서 멈춤, 66줄 중 19줄, "접기" 안 보임 / 그리드 700(행 영역 550): 550 에서 멈춤 |
| 펼친 셀에 max-height + 셀 안 스크롤 | 휠이 그리드 행을 넘김(1 → 4), 재그리기로 셀 DOM 교체 |
| 실제 마우스 클릭 | 펼침·접힘 동작, `onCurrentRowChanged` 0회 |
| 링크 더블클릭 | 펼침→접힘 두 번 토글, `onCellDblClicked` 0회, 화면 이동 없음 |
| 일반 셀 클릭 | 기존대로 행 선택됨 |
| 정렬(`orderBy`) 후 | 펼친 PK 행이 새 위치에서 그대로 펼쳐짐 |
| `setRows()` 로 데이터 교체 후 | 같은 PK 가 다시 들어오면 펼쳐진 채로 그려짐 |
| `@init` 후 `setColumnProperty(name, 'renderer', wm.renderer)` | 동작 (68 → 펼침 104) |
| 고정 컬럼(`fixedColCount: 3`) 안의 셀 | 실제 클릭으로 펼침 동작 (122 → 140), 행 선택 안 바뀜 |
| XSS | `<img src=x onerror=alert(1)>`, `<b>굵게</b>` 모두 글자로 표시, 요소 생성 0 |
| `refCalcHeights: true`(기본) | **접어도 124px 유지**(빈칸) — false 필수 |
| 비교: 고정 rowHeight + `setRowHeight(i, 100)` | 그 행만 100px — 동작은 함 |
| 비교: `setRowHeight(i, 0)` | **행이 1px 로 접힘**, `setRowHeight(i, 58)`·`clearRowHeights(true)` 로 복구 안 됨 |
| 비교: 셀 버튼 `button: 'action'` | 16×16 아이콘, 글자 불가, 모든 행에 표시 |

---

## 11. NexHubStudio 적용 위치 (참고)

`src/pages/regulation/RegulationInfoPage.vue` — 방식 B 를 **페이지 메서드**로 넣었다(이 프로젝트는 RealGrid 기능을 util 로 빼지 않고 `@init` 의 gridView 를 페이지에서 직접 쓰는 방침). 로직은 6-1 과 같다.

| 가이드 (`setupWrapMore`) | 페이지 |
|---|---|
| `clampLines` | `CLAMP_LINES = 5` 상수 — **줄 수는 여기만 바꾼다** |
| `cellPadX` | `CELL_PAD_X = 18` 상수 |
| `renderer` | `wrapRenderer()` → `renderWrapCell()` — 컬럼 정의에 직접 (규제명·정보관리항목·인증마크/표시·국가) |
| `lineCount` / `measure` | `lineCount()` / `measureContext()` |
| 클릭 리스너 | `bindMoreLinks()` (`onGridInit` 에서), 해제는 `beforeUnmount` |
| 펼침 토글 | `toggleExpand(id, field)` |
| `expanded` Set (`PK\|컬럼명`) | `this.expandedCells` (`regInfoId\|필드명`) |
| 클래스 `wrap-cell / wrap-text / wrap-clamp / wrap-more` | `reg-cell / reg-wrap / reg-clamp / reg-more` (`<style scoped>` 의 `:deep`) |
| `escapeHtml` 내장 | `src/utils/stringUtil.js` 의 `escapeHtml` |
| 그리드 옵션 | `height="max(700px, calc(100vh - 400px))"`, `:row-height="-1"`, `gridOptions.displayOptions = { minRowHeight: 40, refCalcHeights: false }`, `fit-style="even"`, `:fixed-col-count="3"`, `:state-bar-visible="false"` |

---

## 12. 한계 (알고 쓸 것)

- **행 영역보다 긴 셀은 펼쳐도 아래가 잘리고 "접기" 링크가 안 보인다**(Q5). 그리드 높이로만 완화된다(`max(700px, …)` 기준 한 셀 약 29줄).
- **엑셀 내보내기**: html 렌더러 컬럼이 엑셀에 **원래 값**으로 나가는지 **확인 안 함.** 적용 후 한 번 내보내 본다.
- **`rowHeight: -1` 이라 행 높이가 행마다 다르다(방식 A·B 공통).** 행수맞춤이 적용되지 않아 `height` 를 직접 준다(Q4). "딱 N행"은 보장되지 않는다.
- **같은 행에서 셀 두 개를 펼치면** 행 높이는 더 긴 셀에 맞춰진다.
- **줄 수 계산은 근사다.** 글자 단위(`break-all`) + canvas 폭이라 실측에서는 전부 맞았지만, 웹폰트가 늦게 로드되기 전에 그려지면 폭이 달라질 수 있다(다음 재그리기 때 맞춰짐).
- **그룹핑(행 그룹), TreeView, Firefox/Safari, 터치 기기**는 실측 안 함. `-webkit-line-clamp` 는 주요 브라우저가 지원하지만 확인은 Chromium 만.
- 펼친 상태는 **메모리에만** 있다. 화면을 떠났다 오면 모두 접힌다.
- `.rg-root`, `.rg-body`, `.rg-renderer`, `.rg-data-cell` 은 RealGrid 가 만드는 DOM 클래스다(2.10.0 확인). 메이저 업그레이드 시 8장 스크립트로 다시 확인한다.
