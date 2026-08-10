<template>
  <div class="b2b-page-container">
    <!-- Header Page Title -->
    <div class="mb-3">
      <h4 class="fw-bold text-dark m-0">RealGrid 샘플 (공통 컴포넌트형)</h4>
      <p class="text-muted small mb-0">공통 컴포넌트인 RealGridCommonJs를 활용하여 간결하게 작성된 고성능 그리드 샘플입니다.</p>
    </div>

    <!-- Unified Management Toolbar (B2B Compact Enterprise Style) -->
    <div class="b2b-toolbar">
      <div class="d-flex align-items-center justify-content-between w-100">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">바닐라 JS 래퍼</span>
          <!-- Quick Search Bar -->
          <QuickSearchBar
            :searchResult="searchResult"
            @search="onGridSearch"
            @clear="searchResult = { count: 0, current: 0 }"
          />
        </div>
        <div class="d-flex align-items-center gap-2 ms-auto">
          <button class="btn-b2b-action" title="엑셀 파일 내보내기" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
            <span>엑셀</span>
          </button>
          <button class="btn-b2b-action" title="새 행 추가" @click="addRow">
            <i class="bi bi-plus-lg text-success me-0.5"></i>
            <span>추가</span>
          </button>
          <button class="btn-b2b-action" title="선택 행 삭제" @click="deleteChecked">
            <i class="bi bi-dash-lg text-danger me-0.5"></i>
            <span>삭제</span>
          </button>
          <button class="btn-b2b-primary" title="변경사항 저장" @click="saveData">
            <i class="bi bi-check2 me-0.5"></i>
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid Container Card using Common JS Component -->
    <div class="b2b-grid-card mb-4">
      <div class="b2b-grid-wrapper">
        <RealGridCommonJs
          ref="realgridComp"
          grid-id="realgrid-main-page"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="users"
          :sortable="true"
          :filterable="true"
          :checkable="true"
          :show-row-number="true"
          :state-bar-visible="true"
          :state-bar-width="20"
          :check-bar-width="36"
          :pinnable="true"
          :group-panel-visible="true"
          :merge-mode="true"
          :column-hideable="false"
          :exclusive-selectable="false"
          :commit-when-leave="true"
          :use-footer="true"
          :soft-deletable="true"
          :summary-mode="'aggregate'"
          :fit-style="'evenFill'"
          :fixed-col-count="1"
          :fixed-row-count="0"
          :toast="gridToast"
          @init="onGridInit"
        />
      </div>
    </div>

    <!-- Column Picker Modal -->
    <ColumnPickerModal
      :isOpen="isColumnPickerOpen"
      :columns="columnPickerCols"
      @close="isColumnPickerOpen = false"
      @toggle-column="onToggleColumn"
    />
  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import ColumnPickerModal from '@/components/ColumnPickerModal.vue'
import QuickSearchBar from '@/components/QuickSearchBar.vue'
import SavedViewsBar from '@/components/SavedViewsBar.vue'
import { showToast } from '@/utils/toastUtil.js'
import { searchGrid } from '@/utils/realgridOps'

