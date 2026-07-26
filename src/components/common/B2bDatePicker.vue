<template>
  <div class="b2b-datepicker-wrapper" :class="{ 'is-open': isOpen, 'has-time-picker': enableTimePicker }">
    <VueDatePicker
      ref="datepicker"
      v-model="internalValue"
      :formats="computedFormats"
      :model-type="computedModelType"
      :locale="effectiveLocale"
      :auto-apply="computedAutoApply"
      :partial-range="partialRange"
      :year-first="true"
      :enable-time-picker="enableTimePicker"
      :time-picker-inline="timePickerInline"
      :month-picker="monthPicker"
      :year-picker="yearPicker"
      :week-picker="weekPicker"
      :min-date="minDate"
      :max-date="maxDate"
      :range="range"
      :multi-calendars="computedMultiCalendars"
      :is-24="true"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :teleport="true"
      :floating="{ placement: menuPlacement, flip: false, shift: { padding: 8 } }"
      :ui="computedUiConfig"
      select-text="선택"
      cancel-text="취소"
      :class="{ 'b2b-datepicker-custom': true, 'has-time-picker': enableTimePicker }"
      @open="onOpen"
      @closed="onClosed"
    >
      <template #input-icon>
        <i class="bi bi-calendar3 dp-icon"></i>
      </template>

      <!-- Custom Combined YYYY-MM Header Slot (only when combinedHeader is true) -->
      <template v-if="combinedHeader" #month-year="slotProps">
        <div class="b2b-combined-month-year-header">
          <button
            type="button"
            class="b2b-month-year-btn"
            @click.stop="togglePicker(slotProps.year, slotProps.month)"
            title="년도 및 월 동시 선택"
          >
            <span>{{ slotProps.year }}-{{ String(slotProps.month + 1).padStart(2, '0') }}</span>
            <i class="bi bi-chevron-down ms-1.5 icon-arrow" :class="{ open: pickerOpen }"></i>
          </button>

          <!-- 드롭다운 통합 선택 레이어 (좌측: 년도 목록, 우측: 12개 월 버튼) -->
          <div v-if="pickerOpen" class="b2b-combined-picker-overlay shadow-lg" @click.stop>
            <div class="overlay-header">
              <span class="overlay-title">년도 및 월 선택</span>
              <button type="button" class="overlay-close-btn" @click="pickerOpen = false">
                <i class="bi bi-x"></i>
              </button>
            </div>
            <div class="overlay-body">
              <!-- 좌측: 년도 선택 스크롤 칼럼 -->
              <div class="overlay-year-col">
                <div class="overlay-col-label">년도</div>
                <div class="overlay-scroll-list" ref="overlayYearScroll">
                  <button
                    v-for="y in yearList"
                    :key="y"
                    type="button"
                    class="picker-opt-btn"
                    :class="{ active: y === selYear }"
                    @click="selectYearOnly(y)"
                  >
                    {{ y }}년
                  </button>
                </div>
              </div>

              <!-- 우측: 월 선택 12개 격자 -->
              <div class="overlay-month-col">
                <div class="overlay-col-label">월</div>
                <div class="overlay-month-grid">
                  <button
                    v-for="mIdx in 12"
                    :key="mIdx"
                    type="button"
                    class="picker-opt-btn"
                    :class="{ active: (mIdx - 1) === selMonth && selYear === slotProps.year }"
                    @click="applyYearMonth(slotProps, mIdx - 1)"
                  >
                    {{ String(mIdx).padStart(2, '0') }}월
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Custom Left Sidebar for Quick Presets -->
      <template v-if="showPresets" #left-sidebar>
        <div class="preset-sidebar">
          <div class="preset-title">빠른 선택</div>
          <div class="preset-chip-list">
            <button
              v-for="(p, idx) in presetDates"
              :key="idx"
              type="button"
              class="preset-chip-btn"
              @click="selectPreset(p.value)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>
      </template>
    </VueDatePicker>
  </div>
