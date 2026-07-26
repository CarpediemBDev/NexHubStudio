<template>
  <div class="container-fluid py-4">
    <!-- 안내 헤더 -->
    <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-subcard px-4 py-3 mb-3">
      <h5 class="b2b-text-h2 text-theme-primary mb-1 d-flex align-items-center gap-2">
        <i class="bi bi-calendar-week text-theme-accent"></i>
        DatePicker 컴포넌트 갤러리
      </h5>
      <p class="b2b-text-body text-theme-secondary mb-0">
        공통 <code>B2bDatePicker</code> 의 사용 유형을 모아둔 화면입니다. 각 카드의
        <i class="bi bi-code-slash"></i> 버튼을 누르면 그대로 복사해서 쓸 수 있는 코드가 나옵니다.
        <span class="text-theme-muted">(value 는 실시간 바인딩 값)</span>
      </p>
    </div>

    <!-- 데모 카드 그리드 -->
    <div class="row g-3">
      <div
        v-for="demo in demos"
        :key="demo.key"
        class="col-12 col-md-6 col-xxl-4"
      >
        <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-card p-3 h-100">
          <DemoField :label="demo.label" :value="demo.value()" :code="demo.code">
            <div v-if="demo.pair" class="d-flex align-items-center gap-1.5 date-range-pair">
              <B2bDatePicker v-bind="demo.propsStart" v-model="model[demo.startKey]" />
              <span class="text-theme-secondary b2b-text-sm fw-bold">~</span>
              <B2bDatePicker v-bind="demo.propsEnd" v-model="model[demo.endKey]" />
            </div>
            <B2bDatePicker v-else v-bind="demo.props" v-model="model[demo.key]" />
          </DemoField>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import B2bDatePicker from '@/components/common/B2bDatePicker.vue'
import DemoField from '@/components/common/DemoField.vue'

