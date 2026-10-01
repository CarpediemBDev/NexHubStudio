<template>
  <div class="container-fluid py-4">
    <WorldMapStyleCarousel :model-value="active.key" :view-key="viewKey" @update:model-value="selectStyleKey" />

    <!-- 선택한 디자인 크게 보기 -->
    <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-card p-3">
      <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <span class="wm-no lg">{{ pad(current + 1) }}</span>
        <span class="b2b-text-h3 text-theme-primary fw-bold">{{ active.name }}</span>
        <span class="wm-tone" :class="active.tone">{{ active.tone === 'dark' ? '다크' : '라이트' }}</span>
        <span class="wm-kind">{{ kindLabel(active.kind) }}</span>
        <div class="ms-auto d-flex gap-1">
          <button type="button" class="btn btn-sm btn-outline-secondary" :title="playing ? '애니메이션 멈춤' : '애니메이션 재생'" @click="togglePlay">
            <i class="bi" :class="playing ? 'bi-pause-fill' : 'bi-play-fill'"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" title="이전 디자인 (←)" @click="select(current - 1)">
            <i class="bi bi-arrow-left"></i>
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" title="다음 디자인 (→)" @click="select(current + 1)">
            <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
      <!-- 지도 레이아웃: 투영법 · 가운데 기준 (지구본 디자인에는 해당 없음) -->
      <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <span class="wm-tool-label">투영법</span>
        <div class="wm-seg" role="group" aria-label="투영법">
          <button
            v-for="p in PROJECTIONS"
            :key="p.key"
            type="button"
            :class="{ on: projKey === p.key }"
            :disabled="isGlobe"
            :title="p.desc"
            @click="setView(p.key, centerKey)"
          >
            {{ p.label }}
          </button>
        </div>
        <span class="wm-tool-label ms-2">가운데</span>
        <div class="wm-seg" role="group" aria-label="지도 가운데 기준">
          <button
            v-for="c in CENTERS"
            :key="c.key"
            type="button"
            :class="{ on: centerKey === c.key }"
            :disabled="isGlobe"
            :title="c.desc"
            @click="setView(projKey, c.key)"
          >
            {{ c.label }}
          </button>
        </div>
        <span class="wm-stat">{{ isGlobe ? '지구본 디자인은 투영법이 정해져 있어요 (정사영)' : viewDesc }}</span>
      </div>

      <!-- 렌더링 방식 비교 도구: Canvas / SVG / 나란히, 확대 배율 -->
      <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <div class="wm-seg" role="group" aria-label="렌더링 방식">
          <button v-for="m in RENDERERS" :key="m.key" type="button" :class="{ on: renderer === m.key }" @click="setRenderer(m.key)">
            {{ m.label }}
          </button>
        </div>
        <div class="wm-seg" role="group" aria-label="확대 배율">
          <button v-for="z in ZOOMS" :key="z" type="button" :class="{ on: zoom === z }" @click="zoom = z">{{ z }}x</button>
        </div>
        <label class="wm-check" :class="{ off: !tilesOn }" title="타일을 끌어서 위치를 옮겨요. 옮긴 위치는 SVG 저장 파일에도 들어가요">
          <input v-model="editTiles" type="checkbox" :disabled="!tilesOn" />
          위치 편집
        </label>
        <button v-if="hasMovedTiles" type="button" class="btn btn-sm btn-link px-1 py-0 wm-reset" @click="resetTiles">
          <i class="bi bi-arrow-counterclockwise me-1"></i>위치 초기화
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="downloadSvg">
          <i class="bi bi-download me-1"></i>SVG 파일 저장
        </button>
        <!-- PNG: 픽셀 그림이라 해상도를 고른다. 1x = 960x480 -->
        <div class="wm-png">
          <div class="wm-seg" role="group" aria-label="PNG 해상도">
            <button
              v-for="k in PNG_SCALES"
              :key="k"
              type="button"
              :class="{ on: pngScale === k }"
              :title="`${960 * k} x ${480 * k}`"
              @click="pngScale = k"
            >
              {{ k }}x
            </button>
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="pngBusy" @click="downloadPng">
            <i class="bi me-1" :class="pngBusy ? 'bi-hourglass-split' : 'bi-image'"></i>PNG 파일 저장
          </button>
        </div>
        <span class="wm-stat ms-auto">
          <span v-if="panes.canvas">Canvas: 요소 1개 · 그리기 {{ canvasStat.ms }}ms</span>
          <span v-if="panes.svg">SVG: 요소 {{ svgStat.nodes.toLocaleString() }}개 · {{ svgStat.kb }}KB · 생성 {{ svgStat.ms }}ms</span>
          <span v-if="panes.echarts">ECharts: 옵션 적용 {{ ecStat.ms }}ms</span>
        </span>
      </div>

      <WorldMapTileCarousel :model-value="tileStyle" :tone="active.tone" :enabled="showTiles" :available="tilesAvailable" :unavailable-reason="tilesOffReason" @update:model-value="setTileStyle" @update:enabled="showTiles = $event" />
      <div ref="stageBox" class="wm-stage-row" :class="{ split: paneCount > 1 }">
        <div
          v-show="panes.canvas"
          ref="canvasPane"
          class="wm-pane"
          :class="{ 'is-link': tip && tip.pane === 'canvas' && tip.link }"
          @mousemove="onCanvasHover"
          @mouseleave="tip = null"
          @click="onCanvasClick"
        >
          <span class="wm-pane-tag">Canvas</span>
          <div class="wm-zoom" :style="zoomStyle">
            <canvas ref="stage" class="wm-stage-canvas"></canvas>
          </div>
          <div v-if="tip && tip.pane === 'canvas'" class="wm-tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">{{ tip.text }}</div>
          <RegionTileLayer
            v-if="tilesOn && tilePane === 'canvas'"
            :view="viewKey"
            :editable="editTiles"
            :tileLL="tileLL"
            :tileStyle="tileStyle"
            :mapTone="active.tone"
            @move="moveTile"
          />
        </div>
        <div
          v-show="panes.svg"
          class="wm-pane"
          :class="{ 'is-link': tip && tip.pane === 'svg' && tip.link }"
          @mousemove="onSvgHover"
          @mouseleave="tip = null"
          @click="onSvgClick"
        >
          <span class="wm-pane-tag">SVG</span>
          <div class="wm-zoom" :style="zoomStyle">
            <div ref="svgHost" class="wm-svg-host"></div>
          </div>
          <!-- 나란히 비교일 때 타일은 한 칸에만 (드롭다운이 두 칸에서 같이 열리지 않게) -->
          <RegionTileLayer
            v-if="tilesOn && tilePane === 'svg'"
            :view="viewKey"
            :editable="editTiles"
            :tileLL="tileLL"
            :tileStyle="tileStyle"
            :mapTone="active.tone"
            @move="moveTile"
          />
          <div v-if="tip && tip.pane === 'svg'" class="wm-tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">{{ tip.text }}</div>
        </div>
        <!-- ECharts: 툴팁·클릭은 ECharts 기본 기능(geo tooltip / click 이벤트)으로 -->
        <div v-show="panes.echarts" ref="ecPane" class="wm-pane">
          <span class="wm-pane-tag">ECharts</span>
          <div class="wm-zoom" :style="zoomStyle">
            <div ref="ecHost" class="wm-ec-host"></div>
          </div>
          <RegionTileLayer
            v-if="tilesOn && tilePane === 'echarts'"
            :view="viewKey"
            :editable="editTiles"
            :tileLL="tileLL"
            :tileStyle="tileStyle"
            :mapTone="active.tone"
            @move="moveTile"
          />
          <div v-if="isGlobe" class="wm-ec-note">
            {{ ecLoading ? 'echarts-gl 불러오는 중…' : 'echarts-gl 3D 지구본 · 마우스로 돌리고 휠로 확대 · 나라 점을 누르면 규제 화면' }}
          </div>
        </div>
      </div>
      <p class="b2b-text-body text-theme-secondary mt-2 mb-1">{{ active.desc }}</p>
      <p class="b2b-text-sm text-theme-muted mb-0">
        <i class="bi bi-info-circle me-1"></i>
        확대 배율을 올리면 차이가 보여요. Canvas 는 화면 크기만큼의 픽셀 그림이라 확대하면 흐려지고(다시 그려야 선명해짐),
        SVG 는 벡터라 몇 배를 키워도 선명해요. 지도에서 규제 대상 국가를 누르면 그 나라 규제 화면으로 이동해요.
      </p>
    </div>
  </div>
