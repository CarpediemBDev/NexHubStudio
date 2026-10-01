<template>
  <!--
    세계지도 SVG 를 화면에 넣고 클릭을 받는 컴포넌트. 다른 프로젝트로 그대로 복사해 가는 파일이다.
    지도 패키지(d3 등)는 필요 없다 — 세계지도 갤러리에서 저장한 SVG 파일 문자열만 받는다.

    SVG 안에 이미 들어 있는 표시를 이용한다
      data-region="R_ASIA" : 권역 타일 → 누르면 옆에 주요 국가 드롭다운
      data-code="KR"       : 나라 땅   → 누르면 'country' 이벤트 (규제 국가만 붙어 있다)
      class="wm-fx"        : 거점·연결선·본사 표시 묶음 → 거점·연결선 OFF 면 숨긴다

    다크·라이트: light-svg / dark-svg 로 두 파일을 주면 사이트 테마(<html data-theme="dark...">)를 지켜보다
    알아서 바꿔 끼운다. 사이트가 다른 방식으로 테마를 정하면 theme="dark" 처럼 직접 넘긴다.
    파일이 하나뿐이면 svg 하나만 줘도 된다.

    controls 를 주면 지도 왼쪽 위에 애니메이션 / 거점·연결선 ON/OFF 버튼이 생긴다.
    파일을 다시 만들지 않고 화면에서 켜고 끈다 (애니메이션은 SVG 의 pauseAnimations, 거점·연결선은 CSS)
  -->
  <div ref="box" class="wms" @mousemove="onMove" @mouseleave="tip = null" @click="onClick">
    <!-- <img> 로 넣으면 그림 한 장이라 클릭할 요소가 없다. 반드시 HTML 안에 직접(인라인) 넣는다 -->
    <div ref="host" class="wms-svg" :class="{ 'no-fx': !showMarkers }" v-html="markup"></div>

    <div v-if="controls" class="wms-fx" @click.stop>
      <button type="button" :class="{ off: !playing }" :aria-pressed="playing" :title="playing ? '애니메이션 멈추기' : '애니메이션 켜기'" @click="setPlaying(!playing)">
        <i class="bi" :class="playing ? 'bi-pause-fill' : 'bi-play-fill'" aria-hidden="true"></i>애니메이션 {{ playing ? 'ON' : 'OFF' }}
      </button>
      <button type="button" :class="{ off: !showMarkers }" :aria-pressed="showMarkers" :title="showMarkers ? '거점·연결선 숨기기' : '거점·연결선 보이기'" @click="setMarkers(!showMarkers)">
        <i class="bi bi-geo-alt" aria-hidden="true"></i>거점·연결선 {{ showMarkers ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div v-if="tip" class="wms-tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">{{ tip.text }}</div>

    <!-- 권역 타일 옆 드롭다운 -->
    <div v-if="openRegion" class="wms-drop" :style="dropStyle" @click.stop>
      <div class="wms-drop-head">
        <span class="wms-drop-title">{{ openRegion.name }}</span>
        <span class="wms-drop-sub">{{ openRegion.summary }}</span>
      </div>
      <button
        v-for="c in openRegion.countries"
        :key="c.code"
        type="button"
        class="wms-row"
        @click="pickCountry(c.code)"
      >
        <span class="wms-row-name">{{ c.name }}</span>
        <span v-if="c.badge != null" class="wms-row-badge">{{ c.badge }}</span>
        <i class="bi bi-chevron-right"></i>
      </button>
      <button type="button" class="wms-all" @click="pickRegion(openRegion)">
        {{ openRegion.name }} 전체 보기<i class="bi bi-arrow-right ms-1"></i>
      </button>
    </div>
  </div>
</template>

<script>
/** 사이트가 다크 테마인지: <html data-theme="dark | dark-navy"> */
const readSiteDark = () => (document.documentElement.getAttribute('data-theme') || '').startsWith('dark')

export default {
  name: 'WorldMapSvg',
  props: {
    /** 갤러리에서 저장한 SVG 파일 내용 (Vite: import lightSvg from './map-light.svg?raw') */
    lightSvg: { type: String, default: '' },
    darkSvg: { type: String, default: '' },
    /** 파일이 하나뿐일 때 (테마와 상관없이 이 파일) */
    svg: { type: String, default: '' },
    /** 'auto' 면 사이트 테마를 따라가고, 'light' | 'dark' 면 고정 */
    theme: { type: String, default: 'auto' },
    /**
     * 권역 타일을 눌렀을 때 드롭다운에 보여 줄 내용. 키는 SVG 의 data-region 값
     * { R_ASIA: { name: '아시아', summary: '규제 15건', countries: [{ code: 'KR', name: '한국', badge: '12건' }], allCodes: ['KR', 'JP', ...] } }
     * countries 는 드롭다운에 보일 주요 국가, allCodes 는 "전체 보기"로 넘길 권역 전체 국가 (없으면 countries)
     */
    regions: { type: Object, default: () => ({}) },
    /** 클릭할 수 있는 나라 (영문 2자리 → 이름). 여기 없는 나라는 눌러도 반응하지 않는다 */
    countries: { type: Object, default: () => ({}) },
    /** 지도 왼쪽 위에 애니메이션 / 거점·연결선 ON/OFF 버튼을 보일지 */
    controls: { type: Boolean, default: false },
    /** 처음 상태. v-model:animate / v-model:markers 로 바깥에서 쥘 수도 있다 */
    animate: { type: Boolean, default: true },
    markers: { type: Boolean, default: true }
  },
  emits: ['country', 'region', 'update:animate', 'update:markers'],
  data() {
    // 움직임 줄이기를 켠 사용자(OS 설정)에게는 애니메이션을 끈 채로 시작한다
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    return {
      playing: this.animate && !reduced,
      showMarkers: this.markers,
      siteDark: readSiteDark(),
      tip: null,
      // 열린 드롭다운 { cd, x, y(타일 오른쪽/왼쪽 끝, px), left(왼쪽으로 펼칠지), below } — 위치는 이 컴포넌트 기준
      open: null
    }
  },
  computed: {
    dark() {
      return this.theme === 'auto' ? this.siteDark : this.theme === 'dark'
    },
    // 지금 테마의 파일. 한쪽 파일만 있으면 그걸 쓴다
    markup() {
      if (this.svg) return this.svg
      return this.dark ? this.darkSvg || this.lightSvg : this.lightSvg || this.darkSvg
    },
    openRegion() {
      if (!this.open) return null
      const r = this.regions[this.open.cd]
      return r ? { cd: this.open.cd, ...r } : null
    },
    dropStyle() {
      const o = this.open
      return {
        left: `${o.x}px`,
        top: `${o.y}px`,
        transform: `translate(${o.left ? 'calc(-100% - 10px)' : '10px'}, ${o.below ? '-24px' : 'calc(-100% + 24px)'})`
      }
    }
  },
  watch: {
    // 파일을 바꿔 끼우면(테마 전환 포함) 클릭 가능한 나라 표시를 다시 붙이고 애니메이션 상태도 다시 적용한다
    markup() {
      this.open = null
      this.$nextTick(() => {
        this.markCountries()
        this.applyPlaying()
      })
    },
    animate(v) {
      this.playing = v
      this.applyPlaying()
    },
    markers(v) {
      this.showMarkers = v
    },
    countries() {
      this.markCountries()
    }
  },
  mounted() {
    this.markCountries()
    this.applyPlaying()
    document.addEventListener('click', this.onDocClick)
    document.addEventListener('keydown', this.onKey)
    // 사이트 테마 버튼을 누르면 <html data-theme> 이 바뀐다 → 지켜보다 파일을 바꿔 끼운다
    this.themeObserver = new MutationObserver(() => { this.siteDark = readSiteDark() })
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  },
  beforeUnmount() {
    this.themeObserver?.disconnect()
    document.removeEventListener('click', this.onDocClick)
    document.removeEventListener('keydown', this.onKey)
  },
  methods: {
    /* ---- 애니메이션 · 거점·연결선 ---- */
    applyPlaying() {
      const svgEl = this.$refs.host?.querySelector('svg')
      if (!svgEl) return
      if (this.playing) svgEl.unpauseAnimations()
      else svgEl.pauseAnimations()
    },
    setPlaying(on) {
      this.playing = on
      this.applyPlaying()
      this.$emit('update:animate', on)
    },
    setMarkers(on) {
      this.showMarkers = on
      this.$emit('update:markers', on)
    },
    /** 클릭할 수 있는 나라 땅에만 클래스를 붙인다 (커서·호버 효과를 CSS 로) */
    markCountries() {
      const host = this.$refs.host
      if (!host) return
      host.querySelectorAll('[data-code]').forEach((el) => {
        el.classList.toggle('wms-link', !!this.countries[el.dataset.code])
      })
    },
    // 마우스 아래 무엇이 있는지: 권역 타일이 나라보다 위에 그려져 있으니 먼저 본다
    targetOf(e) {
      const tile = e.target.closest?.('[data-region]')
      if (tile) return { tile, cd: tile.dataset.region }
      const code = e.target.closest?.('[data-code]')?.dataset.code
      if (code && this.countries[code]) return { code }
      return null
    },
    onMove(e) {
      const t = this.targetOf(e)
      if (!t || (t.cd && this.open && this.open.cd === t.cd)) {
        this.tip = null
        return
      }
      const box = this.$refs.box.getBoundingClientRect()
      const text = t.cd ? `${(this.regions[t.cd] || {}).name || t.cd} · 주요 국가 보기` : `${this.countries[t.code]} · 바로 가기`
      this.tip = { text, x: e.clientX - box.left + 12, y: e.clientY - box.top - 30 }
    },
    onClick(e) {
      const t = this.targetOf(e)
      if (!t) {
        this.open = null
        return
      }
      if (t.code) {
        this.pickCountry(t.code)
        return
      }
      // 같은 타일을 다시 누르면 닫는다
      if (this.open && this.open.cd === t.cd) {
        this.open = null
        return
      }
      const box = this.$refs.box.getBoundingClientRect()
      const r = t.tile.getBoundingClientRect()
      const cx = r.left + r.width / 2 - box.left
      const left = cx > box.width * 0.62 // 지도 오른편 타일은 왼쪽으로 펼쳐 칸 밖으로 안 나가게
      this.open = {
        cd: t.cd,
        x: left ? r.left - box.left : r.right - box.left,
        y: r.top + r.height / 2 - box.top,
        left,
        below: r.top + r.height / 2 - box.top < box.height * 0.5
      }
      this.tip = null
    },
    pickCountry(code) {
      this.open = null
      this.$emit('country', code)
    },
    pickRegion(region) {
      this.open = null
      this.$emit('region', region.cd, region.allCodes || region.countries.map((c) => c.code))
    },
    onDocClick(e) {
      if (!this.$refs.box?.contains(e.target)) this.open = null
    },
    onKey(e) {
      if (e.key === 'Escape') this.open = null
    }
  }
}
</script>

<style scoped>
.wms {
  position: relative;
}

.wms-svg :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

/* 거점·연결선 OFF: 저장할 때 SVG 에 넣어 둔 묶음(class="wm-fx")만 숨긴다 */
.wms-svg.no-fx :deep(.wm-fx) {
  display: none;
}

/* 지도 왼쪽 위 ON/OFF 버튼 */
.wms-fx {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
}

.wms-fx button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 10px 0 8px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.wms-fx button:hover {
  background: rgba(255, 255, 255, 0.24);
}

.wms-fx button.off {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
}

.wms-fx button:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 1px;
}

/* 클릭할 수 있는 나라: 올리면 밝아진다 */
.wms-svg :deep(.wms-link) {
  cursor: pointer;
  transition: filter 0.15s;
}

.wms-svg :deep(.wms-link:hover) {
  filter: brightness(1.45);
}

/* 권역 타일 (SVG 안 요소라 transform 대신 filter 로 반응) */
.wms-svg :deep([data-region]) {
  cursor: pointer;
  transition: filter 0.15s;
}

.wms-svg :deep([data-region]:hover) {
  filter: brightness(1.12) drop-shadow(0 4px 8px rgba(4, 16, 36, 0.35));
}

.wms-tip {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.88);
  color: #fff;
  white-space: nowrap;
}

.wms-drop {
  position: absolute;
  z-index: 4;
  width: 210px;
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-main, #212529);
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
  overflow: hidden;
}

.wms-drop-head {
  display: flex;
  flex-direction: column;
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
}

.wms-drop-title {
  font-size: 13px;
  font-weight: 700;
}

.wms-drop-sub {
  font-size: 11px;
  color: var(--b2b-color-text-muted, #6c757d);
}

.wms-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: inherit;
  text-align: left;
}

.wms-row:hover,
.wms-all:hover {
  background: var(--b2b-color-hover-bg, #f1f3f5);
}

.wms-row-name {
  flex: 1;
}

.wms-row-badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(var(--b2b-color-primary-rgb, 13, 110, 253), 0.1);
  color: var(--b2b-color-primary, #0d6efd);
}

.wms-row .bi {
  font-size: 11px;
  color: var(--b2b-color-text-muted, #6c757d);
}

.wms-all {
  width: 100%;
  border: none;
  border-top: 1px solid var(--b2b-color-border, #dee2e6);
  background: transparent;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--b2b-color-primary, #0d6efd);
  text-align: left;
}
</style>
