<template>
  <div class="border rounded-3">
    <div class="p-2 border-bottom d-flex justify-content-between align-items-center">
      <small class="text-muted">선택 {{ users.length }}명</small>
      <button
        class="btn btn-outline-secondary btn-sm"
        :disabled="!users.length"
        @click="$emit('clear')"
        type="button"
      >
        전체 선택해제
      </button>
    </div>

    <div class="p-2">
      <div v-if="!users.length" class="text-muted small py-2">체크박스로 사용자를 선택하세요.</div>

      <div
        v-else
        v-for="u in users"
        :key="u.userId"
        class="d-flex align-items-start border rounded-3 p-2 mb-2"
      >
        <div>
          <strong class="me-1">{{ u.name }}</strong>
          <span class="text-muted">{{ u.userId }}</span>
          <span class="text-muted"> · {{ u.dept }}</span>
          <span class="text-muted"> · {{ u.role }}</span>
        </div>

        <button class="btn-close ms-auto" @click="$emit('remove', u.userId)" type="button"></button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelectedUsers',
  props: { users: { type: Array, required: true } },
  emits: ['remove', 'clear'],
}
</script>
