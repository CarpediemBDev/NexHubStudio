<template>
  <div class="container-fluid py-4">
    <WorldMapStyleCarousel :model-value="active.key" :view-key="viewKey" @update:model-value="selectStyleKey" />

    <!-- 선택한 디자인 크게 보기 -->
    <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-card p-3">
      <!-- 지도 레이아웃: 투영법 · 지도 중심 (지구본 디자인에는 해당 없음). 라벨은 버튼 묶음 위에 둬서 버튼과 헷갈리지 않게 -->
      <div class="d-flex align-items-end gap-3 mb-2 flex-wrap">
        <div class="wm-field">
          <span id="wm-label-proj" class="wm-tool-label"><i class="bi bi-map" aria-hidden="true"></i>투영법</span>
          <div class="wm-seg" role="group" aria-labelledby="wm-label-proj">
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
        </div>
        <div class="wm-field">
          <span id="wm-label-center" class="wm-tool-label"><i class="bi bi-crosshair" aria-hidden="true"></i>지도 중심</span>
          <div class="wm-seg" role="group" aria-labelledby="wm-label-center">
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
        </div>
        <span class="wm-stat pb-1">{{ isGlobe ? '지구본 디자인은 투영법이 정해져 있어요 (정사영)' : viewDesc }}</span>
      </div>

      <!-- 렌더링 방식 비교 도구: Canvas / SVG / 나란히. 확대는 지도 위에서 휠·드래그로 -->
      <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
        <div class="wm-seg" role="group" aria-label="렌더링 방식">
          <button v-for="m in RENDERERS" :key="m.key" type="button" :class="{ on: renderer === m.key }" @click="setRenderer(m.key)">
            {{ m.label }}
          </button>
        </div>
        <label class="wm-check" :class="{ off: !tilesOn }" title="타일을 끌어서 위치를 옮겨요. 옮긴 위치는 SVG 저장 파일에도 들어가요">
          <input v-model="editTiles" type="checkbox" :disabled="!tilesOn" />
          위치 편집
        </label>
        <button v-if="hasMovedTiles" type="button" class="btn btn-sm btn-link px-1 py-0 wm-reset" @click="resetTiles">
          <i class="bi bi-arrow-counterclockwise me-1"></i>위치 초기화
        </button>
        <!-- 파일 저장: SVG 1개 + PNG 해상도 3가지를 한 메뉴로 (해상도 버튼이 확대 버튼처럼 보이지 않게) -->
        <div class="wm-save">
          <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="pngBusy" :aria-expanded="saveOpen" @click.stop="saveOpen = !saveOpen">
            <i class="bi me-1" :class="pngBusy ? 'bi-hourglass-split' : 'bi-download'"></i>파일 저장<i class="bi bi-chevron-down ms-1 small"></i>
          </button>
          <div v-if="saveOpen" class="wm-save-menu" @click.stop>
            <!-- 한 쌍: 같은 디자인의 라이트·다크 두 파일을 zip 하나로. 끄면 지금 보이는 테마 한 장 -->
            <label class="wm-save-pair">
              <input v-model="savePair" type="checkbox" />
              <span><b>다크·라이트 한 쌍으로 저장</b><small>{{ savePair ? '라이트·다크 두 파일을 zip 하나로' : `지금 보이는 ${tone === 'dark' ? '다크' : '라이트'} 한 장` }}</small></span>
            </label>
            <button type="button" @click="saveAs('svg')">
              <i class="bi bi-filetype-svg"></i><span><b>SVG</b><small>벡터 · 클릭 가능 · 웹 화면용</small></span>
            </button>
            <button v-for="k in PNG_SCALES" :key="k" type="button" @click="saveAs('png', k)">
              <i class="bi bi-filetype-png"></i><span><b>PNG {{ 960 * k }}×{{ 480 * k }}</b><small>{{ PNG_HINT[k] }}</small></span>
            </button>
          </div>
        </div>
        <span class="wm-stat ms-auto">
          <span v-if="panes.canvas">Canvas: 요소 1개 · 그리기 {{ canvasStat.ms }}ms</span>
          <span v-if="panes.svg">SVG: 요소 {{ svgStat.nodes.toLocaleString() }}개 · {{ svgStat.kb }}KB · 생성 {{ svgStat.ms }}ms</span>
          <span v-if="panes.echarts">ECharts: 옵션 적용 {{ ecStat.ms }}ms</span>
        </span>
      </div>

      <WorldMapTileCarousel :model-value="tileStyle" :tone="active.tone" :enabled="showTiles" :available="tilesAvailable" :unavailable-reason="tilesOffReason" @update:model-value="setTileStyle" @update:enabled="showTiles = $event" />
      <div
        ref="stageBox"
        class="wm-stage-row"
        :class="{ split: paneCount > 1, zoomed: view.k > 1.001, panning: !!pan }"
        @wheel="onStageWheel"
        @pointerdown="onPanStart"
        @dblclick="onStageDblClick"
        @click.capture="onStageClickCapture"
      >
        <!-- 지도 위 도구: 왼쪽 위 애니메이션·거점·연결선 ON/OFF -->
        <MapFxToggles :animate-toggle="true" :markers-toggle="true" />
        <!-- 오른쪽 아래 확대 도구: 휠·끌기로도 되지만 처음 보는 사람·마우스 없이 쓰는 사람을 위해 -->
        <MapZoomTools v-if="zoomable" :k="view.k" :max="ZOOM_MAX" hint="휠로 확대·축소, 끌어서 이동, 더블클릭으로 확대" @zoom="zoomBy" @reset="resetZoom" />
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
            <RegionTileLayer
              v-if="tilesOn && tilePane === 'canvas'"
              :view="viewKey"
              :editable="editTiles"
              :tileLL="tileLL"
              :tileStyle="tileStyle"
              :mapTone="active.tone"
              :inv="1 / view.k"
              @move="moveTile"
            />
          </div>
          <div v-if="tip && tip.pane === 'canvas'" class="wm-tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">{{ tip.text }}</div>
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
            <!-- 나란히 비교일 때 타일은 한 칸에만 (드롭다운이 두 칸에서 같이 열리지 않게) -->
            <RegionTileLayer
              v-if="tilesOn && tilePane === 'svg'"
              :view="viewKey"
              :editable="editTiles"
              :tileLL="tileLL"
              :tileStyle="tileStyle"
              :mapTone="active.tone"
              :inv="1 / view.k"
              @move="moveTile"
            />
          </div>
          <div v-if="tip && tip.pane === 'svg'" class="wm-tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }">{{ tip.text }}</div>
        </div>
        <!-- ECharts: 툴팁·클릭은 ECharts 기본 기능(geo tooltip / click 이벤트)으로 -->
        <div v-show="panes.echarts" ref="ecPane" class="wm-pane">
          <span class="wm-pane-tag">ECharts</span>
          <div class="wm-zoom" :style="zoomStyle">
            <div ref="ecHost" class="wm-ec-host"></div>
            <RegionTileLayer
              v-if="tilesOn && tilePane === 'echarts'"
              :view="viewKey"
              :editable="editTiles"
              :tileLL="tileLL"
              :tileStyle="tileStyle"
              :mapTone="active.tone"
              :inv="1 / view.k"
              @move="moveTile"
            />
          </div>
          <div v-if="isGlobe" class="wm-ec-note">
            {{ ecLoading ? 'echarts-gl 불러오는 중…' : 'echarts-gl 3D 지구본 · 마우스로 돌리고 휠로 확대 · 나라 점을 누르면 규제 화면' }}
          </div>
        </div>
      </div>
      <p class="b2b-text-body text-theme-secondary mt-2 mb-1">{{ active.desc }}</p>
      <p class="b2b-text-sm text-theme-muted mb-0">
        <i class="bi bi-info-circle me-1"></i>
        지도 위에서 <b>휠로 확대·축소</b>, <b>끌어서 이동</b>, 더블클릭으로 확대해요. Canvas 는 화면 크기만큼의 픽셀 그림이라 확대하면 흐려지고,
        SVG 는 벡터라 몇 배를 키워도 선명해요. 지도에서 규제 대상 국가를 누르면 그 나라 규제 화면으로 이동해요.
      </p>
    </div>
  </div>
