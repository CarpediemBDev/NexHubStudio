/**
 * 세계지도 레이아웃 3종. 탭 페이지(어떤 화면을 띄울지)와 미니 선택기(WorldMapLayoutSwitcher)가 같이 쓴다.
 * 세 레이아웃 모두 권역을 고르면 지도가 그 권역으로 확대된다 — 차이는 화면 배치뿐이다.
 */
export const WORLD_MAP_LAYOUTS = [
  { id: 'region-desk', name: 'Region Desk', label: '왼쪽 메뉴형', description: '왼쪽 권역 메뉴 + 오른쪽 지도' },
  { id: 'atlas-split', name: 'Atlas Split', label: '오른쪽 패널형', description: '왼쪽 지도 + 오른쪽 권역·국가 패널' },
  { id: 'region-grid', name: 'Region Grid', label: '카드형', description: '위 권역 카드 + 아래 지도' }
]
