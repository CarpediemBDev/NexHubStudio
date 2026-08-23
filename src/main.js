import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vValidation from './directives/validation'
import vValidatedForm from './directives/validatedForm'
import { showToast } from './utils/toastUtil'
import './utils/mdEditorLocale' // md-editor-v3 한국어 로케일 전역 등록

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

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.directive('validation', vValidation)
app.directive('validated-form', vValidatedForm)
app.mount('#app')
