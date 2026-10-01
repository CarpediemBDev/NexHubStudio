<template>
  <div>
    <nav class="wm-gallery-tabs" aria-label="세계지도 갤러리 탭">
      <RouterLink :to="styleRoute" :aria-current="isLayout ? undefined : 'page'" :class="{ active: !isLayout }"><i class="bi bi-globe-asia-australia" aria-hidden="true"></i>지도 스타일</RouterLink>
      <RouterLink :to="layoutRoute(activeLayout.id)" :aria-current="isLayout ? 'page' : undefined" :class="{ active: isLayout }"><i class="bi bi-layout-sidebar" aria-hidden="true"></i>레이아웃</RouterLink>
    </nav>
    <WorldMapGalleryPage v-if="!isLayout" />
    <template v-else>
      <div class="container-fluid pt-4">
        <WorldMapStyleCarousel :model-value="worldMapDesign.styleKey" controls @update:model-value="worldMapDesign.styleKey = $event" />
        <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-card p-3 mb-3">
          <WorldMapTileCarousel :model-value="worldMapDesign.tileStyleKey" :tone="selectedStyle.tone" :enabled="worldMapDesign.tilesEnabled" :available="!isGlobeStyle(selectedStyle)" unavailable-reason="지구본 디자인에서는 타일을 쓸 수 없어요" @update:model-value="worldMapDesign.tileStyleKey = $event" @update:enabled="worldMapDesign.tilesEnabled = $event" />
        </div>
      </div>
      <div class="wl-gallery container-fluid pt-4">
        <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-subcard px-4 py-3 mb-3">
          <h5 class="b2b-text-h2 text-theme-primary mb-1"><i class="bi bi-columns-gap text-theme-accent me-2" aria-hidden="true"></i>세계지도 레이아웃 갤러리</h5>
          <p class="b2b-text-body text-theme-secondary mb-0">레이아웃 {{ layouts.length }}종입니다. 화살표로 목록을 넘기거나 카드를 눌러 아래에서 확인하세요.</p>
        </div>
        <div class="wl-strip" aria-label="레이아웃 디자인 목록">
          <button type="button" class="wl-nav" :disabled="!canPrev" aria-label="이전 레이아웃 목록" @click="slide(-1)"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
          <div ref="track" class="wl-track" @scroll="measure" @scrollend="measure" @wheel="onWheel">
            <RouterLink v-for="(item, index) in layouts" :key="item.id" :to="layoutRoute(item.id)" class="wl-card" :class="{ active: activeLayout.id === item.id }" :aria-current="activeLayout.id === item.id ? 'true' : undefined">
              <span class="wl-thumb" :class="'wl-thumb-' + item.id" aria-hidden="true"><span class="wl-thumb-top"></span><span class="wl-thumb-side"></span><span class="wl-thumb-map"><i class="bi bi-globe-americas"></i></span><span class="wl-thumb-foot"></span></span>
              <span class="wl-card-meta"><small>{{ String(index + 1).padStart(2, '0') }}</small><strong>{{ item.name }}</strong><span>{{ item.label }}</span></span>
            </RouterLink>
          </div>
          <button type="button" class="wl-nav" :disabled="!canNext" aria-label="다음 레이아웃 목록" @click="slide(1)"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
        </div>
        <div class="wl-pager" aria-label="레이아웃 목록 페이지"><span v-for="page in pageTotal" :key="page" :class="{ active: page === pageNo }"></span></div>
        <div class="wl-selected b2b-card shadow-sm border border-theme rounded-3 bg-theme-card px-3 py-2">
          <span class="wl-selected-no">{{ String(activeIndex + 1).padStart(2, '0') }}</span><strong>{{ activeLayout.name }}</strong><span>{{ activeLayout.description }}</span>
          <div class="wl-selected-actions">
            <button type="button" class="btn btn-sm btn-outline-secondary" title="이전 레이아웃" aria-label="이전 레이아웃" @click="selectRelative(-1)"><i class="bi bi-arrow-left" aria-hidden="true"></i></button>
            <button type="button" class="btn btn-sm btn-outline-secondary" title="다음 레이아웃" aria-label="다음 레이아웃" @click="selectRelative(1)"><i class="bi bi-arrow-right" aria-hidden="true"></i></button>
          </div>
        </div>
      </div>
      <RegionDeskPage v-if="activeLayout.id === 'region-desk'" />
      <AtlasSplitPage v-else-if="activeLayout.id === 'atlas-split'" />
      <RegionGridPage v-else />
    </template>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import WorldMapGalleryPage from './WorldMapGalleryPage.vue'
