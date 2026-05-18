<template>
  <div class="container py-3">
    <!-- Header Page Title -->
    <div class="mb-3">
      <h4 class="fw-bold text-dark m-0">RealGrid 샘플</h4>
      <p class="text-muted small mb-0">Vue 3 환경에서 RealGrid 2를 사용한 고성능 데이터 그리드 제어 샘플입니다.</p>
    </div>

    <!-- Toolbar Buttons (Aligned to the Right, Sleek Minimalist Flat Style) -->
    <div class="mb-3 d-flex justify-content-end gap-2">
      <button class="btn btn-action-sleek btn-sm px-3 d-flex align-items-center gap-1" @click="addRow">
        <i class="bi bi-plus-lg text-secondary"></i>
        <span class="fw-medium">행추가</span>
      </button>
      <button class="btn btn-action-sleek btn-action-delete btn-sm px-3 d-flex align-items-center gap-1" @click="deleteChecked">
        <i class="bi bi-dash-lg text-secondary"></i>
        <span class="fw-medium">행삭제</span>
      </button>
      <button class="btn btn-action-save btn-sm px-3 d-flex align-items-center gap-1" @click="saveData">
        <i class="bi bi-check2"></i>
        <span class="fw-semibold">저장</span>
      </button>
    </div>

    <!-- Grid Container Card (Always rendered, immediately mounted) -->
    <div class="card shadow-sm border-light mb-4">
      <div class="card-body p-0">
        <div ref="realgrid" class="w-100" style="height: 560px;"></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
