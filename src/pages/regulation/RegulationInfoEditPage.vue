<template>
  <div class="b2b-page-container py-3 reg-edit-page">
    <div class="b2b-card shadow-sm border edit-shell">
      <!-- ============================================================ -->
      <!-- 상단 바 : 목록 복귀 · 레코드 이동 · 저장                        -->
      <!-- ============================================================ -->
      <div class="edit-topbar">
        <button type="button" class="btn-b2b-action" @click="goList">
          <i class="bi bi-chevron-left me-1"></i>목록 <span class="text-muted b2b-text-xs">(검색조건 유지)</span>
        </button>

        <span class="b2b-badge b2b-badge-primary">{{ modeLabel }}</span>
        <span v-if="master.regNo" class="fw-bold">{{ master.regNo }}</span>
        <span v-if="mode === 'edit'" class="b2b-badge b2b-badge-secondary">
          v{{ master.versionNo }} → v{{ master.versionNo + 1 }}
        </span>

        <!-- 목록 정렬 순서를 따르는 레코드 이동 -->
        <div v-if="mode !== 'create' && neighbor.total" class="rec-nav">
          <button type="button" :disabled="!neighbor.prevId" @click="moveRecord(neighbor.prevId)">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span>{{ neighbor.index }} / {{ neighbor.total }}</span>
          <button type="button" :disabled="!neighbor.nextId" @click="moveRecord(neighbor.nextId)">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>

        <div class="ms-auto d-flex align-items-center gap-2">
          <span v-if="liveConflicts.length" class="b2b-badge b2b-badge-warning">
            <i class="bi bi-exclamation-triangle-fill me-1"></i>충돌 {{ liveConflicts.length }}
          </span>
          <span v-if="draftSavedAt" class="b2b-text-xs text-muted">임시저장 {{ draftSavedAt }}</span>

          <template v-if="mode === 'view'">
            <button type="button" class="btn-b2b-primary" @click="switchToEdit">
              <i class="bi bi-pencil-square me-1"></i>수정
            </button>
          </template>
          <template v-else>
            <button type="button" class="btn-b2b-action" @click="cancelEdit">취소</button>
            <button type="button" class="btn-b2b-primary" @click="requestSave">
              <i class="bi bi-check2 me-1"></i>저장<span v-if="dirtyCount"> ({{ dirtyCount }}건 변경)</span>
            </button>
          </template>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- 본문 3열 : 좌 항목트리 / 중 폼 / 우 인사이트                     -->
      <!--  · 등록도 3열이다. "무엇을 관리할지 고르는 것"이 등록의 본질이라  -->
      <!--    항목 트리 없이는 신규 등록이 성립하지 않는다.                 -->
      <!--  · 네비게이션은 항상 좌측, 인사이트는 항상 우측으로 고정          -->
      <!-- ============================================================ -->
      <div class="edit-body cols-3">
        <!-- 좌: 정보관리항목 트리 -->
        <RegScopeTree
          :nodes="treeNodes"
          :focused-id="focusedNodeId"
          :checked-ids="checkedItemIds"
          :dirty-ids="dirtyItemIds"
          :conflict-ids="conflictItemIds"
          :invalid-ids="invalidItemIds"
          :master-dirty="masterDirty"
          :master-conflict="liveConflicts.length > 0"
          :mode="treeMode"
          :readonly="readonly"
          @update:mode="treeMode = $event"
          @update:checkedIds="checkedItemIds = $event"
          @focus-node="onFocusNode"
          @add-item="addItem"
        />

        <!-- 중: 편집 폼 -->
        <div class="edit-main">
          <div class="main-head">
            <i class="bi" :class="showMaster ? 'bi-card-list' : 'bi-list-check'"></i>
            <span class="fw-bold ms-1">{{ mainTitle }}</span>
            <span v-if="!showMaster && !bulkMode" class="b2b-text-xs text-muted ms-2">
              정보관리항목 · 저장은 상단에서 레코드 단위로 한 번에
            </span>
          </div>

          <div ref="mainScroll" class="main-scroll">
            <RegMasterForm
              v-if="showMaster"
              ref="masterForm"
              :form="master"
              :hit-axes="hitAxes"
              :diff="diffSnapshot"
              :readonly="readonly"
              @add-attach="addAttach"
              @remove-attach="removeAttach"
            />
            <RegItemForm
              v-else
              :items="focusedItems"
              :parent="focusedParent"
              :parent-path="focusedPath"
              :readonly="readonly"
              @patch="patchItems"
              @remove="removeItems"
              @add-child="addChild"
              @clear-selection="checkedItemIds = []"
            />
          </div>
        </div>

        <!-- 우: 인사이트 -->
        <RegInsightPanel
          :mode="mode"
          :active-tab="insightTab"
          :live-conflicts="liveConflicts"
          :detecting="detecting"
          :conflict-histories="conflictHistories"
          :change-histories="changeHistories"
          :hist-scope="histScope"
          :hist-scope-label="histScopeLabel"
          :diff-hist-id="diffHistId"
          :readonly="readonly"
          @update:activeTab="insightTab = $event"
          @update:histScope="histScope = $event"
          @update:decision="onDecisionChange"
          @focus-axis="onFocusAxis"
          @toggle-diff="onToggleDiff"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 저장 확인 : 조치가 남은 충돌만 -->
    <!-- ============================================================ -->
    <div v-if="confirmOpen" class="modal-mask" @click.self="confirmOpen = false">
      <div class="modal-box">
        <div class="modal-head">
          <i class="bi bi-exclamation-triangle-fill text-warning me-2"></i>
          <span class="fw-bold">미조치 충돌 {{ unresolvedConflicts.length }}건</span>
          <button type="button" class="btn-close ms-auto" @click="confirmOpen = false"></button>
        </div>
        <div class="modal-body-scroll">
          <p class="b2b-text-sm text-theme-secondary">
            우측 <strong>충돌예측</strong> 패널에서 조치를 아직 확정하지 않은 건입니다.
            아래 권장 조치로 저장하거나, 돌아가서 직접 고르세요.
          </p>
          <table class="table table-sm align-middle">
            <thead>
              <tr><th style="width:110px">유형</th><th style="width:130px">기존</th><th>범위</th><th style="width:170px">조치</th></tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in unresolvedConflicts" :key="i">
                <td><span class="b2b-badge b2b-badge-warning">{{ c.conflictType }}</span></td>
                <td class="b2b-text-xs">{{ c.existRecord.regNo }}</td>
                <td class="b2b-text-xs">
                  <div><span class="text-muted">기존</span> {{ c.mainAxis.existScopeTxt }}</div>
                  <div><span class="text-muted">신규</span> {{ c.mainAxis.newScopeTxt }}</div>
                </td>
                <td>
                  <select v-model="c.decisionCd" class="form-select form-select-sm">
                    <option v-for="d in decisionCodes" :key="d.code" :value="d.code">{{ d.name }}</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-foot">
          <div class="ms-auto d-flex gap-2">
            <button type="button" class="btn-b2b-action" @click="confirmOpen = false">돌아가서 조치</button>
            <button type="button" class="btn-b2b-danger" @click="cancelWithHistory">등록 취소</button>
            <button type="button" class="btn-b2b-primary" @click="commitSave">조치 반영 후 저장</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 규제 정보 - 등록 / 수정 / 상세  (한 컴포넌트, 3 모드)
 *
 *   /regulation/info/new         → create
 *   /regulation/info/:id/edit    → edit
 *   /regulation/info/:id         → view (수정 폼의 readonly 렌더)
 *
 * 설계 원칙
 *  1) 저장 단위는 레코드(REG_INFO) 1건. 좌측 트리는 "무엇을 편집할지 고르는 장치"일 뿐
 *     노드마다 저장하지 않는다. 미저장 변경은 상단 버튼에 건수로 드러낸다.
 *  2) 좌측 트리의 계층(규제 > 규격 > 인증서)은 PARENT_ITEM_ID 로 테이블에 있다.
 *     보기 옵션이 아니라 데이터이므로 평면화는 정보 손실이다.
 *     '펼치기' 모드는 일괄편집·검색용 보조 모드로만 둔다.
 *  3) 충돌은 저장 직전이 아니라 입력하는 동안 실시간으로 판정한다.
 *     팝업을 페이지로 바꾸는 명분이 이것이다.
 *  4) 네비게이션=좌측, 인사이트=우측으로 고정. 등록도 같은 3열 화면(이력 탭만 비활성).
 */

