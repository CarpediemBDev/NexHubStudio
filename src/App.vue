<template>
  <router-view />
  <!-- 공통 툴팁 (화면에 하나). 열기: v-tooltip 또는 @/components/common/tooltip 의 showTooltip -->
  <AppTooltip />
</template>

<script>
import AppTooltip from '@/components/common/AppTooltip.vue'

export default { name: 'App', components: { AppTooltip } }
</script>

<style>
/* App.vue 전용 스타일이 필요하면 여기에 */
</style>
