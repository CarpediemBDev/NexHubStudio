# 다크모드 적용 가이드 (복붙용)

> CSS 변수(Custom Properties) 기반. 색을 **한 곳에서만** 정의하면 라이트/다크가 자동 전환됩니다.
> 디자이너가 요소를 하나씩 수정할 필요 없이, 변수값만 바꾸면 전체가 따라옵니다.
> 어떤 프로젝트(Vue / React / 순수 HTML)든 그대로 붙여넣기 가능.

---

## 왜 `filter: invert()` 트릭은 안 쓰나?

빠르지만 실서비스엔 부적합합니다.

| 문제 | 설명 |
|------|------|
| 색 왜곡 | `hue-rotate`로 보정해도 브랜드색·파랑 계열이 탁해짐. "진짜 다크"가 아니라 "반전" |
| 예외 처리 지옥 | img/video 외에 SVG 아이콘, background-image, box-shadow, iframe, **canvas**, 로고까지 전부 개별 재반전 필요 |
| 성능 | `<html>` 전체 filter → 스크롤/리페인트마다 GPU 부담 |
| `position: fixed` 깨짐 | filter가 새 stacking context를 만들어 고정 헤더/모달 어긋남 |

➡️ 아래 **CSS 변수 방식**이 초기 세팅만 조금 더 걸릴 뿐, 장기적으로 훨씬 쉽고 안전합니다.

---

## 1단계 — 색상 변수 정의 (핵심)

여기서 색을 **의미 단위**로 정의합니다. `#파랑` 같은 실제 색 대신 `--color-primary` 같은 **역할 이름**을 쓰는 게 포인트.

```css
/* global.css (또는 앱 최상단 CSS) */

:root {
  /* ── 라이트 모드 (기본값) ── */
  --bg:         #ffffff;   /* 페이지 배경 */
  --surface:    #f5f5f5;   /* 카드·패널 배경 */
  --text:       #1a1a1a;   /* 본문 글자 */
  --text-muted: #6b7280;   /* 보조 글자 */
  --border:     #e0e0e0;   /* 테두리·구분선 */
  --primary:    #2563eb;   /* 강조색(버튼 등) */
  --shadow:     rgba(0, 0, 0, 0.08);
}

:root.dark {
  /* ── 다크 모드 (변수값만 덮어씀) ── */
  --bg:         #1a1a1a;
  --surface:    #262626;
  --text:       #e8e8e8;
  --text-muted: #9ca3af;
  --border:     #3a3a3a;
  --primary:    #60a5fa;   /* 다크에선 살짝 밝게 */
  --shadow:     rgba(0, 0, 0, 0.4);
}
```

## 2단계 — 실제 스타일에서 변수 사용

이제 컴포넌트 CSS는 **하드코딩된 색을 절대 쓰지 않고** 변수만 참조합니다.
디자이너는 앞으로 1단계 값만 만지면 됩니다.

```css
body {
  background: var(--bg);
  color: var(--text);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 2px 8px var(--shadow);
}

.btn-primary {
  background: var(--primary);
  color: #fff;
}

.text-sub {
  color: var(--text-muted);
}
```

## 3단계 — 부드러운 전환 (선택)

```css
body, .card, .btn-primary {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

---

## 토글 방식 — 필요한 것만 선택

### A. 버튼으로만 켜고 끄기 (제일 단순)

```javascript
// 버튼 클릭 시
document.documentElement.classList.toggle('dark');

// 선택 저장 (새로고침해도 유지)
localStorage.setItem(
  'theme',
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'
);
```

```javascript
// 페이지 로드 시 저장값 복원
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}
```

### B. 시스템 설정 자동 감지 + 버튼으로 덮어쓰기 (완성도 ↑)

먼저 CSS에 "OS가 다크인데 사용자가 라이트를 강제하지 않았으면 다크" 규칙 추가:

```css
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --bg:         #1a1a1a;
    --surface:    #262626;
    --text:       #e8e8e8;
    --text-muted: #9ca3af;
    --border:     #3a3a3a;
    --primary:    #60a5fa;
    --shadow:     rgba(0, 0, 0, 0.4);
  }
}
```

우선순위:
```
1순위: 사용자가 버튼으로 고른 값 (.dark / .light 클래스)
2순위: OS 설정 (@media prefers-color-scheme)
3순위: 기본값(라이트)
```

로드 시 초기화 스크립트 (깜빡임 방지 위해 `<head>` 안 맨 위에서 실행 권장):

```javascript
(function () {
  const saved = localStorage.getItem('theme'); // 'dark' | 'light' | null
  const root = document.documentElement;
  if (saved === 'dark')  root.classList.add('dark');
  if (saved === 'light') root.classList.add('light');
  // saved가 null이면 아무 클래스도 안 붙음 → @media가 OS 설정대로 처리
})();
```

버튼 핸들러:

```javascript
function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark')
    || (!root.classList.contains('light')
        && window.matchMedia('(prefers-color-scheme: dark)').matches);

  root.classList.remove('dark', 'light');
  root.classList.add(isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}
```

---

## Vue에서 쓰는 경우 (이 프로젝트 스타일)

```javascript
// main.js 등 앱 진입점 - 로드 시 1회
const saved = localStorage.getItem('theme');
if (saved === 'dark')  document.documentElement.classList.add('dark');
if (saved === 'light') document.documentElement.classList.add('light');
```

```vue
<script>
export default {
  methods: {
    toggleTheme() {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      root.classList.remove('dark', 'light');
      root.classList.add(isDark ? 'light' : 'dark');
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    },
  },
};
</script>

<template>
  <button @click="toggleTheme">🌙 / ☀️</button>
</template>
```

---

## 디자이너에게 전달할 핵심 한 줄

> **"색은 컴포넌트마다 넣지 말고, 맨 위 `:root` 변수 목록에서만 정하세요.
> 다크모드는 `:root.dark`에 같은 변수의 다른 값만 채우면 자동으로 됩니다."**

이렇게 하면 화면 하나하나 손댈 필요 없이, 변수 표 하나만 관리하면 됩니다.

---

## 흔한 실수 체크리스트

- [ ] 컴포넌트 CSS에 `#ffffff`, `#333` 같은 **하드코딩 색이 남아있지 않은지** (전부 `var(--...)`로)
- [ ] 이미지·아이콘이 흰 배경 전제로 만들어졌다면 다크에서 잘 보이는지 확인 (투명 PNG / SVG `currentColor` 권장)
- [ ] 로드 시 라이트→다크 **깜빡임(FOUC)**: 초기화 스크립트를 CSS/렌더 전에 실행
- [ ] 그림자는 다크에서 더 진하게 (`--shadow` 값 조정)
- [ ] 대비(contrast) 확인: 다크 배경에 너무 어두운 글자 색 피하기
