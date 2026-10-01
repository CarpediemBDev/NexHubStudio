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
  tilesEnabled: true
})

watch(() => worldMapDesign.styleKey, (key) => {
  try { localStorage.setItem(STYLE_KEY, key) } catch { /* 브라우저 저장이 막혀도 현재 탭에서는 유지 */ }
})
watch(() => worldMapDesign.tileStyleKey, (key) => {
  try { localStorage.setItem(TILE_KEY, key) } catch { /* 브라우저 저장이 막혀도 현재 탭에서는 유지 */ }
})
