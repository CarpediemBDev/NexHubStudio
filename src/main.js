import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import RealGrid from 'realgrid'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { showToast } from './utils/toastUtil.js'

// Global RealGrid License Registration
const REALGRID_LICENSE_KEY = 'upVcPE+wPOmtLjqyBIh9RkM/nBOseBrflwxYpzGZyYm9cY8amGDkiMnVeQKUHJDjW2y71jtk+wte7L7C4dZzvAQJWvkYy9V+QpwmX48tCKehFoMe5uSeYufUj4hn1OLrPa/ZZTiSPjmVFt7dhTvzBQ=='
RealGrid.setLicenseKey(REALGRID_LICENSE_KEY)

createApp(App)
  .use(router)
  .use((app) => (app.config.globalProperties.$toast = (text, opts) => showToast(text, opts))) // ← 한 줄
  .mount('#app')