</template>

<script>
import { MAP_STYLES } from './worldMap/mapStyles'
import * as engine from './worldMap/mapEngine'

const { createStage, setFlatView, PROJECTIONS, CENTERS, HQ, W, H } = engine
import { buildSvg, isGlobeStyle } from './worldMap/svgEngine'
import RegionTileLayer from './worldMap/RegionTileLayer.vue'
import { loadTileLL, saveTileLL } from './worldMap/regionTiles'
import { regCountryOf } from './worldMap/countryLink'
import { worldMapDesign } from './worldMap/designSelection'
import WorldMapStyleCarousel from './worldMap/WorldMapStyleCarousel.vue'
import WorldMapTileCarousel from './worldMap/WorldMapTileCarousel.vue'
import { showToast } from '@/utils/toastUtil.js'

// 보여 줄 칸과 타일을 올릴 칸. 나란히 비교에서는 드롭다운이 두 칸에서 같이 열리지 않게 타일을 한 칸에만 둔다
const RENDERERS = [
  { key: 'canvas', label: 'Canvas', panes: ['canvas'], tile: 'canvas' },
  { key: 'svg', label: 'SVG', panes: ['svg'], tile: 'svg' },
  { key: 'echarts', label: 'ECharts', panes: ['echarts'], tile: 'echarts' },
  { key: 'split', label: 'Canvas | SVG', panes: ['canvas', 'svg'], tile: 'svg' },
  { key: 'split-ec', label: 'SVG | ECharts', panes: ['svg', 'echarts'], tile: 'echarts' }
]
const ZOOMS = [1, 3, 6]
// PNG 배율. 1x=960x480, 2x=1920x960 (PPT·보고서 권장), 3x=2880x1440 (대형 화면·인쇄)
const PNG_SCALES = [1, 2, 3]


