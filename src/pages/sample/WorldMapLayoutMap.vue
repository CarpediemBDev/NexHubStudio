<template>
  <div ref="wrap" class="layout-map-wrap">
    <MapFxToggles />
    <div ref="host" class="layout-map" role="img" :aria-label="`${regionName(regionCode)} 지도`" @click="onClick"></div>

    <!-- 권역 타일을 누르면: 그 권역으로 확대한 뒤 타일 옆에 주요 국가 드롭다운 -->
    <div v-if="drop && menu" ref="dropEl" class="lm-drop" :style="drop.style" @click.stop>
      <div class="lm-drop-head">
        <span class="lm-drop-title">{{ menu.name }}</span>
        <span class="lm-drop-sub">규제 {{ menu.count }}건 · {{ menu.countryTotal }}개국</span>
      </div>
      <button v-for="c in menu.top" :key="c.code" type="button" class="lm-row" @click="goCountry(c.code)">
        <span class="lm-row-name">{{ c.name }}</span>
        <span class="lm-row-cnt">{{ c.count }}건</span>
        <i class="bi bi-chevron-right" aria-hidden="true"></i>
      </button>
      <button type="button" class="lm-all" @click="goRegion">
        {{ menu.name }} 규제 전체 보기<i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { buildSvg } from './worldMap/svgEngine'
import { flatProj } from './worldMap/mapEngine'
import { TILE_REGIONS, regionName } from './worldMap/regionTiles'
import { regCountryOf } from './worldMap/countryLink'
import { MAP_STYLES } from './worldMap/mapStyles'
import { worldMapDesign, withMarkers } from './worldMap/designSelection'
import MapFxToggles from './worldMap/MapFxToggles.vue'
import { regionMenuOf } from './worldMap/regionMenu'
import { useRegulationStore } from '@/stores/regulationStore'

/**
 * 레이아웃 3종이 같이 쓰는 지도.
 * 권역을 고르면 그 권역으로 확대된다(SVG viewBox 를 부드럽게 옮김). 지도는 다시 그리지 않고 보는 범위만 바꾼다.
 * 확대돼도 권역 타일은 원래 크기로 보이게 타일마다 역배율을 건다.
 */
const props = defineProps({
  regionCode: { type: String, required: true },
  // false 면 세계 전체를 보여 준다
  zoom: { type: Boolean, default: true }
})
const emit = defineEmits(['select-region'])
const host = ref(null)
const wrap = ref(null)
const router = useRouter()
const store = useRegulationStore()
store.ensureLoaded()

/* ---- 권역 타일 드롭다운 ----
 * 다른 권역 타일을 누르면 확대가 끝난 뒤(타일이 제자리에 온 뒤) 위치를 잡아 연다 */
const openCd = ref(null)
const drop = ref(null)
const dropEl = ref(null)
const menu = computed(() => (openCd.value ? regionMenuOf(store.records, openCd.value) : null))

function placeDrop() {
  if (!openCd.value) return
  const tile = host.value?.querySelector(`[data-region="${openCd.value}"]`)
  if (!tile || !wrap.value) {
    drop.value = null
    return
  }
  const box = wrap.value.getBoundingClientRect()
  const r = tile.getBoundingClientRect()
  const cx = r.left + r.width / 2 - box.left
  const cy = r.top + r.height / 2 - box.top
  const toLeft = cx > box.width * 0.62 // 지도 오른편 타일은 왼쪽으로 펼쳐 칸 밖으로 안 나가게
  const up = cy > box.height * 0.5
  const left = `${toLeft ? r.left - box.left - 10 : r.right - box.left + 10}px`
  const x = toLeft ? 'translateX(-100%)' : 'none'
  // 먼저 띄워 높이를 잰 뒤, 지도 칸 안에 들어오게 위아래를 맞춘다 (레이아웃 칸은 바깥이 잘린다)
  drop.value = { style: { left, top: `${cy}px`, transform: x, visibility: 'hidden' } }
  nextTick(() => {
    const h = dropEl.value?.offsetHeight || 0
    const want = up ? cy + 24 - h : cy - 24
    const top = Math.max(4, Math.min(box.height - h - 4, want))
    drop.value = { style: { left, top: `${top}px`, transform: x } }
  })
}
function closeDrop() {
  openCd.value = null
  drop.value = null
}
function onDocClick(e) {
  if (!wrap.value?.contains(e.target)) closeDrop()
}
function onKey(e) {
  if (e.key === 'Escape') closeDrop()
}
function goCountry(code) {
  closeDrop()
  router.push({ name: 'RegulationInfo', query: { country: code } })
}
function goRegion() {
  const codes = menu.value?.allCodes || []
  closeDrop()
  router.push({ name: 'RegulationInfo', query: { country: codes.join(',') } })
}
// 권역별로 보여 줄 가로 폭 (지도 단위, 전체 = 960). 세로는 2:1 로 맞춘다
const widths = { R_ASIA: 500, R_EU: 390, R_NA: 530, R_LA: 500, R_MEA: 580 }
const FULL = [0, 0, 960, 480]
const TWEEN_MS = 520
let viewBox = FULL.slice()
let raf = 0

