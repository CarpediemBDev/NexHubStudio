<template>
  <section class="wtc" aria-label="타일 디자인">
    <div class="wtc-heading">
      <label :class="{ off: !available }" :title="available ? '' : unavailableReason"><input type="checkbox" :checked="enabled" :disabled="!available" @change="emit('update:enabled', $event.target.checked)" />권역 타일</label>
      <strong>타일 디자인</strong><span>{{ selected.desc }}</span>
    </div>
    <template v-if="available && enabled">
      <div class="wtc-strip">
        <button type="button" class="wtc-nav" :disabled="!canPrev" aria-label="이전 타일 디자인" @click="slide(-1)"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
        <div ref="track" class="wtc-track" @scroll="measure" @scrollend="measure" @wheel="onWheel">
          <button v-for="(item, index) in previews" :key="item.key" type="button" class="wtc-card" :class="{ on: modelValue === item.key, dark: tone === 'dark' }" :title="item.desc" :aria-pressed="modelValue === item.key" @click="emit('update:modelValue', item.key)">
            <span class="wtc-art" v-html="item.svg"></span><span class="wtc-name"><small>{{ String(index + 1).padStart(2, '0') }}</small> {{ item.label }}</span>
          </button>
        </div>
        <button type="button" class="wtc-nav" :disabled="!canNext" aria-label="다음 타일 디자인" @click="slide(1)"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
      </div>
      <div class="wtc-pager" aria-label="타일 디자인 목록 페이지"><span v-for="page in pageTotal" :key="page" :class="{ on: page === pageNo }"></span></div>
    </template>
    <p v-else-if="!available" class="wtc-note">{{ unavailableReason }}</p>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { TILE_STYLES, tileStyleOf, layoutTile, tileStandaloneSvg } from './tileRender'

const props = defineProps({
  modelValue: { type: String, required: true },
  tone: { type: String, default: 'light' },
  enabled: { type: Boolean, default: true },
  available: { type: Boolean, default: true },
  unavailableReason: { type: String, default: '이 지도 디자인에서는 타일을 쓸 수 없어요' }
})
const emit = defineEmits(['update:modelValue', 'update:enabled'])
const selected = computed(() => tileStyleOf(props.modelValue))
const previews = computed(() => TILE_STYLES.map((item) => {
  const layout = layoutTile(item.key, { cd: 'R_ASIA', en: 'ASIA', name: '아시아' }, props.tone)
  return { ...item, svg: tileStandaloneSvg(layout, `wtc-${item.key}-`).svg }
}))
const track = ref(null)
const canPrev = ref(false)
const canNext = ref(false)
const pageNo = ref(1)
const pageTotal = ref(1)
let timer
let observer
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
  clearTimeout(timer)
  timer = setTimeout(measure, 500)
}
function onWheel(event) {
  const el = track.value
  if (!el || el.scrollWidth <= el.clientWidth || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return
  event.preventDefault()
  el.scrollLeft += event.deltaY
}
watch(track, (el, previous) => {
  if (previous) observer?.unobserve(previous)
  if (el) { observer?.observe(el); nextTick(measure) }
})
onMounted(() => {
  observer = new ResizeObserver(measure)
  if (track.value) observer.observe(track.value)
  measure()
})
onBeforeUnmount(() => { observer?.disconnect(); clearTimeout(timer) })
</script>

<style scoped>
.wtc { margin-bottom: 10px; }.wtc-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin-bottom: 8px; color: var(--b2b-color-text-main, #212529); }.wtc-heading label { display: inline-flex; align-items: center; gap: 5px; margin-right: 10px; font-size: 12px; cursor: pointer; }.wtc-heading label.off { opacity: .5; cursor: not-allowed; }.wtc-heading strong { font-size: 12px; }.wtc-heading>span { color: var(--b2b-color-text-muted, #6c757d); font-size: 11px; }.wtc-note { margin: 0; color: var(--b2b-color-text-muted, #6c757d); font-size: 11px; }
.wtc-strip { display: flex; align-items: center; gap: 8px; }.wtc-track { flex: 1; min-width: 0; display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; padding: 4px 2px; }.wtc-track::-webkit-scrollbar { display: none; }.wtc-nav { flex: none; width: 30px; height: 30px; display: grid; place-items: center; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 50%; background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-text-main, #212529); }.wtc-nav:disabled { opacity: .35; }
.wtc-card { flex: none; display: flex; flex-direction: column; align-items: center; gap: 4px; width: 150px; padding: 8px 6px 7px; border: 1px solid var(--b2b-color-border, #dee2e6); border-radius: 12px; background: #eef2f7; scroll-snap-align: start; }.wtc-card:hover { transform: translateY(-2px); box-shadow: 0 6px 14px #0f172a1a; }.wtc-card.dark { background: #0f1d36; }.wtc-card.on { border-color: var(--b2b-color-primary, #0d6efd); box-shadow: 0 0 0 2px #0d6efd40; }.wtc-art { display: flex; align-items: center; justify-content: center; width: 136px; height: 64px; }.wtc-art :deep(svg) { max-width: 136px; max-height: 64px; width: auto !important; }.wtc-name { color: var(--b2b-color-text-main, #212529); font-size: 12px; font-weight: 600; }.wtc-name small { color: var(--b2b-color-text-muted, #6c757d); font-size: 11px; }
/* 어두운 지도용 카드는 바탕이 어두우니 이름도 밝게 */
.wtc-card.dark .wtc-name, .wtc-card.dark .wtc-name small { color: #cbd5e1; }
.wtc-pager { display: flex; justify-content: center; gap: 6px; margin-top: 7px; }.wtc-pager span { width: 6px; height: 6px; border-radius: 3px; background: var(--b2b-color-border, #dee2e6); }.wtc-pager span.on { width: 18px; background: var(--b2b-color-primary, #0d6efd); }
</style>
