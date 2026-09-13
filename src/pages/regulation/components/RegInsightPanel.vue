<template>
  <div class="reg-insight-col">
    <!-- 탭: 등록 모드에서는 이력 탭이 비활성 -->
    <div class="col-head">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="ins-tab"
        :class="{ on: activeTab === t.key, off: t.disabled }"
        :disabled="t.disabled"
        @click="$emit('update:activeTab', t.key)"
      >
        {{ t.name }}
        <span v-if="t.count !== null" class="cnt">{{ t.count }}</span>
      </button>
    </div>

    <div class="ins-scroll">
      <!-- ============ 충돌예측 (실시간) ============ -->
      <template v-if="activeTab === 'predict'">
        <div v-if="detecting" class="ins-note">
          <span class="spinner-border spinner-border-sm me-2"></span>범위 비교 중…
        </div>

        <div v-else-if="!liveConflicts.length" class="ins-ok">
          <i class="bi bi-check-circle-fill me-1"></i>
          현재 입력 범위와 겹치는 기존 레코드가 없습니다.
        </div>

        <div
          v-for="(c, idx) in liveConflicts"
          :key="idx"
          class="ins-card warn"
          @click="$emit('focus-axis', c.mainAxis.axisKey)"
        >
          <div class="d-flex align-items-center gap-1 mb-1">
            <span class="b2b-badge" :class="conflictBadge(c.conflictType)">{{ conflictName(c.conflictType) }}</span>
            <span class="axis">{{ c.mainAxis.axisName }} 축</span>
            <i class="bi bi-crosshair ms-auto text-muted" title="원인 필드로 이동"></i>
          </div>

          <div class="regno">{{ c.existRecord.regNo }}</div>
          <div class="title" :title="c.existRecord.title">{{ c.existRecord.title }}</div>

          <div class="scope">
            <div><span class="k">기존</span>{{ c.mainAxis.existScopeTxt }}</div>
            <div><span class="k">신규</span>{{ c.mainAxis.newScopeTxt }}</div>
          </div>

          <div v-if="!readonly" class="mt-2" @click.stop>
            <select
              class="form-select form-select-sm"
              :value="c.decisionCd"
              @change="$emit('update:decision', { index: idx, decisionCd: $event.target.value })"
            >
              <option v-for="d in decisionCodes" :key="d.code" :value="d.code">{{ d.name }}</option>
            </select>
            <div class="reco">{{ c.recommend.text }}</div>
          </div>
        </div>

        <div v-if="!readonly" class="ins-note mt-2">
          입력을 바꿀 때마다 다시 판정합니다. 카드를 누르면 원인이 된 필드로 이동합니다.
        </div>
      </template>

      <!-- ============ 충돌 이력 ============ -->
      <template v-else-if="activeTab === 'conflict'">
        <div v-if="!conflictHistories.length" class="ins-empty">충돌 이력이 없습니다.</div>
        <div v-for="c in conflictHistories" :key="c.conflictId" class="ins-card">
          <div class="d-flex align-items-center gap-1 mb-1">
            <span class="b2b-badge" :class="conflictBadge(c.conflictType)">{{ conflictName(c.conflictType) }}</span>
            <span class="axis ms-auto">{{ c.detectDt }}</span>
          </div>
          <div class="regno">{{ c.newRegNo }} ↔ {{ c.existRegNo }}</div>
          <div class="scope">
            <div><span class="k">기존</span>{{ c.existScopeTxt }}</div>
            <div><span class="k">신규</span>{{ c.newScopeTxt }}</div>
          </div>
          <div class="decision">
            <strong>{{ decisionName(c.decisionCd) }}</strong>
            <div class="text-muted">{{ c.decisionNote }}</div>
          </div>
        </div>
      </template>

      <!-- ============ 변경 이력 ============ -->
      <template v-else>
        <div class="scope-switch">
          <button type="button" :class="{ on: histScope === 'node' }" @click="$emit('update:histScope', 'node')">
            이 항목
          </button>
          <button type="button" :class="{ on: histScope === 'record' }" @click="$emit('update:histScope', 'record')">
            레코드 전체
          </button>
        </div>

        <div v-if="histScope === 'node'" class="ins-note mb-2">
          <i class="bi bi-funnel me-1"></i><strong>{{ histScopeLabel }}</strong> 을(를) 바꾼 이력만 보입니다.
          항목 단위 기록은 이 화면에서 저장한 이력부터 남습니다.
        </div>

        <div v-if="!changeHistories.length" class="ins-empty">변경 이력이 없습니다.</div>
        <div
          v-for="h in changeHistories"
          :key="h.histId"
          class="ins-card"
          :class="{ clickable: h.snapshotJson, on: diffHistId === h.histId }"
          :title="h.snapshotJson ? '이 버전 값과 비교' : '이 버전은 저장된 값이 없어 비교할 수 없습니다'"
          @click="$emit('toggle-diff', h)"
        >
          <div class="d-flex align-items-center gap-1 mb-1">
            <span class="b2b-badge b2b-badge-secondary">v{{ h.versionNo }}</span>
            <span class="b2b-badge" :class="changeBadge(h.changeType)">{{ changeTypeName(h.changeType) }}</span>
            <i
              v-if="h.snapshotJson"
              class="bi bi-layers-half ms-auto"
              :class="diffHistId === h.histId ? 'text-primary' : 'text-muted'"
            ></i>
            <span v-else class="nodiff ms-auto">비교 불가</span>
          </div>
          <div class="note">{{ h.changeNote }}</div>
          <div class="meta">{{ h.regId }} · {{ h.regDt }}</div>
        </div>

        <div v-if="diffHistId" class="ins-note mt-2">
          <i class="bi bi-info-circle me-1"></i>
          기본정보 폼에서 이 버전과 다른 값이 회색 취소선으로 함께 표시됩니다.
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { conflictTypes, decisionCodes } from '@/data/regulationMock'

