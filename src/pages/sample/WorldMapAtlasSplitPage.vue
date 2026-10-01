<template>
  <div class="as-page">
    <header class="as-heading">
      <div><p>오른쪽 패널에서 권역을 고르면 왼쪽 지도가 그 권역으로 확대되고, 국가를 눌러 규제 화면으로 갑니다.</p></div>
      <WorldMapLayoutSwitcher />
    </header>
    <div class="as-board">
      <section class="as-map-pane" aria-label="선택한 권역 지도">
        <div class="as-map-top"><span>GLOBAL OVERVIEW</span><strong>{{ selected.name }}</strong></div>
        <WorldMapLayoutMap :region-code="selected.cd" @select-region="selectRegion" />
        <div class="as-map-foot"><span class="as-key"></span>{{ selected.name }} · {{ countries.length }}개 국가</div>
      </section>
      <aside class="as-directory" aria-label="권역 및 국가 탐색">
        <div class="as-side-title"><span>REGION INDEX</span><strong>권역 둘러보기</strong></div>
        <div class="as-regions">
          <button v-for="(region, index) in regions" :key="region.cd" type="button" :class="{ active: selectedCode === region.cd }" :aria-pressed="selectedCode === region.cd" @click="selectedCode = region.cd">
            <span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ region.name }}</strong><small>{{ region.count }}</small>
          </button>
        </div>
        <div class="as-country-head"><strong>{{ selected.name }} 국가</strong><span>{{ countries.length }}개</span></div>
        <div class="as-countries">
          <button v-for="country in visibleCountries" :key="country.code" type="button" @click="goCountry(country.code)">{{ country.name }}<span>{{ country.code }}</span></button>
          <button v-if="countries.length > 8" type="button" class="as-more" :aria-expanded="showAll" @click="showAll = !showAll">{{ showAll ? '접기' : `전체 ${countries.length}개 보기` }}</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { countryCodes } from '@/data/regulationMock'
import { TILE_REGIONS, regionName } from './worldMap/regionTiles'
import WorldMapLayoutMap from './WorldMapLayoutMap.vue'
import WorldMapLayoutSwitcher from './worldMap/WorldMapLayoutSwitcher.vue'

const router = useRouter()
const selectedCode = ref('R_ASIA')
const showAll = ref(false)
const regions = ['R_ASIA', 'R_EU', 'R_NA', 'R_LA', 'R_MEA'].map((cd) => ({
  cd, name: regionName(cd), en: TILE_REGIONS.find((region) => region.cd === cd)?.en,
  count: countryCodes.filter((country) => country.parentCd === cd).length
}))
const selected = computed(() => regions.find((region) => region.cd === selectedCode.value) || regions[0])
const countries = computed(() => countryCodes.filter((country) => country.parentCd === selectedCode.value))
const visibleCountries = computed(() => showAll.value ? countries.value : countries.value.slice(0, 8))
watch(selectedCode, () => { showAll.value = false })
function goCountry(code) { router.push({ name: 'RegulationInfo', query: { country: code } }) }
// 지도의 권역 타일을 눌러도 같은 권역이 골라진다
function selectRegion(cd) { if (regions.some((region) => region.cd === cd)) selectedCode.value = cd }
</script>

<style scoped>
.as-page { --as-bg: #fff; --as-map: #f1f5fa; --as-ink: #223149; --as-muted: #7a879b; --as-line: #e3eaf2; --as-blue: #3268d5; --as-active: #eaf1ff; color: var(--as-ink); }
:global([data-theme="dark"]) .as-page, :global([data-theme="dark-navy"]) .as-page { --as-bg: #172337; --as-map: #111d30; --as-ink: #e9eff9; --as-muted: #9dacbf; --as-line: #2b3a50; --as-blue: #89b1ff; --as-active: #263e61; }
.as-heading { display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 14px; }
.as-heading div>span, .as-map-top>span, .as-side-title>span { font-size: 10px; letter-spacing: 1.6px; color: var(--as-muted); }
.as-heading h2 { margin: 0 0 3px; font-size: 18px; font-weight: 650; letter-spacing: -0.4px; }.as-heading p { margin: 0; font-size: 13px; color: var(--as-muted); }
.as-board { display: grid; grid-template-columns: minmax(0, 1fr) 275px; overflow: hidden; border: 1px solid var(--as-line); border-radius: 12px; background: var(--as-bg); }
.as-map-pane { min-width: 0; background: var(--as-map); }.as-map-top { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px 0; }.as-map-top strong { font-size: 12px; color: var(--as-blue); }
.as-map-pane :deep(.layout-map) { margin: 8px 8px 0; }.as-map-foot { display: flex; align-items: center; gap: 7px; padding: 0 20px 18px; color: var(--as-muted); font-size: 11px; }.as-key { width: 8px; height: 8px; background: #4f83d8; border-radius: 50%; }
.as-directory { border-left: 1px solid var(--as-line); padding: 18px 14px; }.as-side-title { display: grid; gap: 4px; margin: 0 3px 15px; }.as-side-title strong { font-size: 17px; }
.as-regions { display: grid; gap: 4px; }.as-regions button { display: flex; align-items: center; gap: 9px; width: 100%; padding: 10px; border: 0; border-radius: 7px; background: transparent; color: var(--as-ink); text-align: left; }.as-regions button:hover, .as-regions button.active { background: var(--as-active); color: var(--as-blue); }.as-regions button>span { font-size: 10px; color: var(--as-muted); }.as-regions button strong { flex: 1; font-size: 12px; }.as-regions button small { font-size: 11px; color: var(--as-muted); }
.as-country-head { display: flex; justify-content: space-between; margin: 20px 3px 9px; padding-top: 14px; border-top: 1px solid var(--as-line); font-size: 12px; }.as-country-head span { color: var(--as-muted); }.as-countries { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; }.as-countries button { display: flex; justify-content: space-between; gap: 5px; padding: 7px; border: 1px solid var(--as-line); border-radius: 5px; background: var(--as-bg); color: var(--as-ink); font-size: 11px; text-align: left; }.as-countries button:hover { border-color: var(--as-blue); color: var(--as-blue); }.as-countries button span { color: var(--as-muted); }.as-countries .as-more { grid-column: 1/-1; justify-content: center; background: var(--as-active); color: var(--as-blue); }
@media (max-width: 850px) { .as-board { grid-template-columns: 1fr; }.as-directory { border-left: 0; border-top: 1px solid var(--as-line); }.as-regions { grid-template-columns: repeat(5, minmax(0, 1fr)); }.as-regions button { flex-wrap: wrap; }.as-regions button strong { flex-basis: 100%; } }
@media (max-width: 580px) { .as-heading h2 { font-size: 17px; }.as-regions { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