function selectedStyle() {
  return MAP_STYLES.find((item) => item.key === worldMapDesign.styleKey) || MAP_STYLES[0]
}
const isGlobe = (s) => s.kind === 'globe' || s.kind === 'dotglobe'

function targetBox() {
  const region = TILE_REGIONS.find((item) => item.cd === props.regionCode)
  if (!props.zoom || !region || isGlobe(selectedStyle())) return FULL.slice()
  const [x, y] = flatProj(region.ll)
  const w = widths[region.cd] || 960
  return [x - w / 2, y - w / 4, w, w / 2]
}

/** 보는 범위 적용 + 타일 역배율 (확대 배율 960/폭 의 역수로 타일을 제자리에서 줄인다) */
function applyBox(box) {
  const svg = host.value?.querySelector('svg')
  if (!svg) return
  viewBox = box
  svg.setAttribute('viewBox', box.map((v) => Math.round(v * 100) / 100).join(' '))
  const s = box[2] / 960
  svg.querySelectorAll('[data-region]').forEach((g) => {
    if (!g.dataset.tf) {
      // 처음 한 번: 원래 transform 과 타일 가운데(부모 좌표)를 기억
      const tf = g.getAttribute('transform') || ''
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(tf)
      const b = g.getBBox()
      g.dataset.tf = tf
      g.dataset.cx = (m ? +m[1] : 0) + b.x + b.width / 2
      g.dataset.cy = (m ? +m[2] : 0) + b.y + b.height / 2
    }
    const { cx, cy, tf } = g.dataset
    g.setAttribute('transform', `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy}) ${tf}`)
  })
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
let finishTimer = 0
function tweenTo(box) {
  cancelAnimationFrame(raf)
  clearTimeout(finishTimer)
  const from = viewBox.slice()
  const start = performance.now()
  const step = (now) => {
    const t = Math.min(1, (now - start) / TWEEN_MS)
    const k = ease(t)
    applyBox(from.map((v, i) => v + (box[i] - v) * k))
    if (t < 1) raf = requestAnimationFrame(step)
    else placeDrop()
  }
  raf = requestAnimationFrame(step)
  // 탭이 가려져 프레임이 오지 않아도 결국 고른 권역은 보이게 한다
  finishTimer = setTimeout(() => {
    cancelAnimationFrame(raf)
    applyBox(box)
    placeDrop()
  }, TWEEN_MS + 80)
}

function render() {
  if (!host.value) return
  const base = selectedStyle()
  // 거점·연결선 ON/OFF 반영
  const style = withMarkers(base.focusRegion ? { ...base, focusRegion: props.regionCode } : base)
  const globe = isGlobe(style)
  const region = TILE_REGIONS.find((item) => item.cd === props.regionCode)
  const time = globe && region ? (region.ll[0] - 100) / (style.spin ?? 6) : 1.4
  const tiles = worldMapDesign.tilesEnabled && !globe
  host.value.innerHTML = buildSvg(style, time, 'layout-map', { tiles, tileStyle: worldMapDesign.tileStyleKey })
  // 지도 끝에 있는 권역(태평양 중심일 때 유럽 등)을 가운데로 확대하면 지도 바깥이 드러난다.
  // 맨 아래 배경 사각형을 바깥까지 넓혀 빈칸 대신 바다가 이어지게 한다
  const bg = host.value.querySelector('svg > rect')
  if (bg) {
    bg.setAttribute('x', -960)
    bg.setAttribute('y', -480)
    bg.setAttribute('width', 2880)
    bg.setAttribute('height', 1440)
  }
  host.value.querySelectorAll('path[data-cid]').forEach((path) => {
    const country = regCountryOf(path.dataset.cid)
    if (country?.regionCd === props.regionCode && !base.focusRegion) {
      const accent = style.mk && style.mk !== style.land ? style.mk : style.hq
      if (style.kind === 'scan') path.style.stroke = accent
      else if (accent) path.style.fill = accent
    }
    if (country) {
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      title.textContent = `${country.name} · 규제 보기`
      path.append(title)
      path.classList.add('layout-map-link')
    }
  })
  applyPlaying()
}

function applyPlaying() {
  const svg = host.value?.querySelector('svg')
  if (!svg) return
  if (worldMapDesign.playing) svg.unpauseAnimations()
  else svg.pauseAnimations()
}

/** 다시 그린 뒤 보던 범위에서 이어서 새 권역으로 확대 (첫 그림은 바로 그 범위로) */
function renderAndFocus(animate) {
  render()
  applyBox(viewBox)
  const box = targetBox()
  if (animate) {
    drop.value = null // 확대하는 동안은 숨겼다가 끝나면 타일 옆에 다시
    tweenTo(box)
  } else {
    applyBox(box)
    placeDrop()
  }
}

function onClick(event) {
  const tile = event.target.closest?.('[data-region]')
  if (tile) {
    const cd = tile.dataset.region
    // 같은 타일을 다시 누르면 닫는다
    if (openCd.value === cd && drop.value) {
      closeDrop()
      return
    }
    openCd.value = cd
    if (cd === props.regionCode) placeDrop() // 이미 확대된 권역이면 바로
    else emit('select-region', cd) // 다른 권역이면 확대가 끝난 뒤 열린다
    return
  }
  const path = event.target.closest?.('path[data-cid]')
  const country = path && regCountryOf(path.dataset.cid)
  if (country) router.push({ name: 'RegulationInfo', query: { country: country.code } })
}

let observer
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', placeDrop)
  renderAndFocus(false)
  observer = new MutationObserver(() => renderAndFocus(false))
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
// 권역이 바뀌면 부드럽게, 디자인이 바뀌면 바로. 왼쪽 메뉴·카드로 다른 권역을 고르면 열린 드롭다운은 닫는다
watch(() => props.regionCode, (cd) => {
  if (openCd.value && openCd.value !== cd) closeDrop()
  renderAndFocus(true)
})
watch(() => [props.zoom, worldMapDesign.styleKey, worldMapDesign.tileStyleKey, worldMapDesign.tilesEnabled, worldMapDesign.showMarkers], () => renderAndFocus(false))
watch(() => worldMapDesign.playing, applyPlaying)
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', placeDrop)
  observer?.disconnect()
  cancelAnimationFrame(raf)
  clearTimeout(finishTimer)
})
</script>

