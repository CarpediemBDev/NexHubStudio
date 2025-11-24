<template>
  <div class="github-page detail-page">
    <!-- 상단 헤더 -->
    <div class="detail-header">
      <button class="github-btn" @click="goBack"><i class="bi bi-arrow-left"></i> 목록</button>
      <div class="group-info">
        <div class="group-info-content">
          <i :class="groupInfo.icon || 'bi bi-folder'" class="group-icon"></i>
          <div>
            <h2 class="group-title">{{ groupInfo.groupName }}</h2>
            <code class="github-code">{{ groupInfo.groupCode }}</code>
          </div>
        </div>
      </div>
      <button class="github-btn github-btn-success" @click="saveAll">
        <i class="bi bi-save"></i> 전체 저장
      </button>
    </div>

    <div class="content-area">
      <!-- 좌측: 코드 Tree -->
      <div class="tree-panel content-card">
        <div class="panel-header">
          <span class="panel-title">코드 트리</span>
          <span class="badge">{{ codes.length }}</span>
        </div>
        <div class="tree-list">
          <div
            v-for="code in sortedCodes"
            :key="code.id || code.codeId"
            class="tree-item"
            :class="{ active: selectedCode?.codeId === code.codeId }"
            @click="selectCode(code)"
            draggable="true"
            @dragstart="handleDragStart(code, $event)"
            @dragover.prevent="handleDragOver(code, $event)"
            @drop="handleDrop(code, $event)"
          >
            <div class="tree-item-content">
              <i class="bi bi-grip-vertical drag-handle"></i>
              <i class="bi bi-tag"></i>
              <span class="code-text">{{ code.codeId }}</span>
              <span class="value-text">{{ code.codeName }}</span>
              <span v-if="code.useYn === 'N'" class="badge bg-secondary ms-auto">미사용</span>
            </div>
          </div>
          <div v-if="codes.length === 0" class="text-center text-muted py-5">
            <i class="bi bi-inbox" style="font-size: 2rem"></i>
            <div class="mt-2">등록된 코드가 없습니다</div>
          </div>
        </div>
      </div>

      <!-- 우측: 코드 Grid -->
      <div class="grid-panel content-card">
        <div class="panel-header">
          <span class="panel-title">코드 목록</span>
          <div class="panel-actions">
            <button class="github-btn github-btn-primary" @click="addCode">
              <i class="bi bi-plus"></i> 코드 추가
            </button>
            <button class="github-btn github-btn-danger" @click="deleteSelected">
              <i class="bi bi-trash"></i> 삭제
            </button>
          </div>
        </div>

        <JqxCustomeGrid
          ref="grd"
          :localdata="codes"
          :datafields="datafields"
          :columns="columns"
          selectionmode="checkbox"
          :height="550"
          theme="bootstrap"
          @cellvaluechanged="handleCellChange"
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
  name: 'CommonCodeGroupDetailPage',
  components: { JqxCustomeGrid },
  data() {
    return {
      groupId: null,
      groupInfo: {},
      codes: [],
      selectedCode: null,
      draggedCode: null,
      datafields: [
        { name: 'id', type: 'number' },
        { name: 'codeGroupId', type: 'number' },
        { name: 'codeId', type: 'string' },
        { name: 'codeName', type: 'string' },
        { name: 'sortOrder', type: 'number' },
        { name: 'useYn', type: 'string' },
        { name: 'description', type: 'string' },
      ],
      columns: [
        { text: 'ID', datafield: 'id', width: 60, editable: false },
        { text: '코드', datafield: 'codeId', width: 120, editable: true },
        { text: '코드명', datafield: 'codeName', width: 180, editable: true },
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
        { text: '설명', datafield: 'description', width: 300, editable: true },
      ],
    }
  },
  computed: {
    sortedCodes() {
      return [...this.codes].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    },
  },
  mounted() {
    this.groupId = this.$route.params.groupId
    this.loadData()
  },
  methods: {
    async loadData() {
      await this.loadGroupInfo()
      await this.loadCodes()
    },
    async loadGroupInfo() {
      try {
        const { data } = await http.get(`/common-code-groups/${this.groupId}`)
        this.groupInfo = data
      } catch (error) {
        showToast('그룹 정보 조회 실패', { type: 'error' })
      }
    },
    async loadCodes() {
      try {
        const { data } = await http.get('/common-codes')
        this.codes = data.filter((c) => c.codeGroupId === Number(this.groupId))
      } catch (error) {
        showToast('코드 목록 조회 실패', { type: 'error' })
      }
    },
    selectCode(code) {
      this.selectedCode = code
    },
    addCode() {
      const maxOrder = Math.max(0, ...this.codes.map((c) => c.sortOrder || 0))
      this.$refs.grd?.add({
        codeGroupId: this.groupInfo.id,
        codeId: '',
        codeName: '',
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
        await this.loadCodes()
      } catch (error) {
        showToast('저장 실패', { type: 'error' })
      }
    },
    goBack() {
      this.$router.back()
    },
    handleCellChange() {
      // 셀 변경 시 트리 동기화
      this.codes = [...this.codes]
    },
    // Drag & Drop 정렬
    handleDragStart(code, event) {
      this.draggedCode = code
      event.dataTransfer.effectAllowed = 'move'
    },
    handleDragOver(code, event) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    },
    handleDrop(targetCode, event) {
      event.preventDefault()
      if (!this.draggedCode || this.draggedCode === targetCode) return

      const draggedIndex = this.codes.indexOf(this.draggedCode)
      const targetIndex = this.codes.indexOf(targetCode)

      // 순서 재배열
      this.codes.splice(draggedIndex, 1)
      this.codes.splice(targetIndex, 0, this.draggedCode)

      // sortOrder 재계산
      this.codes.forEach((code, idx) => {
        code.sortOrder = (idx + 1) * 10
      })

      this.draggedCode = null
      showToast('순서가 변경되었습니다. 저장 버튼을 눌러주세요.', { type: 'info' })
    },
  },
}
</script>

<style scoped>
@import '@/assets/styles/github-theme.css';

.detail-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #d0d7de;
}

.group-info {
  flex: 1;
  padding: 0 1rem;
}

.group-info-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-icon {
  font-size: 1.5rem;
  color: #57606a;
}

.group-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #24292f;
  margin: 0;
}

.content-area {
  display: flex;
  gap: 1rem;
  flex: 1;
  overflow: hidden;
}

.tree-panel {
  width: 350px;
  display: flex;
  flex-direction: column;
}

.grid-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #d0d7de;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f6f8fa;
}

.panel-title {
  font-weight: 600;
  color: #24292f;
  font-size: 0.875rem;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
}

.badge {
  background: #eaeef2;
  color: #57606a;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tree-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.tree-item {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.tree-item:hover {
  background: #f6f8fa;
  border-color: #d0d7de;
}

.tree-item.active {
  background: #0969da;
  color: white;
  border-color: #0969da;
}

.tree-item.active .badge {
  background: white !important;
  color: #0969da !important;
}

.tree-item-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.drag-handle {
  cursor: grab;
  opacity: 0.4;
  color: #57606a;
}

.drag-handle:active {
  cursor: grabbing;
}

.code-text {
  font-weight: 600;
  min-width: 80px;
  color: #24292f;
}

.value-text {
  flex: 1;
  color: #57606a;
}
</style>
