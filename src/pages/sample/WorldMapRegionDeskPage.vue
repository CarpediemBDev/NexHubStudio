<template>
  <div class="container-fluid py-4 rd-page">
    <header class="rd-heading">
      <div>
        <div class="rd-eyebrow">EXPLORE BY REGION</div>
        <h2>세계 규제 현황</h2>
        <p>권역을 고르면 해당 지역으로 지도가 확대되고 국가 목록이 바뀝니다.</p>
      </div>
      <span class="rd-tag">Region Desk</span>
    </header>

    <div class="rd-board">
      <nav class="rd-regions" aria-label="권역 선택">
        <div class="rd-side-caption">권역별 탐색</div>
        <button
          v-for="(region, index) in regions"
          :key="region.cd"
          type="button"
          class="rd-region"
          :class="{ active: selectedRegion === region.cd }"
          :aria-pressed="selectedRegion === region.cd"
          @click="selectRegion(region.cd)"
        >
          <span class="rd-no">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="rd-region-copy"><strong>{{ region.name }}</strong><small>{{ region.en }}</small></span>
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </nav>

      <div class="rd-content">
        <div class="rd-map">
          <span class="rd-map-caption">{{ selectedRegionEnglish }} · REGION VIEW</span>
          <div
            ref="mapHost"
            class="rd-svg-host"
            role="img"
            :aria-label="`${selectedRegionName} 권역 확대 지도`"
            @click="onMapClick"
          ></div>
        </div>
        <section class="rd-country-area" :aria-label="`${selectedRegionName} 국가`">
          <div class="rd-country-head">
            <div>
              <strong>{{ selectedRegionName }}</strong>
              <span>{{ selectedRegionEnglish }}</span>
            </div>
            <span>{{ countries.length }}개 국가</span>
          </div>
          <div class="rd-countries">
            <button v-for="country in visibleCountries" :key="country.code" type="button" @click="goCountry(country.code)">
              {{ country.name }} <span>{{ country.code }}</span>
            </button>
            <button v-if="countries.length > 6" type="button" class="rd-more" :aria-expanded="showAll" @click="showAll = !showAll">
              {{ showAll ? '접기' : `전체 ${countries.length}개 국가 보기` }}
              <i class="bi" :class="showAll ? 'bi-chevron-up' : 'bi-chevron-down'" aria-hidden="true"></i>
            </button>
          </div>
        </section>
      </div>
    </div>
    <p class="rd-hint"><span class="rd-swatch" aria-hidden="true"></span>선택한 권역으로 지도가 확대됩니다. 국가를 누르면 해당 규제 화면으로 이동합니다.</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { countryCodes } from '@/data/regulationMock'
import { TILE_REGIONS, regionName } from './worldMap/regionTiles'
import { regCountryOf } from './worldMap/countryLink'
import { buildSvg } from './worldMap/svgEngine'
import { flatProj } from './worldMap/mapEngine'

const router = useRouter()
const mapHost = ref(null)
const selectedRegion = ref('R_ASIA')
const showAll = ref(false)
const regionWidths = { R_ASIA: 500, R_EU: 390, R_NA: 530, R_LA: 500, R_MEA: 580 }
const regions = ['R_ASIA', 'R_EU', 'R_NA', 'R_LA', 'R_MEA'].map((cd) => {
  const tile = TILE_REGIONS.find((r) => r.cd === cd)
  return { cd, name: regionName(cd), en: tile.en, ll: tile.ll, viewWidth: regionWidths[cd] }
})
const selected = computed(() => regions.find((r) => r.cd === selectedRegion.value) || regions[0])
const selectedRegionName = computed(() => selected.value.name)
const selectedRegionEnglish = computed(() => selected.value.en)
const countries = computed(() => countryCodes.filter((c) => c.parentCd === selectedRegion.value))
const visibleCountries = computed(() => showAll.value ? countries.value : countries.value.slice(0, 6))

function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme')?.startsWith('dark')
}

function paintMap() {
  if (!mapHost.value) return
  const dark = isDarkTheme()
  const bg = dark ? '#111D30' : '#F1F5FA'
  const land = dark ? '#33445B' : '#DFE6EF'
  const active = dark ? '#7AA5EF' : '#4F83D8'
  const style = {
    kind: 'fill', tone: dark ? 'dark' : 'light', fx: false,
    bg, land, mk: land, hq: land, stroke: bg, lw: 0.75,
    graticule: dark ? 'rgba(157,172,191,.08)' : 'rgba(117,129,150,.10)'
  }
  mapHost.value.innerHTML = buildSvg(style, 1.4, 'region-desk')
  mapHost.value.querySelectorAll('path[data-cid]').forEach((path) => {
    const country = regCountryOf(path.dataset.cid)
    if (country?.regionCd === selectedRegion.value) path.style.fill = active
    if (country) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      label.textContent = `${country.name} · 규제 보기`
      path.append(label)
      path.classList.add('rd-link')
    }
  })
  // 권역 중심을 기준으로 확대한다. 해외 영토가 있는 나라의 전체 경계에 맞추면 본토가 작아진다.
  const [centerX, centerY] = flatProj(selected.value.ll)
  const width = selected.value.viewWidth
  mapHost.value.querySelector('svg').setAttribute('viewBox', `${centerX - width / 2} ${centerY - width / 4} ${width} ${width / 2}`)
}