<style scoped>
.layout-map-wrap { position: relative; }
.layout-map { overflow: hidden; }
.layout-map :deep(svg) { display: block; width: 100%; height: auto; }
.layout-map :deep(path.layout-map-link) { cursor: pointer; }
.layout-map :deep(path.layout-map-link:hover) { opacity: .72; }
.layout-map :deep([data-region]) { cursor: pointer; }
.layout-map :deep([data-region]:hover) { filter: brightness(1.1); }

/* 권역 타일 드롭다운 (지도 스타일 탭의 RegionTileLayer 드롭다운과 같은 모양) */
.lm-drop { position: absolute; z-index: 6; width: 210px; overflow: hidden; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 10px; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); box-shadow: 0 12px 28px rgba(15, 23, 42, .22); animation: lm-in .14s ease-out; }
@keyframes lm-in { from { opacity: 0; } }
.lm-drop-head { display: flex; flex-direction: column; padding: 10px 12px 8px; border-bottom: 1px solid var(--b2b-color-border, #dee2e6); }
.lm-drop-title { font-size: 13px; font-weight: 700; }
.lm-drop-sub { font-size: 11px; color: var(--b2b-color-text-muted, #6c757d); }
.lm-row { width: 100%; display: flex; align-items: center; gap: 8px; padding: 7px 12px; border: none; background: transparent; color: inherit; font-size: 13px; text-align: left; }
.lm-row:hover, .lm-all:hover { background: var(--b2b-color-hover-bg, #f1f3f5); }
.lm-row-name { flex: 1; }
.lm-row-cnt { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: rgba(var(--b2b-color-primary-rgb, 13, 110, 253), .1); color: var(--b2b-color-primary, #0d6efd); }
.lm-row .bi { font-size: 11px; color: var(--b2b-color-text-muted, #6c757d); }
.lm-all { width: 100%; padding: 8px 12px; border: none; border-top: 1px solid var(--b2b-color-border, #dee2e6); background: transparent; color: var(--b2b-color-primary, #0d6efd); font-size: 12px; font-weight: 600; text-align: left; }
</style>
