<template>
  <div class="reg-master-form">
    <div class="row gx-3 gy-3">
      <div class="col-12 col-md-8">
        <label class="form-label-sm">규제 제목 <span class="text-danger">*</span></label>
        <input v-model="form.title" :readonly="readonly" class="form-control form-control-sm" placeholder="예: KC 안전확인 (전기용품 및 생활용품 안전관리법)" />
        <div v-if="diff && diff.title !== form.title" class="diff-old">{{ diff.title }}</div>
      </div>
      <div class="col-6 col-md-4">
        <label class="form-label-sm">분야 <span class="text-danger">*</span></label>
        <select v-model="form.fieldCd" :disabled="readonly" class="form-select form-select-sm">
          <option v-for="f in fieldCodes" :key="f.code" :value="f.code">{{ f.name }}</option>
        </select>
      </div>

      <!--
        규제 / 규격 / 인증서는 정보관리항목(REG_INFO_ITEM)으로 옮겨갔다.
        여기 남는 것은 "누구에게 / 어디에" 적용되는지(적용대상)뿐이다.
      -->
      <!-- ===== GEO 축 ===== -->
      <div class="col-12">
        <div ref="axis-GEO" class="axis-block" :class="{ hit: hitAxes.includes('GEO') }">
          <div class="axis-head">
            <i class="bi bi-globe2 me-1"></i>적용 지역
            <span v-if="hitAxes.includes('GEO')" class="b2b-badge b2b-badge-warning ms-2">충돌 유발</span>
          </div>
          <div class="row gx-3 gy-2">
            <div class="col-12 col-md-6">
              <label class="form-label-sm">권역 <span class="text-muted">(멀티)</span></label>
              <MultiSelect v-model="form.regionCds" :options="regionCodes" label-key="name" value-key="code" placeholder="권역 선택" :disabled="readonly" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label-sm">국가 <span class="text-muted">(미선택 시 권역 전체)</span></label>
              <MultiSelect v-model="form.countryCds" :options="countryOptions" label-key="name" value-key="code" placeholder="국가 선택" :disabled="readonly" />
            </div>
          </div>
        </div>
      </div>

      <!-- ===== ORG 축 ===== -->
      <div class="col-12">
        <div ref="axis-ORG" class="axis-block" :class="{ hit: hitAxes.includes('ORG') }">
          <div class="axis-head">
            <i class="bi bi-boxes me-1"></i>적용 제품
            <span v-if="hitAxes.includes('ORG')" class="b2b-badge b2b-badge-warning ms-2">충돌 유발</span>
          </div>
          <div class="row gx-3 gy-2">
            <div class="col-12 col-md-4">
              <label class="form-label-sm">사업부</label>
              <MultiSelect v-model="form.divisionCds" :options="divisionCodes" label-key="name" value-key="code" placeholder="사업부 선택" :disabled="readonly" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label-sm">제품군</label>
              <MultiSelect v-model="form.productGroupCds" :options="productGroupOptions" label-key="name" value-key="code" placeholder="제품군 선택" :disabled="readonly" />
            </div>
            <div class="col-12 col-md-4">
              <label class="form-label-sm">제품 <span class="text-muted">(미선택 시 전체)</span></label>
              <MultiSelect v-model="form.productCds" :options="productOptions" label-key="name" value-key="code" placeholder="제품 선택" :disabled="readonly" />
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 부가 정보 ===== -->
      <div class="col-12 col-md-6">
        <label class="form-label-sm">인증마크 / 표시</label>
        <input v-model="form.markNm" :readonly="readonly" class="form-control form-control-sm" placeholder="예: KC 마크 + 안전확인신고번호" />
      </div>
      <div class="col-12 col-md-6">
        <label class="form-label-sm">소관 기관</label>
        <input v-model="form.authority" :readonly="readonly" class="form-control form-control-sm" placeholder="예: 국가기술표준원(KATS)" />
      </div>

      <div class="col-12">
        <label class="form-label-sm">근거 URL</label>
        <div class="input-group input-group-sm">
          <span class="input-group-text"><i class="bi bi-link-45deg"></i></span>
          <input v-model="form.url" :readonly="readonly" class="form-control form-control-sm" placeholder="https://" />
          <button type="button" class="btn btn-outline-secondary" :disabled="!form.url" @click="openUrl(form.url)">열기</button>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <label class="form-label-sm">시행일</label>
        <B2bDatePicker v-model="form.effectiveDt" placeholder="YYYY-MM-DD" :enable-time-picker="false" :show-presets="true" :disabled="readonly" />
      </div>
      <div class="col-12 col-md-6">
        <label class="form-label-sm">상태</label>
        <select v-model="form.statusCd" :disabled="readonly" class="form-select form-select-sm">
          <option v-for="s in statusCodes" :key="s.code" :value="s.code">{{ s.name }}</option>
        </select>
      </div>

      <div class="col-12">
        <label class="form-label-sm">요약 / 준수 요건</label>
        <textarea v-model="form.summary" :readonly="readonly" rows="3" class="form-control form-control-sm" placeholder="시험 → 신고 → 표시 등 실무 절차 요약"></textarea>
      </div>

      <div class="col-12">
        <label class="form-label-sm">첨부 <span class="text-muted">(파일 관리 모듈의 파일그룹으로 연계)</span></label>
        <div class="attach-box">
          <div v-for="file in form.attachFiles" :key="file.fileId" class="attach-chip">
            <i class="bi bi-paperclip me-1"></i>{{ file.fileNm }}
            <span class="text-muted ms-1">{{ file.size }}</span>
            <i v-if="!readonly" class="bi bi-x ms-1 text-danger" @click="$emit('remove-attach', file.fileId)"></i>
          </div>
          <button v-if="!readonly" type="button" class="btn-b2b-action btn-compact" @click="$emit('add-attach')">
            <i class="bi bi-upload me-1"></i>파일 추가
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MultiSelect from '@/components/MultiSelect.vue'
import B2bDatePicker from '@/components/common/B2bDatePicker.vue'
import {
  fieldCodes,
  divisionCodes,
  productGroupCodes,
  productCodes,
  regionCodes,
  countryCodes,
  statusCodes
} from '@/data/regulationMock'

