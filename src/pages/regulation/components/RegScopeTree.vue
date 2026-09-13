<template>
  <div class="reg-tree-col">
    <!-- 헤더: 계층 ⇄ 펼치기 토글 -->
    <div class="col-head">
      <span class="col-title">정보관리항목</span>
      <div class="view-toggle ms-auto">
        <button
          type="button"
          :class="{ on: mode === 'tree' }"
          title="규제 › 규격 › 인증서 계층 (테이블의 실제 구조)"
          @click="$emit('update:mode', 'tree')"
        >
          계층
        </button>
        <button
          type="button"
          :class="{ on: mode === 'flat' }"
          title="일괄 편집·검색용 보조 모드. 계층은 항목마다 경로로 표시됩니다"
          @click="$emit('update:mode', 'flat')"
        >
          펼치기
        </button>
      </div>
    </div>

    <!-- 계층 규칙 안내 -->
    <div class="axis-line">
      <i class="bi bi-diagram-2 me-1"></i>
      <template v-if="mode === 'tree'">규제 › 규격 › 인증서</template>
      <template v-else><span class="text-muted">계층 펼침 (보조 모드)</span></template>
    </div>

    <!-- 본문 -->
    <div class="tree-scroll">
      <div
        v-for="node in visibleRows"
        :key="node.nodeId"
        class="tree-row"
        :class="{
          master: node.type === 'MASTER',
          focused: node.nodeId === focusedId,
          checked: node.type === 'ITEM' && checkedSet.has(node.itemId)
        }"
        :style="{ paddingLeft: 6 + node.depth * 13 + 'px' }"
        @click="onRowClick(node)"
      >
        <!-- 접기/펴기 -->
        <i
          v-if="node.children && node.children.length"
          class="bi caret"
          :class="collapsed.has(node.nodeId) ? 'bi-caret-right-fill' : 'bi-caret-down-fill'"
          @click.stop="toggleCollapse(node.nodeId)"
        ></i>
        <span v-else class="caret-space"></span>

        <!-- 다중 선택 체크박스 (일괄 편집용) -->
        <input
          v-if="node.type !== 'MASTER'"
          class="form-check-input tree-check"
          type="checkbox"
          :checked="isNodeChecked(node)"
          :indeterminate.prop="isNodeIndeterminate(node)"
          @click.stop
          @change="onCheck(node, $event.target.checked)"
        />

        <!-- 상태 점: 변경됨 / 충돌 / 미입력 -->
        <span class="dot" :class="dotClass(node)" :title="dotTitle(node)"></span>

        <span class="label" :title="node.label">{{ node.label }}</span>
        <span v-if="node.type === 'ITEM'" class="type-tag" :class="'t-' + node.itemTypeCd">{{ node.sub }}</span>
      </div>

      <div v-if="visibleRows.length <= 1" class="empty">
        등록된 정보관리항목이 없습니다.
      </div>
    </div>

    <!-- 푸터: 범례 + 항목 추가 -->
    <div class="col-foot">
      <div class="legend">
        <span><i class="dot dirty"></i>변경됨</span>
        <span><i class="dot warn"></i>충돌</span>
        <span><i class="dot req"></i>필수 미입력</span>
      </div>
      <button v-if="!readonly" type="button" class="btn-b2b-action btn-compact w-100 mt-2" @click="$emit('add-item')">
        <i class="bi bi-plus-lg text-success me-1"></i>규제 추가 (최상위)
      </button>
    </div>
  </div>
</template>

<script>
import { toVisibleRows, descendantItemIds } from '@/utils/regulationTree'