</template>

<script>
import { MAP_STYLES } from './worldMap/mapStyles'
import * as engine from './worldMap/mapEngine'

// drawOnce: Canvas 칸의 "그리기 ms" 측정에 쓴다 (썸네일은 WorldMapStyleCarousel 이 그린다)
const { drawOnce, createStage, setFlatView, PROJECTIONS, CENTERS, HQ, W, H } = engine
import { buildSvg, isGlobeStyle } from './worldMap/svgEngine'
import RegionTileLayer from './worldMap/RegionTileLayer.vue'
import { loadTileLL, saveTileLL } from './worldMap/regionTiles'
import { regCountryOf } from './worldMap/countryLink'
import { worldMapDesign, withMarkers, themedStyle, currentTone } from './worldMap/designSelection'
import { zipFiles } from './worldMap/zipFiles'
import WorldMapStyleCarousel from './worldMap/WorldMapStyleCarousel.vue'
import WorldMapTileCarousel from './worldMap/WorldMapTileCarousel.vue'
import MapFxToggles from './worldMap/MapFxToggles.vue'
import MapZoomTools from './worldMap/MapZoomTools.vue'
import { showToast } from '@/utils/toastUtil.js'

// 보여 줄 칸과 타일을 올릴 칸. 나란히 비교에서는 드롭다운이 두 칸에서 같이 열리지 않게 타일을 한 칸에만 둔다
const RENDERERS = [
  { key: 'canvas', label: 'Canvas', panes: ['canvas'], tile: 'canvas' },
  { key: 'svg', label: 'SVG', panes: ['svg'], tile: 'svg' },
  { key: 'echarts', label: 'ECharts', panes: ['echarts'], tile: 'echarts' },
  { key: 'split', label: 'Canvas | SVG', panes: ['canvas', 'svg'], tile: 'svg' },
  { key: 'split-ec', label: 'SVG | ECharts', panes: ['svg', 'echarts'], tile: 'echarts' }
]
// 지도 확대 한계 (100% ~ 800%)
const ZOOM_MAX = 8
// PNG 배율. 1x=960x480, 2x=1920x960 (PPT·보고서 권장), 3x=2880x1440 (대형 화면·인쇄)
const PNG_SCALES = [1, 2, 3]
const PNG_HINT = { 1: '가벼운 미리보기', 2: 'PPT·보고서 권장', 3: '대형 화면·인쇄' }

