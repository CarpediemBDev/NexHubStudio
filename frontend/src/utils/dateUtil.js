/**
 * 날짜 포맷 유틸리티
 */

/**
 * 날짜를 'YYYY-MM-DD' 형식으로 포맷
 * @param {string|Date} dateString - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR')
}

/**
 * 날짜를 'YYYY-MM-DD HH:MM:SS' 형식으로 포맷
 * @param {string|Date} dateTimeStr - 날짜 문자열 또는 Date 객체
 * @returns {string} 포맷된 날짜/시간 문자열
 */
export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '-'
  const date = new Date(dateTimeStr)
  return date.toLocaleString('ko-KR')
}

/**
 * 상대 시간 표시 (예: '2시간 전', '3일 전')
 * @param {string|Date} dateString - 날짜 문자열 또는 Date 객체
 * @returns {string} 상대 시간 문자열
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return formatDate(dateString)
}