const KIND_LABEL = {
  dot: '도트', hex: '헥사곤', square: '픽셀', diamond: '마름모', plus: '십자 패턴', scan: '가로줄',
  halftone: '하프톤', fill: '면', globe: '지구본', dotglobe: '도트 지구본'
}

export default {
  name: 'WorldMapGalleryPage',
  components: { RegionTileLayer, WorldMapStyleCarousel, WorldMapTileCarousel },
  data() {
    return {
      styles: MAP_STYLES,
      playing: true,
      RENDERERS,
      ZOOMS,
      renderer: 'split',
      zoom: 1,
      tip: null,
      editTiles: false,
      PNG_SCALES,
      pngScale: 2,
      pngBusy: false,
      // 끌어 옮긴 타일 위치 { R_ASIA: [lon, lat] }. 경위도라 투영법을 바꿔도 같은 땅 위에 남는다
      tileLL: loadTileLL(),
      PROJECTIONS,
      CENTERS,
      projKey: engine.flatView.proj,
      centerKey: engine.flatView.center,
      canvasStat: { ms: 0 },
      svgStat: { nodes: 0, kb: 0, ms: 0 },
      ecStat: { ms: 0 },
      ecLoading: false
    }
  },
  computed: {
    current: {
      get() { return Math.max(0, MAP_STYLES.findIndex((style) => style.key === worldMapDesign.styleKey)) },
      set(index) { worldMapDesign.styleKey = MAP_STYLES[index]?.key || MAP_STYLES[0].key }
    },
    tileStyle: {
      get() { return worldMapDesign.tileStyleKey },
      set(key) { worldMapDesign.tileStyleKey = key }
    },
    showTiles: {
      get() { return worldMapDesign.tilesEnabled },
      set(enabled) { worldMapDesign.tilesEnabled = enabled }
    },
    active() {
      return this.styles[this.current]
    },
    rendererDef() {
      return RENDERERS.find((r) => r.key === this.renderer) || RENDERERS[0]
    },
    panes() {
      const on = this.rendererDef.panes
      return { canvas: on.includes('canvas'), svg: on.includes('svg'), echarts: on.includes('echarts') }
    },
    paneCount() {
      return this.rendererDef.panes.length
    },
    // 타일(HTML 층)을 올릴 칸. 나란히 비교에서는 드롭다운이 두 칸에서 같이 열리지 않게 한 칸에만
    tilePane() {
      return this.rendererDef.tile
    },
    // 타일은 평면 지도 좌표에 고정돼 있어 회전하는 지구본·확대 화면에서는 위치가 맞지 않는다
    tilesAvailable() {
      return !isGlobeStyle(this.active) && this.zoom === 1
    },
    tilesOffReason() {
      return isGlobeStyle(this.active) ? '지구본 디자인에서는 쓸 수 없어요' : '확대 1x 에서만 보여요'
    },
    tilesOn() {
      return this.showTiles && this.tilesAvailable
    },
    hasMovedTiles() {
      return this.tilesOn && Object.keys(this.tileLL).length > 0
    },
    isGlobe() {
      return isGlobeStyle(this.active)
    },
    viewKey() {
      return `${this.projKey}|${this.centerKey}`
    },
    viewDesc() {
      return (PROJECTIONS.find((p) => p.key === this.projKey) || {}).desc
    },
    // 확대 기준점: 평면 지도는 서울, 지구본은 가운데. 투영이 바뀌면 서울 위치도 바뀐다
    zoomStyle() {
      let origin = '50% 50%'
      if (!this.isGlobe) {
        void this.viewKey
        const [x, y] = engine.flatProj(HQ.ll)
        origin = `${((x / W) * 100).toFixed(1)}% ${((y / H) * 100).toFixed(1)}%`
      }
      return { transform: `scale(${this.zoom})`, transformOrigin: origin }
    }
  },
  watch: {
    tilesOn(on) {
      if (!on) this.editTiles = false
    }
  },
  mounted() {
    this.stageApi = createStage(this.$refs.stage)
    this.renderStage()
    // 나란히 비교로 바뀌면 캔버스 칸 너비가 달라지므로 칸 자체를 지켜본다
    this.ro = new ResizeObserver(() => {
      this.stageApi.resize()
      if (this.ecApi && this.panes.echarts) this.ecApi.resize()
    })
    this.ro.observe(this.$refs.canvasPane)
    this.ro.observe(this.$refs.ecPane)
    window.addEventListener('keydown', this.onKey)
  },
  beforeUnmount() {
    this.stageApi?.destroy()
    this.ecApi?.destroy()
    cancelAnimationFrame(this.svgRaf)
    this.ro?.disconnect()
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    pad(n) {
      return String(n).padStart(2, '0')
    },
    kindLabel(k) {
      return KIND_LABEL[k] || k
    },
    selectStyleKey(key) {
      this.select(this.styles.findIndex((style) => style.key === key))
    },
    select(i) {
      const n = this.styles.length
      this.current = (i + n) % n
      this.tip = null
      this.renderStage()
    },
    // 투영법·가운데를 바꾸면 무대와 평면 지도 썸네일을 모두 다시 그린다
    setView(proj, center) {
      if (!setFlatView(proj, center)) return
      this.projKey = proj
      this.centerKey = center
      this.tip = null
      this.renderStage()
    },
    /* ---- 타일 디자인·그리기 방식 ---- */
    setTileStyle(key) {
      this.tileStyle = key
    },
    /* ---- 타일 위치 편집 ---- */
    moveTile(cd, ll) {
      this.tileLL = { ...this.tileLL, [cd]: ll }
      saveTileLL(this.tileLL)
    },
    resetTiles() {
      this.tileLL = {}
      saveTileLL(this.tileLL)
    },
    setRenderer(key) {
      this.renderer = key
      this.tip = null
      // v-show 로 칸이 다시 보이면 크기가 바뀐 뒤에 그려야 하므로 한 틱 미룬다
      this.$nextTick(() => this.renderStage())
    },
    /* ---- 무대 그리기 ---- */
    renderStage() {
      const s = this.active
      const showCanvas = this.panes.canvas
      const showSvg = this.panes.svg
      this.renderEcharts(s)

      // Canvas: 보이지 않을 땐 애니메이션도 멈춰 CPU 를 아낀다
      this.stageApi.setStyle(s)
      this.stageApi.setPlaying(this.playing && showCanvas)
      if (showCanvas) this.measureCanvas(s)

      cancelAnimationFrame(this.svgRaf)
      const host = this.$refs.svgHost
      if (!showSvg) {
        host.innerHTML = ''
        return
      }
      const t0 = performance.now()
      host.innerHTML = buildSvg(s, 1.4, 'stage')
      const ms = performance.now() - t0
      this.svgStat = {
        nodes: host.querySelectorAll('*').length,
        kb: Math.round(host.innerHTML.length / 1024),
        ms: Math.round(ms)
      }
      if (isGlobeStyle(s)) {
        // 지구본은 회전 때문에 매 프레임 마크업을 다시 만든다 (평면 지도는 SVG 자체 애니메이션이라 필요 없음)
        const start = performance.now()
        const tick = (now) => {
          host.innerHTML = buildSvg(s, 1.4 + (now - start) / 1000, 'stage')
          this.svgRaf = requestAnimationFrame(tick)
        }
        if (this.playing) this.svgRaf = requestAnimationFrame(tick)
      } else if (!this.playing) {
        host.querySelector('svg')?.pauseAnimations()
      }
    },
    /**
     * ECharts 칸. echarts 는 처음 ECharts 칸을 열 때 불러온다 (안 보는 사람은 내려받지 않게)
     * 애니메이션 멈춤은 ECharts 내부 렌더러(zrender)의 애니메이션을 멈춘다
     */
    async renderEcharts(s) {
      if (!this.panes.echarts) return
      if (!this.ecApi) {
        const { createEchartsStage } = await import('./worldMap/echartsEngine')
        if (this.ecApi || !this.$refs.ecHost) return
        this.ecApi = createEchartsStage(this.$refs.ecHost, { onCountryClick: (cid) => this.goCountryRegulation(cid) })
      }
      if (s !== this.active) return
      this.ecApi.chart.resize()
      // 지구본은 처음 고를 때 echarts-gl 을 불러오느라 잠깐 걸린다
      this.ecLoading = isGlobeStyle(s)
      const ms = await this.ecApi.setStyle(s)
      if (s !== this.active) return
      this.ecLoading = false
      this.ecStat = { ms: Math.round(ms) }
      this.ecApi.setPlaying(this.playing)
    },
    // Canvas 한 장 그리는 시간: 무대와 같은 너비의 임시 캔버스로 잰다
    measureCanvas(s) {
      const cv = document.createElement('canvas')
      const t0 = performance.now()
      drawOnce(cv, s, this.$refs.canvasPane.clientWidth || 960)
      this.canvasStat = { ms: Math.round(performance.now() - t0) }
    },
    /* ---- 나라 땅 호버·클릭 → 규제 화면 ----
     * SVG 는 눌린 요소의 data-cid 로, Canvas 는 그림뿐이라 좌표로 육지 래스터를 찾아 나라를 안다 */
    showCountryTip(e, pane, cid, fallbackName) {
      const reg = regCountryOf(cid)
      const box = e.currentTarget.getBoundingClientRect()
      this.tip = {
        pane,
        link: !!reg && !this.editTiles,
        text: reg ? `${reg.name} · 규제 보기` : fallbackName,
        x: e.clientX - box.left + 12,
        y: e.clientY - box.top - 28
      }
    },
    goCountryRegulation(cid) {
      if (this.editTiles) return
      const reg = regCountryOf(cid)
      if (reg) this.$router.push({ name: 'RegulationInfo', query: { country: reg.code } })
    },
    onSvgHover(e) {
      const el = e.target.closest?.('[data-cid]')
      if (!el) {
        this.tip = null
        return
      }
      this.showCountryTip(e, 'svg', el.dataset.cid, el.dataset.name)
    },
    onSvgClick(e) {
      const el = e.target.closest?.('[data-cid]')
      if (el) this.goCountryRegulation(el.dataset.cid)
    },
    // Canvas 칸 안의 마우스 위치 → 960x480 지도 좌표. 확대(transform) 중이어도 캔버스 실제 사각형 기준이라 맞는다
    // 마우스 위치 → 960x480 지도 좌표 (캔버스 실제 사각형 기준이라 확대 중이어도 맞는다)
    canvasPoint(e) {
      const r = this.$refs.stage.getBoundingClientRect()
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]
    },
    canvasCountry(e) {
      if (this.isGlobe) return null
      return engine.countryAt(...this.canvasPoint(e))
    },
    onCanvasHover(e) {
      const f = this.canvasCountry(e)
      if (!f) {
        this.tip = null
        return
      }
      this.showCountryTip(e, 'canvas', f.cid, f.properties.name)
    },
    onCanvasClick(e) {
      const f = this.canvasCountry(e)
      if (f) this.goCountryRegulation(f.cid)
    },
    /* ---- 파일 저장 (SVG / PNG) ---- */
    // 권역 타일은 화면에서 켜 둔 경우에만 넣는다 (확대 배율과 상관없이 파일은 항상 전체 지도)
    exportTiles() {
      return this.showTiles && !this.isGlobe
    },
    exportSvgMarkup() {
      return buildSvg(this.active, 1.4, 'wm', { tiles: this.exportTiles(), tileLL: this.tileLL, tileStyle: this.tileStyle })
    },
    // 투영·가운데별로 여러 장 저장해도 이름이 겹치지 않게 붙인다 (지구본은 투영이 정해져 있어 디자인 이름만)
    exportBaseName() {
      if (this.isGlobe) return `worldmap-${this.active.key}`
      return `worldmap-${this.active.key}-${this.projKey}-${this.centerKey}${this.exportTiles() ? '-tiles' : ''}`
    },
    saveBlob(blob, name) {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    },
    downloadSvg() {
      // 파일에는 고정 크기(width/height)를 빼고 viewBox 만 남긴다.
      // 고정 크기가 있으면 브라우저로 열었을 때 960x480 그대로 왼쪽 위에 붙고,
      // viewBox 만 있으면 넣는 곳(창·img·문서) 너비에 맞춰 비율을 지키며 가운데로 늘어난다
      const markup = this.exportSvgMarkup().replace(' width="960" height="480"', '')
      this.saveBlob(new Blob([markup], { type: 'image/svg+xml' }), `${this.exportBaseName()}.svg`)
    },
    /**
     * PNG 는 SVG 를 한 번 만들고 그걸 고른 배율의 캔버스에 그려 픽셀로 굳힌다.
     * 그래서 모양·타일 위치가 SVG 저장본과 똑같다. 애니메이션은 첫 장면에서 멈춘다.
     * 픽셀 그림이라 타일 클릭 정보(data-region)는 남지 않는다.
     */
    async downloadPng() {
      if (this.pngBusy) return
      this.pngBusy = true
      const url = URL.createObjectURL(new Blob([this.exportSvgMarkup()], { type: 'image/svg+xml' }))
      try {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('SVG 를 이미지로 읽지 못했어요'))
          img.src = url
        })
        const k = this.pngScale
        const cv = document.createElement('canvas')
        cv.width = W * k
        cv.height = H * k
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
        const blob = await new Promise((resolve) => cv.toBlob(resolve, 'image/png'))
        this.saveBlob(blob, `${this.exportBaseName()}@${k}x.png`)
      } catch (e) {
        showToast(`PNG 저장에 실패했어요. ${e.message}`, { type: 'danger' })
      } finally {
        URL.revokeObjectURL(url)
        this.pngBusy = false
      }
    },
    togglePlay() {
      this.playing = !this.playing
      this.renderStage()
    },
    onKey(e) {
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowLeft') this.select(this.current - 1)
      else if (e.key === 'ArrowRight') this.select(this.current + 1)
    }
  }
}
</script>

