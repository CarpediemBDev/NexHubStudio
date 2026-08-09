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
 * 마크다운 문법 기호를 제거해 순수 텍스트로 변환
 * (목록 미리보기 등에서 '#', '**' 같은 원시 기호 노출 방지용)
 * @param {string} md - 마크다운 문자열
 * @returns {string} 서식 기호가 제거된 순수 텍스트(한 줄)
 */
export function stripMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/```[\s\S]*?```/g, (b) => b.replace(/```[^\n]*\n?/g, '').replace(/```/g, '')) // 코드펜스 마커 제거(내용 유지)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 이미지 ![alt](url) → 제거
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크 [text](url) → text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // 헤딩 # 제거
    .replace(/^\s{0,3}>\s?/gm, '') // 인용 > 제거
    .replace(/^\s*[-*+]\s+(\[[ xX]\]\s+)?/gm, '') // 목록/체크리스트 마커 제거
    .replace(/^\s*\d+\.\s+/gm, '') // 번호 목록 제거
    .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, ' ') // 표 구분선 제거
    .replace(/\|/g, ' ') // 표 파이프 → 공백
    .replace(/(\*\*|__|~~)(.*?)\1/g, '$2') // **굵게** ~~취소~~ 제거
    .replace(/(\*|_)(.*?)\1/g, '$2') // *기울임* 제거
    .replace(/`([^`]*)`/g, '$1') // `인라인코드` 제거
    .replace(/<[^>]+>/g, '') // 남은 HTML 태그 제거
    .replace(/\s+/g, ' ') // 공백·개행 → 한 줄
    .trim()
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
