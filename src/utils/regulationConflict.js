/**
 * 규격/규제 정보 - 충돌(포함관계) 판정 엔진
 *
 * 저장 버튼을 누른 시점에 "신규(또는 수정) 레코드"와 "이미 등록된 레코드"의
 * 적용 범위를 비교해서 PARENT / CHILD / SAME / OVERLAP 을 판정한다.
 *
 * 핵심 아이디어
 *  - 타겟은 계층을 가진다.  권역 > 국가,  사업부 > 제품군 > 제품,  규제 > 규격
 *  - 계층이 다른 값을 그대로 비교할 수 없으므로 "최하위 단위(leaf)의 집합"으로 전개해서 비교한다.
 *      유럽            -> {FR, DE, IT, ES, PL}
 *      유럽 > 프랑스   -> {FR}
 *    => 신규(유럽) ⊃ 기존(프랑스)  => 신규가 상위 => PARENT
 *  - 축(axis)은 3개(GEO / ORG / RULE). 축별 판정을 합쳐 최종 유형을 만든다.
 *  - 판정 방향은 항상 "신규 레코드 기준"이다. PARENT = 신규가 기존의 상위.
 */

import {
  regionCodes,
  countryCodes,
  divisionCodes,
  productGroupCodes,
  productCodes,
  regulationCodes,
  standardCodes
} from '@/data/regulationMock'

/** 축 정의: 상위 타입 → 하위 타입 순서. 마지막 타입이 leaf */
export const AXES = [
  { key: 'GEO', name: '지역', types: ['REGION', 'COUNTRY'] },
  { key: 'ORG', name: '제품', types: ['DIVISION', 'PRODUCT_GROUP', 'PRODUCT'] },
  { key: 'RULE', name: '규제/규격', types: ['REGULATION', 'STANDARD'] }
]

const CODE_SET = {
  REGION: regionCodes,
  COUNTRY: countryCodes,
  DIVISION: divisionCodes,
  PRODUCT_GROUP: productGroupCodes,
  PRODUCT: productCodes,
  REGULATION: regulationCodes,
  STANDARD: standardCodes
}

const nameMapCache = (() => {
  const map = new Map()
  Object.entries(CODE_SET).forEach(([type, list]) => {
    list.forEach((item) => map.set(`${type}:${item.code}`, item.name))
  })
  return map
})()

export function codeName(targetType, targetCd) {
  return nameMapCache.get(`${targetType}:${targetCd}`) || targetCd
}

export function targetCodes(record, targetType) {
  return (record.targets || [])
    .filter((tg) => tg.targetType === targetType)
    .map((tg) => tg.targetCd)
}

export function targetNames(record, targetType) {
  return targetCodes(record, targetType).map((cd) => codeName(targetType, cd))
}

/** 상위 코드 하나를 leaf 코드 집합으로 전개 */
function expandToLeaf(axis, targetType, code) {
  const leafType = axis.types[axis.types.length - 1]
  if (targetType === leafType) return [code]

  const idx = axis.types.indexOf(targetType)
  let current = [code]
  for (let i = idx + 1; i < axis.types.length; i += 1) {
    const childType = axis.types[i]
    const children = CODE_SET[childType].filter((item) => current.includes(item.parentCd))
    current = children.map((item) => item.code)
    if (current.length === 0) return []
  }
  return current
}

/**
 * 레코드의 축별 leaf 집합.
 * 하위 타입이 선택돼 있으면 그것이 우선(더 좁은 범위),
 * 없으면 상위 타입을 전개, 둘 다 없으면 null(= 전체/무제한)을 뜻한다.
 */
export function leafScope(record, axis) {
  const leafType = axis.types[axis.types.length - 1]
  const leafSelected = targetCodes(record, leafType)
  if (leafSelected.length > 0) return new Set(leafSelected)

  const set = new Set()
  for (let i = axis.types.length - 2; i >= 0; i -= 1) {
    const type = axis.types[i]
    const codes = targetCodes(record, type)
    if (codes.length > 0) {
      codes.forEach((code) => expandToLeaf(axis, type, code).forEach((leaf) => set.add(leaf)))
      return set
    }
  }
  return null // 선택 없음 = 전체
}