export default {
  name: 'RegScopeTree',
  props: {
    /** buildItemTree() / flattenItems() 결과 */
    nodes: { type: Array, required: true },
    /** 현재 포커스된 노드 id (우측 폼이 보여주는 대상) */
    focusedId: { type: String, default: null },
    /** 체크된 itemId 배열 (일괄 편집 대상) */
    checkedIds: { type: Array, default: () => [] },
    /** 값이 바뀐 itemId 배열 */
    dirtyIds: { type: Array, default: () => [] },
    /** 충돌이 걸린 itemId 배열 */
    conflictIds: { type: Array, default: () => [] },
    /** 필수값 미입력 itemId 배열 */
    invalidIds: { type: Array, default: () => [] },
    /** 마스터 노드가 dirty 인지 */
    masterDirty: { type: Boolean, default: false },
    masterConflict: { type: Boolean, default: false },
    mode: { type: String, default: 'tree' },
    readonly: { type: Boolean, default: false }
  },
  emits: ['update:mode', 'update:checkedIds', 'focus-node', 'add-item'],
  data() {
    return { collapsed: new Set() }
  },
  computed: {
    visibleRows() {
      return toVisibleRows(this.nodes, this.collapsed)
    },
    checkedSet() {
      return new Set(this.checkedIds)
    },
    dirtySet() {
      return new Set(this.dirtyIds)
    },
    conflictSet() {
      return new Set(this.conflictIds)
    },
    invalidSet() {
      return new Set(this.invalidIds)
    }
  },
  methods: {
    toggleCollapse(nodeId) {
      const next = new Set(this.collapsed)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      this.collapsed = next
    },
    onRowClick(node) {
      this.$emit('focus-node', node)
    },

    /* ---- 다중 선택: 상위를 체크하면 하위 항목까지 함께 ---- */
    isNodeChecked(node) {
      const ids = descendantItemIds(node)
      return ids.length > 0 && ids.every((id) => this.checkedSet.has(id))
    },
    isNodeIndeterminate(node) {
      const ids = descendantItemIds(node)
      const on = ids.filter((id) => this.checkedSet.has(id)).length
      return on > 0 && on < ids.length
    },
    onCheck(node, checked) {
      const ids = descendantItemIds(node)
      const next = new Set(this.checkedIds)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      this.$emit('update:checkedIds', [...next])
    },

    /* ---- 상태 점 ---- */
    dotClass(node) {
      if (node.type === 'MASTER') {
        if (this.masterConflict) return 'warn'
        return this.masterDirty ? 'dirty' : 'none'
      }
      if (this.invalidSet.has(node.itemId)) return 'req'
      if (this.conflictSet.has(node.itemId)) return 'warn'
      if (this.dirtySet.has(node.itemId)) return 'dirty'
      return 'none'
    },
    dotTitle(node) {
      return { dirty: '변경됨 (미저장)', warn: '충돌 있음', req: '필수값 미입력', none: '' }[this.dotClass(node)]
    }
  }
}
</script>

<style scoped>
.reg-tree-col {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
  border-right: 1px solid var(--b2b-color-border, #dee2e6);
}

.col-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
}

.col-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.view-toggle {
  display: inline-flex;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 5px;
  overflow: hidden;
}

.view-toggle button {
  border: 0;
  background: transparent;
  font-size: 11px;
  padding: 2px 8px;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.view-toggle button.on {
  background: var(--b2b-color-primary, #0d6efd);
  color: #fff;
  font-weight: 600;
}

.axis-line {
  padding: 5px 10px;
  font-size: 11px;
  color: var(--b2b-color-text-secondary, #6c757d);
  border-bottom: 1px dashed var(--b2b-color-border, #dee2e6);
}

.tree-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 0;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  border-left: 2px solid transparent;
}

.tree-row:hover {
  background: rgba(13, 110, 253, 0.06);
}

.tree-row.master {
  font-weight: 700;
}

.tree-row.focused {
  background: rgba(13, 110, 253, 0.12);
  border-left-color: var(--b2b-color-primary, #0d6efd);
}

.tree-row.checked {
  background: rgba(25, 135, 84, 0.08);
}

.caret,
.caret-space {
  width: 11px;
  font-size: 9px;
  flex: none;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.tree-check {
  margin: 0;
  flex: none;
  width: 12px;
  height: 12px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  display: inline-block;
}

.dot.dirty { background: #0d6efd; }
.dot.warn  { background: #ffc107; }
.dot.req   { background: #dc3545; }
.dot.none  { background: #dee2e6; }

.label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-tag {
  margin-left: auto;
  font-size: 9px;
  font-weight: 700;
  padding: 0 5px;
  border-radius: 8px;
  flex: none;
  white-space: nowrap;
}

.type-tag.t-REGULATION { background: #e7f1ff; color: #0a58ca; }
.type-tag.t-STANDARD   { background: #e8f6ef; color: #146c43; }
.type-tag.t-CERT       { background: #fff3cd; color: #a1690a; }

.empty {
  padding: 20px 10px;
  text-align: center;
  font-size: 11px;
  color: var(--b2b-color-text-secondary, #adb5bd);
}

.col-foot {
  border-top: 1px solid var(--b2b-color-border, #dee2e6);
  padding: 8px 10px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 10px;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.btn-compact {
  padding: 3px 8px;
  font-size: 11px;
}
</style>
