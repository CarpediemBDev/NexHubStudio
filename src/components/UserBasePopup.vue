<template>
  <div class="modal fade show" style="display: block" tabindex="-1" role="dialog" aria-modal="true">
    <div class="modal-dialog" ref="dlg" :style="dialogInlineStyle">
      <div class="modal-content shadow" :style="modalContentStyle">
        <div class="modal-header" @pointerdown="onDragStart">
          <h5 class="modal-title">사용자 선택</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="onClose"></button>
        </div>

        <div class="modal-body">
          <div class="row g-3">
            <!-- LEFT: 전체 사용자 목록 -->
            <div class="col-12 col-lg-6">
              <div class="border rounded-3 h-100 d-flex flex-column">
                <div class="p-2 border-bottom">
                  <input
                    v-model="leftKeyword"
                    class="form-control form-control-sm"
                    placeholder="검색(ID/이름/부서/직무)"
                  />
                </div>
                <div class="p-0 flex-grow-1">
                  <div class="table-responsive code-inherit h-100">
                    <table class="table table-sm table-hover mb-0 align-middle">
                      <thead class="table-light position-sticky top-0">
                        <tr>
                          <th style="width: 44px">
                            <div class="form-check m-0 d-flex justify-content-center">
                              <input
                                class="form-check-input"
                                ref="master"
                                type="checkbox"
                                :checked="allChecked"
                                :disabled="!filteredLeft.length"
                                @change="toggleAllVisible"
                                aria-label="현재 보이는 사용자 전체 선택/해제"
                              />
                            </div>
                          </th>
                          <th class="text-nowrap">UserId</th>
                          <th>사용자명</th>
                          <th>부서명</th>
                          <th>직무</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="u in filteredLeft" :key="u.userId">
                          <td>
                            <div class="form-check m-0 d-flex justify-content-center">
                              <input
                                class="form-check-input"
                                type="checkbox"
                                v-model="checkedIds"
                                :value="u.userId"
                              />
                            </div>
                          </td>
                          <td>
                            <span class="font-monospace text-body">{{ u.userId }}</span>
                          </td>
                          <td>{{ u.name }}</td>
                          <td>{{ u.dept }}</td>
                          <td>{{ u.role }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- RIGHT: 선택 미리보기 (공통 컴포넌트) -->
            <div class="col-12 col-lg-6 d-flex flex-column">
              <SelectedUsers
                class="flex-grow-1"
                :users="preview"
                @remove="uncheck"
                @clear="checkedIds = []"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <small class="me-auto text-muted"
            >체크박스로 여러 명 선택 후 <strong>확인</strong>을 누르세요.</small
          >
          <button class="btn btn-outline-secondary" @click="onClose">취소</button>
          <button class="btn btn-success" :disabled="!checkedIds.length" @click="emitConfirm">
            확인 ({{ checkedIds.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show"></div>
</template>

<script>
import SelectedUsers from './SelectedUsers.vue'
import { generateMockUsers } from '../utils/generateMockUsers.js'

export default {
  name: 'UserPopup',
  components: { SelectedUsers },
  emits: ['close', 'confirm'],
  props: {
    preselectedIds: { type: Array, default: () => [] },

    /* 사이즈/레이아웃 옵션 */
    maxWidth: { type: [Number, String], default: 960 },
    marginX: { type: Number, default: 16 },
    heightVh: { type: Number, default: 80 },
    minHeightPx: { type: Number, default: 560 },
    maxHeightPx: { type: Number, default: 720 },

    /* 드래그 */
    draggable: { type: Boolean, default: true },
  },
  data() {
    return {
      users: [], // ← 여기서 자체 보관
      leftKeyword: '',
      checkedIds: [...this.preselectedIds],
      dragging: false,
      dragStart: { x: 0, y: 0 },
      dialogStart: { left: 0, top: 0 },
      loading: true,
    }
  },
  computed: {
    filteredLeft() {
      const kw = this.leftKeyword.trim().toLowerCase()
      return !kw
        ? this.users
        : this.users.filter(
            (u) =>
              (u.userId || '').toLowerCase().includes(kw) ||
              (u.name || '').toLowerCase().includes(kw) ||
              (u.dept || '').toLowerCase().includes(kw) ||
              (u.role || '').toLowerCase().includes(kw)
          )
    },
    preview() {
      const map = new Map(this.users.map((u) => [u.userId, u]))
      return this.checkedIds.map((id) => map.get(id)).filter(Boolean)
    },
    allChecked() {
      if (!this.filteredLeft.length) return false
      const set = new Set(this.checkedIds)
      return this.filteredLeft.every((u) => set.has(u.userId))
    },
    dialogInlineStyle() {
      const max = typeof this.maxWidth === 'number' ? `${this.maxWidth}px` : this.maxWidth
      const side = `${this.marginX}px`
      return {
        position: 'fixed',
        margin: '0',
        transform: 'none',
        width: `min(${max}, calc(100vw - (${side} * 2)))`,
        maxWidth: max,
      }
    },
    modalContentStyle() {
      return {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        '--min-h': `${this.minHeightPx}px`,
        '--max-h': `${this.maxHeightPx}px`,
        '--pref-vh': `${this.heightVh}vh`,
        '--pref-dvh': `${this.heightVh}dvh`,
      }
    },
  },
  watch: {
    checkedIds() {
      this.$nextTick(this.updateMasterIndeterminate)
    },
    filteredLeft() {
      this.$nextTick(this.updateMasterIndeterminate)
    },
  },
  mounted() {
    this.loadUsers()
    this.$nextTick(() => {
      this.centerDialog()
      this.updateMasterIndeterminate()
    })
    window.addEventListener('resize', this.centerDialog, { passive: true })

    if (this.draggable) {
      window.addEventListener('pointermove', this.onDragMove, { passive: false })
      window.addEventListener('pointerup', this.onDragEnd, { passive: true })
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.centerDialog)
    if (this.draggable) {
      window.removeEventListener('pointermove', this.onDragMove)
      window.removeEventListener('pointerup', this.onDragEnd)
    }
  },
  methods: {
    async loadUsers() {
      this.loading = true
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}db.json`, { cache: 'no-store' })
        if (!res.ok) throw new Error('db.json not found')
        const json = await res.json()
        this.users = Array.isArray(json) ? json : json.users || []
      } catch (e) {
        console.warn('[Popup] db.json 로드 실패 → 목업으로 대체', e)
        this.users = generateMockUsers(100, { seed: 43 })
      } finally {
        this.loading = false
      }
    },

    onClose() {
      this.$emit('close')
    },
    emitConfirm() {
      const set = new Set(this.checkedIds)
      this.$emit(
        'confirm',
        this.users.filter((u) => set.has(u.userId))
      )
    },

    toggleAllVisible() {
      const ids = this.filteredLeft.map((u) => u.userId)
      const allIncluded = ids.every((id) => this.checkedIds.includes(id))
      this.checkedIds = allIncluded
        ? this.checkedIds.filter((id) => !ids.includes(id))
        : Array.from(new Set([...this.checkedIds, ...ids]))
    },
    updateMasterIndeterminate() {
      const el = this.$refs.master
      if (!el) return
      const ids = new Set(this.filteredLeft.map((u) => u.userId))
      let selected = 0
      for (const id of this.checkedIds) if (ids.has(id)) selected++
      el.indeterminate = selected > 0 && selected < ids.size
    },
    uncheck(id) {
      this.checkedIds = this.checkedIds.filter((x) => x !== id)
    },

    /* Modal 중앙정렬 */
    centerDialog() {
      const dlg = this.$refs.dlg
      if (!dlg) return
      const rect = dlg.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const left = Math.max(this.marginX, (vw - rect.width) / 2)
      const top = Math.max(12, (vh - rect.height) / 2)
      dlg.style.left = `${left}px`
      dlg.style.top = `${top}px`
    },
    onDragStart(e) {
      if (!this.draggable || e.button !== 0) return
      this.dragging = true
      const rect = this.$refs.dlg.getBoundingClientRect()
      this.dragStart = { x: e.clientX, y: e.clientY }
      this.dialogStart = { left: rect.left, top: rect.top }
      document.body.style.userSelect = 'none'
    },
    onDragMove(e) {
      if (!this.dragging) return
      e.preventDefault()
      const dx = e.clientX - this.dragStart.x
      const dy = e.clientY - this.dragStart.y
      const dlg = this.$refs.dlg
      const rect = dlg.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      let newLeft = this.dialogStart.left + dx
      let newTop = this.dialogStart.top + dy
      const maxLeft = vw - rect.width - this.marginX
      const maxTop = vh - rect.height - 12
      newLeft = Math.min(Math.max(this.marginX, newLeft), Math.max(this.marginX, maxLeft))
      newTop = Math.min(Math.max(12, newTop), Math.max(12, maxTop))

      // 화면 밖으로 나가지 않도록 제한
      dlg.style.left = `${newLeft}px`
      dlg.style.top = `${newTop}px`
    },
    onDragEnd() {
      if (!this.dragging) return
      this.dragging = false
      document.body.style.userSelect = ''
    },
  },
}
</script>

<style scoped>
/* dvh 우선, 폴백은 vh + clamp */
.modal-content {
  height: clamp(var(--min-h, 560px), var(--pref-vh, 80vh), var(--max-h, 720px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
@supports (height: 100dvh) {
  .modal-content {
    height: clamp(var(--min-h, 560px), var(--pref-dvh, 80dvh), var(--max-h, 720px));
  }
}
.modal-body {
  flex: 1 1 auto;
  overflow: auto;
}

@media (max-width: 576px) {
  .modal .modal-dialog {
    width: calc(100vw - 12px) !important;
  }
}
.modal-header {
  cursor: move;
}

/* 이 테이블 내부에서는 <code>색 대신 본문색으로 */
.code-inherit code {
  color: var(--bs-body-color) !important;
  background: transparent;
  padding: 0;
}
</style>
