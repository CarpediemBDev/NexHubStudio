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
          :rows="users"
          :sortable="true"
          :filterable="true"
          :checkable="true"
          :indicatable="true"
          :stateBarVisible="true"
          :pinnable="true"
          :groupable="false"
          :mergeable="true"
          :groupSummaryMode="'aggregate'"
          :hideGroupedColumn="false"
          :checkBarExclusive="false"
          :showFooter="true"
          :softDeletable="true"
          :commitWhenLeave="true"
          :fitStyle="'evenFill'"
          :fixedColCount="1"
          :fixedRowCount="0"
          @init="onGridInit"
        >
          <!-- Defining Data Fields dynamically inside slot -->
          <RGDataField fieldName="userId" dataType="text" />
          <RGDataField fieldName="name" dataType="text" />
          <RGDataField fieldName="dept" dataType="text" />
          <RGDataField fieldName="role" dataType="text" />
          <RGDataField fieldName="status" dataType="text" />
          <RGDataField fieldName="joinDate" dataType="text" />
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
            width="100"
            :header="{ text: '재직상태 (셀렉트)' }"
            :styles="{ textAlignment: 'center' }"
            :editor="{ type: 'dropdown', dropDownCount: 4, domainOnly: true, labels: ['재직', '휴직', '퇴사'], values: ['재직', '휴직', '퇴사'] }"
          />
          <RGDataColumn
            name="joinDate"
            fieldName="joinDate"
            width="110"
            :header="{ text: '입사일 (달력)' }"
            :styles="{ textAlignment: 'center' }"
            :editor="{ type: 'date', datetimeFormat: 'yyyy-MM-dd' }"
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
import { RGDataField, RGDataColumn } from 'realgrid-vue'
import { showToast } from '@/utils/toastUtil.js'

export default {
  name: 'RealGridVuePage',
  components: {
    RealGridCommonVue,
    ColumnPickerModal,
    QuickSearchBar,
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
    onGridInit({ gridView }) {
      gridView.setFixedOptions({
        colCount: 1,
        resizable: true
      })

      // RealGrid 우클릭 컨텍스트 메뉴 팝업 허용 및 클릭 이벤트 연결
      gridView.onContextMenuPopup = () => true
      gridView.onContextMenuItemClicked = (grid, item, clickData) => {
        if (this.$refs.realgridComp) {
          this.$refs.realgridComp.handleDynamicFixing(item, clickData)
        }
      }
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
        this.users = rows.length > 0 ? rows : defaultUsers
      } catch (error) {
        console.warn('Using default mock users:', error)
        this.users = defaultUsers
      }
    },

    addRow() {
      const tempId = 'user_' + Math.random().toString(36).substring(2, 8)
      this.$refs.realgridComp.insertRow(0, {
        userId: tempId,
        name: '신규 사용자',
        dept: '개발 1팀',
        role: '연구원',
        salary: 4500,
        sales: 0
      })
      showToast('상단에 새 행이 추가되었습니다 (State: Created).', { type: 'info' })
    },

    deleteChecked() {
      const count = this.$refs.realgridComp.deleteChecked()
      if (count === 0) {
        showToast('선택된 사용자가 없습니다.', { type: 'warning' })
        return
      }
      showToast(`${count}건이 삭제 표시되었습니다 (State: Deleted).`, { type: 'warning' })
    },

    async saveData() {
      const changes = this.$refs.realgridComp.getChanges()
      const totalChanges = changes.created.length + changes.updated.length + changes.deleted.length

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

      this.$refs.realgridComp.clearRowStates()
    },

    exportExcel() {
      if (this.$refs.realgridComp) {
        this.$refs.realgridComp.exportToExcel('RealGrid_Vue_List.xlsx')
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

    onGridSearch({ query, direction }) {
      if (this.$refs.realgridComp) {
        this.searchResult = this.$refs.realgridComp.searchGrid(query, direction)
      }
    }
  }
}
</script>

<style scoped>
</style>