export default {
  name: 'DatePickerGalleryPage',
  components: { B2bDatePicker, DemoField },
  data() {
    return {
      // min/max 제약 데모용 기준일(오늘) — 매 렌더 새 Date 생성을 피하려고 1회 고정
      today: new Date(),
      // 각 데모의 v-model 저장소
      model: {
        single: '',
        pairStart: '',
        pairEnd: '',
        range: null,
        dateTime: '',
        pairDtStart: '',
        pairDtEnd: '',
        combinedSingle: '',
        combinedRange: null,
        month: '',
        year: '',
        week: null,
        weekOnly: null,
        constrained: '',
      },
    }
  },
  computed: {
    demos() {
      return [
        {
          key: 'single',
          label: '단일 날짜',
          props: { placeholder: 'YYYY-MM-DD', 'show-presets': true },
          value: () => this.model.single,
          code: `<B2bDatePicker\n  v-model="date"\n  placeholder="YYYY-MM-DD"\n  :show-presets="true"\n/>`,
        },
        {
          key: 'pair',
          label: '기간 (시작 ~ 종료 각각 선택)',
          pair: true,
          startKey: 'pairStart',
          endKey: 'pairEnd',
          propsStart: { placeholder: '시작일', 'show-presets': true },
          propsEnd: { placeholder: '종료일', 'show-presets': true },
          value: () => [this.model.pairStart, this.model.pairEnd],
          code: `<B2bDatePicker v-model="start" placeholder="시작일" :show-presets="true" />\n<span>~</span>\n<B2bDatePicker v-model="end" placeholder="종료일" :show-presets="true" />`,
        },
        {
          key: 'range',
          label: '기간 Range (멀티 캘린더)',
          props: {
            placeholder: '시작일 ~ 종료일 선택',
            range: true,
            'multi-calendars': true,
            'show-presets': true,
          },
          value: () => this.model.range,
          code: `<B2bDatePicker\n  v-model="range"\n  :range="true"\n  :multi-calendars="true"\n  :show-presets="true"\n/>`,
        },
        {
          key: 'dateTime',
          label: '단일 일시 (날짜 + 시간)',
          props: {
            placeholder: 'YYYY-MM-DD HH:mm',
            'enable-time-picker': true,
            'time-picker-inline': true,
            'show-presets': true,
          },
          value: () => this.model.dateTime,
          code: `<B2bDatePicker\n  v-model="dt"\n  :enable-time-picker="true"\n  :time-picker-inline="true"\n  :show-presets="true"\n/>`,
        },
        {
          key: 'pairDt',
          label: '기간 일시 (시작일시 ~ 종료일시)',
          pair: true,
          startKey: 'pairDtStart',
          endKey: 'pairDtEnd',
          propsStart: { placeholder: '시작일시', 'enable-time-picker': true, 'show-presets': true },
          propsEnd: { placeholder: '종료일시', 'enable-time-picker': true, 'show-presets': true },
          value: () => [this.model.pairDtStart, this.model.pairDtEnd],
          code: `<B2bDatePicker v-model="start" :enable-time-picker="true" :show-presets="true" />\n<span>~</span>\n<B2bDatePicker v-model="end" :enable-time-picker="true" :show-presets="true" />`,
        },
        {
          key: 'combinedSingle',
          label: '단일 - 년월통합 헤더',
          props: { placeholder: 'YYYY-MM-DD', 'combined-header': true, 'show-presets': true },
          value: () => this.model.combinedSingle,
          code: `<B2bDatePicker\n  v-model="date"\n  :combined-header="true"\n  :show-presets="true"\n/>`,
        },
        {
          key: 'combinedRange',
          label: 'Range - 년월통합 헤더',
          props: {
            placeholder: '시작일 ~ 종료일 선택',
            'combined-header': true,
            range: true,
            'multi-calendars': true,
            'show-presets': true,
          },
          value: () => this.model.combinedRange,
          code: `<B2bDatePicker\n  v-model="range"\n  :combined-header="true"\n  :range="true"\n  :multi-calendars="true"\n  :show-presets="true"\n/>`,
        },
        {
          key: 'month',
          label: '월 선택 (YYYY-MM)',
          props: { placeholder: 'YYYY-MM', 'month-picker': true },
          value: () => this.model.month,
          code: `<B2bDatePicker\n  v-model="ym"\n  placeholder="YYYY-MM"\n  :month-picker="true"\n/>`,
        },
        {
          key: 'year',
          label: '연도 선택 (YYYY)',
          props: { placeholder: 'YYYY', 'year-picker': true },
          value: () => this.model.year,
          code: `<B2bDatePicker\n  v-model="y"\n  placeholder="YYYY"\n  :year-picker="true"\n/>`,
        },
        {
          key: 'week',
          label: '주차 선택 (YYYY-Www)',
          props: { placeholder: '주 선택', 'week-picker': true },
          // 값은 [주 시작일, 주 종료일] 배열. 읽기 쉽게 로컬 날짜로 정리해 표시
          value: () => this.weekRange(this.model.week),
          code: `<B2bDatePicker\n  v-model="week"\n  placeholder="주 선택"\n  :week-picker="true"\n/>`,
        },
        {
          key: 'weekOnly',
          label: '주차만 (년도 제외, 29주차)',
          // format="ww'주차'" 로 년도 없이 주차 번호만 표시
          props: { placeholder: '주 선택', 'week-picker': true, format: "ww'주차'" },
          value: () => this.weekRange(this.model.weekOnly),
          code: `<B2bDatePicker\n  v-model="week"\n  :week-picker="true"\n  format="ww'주차'"\n/>`,
        },
        {
          key: 'constrained',
          label: '제약 - 오늘 이후 선택 불가 (max-date)',
          props: {
            placeholder: 'YYYY-MM-DD (오늘까지)',
            'max-date': this.today,
            'show-presets': true,
          },
          value: () => this.model.constrained,
          code: `<B2bDatePicker\n  v-model="date"\n  :max-date="new Date()"\n  :show-presets="true"\n/>`,
        },
      ]
    },
  },
  methods: {
    // 주차 픽커의 [시작일, 종료일] 배열을 읽기 쉬운 로컬 날짜로 정리
    weekRange(w) {
      if (!Array.isArray(w) || !w[0]) return w
      const p = (n) => String(n).padStart(2, '0')
      const fmt = (v) => {
        const d = new Date(v)
        if (isNaN(d.getTime())) return v
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
      }
      return [fmt(w[0]), fmt(w[1])]
    },
  },
}
</script>

<style scoped>
/* 기간(시작 ~ 종료) 페어: 두 개의 데이트픽커를 균등 분할 */
.date-range-pair :deep(.b2b-datepicker-wrapper) {
  flex: 1 1 0;
  min-width: 0;
}
</style>