import WorldMapStyleCarousel from './worldMap/WorldMapStyleCarousel.vue'
import WorldMapTileCarousel from './worldMap/WorldMapTileCarousel.vue'
import { worldMapDesign } from './worldMap/designSelection'
import { MAP_STYLES } from './worldMap/mapStyles'
import { isGlobeStyle } from './worldMap/svgEngine'

const RegionDeskPage = defineAsyncComponent(() => import('./WorldMapRegionDeskPage.vue'))
const AtlasSplitPage = defineAsyncComponent(() => import('./WorldMapAtlasSplitPage.vue'))
const RegionGridPage = defineAsyncComponent(() => import('./WorldMapRegionGridPage.vue'))
const layouts = [
  { id: 'region-desk', name: 'Region Desk', label: '권역 집중', description: '왼쪽 권역 메뉴와 확대 지도' },
  { id: 'atlas-split', name: 'Atlas Split', label: '분할 탐색', description: '세계지도와 오른쪽 국가 탐색 패널' },
  { id: 'region-grid', name: 'Region Grid', label: '카드형 현황', description: '권역 카드와 전체 지도' }
]
const route = useRoute()
const router = useRouter()
const selectedStyle = computed(() => MAP_STYLES.find((style) => style.key === worldMapDesign.styleKey) || MAP_STYLES[0])
const track = ref(null)
const canPrev = ref(false)
const canNext = ref(false)
const pageNo = ref(1)
const pageTotal = ref(1)
const isLayout = computed(() => layouts.some((item) => item.id === route.query.layout))
const activeIndex = computed(() => Math.max(0, layouts.findIndex((item) => item.id === route.query.layout)))
const activeLayout = computed(() => layouts[activeIndex.value])
const styleRoute = computed(() => {
  const { layout, ...query } = route.query
  return { name: 'WorldMapGallery', query }
})
const layoutRoute = (id) => ({ name: 'WorldMapGallery', query: { ...route.query, layout: id } })

function measure() {
  const el = track.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  canPrev.value = el.scrollLeft > 2
  canNext.value = el.scrollLeft < max - 2
  pageTotal.value = Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth)))
  pageNo.value = canNext.value ? Math.min(pageTotal.value, Math.round(el.scrollLeft / el.clientWidth) + 1) : pageTotal.value
}
let slideTimer
function slide(dir) {
  const el = track.value
  if (!el) return
  el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  clearTimeout(slideTimer)
  slideTimer = setTimeout(measure, 500)
}
function onWheel(event) {
  const el = track.value
  if (!el || el.scrollWidth <= el.clientWidth || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return
  event.preventDefault()
  el.scrollLeft += event.deltaY
}
function selectRelative(dir) {
  const next = (activeIndex.value + dir + layouts.length) % layouts.length
  router.push(layoutRoute(layouts[next].id))
}
function revealActive() {
  const el = track.value
  const card = track.value?.querySelectorAll('.wl-card')[activeIndex.value]
  if (card && el) {
    const left = card.offsetLeft
    if (left < el.scrollLeft || left + card.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollLeft = Math.min(el.scrollWidth - el.clientWidth, Math.max(0, left - 8))
    }
  }
  measure()
}
watch(() => route.query.layout, async () => {
  await nextTick()
  revealActive()
})
watch(track, (el, previous) => {
  if (previous) observer?.unobserve(previous)
  if (el) { observer?.observe(el); nextTick(measure) }
})
let observer
onMounted(() => {
  observer = new ResizeObserver(measure)
  if (track.value) observer.observe(track.value)
  nextTick(revealActive)
})
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(slideTimer) })
</script>