// Apply the official Sky Blue theme from RealGrid package as guided in documentation
import 'realgrid/dist/realgrid-white.css'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'RealGridPage',
  mounted() {
    // Initialize and load grid immediately (Global License is registered in main.js)
    this.initGrid()
    this.loadUsers()
  },
  beforeUnmount() {
    this.cleanupGrid()
  },
  methods: {
    initGrid() {
      const container = this.$refs.realgrid
      if (!container) return
      
      // Initialize DataProvider & GridView
      const dataProvider = new RealGrid.LocalDataProvider(false)
      const gridView = new RealGrid.GridView(container)
      gridView.setDataSource(dataProvider)

      // Store in non-reactive properties to optimize performance and memory footprint
      this.dataProvider = dataProvider
      this.gridView = gridView

      // Configure Options
      dataProvider.softDeleting = true // enable soft-delete
      gridView.hideDeletedRows = true // hide soft-deleted rows from view

      // Configure editing behavior
      gridView.setEditOptions({
        editable: true,
        insertable: true,
        appendable: true,
        commitWhenLeave: true // auto-commit on cell focus out
      })

      // Show checkbar & statebar
      gridView.setStateBar({ visible: true })
      gridView.setCheckBar({ visible: true })

      // Define Fields (DataProvider)
      const fields = [
        { fieldName: 'userId', dataType: 'text' },
        { fieldName: 'name', dataType: 'text' },
        { fieldName: 'dept', dataType: 'text' },
        { fieldName: 'role', dataType: 'text' }
      ]
      dataProvider.setFields(fields)

      // Define Columns (GridView)
      const columns = [
        {
          name: 'userId',
          fieldName: 'userId',
          width: '120',
          header: { text: 'ID' },
          editable: false,
          styles: { textAlignment: 'center' }
        },
        {
          name: 'name',
          fieldName: 'name',
          width: '160',
          header: { text: '이름' },
          styles: { textAlignment: 'near' }
        },
        {
          name: 'dept',
          fieldName: 'dept',
          width: '160',
          header: { text: '부서' },
          styles: { textAlignment: 'near' }
        },
        {
          name: 'role',
          fieldName: 'role',
          width: '200',
          header: { text: '역할' },
          styles: { textAlignment: 'near' }
        }
      ]
      gridView.setColumns(columns)
      
      // Configure display settings according to the official theme dimensions
      gridView.setDisplayOptions({
        fitStyle: 'evenFill',
        rowHeight: 40,
        headerHeight: 40
      })
    },

    cleanupGrid() {
      if (this.gridView) {
        try {
          this.gridView.destroy()
        } catch (e) {
          console.error('Error destroying gridView:', e)
        }
        this.gridView = null
      }
      if (this.dataProvider) {
        try {
          this.dataProvider.destroy()
        } catch (e) {
          console.error('Error destroying dataProvider:', e)
        }
        this.dataProvider = null
      }
    },

    async loadUsers() {
      try {
        // Fetch mock database records from the public/db.json file
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        const data = await res.json()
        const rows = Array.isArray(data) ? data : data.users || []
        
        if (this.dataProvider) {
          this.dataProvider.setRows(rows)
          showToast('데이터가 성공적으로 로드되었습니다.', { type: 'success' })
        }
      } catch (error) {
        console.error('Error loading users:', error)
        showToast('데이터를 로드하는 데 실패했습니다.', { type: 'danger' })
      }
    },

    addRow() {
      if (!this.dataProvider) return
      
      // Auto-generate unique temp userId
      const tempId = 'user_' + Math.random().toString(36).substring(2, 8)
      
      // Insert row to DataProvider
      this.dataProvider.addRow({
        userId: tempId,
        name: '새 사용자',
        dept: '개발지원팀',
        role: '연구원'
      })
      
      // Auto-focus on new row
      const rowCount = this.dataProvider.getRowCount()
      this.gridView.setCurrent({ itemIndex: rowCount - 1 })
      showToast('새 행이 추가되었습니다.', { type: 'info' })
    },

    deleteChecked() {
      if (!this.gridView || !this.dataProvider) return
      
      const checkedRows = this.gridView.getCheckedRows()
      if (!checkedRows || checkedRows.length === 0) {
        showToast('선택된 사용자가 없습니다.', { type: 'warning' })
        return
      }
      
      // Logical soft-delete
      this.dataProvider.removeRows(checkedRows)
      this.gridView.clearCheckedItems()
      showToast(`${checkedRows.length}건이 삭제 표시되었습니다.`, { type: 'warning' })
    },

    getChanges() {
      if (!this.dataProvider) return { created: [], updated: [], deleted: [] }

      const createdIdx = this.dataProvider.getStateRows('created') || []
      const updatedIdx = this.dataProvider.getStateRows('updated') || []
      const deletedIdx = this.dataProvider.getStateRows('deleted') || []

      const created = createdIdx.map(idx => this.dataProvider.getJsonRow(idx))
      const updated = updatedIdx.map(idx => this.dataProvider.getJsonRow(idx))
      const deleted = deletedIdx.map(idx => this.dataProvider.getJsonRow(idx))

      return { created, updated, deleted }
    },

    async saveData() {
      if (!this.dataProvider) return

      const changes = this.getChanges()
      const totalChanges = changes.created.length + changes.updated.length + changes.deleted.length

      if (totalChanges === 0) {
        showToast('변경사항이 없습니다.', { type: 'warning' })
        return
      }

      console.log('서버로 저장할 RealGrid 데이터:', changes)

      showToast('저장 성공!', { type: 'success' })
      alert(
        `저장 완료!\n` +
        `- 추가: ${changes.created.length}건\n` +
        `- 수정: ${changes.updated.length}건\n` +
        `- 삭제: ${changes.deleted.length}건`
      )

      await this.loadUsers()
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
}

/* ==========================================================================
   Enterprise Sleek Toolbar Button Custom Styling 
   ========================================================================== */
.btn-action-sleek {
  background-color: #ffffff;
  border: 1px solid #d1d5db; /* gray-300 */
  color: #4b5563; /* gray-600 */
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-action-sleek:hover {
  background-color: #f9fafb; /* gray-50 */
  border-color: #9ca3af; /* gray-400 */
  color: #1f2937; /* gray-800 */
}

/* Subtle soft danger effect on hover for row deletion */
.btn-action-delete:hover {
  background-color: #fef2f2; /* red-50 */
  border-color: #fca5a5; /* red-300 */
  color: #dc2626; /* red-600 */
}
.btn-action-delete:hover i {
  color: #dc2626 !important;
}

/* Elegant Slate/Navy Save Button for high-end feel */
.btn-action-save {
  background-color: #3b82f6; /* premium blue */
  border: 1px solid #3b82f6;
  color: #ffffff;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(59, 130, 246, 0.05);
}

.btn-action-save:hover {
  background-color: #2563eb; /* darker blue */
  border-color: #2563eb;
  color: #ffffff;
}
</style>
