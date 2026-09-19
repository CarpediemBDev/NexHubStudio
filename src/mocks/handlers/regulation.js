/**
 * 규제정보 목업 핸들러 (백엔드 대역)
 *
 * 스토어에 있던 서버 몫의 로직 — 채번, 버전 올리기, 변경이력 스냅샷, 충돌 조치 후속처리 —
 * 이 전부 여기로 옮겨왔다. 백엔드 API 가 생기면 이 파일만 지우면 되고,
 * 화면과 src/api/regulation.js 는 손대지 않는다.
 *
 * 동시에 이 파일이 백엔드에 요구할 스펙 문서 역할을 한다.
 */
import { http, HttpResponse } from 'msw'
import { detectConflicts, codeName } from '@/utils/regulationConflict'
import {
  regInfoList,
  regHistList,
  regConflictList,
  regItemList,
  attachMock,
  statusCodes,
  statusTransitions
} from '@/data/regulationMock'

/* ---------------- 응답 봉투 (백엔드 ApiResponse 와 동일) ---------------- */
const ok = (data, message = '성공') =>
  HttpResponse.json({ code: 'SUCCESS', message, data, traceId: crypto.randomUUID() })

const fail = (status, message) =>
  HttpResponse.json({ code: 'ERROR', message, data: null, traceId: crypto.randomUUID() }, { status })

/* ---------------- 공용 ---------------- */
const pad = (n) => String(n).padStart(2, '0')

const statusName = (code) => (statusCodes.find((s) => s.code === code) || {}).name || code

/** 상태 변경 이력에 남기는 사유. 왜 바뀌었는지가 이력에서 읽혀야 한다 */
const STATUS_CHANGE_NOTE = {
  ACTIVE: '충돌이력 확인 후 확정(시행중)',
  REVIEW: '시행을 멈추고 검토중으로',
  EXPIRED: '사용자 요청으로 폐지'
}

