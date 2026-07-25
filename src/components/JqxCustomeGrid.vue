<template>
  <div class="jqx-custome-grid w-100 h-100">
    <JqxGrid
      ref="grid"
      :width="width"
      :height="height"
      :theme="theme"
      :source="adapter"
      :columns="columnsOut"
      :editable="editable"
      :selectionmode="selectionmode"
      :pageable="pageable"
      :pagesize="pagesize"
      :pagesizeoptions="pagesizeoptions"
      :sortable="sortable"
      :filterable="filterable"
      :columnsresize="columnsresize"
      :columnsreorder="columnsreorder"
      :autoheight="true"
    />
  </div>
</template>

<script>
import JqxGrid from 'jqwidgets-scripts/jqwidgets-vue3/vue_jqxgrid.vue'
import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css'
import 'jqwidgets-scripts/jqwidgets/styles/jqx.bootstrap.css'

export default {
  name: 'JqxCustomeGrid',
  components: { JqxGrid },
  props: {
    localdata: { type: Array, default: () => [] },
    datafields: { type: Array, required: true },
    columns: { type: Array, required: true },
    width: { type: [Number, String], default: '100%' },
    height: { type: [Number, String], default: '100%' },
    theme: { type: String, default: 'bootstrap' },
    editable: { type: Boolean, default: true },
    selectionmode: { type: String, default: 'singlerow' },
    pageable: { type: Boolean, default: true },
    pagesize: { type: Number, default: 20 },
    pagesizeoptions: { type: Array, default: () => [10, 20, 50, 100] },
    sortable: { type: Boolean, default: true },
    filterable: { type: Boolean, default: false },
    columnsresize: { type: Boolean, default: true },
    columnsreorder: { type: Boolean, default: true },
    autoheight: { type: Boolean, default: true },
    showRowStatus: { type: Boolean, default: true },
  },

  data() {
    return {
      adapter: null,
    }
  },
  computed: {
    // rowStatus 필드 자동 보강
    augmentedDatafields() {
      let fields = [...this.datafields]

      // rowStatus 필드 추가
      if (!fields.some((f) => f.name === 'rowStatus')) {
        fields.push({ name: 'rowStatus', type: 'string' })
      }

      return fields
    },
    columnsOut() {
      if (!this.showRowStatus) return this.columns
      const has = this.columns.some((c) => c.datafield === 'rowStatus')
      if (has) return this.columns
      const statusCol = {
        text: '',
        datafield: 'rowStatus',
        width: 10,
        editable: false,
        align: 'center',
        cellsalign: 'center',
        cellsrenderer: (row, col, val) => {
          return `<div class="jqs-state-cell"></div>`
        },
        cellclassname: (row, datafield, value, rowData) => {
          if (rowData.rowStatus === 'A') return 'jqs-row-a'
          if (rowData.rowStatus === 'U') return 'jqs-row-u'
          if (rowData.rowStatus === 'D') return 'jqs-row-d'
          return ''
        },
      }
      return [statusCol, ...this.columns]
    },
  },
  watch: {
    localdata() {
      this.source.localdata = this.localdata
      this.$refs.grid?.updatebounddata('cells')
    },
  },
  created() {
    this.bind()
  },
  methods: {
    // 부모에서 this.$refs.gridComp.add(...) 식으로 호출
    add(initial = {}) {
      this.$refs.grid.addrow(null, initial)
    },
    deleteSelected() {
      const selectedIndexes = this.$refs.grid.getselectedrowindexes() || []
      if (selectedIndexes.length === 0) return

      selectedIndexes.forEach((index) => {
        if (index >= 0 && index < this.localdata.length) {
          this.localdata[index] = { ...this.localdata[index], rowStatus: 'D' }
        }
      })

      this.source.localdata = this.localdata
      this.$nextTick(() => {
        this.$refs.grid?.updatebounddata('cells')
        this.$refs.grid?.clearselection()
      })
    },
    getChanges() {
      return {
        added: this.localdata.filter((r) => r.rowStatus === 'A'),
        updated: this.localdata.filter((r) => r.rowStatus === 'U'),
        deleted: this.localdata.filter((r) => r.rowStatus === 'D'),
      }
    },

    // 서버로 보낼 payload 생성
    getSavePayload() {
      const changes = this.getChanges()

      // rowStatus 필드만 제거하고 전송
      changes.added.forEach((item) => delete item.rowStatus)
      changes.updated.forEach((item) => delete item.rowStatus)
      changes.deleted.forEach((item) => delete item.rowStatus)

      return {
        created: changes.added,
        updated: changes.updated,
        deleted: changes.deleted,
      }
    },

    // 변경사항 개수 확인
    hasChanges() {
      const changes = this.getChanges()
      return changes.added.length > 0 || changes.updated.length > 0 || changes.deleted.length > 0
    },

    // jqx source / adapter
    bind() {
      this.source = {
        datatype: 'array',
        localdata: this.localdata,
        datafields: this.augmentedDatafields,

        // 짧고 담백한 CUD 콜백 (화살표 함수로 this 컨텍스트 유지)
        addrow: (rowid, rowdata, position, commit) => {
          rowdata.rowStatus = 'A'
          // 배열의 맨 위에 추가
          this.localdata.unshift(rowdata)
          // source.localdata도 동기화
          this.source.localdata = this.localdata
          commit(true)
          // 그리드 새로고침
          this.$nextTick(() => {
            this.$refs.grid?.updatebounddata('cells')
          })
        },
        updaterow: (rowid, newdata, commit) => {
          const i = rowid // rowid가 인덱스
          if (i < 0 || i >= this.localdata.length) return commit(false)

          // 기존 rowStatus 확인 (새로 추가된 행이면 'A' 유지, 아니면 'U')
          const prevStatus = this.localdata[i].rowStatus
          const updatedRow = {
            ...newdata,
            rowStatus: prevStatus === 'A' ? 'A' : 'U',
          }
          // 배열의 해당 인덱스 데이터 교체
          this.localdata.splice(i, 1, updatedRow)

          // source.localdata도 동기화
          this.source.localdata = this.localdata
          commit(true)
          this.$nextTick(() => {
            this.$refs.grid?.updatebounddata('cells')
          })
        },
        deleterow: (rowid, rowdata, commit) => {
          const i = rowid // rowid가 인덱스
          if (i < 0 || i >= this.localdata.length) return commit(false)
          // rowdata가 있다면 직접 사용, 없다면 기존 방식
          if (rowdata) {
            this.localdata.splice(i, 1, { ...rowdata, rowStatus: 'D' })
          } else {
            this.localdata[i] = { ...this.localdata[i], rowStatus: 'D' }
          }
          // source.localdata도 동기화
          this.source.localdata = this.localdata
          commit(true)
          this.$nextTick(() => {
            this.$refs.grid?.updatebounddata('cells')
          })
        },
      }
      this.adapter = new jqx.dataAdapter(this.source)
    },
  },
}
</script>

