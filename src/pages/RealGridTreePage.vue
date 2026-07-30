<template>
  <div class="b2b-page-container">
    <!-- Header -->
    <div class="mb-3">
      <h4 class="fw-bold text-dark m-0">RealGrid 트리 (계층형 그리드)</h4>
      <p class="text-muted small mb-0">TreeView + LocalTreeDataProvider 기반 계층형 조직도 관리. 우클릭 메뉴 및 마우스 드래그 앤 드롭을 통한 노드 변경을 지원합니다.</p>
    </div>

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
        <div class="d-flex align-items-center gap-1.5 ms-auto">
          <!-- 데이터 유틸: 컬럼 피커 / 엑셀 -->
          <button class="btn-b2b-action" title="컬럼 숨김/표시 설정" @click="openColumnPicker">
            <i class="bi bi-eye text-primary me-0.5"></i>
            <span>컬럼</span>
          </button>
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
          <button class="btn-b2b-primary ms-1" title="변경사항 저장" @click="saveData">
            <i class="bi bi-check2 me-0.5"></i>
            <span>저장</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 요약 badge -->
    <div class="d-flex align-items-center gap-2 mb-2">
      <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
        부서 조직도
      </span>
      <span class="text-muted small">총 {{ nodeCount }}개 노드</span>
      <span class="text-muted small ms-2">
        <i class="bi bi-info-circle me-1"></i>맨 왼쪽 <b>[행번호]</b> 영역을 마우스로 드래그하면 노드 순서 및 상위 부모 변경 가능 · 툴바 <b>[위로/아래로]</b> 버튼 · <b>우클릭</b> 메뉴
      </span>
    </div>

    <!-- Tree Grid -->
    <div class="b2b-grid-card mb-4">
      <div class="b2b-grid-wrapper">
        <RealGridTreeJs
          ref="treeComp"
          :fields="fields"
          :columns="columns"
          :rows="rows"
          childrenField="children"
          :enableDragAndDrop="enableDnd"
          :expandAllOnLoad="true"
          :hideDeletedRows="false"
          :toast="treeToast"
          @node-moved="onNodeMoved"
          @parent-changed="onParentChanged"
        />
      </div>
    </div>

    <!-- Column Picker Modal (피벗 A와 동일 공통 컴포넌트) -->
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
import ColumnPickerModal from '@/components/ColumnPickerModal.vue'
import { showToast } from '@/utils/toastUtil.js'
import { departmentTree } from '@/data/treeData.js'

