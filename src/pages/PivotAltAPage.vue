<template>
  <div class="b2b-page-container">
    <!-- Unified Management Toolbar (Organized into 3 Clear Functional Groups) -->
    <div class="b2b-toolbar">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 w-100">
        <!-- GROUP 1: View & Layout Controls (Left) -->
        <div class="d-flex align-items-center gap-1.5 flex-wrap">
          <!-- Reset to Flat Raw Data -->
          <button
            class="btn-b2b-action"
            :class="{ 'btn-b2b-primary': activeGroup === 'none' }"
            @click="clearGroupBy"
          >
            <i class="bi bi-table me-0.5"></i>
            <span>원본 보기</span>
          </button>

          <!-- Integrated Preset Dropdown -->
          <div class="dropdown">
            <button
              class="btn-b2b-action dropdown-toggle"
              :class="{ 'btn-b2b-primary': activeGroup !== 'none' && activeGroup.startsWith('preset_') }"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-lightning-charge-fill text-warning me-0.5"></i>
              <span>{{ activePresetName }}</span>
            </button>
            <ul class="dropdown-menu shadow-sm fs-7">
              <li><h6 class="b2b-text-xs dropdown-header py-1">⚡ 빠른 프리셋 선택</h6></li>
              <li v-for="preset in quickPresets" :key="preset.id">
                <button
                  class="dropdown-item d-flex align-items-center justify-content-between py-1.5"
                  :class="{ active: activeGroup === preset.id }"
                  @click="applyView(preset)"
                >
                  <span><i :class="['bi', preset.icon, 'me-1.5']"></i>{{ preset.name }}</span>
                  <i class="bi bi-check2 ms-2" v-if="activeGroup === preset.id"></i>
                </button>
              </li>
            </ul>
          </div>

          <!-- Save Current View Button -->
          <button class="btn-b2b-action" title="현재 뷰 상태 저장" @click="saveCurrentView">
            <i class="bi bi-bookmark-plus text-warning me-0.5"></i>
            <span>뷰 저장</span>
          </button>

          <!-- User Saved Views Badge Chips -->
          <div v-if="userSavedViews.length > 0" class="d-flex align-items-center gap-1.5 ms-1 ps-2 border-start">
            <span class="fw-semibold text-secondary small me-1" style="font-size: 12px;"><i class="bi bi-star-fill text-warning me-1"></i>내 저장 뷰:</span>
            <div
              v-for="view in userSavedViews"
              :key="view.id"
              class="badge py-1 px-2 border cursor-pointer d-flex align-items-center gap-1 transition-all fw-normal"
              :class="activeGroup === view.id ? 'bg-primary text-white shadow-sm' : 'bg-theme-card text-theme-primary border-theme'"
              @click="applyView(view)"
            >
              <span>{{ view.name }}</span>
              <i
                class="bi bi-x-circle text-danger ms-1 opacity-75"
                title="삭제"
                @click.stop="deleteSavedView(view.id)"
              ></i>
            </div>
          </div>
        </div>

        <!-- GROUP 2 & 3: Data Utilities & Right-Aligned CUD Actions -->
        <div class="d-flex align-items-center gap-2 ms-auto">
          <!-- GROUP 2: Data Utilities (Search, Column, Excel) -->
          <div class="d-flex align-items-center gap-2">
            <QuickSearchBar
              :searchResult="searchResult"
              @search="onGridSearch"
              @clear="searchResult = { count: 0, current: 0 }"
            />

            <button class="btn-b2b-action" title="컬럼 숨김/표시 설정" @click="openColumnPicker">
              <i class="bi bi-eye text-primary me-0.5"></i>
              <span>컬럼</span>
            </button>

            <button class="btn-b2b-action" title="엑셀 파일 내보내기" @click="exportExcel">
              <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
              <span>엑셀</span>
            </button>
          </div>

          <!-- Divider between Utilities and CUD Actions -->
          <div class="border-end h-75 my-auto" style="height: 20px !important;"></div>

          <!-- GROUP 3: CUD Row Operations (Right-Aligned Accent) -->
          <div class="d-flex align-items-center gap-2">
            <button
              class="btn-b2b-action"
              :disabled="isGrouped"
              :title="isGrouped ? '그룹핑(피벗) 상태에서는 원본 보기에서만 데이터 추가가 가능합니다' : '새 행 추가'"
              @click="addRow"
            >
              <i class="bi bi-plus-lg text-success me-0.5"></i>
              <span>추가</span>
            </button>

            <button
              class="btn-b2b-action"
              :disabled="isGrouped"
              :title="isGrouped ? '그룹핑(피벗) 상태에서는 원본 보기에서만 데이터 삭제가 가능합니다' : '선택 행 삭제'"
              @click="deleteChecked"
            >
              <i class="bi bi-dash-lg text-danger me-0.5"></i>
              <span>삭제</span>
            </button>

            <button class="btn-b2b-primary" @click="saveData" title="변경사항 저장">
              <i class="bi bi-check2 me-0.5"></i>
              <span>저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Grid Container Card using Base Component -->
    <div class="b2b-grid-card mb-4">
      <div class="b2b-grid-wrapper">
        <RealGridCommonJs
          ref="realgridComp"
          grid-id="pivot-alt-a-v3"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="mockData"
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
          :fit-style="'none'"
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
import PageHeader from '@/components/PageHeader.vue'
import { showToast } from '@/utils/toastUtil.js'
import { searchGrid, captureViewState, applyViewState } from '@/utils/realgridOps'

