/**
 * 사이트 테마(다크/라이트) 알아내기. 세계지도 SVG 를 테마에 맞는 파일로 바꿔 끼울 때 쓴다.
 * 다른 프로젝트로 그대로 복사해 가는 파일이다.
 *
 * 이 사이트는 <html data-theme="..."> 로 테마를 바꾼다. "dark", "dark-navy" 처럼 dark 로 시작하면 다크.
 * 다른 프로젝트가 다른 방식(예: <html class="dark">)이면 isSiteDark 와 감시 대상(attributeFilter)만 고치면 된다.
 */
const root = () => document.documentElement

/** 지금 사이트가 다크 테마인지 */
export function isSiteDark() {
  return (root().getAttribute('data-theme') || '').startsWith('dark')
}

/**
 * 테마가 바뀔 때마다 cb(다크 여부) 를 부른다. 그만 볼 때 부를 함수를 돌려준다 (beforeUnmount 에서 호출)
 * 사용자가 상단 테마 버튼을 누르는 순간 지도도 바로 바뀌게 하려고 html 속성 변화를 지켜본다
 */
export function onSiteThemeChange(cb) {
  const observer = new MutationObserver(() => cb(isSiteDark()))
  observer.observe(root(), { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
