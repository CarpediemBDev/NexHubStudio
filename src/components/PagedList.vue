<template>
  <div class="p-2 border-top d-flex justify-content-between align-items-center">
    <div class="small text-muted">
      <slot name="left">{{ leftText }}</slot>
    </div>
    <div>
      <button
        class="btn btn-sm btn-outline-secondary me-1"
        :disabled="page <= 1"
        @click="$emit('prev')"
      >
        이전
      </button>
      <span class="mx-1">{{ page }} / {{ totalPages }}</span>
      <button
        class="btn btn-sm btn-outline-secondary ms-1"
        :disabled="page >= totalPages"
        @click="$emit('next')"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pager',
  props: {
    page: { type: Number, required: true },
    totalPages: { type: Number, required: true },
    leftText: { type: String, default: '' },
  },
}
</script>

<style scoped>
/* small adjustments if needed */
</style>
