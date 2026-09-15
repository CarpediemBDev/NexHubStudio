<template>
  <nav class="b2b-pagination" aria-label="페이지 이동">
    <!-- 좌: 건수 / 현재 표시 범위 -->
    <div class="pg-summary">
      총 <strong>{{ formattedTotal }}</strong>건
      <span v-if="total > 0" class="pg-range">· {{ rangeStart }}–{{ rangeEnd }}</span>
    </div>

    <!-- 중앙: 페이지 버튼 -->
    <div class="pg-pages">
      <button type="button" class="pg-btn" :disabled="page <= 1" title="첫 페이지" @click="go(1)">
        <i class="bi bi-chevron-double-left"></i>
      </button>
      <button type="button" class="pg-btn" :disabled="page <= 1" title="이전 페이지" @click="go(page - 1)">
        <i class="bi bi-chevron-left"></i>
      </button>

      <template v-for="(item, i) in pageItems" :key="i">
        <span v-if="item === '…'" class="pg-ellipsis">…</span>
        <button
          v-else
          type="button"
          class="pg-btn pg-num"
          :class="{ active: item === page }"
          :aria-current="item === page ? 'page' : null"
          @click="go(item)"
        >
          {{ item }}
        </button>
      </template>

      <button type="button" class="pg-btn" :disabled="page >= totalPages" title="다음 페이지" @click="go(page + 1)">
        <i class="bi bi-chevron-right"></i>
      </button>
      <button type="button" class="pg-btn" :disabled="page >= totalPages" title="마지막 페이지" @click="go(totalPages)">
        <i class="bi bi-chevron-double-right"></i>
      </button>
    </div>

    <!-- 우: 페이지당 행 수 (다른 곳에 두면 빈 칸으로 남겨 번호를 가운데에 유지) -->
    <div class="pg-size">
      <PageSizeSelect
        v-if="showSizeSelect"
        :model-value="pageSize"
        :options="pageSizeOptions"
        @update:model-value="$emit('update:pageSize', $event)"
      />
    </div>
  </nav>
</template>

<script>
/**
 * 공통 페이지네이션 바.
 * 데이터를 자르지 않는다 — 부모가 page/pageSize 로 직접 slice 한다.
 *
 * <Pagination v-model:page="page" v-model:page-size="size" :total="rows.length" />
 *
 * 페이지 크기 셀렉트를 다른 위치(예: 그리드 툴바)에 둘 때는 :show-size-select="false" 로 숨기고
 * 그 자리에 <PageSizeSelect v-model="size" /> 를 둔다. 크기가 어디서 바뀌든 페이지 보정은 이 컴포넌트가 한다.
 */
import PageSizeSelect from '@/components/PageSizeSelect.vue'

export default {
  name: 'Pagination',
  components: { PageSizeSelect },
  props: {
    total: { type: Number, default: 0 },
    page: { type: Number, default: 1 },
    pageSize: { type: Number, default: 20 },
    pageSizeOptions: { type: Array, default: () => [10, 20, 30, 50, 100] },
    showSizeSelect: { type: Boolean, default: true },
    /** 가운데에 보일 페이지 번호 버튼 수(첫/끝 페이지 포함) */
    maxButtons: { type: Number, default: 7 }
  },
  emits: ['update:page', 'update:pageSize'],
  created() {
    // 페이지당 개수나 건수가 바뀌면 page 를 다시 잡는다. 둘이 같이 바뀔 수 있어 한 감시로 계산한다.
    this.$watch(
      () => [this.total, this.pageSize],
      ([, size], [, oldSize]) => {
        let next = this.page
        // 보고 있던 첫 행이 새 페이지 크기에서도 보이도록
        if (size !== oldSize) next = Math.floor(((this.page - 1) * oldSize) / size) + 1
        // 건수가 줄어 현재 페이지가 없어지면 마지막 페이지로
        next = Math.min(next, this.totalPages)
        if (next !== this.page) this.$emit('update:page', next)
      }
    )
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize))
    },
    rangeStart() {
      return (this.page - 1) * this.pageSize + 1
    },
    rangeEnd() {
      return Math.min(this.page * this.pageSize, this.total)
    },
    formattedTotal() {
      return this.total.toLocaleString()
    },
    // 1 … 4 5 [6] 7 8 … 20 형태. 버튼 수가 페이지 이동해도 일정하게 유지된다.
    pageItems() {
      const total = this.totalPages
      const max = Math.max(5, this.maxButtons)
      if (total <= max) return Array.from({ length: total }, (_, i) => i + 1)

      const side = max - 2 // 첫/끝 페이지를 뺀 가운데 슬롯
      let start = Math.max(2, this.page - Math.floor((side - 1) / 2))
      let end = start + side - 1
      if (end >= total) {
        end = total - 1
        start = end - side + 1
      }
      // 생략 기호가 들어갈 자리는 번호 하나를 양보한다
      if (start > 2) start++
      if (end < total - 1) end--

      const items = [1]
      if (start > 2) items.push('…')
      for (let p = start; p <= end; p++) items.push(p)
      if (end < total - 1) items.push('…')
      items.push(total)
      return items
    }
  },
  methods: {
    go(p) {
      const next = Math.min(Math.max(1, p), this.totalPages)
      if (next !== this.page) this.$emit('update:page', next)
    }
  }
}
</script>

<style scoped>
.b2b-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  height: 44px;
  padding: 0 12px;
  border-top: 1px solid var(--b2b-color-border, #e2e8f0);
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-muted, #64748b);
  font-size: 12px;
  user-select: none;
}

.pg-summary {
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pg-summary strong {
  color: var(--b2b-color-text-main, #1e293b);
  font-weight: 600;
}
.pg-range {
  margin-left: 2px;
  color: var(--b2b-color-text-faint, #94a3b8);
}

.pg-pages {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--b2b-color-text-main, #1e293b);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.12s, border-color 0.12s;
}
.pg-btn .bi {
  font-size: 11px;
}
.pg-btn:hover:not(:disabled):not(.active) {
  background: var(--b2b-color-hover-bg, #f1f5f9);
}
.pg-btn:focus-visible {
  outline: 2px solid var(--b2b-color-primary, #2563eb);
  outline-offset: 1px;
}
.pg-btn:disabled {
  color: var(--b2b-color-text-faint, #94a3b8);
  opacity: 0.5;
  cursor: default;
}
.pg-btn.active {
  background: var(--b2b-color-primary, #2563eb);
  border-color: var(--b2b-color-primary, #2563eb);
  color: #fff;
  font-weight: 600;
  cursor: default;
}

.pg-ellipsis {
  min-width: 20px;
  text-align: center;
  color: var(--b2b-color-text-faint, #94a3b8);
}

.pg-size {
  flex: 1 1 0;
  display: flex;
  justify-content: flex-end;
}

/* 좁은 폭: 부가 텍스트를 숨겨 한 줄(44px)을 유지 */
@media (max-width: 640px) {
  .pg-range,
  .pg-size :deep(.pss-label),
  .pg-btn:has(.bi-chevron-double-left),
  .pg-btn:has(.bi-chevron-double-right) {
    display: none;
  }
  .pg-summary,
  .pg-size {
    flex: 0 0 auto;
  }
}
</style>
