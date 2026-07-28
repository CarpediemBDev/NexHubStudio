<template>
  <div class="realgrid-tree-wrapper w-100">
    <div ref="treeElement" class="w-100" :style="{ height: height }"></div>
  </div>
</template>

<script>
import * as RealGrid from 'realgrid'
import 'realgrid/dist/realgrid-white.css'
import { markRaw } from 'vue'
import realgridCommon from '@/mixins/realgridCommon.js'
import { useTabStore } from '@/stores/tabStore.js'

/**
 * RealGrid 트리 그리드 공통 컴포넌트 (계층형)
 * =========================================================
 * TreeView + LocalTreeDataProvider 를 사용하는 계층형 그리드.
 * 일반 그리드(RealGridCommonJs)와 공통 로직(테마/제어열/엑셀/검색/변경추적)은
 * realgridCommon 믹스인을 통해 공유한다.
 *
 * 데이터 모델: 중첩(children) 방식
 *  rows = [
 *    { code: '1000', name: '경영지원본부', children: [
 *        { code: '1100', name: '인사팀' },
 *        { code: '1200', name: '총무팀', children: [ ... ] }
 *    ]}
 *  ]
 */
export default {
  name: 'RealGridTreeJs',
  mixins: [realgridCommon],
  props: {
    fields: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    rows: { type: Array, default: () => [] },
    height: { type: String, default: '580px' },
    // 트리 계층 매핑용 필드
    childrenField: { type: String, default: 'children' }, // 자식 배열이 담긴 속성명(중첩 모델)
    iconField: { type: String, default: '' },          // 아이콘 경로 필드명(선택)
    // 트리 표시 옵션
    treeLineVisible: { type: Boolean, default: true },
    expandAllOnLoad: { type: Boolean, default: true }
    // 공통 옵션(editable/softDeleting/hideDeletedRows/useStateBar/useCheckBar/
    // useIndicator/checkBarExclusive/checkBarWidth/stateBarWidth)은 공통 mixin에서 선언.
  },
  watch: {
    rows: {
      deep: true,
      handler(newRows) {
        this.setTreeRows(newRows || [])
      }
    },
    fields: {
      deep: true,
      handler(newFields) {
        if (this.dataProvider && newFields && newFields.length > 0) {
          this.dataProvider.setFields(newFields)
        }
      }
    },
    columns: {
      deep: true,
      handler(newColumns) {
        if (this.gridView && newColumns && newColumns.length > 0) {
          this.gridView.setColumns(newColumns)
        }
      }
    }
  },
  created() {
    // Pinia 테마 스토어 연결 (믹스인이 아닌 컴포넌트에서 직접 → 순환참조 회피)
    this.$tabStore = useTabStore()
  },
  mounted() {
    this.initGrid()
    this.$nextTick(() => {
      this.applyGridTheme(this.$tabStore?.sidebarTheme || 'light')
    })
  },
  methods: {
    initGrid() {
      const container = this.$refs.treeElement
      if (!container) return

      const LocalTreeDataProvider = RealGrid.LocalTreeDataProvider || RealGrid.default?.LocalTreeDataProvider
      const TreeView = RealGrid.TreeView || RealGrid.default?.TreeView

      if (!LocalTreeDataProvider || !TreeView) {
        console.error('[RealGridTree] TreeView / LocalTreeDataProvider 를 찾을 수 없습니다. realgrid 버전을 확인하세요.')
        return
      }

      this.dataProvider = markRaw(new LocalTreeDataProvider())
      this.gridView = markRaw(new TreeView(container))
      this.gridView.setDataSource(this.dataProvider)

      // 편집/삭제 기본 옵션
      this.dataProvider.softDeleting = this.softDeleting
      this.gridView.hideDeletedRows = this.hideDeletedRows

      this.gridView.setEditOptions({
        editable: this.editable,
        insertable: this.editable,
        appendable: this.editable,
        commitWhenLeave: true
      })

      // Indicator / StateBar / CheckBar 공통 제어열 (mixin, props로 제어)
      this.applyControlBars()

      // 트리 표시 옵션
      this.gridView.setDisplayOptions({
        fitStyle: 'evenFill',
        rowHoverType: 'row'
      })
      try {
        this.gridView.setTreeOptions({
          lineVisible: this.treeLineVisible
        })
      } catch (e) {
        console.warn('[RealGridTree] setTreeOptions 실패:', e)
      }

      // 삭제 표시된 행 취소선 강조 (hideDeletedRows=false 일 때 표시됨)
      this.applyDeletedRowStyle()

      // 필드 / 컬럼 설정
      if (this.fields && this.fields.length > 0) {
        this.dataProvider.setFields(this.fields)
      }
      if (this.columns && this.columns.length > 0) {
        this.gridView.setColumns(this.columns)
      }

      // 초기 데이터 로드
      if (this.rows && this.rows.length > 0) {
        this.setTreeRows(this.rows)
      }

      this.$emit('init', { gridView: this.gridView, dataProvider: this.dataProvider })
      this.applyGridTheme(this.$tabStore?.sidebarTheme || 'light')
    },

    /**
     * 삭제 상태(deleted) 행에 취소선 CSS 클래스를 부여한다.
     * RealGrid 는 styleName 클래스의 computed `text-decoration-line` 을 읽어
     * 캔버스에 취소선을 렌더링한다. (.rg-deleted-row 는 전역 CSS 에 정의)
     */
    applyDeletedRowStyle() {
      if (!this.gridView || typeof this.gridView.setRowStyleCallback !== 'function') return
      const provider = this.dataProvider
      this.gridView.setRowStyleCallback((grid, item /*, fixed */) => {
        try {
          if (item && item.dataRow >= 0 && provider) {
            if (provider.getRowState(item.dataRow) === 'deleted') {
              return 'rg-deleted-row'
            }
          }
        } catch (e) { /* noop */ }
        return undefined
      })
    },

    /**
     * 트리 데이터 주입 (중첩 children 모델)
     *
     * RealGrid LocalTreeDataProvider.setNestedRows() 사용.
     *  - rowsProp='' : 최상위 데이터가 배열 그 자체
     *  - childRowsProp / childrenProp : 자식 배열이 담긴 속성명 (예: 'children')
     *  - iconProp : (선택) 노드 아이콘 경로 속성명
     *
     * 참고: setRows(rows, treeField, ..., childrenField) 의 childrenField 는
     *       '자식 존재 여부 플래그 필드'이지 중첩 배열이 아니므로 트리에는 부적합하다.
     */
    setTreeRows(rows) {
      if (!this.dataProvider || typeof this.dataProvider.setNestedRows !== 'function') return
      try {
        this.dataProvider.setNestedRows(
          rows || [],
          '',                    // rowsProp: 최상위가 배열 자체
          this.childrenField,    // childRowsProp
          this.childrenField,    // childrenProp
          this.iconField || undefined
        )
        if (this.expandAllOnLoad && this.gridView) {
          // setNestedRows 직후 동기 호출해야 모든 깊이가 펼쳐진다.
          try { this.gridView.expandAll() } catch (e) {}
        }
      } catch (e) {
        console.error('[RealGridTree] setTreeRows error:', e)
      }
    },

    // =========================================================
    // 트리 전용 Public API (refs 로 노출)
    // 참고: expandAll / collapseAll / expand 는 공통 mixin(realgridCommon)에서 제공.
    // =========================================================
    getParent(itemIndex) {
      return this.gridView && typeof this.gridView.getParent === 'function'
        ? this.gridView.getParent(itemIndex)
        : -1
    },

    getChildren(itemIndex) {
      return this.gridView && typeof this.gridView.getChildren === 'function'
        ? this.gridView.getChildren(itemIndex)
        : []
    },

    // ---- 선택/좌표 헬퍼 --------------------------------------
    /** 현재 선택 셀의 itemIndex (없으면 -1) */
    getCurrentItemIndex() {
      if (!this.gridView) return -1
      const cur = this.gridView.getCurrent()
      return cur && cur.itemIndex >= 0 ? cur.itemIndex : -1
    },

    /** 현재 선택 노드의 dataRow (provider 행번호, 없으면 -1) */
    getCurrentDataRow() {
      const item = this.getCurrentItemIndex()
      if (item < 0) return -1
      return this.gridView.getDataRow(item)
    },

    /** 현재 선택 노드의 JSON (없으면 null) */
    getCurrentNode() {
      const dr = this.getCurrentDataRow()
      if (dr < 0 || !this.dataProvider) return null
      return this.dataProvider.getJsonRow(dr)
    },

    /** dataRow → itemIndex 변환 (표시행 인덱스) */
    _itemOfDataRow(dataRow) {
      const gv = this.gridView
      if (!gv || dataRow < 0) return -1
      if (typeof gv.getItemIndexOfRow === 'function') {
        const i = gv.getItemIndexOfRow(dataRow)
        if (i >= 0) return i
      }
      const n = gv.getItemCount ? gv.getItemCount() : 0
      for (let i = 0; i < n; i++) {
        if (gv.getDataRow(i) === dataRow) return i
      }
      return -1
    },

    // ---- 자식 추가 / 삭제 -------------------------------------
    /**
     * 현재 선택 노드의 자식으로 새 행 추가.
     * @param {Object} values - 새 노드 필드 값 (fieldName 키)
     * @param {Object} opts - { editColumn: 추가 후 편집을 시작할 컬럼명 }
     * @returns {number} 새 dataRow (실패 시 -1)
     */
    addChildToCurrent(values = {}, opts = {}) {
      if (!this.dataProvider || !this.gridView) return -1
      const parentDataRow = this.getCurrentDataRow()
      if (parentDataRow < 0) return -1
      const newRow = this.dataProvider.addChildRow(parentDataRow, values, -1, false)

      this.$nextTick(() => {
        try {
          // 부모 펼쳐서 새 자식 노출
          const parentItem = this._itemOfDataRow(parentDataRow)
          if (parentItem >= 0) this.gridView.expand(parentItem, false, true)
          // 새 자식으로 이동 + 편집 시작
          const childItem = this._itemOfDataRow(newRow)
          if (childItem >= 0) {
            this.gridView.setCurrent({ itemIndex: childItem, column: opts.editColumn || undefined })
            if (opts.editColumn && typeof this.gridView.showEditor === 'function') {
              this.gridView.showEditor()
            }
            if (typeof this.gridView.setFocus === 'function') this.gridView.setFocus()
          }
        } catch (e) {
          console.warn('[RealGridTree] addChildToCurrent focus error:', e)
        }
      })
      return newRow
    },

    /**
     * 루트 레벨에 형제 노드 추가 (선택 없을 때 사용)
     */
    addRootRow(values = {}) {
      if (!this.dataProvider) return -1
      // addChildRow(row, ...) 에서 row 를 -1 로 주면 루트에 추가된다.
      return this.dataProvider.addChildRow(-1, values, -1, false)
    },

    /**
     * 현재 선택 노드 삭제 (recursive=true 면 하위 노드까지 함께 삭제 표시)
     * softDeleting=true 이면 실제 제거 대신 삭제 상태로 표시된다.
     * @returns {boolean}
     */
    removeCurrent(recursive = true) {
      if (!this.dataProvider) return false
      const dataRow = this.getCurrentDataRow()
      if (dataRow < 0) return false
      try {
        // softDeleting=true 인 경우 removeRow 는 소프트삭제 성공 시에도 false 를
        // 반환할 수 있으므로 반환값에 의존하지 않고 예외 여부로 성공을 판단한다.
        this.dataProvider.removeRow(dataRow, recursive)
        return true
      } catch (e) {
        console.warn('[RealGridTree] removeCurrent error:', e)
        return false
      }
    },

    // setFields / setColumns / deleteChecked / commit 은 공통 mixin(realgridCommon) 제공
  }
}
</script>

<style scoped>
.realgrid-tree-wrapper {
  position: relative;
}
</style>

<!--
  전역(non-scoped) 스타일: RealGrid 는 setRowStyleCallback 이 반환한 클래스명의
  computed `text-decoration-line` 을 읽어 캔버스에 취소선을 렌더링한다.
  따라서 scoped 가 아닌 전역 클래스로 정의해야 한다.
-->
<style>
.rg-deleted-row {
  text-decoration-line: line-through;
  color: #ef4444;
}
</style>
