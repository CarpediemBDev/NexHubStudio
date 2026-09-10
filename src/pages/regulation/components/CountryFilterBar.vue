<template>
  <div class="cf-bar" :class="`cf-v-${variant}`">
    <!-- 공통: 라벨 + 전체(선택 해제) -->
    <div class="cf-lead">
      <span class="cf-label"><i class="bi bi-globe2 me-1"></i>국가 {{ countryCount }}</span>
      <button type="button" class="cf-chip" :class="{ on: !selected.length }" @click="setSelected([])">
        전체 <span class="cnt">{{ totalCount }}</span>
      </button>
    </div>

    <!-- F. 드롭다운 패널: 칩 대신 버튼 + 선택 태그, 목록은 패널에서 권역별 체크박스로 -->
    <div v-if="variant === 'panel'" class="cf-body cf-panel-host">
      <button ref="trigger" type="button" class="cf-trigger" :class="{ open: panelOpen }" @click="togglePanel">
        <i class="bi bi-funnel"></i>국가 선택
        <span v-if="selected.length" class="cf-trigger-cnt">{{ selected.length }}</span>
        <i class="bi" :class="panelOpen ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
      </button>
      <span v-for="c in selectedOptions.slice(0, TAG_LIMIT)" :key="c.code" class="cf-tag">
        {{ c.name }}<i class="bi bi-x" @click="toggle(c.code)"></i>
      </span>
      <button v-if="selectedOptions.length > TAG_LIMIT" type="button" class="cf-more" @click="openPanel">
        +{{ selectedOptions.length - TAG_LIMIT }}
      </button>
      <span v-if="!selected.length" class="cf-hint">선택된 국가 없음</span>

      <Teleport to="body">
        <div v-if="panelOpen" ref="panel" class="cf-panel" :style="panelStyle">
          <div class="cf-panel-head">
            <div class="cf-search">
              <i class="bi bi-search"></i>
              <input ref="panelInput" v-model="keyword" type="text" placeholder="국가 검색 (이름·코드)" />
              <i v-if="keyword" class="bi bi-x-lg cf-search-clear" @click="keyword = ''"></i>
            </div>
            <span class="cf-hint">{{ selected.length }}개 선택</span>
          </div>
          <div class="cf-panel-body">
            <section v-for="g in panelGroups" :key="g.code" class="cf-group">
              <label class="cf-group-title">
                <input
                  type="checkbox"
                  :checked="g.allOn"
                  :indeterminate.prop="g.someOn && !g.allOn"
                  @change="toggleGroup(g)"
                />
                {{ g.name }} <span class="cnt">{{ g.items.length }}</span>
              </label>
              <div class="cf-group-items">
                <label v-for="c in g.items" :key="c.code" class="cf-check" :class="{ on: isOn(c.code) }">
                  <input type="checkbox" :checked="isOn(c.code)" @change="toggle(c.code)" />
                  <span class="nm">{{ c.name }}</span>
                  <span class="cnt">{{ c.count }}</span>
                </label>
              </div>
            </section>
            <div v-if="!panelGroups.length" class="cf-empty py-3">일치하는 국가 없음</div>
          </div>
          <div class="cf-panel-foot">
            <button type="button" class="btn-b2b-action" @click="setSelected([])">초기화</button>
            <button type="button" class="btn-b2b-primary" @click="closePanel">닫기</button>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- A~E: 칩 목록. 칩은 같고 담는 그릇 모양만 variant 별로 다르다 -->
    <div v-else class="cf-body">
      <div v-if="variant === 'region'" class="cf-tabs">
        <button
          v-for="g in regionTabs"
          :key="g.code"
          type="button"
          class="cf-tab"
          :class="{ on: !kw && g.code === currentRegion }"
          @click="activeRegion = g.code; keyword = ''"
        >
          {{ g.name }} <span class="cnt">{{ g.items.length }}</span>
          <span v-if="g.selectedCnt" class="cf-tab-dot">{{ g.selectedCnt }}</span>
        </button>
      </div>

      <div class="cf-list-row" :class="{ 'fade-l': variant === 'hscroll' && canPrev, 'fade-r': variant === 'hscroll' && canNext }">
        <button v-if="variant === 'carousel'" type="button" class="cf-nav" :disabled="!canPrev" @click="slide(-1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        <div ref="track" class="cf-list" :class="listClass" @scroll="measure" @wheel="onWheel">
          <button
            v-for="c in shownChips"
            :key="c.code"
            type="button"
            class="cf-chip"
            :class="{ on: isOn(c.code), empty: c.count === 0 }"
            @click="toggle(c.code)"
          >
            {{ c.name }} <span class="cnt">{{ c.count }}</span>
          </button>
          <button
            v-if="variant === 'more' && !kw && options.length > preview"
            type="button"
            class="cf-more"
            @click="expanded = !expanded"
          >
            <template v-if="expanded"><i class="bi bi-chevron-up me-1"></i>접기</template>
            <template v-else><i class="bi bi-chevron-down me-1"></i>+{{ options.length - shownChips.length }}개 더보기</template>
          </button>
          <span v-if="!shownChips.length" class="cf-empty">일치하는 국가 없음</span>
        </div>
        <template v-if="variant === 'carousel'">
          <button type="button" class="cf-nav" :disabled="!canNext" @click="slide(1)">
            <i class="bi bi-chevron-right"></i>
          </button>
          <span class="cf-pager">{{ pageNo }} / {{ pageTotal }}</span>
        </template>
      </div>
    </div>

    <div v-if="variant !== 'panel'" class="cf-search">
      <i class="bi bi-search"></i>
      <input v-model="keyword" type="text" placeholder="국가 검색 (이름·코드)" />
      <i v-if="keyword" class="bi bi-x-lg cf-search-clear" @click="keyword = ''"></i>
    </div>
  </div>
