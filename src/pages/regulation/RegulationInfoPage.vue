<template>
  <div class="b2b-page-container py-3 reg-page">
    <!-- ============================================================ -->
    <!-- 1. 검색 그리드 (조회 조건 폼)                                  -->
    <!-- ============================================================ -->
    <form class="search-box-container b2b-card px-4 py-3 mb-3 bg-theme-subcard border border-theme rounded-3" @submit.prevent="search">
      <div class="row gx-4 gy-3">
        <div class="col-12 col-md-3">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">규제/규격명</label>
          <div class="input-group input-group-sm">
            <input
              v-model="filters.keyword"
              class="form-control form-control-sm border-theme bg-theme-card text-theme-primary"
              placeholder="규제명 · 규격명 · 규제번호"
              @keydown.enter.prevent="search"
            />
            <button type="button" class="btn btn-sm btn-outline-secondary border-theme bg-theme-card text-theme-secondary px-2.5" @click="search">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">분야</label>
          <select v-model="filters.fieldCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="f in fieldCodes" :key="f.code" :value="f.code">{{ f.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">권역</label>
          <select v-model="filters.regionCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="r in regionCodes" :key="r.code" :value="r.code">{{ r.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">국가</label>
          <select v-model="filters.countryCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="c in filteredCountryCodes" :key="c.code" :value="c.code">{{ c.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-3">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">규제</label>
          <select v-model="filters.regulationCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="rg in regulationCodes" :key="rg.code" :value="rg.code">{{ rg.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">사업부</label>
          <select v-model="filters.divisionCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="d in divisionCodes" :key="d.code" :value="d.code">{{ d.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">제품군</label>
          <select v-model="filters.productGroupCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="pg in filteredProductGroupCodes" :key="pg.code" :value="pg.code">{{ pg.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">제품</label>
          <select v-model="filters.productCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="p in filteredProductCodes" :key="p.code" :value="p.code">{{ p.name }}</option>
          </select>
        </div>

        <div class="col-6 col-md-2">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">상태</label>
          <select v-model="filters.statusCd" class="form-select form-select-sm bg-theme-card text-theme-primary border-theme">
            <option value="">전체</option>
            <option v-for="s in statusCodes" :key="s.code" :value="s.code">{{ s.name }}</option>
          </select>
        </div>

        <div class="col-12 col-md-4">
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">시행일 (기간)</label>
          <div class="d-flex align-items-center gap-1.5">
            <B2bDatePicker v-model="filters.effectiveFrom" placeholder="시작일" :enable-time-picker="false" :show-presets="true" />
            <span class="text-theme-secondary b2b-text-sm fw-bold">~</span>
            <B2bDatePicker v-model="filters.effectiveTo" placeholder="종료일" :enable-time-picker="false" :show-presets="true" />
          </div>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2 mt-3 pt-3 border-top border-theme">
        <div class="form-check form-check-inline mb-0">
          <input id="onlyConflict" v-model="filters.onlyConflict" class="form-check-input" type="checkbox" />
          <label class="form-check-label b2b-text-sm text-theme-primary" for="onlyConflict">충돌 이력이 있는 건만</label>
        </div>
        <div class="ms-auto d-flex gap-2">
          <button type="button" class="btn-b2b-action" @click="resetFilters">
            <i class="bi bi-arrow-counterclockwise me-1"></i>초기화
          </button>
          <button type="submit" class="btn-b2b-primary">
            <i class="bi bi-search me-1"></i>조회
          </button>
        </div>
      </div>
    </form>

    <!-- ============================================================ -->
    <!-- 2. 리얼그리드 (정보 레코드 목록)                                -->
    <!-- ============================================================ -->
    <div class="b2b-card shadow-sm border">
      <div class="b2b-card-header bg-theme-subcard py-2.5 px-3 d-flex flex-wrap align-items-center gap-2 border-bottom">
        <span class="fw-bold text-theme-primary">
          <i class="bi bi-shield-check text-primary me-1"></i>규제 정보 목록
        </span>
        <span class="b2b-badge b2b-badge-secondary">{{ gridCount }}건</span>
        <span v-if="selectedRecord" class="b2b-text-xs text-muted ms-1">
          선택: <strong>{{ selectedRecord.regNo }}</strong> · v{{ selectedRecord.versionNo }}
        </span>

        <div class="ms-auto d-flex align-items-center gap-2">
          <button class="btn-b2b-action" :disabled="!selectedRecord" @click="openDetail">
            <i class="bi bi-file-text text-secondary me-1"></i>상세
          </button>
          <button class="btn-b2b-action" @click="openCreate">
            <i class="bi bi-plus-lg text-success me-1"></i>신규 등록
          </button>
          <button class="btn-b2b-action" :disabled="!selectedRecord" @click="openEdit">
            <i class="bi bi-pencil-square text-primary me-1"></i>수정
          </button>
          <button class="btn-b2b-action" :disabled="!selectedRecord" @click="openHistory">
            <i class="bi bi-clock-history text-warning me-1"></i>이력
          </button>
          <button class="btn-b2b-action" :disabled="!selectedRecord" @click="removeRecord">
            <i class="bi bi-trash text-danger me-1"></i>삭제
          </button>
          <button class="btn-b2b-action" @click="exportExcel">
            <i class="bi bi-file-earmark-excel text-success me-1"></i>엑셀
          </button>
        </div>
      </div>

      <!-- 국가 필터 디자인 비교 (임시). 하나로 정하면 이 줄과 안 쓰는 variant 를 지운다 -->
      <div class="design-switch px-3 py-1 border-bottom">
        <span class="b2b-text-xs text-theme-secondary"><i class="bi bi-palette me-1"></i>국가 필터 디자인</span>
        <div class="ui-mode-toggle">
          <button
            v-for="v in FILTER_VARIANTS"
            :key="v.key"
            type="button"
            :class="{ on: filterVariant === v.key }"
            :title="v.desc"
            @click="setFilterVariant(v.key)"
          >
            {{ v.label }}
          </button>
        </div>
        <span class="b2b-text-xs text-muted d-none d-lg-inline">{{ currentVariantDesc }}</span>
      </div>

      <!-- 국가별 필터: 그리드 국가 컬럼의 컬럼 필터를 켜고 끈다 (다중 선택, 헤더 필터와 동기화) -->
      <CountryFilterBar
        :variant="filterVariant"
        :options="countryChipOptions"
        :selected="countryChips"
        :total-count="filteredRecords.length"
        :regions="regionCodes"
        @update:selected="setCountryChips"
      />

      <div class="b2b-card-body p-2">
        <RealGridCommonJs
          ref="grid"
          grid-id="regInfoGrid"
          height="520px"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="gridRows"
          :editable="false"
          :checkable="true"
          :sortable="true"
          :filterable="true"
          :group-panel-visible="true"
          fit-style="evenFill"
          :toast="gridToast"
          @init="onGridInit"
        />
      </div>
    </div>

  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import B2bDatePicker from '@/components/common/B2bDatePicker.vue'