</template>

<script>
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { ko } from 'date-fns/locale'

export default {
  name: 'B2bDatePicker',
  components: {
    VueDatePicker,
  },
  props: {
    modelValue: {
      type: [String, Array, Date, Object],
      default: '',
    },
    placeholder: {
      type: String,
      default: 'YYYY-MM-DD',
    },
    format: {
      type: String,
      default: '',
    },
    modelType: {
      type: String,
      default: '',
    },
    combinedHeader: {
      type: Boolean,
      default: false,
    },
    enableTimePicker: {
      type: Boolean,
      default: false,
    },
    timePickerInline: {
      type: Boolean,
      default: false,
    },
    monthPicker: {
      type: Boolean,
      default: false,
    },
    yearPicker: {
      type: Boolean,
      default: false,
    },
    weekPicker: {
      type: Boolean,
      default: false,
    },
    minDate: {
      type: [String, Date],
      default: null,
    },
    maxDate: {
      type: [String, Date],
      default: null,
    },
    range: {
      type: Boolean,
      default: false,
    },
    partialRange: {
      type: Boolean,
      default: false,
    },
    multiCalendars: {
      type: [Boolean, Number, Object],
      default: false,
    },
    locale: {
      type: [String, Object],
      default: 'ko',
    },
    autoApply: {
      type: Boolean,
      default: true,
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    teleport: {
      type: [Boolean, String, Object],
      default: true,
    },
    position: {
      type: String,
      default: 'left',
    },
    showPresets: {
      type: Boolean,
      default: false,
    },
    yearRangeOffset: {
      type: Number,
      default: 15,
    },
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      isOpen: false,
      pickerOpen: false,
      selYear: new Date().getFullYear(),
      selMonth: new Date().getMonth(),
      windowWidth: typeof document !== 'undefined' ? document.documentElement.clientWidth : 1280,
      menuPlacement: 'bottom-start',
    }
  },
  mounted() {
    window.addEventListener('resize', this.onWindowResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onWindowResize)
    this.clearRepositionTimers()
  },
  computed: {
    yearList() {
      const currentYear = new Date().getFullYear()
      const startYear = currentYear - this.yearRangeOffset
      const endYear = currentYear + this.yearRangeOffset
      const years = []
      for (let y = startYear; y <= endYear; y++) {
        years.push(y)
      }
      return years
    },
    internalValue: {
      get() {
        // range/week 픽커는 값이 배열이므로 빈 값은 null로 넘겨야 경고가 없다.
        if ((this.range || this.weekPicker) && !this.modelValue) {
          return null
        }
        return this.modelValue
      },
      set(val) {
        this.$emit('update:modelValue', val)
        this.$emit('change', val)
      },
    },
    computedAutoApply() {
      if (this.range || this.enableTimePicker) {
        return false
      }
      return this.autoApply
    },
    // 멀티 캘린더(달력 2개)는 폭이 ~640px라 좁은 화면/컬럼에서 잘린다.
    // md 미만에서는 달력 1개로 축소해 팝업이 화면 안에 들어오도록 한다.
    computedMultiCalendars() {
      if (!this.multiCalendars) return false
      if (this.windowWidth < 768) return false
      return this.multiCalendars
    },
    computedFormat() {
      if (this.format) return this.format
      // 연도/년월/주차 전용 모드는 vue-datepicker가 내부 값을 문자열 포맷으로
      // 직접 처리하므로 함수 대신 포맷 문자열을 넘긴다. (주차는 'YYYY-Www')
      if (this.yearPicker) return 'yyyy'
      if (this.monthPicker) return 'yyyy-MM'
      if (this.weekPicker) return "yyyy-'W'ww"
      return (date) => {
        if (!date) return ''
        const pad = (n) => String(n).padStart(2, '0')
        const fmtSingle = (d) => {
          if (!d) return ''
          if (typeof d === 'string') {
            const parts = d.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || d.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
            if (parts) {
              if (parts[1].length === 4) {
                const y = parts[1]
                const m = pad(parts[2])
                const day = pad(parts[3])
                if (this.enableTimePicker) {
                  const timeMatch = d.match(/(\d{1,2}):(\d{1,2})/)
                  if (timeMatch) return `${y}-${m}-${day} ${pad(timeMatch[1])}:${pad(timeMatch[2])}`
                }
                return `${y}-${m}-${day}`
              } else {
                const y = parts[3]
                const m = pad(parts[1])
                const day = pad(parts[2])
                if (this.enableTimePicker) {
                  const timeMatch = d.match(/(\d{1,2}):(\d{1,2})/)
                  if (timeMatch) return `${y}-${m}-${day} ${pad(timeMatch[1])}:${pad(timeMatch[2])}`
                }
                return `${y}-${m}-${day}`
              }
            }
          }
          let target = d
          if (typeof d === 'string') {
            target = new Date(d)
          }
          if (target instanceof Date && !isNaN(target.getTime())) {
            const y = target.getFullYear()
            const m = pad(target.getMonth() + 1)
            const day = pad(target.getDate())
            if (this.enableTimePicker) {
              const hh = pad(target.getHours())
              const mm = pad(target.getMinutes())
              return `${y}-${m}-${day} ${hh}:${mm}`
            }
            return `${y}-${m}-${day}`
          }
          return String(d)
        }
        if (Array.isArray(date)) {
          if (!date[0]) return ''
          if (!date[1]) return fmtSingle(date[0])
          return `${fmtSingle(date[0])} ~ ${fmtSingle(date[1])}`
        }
        return fmtSingle(date)
      }
    },
    // vue-datepicker v14: display/preview formatting moved from the removed
    // `format`/`preview-format` props into a single `formats` object.
    computedFormats() {
      const fmt = this.computedFormat
      return { input: fmt, preview: fmt }
    },
    computedModelType() {
      if (this.modelType) return this.modelType
      if (this.yearPicker) return 'yyyy'
      if (this.monthPicker) return 'yyyy-MM'
      return this.enableTimePicker ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'
    },
    computedUiConfig() {
      return {
        menu: this.enableTimePicker ? 'b2b-dp-menu-with-time' : 'b2b-dp-menu-date-only',
      }
    },
    effectiveLocale() {
      if (typeof this.locale === 'object' && this.locale !== null) {
        return this.locale
      }
      if (this.locale === 'ko' || !this.locale) {
        return ko
      }
      return this.locale
    },
    presetDates() {
      if (!this.showPresets) return []
      const today = new Date()
      const d = (days) => {
        const date = new Date()
        date.setDate(today.getDate() + days)
        return date
      }
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

      if (this.range) {
        return [
          { label: '오늘', value: [today, today] },
          { label: '최근 7일', value: [d(-7), today] },
          { label: '이번 달', value: [startOfMonth, today] },
          { label: '지난 달', value: [startOfPrevMonth, endOfPrevMonth] },
          { label: '최근 3개월', value: [d(-90), today] },
        ]
      }
      return [
        { label: '오늘', value: today },
        { label: '7일 전', value: d(-7) },
        { label: '1개월 전', value: d(-30) },
      ]
    },
  },
  methods: {
    onWindowResize() {
      this.windowWidth = document.documentElement.clientWidth
    },
    // floating-ui의 자동 flip은 멀티캘린더가 렌더 중 일시적으로 세로로 길어질 때
    // "아래 공간 부족"으로 오판해 공간이 충분한데도 위로 뒤집히는 버그가 있다.
    // 그래서 입력창 위치를 기준으로 방향을 직접 정하고 flip은 끈다.
    decidePlacement() {
      const input = this.$el && this.$el.querySelector('input')
      if (!input) {
        this.menuPlacement = 'bottom-start'
        return
      }
      const rect = input.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const ESTIMATED_MENU_HEIGHT = 400 // 멀티캘린더/일시 포함 넉넉한 추정치
      const spaceBelow = vh - rect.bottom
      const spaceAbove = rect.top
      // 아래가 충분하거나(추정 높이 이상), 아래가 위보다 넓으면 아래로. 그 외에만 위로.
      this.menuPlacement =
        spaceBelow >= ESTIMATED_MENU_HEIGHT || spaceBelow >= spaceAbove
          ? 'bottom-start'
          : 'top-start'
    },
    onOpen() {
      this.isOpen = true
      this.pickerOpen = false
      this.decidePlacement()
      // floating-ui는 메뉴가 열리는 즉시 위치를 계산하는데, 멀티 캘린더/프리셋
      // 사이드바가 완전히 렌더되기 전이라 팝업 폭이 확정되지 않아 shift(뷰포트
      // 보정)가 적용되지 못한다. 렌더가 진행되는 동안 몇 차례 재계산을 유도해
      // 우측 컬럼 픽커의 팝업이 화면 밖으로 잘리는 것을 방지한다.
      this.repositionMenu()
    },
    onClosed() {
      this.isOpen = false
      this.pickerOpen = false
      this.clearRepositionTimers()
    },
    repositionMenu() {
      this.clearRepositionTimers()
      // resize 이벤트로 floating-ui의 위치 재계산을 강제(위치만 변경되므로 안전)
      const fire = () => window.dispatchEvent(new Event('resize'))
      this._repositionTimers = [0, 60, 160, 320].map((delay) => setTimeout(fire, delay))
    },
    clearRepositionTimers() {
      if (this._repositionTimers) {
        this._repositionTimers.forEach(clearTimeout)
        this._repositionTimers = null
      }
    },
    togglePicker(year, month) {
      this.selYear = year
      this.selMonth = month
      this.pickerOpen = !this.pickerOpen
      if (this.pickerOpen) {
        this.$nextTick(() => {
          if (this.$refs.overlayYearScroll) {
            const activeBtn = this.$refs.overlayYearScroll.querySelector('.picker-opt-btn.active')
            if (activeBtn) {
              activeBtn.scrollIntoView({ block: 'center', behavior: 'auto' })
            }
          }
        })
      }
    },
    selectYearOnly(y) {
      this.selYear = y
      if (this.$refs.datepicker && typeof this.$refs.datepicker.setMonthYear === 'function') {
        this.$refs.datepicker.setMonthYear({ month: this.selMonth, year: y })
      }
    },
    applyYearMonth(slotProps, monthIdx) {
      this.selMonth = monthIdx
      const targetObj = { month: monthIdx, year: this.selYear }
      if (this.$refs.datepicker && typeof this.$refs.datepicker.setMonthYear === 'function') {
        this.$refs.datepicker.setMonthYear(targetObj)
      } else if (slotProps && typeof slotProps.updateMonthYear === 'function') {
        slotProps.updateMonthYear(targetObj)
      }
      this.pickerOpen = false
    },
    calcPosition(el) {
      if (!el) return { top: 0, left: 0 }
      const rect = el.getBoundingClientRect()
      return {
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
      }
    },
    selectPreset(val) {
      const pad = (n) => String(n).padStart(2, '0')
      const formatDate = (d) => {
        const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
        // 시간 선택형(datetime) 필드는 model-type이 'yyyy-MM-dd HH:mm'이므로 시간까지 포함해야 파싱됨
        if (this.enableTimePicker) {
          return `${base} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
        return base
      }
      if (Array.isArray(val)) {
        this.internalValue = [formatDate(val[0]), formatDate(val[1])]
      } else if (val instanceof Date) {
        this.internalValue = formatDate(val)
      }
    },
  },
}
</script>

<style scoped>
.b2b-datepicker-wrapper {
  position: relative;
  width: 100%;
}
.dp-icon {
  padding-left: 10px;
  font-size: 0.85rem;
  color: var(--text-secondary, #64748b);
}
</style>