<style scoped>
.wm-strip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wm-track {
  position: relative; /* 카드 offsetLeft 의 기준을 트랙으로 */
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  padding: 4px 2px;
}

.wm-track::-webkit-scrollbar {
  display: none;
}

.wm-nav {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-main, #212529);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, opacity 0.15s;
}

.wm-nav:hover:not(:disabled) {
  background: var(--b2b-color-hover-bg, #f1f3f5);
}

.wm-nav:disabled {
  opacity: 0.35;
}

.wm-card {
  flex: none;
  width: 220px;
  scroll-snap-align: start;
  padding: 0;
  border-radius: 12px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-card, #fff);
  overflow: hidden;
  text-align: left;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.wm-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.1);
}

.wm-card.on {
  border-color: var(--b2b-color-primary, #0d6efd);
  box-shadow: 0 0 0 2px rgba(var(--b2b-color-primary-rgb, 13, 110, 253), 0.25);
}

.wm-thumb {
  display: block;
  width: 100%;
}

.wm-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--b2b-color-text-main, #212529);
}

.wm-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.wm-no {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--b2b-color-text-muted, #6c757d);
}

.wm-no.lg {
  font-size: 13px;
}

.wm-tone,
.wm-kind {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  white-space: nowrap;
}

.wm-tone.dark {
  background: #1e293b;
  color: #e2e8f0;
}