import CountryFilterBar from './components/CountryFilterBar.vue'
import { showToast } from '@/utils/toastUtil.js'
import {
  fieldCodes,
  divisionCodes,
  productGroupCodes,
  productCodes,
  regionCodes,
  countryCodes,
  regulationCodes,
  statusCodes
} from '@/data/regulationMock'
import { targetNames } from '@/utils/regulationConflict'
import { useRegulationStore } from '@/stores/regulationStore'
import { itemSummary } from '@/utils/regulationTree'

const STATUS_STYLE = {
  ACTIVE: ['#198754', '#fff'],
  REVIEW: ['#0d6efd', '#fff'],
  DRAFT: ['#6c757d', '#fff'],
  EXPIRED: ['#adb5bd', '#fff']
}

const NO_COUNTRY = '__NONE__'
// 국가 필터 디자인 후보. 같은 데이터·같은 그리드 필터를 모양만 바꿔 보여준다
const FILTER_VARIANTS = [
  { key: 'more', label: 'A 더보기', desc: '건수 상위 20개만 펼쳐 두고 나머지는 더보기로 연다' },
  { key: 'vscroll', label: 'B 세로 스크롤', desc: '2줄 높이로 고정하고 안에서 세로 스크롤' },
  { key: 'hscroll', label: 'C 가로 스크롤', desc: '한 줄 고정, 휠로 가로 이동, 양끝이 흐려져 더 있음을 알림' },
  { key: 'carousel', label: 'D 캐러셀', desc: '한 줄 고정, ◀ ▶ 로 한 화면씩 넘기고 페이지 표시' },
  { key: 'region', label: 'E 권역 탭', desc: '권역 탭을 고르면 그 권역 국가만. 선택 수는 탭에 배지로' },
  { key: 'panel', label: 'F 드롭다운', desc: '버튼 하나 + 권역별 체크박스 패널. 선택한 국가는 태그로' }
]
const VARIANT_KEY = 'regInfo.countryFilterVariant'

