<template>
  <!-- 레이아웃 3종 미니 선택기. 각 레이아웃 제목 줄 오른쪽에 두고, 눌러서 바로 바꾼다 -->
  <nav class="wls" aria-label="레이아웃 선택">
    <RouterLink
      v-for="item in WORLD_MAP_LAYOUTS"
      :key="item.id"
      :to="{ name: 'WorldMapGallery', query: { ...route.query, layout: item.id } }"
      class="wls-item"
      :class="{ on: current === item.id }"
      :aria-current="current === item.id ? 'page' : undefined"
      :title="`${item.name} · ${item.description}`"
    >
      <span class="wls-thumb" :class="`wls-${item.id}`" aria-hidden="true">
        <span class="wls-side"></span><span class="wls-map"></span><span class="wls-cards"></span>
      </span>
      <span class="wls-name">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { WORLD_MAP_LAYOUTS } from './layouts'

const route = useRoute()
const current = computed(() => route.query.layout || WORLD_MAP_LAYOUTS[0].id)
</script>

<style scoped>
.wls { display: inline-flex; gap: 6px; padding: 4px; border-radius: 10px; background: var(--b2b-color-tab-bg, #f1f3f5); }
.wls-item { display: flex; align-items: center; gap: 7px; padding: 4px 9px 4px 4px; border-radius: 7px; color: var(--b2b-color-text-muted, #6c757d); font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background .15s, color .15s; }
.wls-item:hover { color: var(--b2b-color-text-main, #212529); }
.wls-item.on { background: var(--b2b-color-bg-card, #fff); color: var(--b2b-color-primary, #0d6efd); box-shadow: 0 1px 3px rgba(15, 23, 42, .14); }
.wls-item:focus-visible { outline: 2px solid var(--b2b-color-primary, #0d6efd); outline-offset: 1px; }

/* 레이아웃 모양을 그린 작은 그림 (36 x 24) */
.wls-thumb { position: relative; flex: none; width: 36px; height: 24px; border-radius: 4px; background: #e7edf5; overflow: hidden; }
.wls-item.on .wls-thumb { background: #dbe7fb; }
.wls-thumb > span { position: absolute; display: block; border-radius: 2px; }
.wls-side { top: 3px; bottom: 3px; width: 8px; background: #b6c8e0; }
.wls-map { top: 3px; bottom: 3px; background: #8fb0e3; }
.wls-cards { display: none !important; }
/* 왼쪽 권역 메뉴 + 오른쪽 지도 */
.wls-region-desk .wls-side { left: 3px; }
.wls-region-desk .wls-map { left: 13px; right: 3px; }
/* 왼쪽 지도 + 오른쪽 탐색 패널 */
.wls-atlas-split .wls-map { left: 3px; right: 13px; }
.wls-atlas-split .wls-side { right: 3px; }
/* 위 권역 카드 + 아래 지도 */
.wls-region-grid .wls-side { display: none; }
.wls-region-grid .wls-cards { display: block !important; top: 3px; left: 3px; right: 3px; height: 5px; background: repeating-linear-gradient(90deg, #b6c8e0 0 18%, transparent 18% 20.5%); }
.wls-region-grid .wls-map { top: 10px; left: 3px; right: 3px; }

@media (max-width: 576px) { .wls-name { display: none; } .wls-item { padding-right: 4px; } }
</style>
