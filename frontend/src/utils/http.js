// API 응답 파서: code, message, data 구조와 단순 데이터 모두 지원
export function parseApiResponse(res) {
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return {
      code: res.data.code ?? 200,
      message: res.data.message ?? '',
      data: res.data.data,
    }
  }
  return { code: 200, message: '', data: res.data }
}
import axios from 'axios'
import { showToast } from './toastUtil.js'

// Centralized axios instance for API calls
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
