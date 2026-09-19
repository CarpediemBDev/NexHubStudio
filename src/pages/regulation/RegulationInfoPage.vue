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
          <label class="b2b-form-label b2b-text-sm text-theme-primary mb-2 fw-semibold">
            국가
            <span v-if="filters.countryCds.length" class="b2b-badge b2b-badge-primary ms-1">{{ filters.countryCds.length }}</span>
          </label>
          <!-- 국가는 여러 개를 고를 수 있어서 셀렉트가 값을 쥐지 않는다. 고르는 순간 조건에 더하고 다시 비운다.
               v-model 을 쓰면 값이 '' → 코드 → '' 로 제자리라 Vue 가 DOM 을 되돌리지 않아 고른 국가가 박혀 있는다 -->
          <select
            class="form-select form-select-sm bg-theme-card text-theme-primary border-theme"
            :value="''"
            @change="addCountryFromSelect"
          >
            <option value="">{{ filters.countryCds.length ? '국가 추가…' : '전체' }}</option>
            <option v-for="c in filteredCountryCodes" :key="c.code" :value="c.code">{{ c.name }}</option>
          </select>
          <!-- 아래 필터 바에서 누른 국가도 여기 태그로 들어온다. 조건이 어디에 걸렸는지 한 곳에서 보이게 -->
          <div v-if="filters.countryCds.length" class="reg-country-tags mt-1">
            <span v-for="cd in filters.countryCds" :key="cd" class="reg-country-tag">
              {{ countryName(cd) }}<i class="bi bi-x" @click="removeCountry(cd)"></i>
            </span>
          </div>
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
        <span class="b2b-badge b2b-badge-secondary">{{ listRows.length }}건</span>
        <span v-if="selectedRecord" class="b2b-text-xs text-muted ms-1">
          선택: <strong>{{ selectedRecord.regNo }}</strong> · v{{ selectedRecord.versionNo }}
        </span>

        <div class="ms-auto d-flex align-items-center gap-2">
          <!-- 보기 전환 탭: 평면(레코드 1건 = 1행) / 전개(행을 열로) -->
          <div class="view-tabs" role="tablist">
            <button
              v-for="t in VIEW_TABS"
              :key="t.key"
              type="button"
              role="tab"
              :class="{ on: viewMode === t.key }"
              :aria-selected="viewMode === t.key"
              :title="t.desc"
              @click="viewMode = t.key"
            >
              <i class="bi me-1" :class="t.icon"></i>{{ t.label }}
            </button>
          </div>
          <span class="view-tabs-sep"></span>

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

      <!-- 국가 필터 디자인 전환: 사용자가 6가지 모양 중 골라 쓴다 (선택은 localStorage 에 기억) -->
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

      <!-- 국가별 필터: 선택 국가로 목록 행을 거르고(listRows), 헤더 필터 드롭다운과도 동기화한다 -->
      <CountryFilterBar
        :variant="filterVariant"
        :options="countryChipOptions"
        :selected="filters.countryCds"
        :total-count="recordsBeforeCountry.length"
        :regions="regionCodes"
        @update:selected="setCountryChips"
      />

      <div class="b2b-card-body p-2">
        <RealGridCommonJs
          v-if="viewMode === 'flat'"
          ref="grid"
          grid-id="regInfoGrid"
          height="max(700px, calc(100vh - 400px))"
          :fields="gridFields"
          :columns="gridColumns"
          :rows="pagedRows"
          :editable="false"
          :checkable="true"
          :state-bar-visible="false"
          :fixed-col-count="4"
          :sortable="true"
          :filterable="true"
          :group-panel-visible="true"
          fit-style="even"
          :toast="gridToast"
          @init="onGridInit"
        >
          <template #toolbar-right>
            <PageSizeSelect v-model="pageSize" size="sm" />
          </template>
        </RealGridCommonJs>
        <Pagination
          v-if="viewMode === 'flat'"
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="listRows.length"
          :show-size-select="false"
        />

        <!-- 전개 탭. 조회·국가칩까지 걸린 결과(listRowIds)만 서버가 펼친다 -->
        <RegulationExpandGrid
          v-else
          ref="expandGrid"
          :reg-info-ids="listRowIds"
          :selected-reg-info-id="selectedRegInfoId"
          :toast="gridToast"
          @update:selected-reg-info-id="selectedRegInfoId = $event"
          @open="openEdit"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- 3. 확정 모달 — 충돌이력을 먼저 보여주고 동의를 받는다            -->
    <!-- ============================================================ -->
    <div v-if="activateTarget" class="reg-modal-backdrop" @click.self="closeActivate">
      <div class="reg-modal b2b-card bg-theme-card border border-theme rounded-3 shadow">
        <div class="b2b-card-header bg-theme-subcard px-3 py-2 d-flex align-items-center border-bottom">
          <span class="fw-bold text-theme-primary">
            <i class="bi bi-patch-check text-primary me-1"></i>확정 (시행중으로 변경)
          </span>
          <button type="button" class="btn-close ms-auto" :disabled="activating" @click="closeActivate"></button>
        </div>

        <div class="reg-modal-body px-3 py-3">
          <div class="mb-3">
            <div class="fw-semibold text-theme-primary">{{ activateTarget.regNo }} · {{ activateTarget.title }}</div>
            <div class="b2b-text-xs text-theme-secondary mt-1">
              현재 상태 <span class="b2b-badge b2b-badge-secondary">{{ statusName(activateTarget.statusCd) }}</span>
              <i class="bi bi-arrow-right mx-1"></i>
              <span class="b2b-badge b2b-badge-success">시행중</span>
            </div>
          </div>

          <div class="b2b-text-sm fw-semibold text-theme-primary mb-2">
            이 레코드의 충돌 이력
            <span class="b2b-badge b2b-badge-secondary ms-1">{{ activateConflicts.length }}건</span>
          </div>

          <p v-if="!activateConflicts.length" class="b2b-text-sm text-theme-secondary mb-3">
            기록된 충돌이 없습니다. 이대로 확정하면 바로 시행중이 됩니다.
          </p>

          <div v-else class="table-responsive mb-3">
            <table class="table table-sm align-middle mb-0 b2b-text-xs">
              <thead>
                <tr class="text-theme-secondary">
                  <th>유형</th><th>축</th><th>상대 레코드</th><th>조치</th><th>감지일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in activateConflicts" :key="c.conflictId">
                  <td>
                    <span class="b2b-badge" :class="c.conflictType === 'SAME' ? 'b2b-badge-danger' : 'b2b-badge-warning'">
                      {{ c.typeNm }}
                    </span>
                  </td>
                  <td class="text-theme-secondary">{{ c.conflictAxis }}</td>
                  <td>
                    <div class="text-theme-primary">{{ c.otherRegNo }}</div>
                    <div class="text-theme-secondary">{{ c.otherTitle }}</div>
                  </td>
                  <td class="text-theme-secondary">{{ c.decisionNm }}</td>
                  <td class="text-theme-secondary">{{ c.detectDt }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="activateBlocking.length" class="alert alert-danger b2b-text-sm py-2 px-3 mb-0">
            <i class="bi bi-exclamation-octagon-fill me-1"></i>
            동일범위(SAME) 충돌 {{ activateBlocking.length }}건이 조치되지 않았습니다.
            같은 범위를 시행중인 레코드가 둘이 되면 어느 쪽을 따라야 할지 정해지지 않으므로 확정할 수 없습니다.
            기존 레코드를 개정하거나 흡수한 뒤 다시 시도하세요.
          </div>
          <div v-else class="alert alert-warning b2b-text-sm py-2 px-3 mb-0">
            <i class="bi bi-question-circle me-1"></i>
            위 내용을 확인했습니다. 이 규제 정보를 <strong>시행중(ACTIVE)</strong> 으로 확정하시겠습니까?
          </div>
        </div>

        <div class="px-3 py-2 border-top d-flex justify-content-end gap-2">
          <button type="button" class="btn-b2b-action" :disabled="activating" @click="closeActivate">취소</button>
          <button
            type="button"
            class="btn-b2b-primary"
            :disabled="activating || activateBlocking.length > 0"
            @click="confirmActivate"
          >
            <i class="bi bi-patch-check me-1"></i>{{ activating ? '확정 중…' : '확정' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import RealGridCommonJs from '@/components/RealGridCommonJs.vue'
import Pagination from '@/components/Pagination.vue'
import PageSizeSelect from '@/components/PageSizeSelect.vue'
import B2bDatePicker from '@/components/common/B2bDatePicker.vue'
import CountryFilterBar from './components/CountryFilterBar.vue'
import RegulationExpandGrid from './components/RegulationExpandGrid.vue'
import { showToast } from '@/utils/toastUtil.js'
import { escapeHtml } from '@/utils/stringUtil.js'
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
import { conflictTypes, decisionCodes } from '@/data/regulationMock'
import { useRegulationStore } from '@/stores/regulationStore'
import { itemSummary, itemLines } from '@/utils/regulationTree'

// 상태 → 공통 배지(b2b-badge-*). 옅은 배경 + 같은 계열 글자색이라 목록이 무겁지 않고 다크 테마도 따라간다
const STATUS_BADGE = {
  ACTIVE: 'success',
  REVIEW: 'primary',
  DRAFT: 'secondary',
  EXPIRED: 'outline'
}

const NO_COUNTRY = '__NONE__'
/**
 * 보기 전환 탭.
 *  flat   - 지금까지의 목록. 레코드 1건이 1행이라 규제/규격/관리항목·제품은 한 셀에 모인다.
 *  expand - 그 값들을 각각 열로 펴고, 같은 값이 이어지는 앞쪽 축은 세로로 묶는다.
 *           펼치기는 JOIN 이라 화면이 아니라 서버가 한다(POST /regulations/expanded).
 */
const VIEW_TABS = [
  { key: 'flat', label: '평면', icon: 'bi-list-ul', desc: '레코드 1건 = 1행. 규제·규격·관리항목과 제품은 한 셀에 모아 보여준다' },
  { key: 'expand', label: '전개', icon: 'bi-diagram-3', desc: '분야 · 규제 · 규격 · 관리항목 · 제품을 각각 열로 펴고, 같은 값은 세로로 묶는다' }
]
// 국가 필터 디자인 6종. 데이터와 그리드 필터는 같고 모양만 다르며, 사용자가 상단 스위치로 고른다
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
  'action', 'statusCd', 'regNo', 'title', 'itemTxt', 'itemCnt', 'fieldNm', 'markNm',
  { name: 'orgGroup', direction: 'horizontal', header: { text: '적용 제품' }, items: ['divisionTxt', 'productGroupTxt', 'productTxt'] },
  { name: 'geoGroup', direction: 'horizontal', header: { text: '적용 지역' }, items: ['regionTxt', COUNTRY_COL] },
  'url', 'attachCnt', 'conflictCnt', 'versionNo', 'effectiveDt', 'modDt'
]

// 긴 셀(규제명·정보관리항목·인증마크·국가)은 줄바꿈해서 CLAMP_LINES 줄까지 보이고, 넘치면 "..." + "더보기" 로 그 셀을 펼친다.
// 행 높이는 rowHeight -1(내용에 맞춤)이라 펼침/접힘에 따라 그리드가 알아서 다시 잰다.
// 줄 수는 여기 하나만 바꾼다 — "..." 위치(CSS line-clamp)도 렌더러가 이 값을 inline style 로 내려준다.
const CLAMP_LINES = 5
// 셀 좌우 padding(8px × 2, 아래 style 의 .rg-renderer) + 테두리
const CELL_PAD_X = 18
export default {
  name: 'RegulationInfoPage',
  components: { RealGridCommonJs, Pagination, PageSizeSelect, B2bDatePicker, CountryFilterBar, RegulationExpandGrid },
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
        // 국가는 여러 개. 상단 셀렉트와 국가 필터 바가 같은 이 값을 건드린다
        countryCds: [],
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
      FILTER_VARIANTS,
      filterVariant: loadVariant(),
      VIEW_TABS,
      viewMode: 'flat',
      page: 1,
      pageSize: 20,

      gridView: null,
      dataProvider: null,
      selectedRegInfoId: null,
      // 확정 모달. null 이면 닫힘
      activateTarget: null,
      activating: false,
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
          // 행마다 거는 작업. 필드는 regInfoId 를 빌려 쓴다 — 값이 아니라 대상 식별자가 필요하다
          name: 'action',
          fieldName: 'regInfoId',
          width: '118',
          header: { text: '작업' },
          styles: { textAlignment: 'center' },
          sortable: false,
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const id = Number(model?.value)
              const status = grid.getValue(model.index.itemIndex, 'statusCd')
              // 이미 시행중이거나 폐지된 건은 확정할 것이 없다
              const why = status === 'ACTIVE' ? '이미 시행중' : status === 'EXPIRED' ? '폐지된 레코드' : ''
              const fix = why
                ? `<span class="reg-act is-off" title="${escapeHtml(why)}">확정</span>`
                : `<span class="reg-act is-primary" data-act="activate" data-id="${id}">확정</span>`
              return `<span class="reg-act" data-act="detail" data-id="${id}">상세</span>${fix}`
            }
          }
        },
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
              const name = (statusCodes.find((s) => s.code === code) || {}).name || code
              return `<span class="b2b-badge b2b-badge-${STATUS_BADGE[code] || 'secondary'}">${escapeHtml(name)}</span>`
            }
          }
        },
        { name: 'regNo', fieldName: 'regNo', width: '120', header: { text: '규제번호' }, styles: { textAlignment: 'center' } },
        { name: 'title', fieldName: 'title', width: '240', header: { text: '규제명' }, renderer: this.wrapRenderer() },
        { name: 'itemTxt', fieldName: 'itemTxt', width: '260', header: { text: '정보관리항목' }, renderer: this.wrapRenderer() },
        { name: 'itemCnt', fieldName: 'itemCnt', width: '64', header: { text: '항목수' }, numberFormat: '#,##0', styles: { textAlignment: 'center' } },
        { name: 'fieldNm', fieldName: 'fieldNm', width: '90', header: { text: '분야' }, styles: { textAlignment: 'center' } },
        { name: 'markNm', fieldName: 'markNm', width: '150', header: { text: '인증마크/표시' }, renderer: this.wrapRenderer() },
        // RealGrid2 는 columns 안에 columns 를 넣는 그룹을 만들지 않는다(자식 컬럼이 아예 안 생긴다).
        // 컬럼은 평평하게 두고, "적용 제품 / 적용 지역" 헤더 묶음은 onGridInit 의 setColumnLayout 이 만든다.
        { name: 'divisionTxt', fieldName: 'divisionTxt', width: '100', header: { text: '사업부' }, styles: { textAlignment: 'center' } },
        { name: 'productGroupTxt', fieldName: 'productGroupTxt', width: '100', header: { text: '제품군' }, styles: { textAlignment: 'center' } },
        { name: 'productTxt', fieldName: 'productTxt', width: '120', header: { text: '제품' }, styles: { textAlignment: 'center' } },
        { name: 'regionTxt', fieldName: 'regionTxt', width: '80', header: { text: '권역' }, styles: { textAlignment: 'center' } },
        { name: 'countryTxt', fieldName: 'countryTxt', width: '120', header: { text: '국가' }, renderer: this.wrapRenderer() },
        {
          name: 'url',
          fieldName: 'url',
          width: '100',
          header: { text: 'URL' },
          styles: { textAlignment: 'center' },
          renderer: {
            type: 'html',
            callback: (grid, model) => {
              const url = model?.value
              if (!url) return '<span class="reg-empty">-</span>'
              return `<a class="reg-link" href="${url}" target="_blank" rel="noopener">바로가기 <i class="bi bi-box-arrow-up-right"></i></a>`
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
              if (!n) return '<span class="reg-empty">-</span>'
              return `<i class="bi bi-paperclip"></i> ${n}`
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
              if (!n) return '<span class="reg-empty">-</span>'
              return `<span class="b2b-badge b2b-badge-warning">${n}건</span>`
            }
          }
        },
        { name: 'versionNo', fieldName: 'versionNo', width: '60', header: { text: '버전' }, numberFormat: '#,##0', styles: { textAlignment: 'center' } },
        { name: 'effectiveDt', fieldName: 'effectiveDt', width: '96', header: { text: '시행일' }, styles: { textAlignment: 'center' } },
        { name: 'modDt', fieldName: 'modDt', width: '96', header: { text: '최종수정일' }, styles: { textAlignment: 'center' } }
      ]
    },
    /**
     * 국가를 뺀 나머지 조건까지 걸린 목록.
     * 국가 칩의 건수를 이걸로 센다 — 국가까지 걸고 세면 고른 국가만 남고
     * 나머지 칩이 전부 0 건이 되어 다른 국가로 갈아탈 수가 없다.
     */
    recordsBeforeCountry() {
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
    /** 국가 조건까지 걸린 최종 조회 결과. 국가는 여러 개면 OR */
    filteredRecords() {
      const cds = (this.appliedFilters && this.appliedFilters.countryCds) || []
      if (!cds.length) return this.recordsBeforeCountry
      return this.recordsBeforeCountry.filter((r) => cds.some((cd) => this.matchCountry(r, cd)))
    },
    /**
     * 칩 목록은 국가 직전까지 걸린 결과(recordsBeforeCountry) 기준 건수로 만든다.
     * 한 레코드가 여러 국가에 걸치면 각 국가에 한 번씩 센다.
     * 재조회로 0건이 된 칩도 선택돼 있으면 남겨서 해제할 수 있게 한다.
     */
    countryChipOptions() {
      const counts = {}
      let noneCnt = 0
      this.recordsBeforeCountry.forEach((r) => {
        const codes = (r.targets || []).filter((tg) => tg.targetType === 'COUNTRY').map((tg) => tg.targetCd)
        if (codes.length === 0) noneCnt++
        new Set(codes).forEach((cd) => { counts[cd] = (counts[cd] || 0) + 1 })
      })
      const opts = countryCodes
        .filter((c) => counts[c.code] || this.filters.countryCds.includes(c.code))
        .map((c) => ({ code: c.code, name: c.name, count: counts[c.code] || 0, parentCd: c.parentCd }))
        // 건수 많은 순. 같으면 코드 테이블 순서(권역별)를 유지한다(sort 는 안정 정렬)
        .sort((a, b) => b.count - a.count)
      // parentCd 가 없으므로 필터 바는 이 칩을 '국가' 로 세지 않고 '미지정' 묶음에 둔다
      if (noneCnt || this.filters.countryCds.includes(NO_COUNTRY)) {
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
        itemTxt: itemLines(this.store.itemsOf(r.regInfoId)),
        itemCnt: this.store.itemsOf(r.regInfoId).length,
        fieldNm: this.fieldName(r.fieldCd),
        markNm: r.markNm,
        divisionTxt: this.summarize(targetNames(r, 'DIVISION')),
        productGroupTxt: this.summarize(targetNames(r, 'PRODUCT_GROUP')),
        productTxt: this.summarize(targetNames(r, 'PRODUCT')) || '전체',
        regionTxt: this.summarize(targetNames(r, 'REGION')),
        countryTxt: targetNames(r, 'COUNTRY').join(', ') || '전체',
        countryCds: this.countryCdsOf(r),
        url: r.url,
        attachCnt: r.attachCnt,
        conflictCnt: this.conflictCountOf(r.regInfoId),
        versionNo: r.versionNo,
        effectiveDt: r.effectiveDt,
        modDt: r.modDt
      }))
    },
    /**
     * 전체 목록. 국가는 조회 조건(filteredRecords)에서 이미 걸렸으므로 여기서 또 거르지 않는다.
     * 그리드 컬럼 필터는 헤더 드롭다운 표시를 조건과 맞추기 위해 같이 켜 둘 뿐이다
     * (그리드엔 현재 페이지만 들어가서 컬럼 필터만으로는 페이지 안에서만 걸린다).
     */
    listRows() {
      return this.gridRows
    },
    pagedRows() {
      return this.listRows.slice(this.pageOffset, this.pageOffset + this.pageSize)
    },
    /** 확정 모달이 보여줄 충돌이력 */
    activateConflicts() {
      return this.activateTarget ? this.conflictRowsOf(this.activateTarget.regInfoId) : []
    },
    /** 확정을 막는 것 = 조치되지 않은 동일범위 충돌 */
    activateBlocking() {
      return this.activateConflicts.filter((c) => c.conflictType === 'SAME' && c.statusCd !== 'RESOLVED')
    },
    /** 전개 탭에 넘길 대상. 그리드가 아니라 조회 결과 전체 기준이다(페이징은 전개 쪽이 따로 한다) */
    listRowIds() {
      return this.listRows.map((r) => r.regInfoId)
    },
    pageOffset() {
      return (this.page - 1) * this.pageSize
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
    // 재조회·국가 칩 변경으로 목록이 바뀌면 1페이지부터
    listRows() {
      this.page = 1
    },
    // 행 번호가 페이지를 넘어 전체 기준(21, 22…)으로 이어지게 한다
    pageOffset(offset) {
      if (this.gridView) this.gridView.setRowIndicator({ indexOffset: offset })
    },
    /**
     * 탭을 떠나면 평면 그리드는 파괴된다. 참조와 더보기 리스너를 그대로 두면
     * 이후 호출이 죽은 그리드를 건드리므로 여기서 끊는다.
     * 돌아오면 onGridInit 이 다시 전부 걸어 준다.
     */
    viewMode(mode) {
      if (mode === 'flat') return
      if (this.unbindMoreLinks) this.unbindMoreLinks()
      this.unbindMoreLinks = null
      this.gridView = null
      this.dataProvider = null
    }
  },
  created() {
    // 서버 스냅샷 적재. 그리드 행은 store.records 를 보고 있으므로 도착하면 알아서 그려진다
    this.store.ensureLoaded()

    // 수정 페이지에서 돌아온 경우 검색조건을 복원한다
    const ctx = this.store.listContext
    if (ctx.filters) {
      this.filters = { ...ctx.filters, countryCds: [...(ctx.filters.countryCds || [])] }
      this.appliedFilters = { ...this.filters }
      this.selectedRegInfoId = ctx.selectedRegInfoId
    }
    // 펼친 셀 'regInfoId|필드명'. 누른 셀만 펼친다(같은 행의 다른 긴 셀은 접힌 채).
    // 행 순서는 페이지·정렬마다 바뀌므로 itemIndex 가 아니라 regInfoId 로 기억한다.
    // 렌더러가 읽기만 하면 되므로 반응형일 필요 없다.
    this.expandedCells = new Set()
  },
  beforeUnmount() {
    if (this.unbindMoreLinks) this.unbindMoreLinks()
  },
  methods: {
    /* ---------------- 그리드 ---------------- */
    gridToast(message, opts = {}) {
      showToast(message, opts)
    },
    onGridInit({ gridView, dataProvider }) {
      this.gridView = gridView
      this.dataProvider = dataProvider

      // 긴 셀 줄바꿈·더보기용 행 높이 설정은 여기 한곳에 모은다(다른 화면으로 옮길 때 빠지지 않게).
      // 넘긴 값만 덮어쓰므로 공통 그리드가 먼저 넣은 옵션(fitStyle 등)은 그대로 남는다.
      gridView.setDisplayOptions({
        rowHeight: -1, // 행 높이 = 그려진 셀 내용에 맞춤. CSS 나 setRowHeight 로 덮지 않는다(셀렉터가 밀림, -1 이면 무시됨)
        refCalcHeights: false, // 기본 true 면 처음 잰 높이를 재사용해 refresh() 로 펼쳐도 행이 안 커진다
        maxRowHeight: 0, // 행 높이 상한 없음 — 걸려 있으면 펼친 셀이 그 높이에서 잘린다
        minRowHeight: 40, // 한 줄짜리 행 높이
        wheelScrollLines: 1 // 기본 3행씩 넘기면 높은 행이 섞인 목록에서 휠 한 번에 화면이 크게 튄다
      })
      this.bindMoreLinks(gridView.getContainer().parentElement)

      gridView.onCurrentRowChanged = (grid, oldRow, newRow) => {
        // 행이 비면(clearRows 등) newRow 가 -1 로 온다 — getJsonRow(-1) 은 out of bounds 에러
        const row = newRow >= 0 ? dataProvider.getJsonRow(newRow) : null
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
        this.setCountryChips(grid.getActiveColumnFilters(COUNTRY_COL).map((f) => f.name))
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
      const codes = [...this.filters.countryCds]
      // activate 호출이 onFilteringChanged 를 부르더라도 칩을 되덮지 않게 막는다
      this.applyingChips = true
      try {
        gv.activateAllColumnFilters(COUNTRY_COL, false)
        if (codes.length) gv.activateColumnFilters(COUNTRY_COL, codes, true)
      } finally {
        this.applyingChips = false
      }
    },
    /* ---------------- 긴 셀: 줄바꿈 + 더보기 ---------------- */
    wrapRenderer() {
      return { type: 'html', callback: (grid, model, width) => this.renderWrapCell(grid, model, width) }
    },
    /**
     * CLAMP_LINES 줄을 넘는 셀만 말줄임 + "더보기". 펼친 셀은 전체 내용 + "접기".
     * 값은 사용자 입력(규제명·항목명)이라 html 로 끼워 넣기 전에 반드시 이스케이프한다.
     */
    renderWrapCell(grid, model, width) {
      const text = String(model.value ?? '')
      const html = escapeHtml(text)
      if (this.lineCount(text, width - CELL_PAD_X) <= CLAMP_LINES) {
        return `<div class="reg-cell"><div class="reg-wrap">${html}</div></div>`
      }
      const id = Number(grid.getValue(model.index.itemIndex, 'regInfoId'))
      const field = model.index.fieldName
      const open = this.expandedCells.has(`${id}|${field}`)
      const body = open
        ? `<div class="reg-wrap">${html}</div>`
        : `<div class="reg-wrap reg-clamp" style="-webkit-line-clamp:${CLAMP_LINES}">${html}</div>`
      return `<div class="reg-cell">${body}<span class="reg-more" data-id="${id}" data-field="${escapeHtml(field)}">${open ? '접기' : '더보기'}</span></div>`
    },
    /**
     * 셀 너비에서 몇 줄로 줄바꿈되는지 센다.
     * 렌더러는 문자열만 돌려주므로 그려진 DOM 을 잴 수 없어, 같은 폰트로 canvas 에서 글자 폭을 잰다.
     * CSS 가 word-break: break-all(글자 단위 줄바꿈)이라 글자 폭을 더해 가면 실제 줄 수와 맞는다.
     */
    lineCount(text, maxWidth) {
      if (!text) return 0
      if (!(maxWidth > 0)) return 1
      const ctx = this.measureContext()
      let lines = 0
      text.split('\n').forEach((para) => {
        lines += 1
        let acc = 0
        for (const ch of para) {
          const w = ctx.measureText(ch).width
          if (acc > 0 && acc + w > maxWidth) {
            lines += 1
            acc = 0
          }
          acc += w
        }
      })
      return lines
    },
    measureContext() {
      if (!this.measureCtx) this.measureCtx = document.createElement('canvas').getContext('2d')
      // 그리드 폰트는 테마 CSS 가 정하므로 그려진 그리드에서 읽는다(처음엔 아직 없을 수 있어 찾을 때까지 확인)
      if (!this.measureFontReady) {
        const root = this.gridView && this.gridView.getContainer().querySelector('.rg-root')
        if (root) {
          this.measureCtx.font = getComputedStyle(root).font
          this.measureFontReady = true
        }
      }
      return this.measureCtx
    },
    /**
     * 셀 안에 그려 넣은 조작(더보기/접기, 작업 컬럼의 상세·확정) 클릭 처리.
     *
     * 이것들은 그리드가 그린 DOM 안에 있어서, 그냥 두면 클릭이 그리드까지 내려가
     * 행 선택이 바뀌거나 더블클릭으로 번져 수정 화면으로 튄다.
     * 그래서 바깥 요소에서 캡처 단계로 먼저 받아 막는다.
     */
    bindMoreLinks(el) {
      const types = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'dblclick', 'touchstart']
      const handler = (e) => {
        const hit = e.target.closest && e.target.closest('.reg-more, .reg-act')
        if (!hit) return
        e.stopPropagation()
        if (e.type !== 'click') return
        if (hit.classList.contains('reg-more')) {
          this.toggleExpand(Number(hit.dataset.id), hit.dataset.field)
          return
        }
        const id = Number(hit.dataset.id)
        if (hit.dataset.act === 'detail') this.openDetailOf(id)
        if (hit.dataset.act === 'activate') this.openActivate(id)
      }
      types.forEach((t) => el.addEventListener(t, handler, true))
      this.unbindMoreLinks = () => types.forEach((t) => el.removeEventListener(t, handler, true))
    },
    toggleExpand(id, field) {
      const key = `${id}|${field}`
      if (this.expandedCells.has(key)) this.expandedCells.delete(key)
      else this.expandedCells.add(key)
      // 셀을 다시 그리면 rowHeight -1 이 바뀐 내용 높이로 행을 다시 잰다.
      this.gridView.refresh()
    },
    countryCdsOf(record) {
      const codes = (record.targets || []).filter((tg) => tg.targetType === 'COUNTRY').map((tg) => tg.targetCd)
      return `|${(codes.length ? codes : [NO_COUNTRY]).join('|')}|`
    },
    exportExcel() {
      if (this.viewMode === 'expand') {
        if (this.$refs.expandGrid) this.$refs.expandGrid.exportExcel()
        return
      }
      if (!this.gridView) return
      // 그리드엔 현재 페이지 행만 있으므로 전체 목록을 잠시 넣고 내보낸 뒤 보던 페이지로 되돌린다
      const pageRows = this.dataProvider.getJsonRows()
      const restore = () => this.dataProvider.setRows(pageRows)
      this.dataProvider.setRows(this.listRows)
      try {
        this.gridView.exportGrid({ type: 'excel', target: 'local', fileName: '규제정보_목록.xlsx', done: restore })
      } catch (e) {
        restore()
        throw e
      }
    },

    /* ---------------- 검색 ---------------- */
    search() {
      this.appliedFilters = { ...this.filters }
      showToast(`조회 완료 (${this.gridRows.length}건)`, { type: 'success' })
    },
    resetFilters() {
      this.filters = {
        keyword: '', fieldCd: '', regionCd: '', countryCds: [], regulationCd: '',
        divisionCd: '', productGroupCd: '', productCd: '', statusCd: '',
        effectiveFrom: '', effectiveTo: '', onlyConflict: false
      }
      this.appliedFilters = null
      this.applyCountryChips()
    },
    /**
     * 국가 필터 바(회전목마 등)에서 고른 값 = 국가 검색조건.
     * 조회 버튼을 기다리지 않고 누르는 즉시 조건에 넣는다 — 칩은 "눌러서 좁히는" 장치라
     * 한 번 더 조회를 눌러야 반영되면 누른 결과가 안 보여서 고장 난 것처럼 느껴진다.
     *
     * 아직 조회하지 않은 다른 폼 입력(타이핑 중인 키워드 등)까지 같이 적용되면 안 되므로
     * appliedFilters 를 통째로 갈지 않고 국가 항목만 갈아 끼운다.
     */
    setCountryChips(codes) {
      this.filters.countryCds = [...codes]
      this.appliedFilters = { ...(this.appliedFilters || {}), countryCds: [...codes] }
      this.applyCountryChips()
    },
    /** 상단 셀렉트에서 고른 국가를 조건에 더한다(중복은 무시). 셀렉트는 곧바로 제자리로 */
    addCountryFromSelect(e) {
      const cd = e.target.value
      e.target.value = ''
      if (!cd || this.filters.countryCds.includes(cd)) return
      this.setCountryChips([...this.filters.countryCds, cd])
    },
    removeCountry(cd) {
      this.setCountryChips(this.filters.countryCds.filter((c) => c !== cd))
    },
    /** 국가 미지정 칩은 코드가 아니라 "COUNTRY 타겟이 하나도 없음" 을 뜻한다 */
    matchCountry(record, code) {
      if (code === NO_COUNTRY) return !(record.targets || []).some((tg) => tg.targetType === 'COUNTRY')
      return this.hasTarget(record, 'COUNTRY', code)
    },
    countryName(code) {
      if (code === NO_COUNTRY) return '국가 미지정'
      return (countryCodes.find((c) => c.code === code) || {}).name || code
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
    statusName(code) {
      return (statusCodes.find((st) => st.code === code) || {}).name || code
    },
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
        filters: { ...this.filters, countryCds: [...this.filters.countryCds] },
        // 페이지를 넘나들며 이동해야 하므로 현재 페이지가 아닌 전체 목록 순서
        orderedIds: this.listRows.map((r) => r.regInfoId),
        selectedRegInfoId: this.selectedRegInfoId
      })
    },
    goEditPage(name, params, query) {
      this.saveListContext()
      this.$router.push({ name, params, query })
    },

    /* ---------------- 등록/수정/상세 (전부 페이지로) ---------------- */
    openCreate() {
      this.goEditPage('RegulationInfoCreate')
    },
    /** 작업 컬럼의 상세 — 행을 고르고 들어가야 돌아왔을 때 그 행이 선택돼 있다 */
    openDetailOf(regInfoId) {
      this.selectedRegInfoId = regInfoId
      this.goEditPage('RegulationInfoView', { regInfoId })
    },

    /* ---------------- 확정 ---------------- */
    /**
     * 확정 = 상태를 ACTIVE 로 올리는 것.
     * 그냥 바꾸지 않고 이 레코드에 쌓인 충돌이력을 먼저 펼쳐 보여준다 —
     * 등록 시점에 "둘 다 유지" 같은 조치로 넘어간 건들이 있고,
     * 시행중으로 올리는 순간 그 판단이 실제 규제로 굳기 때문이다.
     */
    openActivate(regInfoId) {
      const r = this.records.find((x) => x.regInfoId === regInfoId)
      if (!r) return
      this.selectedRegInfoId = regInfoId
      this.activateTarget = r
      this.activating = false
    },
    closeActivate() {
      if (this.activating) return
      this.activateTarget = null
    },
    async confirmActivate() {
      if (!this.activateTarget || this.activating) return
      this.activating = true
      try {
        const saved = await this.store.activateRecord(this.activateTarget.regInfoId)
        showToast(`${saved.regNo} 확정 완료 (시행중)`, { type: 'success' })
        this.activateTarget = null
      } catch (e) {
        // http.js 인터셉터가 서버 메시지로 토스트를 이미 띄운다. 모달은 열어 둔다
        this.activating = false
        return
      }
      this.activating = false
    },
    /** 확정 대상의 충돌이력. 상대 레코드 이름을 붙여 화면에서 바로 읽히게 한다 */
    conflictRowsOf(regInfoId) {
      return this.conflicts
        .filter((c) => c.newRegInfoId === regInfoId || c.existRegInfoId === regInfoId)
        .map((c) => {
          const otherId = c.newRegInfoId === regInfoId ? c.existRegInfoId : c.newRegInfoId
          const other = this.records.find((r) => r.regInfoId === otherId)
          return {
            ...c,
            typeNm: (conflictTypes.find((t) => t.code === c.conflictType) || {}).name || c.conflictType,
            decisionNm: (decisionCodes.find((d) => d.code === c.decisionCd) || {}).name || c.decisionCd || '미조치',
            otherRegNo: (c.newRegInfoId === regInfoId ? c.existRegNo : c.newRegNo) || (other && other.regNo) || '-',
            otherTitle: (other && other.title) || ''
          }
        })
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
      if (r) this.goEditPage('RegulationInfoView', { regInfoId: r.regInfoId }, { tab: 'history' })
    },
    async removeRecord() {
      const r = this.selectedRecord
      if (!r) return
      if (!window.confirm(`${r.regNo} 를 폐지 처리하시겠습니까? (물리 삭제 없이 상태만 변경)`)) return
      await this.store.expireRecord(r.regInfoId)
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

/* ---- 작업 컬럼의 상세/확정 버튼 (그리드가 그린 DOM 이라 :deep) ---- */
.reg-page :deep(.reg-act) {
  display: inline-block;
  margin: 0 2px;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 18px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 4px;
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-secondary, #6c757d);
  cursor: pointer;
  user-select: none;
}

.reg-page :deep(.reg-act:hover) {
  border-color: var(--b2b-color-primary, #0d6efd);
  color: var(--b2b-color-primary, #0d6efd);
}

.reg-page :deep(.reg-act.is-primary) {
  border-color: var(--b2b-color-primary, #0d6efd);
  color: var(--b2b-color-primary, #0d6efd);
  font-weight: 600;
}

/* 확정할 것이 없는 행(이미 시행중 / 폐지)은 눌리지 않는다 */
.reg-page :deep(.reg-act.is-off) {
  opacity: 0.4;
  cursor: default;
}

.reg-page :deep(.reg-act.is-off:hover) {
  border-color: var(--b2b-color-border, #dee2e6);
  color: var(--b2b-color-text-secondary, #6c757d);
}

/* ---- 확정 모달 ---- */
.reg-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1060;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.reg-modal {
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.reg-modal-body {
  overflow: auto;
}

/* ---- 검색조건에 들어간 국가 태그 ---- */
.reg-country-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.reg-country-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  line-height: 16px;
  padding: 1px 4px 1px 6px;
  border-radius: 10px;
  background: var(--b2b-color-primary-subtle, #e7f1ff);
  color: var(--b2b-color-primary, #0d6efd);
}

.reg-country-tag i {
  cursor: pointer;
  opacity: 0.65;
}

.reg-country-tag i:hover {
  opacity: 1;
}

/* ---- 보기 전환 탭 (그리드 우측 상단) ---- */
.view-tabs {
  display: inline-flex;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 6px;
  overflow: hidden;
  background: var(--b2b-color-bg-card, #fff);
}

.view-tabs button {
  border: 0;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  color: var(--b2b-color-text-secondary, #6c757d);
  white-space: nowrap;
}

.view-tabs button + button {
  border-left: 1px solid var(--b2b-color-border, #dee2e6);
}

.view-tabs button.on {
  background: var(--b2b-color-primary, #0d6efd);
  color: #fff;
  font-weight: 600;
}

.view-tabs-sep {
  width: 1px;
  height: 18px;
  background: var(--b2b-color-border, #dee2e6);
}

/* ---- 국가 필터 디자인 전환 스위치 ---- */
.design-switch {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

/* ---- 목록 그리드 (그리드가 그린 DOM 이라 :deep, 이 화면에만 적용) ---- */
/* 글자 13px + 셀 좌우 8px 여백. 폰트를 바꾸면 lineCount() 는 그리드에서 폰트를 읽으므로 따라온다 */
.reg-page :deep(.rg-root) {
  font-size: 13px !important;
}

/* 좌우 padding 을 바꾸면 스크립트의 CELL_PAD_X 도 같이 */
.reg-page :deep(.rg-data-cell .rg-renderer) {
  padding: 0 8px;
}

/* 헤더는 데이터보다 한 톤 가볍게 — 색은 grid-theme.css 의 변수 이음매로 */
.reg-page {
  --rg-header-color: var(--b2b-color-text-muted);
}

.reg-page :deep(.rg-root [class*="rg-"][class*="head"]) {
  font-weight: 500 !important;
}

.reg-page :deep(.reg-empty) {
  color: var(--b2b-color-text-faint);
}

.reg-page :deep(.reg-link) {
  color: var(--b2b-color-primary);
  text-decoration: none;
  white-space: nowrap;
}

/* ---- 긴 셀: 줄바꿈 + 더보기 ---- */
.reg-page :deep(.reg-cell) {
  text-align: left;
  padding: 6px 0;
}

/* break-all: lineCount() 가 글자 단위로 줄 수를 세므로 CSS 도 글자 단위로 끊는다 */
.reg-page :deep(.reg-wrap) {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 18px;
}

/* 몇 줄에서 자를지(-webkit-line-clamp)는 렌더러가 CLAMP_LINES 로 inline style 에 넣는다 */
.reg-page :deep(.reg-clamp) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.reg-page :deep(.reg-more) {
  display: inline-block;
  margin-top: 1px;
  font-size: 11px;
  line-height: 16px;
  color: var(--b2b-color-primary, #0d6efd);
  cursor: pointer;
}

.reg-page :deep(.reg-more:hover) {
  text-decoration: underline;
}
</style>
