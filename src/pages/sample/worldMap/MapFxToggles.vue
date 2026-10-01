<template>
  <!--
    지도 왼쪽 위에 얹는 효과 켜기/끄기. 지도 스타일·레이아웃 탭이 같은 상태(worldMapDesign)를 쓴다.
      애니메이션 : 흐르는 빛·본사 펄스·지구본 회전
      거점·연결선 : 서울 본사·해외 거점 점과 서울에서 전 세계로 뻗는 연결선
    SVG·PNG 저장도 이 상태를 그대로 따른다
  -->
  <div class="mfx" @pointerdown.stop @dblclick.stop>
    <button
      type="button"
      :class="{ off: !worldMapDesign.playing }"
      :aria-pressed="worldMapDesign.playing"
      :title="worldMapDesign.playing ? '애니메이션 멈추기' : '애니메이션 켜기'"
      @click.stop="worldMapDesign.playing = !worldMapDesign.playing"
    >
      <i class="bi" :class="worldMapDesign.playing ? 'bi-pause-fill' : 'bi-play-fill'" aria-hidden="true"></i>
      애니메이션 {{ worldMapDesign.playing ? 'ON' : 'OFF' }}
    </button>
    <button
      type="button"
      :class="{ off: !worldMapDesign.showMarkers }"
      :aria-pressed="worldMapDesign.showMarkers"
      :title="worldMapDesign.showMarkers ? '거점·연결선 숨기기' : '거점·연결선 보이기'"
      @click.stop="worldMapDesign.showMarkers = !worldMapDesign.showMarkers"
    >
      <i class="bi bi-geo-alt" aria-hidden="true"></i>
      거점·연결선 {{ worldMapDesign.showMarkers ? 'ON' : 'OFF' }}
    </button>
  </div>
</template>

<script setup>
import { worldMapDesign } from './designSelection'
</script>

<style scoped>
.mfx {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 5;
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(6px);
}

.mfx button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 10px 0 8px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  transition: background 0.15s, color 0.15s;
}

.mfx button:hover {
  background: rgba(255, 255, 255, 0.24);
}

/* 꺼진 쪽은 바탕 없이 흐리게 */
.mfx button.off {
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
}

.mfx button:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 1px;
}
</style>