</template>

<script>
// parentCd 가 없는 옵션('국가 미지정')을 모으는 권역 키
const ETC = '__ETC__'

/**
 * 국가 다중 선택 필터 바.
 * 옵션/선택값은 부모가 소유하고(v-model:selected), 이 컴포넌트는 "어떻게 보여줄지" 만 맡는다.
 * 같은 데이터를 variant 별로 다른 모양으로 그려서 디자인을 비교할 수 있게 해 둔다.
 *   more     : 상위 N개 + 더보기
 *   vscroll  : 2줄 높이 고정 + 세로 스크롤
 *   hscroll  : 한 줄 + 가로 스크롤 (휠을 가로로 돌림, 양끝 페이드)
 *   carousel : 한 줄 + ◀ ▶ 페이지 이동 (스냅)
 *   region   : 권역 탭 → 해당 권역 칩
 *   panel    : 버튼 + 드롭다운 패널(권역별 체크박스)
 */
export default {
  name: 'CountryFilterBar',
  props: {
    variant: { type: String, default: 'more' },
    /** [{ code, name, count, parentCd }] - 건수 많은 순. parentCd 없으면 '국가 미지정' 류 */
    options: { type: Array, default: () => [] },
    selected: { type: Array, default: () => [] },
    /** '전체' 칩에 보일 건수 */
    totalCount: { type: Number, default: 0 },
    /** 권역 코드 [{ code, name }] - region / panel 그룹 순서 */
    regions: { type: Array, default: () => [] },
    /** more 모양에서 먼저 보여줄 칩 수 */
    preview: { type: Number, default: 20 }
  },
  emits: ['update:selected'],
  data() {
    return {
      TAG_LIMIT: 5,
      keyword: '',
      expanded: false,
      activeRegion: '',
      // hscroll / carousel 스크롤 상태
      canPrev: false,
      canNext: false,
      pageNo: 1,
      pageTotal: 1,
      // panel
      panelOpen: false,
      panelStyle: {}
    }
  },
  computed: {
    countryCount() {
      return this.options.filter((c) => c.parentCd).length
    },
    kw() {
      return this.keyword.trim().toLowerCase()
    },
    kwFiltered() {
      if (!this.kw) return this.options
      return this.options.filter((c) => c.name.toLowerCase().includes(this.kw) || c.code.toLowerCase().includes(this.kw))
    },
    listClass() {
      return {
        more: 'is-wrap',
        vscroll: 'is-wrap is-vscroll',
        region: 'is-wrap',
        hscroll: 'is-row is-scroll',
        carousel: 'is-row is-snap'
      }[this.variant] || 'is-wrap'
    },
    regionTabs() {
      return this.groupsOf(this.options)
    },
    currentRegion() {
      const tabs = this.regionTabs
      return tabs.some((g) => g.code === this.activeRegion) ? this.activeRegion : tabs[0]?.code
    },
    shownChips() {
      const list = this.kwFiltered
      // 검색 중이면 모양과 상관없이 맞는 것 전부
      if (this.kw) return list
      if (this.variant === 'more') {
        if (this.expanded || list.length <= this.preview) return list
        const extraSelected = list.slice(this.preview).filter((c) => this.isOn(c.code))
        return [...list.slice(0, this.preview), ...extraSelected]
      }
      if (this.variant === 'region') return list.filter((c) => this.regionKey(c) === this.currentRegion)
      return list
    },
    panelGroups() {
      return this.groupsOf(this.kwFiltered).map((g) => ({
        ...g,
        items: [...g.items].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      }))
    },
    selectedOptions() {
      return this.selected.map((code) => this.options.find((o) => o.code === code)).filter(Boolean)
    }
  },
  watch: {
    variant() {
      this.closePanel()
      this.keyword = ''
      this.$nextTick(() => {
        if (this.$refs.track) this.$refs.track.scrollLeft = 0
        this.measure()
      })
    },
    shownChips() {
      this.$nextTick(() => this.measure())
    },
    panelOpen(open) {
      if (open) this.$nextTick(() => this.$refs.panelInput?.focus())
    }
  },
  mounted() {
    this.resizeObs = new ResizeObserver(() => this.measure())
    this.resizeObs.observe(this.$el)
    this.$nextTick(() => this.measure())
  },
  beforeUnmount() {
    this.resizeObs?.disconnect()
    this.unbindPanel()
  },
  methods: {
    isOn(code) {
      return this.selected.includes(code)
    },
    setSelected(codes) {
      this.$emit('update:selected', codes)
    },
    toggle(code) {
      this.setSelected(this.isOn(code) ? this.selected.filter((c) => c !== code) : [...this.selected, code])
    },
    regionKey(c) {
      return c.parentCd || ETC
    },
    /** 옵션을 권역 순서대로 묶는다. 권역 없는 옵션은 맨 뒤 '미지정' 묶음 */
    groupsOf(list) {
      const defs = [...this.regions, { code: ETC, name: '미지정' }]
      return defs
        .map((r) => {
          const items = list.filter((c) => this.regionKey(c) === r.code)
          const selectedCnt = items.filter((c) => this.isOn(c.code)).length
          return {
            code: r.code,
            name: r.name,
            items,
            selectedCnt,
            allOn: items.length > 0 && selectedCnt === items.length,
            someOn: selectedCnt > 0
          }
        })
        .filter((g) => g.items.length)
    },
    toggleGroup(g) {
      const codes = g.items.map((c) => c.code)
      if (g.allOn) this.setSelected(this.selected.filter((c) => !codes.includes(c)))
      else this.setSelected([...new Set([...this.selected, ...codes])])
    },

    /* ---------------- hscroll / carousel ---------------- */
    measure() {
      const el = this.$refs.track
      if (!el) return
      const max = el.scrollWidth - el.clientWidth
      this.canPrev = el.scrollLeft > 2
      this.canNext = el.scrollLeft < max - 2
      this.pageTotal = Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth)))
      this.pageNo = this.canNext ? Math.min(this.pageTotal, Math.round(el.scrollLeft / el.clientWidth) + 1) : this.pageTotal
    },
    slide(dir) {
      const el = this.$refs.track
      if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
    },
    /** 한 줄 모양에서는 세로 휠을 가로 이동으로 바꾼다 (마우스 사용자가 Shift 없이 넘기게) */
    onWheel(e) {
      if (this.variant !== 'hscroll' && this.variant !== 'carousel') return
      const el = this.$refs.track
      if (!el || el.scrollWidth <= el.clientWidth) return
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    },

    /* ---------------- panel ---------------- */
    togglePanel() {
      if (this.panelOpen) this.closePanel()
      else this.openPanel()
    },
    openPanel() {
      this.placePanel()
      this.panelOpen = true
      document.addEventListener('mousedown', this.onDocDown, true)
      document.addEventListener('keydown', this.onDocKey)
      window.addEventListener('resize', this.placePanel)
      window.addEventListener('scroll', this.placePanel, true)
    },
    closePanel() {
      this.panelOpen = false
      this.unbindPanel()
    },
    unbindPanel() {
      document.removeEventListener('mousedown', this.onDocDown, true)
      document.removeEventListener('keydown', this.onDocKey)
      window.removeEventListener('resize', this.placePanel)
      window.removeEventListener('scroll', this.placePanel, true)
    },
    /** 카드가 overflow 를 자를 수 있어서 패널은 body 로 빼고 버튼 위치에 fixed 로 붙인다 */
    placePanel() {
      const trigger = this.$refs.trigger
      if (!trigger) return
      const r = trigger.getBoundingClientRect()
      const vh = window.innerHeight
      const width = Math.min(760, window.innerWidth - 24)
      const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12))
      const below = vh - r.bottom - 18
      const above = r.top - 18
      // 아래 공간이 모자라고 위가 더 넓으면 위로 연다 (필터 바가 화면 아래쪽에 있을 때)
      const openUp = below < 320 && above > below
      this.panelStyle = {
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${Math.min(480, openUp ? above : below)}px`,
        ...(openUp ? { bottom: `${vh - r.top + 6}px` } : { top: `${r.bottom + 6}px` })
      }
    },
    onDocDown(e) {
      if (this.$refs.panel?.contains(e.target) || this.$refs.trigger?.contains(e.target)) return
      this.closePanel()
    },
    onDocKey(e) {
      if (e.key === 'Escape') this.closePanel()
    }
  }
}
</script>

<style scoped>
.cf-bar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-card, #fff);
}

.cf-lead {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  min-height: 26px;
}

.cf-label {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.cf-body {
  flex: 1;
  min-width: 0;
}

/* ---- 칩 ---- */
.cf-chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  padding: 6px 10px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 14px;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
  color: var(--b2b-color-text-primary, #212529);
  cursor: pointer;
}

.cf-chip:hover {
  border-color: var(--b2b-color-primary, #0d6efd);
}

.cnt {
  font-size: 11px;
  font-weight: 700;
  color: var(--b2b-color-text-secondary, #6c757d);
}

.cf-chip.on {
  background: var(--b2b-color-primary, #0d6efd);
  border-color: var(--b2b-color-primary, #0d6efd);
  color: #fff;
  font-weight: 600;
}

.cf-chip.on .cnt {
  color: rgba(255, 255, 255, 0.85);
}

.cf-chip.empty:not(.on) {
  opacity: 0.5;
}

.cf-more {
  flex-shrink: 0;
  font-size: 12px;
  padding: 4px 8px;
  border: 0;
  background: transparent;
  color: var(--b2b-color-primary, #0d6efd);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.cf-empty,
.cf-hint {
  font-size: 12px;
  color: var(--b2b-color-text-secondary, #6c757d);
  white-space: nowrap;
  align-self: center;
}

/* ---- 목록 그릇 ---- */
.cf-list-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cf-list {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 6px;
}

.cf-list.is-wrap {
  flex-wrap: wrap;
}

/* 2줄 높이 (칩 26 + 간격 6) 에서 자르고 세로 스크롤 */
.cf-list.is-vscroll {
  max-height: 60px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
}

.cf-list.is-row {
  flex-wrap: nowrap;
  overflow-x: auto;
}

.cf-list.is-scroll {
  padding-bottom: 5px;
  scrollbar-width: thin;
}

.cf-list.is-snap {
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.cf-list.is-snap::-webkit-scrollbar {
  display: none;
}

.cf-list.is-snap .cf-chip {
  scroll-snap-align: start;
}

/* 가로 스크롤 양끝 페이드: 더 넘길 게 있다는 신호 */
.cf-list-row.fade-l::before,
.cf-list-row.fade-r::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 5px;
  width: 36px;
  pointer-events: none;
  z-index: 1;
}

.cf-list-row.fade-l::before {
  left: 0;
  background: linear-gradient(to right, var(--b2b-color-bg-card, #fff), transparent);
}

.cf-list-row.fade-r::after {
  right: 0;
  background: linear-gradient(to left, var(--b2b-color-bg-card, #fff), transparent);
}

/* ---- 캐러셀 ---- */
.cf-nav {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 50%;
  background: var(--b2b-color-bg-subcard, #f8f9fa);
  color: var(--b2b-color-text-primary, #212529);
  cursor: pointer;
}

.cf-nav:hover:not(:disabled) {
  border-color: var(--b2b-color-primary, #0d6efd);
  color: var(--b2b-color-primary, #0d6efd);
}

.cf-nav:disabled {
  opacity: 0.35;
  cursor: default;
}

.cf-pager {
  flex-shrink: 0;
  min-width: 38px;
  text-align: center;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--b2b-color-text-secondary, #6c757d);
}

/* ---- 권역 탭 ---- */
.cf-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 8px;
  /* 탭의 margin-bottom:-1px(밑줄 겹치기) 때문에 세로 스크롤바가 생기지 않게 막는다 */
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
}

.cf-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  font-size: 12px;
  white-space: nowrap;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--b2b-color-text-secondary, #6c757d);
  cursor: pointer;
}

.cf-tab.on {
  color: var(--b2b-color-primary, #0d6efd);
  border-bottom-color: var(--b2b-color-primary, #0d6efd);
  font-weight: 600;
}

.cf-tab-dot {
  min-width: 16px;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.3;
  border-radius: 8px;
  background: var(--b2b-color-primary, #0d6efd);
  color: #fff;
}

/* ---- 검색 ---- */
.cf-search {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  font-size: 12px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 14px;
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-secondary, #6c757d);
}

.cf-search input {
  width: 140px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--b2b-color-text-primary, #212529);
  font-size: 12px;
}

.cf-search-clear {
  font-size: 10px;
  cursor: pointer;
}

/* ---- 드롭다운 패널 ---- */
.cf-panel-host {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 26px;
}

.cf-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 6px;
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-primary, #212529);
  cursor: pointer;
}

.cf-trigger:hover,
.cf-trigger.open {
  border-color: var(--b2b-color-primary, #0d6efd);
}

.cf-trigger-cnt {
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  background: var(--b2b-color-primary, #0d6efd);
  color: #fff;
}

.cf-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 5px 4px 10px;
  font-size: 12px;
  border: 1px solid var(--b2b-color-primary, #0d6efd);
  border-radius: 14px;
  color: var(--b2b-color-primary, #0d6efd);
  background: var(--b2b-color-bg-card, #fff);
}

.cf-tag .bi-x {
  cursor: pointer;
}

.cf-panel {
  position: fixed;
  z-index: 1070;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 8px;
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-primary, #212529);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

.cf-panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
}

.cf-panel-head .cf-search {
  flex: 1;
}

.cf-panel-head .cf-search input {
  width: 100%;
}

.cf-panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.cf-group-title {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 10px 0 6px;
  font-size: 12px;
  font-weight: 700;
  background: var(--b2b-color-bg-card, #fff);
  cursor: pointer;
}

.cf-group-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 2px 8px;
}

.cf-check {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 3px 6px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.cf-check:hover {
  background: var(--b2b-color-bg-subcard, #f8f9fa);
}

.cf-check.on {
  color: var(--b2b-color-primary, #0d6efd);
  font-weight: 600;
}

.cf-check .nm {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cf-panel-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--b2b-color-border, #dee2e6);
}
</style>
