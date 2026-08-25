<template>
  <div class="b2b-page-container">
    <!-- Toolbar -->
    <div class="b2b-toolbar">
      <div class="d-flex align-items-center justify-content-between w-100">
        <div class="d-flex align-items-center gap-2">
          <QuickSearchBar
            :searchResult="searchResult"
            @search="onTreeSearch"
            @clear="searchResult = { count: 0, current: 0 }"
          />
        </div>
        <div class="d-flex align-items-center gap-2 ms-auto">
          <button class="btn-b2b-action" title="엑셀 파일 내보내기" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
            <span>엑셀</span>
          </button>
          <span class="vr mx-1"></span>
          <!-- 순서 이동 (위로/아래로) -->
          <button class="btn-b2b-action" title="선택한 노드를 위로 이동" @click="moveNodeUp">
            <i class="bi bi-arrow-up text-primary me-0.5"></i>
            <span>위로</span>
          </button>
          <button class="btn-b2b-action" title="선택한 노드를 아래로 이동" @click="moveNodeDown">
            <i class="bi bi-arrow-down text-primary me-0.5"></i>
            <span>아래로</span>
          </button>
          <span class="vr mx-1"></span>
          <!-- CUD (트리 계층 전용) -->
          <button class="btn-b2b-action" title="새 노드 추가" @click="addChild">
            <i class="bi bi-plus-lg text-success me-0.5"></i>
            <span>추가</span>
          </button>
          <button class="btn-b2b-action" title="선택(포커스) 또는 체크박스로 선택된 노드 삭제 (하위 포함)" @click="removeNode">
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

    <!-- Tree Grid -->
    <div class="b2b-grid-card mb-4">
      <div class="b2b-grid-wrapper">
        <RealGridTreeJs
          ref="treeComp"
          grid-id="realgrid-tree-page"
          :fields="fields"
          :columns="columns"
          :rows="rows"
          children-field="children"
          :draggable="enableDnd"
          :auto-expand-all="true"
          :show-row-number="true"
          :state-bar-visible="true"
          :checkable="true"
          :hide-deleted-rows="false"
          :state-bar-width="20"
          :check-bar-width="36"
          :toast="treeToast"
          @init="onGridInit"
          @node-moved="onNodeMoved"
          @parent-changed="onParentChanged"
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
import RealGridTreeJs from '@/components/RealGridTreeJs.vue'
import QuickSearchBar from '@/components/QuickSearchBar.vue'
import SavedViewsBar from '@/components/SavedViewsBar.vue'
import ColumnPickerModal from '@/components/ColumnPickerModal.vue'
import { showToast } from '@/utils/toastUtil.js'

function buildDeptTreeFromUsers(users) {
  if (!Array.isArray(users) || users.length === 0) return []

  const deptMap = new Map()
  users.forEach((user) => {
    const deptName = user.dept || '미지정'
    if (!deptMap.has(deptName)) {
      deptMap.set(deptName, [])
    }
    deptMap.get(deptName).push(user)
  })

  const treeRows = []
  let deptIdx = 1

  deptMap.forEach((userList, deptName) => {
    const deptCode = `DEPT-0${deptIdx++}`
    const headcount = userList.length
    const pmUser = userList.find(u => u.role === 'PM' || u.role === 'Manager') || userList[0]
    const managerName = pmUser ? `${pmUser.name} (${pmUser.role})` : '미정'

    const children = userList.map((u) => ({
      deptName: u.name,
      deptCode: u.userId,
      manager: u.name,
      rank: u.role,
      workStatus: u.workStatus || '재직',
      employmentType: u.employmentType || '정규직',
      evalGrade: u.evalGrade || 'B',
      skillScore: Number(u.skillScore) || 75,
      headcount: 1,
      region: u.region || '서울',
      salary: u.salary,
      joinDate: u.joinDate,
      children: []
    }))

    treeRows.push({
      deptName: deptName,
      deptCode: deptCode,
      manager: managerName,
      rank: '부서',
      workStatus: '조직',
      employmentType: '소속',
      evalGrade: 'A',
      skillScore: null,
      headcount: headcount,
      region: '본사',
      salary: null,
      joinDate: '2020-01-01',
      children: children
    })
  })

  return treeRows
}

