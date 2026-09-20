# RealGrid 커스텀 툴팁 가이드

> 대상: RealGrid 2.10.x (`realgrid` npm) — GridView / TreeView 공통
> 구현 위치: `AppTooltip.vue` + `tooltip.js` + `realgridTooltip.js`

## 1. 목표

RealGrid 기본 툴팁(`.rg-tooltip`) 대신 프로젝트 공통 툴팁(`.app-tooltip`)을 사용한다.

- 셀 값의 HTML을 실행하지 않고 텍스트로만 표시한다.
- 줄바꿈(`\n`)과 긴 문자열 개행을 지원한다.
- 툴팁을 클릭하면 고정하고, `Esc` / 바깥 클릭 / 닫기 버튼으로 닫는다.
- RealGrid의 기존 판단 로직(`showTooltip`, `tooltipEllipsisOnly`, `onShowTooltip`, 헤더 툴팁, 검증 오류 힌트)은 그대로 사용한다.

## 2. 구조

### 2-1. 표시부는 앱에 하나만 둔다

`src/App.vue`

```vue
<template>
  <router-view />
  <AppTooltip />
</template>
```

`AppTooltip`은 싱글톤 상태(`tooltipState`)를 화면에 그리는 호스트다. 공통 그리드 컴포넌트마다 직접 넣지 않고 앱 루트에 1개만 둔다.

이유:

- `tooltipState`가 전역 싱글톤이므로 호스트가 여러 개면 같은 툴팁이 중복 렌더링될 수 있다.
- `AppTooltip`은 전역 `pointerdown`, `keydown`, `scroll`, `resize` 리스너를 건다. 인스턴스가 하나인 편이 안전하다.
- `position: fixed` + 높은 `z-index`로 떠야 해서 그리드 래퍼 안에 두면 `overflow`, stacking context 영향을 받을 수 있다.

### 2-2. 상태와 일반 요소용 디렉티브

`src/components/common/tooltip.js`

- `showTooltip({ text, rect, owner, className, hideDuration })`
- `hideTooltip({ owner, delay })`
- `closeTooltip(owner)`
- `vTooltip`

RealGrid는 `showTooltip` / `hideTooltip` API만 직접 사용한다. `v-tooltip`은 일반 버튼/텍스트에도 같은 툴팁을 쓰고 싶을 때 쓰는 선택 기능이다.

일반 요소에서 안 쓸 계획이면 `main.js`의 `app.directive('tooltip', vTooltip)` 등록은 제거해도 된다. 단, `AppTooltip` 호스트는 유지한다.

### 2-3. RealGrid 바인더

`src/utils/realgridTooltip.js`

RealGrid 내부 `tooltipManager.show()` / `close()`를 공통 툴팁 호출로 바꾼다.

RealGrid 2.10.0 기준 내부 구조:

```js
gridView._view.tooltipManager
```

바인딩 실패 시 콘솔 경고를 남기고 RealGrid 기본 툴팁을 그대로 사용한다.

해제 함수는 그리드 destroy 전에 호출한다. 해제 시 이 그리드가 띄운 툴팁을 닫고, 덮어쓴 RealGrid 메서드를 원래 메서드로 되돌린다.

## 3. 공통 그리드 연결

다음 3개 공통 컴포넌트에서 그리드 생성 직후 바인딩한다.

- `src/components/RealGridCommonJs.vue`
- `src/components/RealGridCommonVue.vue`
- `src/components/RealGridTreeJs.vue`

```js
this._unbindTooltip = bindGridTooltip(this.gridView)
```

소멸 시:

```js
if (this._unbindTooltip) this._unbindTooltip()
```

## 4. 표시 옵션

RealGrid는 기본값으로 툴팁을 표시하지 않는다. 그래서 바인더만 붙이면 아무것도 뜨지 않는다.

공통 그리드에서는 기본으로 다음 옵션을 켠다.

```js
gridView.setDisplayOptions({
  showTooltip: true,
  tooltipEllipsisOnly: true
})

gridView.setHeader({
  showTooltip: true,
  tooltipEllipsisOnly: true
})
```

이 설정은 "말줄임이 실제로 발생한 셀/헤더"에만 툴팁을 띄운다.

`RealGridCommonJs` / `RealGridCommonVue`는 화면에서 `options` 또는 `gridOptions`로 끌 수 있다.

```vue
<RealGridCommonJs
  :options="{
    displayOptions: { showTooltip: false },
    header: { showTooltip: false }
  }"
/>
```

특정 컬럼만 끄고 싶으면 렌더러 설정에서 끈다.

```js
{
  name: 'memo',
  fieldName: 'memo',
  renderer: { type: 'text', showTooltip: false }
}
```

## 5. 문구 커스터마이징

기본 문구는 RealGrid가 계산한 셀/헤더 표시값이다.

페이지에서 기존 RealGrid 이벤트를 그대로 쓰면 된다.

```js
gridView.onShowTooltip = (grid, index, value, isEllipsis) => {
  return `${value}\n추가 설명`
}

gridView.onShowHeaderTooltip = (grid, column, value, layout, isEllipsis) => {
  return `${value}\n컬럼 설명`
}
```

`TooltipOptions` 형식도 그대로 지원한다.

```js
gridView.onShowTooltip = (grid, index, value) => ({
  message: String(value),
  hideDuration: 5000,
  styleName: 'my-tooltip-style'
})
```

주의: `message`는 `AppTooltip`에서 텍스트 보간으로 출력된다. HTML 태그는 실행되지 않고 글자로 표시된다.

## 6. 동작 확인

확인한 내용:

- `npm run build` 성공
- `/grid-studio/js` 화면에서 말줄임 헤더 hover
- 기본 `.rg-tooltip`이 아니라 `.app-tooltip`이 생성됨

예상 DOM:

```html
<div class="app-tooltip" role="tooltip">
  <div class="app-tooltip-text">성명</div>
</div>
```

## 7. 문제 해결

### 툴팁이 안 뜬다

1. `App.vue`에 `<AppTooltip />`이 1개 있는지 확인한다.
2. 공통 그리드에서 `bindGridTooltip(gridView)`가 호출되는지 확인한다.
3. `displayOptions.showTooltip` / `header.showTooltip`이 `true`인지 확인한다.
4. `tooltipEllipsisOnly: true` 상태라면 셀 내용이 실제로 말줄임 상태인지 확인한다.
5. 콘솔에 `[RealGrid] tooltipManager 를 찾지 못해...` 경고가 있으면 RealGrid 내부 구조가 바뀐 것이다.

### 툴팁이 여러 개 뜬다

`AppTooltip` 호스트가 여러 곳에 들어간 상태일 가능성이 높다. 앱 루트에 하나만 둔다.

### HTML 스타일이 적용되지 않는다

의도된 동작이다. 기본 RealGrid 툴팁은 `innerHTML`을 쓰지만, 공통 툴팁은 보안과 일관성을 위해 텍스트로만 표시한다.

### 화면별로 완전히 끄고 싶다

`RealGridCommonJs` / `RealGridCommonVue`에서는 아래처럼 끈다.

```js
{
  displayOptions: { showTooltip: false },
  header: { showTooltip: false }
}
```

Tree 공통 컴포넌트에서 화면별 제어가 필요하면 `options` prop을 추가해 같은 방식으로 `setDisplayOptions` / `setHeader`에 병합한다.
