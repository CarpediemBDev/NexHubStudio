<template>
  <div class="b2b-page-container">
    <!-- Header -->
    <div class="mb-3">
      <h4 class="fw-bold text-dark m-0">RealGrid 트리 (계층형 그리드)</h4>
      <p class="text-muted small mb-0">TreeView + LocalTreeDataProvider 기반 계층형 트리. 실제 업무 데이터(부서 조직도 / 메뉴 구조)로 구성됩니다.</p>
    </div>

    <!-- Toolbar -->
    <div class="b2b-toolbar">
      <div class="d-flex align-items-center justify-content-between w-100">
        <div class="d-flex align-items-center gap-2">
          <!-- 데이터셋 토글 -->
          <div class="btn-group btn-group-sm" role="group" aria-label="트리 데이터셋 선택">
            <button
              type="button"
              class="btn"
              :class="dataset === 'dept' ? 'btn-primary' : 'btn-outline-primary'"
              @click="switchDataset('dept')"
            >
              <i class="bi bi-diagram-3 me-1"></i>부서 조직도
            </button>
            <button
              type="button"
              class="btn"
              :class="dataset === 'menu' ? 'btn-primary' : 'btn-outline-primary'"
              @click="switchDataset('menu')"
            >
              <i class="bi bi-list-nested me-1"></i>메뉴 구조
            </button>
          </div>
          <QuickSearchBar
            :searchResult="searchResult"
            @search="onTreeSearch"
            @clear="searchResult = { count: 0, current: 0 }"
          />
        </div>
        <div class="d-flex align-items-center gap-1.5 ms-auto">
          <!-- 데이터 유틸: 컬럼 피커 / 엑셀 (피벗 A와 동일 위치·패턴) -->
          <button class="btn-b2b-action" title="컬럼 숨김/표시 설정" @click="openColumnPicker">
            <i class="bi bi-eye text-primary me-0.5"></i>
            <span>컬럼</span>
          </button>
          <button class="btn-b2b-action" title="엑셀 파일 내보내기" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-0.5"></i>
            <span>엑셀</span>
          </button>
          <span class="vr mx-1"></span>
          <!-- CUD (트리 계층 전용) -->
          <button class="btn-b2b-action" title="선택 노드의 자식 추가" @click="addChild">
            <i class="bi bi-node-plus text-success me-0.5"></i>
            <span>자식 추가</span>
          </button>
          <button class="btn-b2b-action" title="현재 선택 노드 삭제 (하위 포함)" @click="removeNode">
            <i class="bi bi-node-minus text-danger me-0.5"></i>
            <span>노드 삭제</span>
          </button>
          <button class="btn-b2b-action" title="체크박스로 선택한 노드 일괄 삭제 (하위 포함)" @click="deleteCheckedNodes">
            <i class="bi bi-check2-square text-danger me-0.5"></i>
            <span>선택 삭제</span>
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
        {{ dataset === 'dept' ? '부서 조직도' : '메뉴 구조 (라우터 실데이터)' }}
      </span>
      <span class="text-muted small">총 {{ nodeCount }}개 노드</span>
      <span class="text-muted small ms-2">
        <i class="bi bi-info-circle me-1"></i>셀 더블클릭 편집 · 노드 선택 후 [자식 추가]/[노드 삭제] · <b>우클릭</b>으로 펼치기/접기·행열 고정
      </span>
    </div>

    <!-- Tree Grid -->
    <div class="b2b-grid-card mb-4">
      <div class="b2b-grid-wrapper">
        <RealGridTreeJs
          ref="treeComp"
          :fields="activeFields"
          :columns="activeColumns"
          :rows="activeRows"
          childrenField="children"
          :expandAllOnLoad="true"
          :hideDeletedRows="false"
          @init="onTreeInit"
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
import { departmentTree, routesToMenuTree } from '@/data/treeData.js'

