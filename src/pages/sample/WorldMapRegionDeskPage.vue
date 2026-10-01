<template>
  <div class="rd-page">
    <header class="rd-heading">
      <div>
        <p>왼쪽 메뉴에서 권역을 고르면 오른쪽 지도가 그 권역으로 확대되고 국가 목록이 바뀝니다.</p>
      </div>
      <WorldMapLayoutSwitcher />
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
          <!-- 지도 스타일 탭에서 고른 디자인으로, 고른 권역에 확대 (세 레이아웃 공용 지도) -->
          <WorldMapLayoutMap :region-code="selectedRegion" :animate-toggle="true" :markers-toggle="true" :zoomable="true" @select-region="selectRegion" />
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { countryCodes } from '@/data/regulationMock'
import { TILE_REGIONS, regionName } from './worldMap/regionTiles'
import WorldMapLayoutMap from './WorldMapLayoutMap.vue'
import WorldMapLayoutSwitcher from './worldMap/WorldMapLayoutSwitcher.vue'

const router = useRouter()
const selectedRegion = ref('R_ASIA')
const showAll = ref(false)
const regions = ['R_ASIA', 'R_EU', 'R_NA', 'R_LA', 'R_MEA'].map((cd) => {
  const tile = TILE_REGIONS.find((r) => r.cd === cd)
  return { cd, name: regionName(cd), en: tile.en }
})
const selected = computed(() => regions.find((r) => r.cd === selectedRegion.value) || regions[0])
const selectedRegionName = computed(() => selected.value.name)
const selectedRegionEnglish = computed(() => selected.value.en)
const countries = computed(() => countryCodes.filter((c) => c.parentCd === selectedRegion.value))
const visibleCountries = computed(() => showAll.value ? countries.value : countries.value.slice(0, 6))

// 지도의 권역 타일을 눌러도 같은 권역이 골라진다
function selectRegion(cd) {
  if (!regions.some((r) => r.cd === cd)) return
  selectedRegion.value = cd
  showAll.value = false
}

function goCountry(code) {
  router.push({ name: 'RegulationInfo', query: { country: code } })
}
</script>

<style scoped>
.rd-page { --rd-panel: #fff; --rd-water: #f1f5fa; --rd-text: #202d43; --rd-muted: #758196; --rd-border: #e4eaf2; --rd-accent: #3268d5; --rd-active: #eaf1ff; --rd-mark: #4f83d8; color: var(--rd-text); }
:global([data-theme="dark"]) .rd-page,
:global([data-theme="dark-navy"]) .rd-page { --rd-panel: #172337; --rd-water: #111d30; --rd-text: #e9eff9; --rd-muted: #9dacbf; --rd-border: #2b3a50; --rd-accent: #89b1ff; --rd-active: #263e61; --rd-mark: #7aa5ef; }
.rd-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.rd-eyebrow, .rd-map-caption { color: var(--rd-muted); font-size: 11px; letter-spacing: 1.5px; }
.rd-heading h2 { margin: 0 0 3px; font-size: 18px; font-weight: 650; letter-spacing: -0.4px; }
.rd-heading p { margin: 0; font-size: 13px; color: var(--rd-muted); }
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
.rd-map-caption { position: absolute; top: 14px; right: 16px; z-index: 1; pointer-events: none; }
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
  .rd-heading { align-items: start; } .rd-heading h2 { font-size: 17px; }
  .rd-board { grid-template-columns: 1fr; } .rd-regions { display: flex; flex-wrap: wrap; gap: 4px; padding: 10px; border-right: 0; border-bottom: 1px solid var(--rd-border); }
  .rd-side-caption, .rd-no, .rd-region small, .rd-region .bi { display: none; }
  .rd-region { width: auto; margin: 0; padding: 8px 10px; } .rd-region strong { font-size: 12px; }
  .rd-country-area { padding: 14px; }
}
@media (pointer: coarse) { .rd-region, .rd-countries button { min-height: 44px; } }
</style>