export default {
  name: 'RealGridTreePage',
  components: {
    RealGridTreeJs,
    QuickSearchBar,
    ColumnPickerModal
  },
  data() {
    return {
      enableDnd: true,
      searchResult: { count: 0, current: 0 },
      isColumnPickerOpen: false,
      columnPickerCols: [],

      // 부서 조직도 데이터
      fields: [
        { fieldName: 'deptCode', dataType: 'text' },
        { fieldName: 'deptName', dataType: 'text' },
        { fieldName: 'manager', dataType: 'text' },
        { fieldName: 'rank', dataType: 'text' },
        { fieldName: 'headcount', dataType: 'number' },
        { fieldName: 'status', dataType: 'text' }
      ],
      columns: [
        { name: 'deptName', fieldName: 'deptName', width: '280', header: { text: '조직명' }, styles: { textAlignment: 'near' } },
        { name: 'deptCode', fieldName: 'deptCode', width: '110', header: { text: '조직코드' }, editable: false, styles: { textAlignment: 'center' } },
        { name: 'manager', fieldName: 'manager', width: '110', header: { text: '책임자' }, styles: { textAlignment: 'center' } },
        { name: 'rank', fieldName: 'rank', width: '100', header: { text: '직책' }, styles: { textAlignment: 'center' } },
        { name: 'headcount', fieldName: 'headcount', width: '90', header: { text: '인원' }, numberFormat: '#,##0', styles: { textAlignment: 'far' } },
        { name: 'status', fieldName: 'status', width: '110', header: { text: '상태' }, styles: { textAlignment: 'center' } }
      ],
      rows: departmentTree
    }
  },
  computed: {
    nodeCount() {
      return this.countNodes(this.rows)
    }
  },
  methods: {
    // 트리(자기완결 컴포넌트)의 내부 알림을 이 프로젝트 토스트로 연결
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
        deptName: '신규 부서',
        manager: '',
        rank: '팀장',
        headcount: 0,
        status: '신설'
      }
    },

    addChild() {
      const comp = this.$refs.treeComp
      if (!comp) return
      const values = this.makeNewNodeValues()
      const newRow = comp.addChildToCurrent(values, { editColumn: 'deptName' })
      if (newRow >= 0) {
        showToast('하위 자식 노드로 새 부서가 추가되었습니다.', { type: 'success' })
      } else {
        const rootRow = comp.addRootRow(values)
        if (rootRow >= 0) {
          showToast('최상위(루트)에 새 부서가 추가되었습니다.', { type: 'success' })
        }
      }
    },

    addSibling() {
      const comp = this.$refs.treeComp
      if (!comp) return
      const editCol = this.dataset === 'dept' ? 'deptName' : 'menuName'
      const values = this.makeNewNodeValues()
      const newRow = comp.addSiblingToCurrent(values, { editColumn: editCol })
      if (newRow >= 0) {
        showToast('동일한 계층(형제 노드)으로 새 행을 추가했습니다.', { type: 'success' })
      }
    },

    duplicateNode() {
      const comp = this.$refs.treeComp
      if (!comp) return
      const current = comp.getCurrentNode()
      if (!current) {
        showToast('복제할 노드를 먼저 선택해 주세요.', { type: 'warning' })
        return
      }
      const label = this.dataset === 'dept' ? current.deptName : current.menuName
      const newRow = comp.duplicateCurrentNode()
      if (newRow >= 0) {
        showToast(`'${label}' 노드를 성공적으로 복제했습니다.`, { type: 'success' })
      } else {
        showToast('노드 복제에 실패했습니다.', { type: 'danger' })
      }
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

    // 새 노드 기본값 생성 (데이터셋별)
    makeNewNodeValues() {
      const rnd = Math.random().toString(36).substring(2, 6).toUpperCase()
      if (this.dataset === 'dept') {
        return {
          deptCode: 'NEW-' + rnd,
          deptName: '신규 부서',
          manager: '',
          rank: '팀',
          headcount: 0,
          status: '신설'
        }
      }
      return {
        menuName: '신규 메뉴',
        path: '/new-' + rnd.toLowerCase(),
        icon: 'bi-dot',
        cache: 'N',
        visible: '표시'
      }
    },

    addChild() {
      const comp = this.$refs.treeComp
      if (!comp) return
      const current = comp.getCurrentNode()
      const editCol = this.dataset === 'dept' ? 'deptName' : 'menuName'
      const values = this.makeNewNodeValues()

      let newRow
      if (!current) {
        // 선택 노드가 없으면 루트에 추가
        newRow = comp.addRootRow(values)
        showToast('선택된 노드가 없어 루트에 추가했습니다.', { type: 'info' })
      } else {
        newRow = comp.addChildToCurrent(values, { editColumn: editCol })
      }

      if (newRow >= 0) {
        const label = this.dataset === 'dept' ? current?.deptName : current?.menuName
        if (current) {
          showToast(`'${label}' 하위에 새 노드를 추가했습니다. (편집 후 저장)`, { type: 'success' })
        }
      } else {
        showToast('노드 추가에 실패했습니다.', { type: 'danger' })
      }
    },

    removeNode() {
      const comp = this.$refs.treeComp
      if (!comp || !comp.dataProvider) return

      // 1. 체크박스 선택 목록과 셀 클릭(포커스) 노드를 모두 합침
      const checkedRows = comp.getCheckedRows ? comp.getCheckedRows() : []
      const focusedRow = comp.getCurrentDataRow ? comp.getCurrentDataRow() : -1

      const targetRowsSet = new Set(checkedRows)
      if (focusedRow >= 0) {
        targetRowsSet.add(focusedRow)
      }

      // 2. 이미 소프트 삭제된 행은 재삭제 대상에서 제외
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

      // 3. 일괄 삭제 실행 (하위 포함, recursive=true)
      provider.removeRows(activeRowsToDelete, true)
      if (comp.gridView && comp.gridView.clearCheckedItems) {
        comp.gridView.clearCheckedItems()
      }

      // 4. 알림 토스트 출력
      if (activeRowsToDelete.length === 1 && focusedRow >= 0 && activeRowsToDelete.includes(focusedRow)) {
        const current = comp.getCurrentNode()
        const label = current ? (current.deptName || current.name || '선택 노드') : '선택 노드'
        showToast(`'${label}' 노드가 삭제 표시되었습니다. (저장 시 반영)`, { type: 'warning' })
      } else {
        showToast(`선택/체크된 ${activeRowsToDelete.length}건의 노드가 삭제 표시되었습니다. (하위 포함)`, { type: 'warning' })
      }
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

    // 컬럼 숨김/표시 (피벗 A와 동일 — 공통 mixin getColumnsInfo/setColumnVisible)
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
      this.$refs.treeComp?.commit() // 편집 중인 셀 확정
      const changes = this.$refs.treeComp?.getChanges()
      const total = (changes?.created.length || 0) + (changes?.updated.length || 0) + (changes?.deleted.length || 0)
      if (total === 0) {
        showToast('변경사항이 없습니다.', { type: 'warning' })
        return
      }
      console.log('서버 전송 C, U, D 데이터:', changes)
      showToast(`저장 성공! (C:${changes.created.length} / U:${changes.updated.length} / D:${changes.deleted.length})`, { type: 'success' })
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
