<template>
  <div class="quick-search-wrapper d-inline-flex align-items-center">
    <!-- Collapsed Toggle Button when closed -->
    <button
      v-if="!isExpanded"
      class="btn-compact btn-compact-secondary position-relative transition-all"
      title="그리드 통합 검색 (단축키: 🔍)"
      @click="toggleExpand"
    >
      <i class="bi bi-search text-primary"></i>
      <span>검색</span>
      <span v-if="searchResult.count > 0" class="position-absolute top-0 start-100 translate-middle p-1 bg-primary border border-light rounded-circle">
        <span class="visually-hidden">New alerts</span>
      </span>
    </button>

    <!-- Expanded Sliding Search Box -->
    <div v-else class="quick-search-bar d-inline-flex align-items-center gap-1 bg-white border border-primary-subtle rounded-2 px-2 py-1 shadow-sm animation-slide-in">
      <i class="bi bi-search text-primary small me-1"></i>
      <input
        ref="searchInput"
        type="text"
        class="form-control form-control-sm border-0 p-0 shadow-none text-dark bg-transparent"
        style="width: 130px; font-size: 13px;"
        v-model="searchQuery"
        placeholder="검색어 입력..."
        @keyup.enter="triggerSearch('next')"
        @keyup.esc="toggleExpand"
        @input="onInput"
      />

      <!-- Result Count Badge -->
      <span v-if="searchResult.count > 0" class="badge bg-primary text-white px-1.5 py-0.5 small me-1" style="font-size: 11px;">
        {{ searchResult.current }}/{{ searchResult.count }}
      </span>

      <!-- Action Buttons -->
      <div class="d-flex align-items-center gap-0.5 border-start ps-1 ms-0.5">
        <button
          class="btn btn-xs btn-light p-1 line-height-1 border-0 rounded"
          title="이전 (Shift+Enter)"
          :disabled="!searchQuery.trim()"
          @click="triggerSearch('prev')"
        >
          <i class="bi bi-chevron-up text-secondary" style="font-size: 11px;"></i>
        </button>
        <button
          class="btn btn-xs btn-light p-1 line-height-1 border-0 rounded"
          title="다음 (Enter)"
          :disabled="!searchQuery.trim()"
          @click="triggerSearch('next')"
        >
          <i class="bi bi-chevron-down text-secondary" style="font-size: 11px;"></i>
        </button>
        <button
          class="btn btn-xs btn-light p-1 line-height-1 border-0 rounded ms-0.5 text-danger"
          title="닫기"
          @click="toggleExpand"
        >
          <i class="bi bi-x-lg" style="font-size: 11px;"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuickSearchBar',
  props: {
    searchResult: {
      type: Object,
      default: () => ({ count: 0, current: 0 })
    }
  },
  data() {
    return {
      searchQuery: '',
      isExpanded: false
    }
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded
      if (this.isExpanded) {
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus()
          }
        })
      } else {
        if (!this.searchQuery) {
          this.$emit('clear')
        }
      }
    },
    triggerSearch(direction = 'next') {
      if (!this.searchQuery.trim()) return
      this.$emit('search', { query: this.searchQuery, direction })
    },
    onInput() {
      if (!this.searchQuery.trim()) {
        this.$emit('clear')
      }
    }
  }
}
</script>

<style scoped>
.quick-search-wrapper {
  position: relative;
}
.animation-slide-in {
  animation: slideExpand 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideExpand {
  from {
    opacity: 0;
    transform: scaleX(0.85);
  }
  to {
    opacity: 1;
    transform: scaleX(1);
  }
}
.btn-compact {
  height: 30px;
  padding: 0 10px;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease-in-out;
  cursor: pointer;
  line-height: 1;
}
.btn-compact-secondary {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
}
.btn-compact-secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}
.btn-xs {
  padding: 1px 4px;
}
.transition-all {
  transition: all 0.15s ease-in-out;
}
</style>
