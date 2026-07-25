<template>
  <div v-if="isOpen" class="modal-backdrop-custom d-flex align-items-center justify-content-center">
    <div class="modal-card-custom bg-white rounded-3 shadow-lg border-0 overflow-hidden" style="width: 440px; max-width: 95vw;">
      <!-- Modal Header -->
      <div class="px-4 py-3 bg-light border-bottom d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-eye text-primary fs-5"></i>
          <h5 class="fw-bold text-dark m-0 fs-6">컬럼 표시 / 숨기기 설정 (Column Picker)</h5>
        </div>
        <button type="button" class="btn-close" @click="$emit('close')"></button>
      </div>

      <!-- Quick Action Toolbar -->
      <div class="px-4 py-2 bg-body-tertiary border-bottom d-flex align-items-center justify-content-between">
        <span class="text-muted small">총 {{ columnList.length }}개 컬럼 중 {{ visibleCount }}개 표시 중</span>
        <div class="d-flex gap-1.5">
          <button class="btn btn-xs btn-outline-primary py-0.5 px-2 text-nowrap" style="font-size: 12px;" @click="showAll">
            모두 보기
          </button>
          <button class="btn btn-xs btn-outline-secondary py-0.5 px-2 text-nowrap" style="font-size: 12px;" @click="resetDefault">
            기본 설정
          </button>
        </div>
      </div>

      <!-- Modal Body (Column Checklist) -->
      <div class="p-4 overflow-auto" style="max-height: 380px;">
        <div class="d-flex flex-column gap-2.5">
          <div
            v-for="col in columnList"
            :key="col.name"
            class="d-flex align-items-center justify-content-between p-2 rounded-2 border transition-all cursor-pointer"
            :class="col.visible ? 'bg-light border-primary-subtle' : 'bg-body-secondary opacity-75 border-secondary-subtle'"
            @click="toggleCol(col)"
          >
            <div class="d-flex align-items-center gap-2">
              <div class="form-check form-switch m-0 p-0 d-flex align-items-center">
                <input
                  class="form-check-input ms-0 cursor-pointer"
                  type="checkbox"
                  role="switch"
                  :checked="col.visible"
                  @click.stop
                  @change="toggleCol(col)"
                />
              </div>
              <span class="fw-semibold text-dark small ms-2">{{ col.headerText }}</span>
            </div>
            <span class="badge" :class="col.visible ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'">
              {{ col.visible ? '표시' : '숨김' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-4 py-3 bg-light border-top d-flex justify-content-end">
        <button type="button" class="btn btn-sm btn-primary px-4 fw-semibold shadow-sm" @click="$emit('close')">
          확인
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ColumnPickerModal',
  props: {
    isOpen: { type: Boolean, default: false },
    columns: { type: Array, default: () => [] }
  },
  data() {
    return {
      columnList: []
    }
  },
  watch: {
    columns: {
      immediate: true,
      deep: true,
      handler(newCols) {
        this.columnList = (newCols || []).map(c => ({ ...c }))
      }
    }
  },
  computed: {
    visibleCount() {
      return this.columnList.filter(c => c.visible).length
    }
  },
  methods: {
    toggleCol(col) {
      col.visible = !col.visible
      this.$emit('toggle-column', { name: col.name, visible: col.visible })
    },
    showAll() {
      this.columnList.forEach(col => {
        col.visible = true
        this.$emit('toggle-column', { name: col.name, visible: true })
      })
    },
    resetDefault() {
      this.showAll()
    }
  }
}
</script>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
  z-index: 1050;
}
.modal-card-custom {
  animation: fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeInModal {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.cursor-pointer {
  cursor: pointer;
}
.transition-all {
  transition: all 0.15s ease-in-out;
}
</style>
