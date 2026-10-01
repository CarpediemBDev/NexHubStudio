<template>
  <section class="wsc" aria-label="세계지도 디자인 갤러리">
    <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-subcard px-4 py-3 mb-3 wsc-head">
      <div class="wsc-head-text">
        <h5 class="b2b-text-h2 text-theme-primary mb-1"><i class="bi bi-globe-asia-australia text-theme-accent me-2" aria-hidden="true"></i>세계지도 디자인 갤러리</h5>
        <p class="b2b-text-body text-theme-secondary mb-0">메인화면용 세계지도 디자인 {{ MAP_STYLES.length }}종입니다. 디자인마다 라이트·다크 두 벌이 있어요. 위 목록에서 화살표로 넘기며 고르면 아래 지도에 적용됩니다.</p>
      </div>
      <!-- 지도 테마: 자동이면 사이트 테마(라이트/다크)를 따라간다 -->
      <div class="wsc-theme">
        <span id="wsc-theme-label" class="wsc-theme-label"><i class="bi bi-circle-half" aria-hidden="true"></i>지도 테마</span>
        <div class="wsc-seg" role="group" aria-labelledby="wsc-theme-label">
          <button v-for="m in THEME_MODES" :key="m.key" type="button" :class="{ on: worldMapDesign.themeMode === m.key }" :aria-pressed="worldMapDesign.themeMode === m.key" :title="m.title" @click="worldMapDesign.themeMode = m.key">
            <i class="bi" :class="m.icon" aria-hidden="true"></i>{{ m.label }}
          </button>
        </div>
      </div>
    </div>
    <div class="wsc-strip">
      <button type="button" class="wsc-nav" :disabled="!canPrev" aria-label="이전 디자인 목록" @click="slide(-1)"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
      <div ref="track" class="wsc-track" @scroll="measure" @scrollend="measure" @wheel="onWheel">
        <button v-for="(style, index) in MAP_STYLES" :key="style.key" :ref="(el) => { cards[index] = el }" type="button" class="wsc-card" :class="{ on: modelValue === style.key }" :aria-pressed="modelValue === style.key" @click="select(index)">
          <canvas :ref="(el) => { thumbs[index] = el }" class="wsc-thumb"></canvas>
          <span class="wsc-meta"><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ style.name }}</strong></span>
        </button>
      </div>
      <button type="button" class="wsc-nav" :disabled="!canNext" aria-label="다음 디자인 목록" @click="slide(1)"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
    </div>
    <div class="wsc-pager" aria-label="디자인 목록 페이지"><span v-for="page in pageTotal" :key="page" :class="{ on: page === pageNo }"></span></div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MAP_STYLES } from './mapStyles'
import { drawOnce } from './mapEngine'
import { worldMapDesign, currentTone, themedStyle } from './designSelection'

const THEME_MODES = [
  { key: 'auto', label: '자동', icon: 'bi-circle-half', title: '사이트 테마를 따라가요' },
  { key: 'light', label: '라이트', icon: 'bi-sun', title: '항상 라이트' },
  { key: 'dark', label: '다크', icon: 'bi-moon-stars', title: '항상 다크' }
]

const props = defineProps({ modelValue: { type: String, required: true }, viewKey: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])
const track = ref(null)
const thumbs = []
const cards = []
const canPrev = ref(false)
const canNext = ref(false)
const pageNo = ref(1)
const pageTotal = ref(1)
const selectedIndex = computed(() => Math.max(0, MAP_STYLES.findIndex((style) => style.key === props.modelValue)))
let drawTimer
let slideTimer
let observer