function selectRegion(cd) {
  selectedRegion.value = cd
  showAll.value = false
  nextTick(paintMap)
}

function goCountry(code) {
  router.push({ name: 'RegulationInfo', query: { country: code } })
}

function onMapClick(event) {
  const path = event.target.closest?.('path[data-cid]')
  const country = path && regCountryOf(path.dataset.cid)
  if (country) goCountry(country.code)
}

let themeObserver
onMounted(() => {
  paintMap()
  themeObserver = new MutationObserver(paintMap)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
onBeforeUnmount(() => themeObserver?.disconnect())
</script>

<style scoped>
.rd-page { --rd-panel: #fff; --rd-water: #f1f5fa; --rd-text: #202d43; --rd-muted: #758196; --rd-border: #e4eaf2; --rd-accent: #3268d5; --rd-active: #eaf1ff; --rd-mark: #4f83d8; color: var(--rd-text); }
:global([data-theme="dark"]) .rd-page,
:global([data-theme="dark-navy"]) .rd-page { --rd-panel: #172337; --rd-water: #111d30; --rd-text: #e9eff9; --rd-muted: #9dacbf; --rd-border: #2b3a50; --rd-accent: #89b1ff; --rd-active: #263e61; --rd-mark: #7aa5ef; }
.rd-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.rd-eyebrow, .rd-map-caption { color: var(--rd-muted); font-size: 11px; letter-spacing: 1.5px; }
.rd-heading h2 { margin: 5px 0 4px; font-size: 24px; font-weight: 650; letter-spacing: -0.8px; }
.rd-heading p { margin: 0; font-size: 13px; color: var(--rd-muted); }
.rd-tag { padding: 5px 9px; border-radius: 5px; background: var(--rd-active); color: var(--rd-accent); font-size: 11px; white-space: nowrap; }
.rd-board { display: grid; grid-template-columns: 205px minmax(0, 1fr); min-width: 0; overflow: hidden; background: var(--rd-panel); border: 1px solid var(--rd-border); border-radius: 12px; }
.rd-regions { padding: 17px 10px; border-right: 1px solid var(--rd-border); }
.rd-side-caption { margin: 0 10px 12px; color: var(--rd-muted); font-size: 11px; }
.rd-region { display: flex; align-items: center; gap: 9px; width: 100%; margin-bottom: 3px; padding: 12px 10px; border: 0; border-radius: 7px; background: transparent; color: var(--rd-text); text-align: left; }
.rd-region:hover, .rd-region.active { background: var(--rd-active); color: var(--rd-accent); }
.rd-no { width: 18px; flex: none; color: var(--rd-muted); font-size: 10px; }
.rd-region-copy { min-width: 0; flex: 1; }
.rd-region strong { display: block; font-size: 13px; font-weight: 600; }
.rd-region small { display: block; margin-top: 3px; color: var(--rd-muted); font-size: 10px; letter-spacing: 0.6px; }
.rd-region .bi { font-size: 11px; }
.rd-content { min-width: 0; }
.rd-map { position: relative; background: var(--rd-water); }
.rd-map-caption { position: absolute; top: 15px; left: 18px; z-index: 1; }
.rd-svg-host :deep(svg) { display: block; width: 100%; height: auto; }
.rd-svg-host :deep(path.rd-link) { cursor: pointer; }
.rd-svg-host :deep(path.rd-link:hover) { opacity: 0.7; }
.rd-country-area { min-height: 122px; padding: 16px 20px 20px; border-top: 1px solid var(--rd-border); }
.rd-country-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.rd-country-head strong { display: block; font-size: 16px; font-weight: 650; }
.rd-country-head div span { display: block; color: var(--rd-muted); font-size: 10px; letter-spacing: 1px; }
.rd-country-head > span { color: var(--rd-muted); font-size: 11px; }
.rd-countries { display: flex; flex-wrap: wrap; gap: 7px; }
.rd-countries button { padding: 7px 10px; border: 1px solid var(--rd-border); border-radius: 6px; background: var(--rd-panel); color: var(--rd-text); font-size: 12px; }
.rd-countries button:hover { border-color: var(--rd-accent); color: var(--rd-accent); }
.rd-countries button span { margin-left: 5px; color: var(--rd-muted); font-size: 10px; }
.rd-countries .rd-more { background: var(--rd-active); color: var(--rd-accent); border-color: transparent; }
.rd-hint { display: flex; align-items: center; gap: 8px; margin: 12px 0 0; color: var(--rd-muted); font-size: 11px; }
.rd-swatch { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--rd-mark); }
@media (max-width: 760px) {
  .rd-heading { align-items: start; } .rd-heading h2 { font-size: 21px; }
  .rd-board { grid-template-columns: 1fr; } .rd-regions { display: flex; flex-wrap: wrap; gap: 4px; padding: 10px; border-right: 0; border-bottom: 1px solid var(--rd-border); }
  .rd-side-caption, .rd-no, .rd-region small, .rd-region .bi { display: none; }
  .rd-region { width: auto; margin: 0; padding: 8px 10px; } .rd-region strong { font-size: 12px; }
  .rd-country-area { padding: 14px; }
}
@media (pointer: coarse) { .rd-region, .rd-countries button { min-height: 44px; } }
</style>
