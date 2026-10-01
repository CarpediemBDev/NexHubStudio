<template>
  <div>
    <nav class="wm-gallery-tabs" aria-label="세계지도 갤러리 탭">
      <RouterLink :to="styleRoute" :aria-current="isLayout ? undefined : 'page'" :class="{ active: !isLayout }"><i class="bi bi-globe-asia-australia" aria-hidden="true"></i>지도 스타일</RouterLink>
      <RouterLink :to="layoutRoute" :aria-current="isLayout ? 'page' : undefined" :class="{ active: isLayout }"><i class="bi bi-layout-sidebar" aria-hidden="true"></i>레이아웃</RouterLink>
    </nav>
    <WorldMapGalleryPage v-if="!isLayout" />
    <template v-else>
      <!-- 레이아웃 탭: 지도·타일 디자인은 지도 스타일 탭과 같은 선택을 쓴다. 레이아웃 고르기는 각 화면 제목 줄의 미니 선택기로 -->
      <!-- 지도 스타일 탭처럼 타일 디자인 바로 아래에 지도가 오도록, 타일 고르기와 레이아웃 화면을 한 카드에 담는다 -->
      <div class="container-fluid py-4">
        <WorldMapStyleCarousel :model-value="worldMapDesign.styleKey" @update:model-value="worldMapDesign.styleKey = $event" />
        <div class="b2b-card shadow-sm border border-theme rounded-3 bg-theme-card p-3">
          <WorldMapTileCarousel
            :model-value="worldMapDesign.tileStyleKey"
            :tone="selectedStyle.tone"
            :enabled="worldMapDesign.tilesEnabled"
            :available="!isGlobeStyle(selectedStyle)"
            unavailable-reason="지구본 디자인에서는 타일을 쓸 수 없어요"
            @update:model-value="worldMapDesign.tileStyleKey = $event"
            @update:enabled="worldMapDesign.tilesEnabled = $event"
          />
          <div class="wm-layout-body">
            <RegionDeskPage v-if="activeLayout === 'region-desk'" />
            <AtlasSplitPage v-else-if="activeLayout === 'atlas-split'" />
            <RegionGridPage v-else />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import WorldMapGalleryPage from './WorldMapGalleryPage.vue'
import WorldMapStyleCarousel from './worldMap/WorldMapStyleCarousel.vue'
import WorldMapTileCarousel from './worldMap/WorldMapTileCarousel.vue'
import { worldMapDesign, themedStyle } from './worldMap/designSelection'
import { MAP_STYLES } from './worldMap/mapStyles'
import { isGlobeStyle } from './worldMap/svgEngine'
import { WORLD_MAP_LAYOUTS } from './worldMap/layouts'

const RegionDeskPage = defineAsyncComponent(() => import('./WorldMapRegionDeskPage.vue'))
const AtlasSplitPage = defineAsyncComponent(() => import('./WorldMapAtlasSplitPage.vue'))
const RegionGridPage = defineAsyncComponent(() => import('./WorldMapRegionGridPage.vue'))

const route = useRoute()
// 타일 카드 미리보기 색을 지도와 맞추려고 테마를 입힌 디자인을 쓴다
const selectedStyle = computed(() => themedStyle(MAP_STYLES.find((style) => style.key === worldMapDesign.styleKey) || MAP_STYLES[0]))
const isLayout = computed(() => WORLD_MAP_LAYOUTS.some((item) => item.id === route.query.layout))
const activeLayout = computed(() => (isLayout.value ? route.query.layout : WORLD_MAP_LAYOUTS[0].id))
const styleRoute = computed(() => {
  const { layout, ...query } = route.query
  return { name: 'WorldMapGallery', query }
})
const layoutRoute = computed(() => ({ name: 'WorldMapGallery', query: { ...route.query, layout: activeLayout.value } }))
</script>

<style scoped>
.wm-gallery-tabs { display: flex; gap: 6px; padding: 13px 24px 0; border-bottom: 1px solid var(--b2b-color-border, #dee2e6); }
.wm-gallery-tabs a { display: inline-flex; align-items: center; gap: 7px; padding: 10px 16px; border-bottom: 2px solid transparent; color: var(--b2b-color-text-muted, #6c757d); font-size: 13px; font-weight: 600; text-decoration: none; }
.wm-gallery-tabs a.active { color: var(--b2b-color-primary, #0d6efd); border-bottom-color: currentColor; }
.wm-gallery-tabs a:focus-visible { outline: 2px solid var(--b2b-color-primary, #0d6efd); outline-offset: -2px; }
/* 타일 디자인과 레이아웃 화면 사이: 구분선 + 숨 쉴 여백 */
.wm-layout-body { margin-top: 14px; padding-top: 18px; border-top: 1px solid var(--b2b-color-border, #dee2e6); }
@media (max-width: 576px) { .wm-gallery-tabs { padding-left: 14px; padding-right: 14px; }.wm-gallery-tabs a { flex: 1; justify-content: center; } }
</style>
