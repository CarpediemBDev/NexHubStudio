<template>
  <div class="reg-expand">
    <RealGridCommonJs
      ref="grid"
      grid-id="regExpandGrid"
      height="max(700px, calc(100vh - 400px))"
      :fields="gridFields"
      :columns="gridColumns"
      :rows="namedRows"
      :editable="false"
      :checkable="false"
      :state-bar-visible="false"
      :fixed-col-count="4"
      :row-height="32"
      :sortable="true"
      :filterable="true"
      :group-panel-visible="false"
      fit-style="even"
      :toast="toast"
      @init="onGridInit"
    >
      <template #toolbar-right>
        <span v-if="loading" class="b2b-text-xs text-theme-secondary me-2">
          <i class="bi bi-arrow-repeat me-1"></i>전개 중…
        </span>
        <span v-else class="b2b-text-xs text-theme-secondary me-2">
          레코드 {{ regInfoIds.length }}건 → 전개 {{ totalCount }}행
        </span>
        <PageSizeSelect v-model="pageSize" size="sm" />
      </template>
    </RealGridCommonJs>
    <Pagination v-model:page="page" v-model:page-size="pageSize" :total="totalCount" :show-size-select="false" />
  </div>
</template>

<script>
/**
 * 규제 정보 - 전개(행→열) 그리드
 *
 * 평면 탭은 "레코드 1건 = 1행" 이라, 한 레코드에 여러 개인 값
 * (규제 > 규격 > 관리항목(인증서), 제품)이 한 셀 안에 여러 줄로 쌓인다.
 * 줄이 길어지면 말줄임·더보기·행 높이 문제로 이어지고, 무엇보다 그 값으로
 * 정렬·필터·엑셀을 걸 수 없다 — 셀 하나가 여러 값을 쥐고 있기 때문이다.
 *
 * 이 탭은 그 값들을 각각 "열" 로 돌린다.
 *   분야 | 규제 | 규격 | 관리항목 | 제품  → 각자 컬럼
 *   행   = 그 조합 1건
 * 같은 값이 반복되는 앞쪽 축은 mergeRule 로 세로 병합해서 계층처럼 묶어 보여준다.
 *
 * 펼치기(JOIN)와 정렬·병합키, 코드→이름까지 서버가 만든다.
 * 화면에 남은 것은 표시 규칙뿐이다 — 여러 값을 ", " 로 잇고, 빈 값을 '전체' 로 읽는 것.
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
  DRAFT: 'secondary',
  EXPIRED: 'outline'
}

// 컬럼 헤더 묶음. RealGrid2 는 columns 안에 columns 를 넣어도 자식이 안 생기므로
// 컬럼은 평평하게 두고 헤더 묶음만 setColumnLayout 으로 만든다.
const COLUMN_LAYOUT = [
  'fieldNm', 'statusCd', 'regNo', 'title',
  {
    name: 'ruleGroup',
    direction: 'horizontal',
    header: { text: '규제 체계 (규제 › 규격 › 관리항목)' },
    items: ['regulationNm', 'standardNm', 'certNm', 'mandatoryYn']
  },
  {
    name: 'orgGroup',
    direction: 'horizontal',
    header: { text: '적용 제품' },
    items: ['divisionTxt', 'productGroupTxt', 'productNm']
  },
  {
    name: 'geoGroup',
    direction: 'horizontal',
    header: { text: '적용 지역' },
    items: ['regionTxt', 'countryTxt']
  },
  'effectiveDt', 'versionNo'
]

export default {
  name: 'RegulationExpandGrid',
  components: { RealGridCommonJs, Pagination, PageSizeSelect },
  props: {
    /** 조회 결과로 이미 걸러진 레코드 ID. 이 목록만 전개한다 */
    regInfoIds: { type: Array, default: () => [] },
    selectedRegInfoId: { type: Number, default: null },
    toast: { type: Function, default: null }
  },
  emits: ['update:selectedRegInfoId', 'open'],
  data() {
    return {
      store: useRegulationStore(),
      rows: [],
      totalCount: 0,
      loading: false,
      // 페이지 요청 순번. 늦게 온 응답이 최신 페이지를 덮어쓰는 것을 막는다
      loadSeq: 0,
      page: 1,
      pageSize: 50,
      gridView: null,
      dataProvider: null,
      gridFields: [
        { fieldName: 'regInfoId', dataType: 'number' },
        { fieldName: 'statusCd', dataType: 'text' },
        { fieldName: 'regNo', dataType: 'text' },
        { fieldName: 'title', dataType: 'text' },
        { fieldName: 'fieldNm', dataType: 'text' },
        { fieldName: 'regulationNm', dataType: 'text' },
        { fieldName: 'standardNm', dataType: 'text' },
        { fieldName: 'certNm', dataType: 'text' },
        { fieldName: 'mandatoryYn', dataType: 'text' },
        { fieldName: 'divisionTxt', dataType: 'text' },
        { fieldName: 'productGroupTxt', dataType: 'text' },
        { fieldName: 'productNm', dataType: 'text' },
        { fieldName: 'regionTxt', dataType: 'text' },
        { fieldName: 'countryTxt', dataType: 'text' },
        { fieldName: 'countryCnt', dataType: 'number' },
        { fieldName: 'effectiveDt', dataType: 'text' },
        { fieldName: 'versionNo', dataType: 'number' },
        // 병합키 — 서버가 정렬과 짝을 맞춰 내려준다. 화면엔 보이지 않는다
        { fieldName: 'fieldKey', dataType: 'text' },
        { fieldName: 'recKey', dataType: 'text' },
        { fieldName: 'ruleKey', dataType: 'text' },
        { fieldName: 'stdKey', dataType: 'text' }
      ]
    }
  },
  computed: {
    gridColumns() {
      // 병합 단위: 분야 > 레코드 > 규제 > 규격. 뒤로 갈수록 좁게 묶인다
      const byField = { mergeRule: "values['fieldKey']" }
      const byRecord = { mergeRule: "values['recKey']" }
      const byRule = { mergeRule: "values['ruleKey']" }
      const byStd = { mergeRule: "values['stdKey']" }

      return [
        {
          name: 'fieldNm',
          fieldName: 'fieldNm',
          width: '110',
          header: { text: '분야' },
          styles: { textAlignment: 'center' },
          ...byField
        },
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
              const name = (statusCodes.find((s) => s.code === code) || {}).name || code
              return `<span class="b2b-badge b2b-badge-${STATUS_BADGE[code] || 'secondary'}">${escapeHtml(name)}</span>`
            }
          }
        },
        { name: 'regNo', fieldName: 'regNo', width: '120', header: { text: '규제번호' }, styles: { textAlignment: 'center' }, ...byRecord },
        { name: 'title', fieldName: 'title', width: '260', header: { text: '규제명' }, ...byRecord, renderer: this.ellipsisRenderer() },
        { name: 'regulationNm', fieldName: 'regulationNm', width: '220', header: { text: '규제' }, ...byRule, renderer: this.ellipsisRenderer() },
        { name: 'standardNm', fieldName: 'standardNm', width: '220', header: { text: '규격' }, ...byStd, renderer: this.ellipsisRenderer() },
        { name: 'certNm', fieldName: 'certNm', width: '200', header: { text: '관리항목' }, renderer: this.ellipsisRenderer() },
        {
          name: 'mandatoryYn',
          fieldName: 'mandatoryYn',
          width: '64',
          header: { text: '필수' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) =>
              model?.value === 'Y'
                ? '<span class="b2b-badge b2b-badge-danger">필수</span>'
                : '<span class="reg-empty">선택</span>'
          }
        },
        { name: 'divisionTxt', fieldName: 'divisionTxt', width: '150', header: { text: '사업부' }, ...byRecord, renderer: this.ellipsisRenderer() },
        { name: 'productGroupTxt', fieldName: 'productGroupTxt', width: '110', header: { text: '제품군' }, styles: { textAlignment: 'center' }, ...byRecord },
        { name: 'productNm', fieldName: 'productNm', width: '130', header: { text: '제품' }, styles: { textAlignment: 'center' } },
        { name: 'regionTxt', fieldName: 'regionTxt', width: '100', header: { text: '권역' }, styles: { textAlignment: 'center' }, ...byRecord },
        {
          name: 'countryTxt',
          fieldName: 'countryTxt',
          width: '140',
          header: { text: '국가' },
          ...byRecord,
          // 국가는 전개 축이 아니라 레코드 속성이라 여러 개여도 한 칸에 남는다.
          // 전개 탭의 목적이 "셀 안 여러 줄 없애기" 이므로 요약 + 툴팁으로만 보여준다
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const txt = String(model?.value ?? '')
              if (!txt) return '<span class="reg-empty">-</span>'
              const cnt = Number(grid.getValue(model.index.itemIndex, 'countryCnt') || 0)
              const head = txt.split(', ')[0]
              const label = cnt > 1 ? `${head} 외 ${cnt - 1}` : txt
              return `<span class="rx-ellip" title="${escapeHtml(txt)}">${escapeHtml(label)}</span>`
            }
          }
        },
        { name: 'effectiveDt', fieldName: 'effectiveDt', width: '96', header: { text: '시행일' }, styles: { textAlignment: 'center' }, ...byRecord },
        { name: 'versionNo', fieldName: 'versionNo', width: '60', header: { text: '버전' }, numberFormat: '#,##0', styles: { textAlignment: 'center' }, ...byRecord }
      ]
    },
    /**
     * 서버가 준 행을 그리드 컬럼 모양으로만 다듬는다.
     * 이름은 서버가 붙여서 온다 — 코드표가 DB 에 적재된 뒤로 화면이 코드를 해석할 일이 없다.
     * 여기 남은 것은 표시 규칙뿐이다: 여러 값을 ", " 로 잇는 것과, 빈 값을 '전체' 로 읽는 것.
     */
    namedRows() {
      return this.toGridRows(this.rows)
    },
    /** 현재 페이지의 첫 행이 전체에서 몇 번째인지. 행 번호를 전체 기준으로 잇는 데 쓴다 */
    pageOffset() {
      return (this.page - 1) * this.pageSize
    }
  },
  watch: {
    // 조회 조건이 바뀌면 1페이지부터 다시
    regInfoIds: {
      immediate: true,
      handler() {
        if (this.page === 1) this.reload()
        else this.page = 1 // page 워처가 reload 한다
      }
    },
    page() {
      this.reload()
    },
    pageSize() {
      if (this.page === 1) this.reload()
      else this.page = 1
    },
    // 행 번호를 페이지를 넘어 전체 기준(51, 52…)으로 잇는다
    pageOffset(offset) {
      if (this.gridView) this.gridView.setRowIndicator({ indexOffset: offset })
    }
  },
  methods: {
    /**
     * 서버에서 현재 페이지만 받아온다.
     * 늦게 온 응답이 최신 페이지를 덮어쓰지 않도록 순번을 붙인다 —
     * 페이지를 빠르게 넘기면 요청이 겹치고 먼저 보낸 쪽이 나중에 도착할 수 있다.
     */
    /**
     * 서버 행 → 그리드 컬럼 모양.
     * 이름은 서버가 붙여서 온다. 여기 남은 것은 표시 규칙뿐이다 —
     * 여러 값을 ", " 로 잇는 것과, 빈 값을 '전체'(제한 없음)로 읽는 것.
     * 엑셀 내보내기도 같은 변환을 써야 하므로 computed 가 아니라 메서드다.
     */
    toGridRows(rows) {
      return (rows || []).map((r) => ({
        ...r,
        divisionTxt: (r.divisionNms || []).join(', '),
        productGroupTxt: (r.productGroupNms || []).join(', '),
        productNm: r.productNm || '전체',
        regionTxt: (r.regionNms || []).join(', '),
        countryTxt: (r.countryNms || []).join(', ') || '전체',
        countryCnt: (r.countryCds || []).length
      }))
    },
    async reload() {
      const seq = ++this.loadSeq
      this.loading = true
      try {
        const res = await this.store.fetchExpanded(this.regInfoIds, { page: this.page, size: this.pageSize })
        if (seq !== this.loadSeq) return
        this.rows = (res && res.rows) || []
        this.totalCount = (res && res.totalCount) || 0
      } finally {
        if (seq === this.loadSeq) this.loading = false
      }
    },
    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      gridView.setColumnLayout(COLUMN_LAYOUT)

      gridView.onCurrentRowChanged = (grid, oldRow, newRow) => {
        const row = newRow >= 0 ? dataProvider.getJsonRow(newRow) : null
        this.$emit('update:selectedRegInfoId', row ? row.regInfoId : null)
      }
      gridView.onCellDblClicked = () => this.$emit('open')
    },
    /** 잘린 값은 title 로 전체를 보여준다(전개 탭은 행 높이를 32px 로 고정한다) */
    ellipsisRenderer() {
      return {
        type: 'html',
        callback: (grid, model) => {
          const v = String(model?.value ?? '')
          if (!v) return '<span class="reg-empty">-</span>'
          return `<span class="rx-ellip" title="${escapeHtml(v)}">${escapeHtml(v)}</span>`
        }
      }
    },
    /**
     * 엑셀은 보고 있는 페이지가 아니라 전개 결과 전체를 내보낸다.
     * 이제 그리드에는 현재 페이지만 있으므로 전체를 따로 받아 와야 한다(size 없이 부르면 전부 온다).
     */
    async exportExcel() {
      if (!this.gridView) return
      const pageRows = this.dataProvider.getJsonRows()
      const restore = () => this.dataProvider.setRows(pageRows)
      const all = await this.store.fetchExpanded(this.regInfoIds)
      this.dataProvider.setRows(this.toGridRows((all && all.rows) || []))
      try {
        this.gridView.exportGrid({ type: 'excel', target: 'local', fileName: '규제정보_전개.xlsx', done: restore })
      } catch (e) {
        restore()
        throw e
      }
    }
  }
}
</script>

<style scoped>
/* 한 줄 고정 + 말줄임. 전체 값은 title 툴팁으로 본다 */
.reg-expand :deep(.rx-ellip) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