import RegScopeTree from './components/RegScopeTree.vue'
import RegMasterForm from './components/RegMasterForm.vue'
import RegItemForm from './components/RegItemForm.vue'
import RegInsightPanel from './components/RegInsightPanel.vue'

import { useRegulationStore } from '@/stores/regulationStore'
import { detectConflicts, targetCodes, itemCodes } from '@/utils/regulationConflict'
import {
  buildItemTree,
  flattenItems,
  descendantIdsFlat,
  itemName,
  levelOfType,
  childTypeOf,
  MASTER_NODE_ID
} from '@/utils/regulationTree'
import { decisionCodes } from '@/data/regulationMock'
import { showToast } from '@/utils/toastUtil.js'

const emptyMaster = () => ({
  regInfoId: null,
  regNo: '',
  title: '',
  fieldCd: 'SAFETY',
  markNm: '',
  authority: '',
  url: '',
  summary: '',
  statusCd: 'DRAFT',
  versionNo: 0,
  effectiveDt: '',
  divisionCds: [],
  productGroupCds: [],
  productCds: [],
  regionCds: [],
  countryCds: [],
  attachFiles: []
})

const DRAFT_PREFIX = 'nexhub:reg-draft:'

export default {
  name: 'RegulationInfoEditPage',
  components: { RegScopeTree, RegMasterForm, RegItemForm, RegInsightPanel },
  data() {
    return {
      store: useRegulationStore(),
      decisionCodes,

      master: emptyMaster(),
      itemDrafts: [],
      baseline: { master: '', items: {} },

      treeMode: 'tree',
      focusedNodeId: MASTER_NODE_ID,
      checkedItemIds: [],

      liveConflicts: [],
      detecting: false,
      detectTimer: null,
      resolvedKeys: [],

      insightTab: 'predict',
      histScope: 'record',
      diffHistId: null,

      confirmOpen: false,
      unresolvedConflicts: [],
      draftSavedAt: null,
      draftTimer: null,
      savedAndLeaving: false
    }
  },

  computed: {
    /* ---------------- 모드 ---------------- */
    mode() {
      if (this.$route.name === 'RegulationInfoCreate') return 'create'
      if (this.$route.name === 'RegulationInfoEdit') return 'edit'
      return 'view'
    },
    readonly() {
      return this.mode === 'view'
    },
    modeLabel() {
      return { create: '신규 등록', edit: '수정', view: '상세' }[this.mode]
    },
    routeId() {
      return this.$route.params.regInfoId ? Number(this.$route.params.regInfoId) : null
    },

    /* ---------------- 좌측 트리 ---------------- */
    /**
     * 계층은 PARENT_ITEM_ID 로 데이터에 박혀 있으므로 축 선택이 필요 없다.
     * '펼치기' 모드는 일괄편집·검색용 보조 모드이고, 경로를 sub 에 남겨 정보를 잃지 않는다.
     */
    treeNodes() {
      return this.treeMode === 'tree'
        ? buildItemTree(this.master, this.itemDrafts)
        : flattenItems(this.master, this.itemDrafts)
    },
    itemById() {
      return new Map(this.itemDrafts.map((it) => [it.itemId, it]))
    },

    /* ---------------- 중앙 폼 ---------------- */
    bulkMode() {
      return this.checkedItemIds.length > 1
    },
    showMaster() {
      if (this.bulkMode) return false
      return this.focusedNodeId === MASTER_NODE_ID
    },
    focusedItems() {
      if (this.bulkMode) {
        const set = new Set(this.checkedItemIds)
        return this.itemDrafts.filter((it) => set.has(it.itemId))
      }
      const id = Number(String(this.focusedNodeId).replace('ITEM:', ''))
      const found = this.itemDrafts.filter((it) => it.itemId === id)
      return found.length ? found : []
    },
    mainTitle() {
      if (this.showMaster) return '기본정보 (레코드 공통)'
      if (this.bulkMode) return `정보관리항목 ${this.checkedItemIds.length}건 일괄 편집`
      const it = this.focusedItems[0]
      return it ? itemName(it) || '(항목 미선택)' : '정보관리항목'
    },
    /** 포커스된 항목의 부모. 값 후보를 부모 하위로 좁히는 데 쓴다 */
    focusedParent() {
      if (this.bulkMode || !this.focusedItems.length) return null
      return this.itemById.get(this.focusedItems[0].parentItemId) || null
    },
    focusedPath() {
      if (this.bulkMode || !this.focusedItems.length) return ''
      const parts = []
      let cur = this.itemById.get(this.focusedItems[0].parentItemId)
      let guard = 0
      while (cur && guard < 10) {
        parts.unshift(itemName(cur))
        cur = this.itemById.get(cur.parentItemId)
        guard += 1
      }
      return parts.join(' › ')
    },

    /* ---------------- 충돌 ---------------- */
    /** 폼 값을 REG_INFO + REG_INFO_TARGET 형태로 (충돌 판정 입력) */
    masterAsRecord() {
      const targets = []
      const push = (type, codes) => (codes || []).forEach((cd) => targets.push({ targetType: type, targetCd: cd }))
      push('DIVISION', this.master.divisionCds)
      push('PRODUCT_GROUP', this.master.productGroupCds)
      push('PRODUCT', this.master.productCds)
      push('REGION', this.master.regionCds)
      push('COUNTRY', this.master.countryCds)
      // RULE 축은 적용대상이 아니라 정보관리항목에서 읽으므로 items 를 함께 넘긴다
      return { ...this.master, targets, items: this.itemDrafts.filter((it) => it.itemCd) }
    },
    /** 충돌을 유발한 축. 폼 필드 하이라이트에 쓴다 */
    hitAxes() {
      const set = new Set()
      this.liveConflicts.forEach((c) => {
        c.axisDetails.forEach((d) => {
          if (d.relation !== 'EQUAL') set.add(d.axisKey)
        })
      })
      return [...set]
    },
    /** 충돌 상대가 다루는 규제/규격에 걸린 항목 → 좌측 트리 노란 점 */
    conflictItemIds() {
      if (!this.liveConflicts.length) return []
      const codes = new Set()
      this.liveConflicts.forEach((c) => {
        ['REGULATION', 'STANDARD', 'CERT'].forEach((t) =>
          itemCodes(c.existRecord, t).forEach((cd) => codes.add(cd))
        )
      })
      return this.itemDrafts.filter((it) => codes.has(it.itemCd)).map((it) => it.itemId)
    },

    /* ---------------- dirty / 유효성 ---------------- */
    masterDirty() {
      return JSON.stringify(this.master) !== this.baseline.master
    },
    dirtyItemIds() {
      return this.itemDrafts
        .filter((it) => JSON.stringify(it) !== (this.baseline.items[it.itemId] || ''))
        .map((it) => it.itemId)
    },
    dirtyCount() {
      return this.dirtyItemIds.length + (this.masterDirty ? 1 : 0)
    },
    invalidItemIds() {
      return this.itemDrafts.filter((it) => !it.itemCd).map((it) => it.itemId)
    },

    /* ---------------- 우측 이력 ---------------- */
    conflictHistories() {
      return this.routeId ? this.store.conflictsOf(this.routeId) : []
    },
    /**
     * '레코드 전체' 는 모든 이력, '이 항목' 은 왼쪽 트리에서 고른 노드를 건드린 이력만.
     * 이력마다 저장 시점에 masterChanged / changedItemIds 를 남기므로 그것으로 거른다.
     * 그 기록이 없는 과거 이력(목업)은 무엇을 바꿨는지 알 수 없어 '이 항목' 에서는 빠진다.
     */
    changeHistories() {
      if (!this.routeId) return []
      const all = this.store.historiesOf(this.routeId)
      if (this.histScope === 'record') return all
      const ids = this.scopeItemIds
      return all.filter((h) => {
        if (!Array.isArray(h.changedItemIds)) return false
        return ids ? h.changedItemIds.some((id) => ids.includes(id)) : h.masterChanged
      })
    },
    /** '이 항목' 범위: 기본정보면 null, 항목이면 그 항목(일괄 편집이면 체크된 항목들) id */
    scopeItemIds() {
      if (this.bulkMode) return [...this.checkedItemIds]
      if (this.focusedNodeId === MASTER_NODE_ID) return null
      return this.focusedItems.map((it) => it.itemId)
    },
    histScopeLabel() {
      if (this.bulkMode) return `선택한 항목 ${this.checkedItemIds.length}개`
      return this.showMaster ? '기본정보' : this.mainTitle
    },
    diffSnapshot() {
      if (!this.diffHistId) return null
      const h = this.store.historiesOf(this.routeId).find((x) => x.histId === this.diffHistId)
      return h && h.snapshotJson ? JSON.parse(h.snapshotJson) : null
    },

    neighbor() {
      return this.routeId ? this.store.neighborOf(this.routeId) : { index: 0, total: 0, prevId: null, nextId: null }
    }
  },

  watch: {
    // 라우트가 바뀌면(레코드 이동, 상세→수정) 폼을 다시 적재한다
    '$route.fullPath': {
      handler() {
        this.load()
      }
    },
    // 범위가 바뀔 때마다 실시간 충돌 재판정
    masterAsRecord: {
      deep: true,
      handler() {
        this.scheduleDetect()
        this.scheduleDraftSave()
      }
    },
    itemDrafts: {
      deep: true,
      handler() {
        this.scheduleDraftSave()
      }
    }
  },

  created() {
    this.load()
  },

  mounted() {
    window.addEventListener('beforeunload', this.onBeforeUnload)
  },

  beforeUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload)
    clearTimeout(this.detectTimer)
    clearTimeout(this.draftTimer)
  },

  /** 미저장 변경이 있으면 페이지를 떠나기 전에 막는다 (팝업에는 없던 위험) */
  beforeRouteLeave(to, from, next) {
    if (this.savedAndLeaving || this.readonly || this.dirtyCount === 0) return next()
    if (window.confirm(`저장하지 않은 변경이 ${this.dirtyCount}건 있습니다. 나가시겠습니까?`)) return next()
    return next(false)
  },

  methods: {
    /* ================= 적재 ================= */
    load() {
      const id = this.routeId
      if (!id) {
        this.master = emptyMaster()
        this.itemDrafts = []
      } else {
        const r = this.store.recordById(id)
        if (!r) {
          showToast('레코드를 찾을 수 없습니다.', { type: 'error' })
          this.$router.replace({ name: 'RegulationInfo' })
          return
        }
        const codes = (type) => targetCodes(r, type)
        this.master = {
          ...emptyMaster(),
          regInfoId: r.regInfoId,
          regNo: r.regNo,
          title: r.title,
          fieldCd: r.fieldCd,
          markNm: r.markNm,
          authority: r.authority,
          url: r.url,
          summary: r.summary,
          statusCd: r.statusCd,
          versionNo: r.versionNo,
          effectiveDt: r.effectiveDt,
          divisionCds: codes('DIVISION'),
          productGroupCds: codes('PRODUCT_GROUP'),
          productCds: codes('PRODUCT'),
          regionCds: codes('REGION'),
          countryCds: codes('COUNTRY'),
          attachFiles: [...this.store.attachmentsOf(r.regInfoId)]
        }
        this.itemDrafts = this.store.itemsOf(id).map((it) => ({ ...it }))
      }

      this.snapshotBaseline()
      this.focusedNodeId = MASTER_NODE_ID
      this.checkedItemIds = []
      this.resolvedKeys = []
      this.diffHistId = null
      // 목록의 [이력] 버튼은 ?tab=history 로 들어온다
      this.insightTab = this.$route.query.tab === 'history' && this.mode !== 'create' ? 'history' : 'predict'
      this.restoreDraft()
      this.scheduleDetect(0)
    },

    /** dirty 판정 기준선 */
    snapshotBaseline() {
      this.baseline = {
        master: JSON.stringify(this.master),
        items: this.itemDrafts.reduce((acc, it) => {
          acc[it.itemId] = JSON.stringify(it)
          return acc
        }, {})
      }
    },

    /* ================= 좌측 트리 ================= */
    onFocusNode(node) {
      this.focusedNodeId = node.nodeId
      this.checkedItemIds = []
      if (this.$refs.mainScroll) this.$refs.mainScroll.scrollTop = 0
    },
    /** 최상위(규제) 항목 추가 */
    addItem() {
      this.pushItem(null, 'REGULATION')
    },
    /** 선택된 항목의 자식 추가. 계층이 규제>규격>인증서로 고정이라 구분은 자동 결정 */
    addChild(parent) {
      const childType = childTypeOf(parent.itemTypeCd)
      if (!childType) return
      this.pushItem(parent.itemId, childType)
    },
    pushItem(parentItemId, itemTypeCd) {
      // 신규 항목은 음수 id 로 두고, 저장 시 스토어가 채번한다
      const tempId = Math.min(0, ...this.itemDrafts.map((it) => it.itemId)) - 1
      const siblings = this.itemDrafts.filter((it) => it.parentItemId === parentItemId)
      this.itemDrafts.push({
        itemId: tempId,
        regInfoId: this.master.regInfoId,
        parentItemId,
        itemTypeCd,
        itemCd: '',
        levelNo: levelOfType(itemTypeCd),
        mandatoryYn: 'Y',
        remark: '',
        sortOrder: siblings.length + 1
      })
      this.focusedNodeId = `ITEM:${tempId}`
      this.checkedItemIds = []
    },
    /** 단일/일괄 공통. 선택된 항목 전체에 같은 값을 쓴다 */
    patchItems({ key, value, itemIds }) {
      const set = new Set(itemIds)
      this.itemDrafts = this.itemDrafts.map((it) => (set.has(it.itemId) ? { ...it, [key]: value } : it))
    },
    /** 하위 항목까지 함께 삭제한다 (규격을 지우면 그 인증서도 갈 곳이 없다) */
    removeItems(itemIds) {
      const all = new Set()
      itemIds.forEach((id) => descendantIdsFlat(this.itemDrafts, id).forEach((x) => all.add(x)))
      const extra = all.size - itemIds.length
      const msg = extra > 0
        ? `${itemIds.length}개 항목과 하위 ${extra}개를 함께 삭제합니다. (저장 시 반영)`
        : `${itemIds.length}개 항목을 삭제합니다. (저장 시 반영)`
      if (!window.confirm(msg)) return
      this.itemDrafts = this.itemDrafts.filter((it) => !all.has(it.itemId))
      this.checkedItemIds = []
      this.focusedNodeId = MASTER_NODE_ID
    },

    /* ================= 첨부 ================= */
    addAttach() {
      this.master.attachFiles.push({
        fileId: `NEW-${Date.now()}`,
        fileNm: `첨부문서_${this.master.attachFiles.length + 1}.pdf`,
        size: '1.2MB'
      })
    },
    removeAttach(fileId) {
      this.master.attachFiles = this.master.attachFiles.filter((f) => f.fileId !== fileId)
    },

    /* ================= 실시간 충돌 판정 ================= */
    scheduleDetect(delay = 400) {
      clearTimeout(this.detectTimer)
      this.detecting = true
      this.detectTimer = setTimeout(() => {
        const found = detectConflicts(this.masterAsRecord, this.store.recordsWithItems)
        const prev = new Map(this.liveConflicts.map((c) => [c.existRecord.regInfoId, c.decisionCd]))
        this.liveConflicts = found.map((c) => ({
          ...c,
          // 사용자가 이미 고른 조치는 재판정 후에도 유지한다
          decisionCd: prev.get(c.existRecord.regInfoId) || c.recommend.decisionCd
        }))
        this.detecting = false
      }, delay)
    },
    onDecisionChange({ index, decisionCd }) {
      const c = this.liveConflicts[index]
      if (!c) return
      c.decisionCd = decisionCd
      const key = c.existRecord.regInfoId
      if (!this.resolvedKeys.includes(key)) this.resolvedKeys.push(key)
    },
    /** 충돌 카드 → 원인 필드로 스크롤 + 하이라이트 */
    onFocusAxis(axisKey) {
      // RULE 축의 원인은 폼이 아니라 좌측 항목 트리에 있다
      if (axisKey === 'RULE') {
        const hit = this.conflictItemIds[0]
        if (hit != null) {
          this.focusedNodeId = `ITEM:${hit}`
          this.checkedItemIds = []
        }
        return
      }
      if (!this.showMaster) {
        this.focusedNodeId = MASTER_NODE_ID
        this.checkedItemIds = []
      }
      this.$nextTick(() => {
        if (this.$refs.masterForm) this.$refs.masterForm.focusAxis(axisKey)
      })
    },
    onToggleDiff(h) {
      if (!h.snapshotJson) {
        showToast(`v${h.versionNo} 은 저장된 값이 없어 비교할 수 없습니다.`, { type: 'info' })
        return
      }
      this.diffHistId = this.diffHistId === h.histId ? null : h.histId
      // 비교 표시는 기본정보 폼에 겹쳐지므로, 레코드 전체 범위에서 보고 있으면 폼을 기본정보로 돌린다.
      // ('이 항목' 범위에서 돌리면 목록 기준이 바뀌어 누른 카드가 사라진다)
      if (this.diffHistId && this.histScope === 'record' && !this.showMaster) {
        this.focusedNodeId = MASTER_NODE_ID
        this.checkedItemIds = []
      }
    },

    /* ================= 저장 ================= */
    /**
     * 상태별 검증.
     * DRAFT 는 "일단 만들어 두고 나중에 채운다"를 허용해야 하므로 제목만 본다.
     * REVIEW 이상으로 올릴 때 적용대상과 정보관리항목을 요구한다.
     */
    validate() {
      if (!this.master.title.trim()) return '규제 제목을 입력하세요.'
      if (this.invalidItemIds.length) {
        return `값이 선택되지 않은 정보관리항목이 ${this.invalidItemIds.length}건 있습니다.`
      }
      if (this.master.statusCd === 'DRAFT') return null

      if (!this.master.regionCds.length && !this.master.countryCds.length) {
        return '권역 또는 국가를 선택하세요. (작성중 상태로는 저장할 수 있습니다)'
      }
      if (!this.itemDrafts.length) {
        return '정보관리항목을 1개 이상 등록하세요. (작성중 상태로는 저장할 수 있습니다)'
      }
      return null
    },
    requestSave() {
      const err = this.validate()
      if (err) {
        showToast(err, { type: 'error' })
        return
      }
      // 우측 패널에서 조치를 확정하지 않은 건만 확인받는다
      this.unresolvedConflicts = this.liveConflicts.filter(
        (c) => !this.resolvedKeys.includes(c.existRecord.regInfoId)
      )
      if (this.unresolvedConflicts.length) {
        this.confirmOpen = true
        return
      }
      this.commitSave()
    },
    commitSave() {
      this.confirmOpen = false
      const saved = this.store.saveRecord(
        {
          master: this.master,
          targets: this.masterAsRecord.targets,
          items: this.itemDrafts,
          attachFiles: this.master.attachFiles,
          changes: { masterChanged: this.masterDirty, changedItemIds: this.dirtyItemIds }
        },
        this.liveConflicts
      )
      this.clearDraft()
      this.savedAndLeaving = true
      showToast(
        `${saved.regNo} 저장 완료${this.liveConflicts.length ? ` (충돌 ${this.liveConflicts.length}건 조치)` : ''}`,
        { type: 'success' }
      )
      this.$router.replace({ name: 'RegulationInfoView', params: { regInfoId: saved.regInfoId } })
    },
    cancelWithHistory() {
      this.store.pushConflictHistory(this.unresolvedConflicts, 'CANCEL', null)
      this.confirmOpen = false
      this.clearDraft()
      this.savedAndLeaving = true
      showToast('등록을 취소했습니다. 충돌 이력은 남았습니다.', { type: 'info' })
      this.goList()
    },
    cancelEdit() {
      this.clearDraft()
      if (this.mode === 'edit') {
        this.$router.replace({ name: 'RegulationInfoView', params: { regInfoId: this.routeId } })
      } else {
        this.goList()
      }
    },
    switchToEdit() {
      this.$router.push({ name: 'RegulationInfoEdit', params: { regInfoId: this.routeId } })
    },

    /* ================= 네비게이션 ================= */
    goList() {
      this.$router.push({ name: 'RegulationInfo' })
    },
    moveRecord(id) {
      if (!id) return
      const name = this.mode === 'view' ? 'RegulationInfoView' : 'RegulationInfoEdit'
      // 이력을 보며 넘기는 중이면 다음 레코드도 이력 탭으로 연다
      const query = this.insightTab === 'history' ? { tab: 'history' } : undefined
      this.$router.push({ name, params: { regInfoId: id }, query })
    },

    /* ================= 임시저장 (페이지 전환의 대가) ================= */
    draftKey() {
      return `${DRAFT_PREFIX}${this.routeId || 'new'}`
    },
    scheduleDraftSave() {
      if (this.readonly) return
      clearTimeout(this.draftTimer)
      this.draftTimer = setTimeout(() => {
        if (this.dirtyCount === 0) return
        localStorage.setItem(
          this.draftKey(),
          JSON.stringify({ master: this.master, items: this.itemDrafts, at: Date.now() })
        )
        const d = new Date()
        this.draftSavedAt = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      }, 1200)
    },
    restoreDraft() {
      this.draftSavedAt = null
      if (this.readonly) return
      const raw = localStorage.getItem(this.draftKey())
      if (!raw) return
      try {
        const draft = JSON.parse(raw)
        if (!window.confirm('저장하지 않고 떠난 임시 입력이 있습니다. 불러올까요?')) {
          this.clearDraft()
          return
        }
        this.master = { ...this.master, ...draft.master }
        this.itemDrafts = draft.items || []
      } catch {
        this.clearDraft()
      }
    },
    clearDraft() {
      localStorage.removeItem(this.draftKey())
      this.draftSavedAt = null
    },
    onBeforeUnload(e) {
      if (this.readonly || this.dirtyCount === 0) return
      e.preventDefault()
      e.returnValue = ''
    }
  }
}
</script>

