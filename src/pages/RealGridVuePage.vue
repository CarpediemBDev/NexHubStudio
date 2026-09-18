<template>
  <div class="b2b-page-container">
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

    <!-- Grid Container Card with Common Vue Slot Component -->
    <div class="b2b-grid-card mb-4">
      <div class="b2b-grid-wrapper">
        <RealGridCommonVue
          ref="realgridComp"
          grid-id="realgrid-vue-page"
          :rows="pagedUsers"
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
          <template #toolbar-right>
            <PageSizeSelect v-model="pageSize" size="sm" />
          </template>

          <!-- Defining Data Fields dynamically inside slot (db.json 11필드 정합) -->
          <RGDataField fieldName="userId" dataType="text" />
          <RGDataField fieldName="name" dataType="text" />
          <RGDataField fieldName="dept" dataType="text" />
          <RGDataField fieldName="role" dataType="text" />
          <RGDataField fieldName="workStatus" dataType="text" />
          <RGDataField fieldName="employmentType" dataType="text" />
          <RGDataField fieldName="evalGrade" dataType="text" />
          <RGDataField fieldName="skillScore" dataType="number" />
          <RGDataField fieldName="region" dataType="text" />
          <RGDataField fieldName="salary" dataType="number" />
          <RGDataField fieldName="joinDate" dataType="datetime" datetimeFormat="yyyy-MM-dd" />

          <!-- Defining Visual Columns dynamically inside slot -->
          <RGDataColumn
            name="userId"
            fieldName="userId"
            width="120"
            :header="{ text: 'ID' }"
            :editable="false"
            :styles="{ textAlignment: 'center' }"
          />
          <RGDataColumn
            name="name"
            fieldName="name"
            width="110"
            :header="{ text: '성명' }"
            :styles="{ textAlignment: 'center' }"
          />
          <RGDataColumn
            name="dept"
            fieldName="dept"
            width="130"
            :header="{ text: '부서' }"
            :styles="{ textAlignment: 'near' }"
          />
          <RGDataColumn
            name="role"
            fieldName="role"
            width="110"
            :header="{ text: '직무/역할' }"
            :styles="{ textAlignment: 'near' }"
          />
          <RGDataColumn
            name="workStatus"
            fieldName="workStatus"
            width="100"
            :header="{ text: '근무상태 (선택)' }"
            :styles="{ textAlignment: 'center' }"
            :editor="{ type: 'dropdown', dropDownCount: 3, domainOnly: true, labels: ['재직', '휴직', '퇴사'], values: ['재직', '휴직', '퇴사'] }"
          />
          <RGDataColumn
            name="employmentType"
            fieldName="employmentType"
            width="110"
            :header="{ text: '고용형태 (선택)' }"
            :styles="{ textAlignment: 'center' }"
            :editor="{ type: 'dropdown', dropDownCount: 3, domainOnly: true, labels: ['정규직', '계약직', '파트타임'], values: ['정규직', '계약직', '파트타임'] }"
            :styleCallback="empTypeStyleCallback"
          />
          <RGDataColumn
            name="evalGrade"
            fieldName="evalGrade"
            width="80"
            :header="{ text: '평가등급 (선택)' }"
            :styles="{ textAlignment: 'center', fontWeight: 'bold' }"
            :editor="{ type: 'dropdown', dropDownCount: 5, domainOnly: true, labels: ['S', 'A', 'B', 'C', 'D'], values: ['S', 'A', 'B', 'C', 'D'] }"
            :renderer="evalGradeRenderer"
          />
          <RGDataColumn
            name="skillScore"
            fieldName="skillScore"
            width="130"
            :header="{ text: '역량 점수 (바)' }"
            :styles="{ textAlignment: 'far' }"
            :renderer="{ type: 'bar', minimum: 0, maximum: 100, showLabel: true }"
            :footer="{ expression: 'avg', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }"
          />
          <RGDataColumn
            name="region"
            fieldName="region"
            width="90"
            :header="{ text: '근무지역' }"
            :styles="{ textAlignment: 'center' }"
          />
          <RGDataColumn
            name="salary"
            fieldName="salary"
            width="110"
            :header="{ text: '급여 (만원)' }"
            numberFormat="#,##0"
            :styles="{ textAlignment: 'far' }"
            :styleCallback="salaryStyleCallback"
            :footer="{ expression: 'sum', numberFormat: '#,##0', styles: { textAlignment: 'far', fontWeight: 'bold' } }"
          />
          <RGDataColumn
            name="joinDate"
            fieldName="joinDate"
            width="115"
            :header="{ text: '입사일자 (달력)' }"
            datetimeFormat="yyyy-MM-dd"
            :styles="{ textAlignment: 'center' }"
            :editor="{ type: 'date', datetimeFormat: 'yyyy-MM-dd', commitBySelect: true }"
          />
        </RealGridCommonVue>
        <Pagination v-model:page="page" v-model:page-size="pageSize" :total="users.length" :show-size-select="false" />
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
import Pagination from '@/components/Pagination.vue'
import PageSizeSelect from '@/components/PageSizeSelect.vue'
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
    Pagination,
    PageSizeSelect,
    RGDataField,
    RGDataColumn
  },
  data() {
    return {
      searchResult: { count: 0, current: 0 },
      isColumnPickerOpen: false,
      columnPickerCols: [],
      users: [],
      page: 1,
      pageSize: 20
    }
  },
  watch: {
    // 행 번호가 페이지를 넘어 전체 기준(21, 22…)으로 이어지게 한다
    pageOffset(offset) {
      if (this.gridView) this.gridView.setRowIndicator({ indexOffset: offset })
    }
  },
  computed: {
    /** 현재 페이지 행만 그리드에 넘긴다. 페이지를 넘기면 그리드가 setRows 로 갈아끼우므로 편집 상태·체크는 사라진다 */
    pagedUsers() {
      return this.users.slice(this.pageOffset, this.pageOffset + this.pageSize)
    },
    pageOffset() {
      return (this.page - 1) * this.pageSize
    },
    evalGradeRenderer() {
      return {
        type: 'html',
        callback: function (grid, model) {
          const v = model && model.value ? String(model.value) : 'B'
          const map = { S: ['#dc3545', '#fff'], A: ['#0d6efd', '#fff'], B: ['#198754', '#fff'], C: ['#ffc107', '#212529'], D: ['#6c757d', '#fff'] }
          const c = map[v] || ['#6c757d', '#fff']
          return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:${c[0]};color:${c[1]};font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;line-height:1.5;">${v}</span></div>`
        }
      }
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    empTypeStyleCallback(grid, dataCell) {
      const v = dataCell.value
      if (v === '정규직') return 'rg-emp-regular'
      if (v === '계약직') return 'rg-emp-contract'
      if (v === '파트타임') return 'rg-emp-parttime'
      if (v === '인턴') return 'rg-emp-intern'
      if (v === '소속') return 'rg-emp-dept'
      return ''
    },

    salaryStyleCallback(grid, dataCell) {
      const val = Number(dataCell.value)
      if (val >= 7000) return 'rg-salary-high'
      return ''
    },
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
        `• 추가 (Created - C): ${changes.created.length}건\n` +
        `• 수정 (Updated - U): ${changes.updated.length}건\n` +
        `• 삭제 (Deleted - D): ${changes.deleted.length}건`
      )

      this.dataProvider.clearRowStates()
    },

    /**
     * 페이징 중이라 그리드엔 현재 페이지 행만 있다. 다른 페이지 행을 앞뒤에 잠시 끼워 전체를 내보내고 다시 뺀다.
     * 현재 페이지 행은 건드리지 않고, 끼우고 빼는 동안 행 상태 기록을 꺼서(checkRowStates)
     * 편집 중인 추가/수정/삭제 상태와 체크가 그대로 남는다.
     */
    exportExcel() {
      const gv = this.gridView
      const dp = this.dataProvider
      if (!gv) return
      gv.commit(true)

      const start = this.pageOffset // 현재 페이지 첫 행의 전체 기준 위치
      const addedCnt = dp.getStateRows('created').length + dp.getStateRows('createAndDeleted').length
      const pageCnt = dp.getRowCount() - addedCnt // 원본(users) 중 현재 페이지에 있는 행 수
      const head = this.users.slice(0, start)
      const tail = this.users.slice(start + pageCnt)

      dp.checkRowStates(false) // 끼운 행이 '추가'로, 뺀 행이 '삭제'로 남지 않게
      dp.insertRows(0, head)
      dp.addRows(tail)
      gv.setRowIndicator({ indexOffset: 0 })

      const restore = () => {
        const n = dp.getRowCount()
        dp.removeRows([...head.keys(), ...tail.map((_, i) => n - tail.length + i)])
        dp.checkRowStates(true)
        gv.setRowIndicator({ indexOffset: start })
      }
      try {
        gv.exportGrid({
          type: 'excel',
          target: 'local',
          fileName: 'RealGrid_Vue_List.xlsx',
          showProgress: true,
          done: restore // 엑셀 파일 생성이 끝난 뒤 호출된다
        })
      } catch (e) {
        restore()
        throw e
      }
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

