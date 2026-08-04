<template>
  <div class="b2b-page-container">
    <!-- Header Page Title -->
    <div class="mb-3">
      <h4 class="fw-bold m-0" style="color: var(--b2b-color-text-main)">RealGrid-Vue 샘플 (공통 슬롯 컴포넌트형)</h4>
      <p class="small mb-0" style="color: var(--b2b-color-text-muted)">공식 <span class="badge bg-primary-soft text-primary font-monospace">realgrid-vue</span> 래퍼를 캡슐화한 RealGridCommonVue를 적용한 그리드 샘플입니다.</p>
    </div>

    <!-- Unified Management Toolbar (B2B Compact Enterprise Style - 바닐라 JS형과 100% 동일) -->
    <div class="b2b-toolbar">
      <div class="d-flex align-items-center justify-content-between w-100">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Vue3 Slot 래퍼</span>
          <!-- Quick Search Bar -->
          <QuickSearchBar
            :searchResult="searchResult"
            @search="onGridSearch"
            @clear="searchResult = { count: 0, current: 0 }"
          />
          <SavedViewsBar
            :grid-view-getter="() => gridView"
            storage-key="nexhub_realgrid_vue_saved_views"
          />
        </div>
        <div class="d-flex align-items-center gap-1.5 ms-auto">
          <button class="btn-b2b-action" title="컬럼 숨김/표시 설정" @click="openColumnPicker">
            <i class="bi bi-eye text-primary me-0.5"></i>
            <span>컬럼</span>
          </button>
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
          <button class="btn-b2b-primary ms-1" title="변경사항 저장" @click="saveData">
            <i class="bi bi-check2 me-0.5"></i>
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid Container Card with Common Vue Slot Component -->
    <div class="b2b-grid-card mb-4">
      <div class="b2b-grid-wrapper">
        <RealGridCommonVue
          ref="realgridComp"
          grid-id="realgrid-vue-page"
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
          @init="onGridInit"
        >
          <!-- Defining Data Fields dynamically inside slot -->
          <RGDataField fieldName="userId" dataType="text" />
          <RGDataField fieldName="name" dataType="text" />
          <RGDataField fieldName="dept" dataType="text" />
          <RGDataField fieldName="role" dataType="text" />
          <RGDataField fieldName="status" dataType="text" />
          <RGDataField fieldName="joinDate" dataType="datetime" datetimeFormat="yyyyMMdd" />
          <RGDataField fieldName="activeYn" dataType="text" />
          <RGDataField fieldName="salary" dataType="number" />
          <RGDataField fieldName="sales" dataType="number" />

          <!-- Defining Visual Columns dynamically inside slot (1:1 완벽 통일) -->
          <RGDataColumn
            name="userId"
            fieldName="userId"
            width="90"
            :header="{ text: 'ID' }"
            :editable="false"
            :styles="{ textAlignment: 'center' }"
          />
          <RGDataColumn
            name="dept"
            fieldName="dept"
            width="110"
            :header="{ text: '부서명' }"
            :styles="{ textAlignment: 'near' }"
            :mergeRule="{ criteria: 'value' }"
          />
          <RGDataColumn
            name="name"
            fieldName="name"
            width="100"
            :header="{ text: '이름' }"
            :styles="{ textAlignment: 'center' }"
          />
          <RGDataColumn
            name="role"
            fieldName="role"
            width="120"
            :header="{ text: '역할/직급' }"
            :styles="{ textAlignment: 'near' }"
          />
          <RGDataColumn
            name="status"
            fieldName="status"
            width="110"
            :header="{ text: '재직상태 (셀렉트)' }"
            :styles="{ textAlignment: 'center' }"
            :editor="{ type: 'dropdown', dropDownCount: 4, domainOnly: true, labels: ['재직', '휴직', '퇴사'], values: ['재직', '휴직', '퇴사'] }"
            :displayCallback="(grid, index, value) => (!value ? '선택' : value)"
          />
          <RGDataColumn
            name="joinDate"
            fieldName="joinDate"
            width="110"
            :header="{ text: '입사일 (달력)' }"
            :styles="{ textAlignment: 'center' }"
            datetimeFormat="yyyy-MM-dd"
            :editor="{ type: 'date', datetimeFormat: 'yyyy-MM-dd', commitOnSelect: true }"
          />
          <RGDataColumn
            name="activeYn"
            fieldName="activeYn"
            width="85"
            :header="{ text: '활성 (체크)' }"
            :styles="{ textAlignment: 'center' }"
            :renderer="{ type: 'check', trueValues: 'Y', falseValues: 'N' }"
          />
          <RGDataColumn
            name="salary"
            fieldName="salary"
            width="110"
            :header="{ text: '기본급 (만원)' }"
            numberFormat="#,##0"
            :styles="{ textAlignment: 'far' }"
            :footer="{ expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }"
          />
          <RGDataColumn
            name="sales"
            fieldName="sales"
            width="120"
            :header="{ text: '영업실적 (만원)' }"
            numberFormat="#,##0"
            :styles="{ textAlignment: 'far' }"
            :footer="{ expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }"
          />
        </RealGridCommonVue>
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
import RealGridCommonVue from '@/components/RealGridCommonVue.vue'
import ColumnPickerModal from '@/components/ColumnPickerModal.vue'
import QuickSearchBar from '@/components/QuickSearchBar.vue'
import SavedViewsBar from '@/components/SavedViewsBar.vue'
import { RGDataField, RGDataColumn } from 'realgrid-vue'
import { showToast } from '@/utils/toastUtil.js'
import { searchGrid } from '@/utils/realgridOps'

