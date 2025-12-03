<template>
  <div class="github-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">사용자 관리</h2>
        <p class="page-subtitle">시스템 사용자 목록을 조회하고 관리합니다</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary github-btn github-btn-primary" @click="openPopup()">
          <i class="bi bi-plus-lg"></i> 사용자 추가
        </button>
      </div>
    </div>

    <div class="row g-3">
      <!-- LEFT: 사용자 목록 -->
      <div class="col-12 col-lg-6">
        <!-- 검색바 -->
        <div class="filter-bar">
          <div class="search-wrapper">
            <i class="bi bi-search search-icon"></i>
            <input
              v-model="keyword"
              class="form-control search-input"
              placeholder="ID, 이름, 부서, 직무로 검색..."
            />
          </div>
          <div class="result-info">
            <span>총 {{ visibleUsers.length }}명</span>
          </div>
        </div>

        <!-- 사용자 목록 테이블 -->
        <div class="content-card">
          <div class="table-responsive">
            <table class="table github-table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th class="text-center" style="width: 50px">
                    <input
                      class="form-check-input"
                      ref="masterPage"
                      type="checkbox"
                      :checked="allCheckedPage"
                      :disabled="!visibleUsers.length"
                      @change="toggleAllVisiblePage"
                    />
                  </th>
                  <th
                    class="user-select-none"
                    @click="sortBy('userId')"
                    :aria-sort="ariaSort('userId')"
                    style="cursor: pointer"
                  >
                    UserId <small class="text-muted">{{ sortIndicator('userId') }}</small>
                  </th>
                  <th
                    class="user-select-none"
                    @click="sortBy('name')"
                    :aria-sort="ariaSort('name')"
                    style="cursor: pointer"
                  >
                    사용자명 <small class="text-muted">{{ sortIndicator('name') }}</small>
                  </th>
                  <th
                    class="user-select-none"
                    @click="sortBy('dept')"
                    :aria-sort="ariaSort('dept')"
                    style="cursor: pointer"
                  >
                    부서명 <small class="text-muted">{{ sortIndicator('dept') }}</small>
                  </th>
                  <th
                    class="user-select-none"
                    @click="sortBy('role')"
                    :aria-sort="ariaSort('role')"
                    style="cursor: pointer"
                  >
                    직무 <small class="text-muted">{{ sortIndicator('role') }}</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in visibleUsers" :key="u.userId">
                  <td class="text-center">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      v-model="checkedIds"
                      :value="u.userId"
                    />
                  </td>
                  <td>
                    <code class="github-code">{{ u.userId }}</code>
                  </td>
                  <td>
                    <button
                      class="btn btn-link btn-sm p-0 text-decoration-none"
                      @click="openPopup()"
                    >
                      {{ u.name }}
                    </button>
                  </td>
                  <td class="text-github-secondary">{{ u.dept }}</td>
                  <td class="text-github-secondary">{{ u.role }}</td>
                </tr>
                <tr v-if="visibleUsers.length === 0">
                  <td colspan="5" class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <div>데이터가 없습니다</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- RIGHT: 선택된 사용자 -->
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
import SelectedUsers from '@/components/SelectedUsers.vue'
import { openUserPopup } from '@/utils/showPop.js'
import { showToast } from '@/utils/toastUtil.js'
import http from '@/utils/http'

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
    loadUsers() {
      http
        .get('/users')
        .then((res) => {
          this.users = res.data ?? []
        })
        .catch((error) => {
          console.error('UserPage - API error:', error)
          const msg = error?.response?.data?.message || error.message || '사용자 목록 조회 실패'
          showToast(msg, { type: 'error' })
        })
    },
    async openPopup() {
      const selectedList = await openUserPopup({
        // preselectedIds: this.checkedIds,
      })

      if (Array.isArray(selectedList) && selectedList.length > 0) {
        const addIds = selectedList.map((u) => u.userId)
        const set = new Set(this.checkedIds)
        for (const id of addIds) {
          if (!set.has(id)) this.checkedIds.push(id)
        }
        showToast(`Added ${selectedList.length}`, { type: 'success', duration: 3000 })
      } else {
        showToast('No items added', { type: 'info', duration: 2000 })
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

<style scoped>
@import '@/assets/styles/github-theme.css';
</style>