/** 두 집합의 관계. null = 전체 범위 */
function relate(a, b) {
  if (a === null && b === null) return 'EQUAL'
  if (a === null) return 'SUPERSET' // 신규가 전체
  if (b === null) return 'SUBSET' // 기존이 전체

  const inter = [...a].filter((v) => b.has(v))
  if (inter.length === 0) return 'DISJOINT'
  const aSubB = a.size === inter.length
  const bSubA = b.size === inter.length
  if (aSubB && bSubA) return 'EQUAL'
  if (bSubA) return 'SUPERSET' // 신규 ⊃ 기존
  if (aSubB) return 'SUBSET' // 신규 ⊂ 기존
  return 'OVERLAP'
}

/** 레코드의 축 범위를 사람이 읽는 문자열로 */
export function scopeText(record, axis) {
  const parts = []
  axis.types.forEach((type) => {
    const names = targetNames(record, type)
    if (names.length > 0) parts.push(names.join(', '))
  })
  return parts.length ? parts.join(' > ') : '전체'
}

const RECOMMEND = {
  SAME: { decisionCd: 'REPLACE', text: '동일 범위 중복입니다. 신규 등록 대신 기존 레코드를 개정(새 버전)하세요.' },
  PARENT: { decisionCd: 'KEEP_BOTH', text: '신규가 기존을 포함합니다. 기존 레코드를 하위 예외(특례)로 유지하거나, 신규 범위에서 제외하세요.' },
  CHILD: { decisionCd: 'KEEP_BOTH', text: '기존이 신규를 포함합니다. 신규를 기존의 하위 예외(특례)로 등록하세요.' },
  OVERLAP: { decisionCd: 'EXCLUDE', text: '범위가 부분적으로 겹칩니다. 겹치는 대상을 어느 한쪽에서 제외해 경계를 명확히 하세요.' }
}

/**
 * 신규 레코드 1건 vs 기존 목록 → 충돌 후보 배열
 * @param {object} newRecord   저장하려는 레코드 (targets 포함)
 * @param {Array}  existList   이미 등록된 레코드 목록
 * @returns {Array} [{ existRecord, conflictType, axisDetails, recommend }]
 */
export function detectConflicts(newRecord, existList) {
  const result = []

  existList.forEach((exist) => {
    if (exist.regInfoId === newRecord.regInfoId) return // 자기 자신
    if (exist.statusCd === 'EXPIRED') return // 폐지 레코드는 비교 제외
    if (exist.fieldCd !== newRecord.fieldCd) return // 분야가 다르면 충돌 아님

    const axisDetails = []
    let disjoint = false
    const relations = []

    AXES.forEach((axis) => {
      const rel = relate(leafScope(newRecord, axis), leafScope(exist, axis))
      if (rel === 'DISJOINT') disjoint = true
      relations.push(rel)
      axisDetails.push({
        axisKey: axis.key,
        axisName: axis.name,
        relation: rel,
        newScopeTxt: scopeText(newRecord, axis),
        existScopeTxt: scopeText(exist, axis)
      })
    })

    if (disjoint) return // 한 축이라도 완전히 다르면 충돌 아님

    let conflictType
    if (relations.every((r) => r === 'EQUAL')) conflictType = 'SAME'
    else if (relations.every((r) => r === 'EQUAL' || r === 'SUPERSET')) conflictType = 'PARENT'
    else if (relations.every((r) => r === 'EQUAL' || r === 'SUBSET')) conflictType = 'CHILD'
    else conflictType = 'OVERLAP'

    // 충돌을 만든 대표 축(EQUAL 이 아닌 첫 축)
    const mainAxis = axisDetails.find((d) => d.relation !== 'EQUAL') || axisDetails[0]

    result.push({
      existRecord: exist,
      conflictType,
      axisDetails,
      mainAxis,
      recommend: RECOMMEND[conflictType]
    })
  })

  // 심각도 순 정렬: 동일범위 > 신규가 하위 > 신규가 상위 > 부분중복
  const order = { SAME: 0, CHILD: 1, PARENT: 2, OVERLAP: 3 }
  return result.sort((a, b) => order[a.conflictType] - order[b.conflictType])
}
