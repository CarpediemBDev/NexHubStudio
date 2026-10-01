import { reactive, watch } from 'vue'
import { MAP_STYLES } from './mapStyles'
import { TILE_STYLES, tileStyleOf } from './tileRender'
import { styleForTone } from './themeVariant'

const STYLE_KEY = 'worldMap.style'
const TILE_KEY = 'worldMap.tileStyle'
const THEME_KEY = 'worldMap.themeMode'

// 다크·라이트 두 카드였다가 한 디자인으로 합친 키. 예전에 저장된 선택도 이어서 쓴다
const MERGED_KEYS = {
  'globe-dark-dot': 'globe-dot',
  'globe-light-dot': 'globe-dot',
  'atlas-focus-light': 'atlas-focus',
  'atlas-focus-dark': 'atlas-focus'
}

function load(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch { return fallback }
}

/** 사이트 테마(<html data-theme="light | dark | dark-navy">)가 다크 계열인지 */
function readSiteDark() {
  if (typeof document === 'undefined') return false
  return (document.documentElement.getAttribute('data-theme') || '').startsWith('dark')
}

const storedStyle = MERGED_KEYS[load(STYLE_KEY, '')] || load(STYLE_KEY, MAP_STYLES[0].key)
const storedTheme = load(THEME_KEY, 'auto')
export const worldMapDesign = reactive({
  styleKey: MAP_STYLES.some((style) => style.key === storedStyle) ? storedStyle : MAP_STYLES[0].key,
  tileStyleKey: tileStyleOf(load(TILE_KEY, TILE_STYLES[0].key)).key,
  tilesEnabled: true,
  // 지도 애니메이션(연결선 빛·본사 펄스·지구본 회전). 지도 스타일·레이아웃 탭이 같이 쓴다
  playing: true,
  // 거점·연결선: 서울 본사 표시(펄스 포함), 해외 거점 점, 서울에서 뻗는 연결선, 도시 라벨을 한꺼번에 켜고 끈다
  showMarkers: true,
  // 지도 테마: 'auto' 면 사이트 테마를 따라가고, 'light' | 'dark' 면 고정
  themeMode: ['auto', 'light', 'dark'].includes(storedTheme) ? storedTheme : 'auto',
  // 지금 사이트가 다크 테마인지 (아래 MutationObserver 가 따라 바꾼다)
  siteDark: readSiteDark()
})

// 사이트 테마 버튼을 누르면 <html data-theme> 이 바뀐다 → 지켜보다가 따라 바꾼다
if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
  new MutationObserver(() => { worldMapDesign.siteDark = readSiteDark() })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}

/** 지금 그릴 테마: 자동이면 사이트 테마, 아니면 고른 테마 */
export function currentTone() {
  if (worldMapDesign.themeMode === 'auto') return worldMapDesign.siteDark ? 'dark' : 'light'
  return worldMapDesign.themeMode
}

/** 디자인을 지금 테마 색으로 (tone 을 주면 그 테마로) */
export function themedStyle(style, tone = currentTone()) {
  return styleForTone(style, tone)
}

/** 지금 고른 디자인 (원본, 테마 적용 전) */
export function selectedStyle() {
  return MAP_STYLES.find((style) => style.key === worldMapDesign.styleKey) || MAP_STYLES[0]
}

/**
 * 거점·연결선 켜기/끄기를 반영한 디자인. 세 엔진(Canvas·SVG·ECharts) 모두 fx: false 면
 * 연결선·거점·본사 표시를 그리지 않는다 (지도 면·도트·권역 타일은 그대로)
 */
export function withMarkers(style, on = worldMapDesign.showMarkers) {
  if (on || style.fx === false) return style
  return { ...style, fx: false }
}

watch(() => worldMapDesign.styleKey, (key) => {
  try { localStorage.setItem(STYLE_KEY, key) } catch { /* 브라우저 저장이 막혀도 현재 탭에서는 유지 */ }
})
watch(() => worldMapDesign.tileStyleKey, (key) => {
  try { localStorage.setItem(TILE_KEY, key) } catch { /* 브라우저 저장이 막혀도 현재 탭에서는 유지 */ }
})
watch(() => worldMapDesign.themeMode, (mode) => {
  try { localStorage.setItem(THEME_KEY, mode) } catch { /* 브라우저 저장이 막혀도 현재 탭에서는 유지 */ }
})
