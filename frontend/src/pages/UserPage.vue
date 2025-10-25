<template>
  <div class="container py-4">
    <div class="row g-3">
      <!-- LEFT: 사용자 목록 -->
      <div class="col-12 col-lg-6">
        <div class="card shadow-sm">
          <div class="card-header d-flex align-items-center justify-content-between">
            <h2 class="h5 mb-0">사용자 목록</h2>
            <input
              v-model="keyword"
              class="form-control form-control-sm w-auto"
              placeholder="검색: ID/이름/부서/직무"
            />
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-sm mb-0 align-middle">
                <thead class="table-light">
                  <tr>
                    <th style="width: 44px">
                      <div class="form-check m-0 d-flex justify-content-center">
                        <input
                          class="form-check-input"
                          ref="masterPage"
                          type="checkbox"
                          :checked="allCheckedPage"
                          :disabled="!visibleUsers.length"
                          @change="toggleAllVisiblePage"
                          aria-label="현재 보이는 사용자 전체 선택/해제"
                        />
                      </div>
                    </th>
                    <th
                      class="user-select-none text-nowrap"
                      scope="col"
                      @click="sortBy('userId')"
                      :aria-sort="ariaSort('userId')"
                    >
                      UserId <small class="text-muted">{{ sortIndicator('userId') }}</small>
                    </th>
                    <th
                      class="user-select-none text-nowrap"
                      scope="col"
                      @click="sortBy('name')"
                      :aria-sort="ariaSort('name')"
                    >
                      사용자명 <small class="text-muted">{{ sortIndicator('name') }}</small>
                    </th>
                    <th
                      class="user-select-none text-nowrap"
                      scope="col"
                      @click="sortBy('dept')"
                      :aria-sort="ariaSort('dept')"
                    >
                      부서명 <small class="text-muted">{{ sortIndicator('dept') }}</small>
                    </th>
                    <th
                      class="user-select-none text-nowrap"
                      scope="col"
                      @click="sortBy('role')"
                      :aria-sort="ariaSort('role')"
                    >
                      직무 <small class="text-muted">{{ sortIndicator('role') }}</small>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in visibleUsers" :key="u.userId">
                    <td>
                      <div class="form-check m-0 d-flex justify-content-center">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          v-model="checkedIds"
                          :value="u.userId"
                          aria-label="사용자 선택"
                        />
                      </div>
                    </td>
                    <td>
                      <span class="font-monospace text-body">{{ u.userId }}</span>
                    </td>
                    <td>
                      <button class="btn btn-outline-primary btn-sm" @click="openPopup()">
                        {{ u.name }}
                      </button>
                    </td>
                    <td>{{ u.dept }}</td>
                    <td>{{ u.role }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: 선택된 사용자 (공통 컴포넌트만 사용) -->
      <div class="col-12 col-lg-6 d-flex flex-column">
        <SelectedUsers
          class="flex-grow-1"
          :users="selectedUsers"
          @remove="removeSelected"
          @clear="clearSelected"
        />
      </div>
    </div>
  </div>
</template>

<script>
import SelectedUsers from '../components/SelectedUsers.vue'
import { generateMockUsers } from '../utils/generateMockUsers.js'
import { openUserPopup } from '../utils/showPop.js'
import axios from '../utils/axiosInstance'
//import { toastMsg } from '../utils/toastUtil.js'

export default {
  name: 'UserPage',
  components: { SelectedUsers },
  data() {
    return {
      keyword: '',
      sortKey: null, // 'userId' | 'name' | 'dept' | 'role' | null
      sortDir: 'none', // 'none' | 'asc' | 'desc'
      users: [],
      checkedIds: [], // 선택 순서 보존
    }
  },
  async mounted() {
    await this.loadUsers()
    this.$nextTick(this.updateMasterIndeterminatePage)
  },
  computed: {
    visibleUsers() {
      const kw = this.keyword.trim().toLowerCase()
      const filtered = !kw
        ? this.users.slice()
        : this.users.filter(
            (u) =>
              (u.userId || '').toLowerCase().includes(kw) ||
              (u.name || '').toLowerCase().includes(kw) ||
              (u.dept || '').toLowerCase().includes(kw) ||
              (u.role || '').toLowerCase().includes(kw)
          )

      if (!this.sortKey || this.sortDir === 'none') return filtered

      const dir = this.sortDir === 'asc' ? 1 : -1
      const key = this.sortKey
      const collator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' })
      return filtered.sort((a, b) => collator.compare(a[key], b[key]) * dir)
    },
    selectedUsers() {
      const map = new Map(this.users.map((u) => [u.userId, u]))
      return this.checkedIds.map((id) => map.get(id)).filter(Boolean)
    },
    allCheckedPage() {
      if (!this.visibleUsers.length) return false
      const set = new Set(this.checkedIds)
      return this.visibleUsers.every((u) => set.has(u.userId))
    },
  },
  watch: {
    checkedIds() {
      this.$nextTick(this.updateMasterIndeterminatePage)
    },
    visibleUsers() {
      this.$nextTick(this.updateMasterIndeterminatePage)
    },
  },
  methods: {
    async loadUsers() {
      try {
        const res = await axios.get('/users', { headers: { 'Cache-Control': 'no-store' } })
        // axios는 기본적으로 res.data에 응답이 들어감
        const json = res.data
        this.users = Array.isArray(json) ? json : json.users || []
      } catch (e) {
        // API /api/users 로드 실패 → 목업 생성으로 대체
        this.users = generateMockUsers(100, { seed: 42 })
      }
    },
    async openPopup() {
      try {
        // 헬퍼 함수를 사용해서 팝업 열기
        const selectedList = await openUserPopup({
          // preselectedIds: this.checkedIds, // 미리 선택된 ID 목록 (필요시)
        })

        // 사용자가 확인을 누른 경우
        if (selectedList && selectedList.length > 0) {
          const addIds = selectedList.map((u) => u.userId)
          const set = new Set(this.checkedIds)
          for (const id of addIds) {
            if (!set.has(id)) {
              this.checkedIds.push(id)
            }
          }

          this.$toast(`${selectedList.length}명 추가됨`, {
            type: 'success',
            duration: 2000,
          })
        } else {
          // 취소하거나 아무것도 선택하지 않은 경우
          this.$toast('추가된 항목이 없습니다', {
            type: 'info',
            duration: 2000,
          })
        }
      } catch (error) {
        // 팝업 에러
        this.$toast('팝업을 여는 중 오류가 발생했습니다', {
          type: 'error',
          duration: 3000,
        })
      }
    },
    removeSelected(userId) {
      this.checkedIds = this.checkedIds.filter((x) => x !== userId)
    },
    clearSelected() {
      this.checkedIds = []
    },

    // 정렬 토글
    sortBy(col) {
      if (this.sortKey !== col) {
        this.sortKey = col
        this.sortDir = 'asc'
        return
      }
      if (this.sortDir === 'asc') this.sortDir = 'desc'
      else if (this.sortDir === 'desc') {
        this.sortKey = null
        this.sortDir = 'none'
      } else this.sortDir = 'asc'
    },
    sortIndicator(col) {
      if (this.sortKey !== col || this.sortDir === 'none') return ''
      return this.sortDir === 'asc' ? '▲' : '▼'
    },
    ariaSort(col) {
      if (this.sortKey !== col || this.sortDir === 'none') return 'none'
      return this.sortDir === 'asc' ? 'ascending' : 'descending'
    },

    // 마스터 체크(보이는 행 기준)
    toggleAllVisiblePage() {
      const ids = this.visibleUsers.map((u) => u.userId)
      const allIncluded = ids.every((id) => this.checkedIds.includes(id))
      this.checkedIds = allIncluded
        ? this.checkedIds.filter((id) => !ids.includes(id))
        : Array.from(new Set([...this.checkedIds, ...ids]))
      this.$nextTick(this.updateMasterIndeterminatePage)
    },
    updateMasterIndeterminatePage() {
      const el = this.$refs.masterPage
      if (!el) return
      const visibleIds = new Set(this.visibleUsers.map((u) => u.userId))
      let selected = 0
      for (const id of this.checkedIds) if (visibleIds.has(id)) selected++
      el.indeterminate = selected > 0 && selected < visibleIds.size
    },
  },
}
</script>
