<template>
  <!--
    지도 오른쪽 아래에 얹는 확대 도구 (− / 배율 / + / 원래 크기). 지도 스타일 탭 무대와 레이아웃 탭 지도가 같이 쓴다.
    배율 계산·휠·끌기는 지도마다 방식이 달라(무대 = CSS 확대, 레이아웃 = viewBox) 쓰는 쪽이 하고, 여기는 버튼만.
  -->
  <div class="mzt" @pointerdown.stop @dblclick.stop @click.stop>
    <button type="button" title="축소" aria-label="축소" :disabled="k <= 1.001" @click="emit('zoom', 1 / 1.5)"><i class="bi bi-dash-lg" aria-hidden="true"></i></button>
    <span class="mzt-val" :title="hint">{{ Math.round(k * 100) }}%</span>
    <button type="button" title="확대" aria-label="확대" :disabled="k >= max" @click="emit('zoom', 1.5)"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
    <button type="button" title="원래 크기" aria-label="원래 크기" :disabled="k <= 1.001" @click="emit('reset')"><i class="bi bi-arrows-angle-contract" aria-hidden="true"></i></button>
  </div>
</template>

<script setup>
defineProps({
  /** 지금 배율 (1 = 100%) */
  k: { type: Number, required: true },
  /** 최대 배율 */
  max: { type: Number, default: 4 },
  /** 배율 숫자에 올리면 보이는 사용법 */
  hint: { type: String, default: '' }
})
// zoom: 곱할 배율 (지도 가운데 기준으로 확대·축소), reset: 원래 크기
const emit = defineEmits(['zoom', 'reset'])
</script>

<style scoped>
.mzt {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
}

.mzt button {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  font-size: 13px;
}

.mzt button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
}

.mzt button:disabled {
  opacity: 0.35;
}

.mzt button:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 1px;
}

.mzt-val {
  min-width: 42px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
</style>