.wm-tone.light {
  background: #eef2f7;
  color: #475569;
}

.wm-kind {
  background: rgba(var(--b2b-color-primary-rgb, 13, 110, 253), 0.1);
  color: var(--b2b-color-primary, #0d6efd);
}

.wm-pager {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.wm-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--b2b-color-border, #dee2e6);
  transition: width 0.2s, background 0.2s;
}

.wm-dot.on {
  width: 18px;
  background: var(--b2b-color-primary, #0d6efd);
}

/* ---- 비교 도구 ---- */
.wm-seg {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  background: var(--b2b-color-tab-bg, #f1f3f5);
}

.wm-seg button {
  border: none;
  background: transparent;
  height: 26px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--b2b-color-text-muted, #6c757d);
}

.wm-seg button.on {
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-main, #212529);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
}

.wm-tool-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--b2b-color-text-muted, #6c757d);
}

.wm-seg button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.wm-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--b2b-color-text-main, #212529);
  cursor: pointer;
}

/* ---- 타일 디자인 고르기 (캐러셀 카드) ---- */
.wm-nav.sm {
  width: 30px;
  height: 30px;
}

.wm-tile-pick {
  flex: none;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 150px;
  padding: 8px 6px 7px;
  border-radius: 12px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  background: #eef2f7;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.wm-tile-pick:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.1);
}

/* 어두운 지도 디자인이면 미리보기 바탕도 어둡게 (실제 지도 위 모습에 가깝게) */
.wm-tile-pick.dark {
  background: #0f1d36;
}

.wm-tile-pick.on {
  border-color: var(--b2b-color-primary, #0d6efd);
  box-shadow: 0 0 0 2px rgba(var(--b2b-color-primary-rgb, 13, 110, 253), 0.25);
}

.wm-tile-pick-art {
  width: 136px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wm-tile-pick-art :deep(svg) {
  max-width: 136px;
  max-height: 64px;
  width: auto !important;
}

.wm-tile-pick-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--b2b-color-text-main, #212529);
}

.wm-tile-pick.dark .wm-tile-pick-name,
.wm-tile-pick.dark .wm-no {
  color: #cbd5e1;
}

.wm-png {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.wm-reset {
  font-size: 12px;
  text-decoration: none;
}

.wm-check.off {
  color: var(--b2b-color-text-muted, #6c757d);
  cursor: not-allowed;
}

.wm-stat {
  font-size: 12px;
  color: var(--b2b-color-text-muted, #6c757d);
  font-variant-numeric: tabular-nums;
}

/* ---- 무대 ---- */
.wm-stage-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.wm-stage-row.split {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.wm-pane {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--b2b-color-border, #dee2e6);
}

.wm-pane-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  pointer-events: none;
}

.wm-zoom {
  transition: transform 0.35s ease;
}

.wm-stage-canvas {
  display: block;
  width: 100%;
}

/* ECharts 는 칸에 높이가 있어야 그린다. 다른 렌더러와 같은 2:1 */
.wm-ec-host {
  width: 100%;
  aspect-ratio: 2 / 1;
}

.wm-ec-note {
  position: absolute;
  left: 8px;
  bottom: 8px;
  z-index: 2;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  pointer-events: none;
}

.wm-svg-host :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}

/* SVG 는 나라 하나가 요소 하나라 CSS 만으로 호버가 된다 */
.wm-svg-host :deep(path.c) {
  transition: opacity 0.15s;
}

/* 규제 대상 나라 위에서만 손가락 커서 (누르면 규제 화면으로) */
.wm-pane.is-link {
  cursor: pointer;
}

.wm-svg-host :deep(path.c:hover) {
  opacity: 0.6;
}

.wm-tip {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.85);
  color: #fff;
  white-space: nowrap;
}
</style>
