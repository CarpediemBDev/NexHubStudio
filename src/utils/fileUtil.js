/**
 * 파일 관련 유틸리티
 */

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string} 포맷된 파일 크기 (예: '1.5 MB')
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 파일 확장자 추출
 * @param {string} filename - 파일명
 * @returns {string} 확장자 (점 포함)
 */
export function getFileExtension(filename) {
  if (!filename) return ''
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.substring(lastDot)
}

/**
 * 파일 타입에 따른 아이콘 클래스 반환
 * @param {string} contentType - MIME 타입
 * @returns {string} Bootstrap 아이콘 클래스
 */
export function getFileIcon(contentType) {
  if (!contentType) return 'bi bi-file'

  if (contentType.startsWith('image/')) return 'bi bi-file-image text-primary'
  if (contentType.startsWith('video/')) return 'bi bi-file-play text-danger'
  if (contentType.startsWith('audio/')) return 'bi bi-file-music text-info'
  if (contentType.includes('pdf')) return 'bi bi-file-pdf text-danger'
  if (contentType.includes('word') || contentType.includes('document'))
    return 'bi bi-file-word text-primary'
  if (contentType.includes('excel') || contentType.includes('spreadsheet'))
    return 'bi bi-file-excel text-success'
  if (contentType.includes('powerpoint') || contentType.includes('presentation'))
    return 'bi bi-file-ppt text-warning'
  if (contentType.includes('zip') || contentType.includes('compressed'))
    return 'bi bi-file-zip text-secondary'
  if (contentType.includes('text/')) return 'bi bi-file-text'

  return 'bi bi-file'
}
