<template>
  <div class="container-fluid py-4 rg-page">
    <header class="rg-heading"><div><span>REGION GRID</span><h2>권역별 규제 현황</h2><p>권역 카드를 골라 세계지도에서 위치를 비교합니다.</p></div><span class="rg-tag">권역 카드 + 지도</span></header>
    <div class="rg-cards" aria-label="권역 선택">
      <button v-for="(region, index) in regions" :key="region.cd" type="button" :class="{ active: selectedCode === region.cd }" :aria-pressed="selectedCode === region.cd" @click="selectedCode = region.cd">
        <span class="rg-card-top"><small>{{ String(index + 1).padStart(2, '0') }} / 05</small><i class="bi bi-arrow-up-right" aria-hidden="true"></i></span>
        <strong>{{ region.name }}</strong><span class="rg-en">{{ region.en }}</span>
        <span class="rg-count"><b>{{ region.count }}</b>개 국가</span>
      </button>
    </div>
    <section class="rg-stage" aria-label="권역 지도와 국가">
      <div class="rg-stage-top"><div><span>WORLD VIEW</span><strong>{{ selected.name }}</strong></div><p>선택한 권역을 지도에서 표시합니다.</p></div>
      <WorldMapLayoutMap :region-code="selectedCode" accent="#368f9c" />
      <div class="rg-country-strip">
        <div><strong>{{ selected.name }} 국가</strong><span>{{ countries.length }}개 국가</span></div>
        <div class="rg-countries">
          <button v-for="country in visibleCountries" :key="country.code" type="button" @click="goCountry(country.code)">{{ country.name }} <small>{{ country.code }}</small></button>
          <button v-if="countries.length > 7" type="button" class="rg-more" :aria-expanded="showAll" @click="showAll = !showAll">{{ showAll ? '접기' : `+ ${countries.length - 7}개 더 보기` }}</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { countryCodes } from '@/data/regulationMock'
import { TILE_REGIONS, regionName } from './worldMap/regionTiles'
import WorldMapLayoutMap from './WorldMapLayoutMap.vue'

const router = useRouter()
const selectedCode = ref('R_ASIA')
const showAll = ref(false)
const regions = ['R_ASIA', 'R_EU', 'R_NA', 'R_LA', 'R_MEA'].map((cd) => ({
  cd, name: regionName(cd), en: TILE_REGIONS.find((region) => region.cd === cd)?.en,
  count: countryCodes.filter((country) => country.parentCd === cd).length
}))
const selected = computed(() => regions.find((region) => region.cd === selectedCode.value) || regions[0])
const countries = computed(() => countryCodes.filter((country) => country.parentCd === selectedCode.value))
const visibleCountries = computed(() => showAll.value ? countries.value : countries.value.slice(0, 7))
watch(selectedCode, () => { showAll.value = false })
function goCountry(code) { router.push({ name: 'RegulationInfo', query: { country: code } }) }
</script>

<style scoped>
.rg-page { --rg-panel: #fff; --rg-map: #f1f5fa; --rg-text: #213044; --rg-muted: #77869a; --rg-border: #e1e9ee; --rg-accent: #248391; --rg-active: #e8f5f5; color: var(--rg-text); }
:global([data-theme="dark"]) .rg-page, :global([data-theme="dark-navy"]) .rg-page { --rg-panel: #172337; --rg-map: #111d30; --rg-text: #e9eff9; --rg-muted: #9dacbf; --rg-border: #2b3a50; --rg-accent: #7ccbd0; --rg-active: #1c3d4a; }
.rg-heading { display: flex; justify-content: space-between; align-items: end; gap: 12px; margin-bottom: 18px; }.rg-heading div>span, .rg-stage-top div>span { font-size: 10px; letter-spacing: 1.6px; color: var(--rg-muted); }.rg-heading h2 { margin: 5px 0; font-size: 24px; font-weight: 650; }.rg-heading p { margin: 0; color: var(--rg-muted); font-size: 13px; }.rg-tag { padding: 6px 9px; border-radius: 5px; background: var(--rg-active); color: var(--rg-accent); font-size: 11px; white-space: nowrap; }
.rg-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }.rg-cards button { display: flex; flex-direction: column; min-height: 145px; padding: 15px; border: 1px solid var(--rg-border); border-radius: 10px; background: var(--rg-panel); color: var(--rg-text); text-align: left; }.rg-cards button:hover, .rg-cards button.active { border-color: var(--rg-accent); background: var(--rg-active); }.rg-card-top { display: flex; justify-content: space-between; align-items: center; width: 100%; color: var(--rg-muted); }.rg-card-top small { font-size: 10px; letter-spacing: 1px; }.rg-cards strong { margin-top: 17px; font-size: 16px; }.rg-en { margin-top: 3px; color: var(--rg-muted); font-size: 10px; letter-spacing: .7px; }.rg-count { margin-top: auto; color: var(--rg-muted); font-size: 11px; }.rg-count b { color: var(--rg-accent); font-size: 17px; font-weight: 650; }
.rg-stage { overflow: hidden; border: 1px solid var(--rg-border); border-radius: 12px; background: var(--rg-panel); }.rg-stage-top { display: flex; justify-content: space-between; align-items: end; padding: 17px 20px; }.rg-stage-top div { display: grid; gap: 3px; }.rg-stage-top strong { font-size: 18px; }.rg-stage-top p { margin: 0; color: var(--rg-muted); font-size: 11px; }.rg-stage :deep(.layout-map) { background: var(--rg-map); }.rg-country-strip { display: flex; align-items: start; gap: 18px; padding: 18px 20px; }.rg-country-strip>div:first-child { display: grid; flex: none; min-width: 130px; gap: 3px; }.rg-country-strip strong { font-size: 13px; }.rg-country-strip>div:first-child span { color: var(--rg-muted); font-size: 11px; }.rg-countries { display: flex; flex-wrap: wrap; gap: 6px; }.rg-countries button { padding: 7px 10px; border: 1px solid var(--rg-border); border-radius: 5px; background: var(--rg-panel); color: var(--rg-text); font-size: 11px; }.rg-countries button:hover { border-color: var(--rg-accent); color: var(--rg-accent); }.rg-countries small { color: var(--rg-muted); }.rg-countries .rg-more { border-color: transparent; background: var(--rg-active); color: var(--rg-accent); }
@media (max-width: 900px) { .rg-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }.rg-cards button { min-height: 130px; }
@media (max-width: 600px) { .rg-heading h2 { font-size: 20px; }.rg-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }.rg-country-strip { display: block; }.rg-countries { margin-top: 10px; } }
</style>
