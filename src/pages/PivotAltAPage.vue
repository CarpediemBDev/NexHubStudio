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
              <li><h6 class="dropdown-header py-1">⚡ 빠른 프리셋 선택</h6></li>
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
          <div class="d-flex align-items-center gap-1.5">
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
          <div class="d-flex align-items-center gap-1.5 ms-1">
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
          :fields="gridFields"
          :columns="gridColumns"
          :rows="mockData"
          :sortable="true"
          :filterable="true"
          :checkable="true"
          :indicatable="true"
          :stateBarVisible="true"
          :stateBarWidth="20"
          :checkBarWidth="36"
          :pinnable="true"
          :groupable="true"
          :mergeable="true"
          :columnHideable="false"
          :exclusiveSelectable="false"
          :autoCommittable="true"
          :showFooter="true"
          :softDeletable="true"
          :groupSummaryMode="'aggregate'"
          :fitStyle="'evenFill'"
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
      quickPresets: [
        { id: 'preset_dept', name: '부서별', fields: ['dept'], icon: 'bi-building' },
        { id: 'preset_dept_role', name: '부서 ➔ 직급별', fields: ['dept', 'role'], icon: 'bi-diagram-3' },
        { id: 'preset_region_dept', name: '지역 ➔ 부서별', fields: ['region', 'dept'], icon: 'bi-geo-alt' },
        { id: 'preset_region_dept_role', name: '지역 ➔ 부서 ➔ 직급별', fields: ['region', 'dept', 'role'], icon: 'bi-layers' }
      ],
      userSavedViews: [],
      gridFields: [
        { fieldName: 'userId', dataType: 'text' },
        { fieldName: 'name', dataType: 'text' },
        { fieldName: 'dept', dataType: 'text' },
        { fieldName: 'role', dataType: 'text' },
        { fieldName: 'region', dataType: 'text' },
        { fieldName: 'status', dataType: 'text' },
        { fieldName: 'evalDate', dataType: 'text' },
        { fieldName: 'activeYn', dataType: 'text' },
        { fieldName: 'salary', dataType: 'number' },
        { fieldName: 'sales', dataType: 'number' },
        { fieldName: 'bonus', dataType: 'number' }
      ],
      gridColumns: [
        { name: 'region', fieldName: 'region', width: '90', header: { text: '지역' }, styles: { textAlignment: 'center' } },
        { name: 'dept', fieldName: 'dept', width: '110', header: { text: '부서명' }, styles: { textAlignment: 'near' } },
        { name: 'role', fieldName: 'role', width: '110', header: { text: '직급' }, styles: { textAlignment: 'near' } },
        { name: 'name', fieldName: 'name', width: '95', header: { text: '이름' }, styles: { textAlignment: 'center' } },
        {
          name: 'status',
          fieldName: 'status',
          width: '100',
          header: { text: '상태 (셀렉트)' },
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
          name: 'evalDate',
          fieldName: 'evalDate',
          width: '105',
          header: { text: '평가일 (달력)' },
          styles: { textAlignment: 'center' },
          editor: {
            type: 'date',
            datetimeFormat: 'yyyy-MM-dd'
          }
        },
        {
          name: 'activeYn',
          fieldName: 'activeYn',
          width: '85',
          header: { text: '활성 (체크)' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'check',
            trueValues: 'Y',
            falseValues: 'N'
          }
        },
        {
          name: 'salary',
          fieldName: 'salary',
          width: '110',
          header: { text: '기본급 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } },
          groupFooter: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'sales',
          fieldName: 'sales',
          width: '120',
          header: { text: '영업실적 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } },
          groupFooter: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'bonus',
          fieldName: 'bonus',
          width: '110',
          header: { text: '성과급 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far' } },
          groupFooter: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far' } }
        }
      ],
      mockData: [
        { userId: 'u001', name: '김철수', dept: '개발 1팀', role: '수석연구원', region: '서울', status: '재직', evalDate: '2025-01-10', activeYn: 'Y', salary: 7200, sales: 12000, bonus: 500 },
        { userId: 'u002', name: '이영희', dept: '개발 1팀', role: '책임연구원', region: '서울', status: '재직', evalDate: '2025-01-12', activeYn: 'Y', salary: 6100, sales: 9800, bonus: 400 },
        { userId: 'u003', name: '박민수', dept: '개발 1팀', role: '선임연구원', region: '서울', status: '휴직', evalDate: '2025-01-15', activeYn: 'N', salary: 4800, sales: 7500, bonus: 300 },
        { userId: 'u004', name: '정수진', dept: '개발 2팀', role: '수석연구원', region: '판교', status: '재직', evalDate: '2025-02-01', activeYn: 'Y', salary: 7500, sales: 14500, bonus: 600 },
        { userId: 'u005', name: '홍길동', dept: '개발 2팀', role: '책임연구원', region: '판교', status: '재직', evalDate: '2025-02-05', activeYn: 'Y', salary: 6300, sales: 11000, bonus: 450 },
        { userId: 'u006', name: '강지훈', dept: '개발 2팀', role: '선임연구원', region: '판교', status: '재직', evalDate: '2025-02-10', activeYn: 'Y', salary: 4600, sales: 8200, bonus: 320 },
        { userId: 'u007', name: '조유진', dept: '영업 1팀', role: '부장', region: '서울', status: '재직', evalDate: '2025-03-01', activeYn: 'Y', salary: 8000, sales: 32000, bonus: 1200 },
        { userId: 'u008', name: '윤상호', dept: '영업 1팀', role: '차장', region: '서울', status: '퇴사', evalDate: '2025-03-05', activeYn: 'N', salary: 6800, sales: 24000, bonus: 900 },
        { userId: 'u009', name: '한지민', dept: '영업 1팀', role: '과장', region: '서울', status: '재직', evalDate: '2025-03-10', activeYn: 'Y', salary: 5500, sales: 18000, bonus: 700 },
        { userId: 'u100', name: '임재현', dept: '영업 2팀', role: '부장', region: '부산', status: '재직', evalDate: '2025-04-01', activeYn: 'Y', salary: 8200, sales: 35000, bonus: 1500 },
        { userId: 'u101', name: '서동현', dept: '영업 2팀', role: '차장', region: '부산', status: '재직', evalDate: '2025-04-05', activeYn: 'Y', salary: 6900, sales: 26000, bonus: 950 },
        { userId: 'u102', name: '송혜교', dept: '경영지원', role: '부장', region: '서울', status: '재직', evalDate: '2025-05-01', activeYn: 'Y', salary: 7800, sales: 0, bonus: 800 },
        { userId: 'u103', name: '현빈', dept: '경영지원', role: '과장', region: '서울', status: '재직', evalDate: '2025-05-10', activeYn: 'Y', salary: 5600, sales: 0, bonus: 500 }
      ]
    }
  },
  computed: {
    isGrouped() {
      return this.activeGroup !== 'none'
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
          const statuses = ['재직', '재직', '재직', '휴직', '퇴사']
          this.mockData = rows.map((r, i) => ({
            ...r,
            status: r.status || statuses[i % statuses.length],
            evalDate: r.evalDate || `2025-0${(i % 5) + 1}-15`,
            activeYn: r.activeYn || (i % 7 === 0 ? 'N' : 'Y'),
            sales: r.sales ?? Math.floor((r.salary || 6000) * 1.5 + (i * 37) % 5000),
            bonus: r.bonus ?? Math.floor((r.salary || 6000) * 0.1 + (i * 13) % 800)
          }))
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
        // 공통 컴포넌트 동적 행/열 고정 헬퍼 먼저 처리
        if (this.$refs.realgridComp && this.$refs.realgridComp.handleDynamicFixing(item, clickData)) {
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
      this.gridView.groupBy([])
      this.gridView.setEditOptions({ editable: true })
      showToast('원본 데이터(Flat Grid)로 전환되었습니다.', { type: 'info' })
    },

    applyView(view) {
      if (!this.gridView) return
      this.activeGroup = view.id
      this.gridView.groupBy(view.fields)
      this.gridView.setEditOptions({ editable: false })
      showToast(`'${view.name}' 뷰가 적용되었습니다. (편집/추가/삭제 제한)`, { type: 'info' })
    },

    expandAll() {
      // 그룹 멀티패스 펼치기는 공통 mixin(expandAllGroups)에서 제공
      if (!this.$refs.realgridComp) return
      this.$refs.realgridComp.expandAllGroups()
      showToast('모든 부서 그룹 행이 쫙 펼쳐졌습니다.', { type: 'info' })
    },

    collapseAll() {
      if (!this.$refs.realgridComp) return
      this.$refs.realgridComp.collapseAllGroups()
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
      const fields = this.gridView.getGroupFieldNames() || []
      if (fields.length === 0) {
        showToast('현재 그룹핑된 컬럼이 없습니다. 컬럼을 그룹핑한 후 저장해주세요.', { type: 'warning' })
        return
      }

      const defaultName = this.getFieldLabelsText(fields) + ' 뷰'
      const viewName = prompt('저장할 맞춤 그룹핑 뷰 이름을 입력하세요:', defaultName)
      if (!viewName || !viewName.trim()) return

      const newView = {
        id: 'user_view_' + Date.now(),
        name: viewName.trim(),
        fields: [...fields]
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
        region: '서울',
        salary: 5000,
        sales: 0,
        bonus: 0
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

      const changes = this.$refs.realgridComp ? this.$refs.realgridComp.getChanges() : { created: [], updated: [], deleted: [] }
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

    onGridSearch({ query, direction, isTyping }) {
      if (this.$refs.realgridComp) {
        this.searchResult = this.$refs.realgridComp.searchGrid(query, direction, isTyping)
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