<style scoped>
.wm-gallery-tabs { display: flex; gap: 6px; padding: 13px 24px 0; border-bottom: 1px solid var(--b2b-color-border, #dee2e6); }
.wm-gallery-tabs a { display: inline-flex; align-items: center; gap: 7px; padding: 10px 16px; border-bottom: 2px solid transparent; color: var(--b2b-color-text-muted, #6c757d); font-size: 13px; font-weight: 600; text-decoration: none; }
.wm-gallery-tabs a.active { color: var(--b2b-color-primary, #0d6efd); border-bottom-color: currentColor; }
.wm-gallery-tabs a:focus-visible, .wl-card:focus-visible, .wl-nav:focus-visible { outline: 2px solid var(--b2b-color-primary, #0d6efd); outline-offset: -2px; }
.wl-strip { display: flex; align-items: center; justify-content: center; gap: 8px; }.wl-track { position: relative; display: flex; flex: 0 1 590px; min-width: 0; gap: 12px; padding: 4px 2px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; }.wl-track::-webkit-scrollbar { display: none; }
.wl-nav { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 50%; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); }.wl-nav:hover:not(:disabled) { background: var(--b2b-color-hover-bg, #f1f3f5); }.wl-nav:disabled { opacity: .35; }
.wl-card { flex: 0 0 260px; overflow: hidden; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 12px; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); text-decoration: none; scroll-snap-align: start; }.wl-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px #0f172a1a; }.wl-card.active { border-color: var(--b2b-color-primary, #0d6efd); box-shadow: 0 0 0 2px #0d6efd33; }
.wl-thumb { position: relative; display: block; height: 106px; background: #eef3f9; }.wl-thumb>span { position: absolute; display: block; border-radius: 3px; }.wl-thumb-top { top: 10px; left: 11px; width: 45%; height: 6px; background: #aebfd5; }.wl-thumb-side { top: 26px; left: 11px; width: 20%; height: 70px; background: #c5d6ea; }.wl-thumb-map { top: 26px; left: 34%; width: 62%; height: 52px; display: grid !important; place-items: center; background: #d3e2f4; color: #4f83d8; font-size: 25px; }.wl-thumb-foot { top: 82px; left: 34%; width: 62%; height: 14px; background: #fff; }.wl-thumb-atlas-split .wl-thumb-side { left: 76%; width: 20%; }.wl-thumb-atlas-split .wl-thumb-map { left: 11px; width: 62%; height: 70px; }.wl-thumb-atlas-split .wl-thumb-foot { display: none; }.wl-thumb-region-grid .wl-thumb-top { width: 85%; height: 19px; background: repeating-linear-gradient(90deg, #c5d6ea 0 16%, transparent 16% 20%); }.wl-thumb-region-grid .wl-thumb-side { display: none; }.wl-thumb-region-grid .wl-thumb-map { top: 37px; left: 11px; width: 85%; height: 56px; }.wl-thumb-region-grid .wl-thumb-foot { display: none; }
.wl-card-meta { display: flex; align-items: center; gap: 7px; padding: 9px 10px; font-size: 12px; }.wl-card-meta small { color: var(--b2b-color-text-muted, #6c757d); }.wl-card-meta strong { flex: 1; white-space: nowrap; }.wl-card-meta>span { color: var(--b2b-color-text-muted, #6c757d); font-size: 10px; }
.wl-pager { display: flex; justify-content: center; gap: 6px; margin: 11px 0 16px; }.wl-pager span { width: 6px; height: 6px; border-radius: 3px; background: var(--b2b-color-border, #dee2e6); }.wl-pager span.active { width: 18px; background: var(--b2b-color-primary, #0d6efd); }
.wl-selected { display: flex; align-items: center; gap: 9px; }.wl-selected-no { color: var(--b2b-color-text-muted, #6c757d); font-size: 12px; }.wl-selected strong { font-size: 14px; }.wl-selected>span:last-of-type { color: var(--b2b-color-text-muted, #6c757d); font-size: 12px; }.wl-selected-actions { display: flex; gap: 4px; margin-left: auto; }
@media (max-width: 576px) { .wm-gallery-tabs { padding-left: 14px; padding-right: 14px; }.wm-gallery-tabs a { flex: 1; justify-content: center; }.wl-card { flex-basis: 220px; }.wl-selected>span:last-of-type { display: none; } }
</style>
