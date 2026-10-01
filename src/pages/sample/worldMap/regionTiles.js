/**
 * 권역 타일 정의. 화면 위 HTML 타일(RegionTileLayer.vue)과 SVG 저장 파일(svgEngine.tilesSvg)이 같이 쓴다.
 * 화면을 해치지 않게 잘 알려진 권역만 고른다. ll 은 타일을 놓을 경위도(기본값).
 *
 * 사용자가 타일을 끌어 옮긴 위치는 화면 % 가 아니라 경위도로 기억한다(tileLL).
 * 그래야 투영법·가운데 기준을 바꿔도 타일이 같은 땅 위에 따라붙는다.
 */
import { regionCodes } from '@/data/regulationMock'

export const TILE_REGIONS = [
  { cd: 'R_NA', en: 'NORTH AMERICA', ll: [-102, 44] },
  { cd: 'R_LA', en: 'LATIN AMERICA', ll: [-58, -12] },
  { cd: 'R_EU', en: 'EUROPE', ll: [12, 55] },
  { cd: 'R_MEA', en: 'MIDDLE EAST · AFRICA', ll: [22, -4] },
  { cd: 'R_ASIA', en: 'ASIA', ll: [100, 36] }
]

export const regionName = (cd) => (regionCodes.find((r) => r.code === cd) || {}).name || cd

/**
 * 주어진 투영으로 타일 중심 좌표(960x480 기준)를 계산한다
 * @param tileLL 사용자가 옮긴 위치 { R_ASIA: [lon, lat] }. 없으면 기본 위치
 */
export function tilePositions(proj, tileLL = {}) {
  return TILE_REGIONS.map((t) => {
    const [x, y] = proj(tileLL[t.cd] || t.ll)
    return { ...t, name: regionName(t.cd), x, y }
  })
}

/* ---- 옮긴 위치 기억: 보는 사람 브라우저에만 남는 편의 기능이라 localStorage ---- */
const STORE_KEY = 'worldMap.tileLL'

export function loadTileLL() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch (e) {
    return {}
  }
}

export function saveTileLL(tileLL) {
  try {
    if (Object.keys(tileLL).length) localStorage.setItem(STORE_KEY, JSON.stringify(tileLL))
    else localStorage.removeItem(STORE_KEY)
  } catch (e) {
    /* 저장 못 해도 이번 화면에서는 동작 */
  }
}