<style scoped>
.reg-edit-page {
  height: 100%;
}

.edit-shell {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 150px);
  min-height: 520px;
  overflow: hidden;
}

/* ---- 상단 바 ---- */
.edit-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.rec-nav {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 5px;
  padding: 1px 4px;
  font-size: 11px;
  color: var(--b2b-color-text-secondary, #6c757d);
  background: var(--b2b-color-bg-card, #fff);
}

.rec-nav button {
  border: 0;
  background: transparent;
  font-size: 10px;
  color: inherit;
  padding: 0 3px;
}

.rec-nav button:disabled {
  opacity: 0.3;
}

/* ---- 3열 본문 ---- */
.edit-body {
  flex: 1;
  min-height: 0;
  display: grid;
}

.edit-body.cols-3 {
  grid-template-columns: 240px minmax(0, 1fr) 300px;
}

.edit-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.main-head {
  padding: 8px 14px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
  font-size: 13px;
}

.main-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
}

/* ---- 저장 확인 모달 ---- */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1080;
}

.modal-box {
  width: min(880px, 94vw);
  max-height: 86vh;
  background: var(--b2b-color-bg-card, #fff);
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-head {
  display: flex;
  align-items: center;
  padding: var(--b2b-space-3) var(--b2b-space-4);
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.modal-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--b2b-space-4);
}

.modal-foot {
  display: flex;
  padding: 10px var(--b2b-space-4);
  border-top: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

@media (max-width: 1200px) {
  .edit-body.cols-3 {
    grid-template-columns: 200px minmax(0, 1fr) 260px;
  }
}
</style>
