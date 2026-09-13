/**
 * 정보관리항목(REG_INFO_ITEM) 트리
 *
 * 설계 의도
 *  - 항목은 (구분 + 코드) 로우이고, PARENT_ITEM_ID 로 계층을 갖는다.
 *        규제(1) > 규격(2) > 인증서(3)
 *    즉 계층은 "보기 옵션"이 아니라 데이터 그 자체다.
 *    평면으로 펼치면 "이 인증서가 어느 규격에 딸린 것인지"가 사라지므로
 *    트리가 기본이고, 평면은 검색·일괄편집용 보조 모드로만 쓴다.
 *  - 트리 최상단에는 항상 MASTER 노드가 있다.
 *    레코드 공통 필드(제목/분야/적용대상)는 어느 항목에도 속하지 않는다.
 *  - 저장 단위는 레코드 1건. 트리는 "무엇을 편집할지 고르는 장치"일 뿐이다.
 */

import { codeName } from '@/utils/regulationConflict'
import { itemTypeCodes } from '@/data/regulationMock'

export const MASTER_NODE_ID = 'MASTER'

/** 구분 → 하위 구분. 항목 추가 시 자식으로 무엇을 붙일 수 있는지 */
const CHILD_TYPE = {
  REGULATION: 'STANDARD',
  STANDARD: 'CERT',
  CERT: null
}

export function itemTypeName(code) {
  return (itemTypeCodes.find((t) => t.code === code) || {}).name || code
}

export function childTypeOf(itemTypeCd) {
  return CHILD_TYPE[itemTypeCd] || null
}

export function levelOfType(itemTypeCd) {
  return (itemTypeCodes.find((t) => t.code === itemTypeCd) || {}).levelNo || 1
}

/** 항목 하나의 표시 이름 (DB 의 ITEM_NM 비정규화 컬럼에 대응) */
export function itemName(item) {
  if (item.itemNm) return item.itemNm
  // 방금 추가해서 아직 코드를 안 고른 항목도 트리에서 식별되어야 한다
  if (!item.itemCd) return `(${itemTypeName(item.itemTypeCd)} 미선택)`
  return codeName(item.itemTypeCd, item.itemCd)
}

function toNode(item, depth, children) {
  return {
    nodeId: `ITEM:${item.itemId}`,
    type: 'ITEM',
    itemId: item.itemId,
    itemTypeCd: item.itemTypeCd,
    label: itemName(item),
    sub: itemTypeName(item.itemTypeCd),
    mandatoryYn: item.mandatoryYn,
    depth,
    children
  }
}

function masterNode(record) {
  return {
    nodeId: MASTER_NODE_ID,
    type: 'MASTER',
    itemId: null,
    label: '기본정보 (레코드 공통)',
    sub: record.regNo || '신규',
    depth: 0,
    children: null
  }
}

/**
 * PARENT_ITEM_ID 를 따라 항목 트리를 만든다.
 * @param {object} record 편집 중인 레코드
 * @param {Array}  items  이 레코드의 항목 배열 (평면)
 * @returns {Array} 노드 배열 (MASTER 노드가 항상 첫 번째)
 */
export function buildItemTree(record, items) {
  const byParent = new Map()
  items.forEach((it) => {
    const key = it.parentItemId == null ? 'ROOT' : it.parentItemId
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(it)
  })
  byParent.forEach((list) => list.sort((a, b) => a.sortOrder - b.sortOrder))

  const walk = (key, depth) =>
    (byParent.get(key) || []).map((it) => toNode(it, depth, walk(it.itemId, depth + 1)))

  return [masterNode(record), ...walk('ROOT', 1)]
}

/**
 * 평면 목록 (보조 모드).
 * 계층을 잃지 않도록 상위 경로를 sub 에 남긴다.
 */
export function flattenItems(record, items) {
  const byId = new Map(items.map((it) => [it.itemId, it]))
  const pathOf = (it) => {
    const parts = []
    let cur = byId.get(it.parentItemId)
    let guard = 0
    while (cur && guard < 10) {
      parts.unshift(itemName(cur))
      cur = byId.get(cur.parentItemId)
      guard += 1
    }
    return parts.join(' › ')
  }

  const rows = [...items].sort((a, b) => a.levelNo - b.levelNo || a.sortOrder - b.sortOrder)
  return [
    masterNode(record),
    ...rows.map((it) => {
      const node = toNode(it, 1, null)
      const path = pathOf(it)
      node.sub = path ? `${itemTypeName(it.itemTypeCd)} · ${path}` : itemTypeName(it.itemTypeCd)
      return node
    })
  ]
}

/** 트리를 깊이우선으로 펼쳐 렌더용 1차원 배열로 (접힘 상태 반영) */
export function toVisibleRows(nodes, collapsedIds = new Set()) {
  const out = []
  const walk = (list) => {
    list.forEach((n) => {
      out.push(n)
      if (n.children && n.children.length && !collapsedIds.has(n.nodeId)) walk(n.children)
    })
  }
  walk(nodes)
  return out
}

/** 트리 전체에서 ITEM 노드만 */
export function collectItemNodes(nodes) {
  const out = []
  const walk = (list) => {
    list.forEach((n) => {
      if (n.type === 'ITEM') out.push(n)
      if (n.children) walk(n.children)
    })
  }
  walk(nodes)
  return out
}

/** 이 노드와 그 하위의 itemId (그룹 체크 / 하위 동반 삭제용) */
export function descendantItemIds(node) {
  if (node.type === 'MASTER') return []
  const out = node.itemId != null ? [node.itemId] : []
  return out.concat(collectItemNodes(node.children || []).map((n) => n.itemId))
}

/** 평면 배열에서 특정 항목의 모든 후손 id (삭제 시 함께 지운다) */
export function descendantIdsFlat(items, itemId) {
  const out = []
  const stack = [itemId]
  while (stack.length) {
    const cur = stack.pop()
    out.push(cur)
    items.filter((it) => it.parentItemId === cur).forEach((it) => stack.push(it.itemId))
  }
  return out
}

/** 목록 그리드의 항목 요약 문자열 — 목록 1행은 레코드 1건이므로 항목은 접어서 보여준다 */
export function itemSummary(items) {
  if (!items || !items.length) return ''
  const roots = items.filter((it) => it.itemTypeCd === 'REGULATION')
  const head = roots.length ? itemName(roots[0]) : itemName(items[0])
  const counts = ['REGULATION', 'STANDARD', 'CERT']
    .map((t) => ({ t, n: items.filter((it) => it.itemTypeCd === t).length }))
    .filter((c) => c.n > 0)
    .map((c) => `${itemTypeName(c.t)} ${c.n}`)
    .join(' · ')
  return roots.length > 1 ? `${head} 외 ${roots.length - 1} (${counts})` : `${head} (${counts})`
}
