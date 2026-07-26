<template>
  <div class="b2b-card">
    <div class="b2b-card-header bg-theme-subcard">
      <span class="b2b-text-sm text-theme-secondary fw-bold">선택 {{ users.length }}명</span>
      <button
        class="btn-b2b-action btn-sm"
        :disabled="!users.length"
        @click="$emit('clear')"
        type="button"
      >
        전체 선택해제
      </button>
    </div>

    <div class="b2b-card-body p-2">
      <div v-if="!users.length" class="text-theme-secondary b2b-text-sm py-4 text-center">
        <i class="bi bi-inbox fs-4 d-block mb-1 opacity-75"></i>
        체크박스로 사용자를 선택하세요.
      </div>

      <div
        v-else
        v-for="u in users"
        :key="u.userId"
        class="d-flex align-items-center justify-content-between border border-theme bg-theme-card rounded-3 p-2 mb-2"
      >
        <div>
          <strong class="me-1 text-theme-primary b2b-text-body">{{ u.name }}</strong>
          <span class="text-theme-secondary b2b-text-sm">({{ u.userId }})</span>
          <span class="text-theme-secondary b2b-text-sm"> · {{ u.dept }}</span>
          <span class="text-theme-secondary b2b-text-sm"> · {{ u.role }}</span>
        </div>

        <button class="btn-close ms-auto b2b-text-sm" @click="$emit('remove', u.userId)" type="button"></button>
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
