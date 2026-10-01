/**
 * 권역 타일 드롭다운에 보여 줄 내용: 그 권역의 규제 건수와 규제가 많은 주요 국가.
 * 레이아웃 지도(WorldMapLayoutMap)가 쓴다. 지도 스타일 탭의 RegionTileLayer 와 같은 기준으로 센다.
 */
import { countryCodes } from '@/data/regulationMock'
import { regionName } from './regionTiles'

/** 나라별 규제 건수 { KR: 12, ... }. 규제 하나가 여러 나라에 걸리면 나라마다 1건씩 */
export function countryCountsOf(records) {
  const counts = {}
  records.forEach((r) => {
    new Set((r.targets || []).filter((t) => t.targetType === 'COUNTRY').map((t) => t.targetCd)).forEach(
      (cd) => (counts[cd] = (counts[cd] || 0) + 1)
    )
  })
  return counts
}

/**
 * @returns { name, count(권역 규제 건수), countryTotal, top(주요 국가), allCodes("전체 보기"로 넘길 국가) }
 */
export function regionMenuOf(records, cd, topN = 6) {
  const counts = countryCountsOf(records)
  const countries = countryCodes.filter((c) => c.parentCd === cd)
  const codes = new Set(countries.map((c) => c.code))
  // 권역 건수는 "그 권역 나라에 하나라도 걸린 규제" 수 (나라별 합계가 아니라 중복 없이)
  const count = records.filter((r) =>
    (r.targets || []).some((t) => (t.targetType === 'COUNTRY' && codes.has(t.targetCd)) || (t.targetType === 'REGION' && t.targetCd === cd))
  ).length
  const withCount = countries
    .map((c) => ({ code: c.code, name: c.name, count: counts[c.code] || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
  return {
    name: regionName(cd),
    count,
    countryTotal: withCount.length,
    top: withCount.slice(0, topN),
    allCodes: withCount.map((c) => c.code)
  }
}
