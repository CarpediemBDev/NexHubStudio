<!-- UserPopup.vue -->
<template>
  <div class="modal fade show" style="display: block" tabindex="-1" role="dialog" aria-modal="true">
    <div class="modal-dialog" ref="dlg" :style="dialogInlineStyle">
      <div class="modal-content shadow" :style="modalContentStyle">
        <div class="modal-header">
          <h5 class="modal-title">사용자 선택</h5>
          <button type="button" class="btn-close" aria-label="Close" @click="onClose"></button>
        </div>

        <div class="modal-body">
          <div class="row g-3">
            <!-- LEFT: 전체 사용자 목록 -->
            <div class="col-12 col-lg-6">
              <div class="border rounded-3">
                <div class="p-2 border-bottom">
                  <input
                    v-model="leftKeyword"
                    class="form-control form-control-sm"
                    placeholder="검색(ID/이름/부서/직무)"
                  />
                </div>

                <!-- 표는 직접 렌더, 아래에 Pager만 '붙임' -->
                <div class="table-responsive">
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
                      <!-- ✅ 여기서 items 대신 paginatedLeft 사용 -->
                      <tr v-for="u in paginatedLeft" :key="u.userId">
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

              <PagedList
                :page="leftPage"
                :totalPages="leftTotalPages"
                :leftText="`총 ${filteredLeft.length}건`"
                @prev="leftPrev"
                @next="leftNext"
              />
            </div>

            <!-- RIGHT: 선택 미리보기 -->
            <div class="col-12 col-lg-6">
              <!-- ✅ 여기서도 items 대신 pagedPreview 사용 -->
              <SelectedUsers
                :users="pagedPreview"
                @remove="onRemoveSelected"
                @clear="onClearSelected"
              />

              <!-- 🔻 선택영역에도 Pager '붙임' (필요할 때만 표시) -->
              <PagedList
                v-if="preview.length > rightPageSize"
                :page="rightPage"
                :totalPages="selectedTotalPages"
                :leftText="`선택 ${preview.length}명`"
                @prev="selectedPrev"
                @next="selectedNext"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <small class="me-auto text-muted">
            체크박스로 여러 명 선택 후 <strong>확인</strong>을 누르세요.
          </small>
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
import PagedList from './PagedList.vue'
import http from '@/utils/http'

export default {
  name: 'UserPopup',
  components: { SelectedUsers, PagedList },
  emits: ['close', 'confirm'],
  props: {
    preselectedIds: { type: Array, default: () => [] },
    modalId: { type: String, default: '' },

    /* 사이즈/레이아웃 옵션 */
    maxWidth: { type: [Number, String], default: 960 },
    marginX: { type: Number, default: 16 },
    heightVh: { type: Number, default: 80 },
    minHeightPx: { type: Number, default: 560 },
    maxHeightPx: { type: Number, default: 720 },
  },
  data() {
    return {
      users: [],
      leftKeyword: '',
      checkedIds: [...this.preselectedIds],
      // paging state (kept here so parent can control if needed)
      leftPage: 1,
      leftPageSize: 10,
      rightPage: 1,
      rightPageSize: 10,
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
    // left paging (helper used when operating on current page)
    leftTotalPages() {
      return Math.max(1, Math.ceil(this.filteredLeft.length / this.leftPageSize))
    },
    paginatedLeft() {
      const start = (this.leftPage - 1) * this.leftPageSize
      return this.filteredLeft.slice(start, start + this.leftPageSize)
    },
    // right paging helpers
    selectedTotalPages() {
      return Math.max(1, Math.ceil(this.preview.length / this.rightPageSize))
    },
    pagedPreview() {
      const start = (this.rightPage - 1) * this.rightPageSize
      return this.preview.slice(start, start + this.rightPageSize)
    },
    allChecked() {
      if (!this.paginatedLeft.length) return false
      const set = new Set(this.checkedIds)
      return this.paginatedLeft.every((u) => set.has(u.userId))
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
      this.$nextTick(() => {
        this.updateMasterIndeterminate()
        if (this.rightPage > this.selectedTotalPages) this.rightPage = this.selectedTotalPages
      })
    },
    filteredLeft() {
      // reset left page when filter changes
      this.leftPage = 1
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
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.centerDialog)
  },
  methods: {
    async loadUsers() {
      const res = await http.get('/users')
      this.users = res.data ?? []
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
      // operate on current left page
      const ids = this.paginatedLeft.map((u) => u.userId)
      const allIncluded = ids.every((id) => this.checkedIds.includes(id))
      this.checkedIds = allIncluded
        ? this.checkedIds.filter((id) => !ids.includes(id))
        : Array.from(new Set([...this.checkedIds, ...ids]))
    },
    updateMasterIndeterminate() {
      const el = this.$refs.master
      if (!el) return
      const ids = new Set(this.paginatedLeft.map((u) => u.userId))
      let selected = 0
      for (const id of this.checkedIds) if (ids.has(id)) selected++
      el.indeterminate = selected > 0 && selected < ids.size
    },
    uncheck(id) {
      this.checkedIds = this.checkedIds.filter((x) => x !== id)
    },

    // left paging controls
    leftPrev() {
      if (this.leftPage > 1) this.leftPage--
    },
    leftNext() {
      if (this.leftPage < this.leftTotalPages) this.leftPage++
    },

    // right paging controls and handlers
    selectedPrev() {
      if (this.rightPage > 1) this.rightPage--
    },
    selectedNext() {
      if (this.rightPage < this.selectedTotalPages) this.rightPage++
    },
    onRemoveSelected(id) {
      this.uncheck(id)
      if (this.rightPage > this.selectedTotalPages) this.rightPage = this.selectedTotalPages
    },
    onClearSelected() {
      this.checkedIds = []
      this.rightPage = 1
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
</style>
