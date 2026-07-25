/**
 * 문자열 관련 유틸리티
 */

/**
 * 문자열을 지정된 길이로 자르고 말줄임표 추가
 * @param {string} text - 원본 텍스트
 * @param {number} length - 최대 길이
 * @param {string} suffix - 말줄임표 (기본값: '...')
 * @returns {string} 잘린 문자열
 */
export function truncate(text, length, suffix = '...') {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + suffix
}

/**
 * HTML 태그 제거
 * @param {string} html - HTML 문자열
 * @returns {string} 순수 텍스트
 */
export function stripHtml(html) {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/**
 * 이메일 유효성 검사
 * @param {string} email - 이메일 주소
 * @returns {boolean} 유효 여부
 */
export function isValidEmail(email) {
  if (!email) return false
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}

/**
 * 전화번호 포맷 (010-1234-5678)
 * @param {string} phone - 전화번호
 * @returns {string} 포맷된 전화번호
 */
export function formatPhone(phone) {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  }

  return phone
}

/**
 * 숫자 천단위 콤마
 * @param {number} num - 숫자
 * @returns {string} 포맷된 숫자
 */
export function formatNumber(num) {
  if (num == null) return ''
  return num.toLocaleString()
}
