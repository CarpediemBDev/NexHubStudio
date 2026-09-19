<template>
  <div class="reg-crosstab">
    <RealGridCommonJs
      ref="grid"
      :key="gridKey"
      grid-id="regCrosstabGrid"
      height="max(700px, calc(100vh - 400px))"
      :fields="gridFields"
      :columns="gridColumns"
      :rows="gridRows"
      :editable="false"
      :checkable="false"
      :state-bar-visible="false"
      :fixed-col-count="4"
      :row-height="32"
      :sortable="false"
      :filterable="false"
      :group-panel-visible="false"
      fit-style="none"
      :toast="toast"
      @init="onGridInit"
    >
      <template #toolbar-right>
        <span v-if="exporting" class="b2b-text-xs text-theme-secondary me-2">
          <i class="bi bi-arrow-repeat me-1"></i>엑셀 준비 중… (전체 제품 열로)
        </span>
        <span v-else-if="loading" class="b2b-text-xs text-theme-secondary me-2">
          <i class="bi bi-arrow-repeat me-1"></i>불러오는 중…
        </span>
        <span v-else class="b2b-text-xs text-theme-secondary me-2">
          {{ totalCount }}행 · 제품 {{ columns.length }}열
          <span class="text-muted">(이 페이지의 제품만)</span>
        </span>
        <PageSizeSelect v-model="pageSize" size="sm" />
      </template>
    </RealGridCommonJs>
    <Pagination v-model:page="page" v-model:page-size="pageSize" :total="totalCount" :show-size-select="false" />
  </div>
</template>

<script>
/**
 * 규제 정보 - 교차표 (제품 = 열)
 *
 * 전개 탭은 제품마다 행이 늘어난다. 제품이 40개면 그 레코드 하나가 40행이 되고,
 * "이 규제가 어느 제품에 걸리나" 를 보려면 40행을 훑어야 한다.
 * 교차표는 그 제품들을 열로 눕혀 한 행에서 읽게 한다.
 *
 *   분야 | 규제 | 규격 | 관리항목 | QLED TV | 8K TV | 더 프레임 | ...
 *   환경 | RoHS | EN.. | DoC     |    ●    |   ●   |     ·     |
 *
 * 열은 고정이 아니다. 서버가 "이 페이지에 나온 레코드가 실제로 쓰는 제품" 만 열로 주므로
 * 페이지를 넘기면 열 구성이 바뀐다 — 조회 결과 전체의 제품으로 열을 만들면
 * 대부분 빈 칸인 표가 되고 가로로 끝없이 길어진다.
 *
 * 컬럼이 응답마다 달라지므로 그리드를 :key 로 다시 만든다. RealGrid 는 setColumns 로
 * 컬럼을 갈 수 있지만, 필드까지 함께 바뀌면 남은 데이터와 어긋나 빈 칸이 생긴다.
 */
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import Pagination from '@/components/Pagination.vue'
import PageSizeSelect from '@/components/PageSizeSelect.vue'
import { escapeHtml } from '@/utils/stringUtil.js'
import { statusCodes } from '@/data/regulationMock'
import { useRegulationStore } from '@/stores/regulationStore'

const STATUS_BADGE = {
  ACTIVE: 'success',
  REVIEW: 'primary',
  EXPIRED: 'outline'
}

/** 제품 컬럼의 필드명. 코드에 그리드가 싫어하는 글자가 있을 수 있어 접두사를 붙인다 */
const prodField = (code) => `p_${code}`

