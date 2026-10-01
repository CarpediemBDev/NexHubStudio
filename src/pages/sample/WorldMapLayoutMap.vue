<template>
  <div ref="host" class="layout-map" role="img" :aria-label="`${regionName(regionCode)} 지도`" @click="onClick"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { buildSvg } from './worldMap/svgEngine'
import { flatProj } from './worldMap/mapEngine'
import { TILE_REGIONS, regionName } from './worldMap/regionTiles'
import { regCountryOf } from './worldMap/countryLink'
import { MAP_STYLES } from './worldMap/mapStyles'
import { worldMapDesign } from './worldMap/designSelection'

const props = defineProps({
  regionCode: { type: String, required: true },
  zoom: { type: Boolean, default: false }
})
const emit = defineEmits(['select-region'])
const host = ref(null)
const router = useRouter()
const widths = { R_ASIA: 500, R_EU: 390, R_NA: 530, R_LA: 500, R_MEA: 580 }

function render() {
  if (!host.value) return
  const selectedStyle = MAP_STYLES.find((item) => item.key === worldMapDesign.styleKey) || MAP_STYLES[0]
  const style = selectedStyle.focusRegion ? { ...selectedStyle, focusRegion: props.regionCode } : selectedStyle
  const globe = style.kind === 'globe' || style.kind === 'dotglobe'
  const region = TILE_REGIONS.find((item) => item.cd === props.regionCode)
  const time = globe && region ? (region.ll[0] - 100) / (style.spin ?? 6) : 1.4
  const tiles = worldMapDesign.tilesEnabled && !globe
  host.value.innerHTML = buildSvg(style, time, 'layout-map', { tiles, tileStyle: worldMapDesign.tileStyleKey })
  host.value.querySelectorAll('path[data-cid]').forEach((path) => {
    const country = regCountryOf(path.dataset.cid)
    if (country?.regionCd === props.regionCode && !selectedStyle.focusRegion) {
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
  if (props.zoom && !globe) {
    if (region) {
      const [x, y] = flatProj(region.ll)
      const width = widths[region.cd]
      host.value.querySelector('svg').setAttribute('viewBox', `${x - width / 2} ${y - width / 4} ${width} ${width / 2}`)
    }
  }
}

function onClick(event) {
  const tile = event.target.closest?.('[data-region]')
  if (tile) { emit('select-region', tile.dataset.region); return }
  const path = event.target.closest?.('path[data-cid]')
  const country = path && regCountryOf(path.dataset.cid)
  if (country) router.push({ name: 'RegulationInfo', query: { country: country.code } })
}

let observer
onMounted(() => {
  render()
  observer = new MutationObserver(render)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
watch(() => [props.regionCode, props.zoom, worldMapDesign.styleKey, worldMapDesign.tileStyleKey, worldMapDesign.tilesEnabled], render)
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.layout-map { overflow: hidden; }
.layout-map :deep(svg) { display: block; width: 100%; height: auto; }
.layout-map :deep(path.layout-map-link) { cursor: pointer; }
.layout-map :deep(path.layout-map-link:hover) { opacity: .72; }
</style>