function drawThumbs() {
  clearTimeout(drawTimer)
  let index = 0
  const next = () => {
    if (thumbs[index]) drawOnce(thumbs[index], themedStyle(MAP_STYLES[index]), 220)
    index += 1
    if (index < MAP_STYLES.length) drawTimer = setTimeout(next, 0)
  }
  drawTimer = setTimeout(next, 0)
}
function measure() {
  const el = track.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  canPrev.value = el.scrollLeft > 2
  canNext.value = el.scrollLeft < max - 2
  pageTotal.value = Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth)))
  pageNo.value = canNext.value ? Math.min(pageTotal.value, Math.round(el.scrollLeft / el.clientWidth) + 1) : pageTotal.value
}
function slide(direction) {
  track.value?.scrollBy({ left: direction * track.value.clientWidth, behavior: 'smooth' })
  clearTimeout(slideTimer)
  slideTimer = setTimeout(measure, 500)
}
function reveal() {
  const el = track.value
  const card = cards[selectedIndex.value]
  if (!el || !card) return
  const left = card.offsetLeft
  const right = left + card.offsetWidth
  if (left < el.scrollLeft) el.scrollLeft = Math.max(0, left - 4)
  else if (right > el.scrollLeft + el.clientWidth) el.scrollLeft = right - el.clientWidth + 4
  measure()
}
function select(index) {
  const next = (index + MAP_STYLES.length) % MAP_STYLES.length
  emit('update:modelValue', MAP_STYLES[next].key)
  nextTick(reveal)
}
function onWheel(event) {
  const el = track.value
  if (!el || el.scrollWidth <= el.clientWidth || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return
  event.preventDefault()
  el.scrollLeft += event.deltaY
}
watch(() => props.viewKey, drawThumbs)
// 테마(자동이면 사이트 테마)가 바뀌면 썸네일을 그 테마 색으로 다시 그린다
watch(currentTone, drawThumbs)
watch(() => props.modelValue, () => nextTick(reveal))
onMounted(() => {
  drawThumbs()
  observer = new ResizeObserver(measure)
  observer.observe(track.value)
  nextTick(reveal)
})
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(drawTimer); clearTimeout(slideTimer) })
</script>

<style scoped>
.wsc-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }.wsc-head-text { flex: 1; min-width: 260px; }
.wsc-theme { display: flex; flex-direction: column; gap: 4px; }.wsc-theme-label { display: inline-flex; align-items: center; gap: 4px; padding-left: 2px; font-size: 11px; font-weight: 700; color: var(--b2b-color-text-main, #212529); }.wsc-theme-label .bi { color: var(--b2b-color-primary, #0d6efd); }
.wsc-seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: 9px; background: var(--b2b-color-tab-bg, #f1f3f5); }.wsc-seg button { display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 10px; border: none; border-radius: 7px; background: transparent; font-size: 12px; color: var(--b2b-color-text-muted, #6c757d); }.wsc-seg button.on { background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); font-weight: 600; box-shadow: 0 1px 2px rgba(15, 23, 42, .12); }
.wsc-strip { display: flex; align-items: center; gap: 8px; }.wsc-track { position: relative; flex: 1; min-width: 0; display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; padding: 4px 2px; }.wsc-track::-webkit-scrollbar { display: none; }
.wsc-nav { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 50%; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); }.wsc-nav:hover:not(:disabled) { background: var(--b2b-color-hover-bg, #f1f3f5); }.wsc-nav:disabled { opacity: .35; }
.wsc-card { flex: none; width: 220px; padding: 0; overflow: hidden; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 12px; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); text-align: left; scroll-snap-align: start; }.wsc-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px #0f172a1a; }.wsc-card.on { border-color: var(--b2b-color-primary, #0d6efd); box-shadow: 0 0 0 2px #0d6efd40; }.wsc-thumb { display: block; width: 100%; }.wsc-meta { display: flex; align-items: center; gap: 6px; padding: 8px 10px; font-size: 12px; }.wsc-meta>span { color: var(--b2b-color-text-muted, #6c757d); font-size: 11px; }.wsc-meta strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wsc-pager { display: flex; justify-content: center; gap: 6px; margin: 10px 0 15px; }.wsc-pager span { width: 6px; height: 6px; border-radius: 3px; background: var(--b2b-color-border, #dee2e6); }.wsc-pager span.on { width: 18px; background: var(--b2b-color-primary, #0d6efd); }
</style>