export default {
  name: 'RealGridVuePage',
  components: {
    RealGridCommonVue,
    ColumnPickerModal,
    QuickSearchBar,
    SavedViewsBar,
    RGDataField,
    RGDataColumn
  },
  data() {
    return {
      searchResult: { count: 0, current: 0 },
      isColumnPickerOpen: false,
      columnPickerCols: [],
      users: []
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      gridView.setFixedOptions({
        colCount: 1,
        resizable: true
      })

      // 우클릭 행/열 고정 메뉴는 RealGridCommonVue 컴포넌트가 내부에서 처리(refs 불필요)
    },

    async loadUsers() {
      const defaultUsers = [
        { userId: 'u001', name: '김철수', dept: '개발 1팀', role: '수석연구원', status: '재직', joinDate: '2021-03-01', activeYn: 'Y', salary: 7200, sales: 12000 },
        { userId: 'u002', name: '이영희', dept: '개발 1팀', role: '책임연구원', status: '재직', joinDate: '2022-05-15', activeYn: 'Y', salary: 6100, sales: 9800 },
        { userId: 'u003', name: '박민수', dept: '개발 1팀', role: '선임연구원', status: '휴직', joinDate: '2023-01-10', activeYn: 'N', salary: 4800, sales: 7500 },
        { userId: 'u004', name: '정수진', dept: '개발 2팀', role: '수석연구원', status: '재직', joinDate: '2020-11-01', activeYn: 'Y', salary: 7500, sales: 14500 },
        { userId: 'u005', name: '홍길동', dept: '개발 2팀', role: '책임연구원', status: '재직', joinDate: '2022-08-20', activeYn: 'Y', salary: 6300, sales: 11000 },
        { userId: 'u006', name: '강지훈', dept: '개발 2팀', role: '선임연구원', status: '재직', joinDate: '2023-04-12', activeYn: 'Y', salary: 4600, sales: 8200 },
        { userId: 'u007', name: '조유진', dept: '영업 1팀', role: '부장', status: '재직', joinDate: '2019-07-01', activeYn: 'Y', salary: 8000, sales: 32000 },
        { userId: 'u008', name: '윤상호', dept: '영업 1팀', role: '차장', status: '퇴사', joinDate: '2021-02-15', activeYn: 'N', salary: 6800, sales: 24000 }
      ]
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('Fetch failed')
        const data = await res.json()
        const rows = Array.isArray(data) ? data : data.users || []
        const rawUsers = rows.length > 0 ? rows : defaultUsers
        this.users = rawUsers.map((u, i) => ({
          ...u,
          joinDate: u.joinDate ? u.joinDate.replace(/-/g, '') : `20240${(i % 9) + 1}15`
        }))
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
        dept: '개발 1팀',
        role: '연구원',
        salary: 4500,
        sales: 0
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
        `• 추가 (Created - C): ${changes.created.length}건\n` +
        `• 수정 (Updated - U): ${changes.updated.length}건\n` +
        `• 삭제 (Deleted - D): ${changes.deleted.length}건`
      )

      this.dataProvider.clearRowStates()
    },

    exportExcel() {
      if (!this.gridView) return
      this.gridView.exportGrid({
        type: 'excel',
        target: 'local',
        fileName: 'RealGrid_Vue_List.xlsx',
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