export default {
  name: 'RealGridTreePage',
  components: {
    RealGridTreeJs,
    QuickSearchBar,
    ColumnPickerModal
  },
  data() {
    return {
      dataset: 'dept', // 'dept' | 'menu'
      searchResult: { count: 0, current: 0 },
      isColumnPickerOpen: false,
      columnPickerCols: [],

      // ---- 부서 조직도 ----
      deptFields: [
        { fieldName: 'deptCode', dataType: 'text' },
        { fieldName: 'deptName', dataType: 'text' },
        { fieldName: 'manager', dataType: 'text' },
        { fieldName: 'rank', dataType: 'text' },
        { fieldName: 'headcount', dataType: 'number' },
        { fieldName: 'status', dataType: 'text' }
      ],
      deptColumns: [
        { name: 'deptName', fieldName: 'deptName', width: '280', header: { text: '조직명' }, styles: { textAlignment: 'near' } },
        { name: 'deptCode', fieldName: 'deptCode', width: '110', header: { text: '조직코드' }, editable: false, styles: { textAlignment: 'center' } },
        { name: 'manager', fieldName: 'manager', width: '110', header: { text: '책임자' }, styles: { textAlignment: 'center' } },
        { name: 'rank', fieldName: 'rank', width: '100', header: { text: '직책' }, styles: { textAlignment: 'center' } },
        { name: 'headcount', fieldName: 'headcount', width: '90', header: { text: '인원' }, numberFormat: '#,##0', styles: { textAlignment: 'far' } },
        { name: 'status', fieldName: 'status', width: '110', header: { text: '상태' }, styles: { textAlignment: 'center' } }
      ],
      deptRows: departmentTree,

      // ---- 메뉴 구조 ----
      menuFields: [
        { fieldName: 'menuName', dataType: 'text' },
        { fieldName: 'path', dataType: 'text' },
        { fieldName: 'icon', dataType: 'text' },
        { fieldName: 'cache', dataType: 'text' },
        { fieldName: 'visible', dataType: 'text' }
      ],
      menuColumns: [
        { name: 'menuName', fieldName: 'menuName', width: '280', header: { text: '메뉴명' }, styles: { textAlignment: 'near' } },
        { name: 'path', fieldName: 'path', width: '240', header: { text: '경로 (Path)' }, styles: { textAlignment: 'near' } },
        { name: 'icon', fieldName: 'icon', width: '160', header: { text: '아이콘' }, styles: { textAlignment: 'near' } },
        { name: 'cache', fieldName: 'cache', width: '90', header: { text: 'KeepAlive' }, styles: { textAlignment: 'center' } },
        { name: 'visible', fieldName: 'visible', width: '90', header: { text: '표시' }, styles: { textAlignment: 'center' } }
      ],
      menuRows: []
    }
  },
  computed: {
    activeFields() {
      return this.dataset === 'dept' ? this.deptFields : this.menuFields
    },
    activeColumns() {
      return this.dataset === 'dept' ? this.deptColumns : this.menuColumns
    },
    activeRows() {
      return this.dataset === 'dept' ? this.deptRows : this.menuRows
    },
    nodeCount() {
      return this.countNodes(this.activeRows)
    }
  },
  created() {
    // 라우터 실제 설정에서 메뉴 트리 추출
    this.menuRows = routesToMenuTree(this.$router.options.routes)
  },
  methods: {
    countNodes(rows) {
      if (!Array.isArray(rows)) return 0
      let n = 0
      for (const r of rows) {
        n += 1
        if (r.children && r.children.length) n += this.countNodes(r.children)
      }
      return n
    },

    switchDataset(ds) {
      if (this.dataset === ds) return
      this.dataset = ds
      this.searchResult = { count: 0, current: 0 }
    },

    onTreeInit({ gridView }) {
      // 피벗 A와 동일한 우클릭 컨텍스트 메뉴 패턴 (그룹화 항목은 트리 미지원이라 제외)
      gridView.setContextMenu([
        { label: '📌 선택한 열까지 고정', tag: 'fixColumn' },
        { label: '📌 선택한 행까지 고정', tag: 'fixRow' },
        { label: '📌 선택한 행/열 모두 고정', tag: 'fixBoth' },
        { label: '❌ 고정 해제 (초기화)', tag: 'clearFixing' },
        { label: '-' },
        { label: '➕ 모든 노드 펼치기', tag: 'expandAll' },
        { label: '➖ 모든 노드 접기', tag: 'collapseAll' }
      ])
      gridView.onContextMenuItemClicked = (grid, item, clickData) => {
        // 공통 컴포넌트 동적 행/열 고정 헬퍼 먼저 처리
        if (this.$refs.treeComp && this.$refs.treeComp.handleDynamicFixing(item, clickData)) {
          return
        }
        if (item.tag === 'expandAll') {
          this.expandAll()
        } else if (item.tag === 'collapseAll') {
          this.collapseAll()
        }
      }
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
      if (!comp) return
      const current = comp.getCurrentNode()
      if (!current) {
        showToast('삭제할 노드를 먼저 선택하세요.', { type: 'warning' })
        return
      }
      const label = this.dataset === 'dept' ? current.deptName : current.menuName
      const childCount = comp.getChildren(comp.getCurrentItemIndex())?.length || 0

      const msg = childCount > 0
        ? `'${label}' 및 하위 ${childCount}개 노드를 삭제 표시합니다. 계속할까요?`
        : `'${label}' 노드를 삭제 표시합니다. 계속할까요?`
      if (!window.confirm(msg)) return

      const ok = comp.removeCurrent(true)
      if (ok) {
        showToast(`'${label}' 노드를 삭제 표시했습니다. (저장 시 반영)`, { type: 'warning' })
      } else {
        showToast('노드 삭제에 실패했습니다.', { type: 'danger' })
      }
    },

    // 체크박스 다중선택 삭제 (피벗 A deleteChecked 와 동일 패턴, 공통 mixin)
    deleteCheckedNodes() {
      const count = this.$refs.treeComp ? this.$refs.treeComp.deleteChecked() : 0
      if (count === 0) {
        showToast('삭제할 노드를 왼쪽 체크박스로 선택해 주세요.', { type: 'warning' })
        return
      }
      showToast(`${count}건이 삭제 표시되었습니다 (하위 포함, State: Deleted).`, { type: 'warning' })
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
      const name = this.dataset === 'dept' ? 'RealGrid_Org_Tree.xlsx' : 'RealGrid_Menu_Tree.xlsx'
      this.$refs.treeComp?.exportToExcel(name)
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