export default {
  name: 'WorldMapGalleryPage',
  components: { RegionTileLayer, WorldMapStyleCarousel, WorldMapTileCarousel, MapFxToggles, MapZoomTools },
  data() {
    return {
      styles: MAP_STYLES,
      RENDERERS,
      ZOOM_MAX,
      // 지도 확대(휠·끌기·더블클릭·오른쪽 아래 도구)를 쓸지
      zoomable: true,
      renderer: 'split',
      // 지도 확대 상태. x·y 는 칸 크기에 대한 비율(0 ~ 1-k)이라 칸 크기가 바뀌어도 같은 곳을 본다
      view: { k: 1, x: 0, y: 0 },
      pan: null,
      tip: null,
      editTiles: false,
      PNG_SCALES,
      PNG_HINT,
      saveOpen: false,
      // 다크·라이트 한 쌍으로 저장 (zip)
      savePair: false,
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
    // 애니메이션·거점·연결선 ON/OFF: 지도 왼쪽 위 버튼(MapFxToggles)이 바꾸고, 레이아웃 탭과 같이 쓴다
    playing() {
      return worldMapDesign.playing
    },
    showMarkers() {
      return worldMapDesign.showMarkers
    },
    // 실제로 그릴 디자인: 거점·연결선을 끄면 그 효과만 뺀 변형
    drawStyle() {
      return withMarkers(this.active, this.showMarkers)
    },
    // 지금 테마(자동이면 사이트 테마)의 색을 입힌 디자인. 무대·저장·타일이 모두 이걸 쓴다
    tone() {
      return currentTone()
    },
    active() {
      return themedStyle(this.styles[this.current], this.tone)
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
    // 타일은 평면 지도 좌표에 고정돼 있어 회전하는 지구본에서는 위치가 맞지 않는다 (확대는 지도와 같이 움직여서 괜찮다)
    tilesAvailable() {
      return !isGlobeStyle(this.active)
    },
    tilesOffReason() {
      return '지구본 디자인에서는 쓸 수 없어요'
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
    // 확대 판: 왼쪽 위 기준으로 키운 뒤 칸 크기 비율만큼 옮긴다 (translate % 는 판 자신의 크기 기준)
    zoomStyle() {
      const { k, x, y } = this.view
      return { transform: `translate(${x * 100}%, ${y * 100}%) scale(${k})`, transformOrigin: '0 0' }
    }
  },
  watch: {
    tilesOn(on) {
      if (!on) this.editTiles = false
    },
    playing() {
      this.renderStage()
    },
    showMarkers() {
      this.renderStage()
    },
    tone() {
      this.renderStage()
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
    document.addEventListener('click', this.closeSaveMenu)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeSaveMenu)
    this.endPan()
    this.stageApi?.destroy()
    this.ecApi?.destroy()
    cancelAnimationFrame(this.svgRaf)
    this.ro?.disconnect()
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
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
      const s = this.drawStyle
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
      if (s !== this.drawStyle) return
      this.ecApi.chart.resize()
      // 지구본은 처음 고를 때 echarts-gl 을 불러오느라 잠깐 걸린다
      this.ecLoading = isGlobeStyle(s)
      const ms = await this.ecApi.setStyle(s)
      if (s !== this.drawStyle) return
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
    // 저장 파일도 화면의 애니메이션·거점·연결선 ON/OFF 를 그대로 따른다. tone 을 주면 그 테마 색으로
    exportSvgMarkup(tone = this.tone) {
      const style = withMarkers(themedStyle(this.styles[this.current], tone), this.showMarkers)
      return buildSvg(style, 1.4, 'wm', {
        tiles: this.exportTiles(),
        tileLL: this.tileLL,
        tileStyle: this.tileStyle,
        animate: this.playing
      })
    },
    // 투영·가운데·옵션별로 여러 장 저장해도 이름이 겹치지 않게 붙인다 (지구본은 투영이 정해져 있어 디자인 이름만)
    //   -light/-dark: 테마 (한 쌍 zip 은 테마 없이), -tiles: 권역 타일 포함, -static: 애니메이션 없음, -nomarkers: 거점·연결선 없음
    exportBaseName(tone) {
      const opts = `${tone ? `-${tone}` : ''}${this.exportTiles() ? '-tiles' : ''}${this.playing ? '' : '-static'}${this.showMarkers ? '' : '-nomarkers'}`
      if (this.isGlobe) return `worldmap-${this.active.key}${opts}`
      return `worldmap-${this.active.key}-${this.projKey}-${this.centerKey}${opts}`
    },
    // 저장할 테마: 한 쌍이면 라이트·다크 둘, 아니면 지금 테마 하나
    exportTones() {
      return this.savePair ? ['light', 'dark'] : [this.tone]
    },
    // 파일 하나면 그대로, 여러 개(한 쌍)면 zip 으로 묶어 내려받는다
    async saveFiles(files) {
      if (files.length === 1) return this.saveBlob(files[0].blob, files[0].name)
      const entries = await Promise.all(files.map(async (f) => ({ name: f.name, data: new Uint8Array(await f.blob.arrayBuffer()) })))
      this.saveBlob(zipFiles(entries), `${this.exportBaseName()}.zip`)
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
      const files = this.exportTones().map((tone) => ({
        name: `${this.exportBaseName(tone)}.svg`,
        blob: new Blob([this.exportSvgMarkup(tone).replace(' width="960" height="480"', '')], { type: 'image/svg+xml' })
      }))
      this.saveFiles(files)
    },
    /**
     * PNG 는 SVG 를 한 번 만들고 그걸 고른 배율의 캔버스에 그려 픽셀로 굳힌다.
     * 그래서 모양·타일 위치가 SVG 저장본과 똑같다. 애니메이션은 첫 장면에서 멈춘다.
     * 픽셀 그림이라 타일 클릭 정보(data-region)는 남지 않는다.
     */
    async downloadPng(scale = 2) {
      if (this.pngBusy) return
      this.pngBusy = true
      try {
        const files = []
        for (const tone of this.exportTones()) {
          files.push({ name: `${this.exportBaseName(tone)}@${scale}x.png`, blob: await this.pngBlob(this.exportSvgMarkup(tone), scale) })
        }
        await this.saveFiles(files)
      } catch (e) {
        showToast(`PNG 저장에 실패했어요. ${e.message}`, { type: 'danger' })
      } finally {
        this.pngBusy = false
      }
    },
    async pngBlob(markup, k) {
      const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
      try {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('SVG 를 이미지로 읽지 못했어요'))
          img.src = url
        })
        const cv = document.createElement('canvas')
        cv.width = W * k
        cv.height = H * k
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
        return await new Promise((resolve) => cv.toBlob(resolve, 'image/png'))
      } finally {
        URL.revokeObjectURL(url)
      }
    },
    /* ---- 파일 저장 메뉴 ---- */
    saveAs(type, scale) {
      this.saveOpen = false
      if (type === 'svg') this.downloadSvg()
      else this.downloadPng(scale)
    },
    closeSaveMenu() {
      this.saveOpen = false
    },
    /* ---- 지도 확대·이동 ----
     * 휠: 커서 자리를 고정한 채 확대·축소. 100% 에서 더 줄이려는 휠은 그대로 페이지 스크롤로 보낸다
     * 끌기: 확대된 상태에서만 이동. 조금이라도 끌었으면 그 뒤 click(나라 이동)을 막는다
     * 나란히 비교일 때 두 칸이 같은 확대 상태를 써서 같은 곳을 보여 준다 */
    clampView(k, x, y) {
      const min = 1 - k
      return { k, x: Math.min(0, Math.max(min, x)), y: Math.min(0, Math.max(min, y)) }
    },
    // (fx, fy): 칸 안 비율 위치. 그 지점이 그대로 있도록 확대 배율만 바꾼다
    zoomAt(fx, fy, k2) {
      const { k, x, y } = this.view
      const nk = Math.min(ZOOM_MAX, Math.max(1, k2))
      if (Math.abs(nk - k) < 1e-4) return
      this.view = this.clampView(nk, fx - (fx - x) * (nk / k), fy - (fy - y) * (nk / k))
      this.tip = null
    },
    paneFraction(e) {
      const pane = e.target.closest?.('.wm-pane') || this.$refs.stageBox.querySelector('.wm-pane:not([style*="display: none"])')
      const r = pane.getBoundingClientRect()
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
    },
    onStageWheel(e) {
      if (!this.zoomable || (e.ctrlKey && Math.abs(e.deltaY) < 1)) return
      const zoomOut = e.deltaY > 0
      if (zoomOut && this.view.k <= 1.001) return // 이미 원래 크기면 페이지 스크롤을 막지 않는다
      e.preventDefault()
      const [fx, fy] = this.paneFraction(e)
      this.zoomAt(fx, fy, this.view.k * Math.exp(-e.deltaY * 0.0015))
    },
    onStageDblClick(e) {
      if (!this.zoomable) return
      if (e.target.closest?.('.rt-tile, .rt-drop, .mfx')) return
      const [fx, fy] = this.paneFraction(e)
      this.zoomAt(fx, fy, this.view.k * 2)
    },
    // 버튼 확대는 지도 가운데 기준
    zoomBy(f) {
      this.zoomAt(0.5, 0.5, this.view.k * f)
    },
    resetZoom() {
      this.view = { k: 1, x: 0, y: 0 }
    },
    onPanStart(e) {
      if (this.view.k <= 1.001 || e.button !== 0) return
      if (e.target.closest?.('.rt-tile, .rt-drop, .mfx, .mzt')) return
      const pane = e.target.closest?.('.wm-pane')
      if (!pane) return
      const r = pane.getBoundingClientRect()
      this.pan = { sx: e.clientX, sy: e.clientY, x: this.view.x, y: this.view.y, w: r.width, h: r.height, moved: false }
      window.addEventListener('pointermove', this.onPanMove)
      window.addEventListener('pointerup', this.endPan)
      window.addEventListener('pointercancel', this.endPan)
    },
    onPanMove(e) {
      const p = this.pan
      if (!p) return
      const dx = e.clientX - p.sx
      const dy = e.clientY - p.sy
      if (!p.moved && Math.hypot(dx, dy) < 4) return
      p.moved = true
      this.tip = null
      this.view = this.clampView(this.view.k, p.x + dx / p.w, p.y + dy / p.h)
    },
    endPan() {
      window.removeEventListener('pointermove', this.onPanMove)
      window.removeEventListener('pointerup', this.endPan)
      window.removeEventListener('pointercancel', this.endPan)
      if (this.pan?.moved) this.justPanned = true
      this.pan = null
    },
    // 끌어서 옮긴 직후의 click 은 나라 이동으로 보지 않는다
    onStageClickCapture(e) {
      if (!this.justPanned) return
      this.justPanned = false
      e.stopPropagation()
      e.preventDefault()
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

/* 라벨 + 버튼 묶음 한 세트. 라벨을 위에 올려 버튼과 구분한다 */
.wm-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wm-tool-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--b2b-color-text-main, #212529);
}

.wm-tool-label .bi {
  font-size: 12px;
  color: var(--b2b-color-primary, #0d6efd);
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

/* ---- 파일 저장 메뉴 ---- */
.wm-save {
  position: relative;
}

.wm-save-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 20;
  min-width: 230px;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--b2b-color-border, #dee2e6);
  background: var(--b2b-color-bg-card, #fff);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
}

.wm-save-menu button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--b2b-color-text-main, #212529);
  text-align: left;
}

.wm-save-menu button:hover {
  background: var(--b2b-color-hover-bg, #f1f3f5);
}

/* 한 쌍 저장 체크: 메뉴 맨 위, 아래 저장 버튼들과 선으로 구분 */
.wm-save-pair {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 4px;
  padding: 7px 10px 9px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
  color: var(--b2b-color-text-main, #212529);
  cursor: pointer;
}

.wm-save-pair input {
  width: 15px;
  height: 15px;
  margin: 0 2px;
  accent-color: var(--b2b-color-primary, #0d6efd);
}

.wm-save-menu .bi {
  font-size: 18px;
  color: var(--b2b-color-primary, #0d6efd);
}

.wm-save-menu span {
  display: flex;
  flex-direction: column;
}

.wm-save-menu b {
  font-size: 12px;
}

.wm-save-menu small {
  font-size: 11px;
  color: var(--b2b-color-text-muted, #6c757d);
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
  position: relative; /* 왼쪽 위 애니메이션 버튼·오른쪽 아래 확대 도구 기준 */
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

/* 확대된 상태에서는 끌어서 옮길 수 있다는 표시 */
.wm-stage-row.zoomed .wm-pane {
  cursor: grab;
}

.wm-stage-row.panning .wm-pane {
  cursor: grabbing;
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
  right: 8px;
  z-index: 2;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  pointer-events: none;
}

/* 확대 판. 휠·끌기는 즉시 따라가야 해서 transition 은 짧게 */
.wm-zoom {
  position: relative; /* 타일 층(RegionTileLayer)이 지도와 같이 확대·이동 */
  transition: transform 0.12s ease-out;
}

.wm-stage-row.panning .wm-zoom {
  transition: none;
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