export default {
  name: 'PivotAltAPage',
  components: {
    PageHeader,
    RealGridCommonJs,
    ColumnPickerModal,
    QuickSearchBar
  },
  props: {
    initialGroup: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      searchResult: { count: 0, current: 0 },
      isColumnPickerOpen: false,
      columnPickerCols: [],
      activeGroup: 'none',
      activeHasGroup: false,
      quickPresets: [
        { id: 'preset_dept', name: '부서별', fields: ['dept'], icon: 'bi-building' },
        { id: 'preset_dept_role', name: '부서 ➔ 직급별', fields: ['dept', 'role'], icon: 'bi-diagram-3' },
        { id: 'preset_work_status', name: '근무상태 ➔ 부서별', fields: ['workStatus', 'dept'], icon: 'bi-person-badge' },
        { id: 'preset_region_dept', name: '지역 ➔ 부서별', fields: ['region', 'dept'], icon: 'bi-geo-alt' },
        { id: 'preset_eval_grade', name: '평가등급 ➔ 부서별', fields: ['evalGrade', 'dept'], icon: 'bi-award' }
      ],
      userSavedViews: [],
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
        { fieldName: 'joinDate', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd' },
        { fieldName: 'colActions', dataType: 'text' }
      ],
      gridColumns: [
        { name: 'region', fieldName: 'region', width: '70', header: { text: '지역' }, styles: { textAlignment: 'center' } },
        { name: 'dept', fieldName: 'dept', width: '95', header: { text: '부서명' }, styles: { textAlignment: 'near' } },
        { name: 'role', fieldName: 'role', width: '85', header: { text: '직급' }, styles: { textAlignment: 'near' } },
        { name: 'name', fieldName: 'name', width: '80', header: { text: '이름' }, styles: { textAlignment: 'center' } },
        {
          name: 'workStatus',
          fieldName: 'workStatus',
          width: '90',
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
          width: '90',
          header: { text: '고용형태 (선택)' },
          styles: { textAlignment: 'center' },
          editor: {
            type: 'dropdown',
            dropDownCount: 3,
            domainOnly: true,
            labels: ['정규직', '계약직', '파트타임'],
            values: ['정규직', '계약직', '파트타임']
          },
          styleCallback: function (grid, dataCell) {
            const v = dataCell.value
            if (v === '정규직') return 'rg-emp-regular'
            if (v === '계약직') return 'rg-emp-contract'
            if (v === '파트타임') return 'rg-emp-parttime'
            if (v === '인턴') return 'rg-emp-intern'
            if (v === '소속') return 'rg-emp-dept'
            return ''
          }
        },
        {
          name: 'evalGrade',
          fieldName: 'evalGrade',
          width: '65',
          header: { text: '평가' },
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
              if (!model || !model.index || model.index.dataRow < 0) return ''
              const v = model && model.value ? String(model.value) : ''
              if (!v) return ''
              const map = { S: ['#dc3545', '#fff'], A: ['#0d6efd', '#fff'], B: ['#198754', '#fff'], C: ['#ffc107', '#212529'], D: ['#6c757d', '#fff'] }
              const c = map[v] || ['#6c757d', '#fff']
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:${c[0]};color:${c[1]};font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;line-height:1.5;">${v}</span></div>`
            }
          }
        },
        {
          name: 'skillScore',
          fieldName: 'skillScore',
          width: '100',
          header: { text: '역량점수 (바)' },
          styles: { textAlignment: 'far' },
          renderer: {
            type: 'bar',
            minimum: 0,
            maximum: 100,
            showLabel: true
          },
          footer: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } },
          groupFooter: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'salary',
          fieldName: 'salary',
          width: '95',
          header: { text: '기본급 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          styleCallback: function (grid, dataCell) {
            const val = Number(dataCell.value)
            if (val >= 7000) return 'rg-salary-high'
            return ''
          },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } },
          groupFooter: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'joinDate',
          fieldName: 'joinDate',
          width: '105',
          header: { text: '입사일자 (달력)' },
          datetimeFormat: 'yyyy-MM-dd',
          styles: { textAlignment: 'center' },
          editor: {
            type: 'date',
            datetimeFormat: 'yyyy-MM-dd',
            commitBySelect: true
          }
        },
        {
          name: 'colActions',
          fieldName: 'colActions',
          header: { text: '관리' },
          width: 130,
          editable: false,
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: function (grid, cell) {
              const row = cell?.index?.dataRow ?? -1
              if (row < 0) return ''
              return `<div class="d-flex align-items-center justify-content-center gap-1.5 h-100"><button type="button" class="btn-grid-action" data-action="edit" data-row="${row}" title="사용자 수정">수정</button><button type="button" class="btn-grid-action" data-action="delete" data-row="${row}" title="사용자 삭제">삭제</button></div>`
            }
          }
        }
      ],
      mockData: [
        { userId: 'u009', name: '한지민', dept: '영업 1팀', role: '과장', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 86, region: '서울', salary: 5500, joinDate: '2021-03-15' },
        { userId: 'u100', name: '임재현', dept: '영업 2팀', role: '부장', workStatus: '재직', employmentType: '정규직', evalGrade: 'S', skillScore: 94, region: '부산', salary: 8200, joinDate: '2018-06-20' },
        { userId: 'u101', name: '서동현', dept: '영업 2팀', role: '차장', workStatus: '재직', employmentType: '정규직', evalGrade: 'B', skillScore: 78, region: '부산', salary: 6900, joinDate: '2020-11-05' },
        { userId: 'u102', name: '송혜교', dept: '경영지원', role: '부장', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 89, region: '서울', salary: 7800, joinDate: '2019-01-10' },
        { userId: 'u103', name: '현빈', dept: '경영지원', role: '과장', workStatus: '휴직', employmentType: '계약직', evalGrade: 'C', skillScore: 65, region: '서울', salary: 5600, joinDate: '2022-08-14' }
      ]
    }
  },
  computed: {
    isGrouped() {
      return this.activeHasGroup
    },
    activePresetName() {
      const found = this.quickPresets.find(p => p.id === this.activeGroup)
      if (found) return found.name
      const saved = this.userSavedViews.find(v => v.id === this.activeGroup)
      if (saved) return saved.name
      return '빠른 프리셋'
    }
  },
  async mounted() {
    this.loadSavedViews()
    await this.loadData()
  },
  methods: {
    async loadData() {
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('db.json fetch 실패')
        const data = await res.json()
        const rows = Array.isArray(data) ? data : (data.users || [])
        if (rows.length) {
          this.mockData = rows
          if (this.dataProvider) {
            this.dataProvider.setRows(this.mockData)
          }
        }
      } catch (e) {
        console.warn('[PivotAltA] db.json 로드 실패 → 폴백 데이터 사용:', e)
      }
    },

    gridToast(message, opts = {}) {
      showToast(message, opts)
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      // 🔹 RealGrid2 공식 onCellItemClicked 이벤트: HTML 렌더러의 clickData.target 으로부터 data-action 감지
      gridView.onCellItemClicked = (grid, index, clickData) => {
        if (!clickData || clickData.dataRow < 0) return

        const btn = clickData.target?.closest?.('.btn-grid-action')
        const action = btn?.getAttribute?.('data-action')
        if (!action) return

        const rowData = dataProvider.getJsonRow(clickData.dataRow)
        if (!rowData) return

        if (action === 'edit') {
          alert(
            `[피벗/데이터 수정]\n\n` +
            `• ID: ${rowData.userId}\n` +
            `• 이름: ${rowData.name}\n` +
            `• 부서: ${rowData.dept}\n` +
            `• 직급: ${rowData.role}\n` +
            `• 지역: ${rowData.region}`
          )
        } else if (action === 'delete') {
          alert(
            `[피벗/데이터 삭제]\n\n` +
            `'${rowData.name}' (${rowData.userId}) 데이터를 삭제 처리합니다.`
          )
        }
      }

      // 소계 자동 집계 모드
      this.gridView.setRowGroup({ summaryMode: 'aggregate', mergeMode: true })

      // 마우스 우클릭 컨텍스트 메뉴 설정 (동적 행/열 고정 메뉴 포함)
      this.gridView.setContextMenu([
        { label: '📌 이 컬럼 기준으로 행 그룹화', tag: 'groupByCol' },
        { label: '💾 현재 그룹핑 상태 뷰 저장', tag: 'saveView' },
        { label: '❌ 그룹화 해제 (원본 Flat Grid)', tag: 'clearGroup' },
        { label: '-' },
        { label: '📌 선택한 열까지 고정', tag: 'fixColumn' },
        { label: '📌 선택한 행까지 고정', tag: 'fixRow' },
        { label: '📌 선택한 행/열 모두 고정', tag: 'fixBoth' },
        { label: '❌ 고정 해제 (초기화)', tag: 'clearFixing' },
        { label: '-' },
        { label: '➕ 모든 그룹 펼치기', tag: 'expandAll' },
        { label: '➖ 모든 그룹 접기', tag: 'collapseAll' }
      ])

      this.gridView.onContextMenuItemClicked = (grid, item, clickData) => {
        // 행/열 동적 고정 먼저 처리 (this.gridView 직접)
        if (this.handleFix(item, clickData)) {
          return
        }

        if (item.tag === 'groupByCol') {
          const colName = clickData.column
          if (colName) {
            this.applyView({ id: 'custom_' + Date.now(), name: `${this.getHeaderText(colName)} 뷰`, fields: [colName] })
          } else {
            showToast('그룹화할 컬럼 헤더나 셀 영역을 우클릭해 주세요.', { type: 'warning' })
          }
        } else if (item.tag === 'saveView') {
          this.saveCurrentView()
        } else if (item.tag === 'clearGroup') {
          this.clearGroupBy()
        } else if (item.tag === 'expandAll') {
          this.expandAll()
        } else if (item.tag === 'collapseAll') {
          this.collapseAll()
        }
      }

      if (Array.isArray(this.initialGroup) && this.initialGroup.length > 0) {
        this.applyView({ id: 'initial', name: '초기 뷰', fields: this.initialGroup })
      } else {
        this.clearGroupBy()
      }
    },

    clearGroupBy() {
      if (!this.gridView) return
      this.activeGroup = 'none'
      this.activeHasGroup = false
      this.gridView.groupBy([])
      this.gridView.setEditOptions({ editable: true })
      showToast('원본 데이터(Flat Grid)로 전환되었습니다.', { type: 'info' })
    },

    applyView(view) {
      if (!this.gridView) return

      // 포괄 뷰(layout/fixed/sort 보유)면 레이아웃+그룹+고정+정렬 전체 복원,
      // 프리셋/구버전 저장뷰(fields 만)면 기존처럼 그룹 필드만 적용.
      const isComprehensive = Array.isArray(view.layout) || !!view.fixed || Array.isArray(view.sort)
      let hasGroup
      if (isComprehensive) {
        applyViewState(this.gridView, view)
        hasGroup = Array.isArray(view.group) && view.group.length > 0
      } else {
        this.gridView.groupBy(view.fields || [])
        hasGroup = Array.isArray(view.fields) && view.fields.length > 0
      }

      this.activeGroup = view.id
      this.activeHasGroup = hasGroup
      // 그룹핑(집계) 뷰일 때만 편집/추가/삭제 잠금. 순수 레이아웃 뷰는 편집 허용.
      this.gridView.setEditOptions({ editable: !hasGroup })
      showToast(`'${view.name}' 뷰가 적용되었습니다.${hasGroup ? ' (편집/추가/삭제 제한)' : ''}`, { type: 'info' })
    },

    // 우클릭 행/열 동적 고정 (커스텀 컨텍스트 메뉴라 this.gridView 로 직접 처리)
    handleFix(item, clickData) {
      const gv = this.gridView
      if (!gv) return false
      const fixed = gv.getFixedOptions ? (gv.getFixedOptions() || {}) : {}
      const colCount = fixed.colCount || 0
      const rowCount = fixed.rowCount || 0
      const colIndexOf = (name) => {
        try {
          if (typeof gv.getColumnIndex === 'function') return gv.getColumnIndex(name)
          const c = gv.columnByName && gv.columnByName(name)
          if (c && typeof c.displayIndex === 'number') return c.displayIndex
        } catch (e) { /* noop */ }
        return -1
      }
      if (item.tag === 'fixColumn' && clickData.column) {
        const i = colIndexOf(clickData.column)
        if (i >= 0) {
          gv.setFixedOptions({ colCount: i + 1, rowCount, resizable: true })
          showToast(`'${clickData.column}' 컬럼까지 열 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'fixRow' && clickData.itemIndex !== undefined && clickData.itemIndex >= 0) {
        gv.setFixedOptions({ colCount, rowCount: clickData.itemIndex + 1, resizable: true })
        showToast(`${clickData.itemIndex + 1}번째 행까지 행 고정이 적용되었습니다.`, { type: 'success' })
        return true
      } else if (item.tag === 'fixBoth' && clickData.column && clickData.itemIndex !== undefined && clickData.itemIndex >= 0) {
        const i = colIndexOf(clickData.column)
        if (i >= 0) {
          gv.setFixedOptions({ colCount: i + 1, rowCount: clickData.itemIndex + 1, resizable: true })
          showToast(`${clickData.itemIndex + 1}행 x '${clickData.column}'열 동시 고정이 적용되었습니다.`, { type: 'success' })
          return true
        }
      } else if (item.tag === 'clearFixing') {
        gv.setFixedOptions({ colCount: 0, rowCount: 0 })
        showToast('행/열 고정이 해제되었습니다.', { type: 'info' })
        return true
      }
      return false
    },

    expandAll() {
      // 그룹 멀티패스 펼치기 (this.gridView 직접)
      if (!this.gridView) return
      for (let pass = 0; pass < 2; pass++) {
        const cnt = this.gridView.getItemCount()
        for (let i = 0; i < cnt; i++) {
          try { this.gridView.expandGroup(i, true, true) } catch (e) { /* noop */ }
        }
      }
      showToast('모든 부서 그룹 행이 쫙 펼쳐졌습니다.', { type: 'info' })
    },

    collapseAll() {
      if (!this.gridView) return
      const cnt = this.gridView.getItemCount()
      for (let i = cnt - 1; i >= 0; i--) {
        try { this.gridView.collapseGroup(i, true) } catch (e) { /* noop */ }
      }
      showToast('모든 그룹 행이 싹 접혔습니다 (소계 요약 보기).', { type: 'info' })
    },

    getHeaderText(colName) {
      if (!this.gridView) return colName
      try {
        const col = this.gridView.columnByName(colName)
        if (col && col.header && col.header.text) {
          return col.header.text
        }
      } catch (e) {}
      return colName
    },

    getFieldLabelsText(fields) {
      if (!Array.isArray(fields)) return ''
      return fields.map(f => this.getHeaderText(f)).join(' > ')
    },

    loadSavedViews() {
      try {
        const stored = localStorage.getItem('nexhub_pivot_saved_views')
        if (stored) {
          this.userSavedViews = JSON.parse(stored)
        }
      } catch (e) {
        console.error('Failed to load saved views:', e)
      }
    },

    saveCurrentView() {
      if (!this.gridView) return
      // 그룹핑뿐 아니라 컬럼 배치(이동/너비/표시)·고정·정렬까지 포괄 캡처.
      const state = captureViewState(this.gridView, { includeGroup: true })
      const groupFields = (state && state.group) || []

      const defaultName = groupFields.length > 0
        ? this.getFieldLabelsText(groupFields) + ' 뷰'
        : '사용자 정의 뷰'
      const viewName = prompt('저장할 뷰 이름을 입력하세요 (컬럼 배치·고정·정렬·그룹핑 포함):', defaultName)
      if (!viewName || !viewName.trim()) return

      const newView = {
        id: 'user_view_' + Date.now(),
        name: viewName.trim(),
        ...state
      }

      this.userSavedViews.push(newView)
      localStorage.setItem('nexhub_pivot_saved_views', JSON.stringify(this.userSavedViews))
      this.applyView(newView)
      showToast(`'${newView.name}' 맞춤 뷰가 저장되었습니다!`, { type: 'success' })
    },

    deleteSavedView(viewId) {
      this.userSavedViews = this.userSavedViews.filter(v => v.id !== viewId)
      localStorage.setItem('nexhub_pivot_saved_views', JSON.stringify(this.userSavedViews))
      if (this.activeGroup === viewId) {
        this.clearGroupBy()
      }
      showToast('저장된 맞춤 뷰가 삭제되었습니다.', { type: 'warning' })
    },

    addRow() {
      if (!this.dataProvider || !this.gridView) return
      if (this.isGrouped) {
        showToast('그룹핑(피벗) 적용 중에는 추가/삭제가 제한됩니다. 원본 보기로 전환해 주세요.', { type: 'warning' })
        return
      }

      const tempId = 'user_' + Math.random().toString(36).substring(2, 8)
      this.dataProvider.insertRow(0, {
        userId: tempId,
        name: '신규 사용자',
        dept: '개발 1팀',
        role: '선임연구원',
        workStatus: '재직',
        employmentType: '정규직',
        evalGrade: 'B',
        skillScore: 75,
        region: '서울',
        salary: 5000,
        joinDate: new Date().toISOString().slice(0, 10)
      })
      this.gridView.setCurrent({ itemIndex: 0 })
      showToast('상단에 새 행이 추가되었습니다 (State: Created). 셀을 클릭해 수정해 보세요.', { type: 'info' })
    },

    deleteChecked() {
      if (!this.gridView || !this.dataProvider) return
      if (this.isGrouped) {
        showToast('그룹핑(피벗) 적용 중에는 추가/삭제가 제한됩니다. 원본 보기로 전환해 주세요.', { type: 'warning' })
        return
      }

      const checkedRows = this.gridView.getCheckedRows() || []
      if (checkedRows.length === 0) {
        showToast('삭제할 행을 왼쪽 체크박스로 선택해 주세요.', { type: 'warning' })
        return
      }
      this.dataProvider.removeRows(checkedRows, false) // RealGrid2 소프트 삭제 (상태바 - 표시)
      this.gridView.checkAll(false)
      showToast(`${checkedRows.length}건이 삭제 표시되었습니다 (State: Deleted).`, { type: 'warning' })
    },

    saveData() {
      if (!this.gridView || !this.dataProvider) return
      this.gridView.commit(true) // RealGrid2 표준 편집 커밋

      const createdIdx = this.dataProvider.getStateRows('created') || []
      const updatedIdx = this.dataProvider.getStateRows('updated') || []
      const deletedIdx = this.dataProvider.getStateRows('deleted') || []
      const changes = {
        created: createdIdx.map(i => this.dataProvider.getJsonRow(i)),
        updated: updatedIdx.map(i => this.dataProvider.getJsonRow(i)),
        deleted: deletedIdx.map(i => this.dataProvider.getJsonRow(i))
      }
      const totalChanges = changes.created.length + changes.updated.length + changes.deleted.length

      if (totalChanges === 0) {
        showToast('변경사항(추가/수정/삭제)이 없습니다.', { type: 'warning' })
        return
      }

      console.log('서버 전송 C, U, D 페이로드:', changes)

      alert(
        `[서버 전송 C, U, D 데이터 추출 성공]\n\n` +
        `• 추가 (Created - C): ${changes.created.length}건\n` +
        `• 수정 (Updated - U): ${changes.updated.length}건\n` +
        `• 삭제 (Deleted - D): ${changes.deleted.length}건\n\n` +
        `개발자 도구 콘솔(F12)에 전송할 JSON 페이로드가 출력되었습니다.`
      )

      this.dataProvider.clearRowStates()
      showToast('서버 저장 완료 및 행 상태(C,U,D)가 클리어되었습니다.', { type: 'success' })
    },

    exportExcel() {
      if (!this.gridView) return
      this.gridView.exportGrid({
        type: 'excel',
        target: 'local',
        fileName: 'Pivot_AltA_Group_Export.xlsx',
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
.cursor-pointer {
  cursor: pointer;
}
.transition-all {
  transition: all 0.2s ease;
}
</style>

<style>
/* RealGrid 동적 셀 스타일 (styleCallback 전용) */
.rg-data-cell.rg-emp-regular { color: var(--b2b-color-primary) !important; }
.rg-data-cell.rg-emp-contract { color: #ea580c !important; }
.rg-data-cell.rg-emp-parttime { color: #7c3aed !important; }
.rg-data-cell.rg-emp-intern { color: #0891b2 !important; }
.rg-data-cell.rg-emp-dept { color: var(--b2b-color-text-muted) !important; }
.rg-data-cell.rg-salary-high { color: #dc2626 !important; }

/* 🔹 RealGrid 인라인 액션 버튼 디자인 (B2B 화이트 카드 & 연한 검정 텍스트 스타일) */
.btn-grid-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 23px;
  padding: 0 10px;
  font-size: var(--b2b-font-size-xs);
  font-weight: 500;
  color: #334155; /* 연한 검은색 / 진회색 */
  background-color: #ffffff; /* 하얀색 버튼 */
  border: 1px solid #d1d5db; /* 깔끔한 경계선 */
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
  white-space: nowrap;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.btn-grid-action:hover {
  background-color: #f8fafc;
  border-color: #9ca3af;
  color: #0f172a;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.btn-grid-action:active {
  transform: translateY(0);
  background-color: #f1f5f9;
}

.btn-grid-action .icon-edit {
  color: #2563eb; /* 수정 아이콘 파랑 */
  font-size: 11px;
}

.btn-grid-action .icon-delete {
  color: #dc2626; /* 삭제 아이콘 빨강 */
  font-size: 11px;
}

/* 다크모드 대응 */
[data-theme="dark"] .btn-grid-action,
[data-theme="dark-navy"] .btn-grid-action {
  background-color: var(--b2b-color-bg-card, #1e293b);
  border-color: var(--b2b-color-border, #334155);
  color: #e2e8f0;
}
[data-theme="dark"] .btn-grid-action:hover,
[data-theme="dark-navy"] .btn-grid-action:hover {
  background-color: var(--b2b-color-hover-bg, #334155);
  color: #ffffff;
}
</style>