function loadVariant() {
  try {
    const v = localStorage.getItem(VARIANT_KEY)
    return FILTER_VARIANTS.some((it) => it.key === v) ? v : 'more'
  } catch (e) {
    return 'more'
  }
}
// 국가 필터를 거는 컬럼. 화면엔 "한국 외 1" 요약이 보이고, 판정은 countryCds 필드로 한다.
const COUNTRY_COL = 'countryTxt'

// 컬럼 헤더 묶음. gridColumns 의 컬럼 이름을 그대로 배치한다.
const COLUMN_LAYOUT = [
  'statusCd', 'regNo', 'title', 'itemTxt', 'itemCnt', 'fieldNm', 'markNm',
  { name: 'orgGroup', direction: 'horizontal', header: { text: '적용 제품' }, items: ['divisionTxt', 'productGroupTxt', 'productTxt'] },
  { name: 'geoGroup', direction: 'horizontal', header: { text: '적용 지역' }, items: ['regionTxt', COUNTRY_COL] },
  'url', 'attachCnt', 'conflictCnt', 'versionNo', 'effectiveDt', 'modDt'
]

export default {
  name: 'RegulationInfoPage',
  components: { RealGridCommonJs, B2bDatePicker, CountryFilterBar },
  data() {
    return {
      fieldCodes,
      divisionCodes,
      productGroupCodes,
      productCodes,
      regionCodes,
      countryCodes,
      regulationCodes,
      statusCodes,

      // 데이터는 등록/수정 페이지와 공유해야 하므로 스토어를 단일 출처로 쓴다.
      store: useRegulationStore(),

      filters: {
        keyword: '',
        fieldCd: '',
        regionCd: '',
        countryCd: '',
        regulationCd: '',
        divisionCd: '',
        productGroupCd: '',
        productCd: '',
        statusCd: '',
        effectiveFrom: '',
        effectiveTo: '',
        onlyConflict: false
      },
      appliedFilters: null,
      // 국가 칩 선택값 = 국가 컬럼에서 활성화된 필터 이름. 비어 있으면 전체
      countryChips: [],
      FILTER_VARIANTS,
      filterVariant: loadVariant(),
      // 그리드 필터까지 적용된 뒤 화면에 보이는 건수
      gridCount: 0,

      gridView: null,
      dataProvider: null,
      selectedRegInfoId: null,

      gridFields: [
        { fieldName: 'regInfoId', dataType: 'number' },
        { fieldName: 'statusCd', dataType: 'text' },
        { fieldName: 'regNo', dataType: 'text' },
        { fieldName: 'title', dataType: 'text' },
        { fieldName: 'itemTxt', dataType: 'text' },
        { fieldName: 'itemCnt', dataType: 'number' },
        { fieldName: 'fieldNm', dataType: 'text' },
        { fieldName: 'markNm', dataType: 'text' },
        { fieldName: 'divisionTxt', dataType: 'text' },
        { fieldName: 'productGroupTxt', dataType: 'text' },
        { fieldName: 'productTxt', dataType: 'text' },
        { fieldName: 'regionTxt', dataType: 'text' },
        { fieldName: 'countryTxt', dataType: 'text' },
        // 적용 국가 코드 목록 '|KR|FR|' (미지정은 '|__NONE__|'). 국가 컬럼 필터가 이 값으로 판정한다.
        { fieldName: 'countryCds', dataType: 'text' },
        { fieldName: 'url', dataType: 'text' },
        { fieldName: 'attachCnt', dataType: 'number' },
        { fieldName: 'conflictCnt', dataType: 'number' },
        { fieldName: 'versionNo', dataType: 'number' },
        { fieldName: 'effectiveDt', dataType: 'text' },
        { fieldName: 'modDt', dataType: 'text' }
      ]
    }
  },
  computed: {
    records() {
      return this.store.records
    },
    histories() {
      return this.store.histories
    },
    conflicts() {
      return this.store.conflicts
    },
    gridColumns() {
      return [
        {
          name: 'statusCd',
          fieldName: 'statusCd',
          width: '80',
          header: { text: '상태' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const code = model?.value || 'DRAFT'
              const [bg, fg] = STATUS_STYLE[code] || STATUS_STYLE.DRAFT
              const name = (statusCodes.find((s) => s.code === code) || {}).name || code
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:${bg};color:${fg};font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;">${name}</span></div>`
            }
          }
        },
        { name: 'regNo', fieldName: 'regNo', width: '120', header: { text: '규제번호' }, styles: { textAlignment: 'center' } },
        { name: 'title', fieldName: 'title', width: '260', header: { text: '규제명' }, styles: { textAlignment: 'near' } },
        { name: 'itemTxt', fieldName: 'itemTxt', width: '280', header: { text: '정보관리항목' }, styles: { textAlignment: 'near' } },
        { name: 'itemCnt', fieldName: 'itemCnt', width: '70', header: { text: '항목수' }, numberFormat: '#,##0', styles: { textAlignment: 'center' } },
        { name: 'fieldNm', fieldName: 'fieldNm', width: '100', header: { text: '분야' }, styles: { textAlignment: 'center' } },
        { name: 'markNm', fieldName: 'markNm', width: '170', header: { text: '인증마크/표시' }, styles: { textAlignment: 'near' } },
        // RealGrid2 는 columns 안에 columns 를 넣는 그룹을 만들지 않는다(자식 컬럼이 아예 안 생긴다).
        // 컬럼은 평평하게 두고, "적용 제품 / 적용 지역" 헤더 묶음은 onGridInit 의 setColumnLayout 이 만든다.
        { name: 'divisionTxt', fieldName: 'divisionTxt', width: '110', header: { text: '사업부' }, styles: { textAlignment: 'center' } },
        { name: 'productGroupTxt', fieldName: 'productGroupTxt', width: '100', header: { text: '제품군' }, styles: { textAlignment: 'center' } },
        { name: 'productTxt', fieldName: 'productTxt', width: '130', header: { text: '제품' }, styles: { textAlignment: 'center' } },
        { name: 'regionTxt', fieldName: 'regionTxt', width: '100', header: { text: '권역' }, styles: { textAlignment: 'center' } },
        { name: 'countryTxt', fieldName: 'countryTxt', width: '120', header: { text: '국가' }, styles: { textAlignment: 'center' } },
        {
          name: 'url',
          fieldName: 'url',
          width: '80',
          header: { text: 'URL' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const url = model?.value
              if (!url) return ''
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><a href="${url}" target="_blank" rel="noopener" style="color:#0d6efd;text-decoration:none;">바로가기 <i class="bi bi-box-arrow-up-right"></i></a></div>`
            }
          }
        },
        {
          name: 'attachCnt',
          fieldName: 'attachCnt',
          width: '70',
          header: { text: '첨부' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const n = Number(model?.value || 0)
              if (!n) return '<div style="text-align:center;color:#adb5bd;">-</div>'
              return `<div style="text-align:center;"><i class="bi bi-paperclip"></i> ${n}</div>`
            }
          }
        },
        {
          name: 'conflictCnt',
          fieldName: 'conflictCnt',
          width: '80',
          header: { text: '충돌' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const n = Number(model?.value || 0)
              if (!n) return '<div style="text-align:center;color:#adb5bd;">-</div>'
              return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><span style="background:#fff3cd;color:#a1690a;border:1px solid #ffe69c;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">${n}건</span></div>`
            }
          }
        },
        { name: 'versionNo', fieldName: 'versionNo', width: '70', header: { text: '버전' }, numberFormat: '#,##0', styles: { textAlignment: 'center' } },
        { name: 'effectiveDt', fieldName: 'effectiveDt', width: '100', header: { text: '시행일' }, styles: { textAlignment: 'center' } },
        { name: 'modDt', fieldName: 'modDt', width: '110', header: { text: '최종수정일' }, styles: { textAlignment: 'center' } }
      ]
    },
    filteredRecords() {
      const f = this.appliedFilters
      if (!f) return this.records

      const kw = (f.keyword || '').trim().toLowerCase()
      return this.records.filter((r) => {
        if (kw) {
          const hay = [
            r.regNo,
            r.title,
            r.markNm,
            itemSummary(this.store.itemsOf(r.regInfoId))
          ].join(' ').toLowerCase()
          if (!hay.includes(kw)) return false
        }
        if (f.fieldCd && r.fieldCd !== f.fieldCd) return false
        if (f.statusCd && r.statusCd !== f.statusCd) return false
        if (f.regionCd && !this.hasTarget(r, 'REGION', f.regionCd)) return false
        if (f.countryCd && !this.hasTarget(r, 'COUNTRY', f.countryCd)) return false
        if (f.regulationCd && !this.hasItem(r, 'REGULATION', f.regulationCd)) return false
        if (f.divisionCd && !this.hasTarget(r, 'DIVISION', f.divisionCd)) return false
        if (f.productGroupCd && !this.hasTarget(r, 'PRODUCT_GROUP', f.productGroupCd)) return false
        if (f.productCd && !this.hasTarget(r, 'PRODUCT', f.productCd)) return false
        if (f.effectiveFrom && this.toDateStr(r.effectiveDt) < this.toDateStr(f.effectiveFrom)) return false
        if (f.effectiveTo && this.toDateStr(r.effectiveDt) > this.toDateStr(f.effectiveTo)) return false
        if (f.onlyConflict && this.conflictCountOf(r.regInfoId) === 0) return false
        return true
      })
    },
    /**
     * 칩 목록은 조회 결과(filteredRecords) 기준 건수로 만든다.
     * 한 레코드가 여러 국가에 걸치면 각 국가에 한 번씩 센다.
     * 재조회로 0건이 된 칩도 선택돼 있으면 남겨서 해제할 수 있게 한다.
     */
    countryChipOptions() {
      const counts = {}
      let noneCnt = 0
      this.filteredRecords.forEach((r) => {
        const codes = (r.targets || []).filter((tg) => tg.targetType === 'COUNTRY').map((tg) => tg.targetCd)
        if (codes.length === 0) noneCnt++
        new Set(codes).forEach((cd) => { counts[cd] = (counts[cd] || 0) + 1 })
      })
      const opts = countryCodes
        .filter((c) => counts[c.code] || this.countryChips.includes(c.code))
        .map((c) => ({ code: c.code, name: c.name, count: counts[c.code] || 0, parentCd: c.parentCd }))
        // 건수 많은 순. 같으면 코드 테이블 순서(권역별)를 유지한다(sort 는 안정 정렬)
        .sort((a, b) => b.count - a.count)
      // parentCd 가 없으므로 필터 바는 이 칩을 '국가' 로 세지 않고 '미지정' 묶음에 둔다
      if (noneCnt || this.countryChips.includes(NO_COUNTRY)) {
        opts.push({ code: NO_COUNTRY, name: '국가 미지정', count: noneCnt, parentCd: null })
      }
      return opts
    },
    currentVariantDesc() {
      return (FILTER_VARIANTS.find((v) => v.key === this.filterVariant) || {}).desc
    },
    gridRows() {
      return this.filteredRecords.map((r) => ({
        regInfoId: r.regInfoId,
        statusCd: r.statusCd,
        regNo: r.regNo,
        title: r.title,
        itemTxt: itemSummary(this.store.itemsOf(r.regInfoId)),
        itemCnt: this.store.itemsOf(r.regInfoId).length,
        fieldNm: this.fieldName(r.fieldCd),
        markNm: r.markNm,
        divisionTxt: this.summarize(targetNames(r, 'DIVISION')),
        productGroupTxt: this.summarize(targetNames(r, 'PRODUCT_GROUP')),
        productTxt: this.summarize(targetNames(r, 'PRODUCT')) || '전체',
        regionTxt: this.summarize(targetNames(r, 'REGION')),
        countryTxt: this.summarize(targetNames(r, 'COUNTRY')) || '전체',
        countryCds: this.countryCdsOf(r),
        url: r.url,
        attachCnt: r.attachCnt,
        conflictCnt: this.conflictCountOf(r.regInfoId),
        versionNo: r.versionNo,
        effectiveDt: r.effectiveDt,
        modDt: r.modDt
      }))
    },
    selectedRecord() {
      return this.records.find((r) => r.regInfoId === this.selectedRegInfoId) || null
    },
    recordHistories() {
      if (!this.selectedRecord) return []
      return this.histories
        .filter((h) => h.regInfoId === this.selectedRecord.regInfoId)
        .sort((a, b) => b.versionNo - a.versionNo)
    },
    recordConflicts() {
      if (!this.selectedRecord) return []
      const id = this.selectedRecord.regInfoId
      return this.conflicts.filter((c) => c.newRegInfoId === id || c.existRegInfoId === id)
    },
    filteredCountryCodes() {
      if (!this.filters.regionCd) return countryCodes
      return countryCodes.filter((c) => c.parentCd === this.filters.regionCd)
    },
    filteredProductGroupCodes() {
      if (!this.filters.divisionCd) return productGroupCodes
      return productGroupCodes.filter((pg) => pg.parentCd === this.filters.divisionCd)
    },
    filteredProductCodes() {
      if (!this.filters.productGroupCd) return productCodes
      return productCodes.filter((p) => p.parentCd === this.filters.productGroupCd)
    }
  },
  watch: {
    // 재조회로 행이 바뀌면 그리드가 setRows 한 뒤(필터 재적용 후) 건수를 다시 센다
    gridRows() {
      this.$nextTick(() => this.syncGridCount())
    }
  },
  created() {
    // 수정 페이지에서 돌아온 경우 검색조건을 복원한다
    const ctx = this.store.listContext
    if (ctx.filters) {
      this.filters = { ...ctx.filters }
      this.appliedFilters = { ...ctx.filters }
      this.selectedRegInfoId = ctx.selectedRegInfoId
    }
    if (ctx.countryChips) this.countryChips = [...ctx.countryChips]
  },
  methods: {
    /* ---------------- 그리드 ---------------- */
    gridToast(message, opts = {}) {
      showToast(message, opts)
    },
    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      // 행 높이는 RealGridCommonJs 의 rowHeight prop 이 정한다(기본 32).
      // 예전엔 여기서 30 으로 덮었는데, CSS 가 만든 셀 높이와 어긋나 셀렉터가 밀렸다.
      // 바꿔야 하면 <RealGridCommonJs :row-height="..."> 로 준다.
      gridView.onCurrentRowChanged = (grid, oldRow, newRow) => {
        const row = dataProvider.getJsonRow(newRow)
        this.selectedRegInfoId = row ? row.regInfoId : null
      }
      gridView.onCellDblClicked = () => {
        if (this.selectedRegInfoId) this.openEdit()
      }

      gridView.setColumnLayout(COLUMN_LAYOUT)

      this.setupCountryFilters()
      // 헤더 필터 드롭다운에서 바꿔도 칩이 따라오게 한다
      gridView.onFilteringChanged = (grid, column) => {
        if (this.applyingChips || column?.name !== COUNTRY_COL) return
        this.countryChips = grid.getActiveColumnFilters(COUNTRY_COL).map((f) => f.name)
        this.syncGridCount()
      }
      // 목록에서 돌아온 경우 복원된 칩을 그리드에 반영
      this.applyCountryChips()
    },
    /**
     * 국가마다 컬럼 필터를 하나씩 등록해 둔다(기본 비활성).
     * 같은 컬럼의 필터끼리는 OR 이라 여러 국가를 켜면 "이 중 하나라도 적용" 이 된다.
     */
    setupCountryFilters() {
      const defs = [
        ...countryCodes.map((c) => ({ name: c.code, text: c.name })),
        { name: NO_COUNTRY, text: '국가 미지정' }
      ]
      this.gridView.setColumnFilters(
        COUNTRY_COL,
        defs.map((d) => ({
          ...d,
          callback: (ds, dataRow) => String(ds.getValue(dataRow, 'countryCds') || '').includes(`|${d.name}|`)
        }))
      )
    },
    applyCountryChips() {
      const gv = this.gridView
      if (!gv) return
      const codes = [...this.countryChips]
      // activate 호출이 onFilteringChanged 를 부르더라도 칩을 되덮지 않게 막는다
      this.applyingChips = true
      try {
        gv.activateAllColumnFilters(COUNTRY_COL, false)
        if (codes.length) gv.activateColumnFilters(COUNTRY_COL, codes, true)
      } finally {
        this.applyingChips = false
      }
      this.syncGridCount()
    },
    /** 필터·정렬이 반영된 화면 순서대로 regInfoId 를 뽑는다 (그룹 헤더 행은 제외) */
    visibleRegInfoIds() {
      const gv = this.gridView
      if (!gv) return this.gridRows.map((r) => r.regInfoId)
      const ids = []
      for (let i = 0, n = gv.getItemCount(); i < n; i++) {
        const dataRow = gv.getDataRow(i)
        if (dataRow >= 0) ids.push(this.dataProvider.getValue(dataRow, 'regInfoId'))
      }
      return ids
    },
    syncGridCount() {
      this.gridCount = this.visibleRegInfoIds().length
    },
    countryCdsOf(record) {
      const codes = (record.targets || []).filter((tg) => tg.targetType === 'COUNTRY').map((tg) => tg.targetCd)
      return `|${(codes.length ? codes : [NO_COUNTRY]).join('|')}|`
    },
    exportExcel() {
      if (!this.gridView) return
      this.gridView.exportGrid({ type: 'excel', target: 'local', fileName: '규제정보_목록.xlsx' })
    },

    /* ---------------- 검색 ---------------- */
    search() {
      this.appliedFilters = { ...this.filters }
      showToast(`조회 완료 (${this.gridRows.length}건)`, { type: 'success' })
    },
    resetFilters() {
      this.filters = {
        keyword: '', fieldCd: '', regionCd: '', countryCd: '', regulationCd: '',
        divisionCd: '', productGroupCd: '', productCd: '', statusCd: '',
        effectiveFrom: '', effectiveTo: '', onlyConflict: false
      }
      this.appliedFilters = null
      this.countryChips = []
      this.applyCountryChips()
    },
    /** 필터 바가 넘긴 선택값을 그대로 그리드 컬럼 필터에 반영 */
    setCountryChips(codes) {
      this.countryChips = [...codes]
      this.applyCountryChips()
    },
    setFilterVariant(key) {
      this.filterVariant = key
      try {
        localStorage.setItem(VARIANT_KEY, key)
      } catch (e) { /* 저장 못 해도 이번 화면에서는 동작 */ }
    },
    hasTarget(record, targetType, code) {
      return (record.targets || []).some((tg) => tg.targetType === targetType && tg.targetCd === code)
    },
    /** 규제/규격/인증서는 적용대상이 아니라 정보관리항목에 있다 */
    hasItem(record, itemTypeCd, code) {
      return this.store
        .itemsOf(record.regInfoId)
        .some((it) => it.itemTypeCd === itemTypeCd && it.itemCd === code)
    },
    conflictCountOf(regInfoId) {
      return this.conflicts.filter((c) => c.newRegInfoId === regInfoId || c.existRegInfoId === regInfoId).length
    },
    toDateStr(v) {
      if (!v) return ''
      if (typeof v === 'string') return v.slice(0, 10)
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return ''
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    },
    summarize(names) {
      if (!names || names.length === 0) return ''
      if (names.length === 1) return names[0]
      return `${names[0]} 외 ${names.length - 1}`
    },

    /* ---------------- 코드명 ---------------- */
    fieldName(code) {
      return (fieldCodes.find((f) => f.code === code) || {}).name || code
    },
    openUrl(url) {
      if (url) window.open(url, '_blank', 'noopener')
    },

    /* ---------------- 목록 컨텍스트 ---------------- */
    /**
     * 페이지로 넘어가기 전에 목록의 상태를 스토어에 남긴다.
     * 팝업일 때는 공짜로 유지되던 것들이라 페이지 전환에서는 직접 넘겨야 한다.
     *   - filters       : 뒤로가기 시 검색조건 복원
     *   - orderedIds    : 수정 화면의 "◀ 12 / 47 ▶" 레코드 이동
     *
     * 수정 화면 좌측 트리의 계층(규제 > 규격 > 인증서)은 PARENT_ITEM_ID 로
     * 데이터에 들어 있으므로, 그룹핑 축을 따로 넘겨줄 필요가 없다.
     */
    saveListContext() {
      this.store.setListContext({
        filters: { ...this.filters },
        countryChips: [...this.countryChips],
        orderedIds: this.visibleRegInfoIds(),
        selectedRegInfoId: this.selectedRegInfoId
      })
    },
    goEditPage(name, params) {
      this.saveListContext()
      this.$router.push({ name, params })
    },

    /* ---------------- 등록/수정/상세 (전부 페이지로) ---------------- */
    openCreate() {
      this.goEditPage('RegulationInfoCreate')
    },
    openDetail() {
      const r = this.selectedRecord
      if (r) this.goEditPage('RegulationInfoView', { regInfoId: r.regInfoId })
    },
    openEdit() {
      const r = this.selectedRecord
      if (r) this.goEditPage('RegulationInfoEdit', { regInfoId: r.regInfoId })
    },
    /** 이력은 상세 화면 우측 패널에서 본다 */
    openHistory() {
      const r = this.selectedRecord
      if (r) this.goEditPage('RegulationInfoView', { regInfoId: r.regInfoId })
    },
    removeRecord() {
      const r = this.selectedRecord
      if (!r) return
      if (!window.confirm(`${r.regNo} 를 폐지 처리하시겠습니까? (물리 삭제 없이 상태만 변경)`)) return
      this.store.expireRecord(r.regInfoId)
      showToast(`${r.regNo} 폐지 처리`, { type: 'success' })
    }
  }
}
</script>