export default {
  name: 'RealGridTreePage',
  components: {
    RealGridTreeJs,
    QuickSearchBar,
    SavedViewsBar,
    ColumnPickerModal
  },
  data() {
    return {
      gridView: null,
      dataProvider: null,
      enableDnd: true,
      searchResult: { count: 0, current: 0 },
      isColumnPickerOpen: false,
      columnPickerCols: [],

      fields: [
        { fieldName: 'deptCode', dataType: 'text' },
        { fieldName: 'deptName', dataType: 'text' },
        { fieldName: 'manager', dataType: 'text' },
        { fieldName: 'rank', dataType: 'text' },
        { fieldName: 'workStatus', dataType: 'text' },
        { fieldName: 'employmentType', dataType: 'text' },
        { fieldName: 'evalGrade', dataType: 'text' },
        { fieldName: 'skillScore', dataType: 'number' },
        { fieldName: 'headcount', dataType: 'number' },
        { fieldName: 'region', dataType: 'text' },
        { fieldName: 'salary', dataType: 'number' },
        { fieldName: 'joinDate', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd' }
      ],
      columns: [
        { name: 'deptName', fieldName: 'deptName', width: '200', header: { text: '조직명 / 성명' }, styles: { textAlignment: 'near' } },
        { name: 'deptCode', fieldName: 'deptCode', width: '110', header: { text: '코드 / ID' }, editable: false, styles: { textAlignment: 'center' } },
        { name: 'manager', fieldName: 'manager', width: '120', header: { text: '책임자' }, styles: { textAlignment: 'center' } },
        { name: 'rank', fieldName: 'rank', width: '90', header: { text: '직무 / 구분' }, styles: { textAlignment: 'center' } },
        {
          name: 'workStatus',
          fieldName: 'workStatus',
          width: '95',
          header: { text: '근무상태' },
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
          width: '100',
          header: { text: '고용형태' },
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
          width: '75',
          header: { text: '평가 (선택)' },
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
          width: '120',
          header: { text: '역량점수 (바)' },
          styles: { textAlignment: 'far' },
          renderer: {
            type: 'bar',
            minimum: 0,
            maximum: 100,
            showLabel: true
          }
        },
        { name: 'headcount', fieldName: 'headcount', width: '65', header: { text: '인원' }, numberFormat: '#,##0', styles: { textAlignment: 'far' } },
        { name: 'region', fieldName: 'region', width: '80', header: { text: '근무지' }, styles: { textAlignment: 'center' } },
        {
          name: 'salary',
          fieldName: 'salary',
          width: '100',
          header: { text: '연봉(만원)' },
          numberFormat: '#,##0',
          styles: { textAlignment: 'far' },
          styleCallback: function (grid, dataCell) {
            const val = Number(dataCell.value)
            if (val >= 7000) return 'rg-salary-high'
            return ''
          }
        },
        {
          name: 'joinDate',
          fieldName: 'joinDate',
          width: '115',
          header: { text: '입사/설립일자 (달력)' },
          datetimeFormat: 'yyyy-MM-dd',
          styles: { textAlignment: 'center' },
          editor: {
            type: 'date',
            datetimeFormat: 'yyyy-MM-dd',
            commitBySelect: true
          }
        }
      ],
      rows: []
    }
  },
  computed: {
    nodeCount() {
      return this.countNodes(this.rows)
    }
  },
  async created() {
    await this.fetchUsersAndBuildTree()
  },
  methods: {
    async fetchUsersAndBuildTree() {
      const defaultUsers = [
        { userId: 'minjun.park', name: '박민준', dept: '경영지원', role: 'Security', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 88, region: '서울', salary: 5240, joinDate: '2019-04-12' },
        { userId: 'suhyun.lee', name: '이수현', dept: '경영지원', role: 'PM', workStatus: '재직', employmentType: '정규직', evalGrade: 'S', skillScore: 95, region: '대전', salary: 9520, joinDate: '2024-01-15' },
        { userId: 'minjun.han', name: '한민준', dept: '디자인팀', role: 'DevOps', workStatus: '휴직', employmentType: '계약직', evalGrade: 'B', skillScore: 72, region: '광주', salary: 8900, joinDate: '2021-08-20' },
        { userId: 'jihoon.kim', name: '김지훈', dept: '플랫폼개발팀', role: 'PM', workStatus: '재직', employmentType: '정규직', evalGrade: 'A', skillScore: 84, region: '서울', salary: 7200, joinDate: '2020-03-09' },
        { userId: 'seoyeon.kim', name: '김서연', dept: '플랫폼개발팀', role: 'Backend', workStatus: '재직', employmentType: '정규직', evalGrade: 'B', skillScore: 78, region: '서울', salary: 5400, joinDate: '2019-07-01' }
      ]
      try {
        const url = (import.meta.env?.BASE_URL ?? '/') + 'db.json'
        const res = await fetch(url)
        if (!res.ok) throw new Error('db.json fetch failed')
        const data = await res.json()
        const users = Array.isArray(data) ? data : data.users || []
        const userList = users.length > 0 ? users : defaultUsers
        this.rows = buildDeptTreeFromUsers(userList)
      } catch (error) {
        console.warn('[RealGridTreePage] Using fallback mock users for tree:', error)
        this.rows = buildDeptTreeFromUsers(defaultUsers)
      }
    },

    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider
    },

    treeToast(message, opts = {}) {
      showToast(message, opts)
    },

    countNodes(rows) {
      if (!Array.isArray(rows)) return 0
      let n = 0
      for (const r of rows) {
        n += 1
        if (r.children && r.children.length) n += this.countNodes(r.children)
      }
      return n
    },

    makeNewNodeValues() {
      const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
      return {
        deptCode: 'NEW-' + rnd,
        deptName: '신규 부서/노드',
        manager: '',
        rank: '팀원',
        workStatus: '재직',
        employmentType: '정규직',
        evalGrade: 'B',
        skillScore: 75,
        headcount: 1,
        region: '서울',
        salary: 4500,
        joinDate: new Date().toISOString().slice(0, 10)
      }
    },

    addChild() {
      const comp = this.$refs.treeComp
      if (!comp) return
      const current = comp.getCurrentNode()
      const values = this.makeNewNodeValues()

      let newRow
      if (!current) {
        newRow = comp.addRootRow(values)
        showToast('선택된 노드가 없어 최상위(루트)에 추가했습니다.', { type: 'info' })
      } else {
        newRow = comp.addChildToCurrent(values, { editColumn: 'deptName' })
      }

      if (newRow >= 0) {
        const label = current ? current.deptName : '최상위'
        showToast(`'${label}' 하위에 새 노드를 추가했습니다. (저장 시 반영)`, { type: 'success' })
      } else {
        showToast('노드 추가에 실패했습니다.', { type: 'danger' })
      }
    },

    removeNode() {
      const comp = this.$refs.treeComp
      if (!comp || !comp.dataProvider) return

      const checkedRows = comp.getCheckedRows ? comp.getCheckedRows() : []
      const focusedRow = comp.getCurrentDataRow ? comp.getCurrentDataRow() : -1

      const targetRowsSet = new Set(checkedRows)
      if (focusedRow >= 0) {
        targetRowsSet.add(focusedRow)
      }

      const provider = comp.dataProvider
      const activeRowsToDelete = Array.from(targetRowsSet).filter(r => {
        try {
          return provider.getRowState(r) !== 'deleted'
        } catch (e) {
          return true
        }
      })

      if (activeRowsToDelete.length === 0) {
        showToast('삭제할 노드를 클릭하거나 체크박스로 선택해 주세요.', { type: 'warning' })
        return
      }

      provider.removeRows(activeRowsToDelete, true)
      if (comp.gridView && comp.gridView.clearCheckedItems) {
        comp.gridView.clearCheckedItems()
      }

      showToast(`선택/체크된 ${activeRowsToDelete.length}건의 노드가 삭제 표시되었습니다. (하위 포함)`, { type: 'warning' })
    },

    moveNodeUp() {
      const ok = this.$refs.treeComp?.moveCurrentUp()
      if (ok) {
        showToast('선택한 노드를 위로 이동했습니다.', { type: 'info' })
      } else {
        showToast('노드를 더 이상 위로 이동할 수 없거나 노드가 선택되지 않았습니다.', { type: 'warning' })
      }
    },

    moveNodeDown() {
      const ok = this.$refs.treeComp?.moveCurrentDown()
      if (ok) {
        showToast('선택한 노드를 아래로 이동했습니다.', { type: 'info' })
      } else {
        showToast('노드를 더 이상 아래로 이동할 수 없거나 노드가 선택되지 않았습니다.', { type: 'warning' })
      }
    },

    onNodeMoved({ row, offset }) {
      showToast('드래그 앤 드롭: 노드 순서가 변경되었습니다.', { type: 'info' })
    },

    onParentChanged({ row, parent, index }) {
      showToast('드래그 앤 드롭: 노드의 계층(부모)이 변경되었습니다.', { type: 'success' })
    },

    expandAll() {
      this.$refs.treeComp?.expandAll()
      showToast('모든 노드가 펼쳐졌습니다.', { type: 'info' })
    },

    collapseAll() {
      this.$refs.treeComp?.collapseAll()
      showToast('모든 노드가 접혔습니다.', { type: 'info' })
    },

    exportExcel() {
      this.$refs.treeComp?.exportToExcel('RealGrid_Org_Tree.xlsx')
    },

    openColumnPicker() {
      if (this.$refs.treeComp) {
        this.columnPickerCols = this.$refs.treeComp.getColumnsInfo()
        this.isColumnPickerOpen = true
      }
    },

    onToggleColumn({ name, visible }) {
      if (this.$refs.treeComp) {
        this.$refs.treeComp.setColumnVisible(name, visible)
      }
    },

    saveData() {
      this.$refs.treeComp?.commit()
      const changes = this.$refs.treeComp?.getChanges()
      const total = (changes?.created.length || 0) + (changes?.updated.length || 0)
        + (changes?.deleted.length || 0) + (changes?.moved.length || 0)
      if (total === 0) {
        showToast('변경사항이 없습니다.', { type: 'warning' })
        return
      }
      console.log('서버 전송 C, U, D, M(이동) 데이터:', changes)
      showToast(
        `저장 성공! (C:${changes.created.length} / U:${changes.updated.length} / D:${changes.deleted.length} / M:${changes.moved.length})`,
        { type: 'success' }
      )
      this.$refs.treeComp?.clearRowStates()
    },

    onTreeSearch({ query, direction }) {
      if (this.$refs.treeComp) {
        this.searchResult = this.$refs.treeComp.searchGrid(query, direction)
      }
    }
  }
}
</script>

<style scoped>
</style>

<style>
/* RealGrid 동적 셀 스타일 (styleCallback 전용) */
.rg-emp-regular { color: var(--b2b-color-primary) !important; }
.rg-emp-contract { color: #ea580c !important; }
.rg-emp-parttime { color: #7c3aed !important; }
.rg-emp-intern { color: #0891b2 !important; }
.rg-emp-dept { color: var(--b2b-color-text-muted) !important; }
.rg-salary-high { color: #dc2626 !important; }
</style>

