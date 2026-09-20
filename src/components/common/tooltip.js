/**
 * tooltip.js — 공통 툴팁 (화면에 하나만 뜨는 싱글톤)
 * =============================================================================
 * 표시는 App.vue 에 한 번 둔 <AppTooltip /> 가 맡고, 여기는 상태와 열고 닫는 API 만 둔다.
 *
 *  - 긴 문자열은 줄바꿈(\n 유지 + 폭 넘으면 자동 개행), 너무 길면 툴팁 안에서 스크롤
 *  - 툴팁을 클릭하면 고정 → 마우스가 떠나도 안 닫힌다. ×·Esc·바깥 클릭·화면 이동으로 닫힘
 *  - 고정된 동안 다른 곳에 hover 해도 새 툴팁을 띄우지 않는다(고정한 내용을 읽는 중이므로)
 *
 * 사용처
 *  - 일반 요소: v-tooltip="'문구'"  (main.js 에서 전역 등록)
 *  - RealGrid : 공통 그리드 컴포넌트가 bindGridTooltip 으로 연결 (src/utils/realgridTooltip.js)
 */
import { reactive } from 'vue'

// 셀/요소를 벗어나 툴팁으로 마우스를 옮기는 사이에 닫히지 않도록 주는 여유
const HIDE_DELAY = 150

export const tooltipState = reactive({
  visible: false,
  pinned: false,
  text: '',
  className: '',
  // 기준 영역(셀·요소)의 화면 좌표. 툴팁은 기본으로 그 아래(bottom)에, 공간이 없으면 위(top)에 뜬다.
  left: 0,
  top: 0,
  bottom: 0,
  owner: null // 누가 띄웠는지(그리드 인스턴스·요소). 다른 곳의 닫기 요청이 남의 툴팁을 닫지 않게 한다.
})

let hideTimer = null
let durationTimer = null
let hovered = false

function clearTimers() {
  clearTimeout(hideTimer)
  clearTimeout(durationTimer)
  hideTimer = durationTimer = null
}

/**
 * @param {object} opts
 * @param {string} opts.text        표시할 문자열 (HTML 아님 — 그대로 글자로 표시)
 * @param {{left:number, top:number, bottom:number}} opts.rect  기준 영역의 화면(viewport) 좌표
 * @param {*}      [opts.owner]     띄운 주체. hideTooltip/closeTooltip 에 같은 값을 넘긴다
 * @param {string} [opts.className] 툴팁에 붙일 추가 클래스
 * @param {number} [opts.hideDuration] ms 뒤 자동으로 닫힘(고정·hover 중이면 유지)
 * @returns {boolean} 표시했으면 true (고정된 툴팁이 있으면 false)
 */
export function showTooltip({ text, rect, owner = null, className = '', hideDuration = 0 }) {
  if (tooltipState.pinned) return false
  const message = text == null ? '' : String(text)
  if (!message) return false

  clearTimers()
  hovered = false
  Object.assign(tooltipState, {
    visible: true,
    text: message,
    className,
    left: rect.left,
    top: rect.top,
    bottom: rect.bottom,
    owner
  })
  if (hideDuration > 0) {
    durationTimer = setTimeout(() => hideTooltip({ owner, delay: 0 }), hideDuration)
  }
  return true
}

/** hover 가 끝났을 때. 고정됐거나 마우스가 툴팁 위에 있으면 닫지 않는다. */
export function hideTooltip({ owner, delay = HIDE_DELAY } = {}) {
  if (!tooltipState.visible || tooltipState.pinned) return
  if (owner !== undefined && owner !== tooltipState.owner) return
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    if (!tooltipState.pinned && !hovered) reset()
  }, delay)
}

/** 고정 여부와 상관없이 즉시 닫는다. owner 를 주면 그 주체가 띄운 툴팁일 때만. */
export function closeTooltip(owner) {
  if (owner !== undefined && owner !== tooltipState.owner) return
  reset()
}

export function pinTooltip() {
  if (!tooltipState.visible) return
  clearTimers()
  tooltipState.pinned = true
}

/** AppTooltip 이 마우스 진입/이탈을 알려준다 */
export function setTooltipHovered(value) {
  hovered = value
  if (value) clearTimeout(hideTimer)
  else hideTooltip()
}

function reset() {
  clearTimers()
  hovered = false
  Object.assign(tooltipState, { visible: false, pinned: false, text: '', className: '', owner: null })
}

// =============================================================================
// v-tooltip 디렉티브 — 일반 요소용
//   <button v-tooltip="'저장하지 않은 변경이 있습니다'">
//   <span v-tooltip="{ text: longText, delay: 0 }">
// =============================================================================
const SHOW_DELAY = 300

function readBinding(value) {
  return value && typeof value === 'object' ? value : { text: value }
}

export const vTooltip = {
  mounted(el, binding) {
    el._tooltip = readBinding(binding.value)
    el._tooltipEnter = () => {
      clearTimeout(el._tooltipTimer)
      const { delay = SHOW_DELAY } = el._tooltip
      el._tooltipTimer = setTimeout(() => {
        const r = el.getBoundingClientRect()
        showTooltip({ text: el._tooltip.text, rect: r, owner: el, className: el._tooltip.className })
      }, delay)
    }
    el._tooltipLeave = () => {
      clearTimeout(el._tooltipTimer)
      hideTooltip({ owner: el })
    }
    el.addEventListener('mouseenter', el._tooltipEnter)
    el.addEventListener('mouseleave', el._tooltipLeave)
  },
  updated(el, binding) {
    el._tooltip = readBinding(binding.value)
    // 떠 있는 동안 문구가 바뀌면 바로 반영
    if (tooltipState.owner === el) {
      if (el._tooltip.text) tooltipState.text = String(el._tooltip.text)
      else closeTooltip(el)
    }
  },
  beforeUnmount(el) {
    clearTimeout(el._tooltipTimer)
    el.removeEventListener('mouseenter', el._tooltipEnter)
    el.removeEventListener('mouseleave', el._tooltipLeave)
    closeTooltip(el)
  }
}