export default {
  name: 'RealGridPage',
  components: {
    RealGridCommonJs,
    ColumnPickerModal,
    QuickSearchBar,
    SavedViewsBar
  },
  data() {
    return {
      searchResult: { count: 0, current: 0 },
      isColumnPickerOpen: false,
      columnPickerCols: [],
      users: [],
      gridFields: [
        { fieldName: 'userId', dataType: 'text' },
        { fieldName: 'name', dataType: 'text' },
        { fieldName: 'dept', dataType: 'text' },
        { fieldName: 'role', dataType: 'text' },
        { fieldName: 'workStatus', dataType: 'text' },
        { fieldName: 'employmentType', dataType: 'text' },
        { fieldName: 'evalGrade', dataType: 'text' },
        { fieldName: 'skillScore', dataType: 'number' },
        { fieldName: 'region', dataType: 'text' },
        { fieldName: 'salary', dataType: 'number' },
        { fieldName: 'joinDate', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd' }
      ],
      gridColumns: [
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
          width: '110',
          header: { text: '성명' },
          styles: { textAlignment: 'center' }
        },
        {
          name: 'dept',
          fieldName: 'dept',
          width: '130',
          header: { text: '부서' },
          styles: { textAlignment: 'near' }
        },
        {
          name: 'role',
          fieldName: 'role',
          width: '110',
          header: { text: '직무/역할' },
          styles: { textAlignment: 'near' }
        },
        {
          name: 'workStatus',
          fieldName: 'workStatus',
          width: '100',
          header: { text: '근무상태 (선택)' },
          styles: { textAlignment: 'center' },
          editor: {
            type: 'dropdown',
            dropDownCount: 3,
            domainOnly: true,
            labels: ['재직', '휴직', '퇴사'],
            values: ['재직', '휴직', '퇴사']
          }
        },
        {
          name: 'employmentType',
          fieldName: 'employmentType',
          width: '110',
          header: { text: '고용형태 (선택)' },
          styles: { textAlignment: 'center' },
          editor: {
            type: 'dropdown',
            dropDownCount: 3,
            domainOnly: true,
            labels: ['정규직', '계약직', '파트타임'],
            values: ['정규직', '계약직', '파트타임']
          }
        },
        {
          name: 'evalGrade',
          fieldName: 'evalGrade',
          width: '80',
          header: { text: '평가등급 (선택)' },
          styles: { textAlignment: 'center', fontWeight: 'bold' },
          editor: {
            type: 'dropdown',
            dropDownCount: 5,
            domainOnly: true,
            labels: ['S', 'A', 'B', 'C', 'D'],
            values: ['S', 'A', 'B', 'C', 'D']
          },
          renderer: {
            type: 'html',
            callback: function (grid, model) {
              const v = model && model.value ? String(model.value) : 'B'
              const map = { S: ['#dc3545', '#fff'], A: ['#0d6efd', '#fff'], B: ['#198754', '#fff'], C: ['#ffc107', '#212529'], D: ['#6c757d', '#fff'] }
              const c = map[v] || ['#6c757d', '#fff']
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:${c[0]};color:${c[1]};font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;line-height:1.5;">${v}</span></div>`
            }
          }
        },
        {
          name: 'skillScore',
          fieldName: 'skillScore',
          width: '130',
          header: { text: '역량 점수 (바)' },
          styles: { textAlignment: 'far' },
          renderer: {
            type: 'bar',
            minimum: 0,
            maximum: 100,
            showLabel: true
          },
          footer: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'region',
          fieldName: 'region',
          width: '90',
          header: { text: '근무지역' },
          styles: { textAlignment: 'center' }
        },
        {
          name: 'salary',
          fieldName: 'salary',
          width: '110',
          header: { text: '급여 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'joinDate',
          fieldName: 'joinDate',
          width: '115',
          header: { text: '입사일자 (달력)' },
          datetimeFormat: 'yyyy-MM-dd',
          styles: { textAlignment: 'center' },
          editor: {
            type: 'date',
            datetimeFormat: 'yyyy-MM-dd',
            commitBySelect: true
          }
        }
      ]
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    // 자기완결 그리드 컴포넌트의 알림을 이 프로젝트 토스트로 연결
    gridToast(message, opts = {}) {
      showToast(message, opts)
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      gridView.setFixedOptions({
        colCount: 1,
        resizable: true
      })

      // 우클릭 행/열 고정 메뉴는 RealGridCommonJs 컴포넌트가 내부에서 처리(refs 불필요)
    },

    async loadUsers() {
      const defaultUsers = [
        { userId: 'minjun.park', name: '박민준', dept: '경영지원', role: 'Security', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 88, region: '서울', salary: 5240, joinDate: '2019-04-12' },
        { userId: 'suhyun.lee', name: '이수현', dept: '경영지원', role: 'PM', workStatus: '재직', employmentType: '정규직', evalGrade: 'S', skillScore: 95, region: '대전', salary: 9520, joinDate: '2024-01-15' },
        { userId: 'minjun.han', name: '한민준', dept: '디자인팀', role: 'DevOps', workStatus: '휴직', employmentType: '계약직', evalGrade: 'B', skillScore: 72, region: '광주', salary: 8900, joinDate: '2021-08-20' },
        { userId: 'jihoon.kim', name: '김지훈', dept: '개발팀', role: 'PM', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 84, region: '서울', salary: 7200, joinDate: '2020-03-09' }
      ]
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('Fetch failed')
        const data = await res.json()
        const rows = Array.isArray(data) ? data : data.users || []
        this.users = rows.length > 0 ? rows : defaultUsers
      } catch (error) {
        console.warn('Using default mock users:', error)
        this.users = defaultUsers
      }
    },

    addRow() {
      if (!this.dataProvider) return
      const tempId = 'user_' + Math.random().toString(36).substring(2, 8)
      this.dataProvider.insertRow(0, {
        userId: tempId,
        name: '신규 사용자',
        dept: '개발팀',
        role: 'PM',
        workStatus: '재직',
        employmentType: '정규직',
        evalGrade: 'B',
        skillScore: 75,
        region: '서울',
        salary: 4500,
        joinDate: new Date().toISOString().slice(0, 10)
      })
      if (this.gridView) this.gridView.setCurrent({ itemIndex: 0 })
      showToast('상단에 새 행이 추가되었습니다 (State: Created).', { type: 'info' })
    },

    deleteChecked() {
      if (!this.gridView || !this.dataProvider) return

      const checkedRows = this.gridView.getCheckedRows() || []
      if (checkedRows.length === 0) {
        showToast('선택된 사용자가 없습니다.', { type: 'warning' })
        return
      }
      this.dataProvider.removeRows(checkedRows, false) // RealGrid2 소프트 삭제 (상태바 - 표시)
      this.gridView.checkAll(false)
      showToast(`${checkedRows.length}건이 삭제 상태(-)로 설정되었습니다. [저장] 시 반영됩니다.`, { type: 'warning' })
    },

    async saveData() {
      if (!this.dataProvider) return

      const createdIdx = this.dataProvider.getStateRows('created') || []
      const updatedIdx = this.dataProvider.getStateRows('updated') || []
      const deletedIdx = this.dataProvider.getStateRows('deleted') || []

      const created = createdIdx.map(idx => this.dataProvider.getJsonRow(idx))
      const updated = updatedIdx.map(idx => this.dataProvider.getJsonRow(idx))
      const deleted = deletedIdx.map(idx => this.dataProvider.getJsonRow(idx))

      const changes = { created, updated, deleted }
      const totalChanges = created.length + updated.length + deleted.length

      if (totalChanges === 0) {
        showToast('변경사항이 없습니다.', { type: 'warning' })
        return
      }

      console.log('서버 전송 C, U, D 데이터:', changes)
      showToast('저장 성공!', { type: 'success' })
      alert(
        `[서버 전송 C, U, D 데이터 저장 완료]\n\n` +
        `• 추가 (Created - C): ${created.length}건\n` +
        `• 수정 (Updated - U): ${updated.length}건\n` +
        `• 삭제 (Deleted - D): ${deleted.length}건`
      )
      this.dataProvider.clearRowStates()
    },

    exportExcel() {
      if (!this.gridView) return
      this.gridView.exportGrid({
        type: 'excel',
        target: 'local',
        fileName: 'RealGrid_User_List.xlsx',
        showProgress: true
      })
    },

    openColumnPicker() {
      if (!this.gridView) return
      const cols = this.gridView.getColumns() || []
      this.columnPickerCols = cols.map(c => ({
        name: c.name,
        header: c.header?.text || c.name,
        visible: c.visible !== false
      }))
      this.isColumnPickerOpen = true
    },

    onToggleColumn({ name, visible }) {
      if (this.gridView) {
        this.gridView.setColumnProperty(name, 'visible', visible)
      }
    },

    onGridSearch({ query, direction }) {
      if (this.gridView) {
        this.searchResult = searchGrid(this.gridView, this.dataProvider, query, direction, showToast)
      }
    }
  }
}
</script>

<style scoped>
</style>
