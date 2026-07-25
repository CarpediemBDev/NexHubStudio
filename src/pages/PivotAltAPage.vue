<template>
  <div class="container py-3">
    <!-- Header Page Title & Context Guide -->
    <div class="mb-3">
      <div class="d-flex align-items-center gap-2">
        <h4 class="fw-bold text-dark m-0">피벗 대안 A: RealGrid 2 동적 행 그룹핑 & CRUD</h4>
        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">라이선스 미필요</span>
      </div>
      <p class="text-muted small mb-0 mt-1">
        셀 편집, 행 추가/삭제 및 **C(생성), U(수정), D(삭제)** 상태 추출 저장을 지원하는 고성능 리얼그리드 화면입니다.
      </p>
    </div>

    <!-- Unified Management Toolbar (Confirmed Model 2: Smart Search Popover & Role-based Clean Division) -->
    <div class="card bg-light border-0 mb-3 shadow-sm">
      <div class="card-body p-2.5 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <!-- Left Group: View & Layout Tools -->
        <div class="d-flex align-items-center gap-1.5 flex-wrap">
          <!-- Reset to Flat Raw Data -->
          <button
            class="btn-compact"
            :class="activeGroup === 'none' ? 'btn-compact-active' : 'btn-compact-secondary'"
            @click="clearGroupBy"
          >
            <i class="bi bi-table me-0.5"></i>
            <span>원본 보기</span>
          </button>

          <!-- Integrated Preset Dropdown -->
          <div class="dropdown">
            <button
              class="btn-compact dropdown-toggle"
              :class="activeGroup !== 'none' && activeGroup.startsWith('preset_') ? 'btn-compact-preset-active' : 'btn-compact-secondary'"
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
          <button class="btn-compact btn-compact-secondary" title="현재 뷰 상태 저장" @click="saveCurrentView">
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
              :class="activeGroup === view.id ? 'bg-primary text-white shadow-sm' : 'bg-white text-dark border-secondary-subtle'"
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

        <!-- Right Group: Smart Expandable Search & Data Action Buttons -->
        <div class="d-flex align-items-center gap-1.5 ms-auto">
          <!-- Smart Expandable Search Bar -->
          <QuickSearchBar
            :searchResult="searchResult"
            @search="onGridSearch"
            @clear="searchResult = { count: 0, current: 0 }"
          />

          <!-- Column Picker -->
          <button class="btn-compact btn-compact-secondary" title="컬럼 숨김/표시 설정" @click="openColumnPicker">
            <i class="bi bi-eye text-primary me-0.5"></i>
            <span>컬럼</span>
          </button>

          <!-- Excel Export -->
          <button class="btn-compact btn-compact-secondary" title="엑셀 파일 내보내기" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
            <span>엑셀</span>
          </button>

          <!-- 추가 -->
          <button
            class="btn-compact btn-compact-secondary"
            :disabled="isGrouped"
            :title="isGrouped ? '그룹핑(피벗) 상태에서는 원본 보기에서만 데이터 추가가 가능합니다' : '새 행 추가'"
            @click="addRow"
          >
            <i class="bi bi-plus-lg text-success me-0.5"></i>
            <span>추가</span>
          </button>

          <!-- 삭제 -->
          <button
            class="btn-compact btn-compact-secondary"
            :disabled="isGrouped"
            :title="isGrouped ? '그룹핑(피벗) 상태에서는 원본 보기에서만 데이터 삭제가 가능합니다' : '선택 행 삭제'"
            @click="deleteChecked"
          >
            <i class="bi bi-dash-lg text-danger me-0.5"></i>
            <span>삭제</span>
          </button>

          <!-- 저장 -->
          <button class="btn-compact btn-compact-save ms-1" @click="saveData" title="변경사항 저장">
            <i class="bi bi-check2 me-0.5"></i>
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid Container Card using Base Component -->
    <div class="card shadow-sm border-light mb-4">
      <div class="card-body p-0">
        <RealGridCommonJs
          ref="realgridComp"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="mockData"
          :useGroupPanel="true"
          :useFooter="true"
          :softDeleting="true"
          :hideDeletedRows="false"
          height="580px"
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
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'PivotAltAPage',
  components: {
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
        { fieldName: 'salary', dataType: 'number' },
        { fieldName: 'sales', dataType: 'number' },
        { fieldName: 'bonus', dataType: 'number' }
      ],
      gridColumns: [
        { name: 'region', fieldName: 'region', width: '100', header: { text: '지역' }, styles: { textAlignment: 'center' } },
        { name: 'dept', fieldName: 'dept', width: '130', header: { text: '부서명' }, styles: { textAlignment: 'near' } },
        { name: 'role', fieldName: 'role', width: '130', header: { text: '직급' }, styles: { textAlignment: 'near' } },
        { name: 'name', fieldName: 'name', width: '120', header: { text: '이름' }, styles: { textAlignment: 'center' } },
        {
          name: 'salary',
          fieldName: 'salary',
          width: '130',
          header: { text: '기본급 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } },
          groupFooter: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'sales',
          fieldName: 'sales',
          width: '140',
          header: { text: '영업실적 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } },
          groupFooter: { expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }
        },
        {
          name: 'bonus',
          fieldName: 'bonus',
          width: '120',
          header: { text: '성과급 (만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          footer: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far' } },
          groupFooter: { expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far' } }
        }
      ],
      mockData: [
        { userId: 'u001', name: '김철수', dept: '개발 1팀', role: '수석연구원', region: '서울', salary: 7200, sales: 12000, bonus: 500 },
        { userId: 'u002', name: '이영희', dept: '개발 1팀', role: '책임연구원', region: '서울', salary: 6100, sales: 9800, bonus: 400 },
        { userId: 'u003', name: '박민수', dept: '개발 1팀', role: '선임연구원', region: '서울', salary: 4800, sales: 7500, bonus: 300 },
        { userId: 'u004', name: '정수진', dept: '개발 2팀', role: '수석연구원', region: '판교', salary: 7500, sales: 14500, bonus: 600 },
        { userId: 'u005', name: '홍길동', dept: '개발 2팀', role: '책임연구원', region: '판교', salary: 6300, sales: 11000, bonus: 450 },
        { userId: 'u006', name: '강지훈', dept: '개발 2팀', role: '선임연구원', region: '판교', salary: 4600, sales: 8200, bonus: 320 },
        { userId: 'u007', name: '조유진', dept: '영업 1팀', role: '부장', region: '서울', salary: 8000, sales: 32000, bonus: 1200 },
        { userId: 'u008', name: '윤상호', dept: '영업 1팀', role: '차장', region: '서울', salary: 6800, sales: 24000, bonus: 900 },
        { userId: 'u009', name: '한지민', dept: '영업 1팀', role: '과장', region: '서울', salary: 5500, sales: 18000, bonus: 700 },
        { userId: 'u100', name: '임재현', dept: '영업 2팀', role: '부장', region: '부산', salary: 8200, sales: 35000, bonus: 1500 },
        { userId: 'u101', name: '서동현', dept: '영업 2팀', role: '차장', region: '부산', salary: 6900, sales: 26000, bonus: 950 },
        { userId: 'u102', name: '송혜교', dept: '경영지원', role: '부장', region: '서울', salary: 7800, sales: 0, bonus: 800 },
        { userId: 'u103', name: '현빈', dept: '경영지원', role: '과장', region: '서울', salary: 5600, sales: 0, bonus: 500 }
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
  mounted() {
    this.loadSavedViews()
  },
  methods: {
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
      if (this.$refs.realgridComp) {
        this.$refs.realgridComp.groupBy([])
      }
      this.gridView.setEditOptions({ editable: true })
      showToast('원본 데이터(Flat Grid)로 전환되었습니다.', { type: 'info' })
    },

    applyView(view) {
      if (!this.gridView || !this.$refs.realgridComp) return
      this.activeGroup = view.id
      this.$refs.realgridComp.groupBy(view.fields)
      this.gridView.setEditOptions({ editable: false })
      showToast(`'${view.name}' 뷰가 적용되었습니다. (편집/추가/삭제 제한)`, { type: 'info' })
    },

    expandAll() {
      if (!this.gridView) return
      // 2회 멀티패스 순회: 완전히 싹 접힌 상태에서도 1차/2차 모든 그룹을 100% 쫙 펼칩니다
      for (let pass = 0; pass < 2; pass++) {
        const count = this.gridView.getItemCount()
        for (let i = 0; i < count; i++) {
          try { this.gridView.expandGroup(i, true, true) } catch (e) {}
        }
      }
      showToast('모든 부서 그룹 행이 쫙 펼쳐졌습니다.', { type: 'info' })
    },

    collapseAll() {
      if (!this.gridView) return
      const count = this.gridView.getItemCount()
      for (let i = count - 1; i >= 0; i--) {
        try { this.gridView.collapseGroup(i, true) } catch (e) {}
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
      const fields = this.$refs.realgridComp ? this.$refs.realgridComp.getGroupFieldNames() : []
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
      if (this.$refs.realgridComp) {
        this.$refs.realgridComp.insertRow(0, {
          userId: tempId,
          name: '신규 사용자',
          dept: '개발 1팀',
          role: '선임연구원',
          region: '서울',
          salary: 5000,
          sales: 0,
          bonus: 0
        })
      }
      showToast('상단에 새 행이 추가되었습니다 (State: Created). 셀을 클릭해 수정해 보세요.', { type: 'info' })
    },

    deleteChecked() {
      if (!this.gridView || !this.dataProvider) return
      if (this.isGrouped) {
        showToast('그룹핑(피벗) 적용 중에는 추가/삭제가 제한됩니다. 원본 보기로 전환해 주세요.', { type: 'warning' })
        return
      }

      const count = this.$refs.realgridComp ? this.$refs.realgridComp.deleteChecked() : 0
      if (count === 0) {
        showToast('삭제할 행을 왼쪽 체크박스로 선택해 주세요.', { type: 'warning' })
        return
      }
      showToast(`${count}건이 삭제 표시되었습니다 (State: Deleted).`, { type: 'warning' })
    },

    saveData() {
      if (!this.gridView || !this.dataProvider) return
      this.gridView.commit()

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

      if (this.$refs.realgridComp) {
        this.$refs.realgridComp.clearRowStates()
      }
      showToast('서버 저장 완료 및 행 상태(C,U,D)가 클리어되었습니다.', { type: 'success' })
    },

    exportExcel() {
      if (this.$refs.realgridComp) {
        this.$refs.realgridComp.exportToExcel('Pivot_AltA_Group_Export.xlsx')
      }
    },

    openColumnPicker() {
      if (this.$refs.realgridComp) {
        this.columnPickerCols = this.$refs.realgridComp.getColumnsInfo()
        this.isColumnPickerOpen = true
      }
    },

    onToggleColumn({ name, visible }) {
      if (this.$refs.realgridComp) {
        this.$refs.realgridComp.setColumnVisible(name, visible)
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
.btn-compact {
  height: 30px;
  padding: 0 10px;
  font-size: 0.8125rem; /* 13px */
  font-weight: 500;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease-in-out;
  cursor: pointer;
  line-height: 1;
}
.btn-compact-secondary {
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  color: #374151;
}
.btn-compact-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}
.btn-compact-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background-color: #f3f4f6;
  border-color: #e5e7eb;
  color: #9ca3af;
}
.btn-compact-active {
  background-color: #1f2937;
  border: 1px solid #1f2937;
  color: #ffffff;
}
.btn-compact-preset-active {
  background-color: #2563eb;
  border: 1px solid #2563eb;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 1px 2px 0 rgba(37, 99, 235, 0.25);
}
.btn-compact-save {
  background-color: #2563eb;
  border: 1px solid #2563eb;
  color: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(37, 99, 235, 0.2);
}
.btn-compact-save:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}
.btn-segmented {
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 4px 11px;
  transition: all 0.15s ease-in-out;
}
.btn-segmented-outline {
  background-color: #ffffff;
  border-color: #d1d5db;
  color: #4b5563;
}
.btn-segmented-outline:hover {
  background-color: #f3f4f6;
  color: #111827;
}
.btn-segmented-active {
  background-color: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
}
.cursor-pointer {
  cursor: pointer;
}
.transition-all {
  transition: all 0.2s ease;
}
</style>