const stampNow = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const dateOnly = (v) => {
  if (!v) return ''
  if (typeof v === 'string') return v.slice(0, 10)
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 변경이력 비교용 스냅샷 = 그 버전의 기본정보 값.
 * 편집 폼(master)과 같은 모양으로 남겨야 폼 옆에 그대로 겹쳐 비교할 수 있다.
 */
function snapshotOf(record) {
  const codes = (type) =>
    (record.targets || []).filter((tg) => tg.targetType === type).map((tg) => tg.targetCd)
  return {
    title: record.title,
    fieldCd: record.fieldCd,
    markNm: record.markNm || '',
    authority: record.authority || '',
    url: record.url || '',
    summary: record.summary || '',
    statusCd: record.statusCd,
    effectiveDt: dateOnly(record.effectiveDt),
    divisionCds: codes('DIVISION'),
    productGroupCds: codes('PRODUCT_GROUP'),
    productCds: codes('PRODUCT'),
    regionCds: codes('REGION'),
    countryCds: codes('COUNTRY')
  }
}

/* ---------------- 인메모리 DB (새로고침하면 목업 초기값으로 돌아간다) ---------------- */
const db = {
  records: regInfoList.map((r) => ({ ...r, targets: [...r.targets] })),
  items: regItemList.map((it) => ({ ...it })),
  histories: [],
  conflicts: [...regConflictList],
  attachments: JSON.parse(JSON.stringify(attachMock))
}

// 각 레코드의 최신 버전 이력에 현재 값을 스냅샷으로 붙인다(= 그 버전의 실제 값).
// 목업의 과거 버전은 값이 없으므로 비교 불가로 남고, 이후 저장분부터는 저장 시점에 채워진다.
db.histories = regHistList.map((h) => {
  const r = db.records.find((x) => x.regInfoId === h.regInfoId)
  return r && r.versionNo === h.versionNo
    ? { ...h, snapshotJson: JSON.stringify(snapshotOf(r)) }
    : { ...h }
})

/** 레코드 현재 버전의 이력에 스냅샷이 없으면 지금 값으로 채운다 */
function fillSnapshot(record) {
  const h = db.histories.find(
    (x) => x.regInfoId === record.regInfoId && x.versionNo === record.versionNo
  )
  if (h && !h.snapshotJson) h.snapshotJson = JSON.stringify(snapshotOf(record))
}

/**
 * 항목 전량 교체 (레코드 저장 단위).
 * 화면에서 추가된 항목은 음수 id 를 갖는다. 여기서 실제 id 를 채번하는데,
 * 신규 항목의 자식도 신규일 수 있으므로 PARENT_ITEM_ID 를 함께 다시 매핑해야 한다.
 * (안 하면 신규 규격 밑의 신규 인증서가 고아가 된다)
 */
function replaceItems(regInfoId, items) {
  let seq = Math.max(6000, ...db.items.map((it) => it.itemId)) + 1
  const idMap = new Map()
  items.forEach((it) => {
    idMap.set(it.itemId, it.itemId > 0 ? it.itemId : seq++)
  })
  const next = items.map((it) => ({
    ...it,
    itemId: idMap.get(it.itemId),
    parentItemId: it.parentItemId == null ? null : idMap.get(it.parentItemId) ?? null,
    regInfoId
  }))
  db.items = db.items.filter((it) => it.regInfoId !== regInfoId).concat(next)
  return idMap
}

function pushConflictHistory(list, forcedDecision, saved, stamp = stampNow()) {
  list.forEach((c, i) => {
    db.conflicts.push({
      conflictId: Date.now() + i,
      newRegNo: saved ? saved.regNo : '(등록취소)',
      newRegInfoId: saved ? saved.regInfoId : null,
      existRegNo: c.existRecord.regNo,
      existRegInfoId: c.existRecord.regInfoId,
      conflictType: c.conflictType,
      conflictAxis: c.mainAxis.axisKey,
      newScopeTxt: c.mainAxis.newScopeTxt,
      existScopeTxt: c.mainAxis.existScopeTxt,
      decisionCd: forcedDecision || c.decisionCd,
      decisionNote: c.decisionNote || c.recommend.text,
      detectDt: stamp,
      decideId: 'me',
      decideDt: stamp,
      statusCd: forcedDecision === 'CANCEL' ? 'IGNORED' : 'RESOLVED'
    })
  })
}

/** 조치 코드에 따른 기존 레코드 후속 처리 */
function applyDecisionSideEffects(decisions, saved, stamp) {
  decisions.forEach((c) => {
    if (c.decisionCd === 'MERGE') {
      const idx = db.records.findIndex((r) => r.regInfoId === c.existRecord.regInfoId)
      if (idx < 0) return
      fillSnapshot(db.records[idx])
      const merged = {
        ...db.records[idx],
        statusCd: 'EXPIRED',
        versionNo: db.records[idx].versionNo + 1,
        modDt: dateOnly(new Date())
      }
      db.records.splice(idx, 1, merged)
      db.histories.push({
        histId: Date.now() + Math.random(),
        regInfoId: merged.regInfoId,
        versionNo: merged.versionNo,
        changeType: 'CONFLICT_RESOLVE',
        changeNote: `${saved.regNo} 로 흡수되어 폐지 처리`,
        regId: 'me',
        regDt: stamp,
        snapshotJson: JSON.stringify(snapshotOf(merged)),
        masterChanged: true,
        changedItemIds: []
      })
    } else if (c.decisionCd === 'KEEP_BOTH') {
      db.histories.push({
        histId: Date.now() + Math.random(),
        regInfoId: c.existRecord.regInfoId,
        versionNo: c.existRecord.versionNo,
        changeType: 'CONFLICT_RESOLVE',
        changeNote: `${saved.regNo} 등록에 따라 하위 예외(특례)로 유지`,
        regId: 'me',
        regDt: stamp
      })
    }
  })
}

/* ---------------- 전개(행→열) ---------------- */
/**
 * 목록 화면 "전개" 탭이 쓰는 결과. 백엔드가 JOIN 으로 만들 모양을 그대로 흉내 낸다.
 *
 *   SELECT i.field_cd, i.reg_no, i.title, ...,
 *          rg.item_cd AS regulation_cd, st.item_cd AS standard_cd, ct.item_cd AS cert_cd,
 *          p.target_cd AS product_cd,
 *          COALESCE(ct.mandatory_yn, st.mandatory_yn, rg.mandatory_yn) AS mandatory_yn
 *     FROM reg_info i
 *     LEFT JOIN reg_info_item   rg ON rg.reg_info_id    = i.reg_info_id AND rg.item_type_cd = 'REGULATION'
 *     LEFT JOIN reg_info_item   st ON st.parent_item_id = rg.item_id    AND st.item_type_cd = 'STANDARD'
 *     LEFT JOIN reg_info_item   ct ON ct.parent_item_id = st.item_id    AND ct.item_type_cd = 'CERT'
 *     LEFT JOIN reg_info_target p  ON p.reg_info_id     = i.reg_info_id AND p.target_type   = 'PRODUCT'
 *    WHERE i.reg_info_id IN (:ids)
 *    ORDER BY i.field_cd, i.reg_no, rg.sort_order, st.sort_order, ct.sort_order, p.target_cd
 *
 * LEFT JOIN 이라 하위 단계가 없으면 그 칸은 빈 값으로 남고(규격은 있는데 인증서가 없는 규제 등),
 * 제품을 지정하지 않은 레코드는 제품 칸이 빈 값인 한 행이 된다.
 *
 * 코드와 이름을 함께 내린다. 백엔드는 common_code 에 적재된 코드표로 이름을 해석하고,
 * 목업은 같은 코드표의 원본인 regulationMock.js 로 해석한다.
 * 코드도 계속 내리는 이유는 병합키·필터가 코드로 동작하고 이름은 바뀔 수 있어서다.
 *
 * 병합키(fieldKey/recKey/ruleKey/stdKey)는 여기서 만든다.
 * "어디까지 같아야 한 칸으로 묶느냐" 는 정렬 순서와 한 몸인데,
 * 정렬은 서버가 하고 키는 화면이 만들면 ORDER BY 를 바꾸는 순간 병합이 조용히 깨진다.
 * 정렬한 쪽이 키도 만든다.
 */

/**
 * 코드 → 이름. 코드가 비어 있으면 빈 문자열이다 —
 * LEFT JOIN 으로 하위가 없는 단계는 값 자체가 없으므로 "없음" 과 "이름을 못 찾음" 을 구분한다.
 */
const nameOf = (groupCode, code) => (code ? codeName(groupCode, code) : '')
const namesOf = (groupCode, codes) => (codes || []).map((cd) => nameOf(groupCode, cd))

/** 레코드의 특정 타겟 코드 목록. 순서는 SQL 과 같게 코드 오름차순 */
const targetCdsOf = (record, targetType) =>
  (record.targets || [])
    .filter((tg) => tg.targetType === targetType)
    .map((tg) => tg.targetCd)
    .sort()

/** 규제 > 규격 > 인증서 3단 LEFT JOIN 과 같은 조합 목록 */
function ruleCombos(items) {
  const blank = { regulationCd: '', standardCd: '', certCd: '', mandatoryYn: '' }
  const childrenOf = (parentItemId, itemTypeCd) =>
    items
      .filter((it) => it.parentItemId === parentItemId && it.itemTypeCd === itemTypeCd)
      .sort((a, b) => a.sortOrder - b.sortOrder)

  const roots = items
    .filter((it) => it.itemTypeCd === 'REGULATION')
    .sort((a, b) => a.sortOrder - b.sortOrder)
  if (!roots.length) return [{ ...blank }]

  const out = []
  roots.forEach((rg) => {
    const stds = childrenOf(rg.itemId, 'STANDARD')
    if (!stds.length) {
      out.push({ ...blank, regulationCd: rg.itemCd, mandatoryYn: rg.mandatoryYn })
      return
    }
    stds.forEach((st) => {
      const certs = childrenOf(st.itemId, 'CERT')
      if (!certs.length) {
        out.push({ ...blank, regulationCd: rg.itemCd, standardCd: st.itemCd, mandatoryYn: st.mandatoryYn })
        return
      }
      certs.forEach((ct) => {
        out.push({
          regulationCd: rg.itemCd,
          standardCd: st.itemCd,
          certCd: ct.itemCd,
          mandatoryYn: ct.mandatoryYn
        })
      })
    })
  })
  return out
}

/** 제품 타겟이 없으면 빈 코드 한 행(= LEFT JOIN 결과). 있으면 제품마다 한 행 */
function productCombos(record) {
  const cds = targetCdsOf(record, 'PRODUCT')
  return cds.length ? cds : ['']
}

function expandRecords(records) {
  const rows = []
  const sorted = [...records].sort(
    (a, b) =>
      String(a.fieldCd || '').localeCompare(String(b.fieldCd || '')) ||
      String(a.regNo || '').localeCompare(String(b.regNo || ''))
  )

  sorted.forEach((r) => {
    const items = db.items.filter((it) => it.regInfoId === r.regInfoId)
    // 레코드 단위 멀티값. 전개 축이 아니므로 곱하지 않고 목록 그대로 내린다
    const divisionCds = targetCdsOf(r, 'DIVISION')
    const productGroupCds = targetCdsOf(r, 'PRODUCT_GROUP')
    const regionCds = targetCdsOf(r, 'REGION')
    const countryCds = targetCdsOf(r, 'COUNTRY')
    const base = {
      regInfoId: r.regInfoId,
      statusCd: r.statusCd,
      regNo: r.regNo,
      title: r.title,
      fieldCd: r.fieldCd,
      fieldNm: nameOf('FIELD', r.fieldCd),
      divisionCds,
      divisionNms: namesOf('DIVISION', divisionCds),
      productGroupCds,
      productGroupNms: namesOf('PRODUCT_GROUP', productGroupCds),
      regionCds,
      regionNms: namesOf('REGION', regionCds),
      countryCds,
      countryNms: namesOf('COUNTRY', countryCds),
      effectiveDt: dateOnly(r.effectiveDt),
      versionNo: r.versionNo
    }

    ruleCombos(items).forEach((rule) => {
      productCombos(r).forEach((productCd) => {
        rows.push({
          ...base,
          ...rule,
          regulationNm: nameOf('REGULATION', rule.regulationCd),
          standardNm: nameOf('STANDARD', rule.standardCd),
          certNm: nameOf('CERT', rule.certCd),
          productCd,
          productNm: nameOf('PRODUCT', productCd),
          fieldKey: String(r.fieldCd || ''),
          recKey: `${r.fieldCd}|${r.regInfoId}`,
          ruleKey: `${r.fieldCd}|${r.regInfoId}|${rule.regulationCd}`,
          stdKey: `${r.fieldCd}|${r.regInfoId}|${rule.regulationCd}|${rule.standardCd}`
        })
      })
    })
  })
  return rows
}

/* ---------------- 핸들러 ---------------- */
export default [
  // 화면 진입 시 스냅샷
  http.get('/api/regulations', () => ok(db)),

  // 전개(행→열) 목록. 조회 결과로 이미 걸러진 ID 만 받는다(빈 배열이면 전체)
  http.post('/api/regulations/expanded', async ({ request }) => {
    const { regInfoIds = [], page, size } = await request.json()
    const ids = new Set((regInfoIds || []).map(Number))
    const targets = ids.size ? db.records.filter((r) => ids.has(r.regInfoId)) : db.records
    const all = expandRecords(targets)
    // size 가 없으면 전체 — 엑셀 내보내기처럼 한 번에 다 받아야 하는 경우가 있다
    if (!size || size < 1) return ok({ rows: all, totalCount: all.length })
    const offset = ((page && page > 0 ? page : 1) - 1) * size
    // totalCount 는 자르기 전 전체 건수다. 페이지네이션이 이 값으로 페이지를 센다
    return ok({ rows: all.slice(offset, offset + size), totalCount: all.length })
  }),

  /**
   * 저장 전 충돌 예측.
   *
   * 백엔드는 이 판정을 자바로 갖고 있다(RegulationConflictEngine).
   * 목업은 같은 규칙의 원본인 regulationConflict.js 를 그대로 부른다 —
   * 두 모드에서 화면이 같은 답을 받아야 하므로 규칙을 여기서 새로 쓰지 않는다.
   */
  http.post('/api/regulations/detect-conflicts', async ({ request }) => {
    const { master = {}, targets = [], items = [] } = await request.json()
    const newRecord = { ...master, targets, items: (items || []).filter((it) => it.itemCd) }
    // 기존 레코드는 항목을 붙여서 넘겨야 RULE 축이 읽힌다
    const existList = db.records.map((r) => ({
      ...r,
      items: db.items.filter((it) => it.regInfoId === r.regInfoId && it.itemCd)
    }))
    return ok(detectConflicts(newRecord, existList))
  }),

  // 저장 (신규 = INSERT, 기존 = 새 버전으로 UPDATE)
  http.post('/api/regulations', async ({ request }) => {
    const { master, targets, items, attachFiles, changes, decisions = [] } = await request.json()

    // 동일범위(SAME)는 중복 등록이라 저장 자체를 막는다. 기존 레코드를 개정(REPLACE)하거나
    // 흡수(MERGE)하는 조치를 고른 경우에만 통과시킨다 — 그때는 결과가 한 건으로 남는다.
    const sameUnresolved = decisions.filter(
      (d) => d.conflictType === 'SAME' && !['REPLACE', 'MERGE', 'CANCEL'].includes(d.decisionCd)
    )
    if (sameUnresolved.length) {
      return fail(
        409,
        `적용 범위가 완전히 같은 레코드가 ${sameUnresolved.length}건 있습니다. ` +
          '중복 등록 대신 기존 레코드를 개정(REPLACE)하거나 흡수(MERGE)하세요.'
      )
    }

    const stamp = stampNow()
    const isNew = !master.regInfoId

    const common = {
      title: master.title,
      fieldCd: master.fieldCd,
      markNm: master.markNm,
      authority: master.authority,
      url: master.url,
      summary: master.summary,
      statusCd: master.statusCd,
      effectiveDt: dateOnly(master.effectiveDt),
      modDt: dateOnly(new Date()),
      modId: 'me',
      attachCnt: (attachFiles || []).length,
      targets
    }

    let saved
    if (isNew) {
      const newId = Math.max(0, ...db.records.map((r) => r.regInfoId)) + 1
      saved = {
        regInfoId: newId,
        regNo: `REG-${new Date().getFullYear()}-${String(9000 + newId).slice(-4)}`,
        versionNo: 1,
        ...common
      }
      db.records.push(saved)
    } else {
      const idx = db.records.findIndex((r) => r.regInfoId === master.regInfoId)
      if (idx < 0) return fail(404, '레코드를 찾을 수 없습니다.')
      // 덮어쓰기 전에 직전 버전 값을 그 버전 이력에 남긴다 (스냅샷 없이 들어온 이력 대비)
      fillSnapshot(db.records[idx])
      saved = {
        ...db.records[idx],
        versionNo: db.records[idx].versionNo + 1,
        ...common
      }
      db.records.splice(idx, 1, saved)
    }

    const idMap = replaceItems(saved.regInfoId, items || [])
    db.attachments[saved.regInfoId] = [...(attachFiles || [])]

    db.histories.push({
      histId: Date.now(),
      regInfoId: saved.regInfoId,
      versionNo: saved.versionNo,
      changeType: isNew ? 'INSERT' : 'UPDATE',
      changeNote: decisions.length
        ? `충돌 ${decisions.length}건 조치 후 저장`
        : isNew
          ? '최초 등록'
          : '내용 수정',
      regId: 'me',
      regDt: stamp,
      // 이 버전의 기본정보 값. 변경이력 카드를 누르면 폼에 겹쳐 비교한다
      snapshotJson: JSON.stringify(snapshotOf(saved)),
      // 무엇이 바뀌었는지. 변경이력 '이 항목' 범위가 이것으로 거른다.
      // 신규 항목은 저장하면서 id 가 바뀌므로 채번 결과로 옮겨 적는다.
      masterChanged: isNew || !!changes?.masterChanged,
      changedItemIds: isNew
        ? [...idMap.values()]
        : (changes?.changedItemIds || []).map((id) => idMap.get(id)).filter((id) => id != null)
    })

    pushConflictHistory(decisions, null, saved, stamp)
    applyDecisionSideEffects(decisions, saved, stamp)
    return ok(saved, '저장되었습니다.')
  }),

  // 폐지 (물리 삭제 없이 상태만 EXPIRED)
  /**
   * 상태 변경 — 확정(ACTIVE) · 재검토(REVIEW) · 폐지(EXPIRED) · 복원.
   *
   * 전이마다 엔드포인트를 두지 않고 목적지만 받는다. 갈 수 있는지는 전이표가 정한다 —
   * 규칙이 한 곳에 있어야 화면과 어긋나지 않는다(statusTransitions).
   *
   * 확정만 추가 검사가 있다. 미조치 동일범위(SAME)가 남아 있으면 막는다:
   * 같은 분야·같은 범위를 시행중인 레코드가 둘이 되면 현업이 어느 쪽을 따라야 할지
   * 정해지지 않는다. PARENT/CHILD/OVERLAP 은 상하위·부분중복이라 공존할 수 있다.
   *
   * 화면이 이미 막고 있어도 여기서 또 막는다 — 화면만 믿으면 API 를 직접 부르거나
   * 다른 화면이 생겼을 때 규칙이 새어 나간다.
   */
  http.post('/api/regulations/:regInfoId/status', async ({ params, request }) => {
    const id = Number(params.regInfoId)
    const { statusCd: to } = await request.json()
    const idx = db.records.findIndex((r) => r.regInfoId === id)
    if (idx < 0) return fail(404, '레코드를 찾을 수 없습니다.')
    const r = db.records[idx]

    const allowed = (statusTransitions[r.statusCd] || []).map((t) => t.to)
    if (!allowed.includes(to)) {
      return fail(409, `${statusName(r.statusCd)} 에서 ${statusName(to)} 로는 바꿀 수 없습니다.`)
    }

    if (to === 'ACTIVE') {
      const blocking = db.conflicts.filter(
        (c) =>
          (c.newRegInfoId === id || c.existRegInfoId === id) &&
          c.conflictType === 'SAME' &&
          c.statusCd !== 'RESOLVED'
      )
      if (blocking.length) {
        return fail(409, `동일범위(SAME) 충돌 ${blocking.length}건이 조치되지 않아 확정할 수 없습니다.`)
      }
    }

    const next = { ...r, statusCd: to, versionNo: r.versionNo + 1 }
    fillSnapshot(r)
    db.records.splice(idx, 1, next)
    db.histories.push({
      histId: Date.now(),
      regInfoId: id,
      versionNo: next.versionNo,
      // CHANGE_TYPE 은 INSERT/UPDATE/DELETE/CONFLICT_RESOLVE 네 가지다.
      // 폐지만 DELETE 로 남기고 나머지 상태 변경은 UPDATE + 사유로 둔다
      changeType: to === 'EXPIRED' ? 'DELETE' : 'UPDATE',
      changeNote: STATUS_CHANGE_NOTE[to] || `상태를 ${statusName(to)} 로 변경`,
      regId: 'me',
      regDt: stampNow(),
      snapshotJson: JSON.stringify(snapshotOf(next)),
      masterChanged: true,
      changedItemIds: []
    })
    return ok(next, `${statusName(to)} 으로 변경되었습니다.`)
  }),


  // 등록은 취소했지만 충돌 감지 사실은 남기는 경우
  http.post('/api/regulations/conflict-histories', async ({ request }) => {
    const { conflicts = [], decisionCd = 'CANCEL' } = await request.json()
    pushConflictHistory(conflicts, decisionCd, null)
    return ok({ count: conflicts.length })
  })
]
