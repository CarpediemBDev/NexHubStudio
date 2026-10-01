import { reactive, watch } from 'vue'
import { MAP_STYLES } from './mapStyles'
import { TILE_STYLES, tileStyleOf } from './tileRender'

const STYLE_KEY = 'worldMap.style'
const TILE_KEY = 'worldMap.tileStyle'

function load(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch { return fallback }
}

const storedStyle = load(STYLE_KEY, MAP_STYLES[0].key)
export const worldMapDesign = reactive({
  styleKey: MAP_STYLES.some((style) => style.key === storedStyle) ? storedStyle : MAP_STYLES[0].key,
  tileStyleKey: tileStyleOf(load(TILE_KEY, TILE_STYLES[0].key)).key,
  tilesEnabled: true,
  // 지도 애니메이션(연결선 빛·본사 펄스·지구본 회전). 지도 스타일·레이아웃 탭이 같이 쓴다
  playing: true,
  // 거점·연결선: 서울 본사 표시(펄스 포함), 해외 거점 점, 서울에서 뻗는 연결선, 도시 라벨을 한꺼번에 켜고 끈다
  showMarkers: true
})

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
