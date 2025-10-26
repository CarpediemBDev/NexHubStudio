import axios from 'axios'
import { showToast } from './toastUtil.js'

// Centralized axios instance for API calls
const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Request: add no-cache header in dev by default
http.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  if (!config.headers['Cache-Control']) {
    config.headers['Cache-Control'] = 'no-store'
  }
  return config
})

// Response: global error toast
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error?.response?.data?.message ||
      error?.response?.statusText ||
      error?.message ||
      '요청 처리 중 오류가 발생했습니다.'
    try {
      showToast(`요청 실패: ${msg}`, { type: 'error', duration: 3000 })
    } catch (_) {}
    return Promise.reject(error)
  }
)

export default http