<style scoped>
.ui-mode-toggle {
  display: inline-flex;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 5px;
  overflow: hidden;
}

.ui-mode-toggle button {
  border: 0;
  background: transparent;
  font-size: 11px;
  padding: 3px 9px;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.ui-mode-toggle button.on {
  background: var(--b2b-color-primary, #0d6efd);
  color: #fff;
  font-weight: 600;
}

/* ---- 국가 필터 디자인 비교 스위치 (임시) ---- */
.design-switch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.reg-page :deep(.multi-select) {
  width: 100%;
}

.form-label-sm {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: var(--b2b-space-2);
  color: var(--b2b-color-text-primary, #212529);
}

/* ---- 모달 ---- */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1080;
}

.modal-box {
  width: min(920px, 94vw);
  max-height: 88vh;
  background: var(--b2b-color-bg-card, #fff);
  border-radius: 10px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-lg-box {
  width: min(1120px, 96vw);
}

.modal-head {
  display: flex;
  align-items: center;
  gap: var(--b2b-space-1);
  padding: var(--b2b-space-3) var(--b2b-space-4);
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.modal-body-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--b2b-space-4);
}

.modal-foot {
  display: flex;
  align-items: center;
  gap: var(--b2b-space-2);
  padding: 10px var(--b2b-space-4);
  border-top: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.btn-compact {
  padding: 2px var(--b2b-space-2);
  font-size: 12px;
}

/* ---- 충돌 검사 ---- */
.conflict-summary {
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-left: 4px solid var(--b2b-color-primary);
  border-radius: 6px;
  padding: 10px var(--b2b-space-3);
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.conflict-table th {
  font-size: 12px;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
  white-space: nowrap;
}

.conflict-table td {
  vertical-align: top;
}

/* ---- 첨부 ---- */
.attach-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--b2b-space-2);
  border: 1px dashed var(--b2b-color-border, #dee2e6);
  border-radius: 6px;
  padding: var(--b2b-space-2);
  min-height: 46px;
}

.attach-chip {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  background: var(--b2b-color-bg-subcard, #f1f3f5);
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 14px;
  padding: 3px 10px;
}

.attach-chip .bi-x {
  cursor: pointer;
}
</style>
