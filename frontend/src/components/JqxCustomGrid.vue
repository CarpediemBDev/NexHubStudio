<template>
  <div class="jqx-custom-grid">
    <JqxGrid
      ref="grid"
      width="100%"
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
      :autoheight="autoheight"
      showRowStatus="showRowStatus"
    />
  </div>
</template>

<script>
import JqxGrid from 'jqwidgets-scripts/jqwidgets-vue3/vue_jqxgrid.vue'
import 'jqwidgets-scripts/jqwidgets/styles/jqx.base.css'
import 'jqwidgets-scripts/jqwidgets/styles/jqx.bootstrap.css'

export default {
  name: 'JqxCustomGrid',
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
        width: 40,
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
  mounted() {
    // 컨테이너 리사이즈 감지 (사이드바 토글 등 윈도우 리사이즈가 발생하지 않는 레이아웃 변경 대응)
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        // 과도한 호출 방지
        window.requestAnimationFrame(() => {
          if (this.$refs.grid) {
            // refresh 호출 시 jqxGrid가 부모 컨테이너(width='100%')의 변경된 픽셀 값을 다시 계산함
            this.$refs.grid.refresh()
          }
        })
      })
      this.resizeObserver.observe(this.$el)
    }
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  },
  methods: {
    // 부모에서 this.$refs.gridComp.add(...) 식으로 호출
    add(initial = {}, position = 'first') {
      this.$refs.grid.addrow(null, initial, position)
    },
    deleteSelected() {
      const selectedIndexes = this.$refs.grid.getselectedrowindexes() || []
      if (selectedIndexes.length === 0) return

      // 인덱스를 역순으로 정렬 (뒤에서부터 삭제해야 인덱스 꼬임 방지)
      const sortedIndexes = [...selectedIndexes].sort((a, b) => b - a)

      sortedIndexes.forEach((index) => {
        if (index >= 0 && index < this.localdata.length) {
          const row = this.localdata[index]

          // 새로 추가한 행(A)이면 배열에서 완전히 제거
          if (row.rowStatus === 'A') {
            this.localdata.splice(index, 1)
          } else {
            // 기존 행이면 삭제 표시(D)
            this.localdata[index] = { ...row, rowStatus: 'D' }
          }
        }
      })

      this.source.localdata = this.localdata
      this.$nextTick(() => {
        this.$refs.grid?.updatebounddata('cells')
        this.$refs.grid?.clearselection()
      })
    },
    // 서버로 보낼 payload 생성
    getSavePayload() {
      return {
        created: this.localdata.filter((r) => r.rowStatus === 'A'),
        updated: this.localdata.filter((r) => r.rowStatus === 'U'),
        deleted: this.localdata.filter((r) => r.rowStatus === 'D'),
      }
    },

    // 변경사항 개수 확인
    hasChanges() {
      const payload = this.getSavePayload()
      return payload.created.length > 0 || payload.updated.length > 0 || payload.deleted.length > 0
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

          // position에 따라 추가 위치 결정
          if (position === 'last') {
            this.localdata.push(rowdata)
          } else if (typeof position === 'number') {
            this.localdata.splice(position, 0, rowdata)
          } else {
            // 'first' 또는 undefined
            this.localdata.unshift(rowdata)
          }

          this.source.localdata = this.localdata
          commit(true)
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
      }
      this.adapter = new jqx.dataAdapter(this.source)
    },
  },
}
</script>

<style scoped>
/* 헤더 톤다운 */
.jqx-custom-grid :deep(.jqx-grid-column-header) {
  background: linear-gradient(180deg, #f8f9fa, #f1f3f5);
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}
/* hover: GitHub Table Hover Style */
.jqx-custom-grid :deep(.jqx-grid-cell-hover) {
  background-color: #f6f8fa !important;
  color: #24292f !important;
}
/* 선택색: GitHub Blue Highlight */
.jqx-custom-grid :deep(.jqx-grid-cell-selected) {
  background-color: #ddf4ff !important;
  color: #0969da !important;
}

/* 상태 아이콘 중앙 정렬 */
.jqx-custom-grid :deep(.jqs-state-cell) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
}

/* 행 상태별 백그라운드 스타일링 */
.jqx-custom-grid :deep(.jqs-row-a) {
  background-color: #f2fbf7;
}
.jqx-custom-grid :deep(.jqs-row-u) {
  background-color: #fffaf0;
}
.jqx-custom-grid :deep(.jqs-row-d) {
  background-color: #fff5f5;
  text-decoration: line-through;
}

/* A: 추가 => '+' */
.jqx-custom-grid :deep(.jqs-row-a .jqs-state-cell::after) {
  content: '+';
  color: #0f766e; /* 텍스트/테두리 */
}

/* U: 수정 => 'v' */
.jqx-custom-grid :deep(.jqs-row-u .jqs-state-cell::after) {
  content: '✓';
  color: #0f766e; /* 텍스트/테두리 */
}

/* D: 삭제 => '-' */
.jqx-custom-grid :deep(.jqs-row-d .jqs-state-cell::after) {
  content: '-';
  color: #b91c1c;
}

/* --- 가로 스크롤 제거를 위한 핵심 스타일 --- */
/* 1. 컨테이너가 테두리를 담당 */
.jqx-custom-grid {
  width: 100%;
  height: 100%;
  border: 1px solid #c5c5c5; /* jqx 기본 테두리 색상과 유사하게 맞춤 */
  box-sizing: border-box;
  overflow: hidden; /* 그리드 밖으로 튀어나가는 1px 방지 */
}

/* 2. jqxGrid 자체의 테두리는 제거 (100% + border = 오버플로우 원인 제거) */
.jqx-custom-grid :deep(.jqx-grid),
.jqx-custom-grid :deep(.jqx-border-bootstrap),
.jqx-custom-grid :deep(.jqx-widget-content) {
  border-width: 0px !important;
}

/* 3. 스크롤바가 생기더라도 박스 안쪽에 생기도록 */
.jqx-custom-grid :deep(*) {
  box-sizing: border-box;
}
</style>
