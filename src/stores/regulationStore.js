/**
 * 규격/규제 정보 - 공용 스토어
 *
 * 팝업이었을 때는 목록과 폼이 같은 컴포넌트 안에 있어서 공짜로 얻던 것들을
 * 페이지로 분리하면서 여기로 끌어올린다.
 *   1. 레코드/항목/이력/충돌 데이터  (목록 ↔ 등록 ↔ 수정 페이지가 공유)
 *   2. 목록 컨텍스트                (검색조건 · 정렬된 ID 목록)
 *      → 뒤로가기 시 필터 복원, 수정 화면의 "◀ 12/47 ▶" 레코드 이동에 쓰인다.
 *
 * 실서비스에서는 state 초기값을 API 응답으로, actions 를 API 호출로 바꾸면 된다.
 */

import { defineStore } from 'pinia'
import {
  regInfoList,
  regHistList,
  regConflictList,
  regItemList,
  attachMock
} from '@/data/regulationMock'

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
export function snapshotOf(record) {
  const codes = (type) => (record.targets || []).filter((tg) => tg.targetType === type).map((tg) => tg.targetCd)
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

/**
 * 각 레코드의 최신 버전 이력에 현재 값을 스냅샷으로 붙인다(= 그 버전의 실제 값).
 * 목업의 과거 버전은 값이 없으므로 비교 불가로 남고, 이후 저장분부터는 저장 시점에 채워진다.
 */
function withLatestSnapshots(hists, records) {
  return hists.map((h) => {
    const r = records.find((x) => x.regInfoId === h.regInfoId)
    return r && r.versionNo === h.versionNo ? { ...h, snapshotJson: JSON.stringify(snapshotOf(r)) } : { ...h }
  })
}

export const useRegulationStore = defineStore('regulation', {
  state: () => ({
    records: regInfoList.map((r) => ({ ...r, targets: [...r.targets] })),
    items: regItemList.map((it) => ({ ...it })),
    histories: withLatestSnapshots(regHistList, regInfoList),
    conflicts: [...regConflictList],
    attachments: JSON.parse(JSON.stringify(attachMock)),

    /**
     * 목록 화면이 떠날 때 남기는 컨텍스트.
     * 항목 계층은 PARENT_ITEM_ID 로 데이터에 있으므로 그룹핑 축은 넘기지 않는다.
     */
    listContext: {
      filters: null,
      orderedIds: [],
      selectedRegInfoId: null
    }
  }),

  getters: {
    recordById: (s) => (id) => s.records.find((r) => r.regInfoId === Number(id)) || null,

    itemsOf: (s) => (id) =>
      s.items
        .filter((it) => it.regInfoId === Number(id))
        .sort((a, b) => a.sortOrder - b.sortOrder),

    historiesOf: (s) => (id) =>
      s.histories
        .filter((h) => h.regInfoId === Number(id))
        .sort((a, b) => b.versionNo - a.versionNo),

    conflictsOf: (s) => (id) =>
      s.conflicts.filter((c) => c.newRegInfoId === Number(id) || c.existRegInfoId === Number(id)),

    attachmentsOf: (s) => (id) => s.attachments[id] || [],

    /**
     * 충돌 판정용 레코드 목록.
     * RULE 축(규제>규격>인증서)은 적용대상이 아니라 정보관리항목에서 읽으므로
     * 레코드에 items 를 붙여서 넘겨야 한다.
     * 안 붙이면 기존 레코드의 RULE 범위가 전부 "전체"로 잡혀 오탐이 쏟아진다.
     */
    recordsWithItems: (s) =>
      s.records.map((r) => ({
        ...r,
        items: s.items.filter((it) => it.regInfoId === r.regInfoId && it.itemCd)
      })),

    conflictCountOf: (s) => (id) =>
      s.conflicts.filter((c) => c.newRegInfoId === id || c.existRegInfoId === id).length,

    /** 수정 화면 상단의 ◀ n/m ▶ 이동. 목록 정렬 순서를 그대로 따른다 */
    neighborOf: (s) => (id) => {
      const list = s.listContext.orderedIds
      const idx = list.indexOf(Number(id))
      if (idx < 0) return { index: 0, total: list.length, prevId: null, nextId: null }
      return {
        index: idx + 1,
        total: list.length,
        prevId: idx > 0 ? list[idx - 1] : null,
        nextId: idx < list.length - 1 ? list[idx + 1] : null
      }
    }
  },

  actions: {
    /* ---------------- 목록 컨텍스트 ---------------- */
    setListContext(ctx) {
      this.listContext = { ...this.listContext, ...ctx }
    },

    /* ---------------- 저장 ---------------- */
    /**
     * 레코드 1건 저장. 수정은 새 버전으로 올린다.
     * 항목(regItem)은 레코드에 종속되므로 여기서 함께 커밋한다.
     * @param {object} payload   { master, targets, items, attachFiles, changes }
     *                           changes = { masterChanged, changedItemIds } (변경이력 '이 항목' 범위용)
     * @param {Array}  decisions 충돌 조치 목록
     * @returns {object} 저장된 레코드
     */
    saveRecord(payload, decisions = []) {
      const { master, targets, items, attachFiles, changes } = payload
      const stamp = stampNow()
      const isNew = !master.regInfoId

      let saved
      if (isNew) {
        const newId = Math.max(0, ...this.records.map((r) => r.regInfoId)) + 1
        saved = {
          regInfoId: newId,
          regNo: `REG-${new Date().getFullYear()}-${String(9000 + newId).slice(-4)}`,
          title: master.title,
          fieldCd: master.fieldCd,
          markNm: master.markNm,
          authority: master.authority,
          url: master.url,
          summary: master.summary,
          statusCd: master.statusCd,
          versionNo: 1,
          effectiveDt: dateOnly(master.effectiveDt),
          modDt: dateOnly(new Date()),
          modId: 'me',
          attachCnt: (attachFiles || []).length,
          targets
        }
        this.records.push(saved)
      } else {
        const idx = this.records.findIndex((r) => r.regInfoId === master.regInfoId)
        // 덮어쓰기 전에 직전 버전 값을 그 버전 이력에 남긴다 (스냅샷 없이 들어온 이력 대비)
        this.fillSnapshot(this.records[idx])
        saved = {
          ...this.records[idx],
          title: master.title,
          fieldCd: master.fieldCd,
          markNm: master.markNm,
          authority: master.authority,
          url: master.url,
          summary: master.summary,
          statusCd: master.statusCd,
          versionNo: this.records[idx].versionNo + 1,
          effectiveDt: dateOnly(master.effectiveDt),
          modDt: dateOnly(new Date()),
          modId: 'me',
          attachCnt: (attachFiles || []).length,
          targets
        }
        this.records.splice(idx, 1, saved)
      }

      const idMap = this.replaceItems(saved.regInfoId, items || [])
      this.attachments[saved.regInfoId] = [...(attachFiles || [])]

      this.histories.push({
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

      this.pushConflictHistory(decisions, null, saved, stamp)
      this.applyDecisionSideEffects(decisions, saved, stamp)
      return saved
    },

    /**
     * 항목 전량 교체 (레코드 저장 단위).
     * 화면에서 추가된 항목은 음수 id 를 갖는다. 여기서 실제 id 를 채번하는데,
     * 신규 항목의 자식도 신규일 수 있으므로 PARENT_ITEM_ID 를 함께 다시 매핑해야 한다.
     * (안 하면 신규 규격 밑의 신규 인증서가 고아가 된다)
     */
    replaceItems(regInfoId, items) {
      let seq = Math.max(6000, ...this.items.map((it) => it.itemId)) + 1
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
      this.items = this.items.filter((it) => it.regInfoId !== regInfoId).concat(next)
      return idMap
    },

    /** 레코드 현재 버전의 이력에 스냅샷이 없으면 지금 값으로 채운다 */
    fillSnapshot(record) {
      const h = this.histories.find((x) => x.regInfoId === record.regInfoId && x.versionNo === record.versionNo)
      if (h && !h.snapshotJson) h.snapshotJson = JSON.stringify(snapshotOf(record))
    },

    /* ---------------- 충돌 이력 ---------------- */
    pushConflictHistory(list, forcedDecision, saved, stamp = stampNow()) {
      list.forEach((c, i) => {
        this.conflicts.push({
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
    },

    /** 조치 코드에 따른 기존 레코드 후속 처리 */
    applyDecisionSideEffects(decisions, saved, stamp) {
      decisions.forEach((c) => {
        if (c.decisionCd === 'MERGE') {
          const idx = this.records.findIndex((r) => r.regInfoId === c.existRecord.regInfoId)
          if (idx < 0) return
          this.fillSnapshot(this.records[idx])
          const merged = {
            ...this.records[idx],
            statusCd: 'EXPIRED',
            versionNo: this.records[idx].versionNo + 1,
            modDt: dateOnly(new Date())
          }
          this.records.splice(idx, 1, merged)
          this.histories.push({
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
          this.histories.push({
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
    },

    /* ---------------- 폐지 ---------------- */
    expireRecord(regInfoId) {
      const idx = this.records.findIndex((r) => r.regInfoId === regInfoId)
      if (idx < 0) return
      const r = this.records[idx]
      const next = { ...r, statusCd: 'EXPIRED', versionNo: r.versionNo + 1 }
      this.fillSnapshot(r)
      this.records.splice(idx, 1, next)
      this.histories.push({
        histId: Date.now(),
        regInfoId,
        versionNo: next.versionNo,
        changeType: 'DELETE',
        changeNote: '사용자 요청으로 폐지',
        regId: 'me',
        regDt: stampNow(),
        snapshotJson: JSON.stringify(snapshotOf(next)),
        masterChanged: true,
        changedItemIds: []
      })
    }
  }
})
