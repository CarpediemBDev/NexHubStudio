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
import {
  regInfoList,
  regHistList,
  regConflictList,
  regItemList,
  attachMock
} from '@/data/regulationMock'

/* ---------------- 응답 봉투 (백엔드 ApiResponse 와 동일) ---------------- */
const ok = (data, message = '성공') =>
  HttpResponse.json({ code: 'SUCCESS', message, data, traceId: crypto.randomUUID() })

const fail = (status, message) =>
  HttpResponse.json({ code: 'ERROR', message, data: null, traceId: crypto.randomUUID() }, { status })

/* ---------------- 공용 ---------------- */
const pad = (n) => String(n).padStart(2, '0')

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

/* ---------------- 핸들러 ---------------- */
export default [
  // 화면 진입 시 스냅샷
  http.get('/api/regulations', () => ok(db)),

  // 저장 (신규 = INSERT, 기존 = 새 버전으로 UPDATE)
  http.post('/api/regulations', async ({ request }) => {
    const { master, targets, items, attachFiles, changes, decisions = [] } = await request.json()
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
  http.post('/api/regulations/:regInfoId/expire', ({ params }) => {
    const id = Number(params.regInfoId)
    const idx = db.records.findIndex((r) => r.regInfoId === id)
    if (idx < 0) return fail(404, '레코드를 찾을 수 없습니다.')
    const r = db.records[idx]
    const next = { ...r, statusCd: 'EXPIRED', versionNo: r.versionNo + 1 }
    fillSnapshot(r)
    db.records.splice(idx, 1, next)
    db.histories.push({
      histId: Date.now(),
      regInfoId: id,
      versionNo: next.versionNo,
      changeType: 'DELETE',
      changeNote: '사용자 요청으로 폐지',
      regId: 'me',
      regDt: stampNow(),
      snapshotJson: JSON.stringify(snapshotOf(next)),
      masterChanged: true,
      changedItemIds: []
    })
    return ok(next, '폐지 처리되었습니다.')
  }),

  // 등록은 취소했지만 충돌 감지 사실은 남기는 경우
  http.post('/api/regulations/conflict-histories', async ({ request }) => {
    const { conflicts = [], decisionCd = 'CANCEL' } = await request.json()
    pushConflictHistory(conflicts, decisionCd, null)
    return ok({ count: conflicts.length })
  })
]
