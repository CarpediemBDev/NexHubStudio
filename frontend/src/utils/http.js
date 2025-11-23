import axios from 'axios'
import { showToast } from './toastUtil.js'

// Centralized axios instance for API calls
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

// Response: global error toast
http.interceptors.response.use(
  (response) => {
    // 응답 구조가 { data: { data: ..., message: ... } } 형태면 자동 파싱
    if (response.data && response.data.data !== undefined) {
      // success가 false인 경우 에러로 처리
      if (response.data.success === false) {
        const errorMsg = response.data.message || '요청 처리 중 오류가 발생했습니다.'
        showToast(errorMsg, { type: 'error', duration: 3000 })
        return Promise.reject(new Error(errorMsg))
      }
      return response.data
    }
    return response
  },
  (error) => {
    const msg =
      error?.response?.data?.message || error.message || '요청 처리 중 오류가 발생했습니다.'
    showToast(`요청 실패: ${msg}`, { type: 'error', duration: 3000 })
    return Promise.reject(error)
  }
)

export default http
