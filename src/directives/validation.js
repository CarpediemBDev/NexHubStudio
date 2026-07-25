// v-validation 커스텀 디렉티브
export default {
  mounted(el, binding) {
    const rules = binding.value || {}
    const input =
      el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el : el.querySelector('input, textarea')

    if (!input) return

    // 유효성 검사 함수
    const validate = () => {
      const value = input.value.trim()
      let errorMessage = ''

      // required 체크
      if (rules.required && !value) {
        errorMessage = rules.requiredMessage || '필수 입력 항목입니다.'
      }
      // minLength 체크
      else if (rules.minLength && value.length > 0 && value.length < rules.minLength) {
        errorMessage = rules.minLengthMessage || `최소 ${rules.minLength}자 이상 입력하세요.`
      }
      // maxLength 체크
      else if (rules.maxLength && value.length > rules.maxLength) {
        errorMessage = rules.maxLengthMessage || `최대 ${rules.maxLength}자까지 입력 가능합니다.`
      }

      // 에러 메시지 표시/제거
      let errorDiv = el.querySelector('.validation-error')

      if (errorMessage) {
        // 에러 추가
        input.classList.add('is-invalid')

        if (!errorDiv) {
          errorDiv = document.createElement('div')
          errorDiv.className = 'validation-error text-danger mt-1 small'
          errorDiv.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i>${errorMessage}`

          // form-text 숨기기
          const formText = el.querySelector('.form-text')
          if (formText) {
            formText.style.display = 'none'
          }
          input.parentElement.appendChild(errorDiv)
        } else {
          errorDiv.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i>${errorMessage}`
        }
      } else {
        // 에러 제거
        input.classList.remove('is-invalid')

        // form-text 다시 표시
        const formText = el.querySelector('.form-text')
        if (formText) {
          formText.style.display = 'block'
        }

        if (errorDiv) {
          errorDiv.remove()
        }
      }

      return !errorMessage
    }

    // 이벤트 리스너 등록
    input.addEventListener('blur', validate)
    input.addEventListener('input', () => {
      if (input.classList.contains('is-invalid')) {
        validate()
      }
    })
  },

  unmounted(el) {
    // 이벤트 리스너는 자동으로 정리됨
  },
}
