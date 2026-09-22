# RealGrid2 셀 정렬: `styles.textAlignment` → `styleName`

## 문제
RealGrid **2**는 RealGrid1 문법 `styles: { textAlignment: 'near' | 'center' | 'far' }`를 **읽지 않는다**.
오류 없이 무시되고, 셀은 기본 CSS(`.rg-data-cell { text-align: center }`)대로 전부 가운데 정렬된다.
`fontWeight`, `fontBold`, `backgroundColor` 같은 다른 `styles` 속성도 마찬가지로 무시된다.

## 해결
컬럼에 `styleName`으로 CSS 클래스를 주고, 그 클래스에 스타일을 정의한다.

### 1. 공통 CSS (전역 스타일 1곳에 한 번만)
```css
/* realgrid-white.css 가 이 파일보다 늦게 로드되면 같은 특정도로는 진다 → html 을 붙여 (0,1,1) 로 이긴다 */
html .rg-align-left   { text-align: left; }
html .rg-align-center { text-align: center; }
html .rg-align-right  { text-align: right; }
html .rg-text-bold    { font-weight: 700; }
```

### 2. 변환 규칙
| 기존 (RealGrid1) | 변경 (RealGrid2) |
|---|---|
| `styles: { textAlignment: 'near' }` | `styleName: 'rg-align-left'` |
| `styles: { textAlignment: 'center' }` | `styleName: 'rg-align-center'` |
| `styles: { textAlignment: 'far' }` | `styleName: 'rg-align-right'` |
| `styles: { textAlignment: 'far', fontWeight: 'bold' }` | `styleName: 'rg-align-right rg-text-bold'` |
| `fontBold: true` | `rg-text-bold` 추가 |
| footer / groupFooter 의 `styles` | 똑같이 `styleName` (footer 기본값은 right) |
| Vue 템플릿 `:styles="{ textAlignment: 'near' }"` | `styleName="rg-align-left"` |

그 밖의 속성(예: `backgroundColor`)은 클래스를 하나 더 만들어서 옮긴다.

### 3. ⚠ `styleCallback`이 있는 컬럼
콜백이 **클래스 문자열을 반환하면 그 값이 컬럼의 `styleName`을 대체한다**(합쳐지지 않는다). 빈 문자열 `''`을 반환하면 컬럼의 `styleName`이 유지된다.
→ 콜백에서 반환하는 클래스에도 정렬 클래스를 같이 넣는다.
```js
styleName: 'rg-align-right',
styleCallback: (grid, cell) => (cell.value >= 7000 ? 'rg-align-right rg-salary-high' : '')
```

### 4. html 렌더러 컬럼
`renderer: { type: 'html' }`가 셀 안에 직접 그린 요소는 그 요소의 CSS가 이긴다(예: 내부 div에 `text-align: left`가 있으면 left).
이런 컬럼은 렌더러 쪽 CSS를 확인한다.

## 확인 방법
화면을 연 뒤 콘솔에서 셀에 클래스가 붙었는지, 실제 정렬이 무엇인지 확인한다.
```js
[...document.querySelectorAll('td.rg-data-cell')].slice(0, 15)
  .map(c => c.className + ' → ' + getComputedStyle(c).textAlign)
```
`styles`만 쓴 컬럼은 클래스가 붙지 않고 center가 나온다. `styleName`을 준 컬럼은 클래스가 붙고, 지정한 정렬이 나와야 한다.