export default {
  name: 'RegInsightPanel',
  props: {
    /** 'create' | 'edit' | 'view' */
    mode: { type: String, default: 'edit' },
    activeTab: { type: String, default: 'predict' },
    /** detectConflicts() 실시간 결과 (+ decisionCd 부여) */
    liveConflicts: { type: Array, default: () => [] },
    detecting: { type: Boolean, default: false },
    conflictHistories: { type: Array, default: () => [] },
    changeHistories: { type: Array, default: () => [] },
    histScope: { type: String, default: 'record' },
    /** '이 항목' 범위일 때 무엇으로 거르는지 (기본정보 / 항목명 / 선택 n개) */
    histScopeLabel: { type: String, default: '' },
    diffHistId: { type: [Number, String], default: null },
    readonly: { type: Boolean, default: false }
  },
  emits: ['update:activeTab', 'update:decision', 'update:histScope', 'focus-axis', 'toggle-diff'],
  data() {
    return { decisionCodes }
  },
  computed: {
    tabs() {
      const isNew = this.mode === 'create'
      return [
        { key: 'predict', name: '충돌예측', count: this.liveConflicts.length, disabled: false },
        { key: 'conflict', name: '충돌이력', count: isNew ? null : this.conflictHistories.length, disabled: isNew },
        { key: 'history', name: '변경이력', count: isNew ? null : this.changeHistories.length, disabled: isNew }
      ]
    }
  },
  methods: {
    conflictName(code) {
      return (conflictTypes.find((c) => c.code === code) || {}).name || code
    },
    decisionName(code) {
      return (decisionCodes.find((d) => d.code === code) || {}).name || code
    },
    conflictBadge(code) {
      return {
        SAME: 'b2b-badge-danger',
        PARENT: 'b2b-badge-warning',
        CHILD: 'b2b-badge-primary',
        OVERLAP: 'b2b-badge-secondary'
      }[code] || 'b2b-badge-secondary'
    },
    changeTypeName(code) {
      return { INSERT: '신규 등록', UPDATE: '수정', DELETE: '삭제', CONFLICT_RESOLVE: '충돌 조치' }[code] || code
    },
    changeBadge(code) {
      return {
        INSERT: 'b2b-badge-success',
        UPDATE: 'b2b-badge-primary',
        DELETE: 'b2b-badge-danger',
        CONFLICT_RESOLVE: 'b2b-badge-warning'
      }[code] || 'b2b-badge-secondary'
    }
  }
}
</script>

<style scoped>
.reg-insight-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
  border-left: 1px solid var(--b2b-color-border, #dee2e6);
}

.col-head {
  display: flex;
  gap: 3px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
}

.ins-tab {
  flex: 1;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 5px;
  font-size: 11px;
  padding: 3px 4px;
  color: var(--b2b-color-text-secondary, #6c757d);
  white-space: nowrap;
}

.ins-tab.on {
  background: var(--b2b-color-bg-card, #fff);
  border-color: var(--b2b-color-border, #dee2e6);
  color: var(--b2b-color-text-primary, #212529);
  font-weight: 700;
}

.ins-tab.off {
  opacity: 0.4;
}

.ins-tab .cnt {
  display: inline-block;
  margin-left: 3px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 0 5px;
  font-size: 10px;
}

.ins-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px;
}

.ins-card {
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 6px;
  background: var(--b2b-color-bg-card, #fff);
  padding: 8px;
  margin-bottom: 8px;
  font-size: 11px;
}

.ins-card.warn {
  border-color: #ffe69c;
  background: #fffdf5;
  cursor: pointer;
}

.ins-card.warn:hover {
  background: #fff8e1;
}

.ins-card.clickable {
  cursor: pointer;
}

.ins-card.on {
  border-color: var(--b2b-color-primary, #0d6efd);
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.12);
}

.axis {
  font-size: 10px;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.regno {
  font-weight: 700;
}

.title {
  color: var(--b2b-color-text-secondary, #6c757d);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scope {
  margin-top: 5px;
  line-height: 1.6;
}

.scope .k {
  display: inline-block;
  width: 28px;
  color: var(--b2b-color-text-secondary, #adb5bd);
}

.decision {
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px dashed var(--b2b-color-border, #dee2e6);
}

.reco {
  margin-top: 4px;
  font-size: 10px;
  color: var(--b2b-color-text-secondary, #6c757d);
  line-height: 1.5;
}

.note {
  line-height: 1.5;
}

.nodiff {
  font-size: 10px;
  color: var(--b2b-color-text-secondary, #adb5bd);
}

.meta {
  margin-top: 4px;
  font-size: 10px;
  color: var(--b2b-color-text-secondary, #adb5bd);
}

.ins-ok {
  border: 1px solid #badbcc;
  background: #f3faf6;
  color: #0f5132;
  border-radius: 6px;
  padding: 10px;
  font-size: 11px;
}

.ins-note {
  font-size: 10px;
  color: var(--b2b-color-text-secondary, #6c757d);
  line-height: 1.6;
  padding: 0 2px;
}

.ins-empty {
  text-align: center;
  color: var(--b2b-color-text-secondary, #adb5bd);
  font-size: 11px;
  padding: 24px 0;
}

.scope-switch {
  display: flex;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 8px;
}

.scope-switch button {
  flex: 1;
  border: 0;
  background: transparent;
  font-size: 11px;
  padding: 3px 0;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.scope-switch button.on {
  background: var(--b2b-color-primary, #0d6efd);
  color: #fff;
  font-weight: 600;
}
</style>