export default {
  name: 'RegulationCrosstabGrid',
  components: { RealGridCommonJs, Pagination, PageSizeSelect },
  props: {
    /** 조회 결과로 이미 걸러진 레코드 ID */
    regInfoIds: { type: Array, default: () => [] },
    toast: { type: Function, default: null }
  },
  emits: ['update:selectedRegInfoId', 'open'],
  data() {
    return {
      store: useRegulationStore(),
      columns: [],
      rows: [],
      totalCount: 0,
      loading: false,
      loadSeq: 0,
      // 엑셀 내보내는 중. 그동안 페이지를 통째로 바꿔 놓으므로 표시가 필요하다
      exporting: false,
      page: 1,
      pageSize: 20,
      gridView: null,
      dataProvider: null
    }
  },
  computed: {
    /** 컬럼 구성이 바뀌면 그리드를 새로 만든다 */
    gridKey() {
      return this.columns.map((c) => c.code).join('|')
    },
    gridFields() {
      return [
        { fieldName: 'regInfoId', dataType: 'number' },
        { fieldName: 'statusCd', dataType: 'text' },
        { fieldName: 'regNo', dataType: 'text' },
        { fieldName: 'title', dataType: 'text' },
        { fieldName: 'fieldNm', dataType: 'text' },
        { fieldName: 'regulationNm', dataType: 'text' },
        { fieldName: 'standardNm', dataType: 'text' },
        { fieldName: 'certNm', dataType: 'text' },
        { fieldName: 'mandatoryYn', dataType: 'text' },
        { fieldName: 'fieldKey', dataType: 'text' },
        { fieldName: 'recKey', dataType: 'text' },
        { fieldName: 'ruleKey', dataType: 'text' },
        { fieldName: 'stdKey', dataType: 'text' },
        ...this.columns.map((c) => ({ fieldName: prodField(c.code), dataType: 'text' }))
      ]
    },
    /**
     * 서버 행 → 그리드 행.
     * 제품은 productCds 배열로 오므로 컬럼마다 필드를 만들어 'Y' 로 채운다 —
     * RealGrid 는 컬럼마다 평평한 필드가 있어야 그린다.
     */
    gridRows() {
      return this.rows.map((r) => {
        const row = { ...r }
        const has = new Set(r.productCds || [])
        this.columns.forEach((c) => {
          row[prodField(c.code)] = has.has(c.code) ? 'Y' : 'N'
        })
        return row
      })
    },
    gridColumns() {
      const byRecord = { mergeRule: "values['recKey']" }
      const byRule = { mergeRule: "values['ruleKey']" }
      const byStd = { mergeRule: "values['stdKey']" }

      return [
        { name: 'fieldNm', fieldName: 'fieldNm', width: '110', header: { text: '분야' }, styles: { textAlignment: 'center' }, mergeRule: "values['fieldKey']" },
        {
          name: 'statusCd',
          fieldName: 'statusCd',
          width: '80',
          header: { text: '상태' },
          styles: { textAlignment: 'center' },
          ...byRecord,
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const code = model?.value || 'REVIEW'
              const nm = (statusCodes.find((s) => s.code === code) || {}).name || code
              return `<span class="b2b-badge b2b-badge-${STATUS_BADGE[code] || 'secondary'}">${escapeHtml(nm)}</span>`
            }
          }
        },
        { name: 'regNo', fieldName: 'regNo', width: '120', header: { text: '규제번호' }, styles: { textAlignment: 'center' }, ...byRecord },
        { name: 'regulationNm', fieldName: 'regulationNm', width: '200', header: { text: '규제' }, ...byRule, renderer: this.ellipsisRenderer() },
        { name: 'standardNm', fieldName: 'standardNm', width: '200', header: { text: '규격' }, ...byStd, renderer: this.ellipsisRenderer() },
        { name: 'certNm', fieldName: 'certNm', width: '180', header: { text: '관리항목' }, renderer: this.ellipsisRenderer() },
        // 제품 열. 적용되면 ●, 아니면 흐린 점 — 빈 칸이면 "데이터가 없는 건지" 헷갈린다
        ...this.columns.map((c) => ({
          name: prodField(c.code),
          fieldName: prodField(c.code),
          width: '96',
          header: { text: c.name },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) =>
              model?.value === 'Y'
                ? '<span class="ct-on" title="적용">●</span>'
                : '<span class="ct-off" title="해당 없음">·</span>'
          }
        }))
      ]
    }
  },
  watch: {
    regInfoIds: {
      immediate: true,
      handler() {
        if (this.page === 1) this.reload()
        else this.page = 1
      }
    },
    page() {
      this.reload()
    },
    pageSize() {
      if (this.page === 1) this.reload()
      else this.page = 1
    }
  },
  methods: {
    /**
     * 늦게 온 응답이 최신 페이지를 덮어쓰지 않도록 순번을 붙인다.
     * 교차표는 열까지 함께 바뀌므로 역전되면 열과 행이 어긋난 표가 나온다.
     */
    async reload() {
      const seq = ++this.loadSeq
      this.loading = true
      try {
        const res = await this.store.fetchCrosstab(this.regInfoIds, { page: this.page, size: this.pageSize })
        if (seq !== this.loadSeq) return
        this.columns = (res && res.columns) || []
        this.rows = (res && res.rows) || []
        this.totalCount = (res && res.totalCount) || 0
      } finally {
        if (seq === this.loadSeq) this.loading = false
      }
    },
    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider
      gridView.setRowIndicator({ indexOffset: (this.page - 1) * this.pageSize })
      gridView.onCurrentRowChanged = (grid, oldRow, newRow) => {
        const row = newRow >= 0 ? dataProvider.getJsonRow(newRow) : null
        this.$emit('update:selectedRegInfoId', row ? row.regInfoId : null)
      }
      gridView.onCellDblClicked = () => this.$emit('open')
    },
    /**
     * 엑셀은 전체 제품을 열로 내보낸다.
     *
     * 화면의 열은 "이 페이지에 나온 제품" 뿐이라 그대로 내보내면 페이지마다 다른 표가
     * 나온다. 열 구성을 전체 기준으로 만들려면 전체를 한 페이지로 불러오면 된다 —
     * 서버가 "그 페이지 레코드들이 쓰는 제품" 으로 열을 만들므로, 페이지가 곧 전체면
     * 열도 전체가 된다. 열 계산 규칙을 화면에 한 벌 더 두지 않으려고 이 방법을 쓴다.
     *
     * 끝나면 보던 페이지로 되돌린다.
     */
    async exportExcel() {
      if (this.exporting || !this.totalCount) return
      const prevPage = this.page
      const prevSize = this.pageSize
      this.exporting = true
      try {
        this.pageSize = this.totalCount
        this.page = 1
        if (!(await this.waitReady())) {
          throw new Error('그리드가 전체 데이터를 그리지 못했습니다.')
        }
        await this.runExport()
      } finally {
        this.pageSize = prevSize
        this.page = prevPage
        this.exporting = false
      }
    },
    /**
     * 열이 바뀌면 그리드가 통째로 다시 만들어지고(:key), 데이터도 새로 들어간다.
     * 컬럼 구성이 우연히 같으면 재생성이 없으므로 init 이벤트를 기다릴 수 없다 —
     * 그래서 "로딩이 끝났고 그리드에 지금 행이 다 들어갔는지" 를 직접 확인한다.
     */
    async waitReady(timeoutMs = 20000) {
      const t0 = Date.now()
      while (Date.now() - t0 < timeoutMs) {
        await this.$nextTick()
        if (
          !this.loading &&
          this.gridView &&
          this.dataProvider &&
          this.dataProvider.getRowCount() === this.gridRows.length
        ) {
          return true
        }
        await new Promise((r) => setTimeout(r, 50))
      }
      return false
    },
    runExport() {
      return new Promise((resolve, reject) => {
        try {
          this.gridView.exportGrid({
            type: 'excel',
            target: 'local',
            fileName: '규제정보_교차표.xlsx',
            done: resolve
          })
        } catch (e) {
          reject(e)
        }
      })
    },
    ellipsisRenderer() {
      return {
        type: 'html',
        callback: (grid, model) => {
          const v = String(model?.value ?? '')
          if (!v) return '<span class="reg-empty">-</span>'
          return `<span class="ct-ellip" title="${escapeHtml(v)}">${escapeHtml(v)}</span>`
        }
      }
    }
  }
}
</script>

<style scoped>
.reg-crosstab :deep(.ct-ellip) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reg-crosstab :deep(.ct-on) {
  color: var(--b2b-color-primary, #0d6efd);
  font-size: 13px;
}

.reg-crosstab :deep(.ct-off) {
  color: var(--b2b-color-text-faint, #ced4da);
}
</style>