<style scoped>
/* 헤더 톤다운 */
.jqx-custome-grid :deep(.jqx-grid-column-header) {
  background: linear-gradient(180deg, #f8f9fa, #f1f3f5);
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}
/* hover */
.jqx-custome-grid :deep(.jqx-grid-cell-hover) {
  background-color: #eef5ff !important;
}
/* 선택색 */
.jqx-custome-grid :deep(.jqx-grid-cell-selected) {
  background-color: #cfe2ff !important;
  color: #052c65 !important;
}

/* 상태 아이콘 중앙 정렬 */
.jqx-custome-grid :deep(.jqs-state-cell) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}

/* 행 상태별 백그라운드 스타일링 */
.jqx-custome-grid :deep(.jqs-row-a) {
  background-color: #f2fbf7;
}
.jqx-custome-grid :deep(.jqs-row-u) {
  background-color: #fffaf0;
}
.jqx-custome-grid :deep(.jqs-row-d) {
  background-color: #fff5f5;
  text-decoration: line-through;
}

/* A: 추가 => '+' */
.jqx-custome-grid :deep(.jqs-row-a .jqs-state-cell::after) {
  content: '+';
  color: #0f766e; /* 텍스트/테두리 */
}

/* U: 수정 => 'v' */
.jqx-custome-grid :deep(.jqs-row-u .jqs-state-cell::after) {
  content: '✓';
  color: #0f766e; /* 텍스트/테두리 */
}

/* D: 삭제 => '-' */
.jqx-custome-grid :deep(.jqs-row-d .jqs-state-cell::after) {
  content: '-';
  color: #b91c1c;
}
</style>
