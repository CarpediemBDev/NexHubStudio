<template>
  <!--
    세계지도 SVG 를 화면에 넣고 클릭을 받는 컴포넌트. 다른 프로젝트로 그대로 복사해 가는 파일이다.
    지도 패키지(d3 등)는 필요 없다 — 세계지도 갤러리에서 저장한 SVG 파일 문자열만 받는다.

    SVG 안에 이미 들어 있는 표시를 이용한다
      data-region="R_ASIA" : 권역 타일 → 누르면 옆에 주요 국가 드롭다운
      data-cid="410"       : 나라 땅   → 누르면 'country' 이벤트 (영문 2자리 코드로 바꿔서)
  -->
  <div ref="box" class="wms" @mousemove="onMove" @mouseleave="tip = null" @click="onClick">
    <!-- <img> 로 넣으면 그림 한 장이라 클릭할 요소가 없다. 반드시 HTML 안에 직접(인라인) 넣는다 -->
    <div ref="host" class="wms-svg" v-html="svg"></div>

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
import { alpha2OfCid } from './isoNumeric'

export default {
  name: 'WorldMapSvg',
  props: {
    /** 갤러리에서 저장한 SVG 파일 내용 (Vite: import svg from './map.svg?raw') */
    svg: { type: String, required: true },
    /**
     * 권역 타일을 눌렀을 때 드롭다운에 보여 줄 내용. 키는 SVG 의 data-region 값
     * { R_ASIA: { name: '아시아', summary: '규제 15건', countries: [{ code: 'KR', name: '한국', badge: '12건' }], allCodes: ['KR', 'JP', ...] } }
     * countries 는 드롭다운에 보일 주요 국가, allCodes 는 "전체 보기"로 넘길 권역 전체 국가 (없으면 countries)
     */
    regions: { type: Object, default: () => ({}) },
    /** 클릭할 수 있는 나라 (영문 2자리 → 이름). 여기 없는 나라는 눌러도 반응하지 않는다 */
    countries: { type: Object, default: () => ({}) }
  },
  emits: ['country', 'region'],
  data() {
    return {
      tip: null,
      // 열린 드롭다운 { cd, x, y(타일 오른쪽/왼쪽 끝, px), left(왼쪽으로 펼칠지), below } — 위치는 이 컴포넌트 기준
      open: null
    }
  },
  computed: {
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
    // 파일을 바꿔 끼우면 클릭 가능한 나라 표시를 다시 붙인다
    svg() {
      this.open = null
      this.$nextTick(this.markCountries)
    },
    countries() {
      this.markCountries()
    }
  },
  mounted() {
    this.markCountries()
    document.addEventListener('click', this.onDocClick)
    document.addEventListener('keydown', this.onKey)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocClick)
    document.removeEventListener('keydown', this.onKey)
  },
  methods: {
    /** 클릭할 수 있는 나라 땅에만 클래스를 붙인다 (커서·호버 효과를 CSS 로) */
    markCountries() {
      const host = this.$refs.host
      if (!host) return
      host.querySelectorAll('[data-cid]').forEach((el) => {
        el.classList.toggle('wms-link', !!this.countries[alpha2OfCid(el.dataset.cid)])
      })
    },
    // 마우스 아래 무엇이 있는지: 권역 타일이 나라보다 위에 그려져 있으니 먼저 본다
    targetOf(e) {
      const tile = e.target.closest?.('[data-region]')
      if (tile) return { tile, cd: tile.dataset.region }
      const land = e.target.closest?.('[data-cid]')
      const code = land && alpha2OfCid(land.dataset.cid)
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