export default {
  name: 'RegMasterForm',
  components: { MultiSelect, B2bDatePicker },
  props: {
    /**
     * 부모가 소유한 폼 객체. 자식은 속성만 수정한다(참조 재할당 없음).
     * 필드 수가 많아 이벤트로 되돌리는 비용이 커서 이렇게 둔다.
     */
    form: { type: Object, required: true },
    /** 충돌을 유발한 축 키 배열 ('GEO' | 'ORG' | 'RULE') */
    hitAxes: { type: Array, default: () => [] },
    /** 변경이력 비교 대상 스냅샷 (없으면 diff 미표시) */
    diff: { type: Object, default: null },
    readonly: { type: Boolean, default: false }
  },
  emits: ['add-attach', 'remove-attach'],
  data() {
    return { fieldCodes, divisionCodes, regionCodes, statusCodes }
  },
  computed: {
    productGroupOptions() {
      if (!this.form.divisionCds.length) return productGroupCodes
      return productGroupCodes.filter((pg) => this.form.divisionCds.includes(pg.parentCd))
    },
    productOptions() {
      if (!this.form.productGroupCds.length) return productCodes
      return productCodes.filter((p) => this.form.productGroupCds.includes(p.parentCd))
    },
    countryOptions() {
      if (!this.form.regionCds.length) return countryCodes
      return countryCodes.filter((c) => this.form.regionCds.includes(c.parentCd))
    }
  },
  methods: {
    /** 우측 충돌 카드 클릭 → 원인 축 블록으로 스크롤 (부모가 ref 로 호출) */
    focusAxis(axisKey) {
      const el = this.$refs[`axis-${axisKey}`]
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('flash')
      setTimeout(() => el.classList.remove('flash'), 1200)
    },
    openUrl(url) {
      if (url) window.open(url, '_blank', 'noopener')
    }
  }
}
</script>

<style scoped>
.reg-master-form :deep(.multi-select) {
  width: 100%;
}

.form-label-sm {
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: var(--b2b-space-2);
  color: var(--b2b-color-text-primary, #212529);
}

.axis-block {
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 8px;
  padding: 10px 12px 12px;
  transition: border-color 0.2s, background 0.2s;
}

.axis-block.hit {
  border-color: #ffc107;
  background: #fffdf5;
}

.axis-block.flash {
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.35);
}

.axis-head {
  font-size: 12px;
  font-weight: 700;
  color: var(--b2b-color-text-secondary, #6c757d);
  margin-bottom: 8px;
}

.diff-old {
  margin-top: 3px;
  font-size: 11px;
  color: #adb5bd;
  text-decoration: line-through;
}

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

.btn-compact {
  padding: 2px var(--b2b-space-2);
  font-size: 12px;
}
</style>
