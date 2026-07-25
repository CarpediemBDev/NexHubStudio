// src/utils/utils.js
/**
toastMsg('저장 완료',   { type: 'success' })  // 초록
toastMsg('유효성 오류', { type: 'danger'  })  // 빨강
toastMsg('알림',       { type: 'info'    })  // 하늘색
toastMsg('주의',       { type: 'warning' })  // 노랑
toastMsg('기본',       { type: 'dark'    })  // 진한 회색(검정톤)

 */
let container = null
// 토스트 컨테이너 생성
function getToastContainer() {
  if (container) return container
  container = document.createElement('div')
  container.className = 'toast-container position-fixed bottom-0 end-0 p-3'
  container.style.zIndex = '2000'
  document.body.appendChild(container)
  return container
}
// 토스트 생성
export function showToast(text, { type = 'success', duration = 2000 } = {}) {
  const c = getToastContainer()

  const el = document.createElement('div')
  el.className = `toast text-bg-${type} border-0 show mb-2`
  el.style.display = 'block'
  el.setAttribute('role', 'alert')
  el.setAttribute('aria-live', 'assertive')
  el.setAttribute('aria-atomic', 'true')

  const row = document.createElement('div')
  row.className = 'd-flex'

  const body = document.createElement('div')
  body.className = 'toast-body'
  body.textContent = String(text ?? '') // XSS 안전

  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'btn-close btn-close-white me-2 m-auto'
  close.setAttribute('aria-label', 'Close')

  row.appendChild(body)
  row.appendChild(close)
  el.appendChild(row)
  c.appendChild(el)

  const timer = duration > 0 ? setTimeout(() => el.remove(), duration) : null
  close.addEventListener('click', () => {
    if (timer) clearTimeout(timer)
    el.remove()
  })
}
