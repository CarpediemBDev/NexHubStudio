# Vue to HTML 변환 스크립트

Vue SFC(Single File Component) 파일을 독립 실행 가능한 HTML 파일로 변환하는 도구입니다.

## 사용법

### 기본 사용
```bash
node frontend/scripts/convert-vue-to-html.js <vue파일경로> [출력파일명]
```

### 예시
```bash
# 기본 사용 (자동 파일명)
node frontend/scripts/convert-vue-to-html.js frontend/src/pages/WorkRequestFormPage.vue

# 출력 파일명 지정
node frontend/scripts/convert-vue-to-html.js frontend/src/pages/WorkRequestFormPage.vue my-page.html
```

## 출력 위치
`frontend/` 폴더에 HTML 파일이 생성됩니다.

## 기능

### ✅ 자동 처리
- `<template>` 섹션 → HTML body
- `<script>` 섹션 → Vue CDN 코드로 변환
- `<style>` 섹션 → 그대로 유지
- Bootstrap 5 + Bootstrap Icons CDN 자동 추가
- Vue 3 CDN 자동 추가
- `import` 문 자동 제거
- `export default` 자동 제거
- `components` 섹션 자동 제거

### ⚠️ 자동 대체
- `openUserPopup()` → 빈 배열 반환
- `this.$refs.progressGrid` → 콘솔 로그
- `this.$router.push` → 콘솔 로그

## 지원 범위

### ✅ 잘 작동하는 경우
- 단순 폼, 테이블, 리스트 페이지
- Bootstrap, CSS 애니메이션만 사용
- Vue 기본 문법 (v-for, v-if, v-model, @click 등)
- 단일 컴포넌트 페이지

### ⚠️ 수동 수정 필요
- 외부 컴포넌트 import
- Vue Router 사용
- Vuex/Pinia 스토어
- 커스텀 디렉티브
- Composition API

### ❌ 변환 불가능
- TypeScript (.vue with `<script lang="ts">`)
- Webpack 전용 로더 (SASS, LESS 등)
- 빌드 타임 환경변수

## 주의사항

1. **외부 컴포넌트**: `JqxCustomeGrid` 같은 외부 컴포넌트는 자동 제거되므로 해당 기능이 작동하지 않습니다.
2. **Vue Router**: 라우팅 기능은 콘솔 로그로 대체됩니다.
3. **인터넷 연결**: Bootstrap, Vue CDN을 사용하므로 인터넷 연결이 필요합니다.

## 출력 파일 구조

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <!-- Bootstrap CSS CDN -->
  <!-- Bootstrap Icons CDN -->
  <style>
    /* Vue 파일의 <style> 내용 */
  </style>
</head>
<body>
  <div id="app">
    <!-- Vue 파일의 <template> 내용 -->
  </div>

  <!-- Vue 3 CDN -->
  <script>
    const { createApp } = Vue;
    createApp({
      /* Vue 파일의 <script> 내용 */
    }).mount('#app');
  </script>
</body>
</html>
```

## 트러블슈팅

### 브라우저에서 `{{ }}` 문법이 그대로 보임
- 브라우저 콘솔(F12)을 열어 JavaScript 에러 확인
- Vue CDN 로드 실패 또는 JavaScript 문법 에러 가능성

### 일부 기능이 작동하지 않음
- 외부 컴포넌트나 라이브러리가 제거되었을 가능성
- 생성된 HTML 파일에서 해당 기능을 수동으로 구현 필요

### 스타일이 깨짐
- Bootstrap CDN 버전 확인
- `<style scoped>` 속성은 제거되므로 스타일 충돌 가능

## 예시 출력

변환 성공 시 다음과 같은 메시지가 출력됩니다:

```
✅ 변환 완료!
📄 입력: frontend/src/pages/WorkRequestFormPage.vue
📄 출력: D:\dev\workspace\NexHubStudio\frontend\work-request-form.html

🚀 사용법:
   브라우저에서 work-request-form.html 파일을 열면 됩니다.

⚠️  주의사항:
   - 외부 컴포넌트(import)는 수동으로 처리해야 합니다.
   - Vue Router는 CDN에서 별도로 추가해야 합니다.
   - 복잡한 빌드 설정은 반영되지 않습니다.
```

## 라이선스

이 스크립트는 프로젝트 내부 도구로 자유롭게 사용 가능합니다.
