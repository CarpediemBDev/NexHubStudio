<template>
  <div class="common-code-manager">
    <div class="toolbar mb-3">
      <h3 class="mb-0">공통코드 관리</h3>
      <div class="d-flex gap-2">
        <input
          type="text"
          class="form-control form-control-sm"
          placeholder="검색..."
          v-model="searchKeyword"
          @input="handleSearch"
          style="width: 200px"
        />
        <button class="btn btn-success btn-sm" @click="saveAll">
          <i class="bi bi-save"></i> 전체 저장
        </button>
      </div>
    </div>

    <div class="content-area">
      <!-- 좌측: 코드 그룹 트리 -->
      <div class="group-panel">
        <div class="panel-header">
          <span class="fw-bold">코드 그룹</span>
          <button class="btn btn-sm btn-primary" @click="addGroup">
            <i class="bi bi-plus"></i>
          </button>
        </div>
        <div class="group-list">
          <div
            v-for="group in filteredGroups"
            :key="group.id"
            class="group-item"
            :class="{ active: selectedGroupId === group.id }"
            @click="selectGroup(group.id)"
          >
            <div class="group-name">
              <i :class="group.icon || 'bi bi-folder'"></i>
              <span>{{ group.groupName }}</span>
              <span class="badge bg-secondary ms-auto">{{ getGroupCount(group.id) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 우측: 코드 목록 그리드 -->
      <div class="code-panel">
        <div class="panel-header">
          <div class="d-flex align-items-center gap-2">
            <span class="fw-bold">{{ getGroupInfo(selectedGroupId)?.groupName || '전체' }}</span>
            <span class="text-muted small">{{ rows.length }}건</span>
          </div>
          <div class="d-flex gap-2">
            <div class="form-check form-check-inline mb-0">
              <input
                class="form-check-input"
                type="checkbox"
                id="showOnlyActive"
                v-model="showOnlyActive"
                @change="applyFilters"
              />
              <label class="form-check-label small" for="showOnlyActive"> 사용중만 </label>
            </div>
            <button class="btn btn-sm btn-primary" @click="addCode" :disabled="!selectedGroupId">
              <i class="bi bi-plus"></i> 코드 추가
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="deleteSelected">
              <i class="bi bi-trash"></i> 삭제
            </button>
          </div>
        </div>

        <JqxCustomeGrid
          ref="grd"
          :localdata="rows"
          :datafields="datafields"
          :columns="columns"
          selectionmode="checkbox"
          :height="550"
          theme="bootstrap"
        />
      </div>
    </div>
  </div>
</template>

<script>
import JqxCustomeGrid from '@/components/JqxCustomeGrid.vue'
import http from '@/utils/http'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'CommonCodePage',
  components: { JqxCustomeGrid },
  data() {
    return {
      allCodes: [],
      allGroups: [], // 그룹 목록
      rows: [],
      selectedGroupId: null, // 선택된 그룹 ID
      searchKeyword: '',
      showOnlyActive: false,
      datafields: [
        { name: 'id', type: 'number' },
        { name: 'codeGroupId', type: 'number' },
        { name: 'code', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'sortOrder', type: 'number' },
        { name: 'useYn', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'createdBy', type: 'string' },
        { name: 'createdAt', type: 'date' },
        { name: 'updatedBy', type: 'string' },
        { name: 'updatedAt', type: 'date' },
      ],
      columns: [
        { text: 'ID', datafield: 'id', width: 60, editable: false },
        { text: '코드', datafield: 'code', width: 120, editable: true },
        { text: '코드명', datafield: 'value', width: 180, editable: true },
        { text: '순서', datafield: 'sortOrder', width: 70, editable: true, cellsalign: 'center' },
        {
          text: '사용',
          datafield: 'useYn',
          width: 70,
          editable: true,
          columntype: 'dropdownlist',
          cellsalign: 'center',
          createeditor: (row, value, editor) => {
            editor.jqxDropDownList({
              source: [
                { code: 'Y', value: 'Y' },
                { code: 'N', value: 'N' },
              ],
              displayMember: 'value',
              valueMember: 'code',
              autoDropDownHeight: true,
            })
          },
          cellsrenderer: (row, columnfield, value) => {
            const color = value === 'Y' ? '#28a745' : '#6c757d'
            const text = value === 'Y' ? 'Y' : 'N'
            return `<div style="text-align: center; color: ${color}; font-weight: bold;">${text}</div>`
          },
        },
        { text: '설명', datafield: 'description', width: 250, editable: true },
        {
          text: '등록일',
          datafield: 'createdAt',
          width: 140,
          editable: false,
          cellsformat: 'yyyy-MM-dd HH:mm',
        },
      ],
    }
  },
  computed: {
    filteredGroups() {
      if (!this.searchKeyword) return this.allGroups
      return this.allGroups.filter(
        (g) =>
          g.groupName?.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
          g.groupCode?.toLowerCase().includes(this.searchKeyword.toLowerCase())
      )
    },
  },
  mounted() {
    this.loadGroups()
    this.loadCommonCodes()
  },
  methods: {
    async loadGroups() {
      try {
        const { data } = await http.get('/common-code-groups')
        this.allGroups = data ?? []
        if (this.allGroups.length > 0 && !this.selectedGroupId) {
          this.selectGroup(this.allGroups[0].id)
        }
      } catch (error) {
        showToast('그룹 목록 조회 실패', { type: 'error' })
      }
    },
    loadCommonCodes() {
      http
        .get('/common-codes')
        .then((res) => {
          this.allCodes = res.data ?? []
          if (this.selectedGroupId) {
            this.applyFilters()
          }
        })
        .catch((error) => {
          const msg = error?.response?.data?.message || error.message || '공통코드 목록 조회 실패'
          showToast(msg, { type: 'error' })
        })
    },
    selectGroup(groupId) {
      this.selectedGroupId = groupId
      this.applyFilters()
    },
    applyFilters() {
      let filtered = this.allCodes.filter((code) => code.codeGroupId === this.selectedGroupId)

      if (this.showOnlyActive) {
        filtered = filtered.filter((code) => code.useYn === 'Y')
      }

      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        filtered = filtered.filter(
          (code) =>
            code.code?.toLowerCase().includes(keyword) ||
            code.value?.toLowerCase().includes(keyword) ||
            code.description?.toLowerCase().includes(keyword)
        )
      }

      this.rows = filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    },
    handleSearch() {
      if (this.selectedGroupId) {
        this.applyFilters()
      }
    },
    getGroupCount(groupId) {
      return this.allCodes.filter((c) => c.codeGroupId === groupId).length
    },
    getGroupInfo(groupId) {
      return this.allGroups.find((g) => g.id === groupId)
    },
    addGroup() {
      this.$router.push('/common-code-groups')
    },
    addCode() {
      if (!this.selectedGroupId) {
        alert('코드 그룹을 선택하세요.')
        return
      }

      const maxOrder = Math.max(0, ...this.rows.map((r) => r.sortOrder || 0))
      this.$refs.grd?.add({
        codeGroupId: this.selectedGroupId,
        code: '',
        value: '',
        sortOrder: maxOrder + 10,
        useYn: 'Y',
        description: '',
      })
    },
    deleteSelected() {
      this.$refs.grd?.deleteSelected()
    },
    async saveAll() {
      const grid = this.$refs.grd
      if (!grid?.hasChanges()) {
        alert('변경된 내용이 없습니다.')
        return
      }

      const payload = grid.getSavePayload()
      try {
        const { data: result } = await http.post('/common-codes/bulk', payload)
        showToast(
          `저장 완료! (생성: ${result.created}, 수정: ${result.updated}, 삭제: ${result.deleted})`,
          { type: 'success' }
        )
        await this.loadCommonCodes()
      } catch (error) {
        showToast('저장 실패', { type: 'error' })
      }
    },
  },
}
</script>

<style scoped>
.common-code-manager {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #dee2e6;
}

.content-area {
  display: flex;
  gap: 1rem;
  flex: 1;
  overflow: hidden;
  margin-top: 1rem;
}

.group-panel {
  width: 250px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background: white;
}

.code-panel {
  flex: 1;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background: white;
}

.panel-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.group-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.group-item {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.group-item:hover {
  background: #e9ecef;
}

.group-item.active {
  background: #0d6efd;
  color: white;
}

.group-item.active .badge {
  background: white !important;
  color: #0d6efd !important;
}

.group-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.group-name i {
  font-size: 1rem;
}
</style>
