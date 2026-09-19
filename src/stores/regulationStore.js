/**
 * 규격/규제 정보 - 공용 스토어
 *
 * 팝업이었을 때는 목록과 폼이 같은 컴포넌트 안에 있어서 공짜로 얻던 것들을
 * 페이지로 분리하면서 여기로 끌어올린다.
 *   1. 레코드/항목/이력/충돌 데이터  (목록 ↔ 등록 ↔ 수정 페이지가 공유)
 *   2. 목록 컨텍스트                (검색조건 · 정렬된 ID 목록)
 *      → 뒤로가기 시 필터 복원, 수정 화면의 "◀ 12/47 ▶" 레코드 이동에 쓰인다.
 *
 * 데이터는 regulationApi 로만 들어온다. 채번·버전 증가·변경이력 스냅샷 같은
 * 서버 몫의 로직은 여기 없다(목업 모드에서는 src/mocks/handlers/regulation.js 가 대신한다).
 * 여기 남는 것은 받아온 결과를 화면이 쓰기 좋게 들고 있는 일과 목록 컨텍스트뿐이다.
 */

import { defineStore } from 'pinia'
import { regulationApi } from '@/api/regulation'

export const useRegulationStore = defineStore('regulation', {
  state: () => ({
    records: [],
    items: [],
    histories: [],
    conflicts: [],
    attachments: {},

    /** 스냅샷 적재 상태. 목록/상세가 각각 진입해도 한 번만 받아오게 한다 */
    loaded: false,
    loadingPromise: null,

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
    /* ---------------- 적재 ---------------- */
    /**
     * 화면 진입 시 호출. 이미 받아왔으면 다시 부르지 않는다.
     * 목록과 상세가 동시에 진입해도 요청이 두 번 나가지 않도록 진행 중인 약속을 공유한다.
     */
    ensureLoaded() {
      if (this.loaded) return Promise.resolve()
      if (!this.loadingPromise) this.loadingPromise = this.refresh()
      return this.loadingPromise
    },

    /**
     * 서버 스냅샷으로 전량 교체.
     * 저장 한 번이 다른 레코드까지 건드릴 수 있어서(충돌 MERGE → 기존 레코드 폐지)
     * 저장 응답만 부분 반영하지 않고 다시 받아온다.
     */
    async refresh() {
      try {
        const snap = await regulationApi.snapshot()
        this.records = snap.records || []
        this.items = snap.items || []
        this.histories = snap.histories || []
        this.conflicts = snap.conflicts || []
        this.attachments = snap.attachments || {}
        this.loaded = true
      } finally {
        this.loadingPromise = null
      }
    },

    /**
     * 전개(행→열) 목록.
     * 결과는 조회 조건에 딸린 화면 상태라 state 에 두지 않고 부른 쪽에 돌려준다.
     * (state 에 두면 목록/전개 탭이 서로 다른 시점의 결과를 보게 된다)
     * @param {number[]} regInfoIds 목록에서 이미 걸러진 레코드 ID
     */
    fetchExpanded(regInfoIds, paging) {
      return regulationApi.expanded(regInfoIds, paging)
    },

    /* ---------------- 목록 컨텍스트 ---------------- */
    setListContext(ctx) {
      this.listContext = { ...this.listContext, ...ctx }
    },

    /* ---------------- 충돌 판정 ---------------- */
    /**
     * 저장 전 충돌 예측. 판정은 서버가 한다.
     * 화면 상태라 state 에 두지 않고 부른 쪽에 돌려준다.
     */
    detectConflicts(payload) {
      return regulationApi.detectConflicts(payload)
    },

    /* ---------------- 저장 ---------------- */
    /**
     * 레코드 1건 저장. 수정은 서버가 새 버전으로 올린다.
     * 항목(regItem)은 레코드에 종속되므로 같은 요청에 함께 보낸다.
     * @param {object} payload   { master, targets, items, attachFiles, changes }
     *                           changes = { masterChanged, changedItemIds } (변경이력 '이 항목' 범위용)
     * @param {Array}  decisions 충돌 조치 목록
     * @returns {Promise<object>} 저장된 레코드
     */
    async saveRecord(payload, decisions = []) {
      const saved = await regulationApi.save({ ...payload, decisions })
      await this.refresh()
      return saved
    },

    /* ---------------- 충돌 이력 ---------------- */
    /**
     * 등록은 취소했지만 충돌을 감지한 사실은 남겨야 할 때.
     * @param {Array}  list           감지된 충돌
     * @param {string} forcedDecision 'CANCEL' 등 일괄 적용할 조치 코드
     */
    async pushConflictHistory(list, forcedDecision) {
      await regulationApi.saveConflictHistories(list, forcedDecision)
      await this.refresh()
    },

    /* ---------------- 상태 변경 ---------------- */
    /**
     * 확정 · 재검토 · 폐지 · 복원을 한 액션으로.
     * 화면이 전이 전에 충돌이력을 보여주고 동의를 받지만, 갈 수 있는지의 최종 판단은 서버다.
     * 서버가 거절할 수 있으므로 호출부가 오류를 받아 처리해야 한다.
     */
    async changeStatus(regInfoId, statusCd) {
      const saved = await regulationApi.changeStatus(regInfoId, statusCd)
      await this.refresh()
      return saved
    }
  }
})
