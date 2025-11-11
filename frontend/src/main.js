import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vValidation from './directives/validation'
import vValidatedForm from './directives/validatedForm'
import { showToast } from './utils/toastUtil'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'

// showToast를 전역으로 노출
window.showToast = showToast

const app = createApp(App)
app.use(router)
app.directive('validation', vValidation)
app.directive('validated-form', vValidatedForm)
app.mount('#app')
