// v-validated-form 디렉티브 - 폼 제출 시 자동 검증
export default {
  mounted(el) {
    const form = el.tagName === 'FORM' ? el : el.querySelector('form')
    if (!form) return

    const originalSubmitHandler = form.onsubmit

    // submit 이벤트 가로채기
    form.addEventListener(
      'submit',
      (e) => {
        // 모든 검증 필드 찾기
        const fields = form.querySelectorAll('[data-validation]')
        let hasError = false
        let firstError = null

        fields.forEach((field) => {
          if (field._validate && !field._validate()) {
            hasError = true
            if (!firstError) firstError = field.querySelector('input, textarea')
          }
        })

        if (hasError) {
          e.preventDefault()
          e.stopPropagation()
          firstError?.focus()

          // Toast 표시 (showToast가 전역에 있다면)
          if (window.showToast) {
            window.showToast('warning', '입력 내용을 확인해주세요.')
          }
          return false
        }
      },
      true
    ) // capture phase에서 처리
  },
}
