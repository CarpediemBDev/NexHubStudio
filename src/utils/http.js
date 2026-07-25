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
    // 백엔드는 항상 { code, message, data } 형태의 ApiResponse로 응답
    // Axios response.data에는 { code, message, data }가 들어있음
    // 이를 그대로 반환하여 컴포넌트에서 response.code, response.message, response.data로 접근
    return response.data
  },
  (error) => {
    const msg =
      error?.response?.data?.message || error.message || '요청 처리 중 오류가 발생했습니다.'
    showToast(`요청 실패: ${msg}`, { type: 'error', duration: 3000 })
    return Promise.reject(error)
  }
)

export default http
