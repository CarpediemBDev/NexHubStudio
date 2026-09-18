<template>
  <label class="page-size-select" :class="`is-${size}`">
    <span class="pss-label">{{ label }}</span>
    <select class="pss-select" :value="modelValue" @change="onChange($event.target.value)">
      <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}개</option>
    </select>
  </label>
</template>

<script>
/**
 * 페이지당 행 수 셀렉트. Pagination 바 안에서도, 그리드 툴바에서도 같은 모양으로 쓴다.
 * <PageSizeSelect v-model="pageSize" size="sm" />
 */
export default {
  name: 'PageSizeSelect',
  props: {
    modelValue: { type: Number, default: 20 },
    options: { type: Array, default: () => [10, 20, 30, 50, 100] },
    label: { type: String, default: '페이지당' },
    /** md: 페이저 바(28px) / sm: 그리드 툴바(24px) */
    size: { type: String, default: 'md' }
  },
  emits: ['update:modelValue'],
  methods: {
    onChange(value) {
      this.$emit('update:modelValue', Number(value))
    }
  }
}
</script>

<style scoped>
.page-size-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--b2b-color-text-muted, #64748b);
  font-size: 12px;
  white-space: nowrap;
}
.pss-select {
  height: 28px;
  padding: 0 26px 0 8px;
  border: 1px solid var(--b2b-color-border, #e2e8f0);
  border-radius: 6px;
  background: var(--b2b-color-bg-card, #fff)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%2394a3b8' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E")
    no-repeat right 8px center;
  color: var(--b2b-color-text-main, #1e293b);
  font-size: 12px;
  appearance: none;
  cursor: pointer;
}
.is-sm .pss-select {
  height: 24px;
  padding: 0 22px 0 7px;
  background-position: right 7px center;
}
.pss-select:hover {
  border-color: var(--b2b-color-text-faint, #94a3b8);
}
.pss-select:focus {
  outline: none;
  border-color: var(--b2b-color-primary, #2563eb);
  box-shadow: 0 0 0 3px rgba(var(--b2b-color-primary-rgb, 37, 99, 235), 0.15);
}
</style>
