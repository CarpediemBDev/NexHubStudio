<template>
  <div class="code-group-list-page">
    <div class="toolbar mb-3">
      <h3 class="mb-0">공통코드 그룹 관리</h3>
      <div class="d-flex gap-2">
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="그룹 검색..."
          v-model="searchKeyword"
          @input="handleSearch"
          style="width: 200px"
        />
        <button class="btn btn-primary btn-sm" @click="openAddPopup">
          <i class="bi bi-plus-lg"></i> 코드 그룹 등록
        </button>
        <button class="btn btn-outline-danger btn-sm" @click="deleteSelected">
          <i class="bi bi-trash"></i> 삭제
        </button>
      </div>
    </div>

    <!-- 카드 레이아웃 적용 -->
    <div class="table-card">
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th class="text-center" style="width: 50px">
                <input
                  type="checkbox"
                  class="form-check-input"
                  @change="toggleSelectAll"
                  :checked="isAllSelected"
                />
              </th>
              <th class="text-center" style="width: 60px">ID</th>
              <th style="width: 140px">그룹코드</th>
              <th style="width: 160px">그룹명</th>
              <th class="text-center" style="width: 70px">아이콘</th>
              <th class="text-center" style="width: 80px">색상</th>
              <th class="text-center" style="width: 120px">카테고리</th>
              <th>설명</th>
              <th class="text-center" style="width: 70px">사용</th>
              <th class="text-center" style="width: 150px">등록일</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="group in rows"
              :key="group.id"
              @click="handleRowClick(group)"
              class="row-clickable"
            >
              <td class="text-center" @click.stop>
                <input
                  type="checkbox"
                  class="form-check-input"
                  :value="group.id"
                  v-model="selectedIds"
                />
              </td>
              <td class="text-center text-muted">{{ group.id }}</td>
              <td>
                <code>{{ group.groupCode }}</code>
              </td>
              <td class="fw-semibold">{{ group.groupName }}</td>
              <td class="text-center">
                <i v-if="group.icon" :class="group.icon" class="icon-display"></i>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="text-center">
                <span
                  v-if="group.colorCode"
                  class="color-badge"
                  :style="{ background: group.colorCode }"
                  :title="group.colorCode"
                ></span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="text-center">
                <span v-if="group.category" class="badge bg-light text-dark border">{{
                  group.category
                }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="text-muted">{{ group.description || '-' }}</td>
              <td class="text-center">
                <span :class="group.useYn === 'Y' ? 'text-success fw-bold' : 'text-secondary'">
                  {{ group.useYn }}
                </span>
              </td>
              <td class="text-center text-muted small">{{ formatDate(group.createdAt) }}</td>
            </tr>
            <tr v-if="rows.length === 0">
              <td colspan="10" class="text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 3rem; opacity: 0.3"></i>
                <div class="mt-2">데이터가 없습니다</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 코드 그룹 등록/수정 팝업 -->
    <CommonCodeGroupPopup
      v-if="showPopup"
      :group="selectedGroup"
      @close="closePopup"
      @save="handleSave"
    />
  </div>
</template>

<script>
import CommonCodeGroupPopup from '@/components/CommonCodeGroupPopup.vue'
import http from '@/utils/http'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'CommonCodeGroupListPage',
  components: { CommonCodeGroupPopup },
  data() {
    return {
      rows: [],
      allGroups: [],
      searchKeyword: '',
      showPopup: false,
      selectedGroup: null,
      selectedIds: [],
    }
  },
  computed: {
    isAllSelected() {
      return this.rows.length > 0 && this.selectedIds.length === this.rows.length
    },
  },
  mounted() {
    this.loadGroups()
  },
  methods: {
    loadGroups() {
      http
        .get('/common-code-groups')
        .then((res) => {
          this.allGroups = res.data ?? []
          this.applyFilter()
        })
        .catch((error) => {
          showToast('그룹 목록 조회 실패', { type: 'error' })
        })
    },
    applyFilter() {
      if (!this.searchKeyword) {
        this.rows = this.allGroups
      } else {
        const keyword = this.searchKeyword.toLowerCase()
        this.rows = this.allGroups.filter(
          (g) =>
            g.groupCode?.toLowerCase().includes(keyword) ||
            g.groupName?.toLowerCase().includes(keyword) ||
            g.description?.toLowerCase().includes(keyword) ||
            g.category?.toLowerCase().includes(keyword)
        )
      }
      this.selectedIds = []
    },
    handleSearch() {
      this.applyFilter()
    },
    toggleSelectAll(event) {
      if (event.target.checked) {
        this.selectedIds = this.rows.map((g) => g.id)
      } else {
        this.selectedIds = []
      }
    },
    openAddPopup() {
      this.selectedGroup = null
      this.showPopup = true
    },
    closePopup() {
      this.showPopup = false
      this.selectedGroup = null
    },
    handleSave() {
      this.closePopup()
      this.loadGroups()
    },
    handleRowClick(group) {
      this.$router.push({ name: 'CommonCodeGroupDetail', params: { groupId: group.id } })
    },
    async deleteSelected() {
      if (this.selectedIds.length === 0) {
        alert('삭제할 그룹을 선택하세요.')
        return
      }

      if (!confirm(`${this.selectedIds.length}개 그룹을 삭제하시겠습니까?`)) {
        return
      }

      try {
        for (const id of this.selectedIds) {
          await http.delete(`/common-code-groups/${id}`)
        }
        showToast('삭제 완료', { type: 'success' })
        this.selectedIds = []
        this.loadGroups()
      } catch (error) {
        showToast('삭제 실패', { type: 'error' })
      }
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>

<style scoped>
.code-group-list-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.toolbar h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.table {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-radius: 0.5rem;
  overflow: hidden;
}

.table-card {
  padding: 1.5rem;
  margin: 0 -1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.1);
}

.table thead {
  background: linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 2px solid #dee2e6;
}

.table thead th {
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
  padding: 0.875rem 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
}

.table tbody td {
  padding: 0.875rem 0.75rem;
  vertical-align: middle;
  border-color: #f1f3f5;
  font-size: 0.9rem;
}

.row-clickable {
  cursor: pointer;
  transition: all 0.15s ease;
}

.row-clickable:hover {
  background-color: #f8f9fa !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.color-badge {
  display: inline-block;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.color-badge:hover {
  transform: scale(1.15);
}

.icon-display {
  font-size: 1.4rem;
  color: #6c757d;
}

code {
  background: #f1f3f5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #e83e8c;
  font-weight: 500;
}
</style>
