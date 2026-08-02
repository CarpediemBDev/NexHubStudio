<template>
  <div class="b2b-page-container">
    <RealPivotOfficialSdk :height="height" />
  </div>
</template>

<script>
import RealPivotOfficialSdk from '@/components/RealPivotOfficialSdk.vue'

export default {
  name: 'RealPivotSdkPage',
  components: {
    RealPivotOfficialSdk
  },
  props: {
    height: {
      type: String,
      default: 'calc(100vh - 180px)'
    }
  }
}
</script>

<style scoped>
</style>
