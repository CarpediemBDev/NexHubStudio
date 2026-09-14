import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vValidation from './directives/validation'
import vValidatedForm from './directives/validatedForm'
import { showToast } from './utils/toastUtil'
import './utils/mdEditorLocale' // md-editor-v3 한국어 로케일 전역 등록

// Pretendard 를 번들로 포함한다. CDN 을 쓰지 않으므로 폐쇄망에서도 동일하게 렌더된다.
// dynamic-subset 은 unicode-range 로 쪼개져 있어 실제 사용된 글자 구간만 내려받는다.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/styles/tokens.css'
import './assets/styles/layout.css'
import './assets/styles/buttons.css'
import './assets/styles/grid-theme.css'
import './assets/styles/datepicker-theme.css'

import * as RealGrid from 'realgrid'

// Global RealGrid License Registration
const REALGRID_LICENSE_KEY = 'upVcPE+wPOmtLjqyBIh9RkM/nBOseBrflwxYpzGZyYm9cY8amGDkiMnVeQKUHJDjW2y71jtk+wte7L7C4dZzvC13PZeE/SzJMj6mQjHQ4H+xW1kwqJommFhawX9u88+wAjklE6WU3+RrEt8IFCvIvg=='
if (typeof RealGrid?.setLicenseKey === 'function') {
  RealGrid.setLicenseKey(REALGRID_LICENSE_KEY)
} else if (typeof RealGrid?.default?.setLicenseKey === 'function') {
  RealGrid.default.setLicenseKey(REALGRID_LICENSE_KEY)
}

// showToast를 전역으로 노출
window.showToast = showToast

/**
 * 목업 모드(npm run dev)에서는 MSW 가 axios 요청을 네트워크 단계에서 가로채
 * src/mocks/handlers 가 응답한다. 화면과 src/api 코드는 두 모드에서 동일하다.
 *
 * 실제 모드(npm run dev:api)와 빌드에서는 이 블록을 통째로 건너뛴다.
 * 동적 import 라서 msw 가 실서비스 번들에 포함되지 않는다.
 */
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return true
  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
    return true
  } catch (e) {
    // 서비스워커를 못 쓰는 환경(일부 내장 브라우저, 사이트 데이터 차단 등)에서도 화면은 떠야 한다.
    // 실패를 삼키면 요청이 조용히 프록시(백엔드)로 나가 "목업인 줄 알았는데 실데이터"가 되므로 반드시 알린다.
    console.error('[MSW] 목업 모드 시작 실패 — /api 요청이 vite 프록시(백엔드)로 나갑니다.', e)
    return false
  }
}

// 워커가 뜨기 전에 화면이 먼저 요청을 날리면 그 요청은 가로채지지 않으므로 mount 를 뒤로 미룬다
enableMocking().then((mocked) => {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.directive('validation', vValidation)
  app.directive('validated-form', vValidatedForm)
  app.mount('#app')
  if (!mocked) {
    showToast('목업 모드를 시작하지 못했습니다. 데이터 요청이 백엔드로 전송됩니다.', { type: 'error', duration: 6000 })
  }
})
