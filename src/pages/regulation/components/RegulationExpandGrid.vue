<template>
  <div class="reg-expand">
    <RealGridCommonJs
      ref="grid"
      grid-id="regExpandGrid"
      height="max(700px, calc(100vh - 400px))"
      :fields="gridFields"
      :columns="gridColumns"
      :rows="pagedRows"
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
          레코드 {{ regInfoIds.length }}건 → 전개 {{ rows.length }}행
        </span>
        <PageSizeSelect v-model="pageSize" size="sm" />
      </template>
    </RealGridCommonJs>
    <Pagination v-model:page="page" v-model:page-size="pageSize" :total="rows.length" :show-size-select="false" />
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
 * 펼치기(JOIN)와 정렬·병합키는 서버가 만든다(src/mocks/handlers/regulation.js 의 expandRecords).
 * 서버가 내리는 것은 코드뿐이다 — reg_info_item 에 ITEM_NM 이 없고 common_code 에도
 * 규제 코드가 없어서 백엔드에는 코드→이름 출처가 아예 없다.
 * 이름은 코드테이블(regulationMock.js)을 쥔 화면이 codeName() 으로 붙인다.
 */
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import Pagination from '@/components/Pagination.vue'
import PageSizeSelect from '@/components/PageSizeSelect.vue'
import { escapeHtml } from '@/utils/stringUtil.js'
import { statusCodes } from '@/data/regulationMock'
import { codeName } from '@/utils/regulationConflict'
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
      loading: false,
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
     * 서버가 준 코드 행에 이름을 입힌다.
     * 병합키는 코드로 만들어져 있으므로 이름을 붙여도 병합 단위는 그대로다.
     */
    namedRows() {
      const names = (type, cds) => (cds || []).map((cd) => codeName(type, cd))
      return this.rows.map((r) => ({
        ...r,
        fieldNm: codeName('FIELD', r.fieldCd),
        regulationNm: r.regulationCd ? codeName('REGULATION', r.regulationCd) : '',
        standardNm: r.standardCd ? codeName('STANDARD', r.standardCd) : '',
        certNm: r.certCd ? codeName('CERT', r.certCd) : '',
        divisionTxt: names('DIVISION', r.divisionCds).join(', '),
        productGroupTxt: names('PRODUCT_GROUP', r.productGroupCds).join(', '),
        // 제품 미지정은 서버가 빈 코드로 준다(LEFT JOIN). 화면에서만 '전체' 로 읽는다
        productNm: r.productCd ? codeName('PRODUCT', r.productCd) : '전체',
        regionTxt: names('REGION', r.regionCds).join(', '),
        countryTxt: names('COUNTRY', r.countryCds).join(', ') || '전체',
        countryCnt: (r.countryCds || []).length
      }))
    },
    pagedRows() {
      const offset = (this.page - 1) * this.pageSize
      return this.namedRows.slice(offset, offset + this.pageSize)
    }
  },
  watch: {
    regInfoIds: {
      immediate: true,
      handler() {
        this.reload()
      }
    },
    rows() {
      this.page = 1
    },
    page(p) {
      if (this.gridView) this.gridView.setRowIndicator({ indexOffset: (p - 1) * this.pageSize })
    }
  },
  methods: {
    async reload() {
      this.loading = true
      try {
        const res = await this.store.fetchExpanded(this.regInfoIds)
        this.rows = (res && res.rows) || []
      } finally {
        this.loading = false
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
    /** 엑셀은 보고 있는 페이지가 아니라 전개 결과 전체를 내보낸다 */
    exportExcel() {
      if (!this.gridView) return
      const pageRows = this.dataProvider.getJsonRows()
      const restore = () => this.dataProvider.setRows(pageRows)
      this.dataProvider.setRows(this.rows)
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
