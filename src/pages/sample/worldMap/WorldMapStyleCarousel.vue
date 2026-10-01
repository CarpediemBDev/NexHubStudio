<template>
  <section class="wsc" aria-label="세계지도 디자인 갤러리">
    <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-subcard px-4 py-3 mb-3">
      <h5 class="b2b-text-h2 text-theme-primary mb-1"><i class="bi bi-globe-asia-australia text-theme-accent me-2" aria-hidden="true"></i>세계지도 디자인 갤러리</h5>
      <p class="b2b-text-body text-theme-secondary mb-0">메인화면용 세계지도 디자인 {{ MAP_STYLES.length }}종입니다. 위 목록에서 화살표로 넘기며 고르면 아래 지도에 적용됩니다.</p>
    </div>
    <div class="wsc-strip">
      <button type="button" class="wsc-nav" :disabled="!canPrev" aria-label="이전 디자인 목록" @click="slide(-1)"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
      <div ref="track" class="wsc-track" @scroll="measure" @scrollend="measure" @wheel="onWheel">
        <button v-for="(style, index) in MAP_STYLES" :key="style.key" :ref="(el) => { cards[index] = el }" type="button" class="wsc-card" :class="{ on: modelValue === style.key }" :aria-pressed="modelValue === style.key" @click="select(index)">
          <canvas :ref="(el) => { thumbs[index] = el }" class="wsc-thumb"></canvas>
          <span class="wsc-meta"><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ style.name }}</strong><small :class="style.tone">{{ style.tone === 'dark' ? '다크' : '라이트' }}</small></span>
        </button>
      </div>
      <button type="button" class="wsc-nav" :disabled="!canNext" aria-label="다음 디자인 목록" @click="slide(1)"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
    </div>
    <div class="wsc-pager" aria-label="디자인 목록 페이지"><span v-for="page in pageTotal" :key="page" :class="{ on: page === pageNo }"></span></div>
    <div v-if="controls" class="wsc-selection"><span>{{ String(selectedIndex + 1).padStart(2, '0') }}</span><strong>{{ selectedStyle.name }}</strong><small>{{ selectedStyle.tone === 'dark' ? '다크' : '라이트' }}</small><div><button type="button" aria-label="이전 지도 디자인" @click="select(selectedIndex - 1)"><i class="bi bi-arrow-left"></i></button><button type="button" aria-label="다음 지도 디자인" @click="select(selectedIndex + 1)"><i class="bi bi-arrow-right"></i></button></div></div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MAP_STYLES } from './mapStyles'
import { drawOnce } from './mapEngine'

const props = defineProps({ modelValue: { type: String, required: true }, viewKey: { type: String, default: '' }, controls: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])
const track = ref(null)
const thumbs = []
const cards = []
const canPrev = ref(false)
const canNext = ref(false)
const pageNo = ref(1)
const pageTotal = ref(1)
const selectedIndex = computed(() => Math.max(0, MAP_STYLES.findIndex((style) => style.key === props.modelValue)))
const selectedStyle = computed(() => MAP_STYLES[selectedIndex.value])
let drawTimer
let slideTimer
let observer

function drawThumbs() {
  clearTimeout(drawTimer)
  let index = 0
  const next = () => {
    if (thumbs[index]) drawOnce(thumbs[index], MAP_STYLES[index], 220)
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
.wsc-strip { display: flex; align-items: center; gap: 8px; }.wsc-track { position: relative; flex: 1; min-width: 0; display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; padding: 4px 2px; }.wsc-track::-webkit-scrollbar { display: none; }
.wsc-nav { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 50%; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); }.wsc-nav:hover:not(:disabled) { background: var(--b2b-color-hover-bg, #f1f3f5); }.wsc-nav:disabled { opacity: .35; }
.wsc-card { flex: none; width: 220px; padding: 0; overflow: hidden; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 12px; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); text-align: left; scroll-snap-align: start; }.wsc-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px #0f172a1a; }.wsc-card.on { border-color: var(--b2b-color-primary, #0d6efd); box-shadow: 0 0 0 2px #0d6efd40; }.wsc-thumb { display: block; width: 100%; }.wsc-meta { display: flex; align-items: center; gap: 6px; padding: 8px 10px; font-size: 12px; }.wsc-meta>span { color: var(--b2b-color-text-muted, #6c757d); font-size: 11px; }.wsc-meta strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.wsc-meta small { border-radius: 99px; padding: 2px 6px; font-size: 10px; }.wsc-meta small.dark { color: #e2e8f0; background: #1e293b; }.wsc-meta small.light { color: #475569; background: #eef2f7; }
.wsc-pager { display: flex; justify-content: center; gap: 6px; margin: 10px 0 15px; }.wsc-pager span { width: 6px; height: 6px; border-radius: 3px; background: var(--b2b-color-border, #dee2e6); }.wsc-pager span.on { width: 18px; background: var(--b2b-color-primary, #0d6efd); }
.wsc-selection { display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 12px; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 8px; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); }.wsc-selection>span { color: var(--b2b-color-text-muted, #6c757d); font-size: 12px; }.wsc-selection strong { font-size: 13px; }.wsc-selection small { color: var(--b2b-color-text-muted, #6c757d); font-size: 11px; }.wsc-selection>div { display: flex; gap: 4px; margin-left: auto; }.wsc-selection button { display: grid; place-items: center; width: 28px; height: 26px; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 4px; background: transparent; color: inherit; }
</style>
