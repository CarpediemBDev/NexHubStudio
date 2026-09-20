<template>
  <div
    v-if="state.visible"
    ref="tip"
    class="app-tooltip"
    :class="[state.className, { 'is-pinned': state.pinned }]"
    :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
    role="tooltip"
    @pointerdown="onPointerDown"
    @mouseenter="setTooltipHovered(true)"
    @mouseleave="setTooltipHovered(false)"
  >
    <!-- 텍스트 보간이라 HTML 이 해석되지 않는다(셀 값에 태그가 있어도 글자로 보임) -->
    <div class="app-tooltip-text">{{ state.text }}</div>
    <button
      v-if="state.pinned"
      type="button"
      class="app-tooltip-btn"
      title="닫기 (Esc)"
      @click.stop="closeTooltip()"
    >
      <i class="bi bi-x-lg"></i>
    </button>
    <span v-else class="app-tooltip-btn is-hint" title="클릭하면 고정"><i class="bi bi-pin-angle"></i></span>
  </div>
</template>

<script>
import { tooltipState, closeTooltip, pinTooltip, setTooltipHovered } from './tooltip'

// 화면 가장자리와 기준 영역에서 띄우는 간격
const EDGE = 8
const GAP = 4

/**
 * 공통 툴팁 표시부. App.vue 에 한 번만 둔다.
 * 열고 닫는 건 ./tooltip.js 의 showTooltip / hideTooltip / closeTooltip (또는 v-tooltip) 으로 한다.
 */
export default {
  name: 'AppTooltip',
  data() {
    return {
      state: tooltipState,
      pos: { x: 0, y: 0 }
    }
  },
  watch: {
    // 내용·기준 위치가 바뀌면 크기를 다시 재서 화면 안으로 자리 잡는다
    'state.text': { handler: 'place', flush: 'post' },
    'state.left': { handler: 'place', flush: 'post' },
    'state.bottom': { handler: 'place', flush: 'post' },
    'state.visible': { handler: 'onVisible', flush: 'post' },
    $route() {
      closeTooltip()
    }
  },
  beforeUnmount() {
    this.unbindGlobal()
  },
  methods: {
    closeTooltip,
    setTooltipHovered,

    place() {
      const tip = this.$refs.tip
      if (!tip) return
      const { left, top, bottom } = this.state
      const { offsetWidth: w, offsetHeight: h } = tip
      const vw = window.innerWidth
      const vh = window.innerHeight

      const x = Math.max(EDGE, Math.min(left, vw - w - EDGE))
      // 아래에 자리가 없으면 위로, 위에도 없으면 공간이 넓은 쪽에 붙인다(내용은 max-height 로 스크롤)
      let y = bottom + GAP
      if (y + h > vh - EDGE) {
        const above = top - GAP - h
        y = above >= EDGE ? above : (vh - bottom > top ? vh - EDGE - h : EDGE)
      }
      this.pos = { x, y: Math.max(EDGE, y) }
    },

    onVisible(visible) {
      if (visible) {
        this.place()
        this.bindGlobal()
      } else {
        this.unbindGlobal()
      }
    },

    // 툴팁을 누르면 고정. pointerdown 에서 고정해야 이어서 드래그로 글자를 선택할 수 있다.
    onPointerDown(e) {
      if (!this.state.pinned && !e.target.closest('.app-tooltip-btn:not(.is-hint)')) pinTooltip()
    },

    bindGlobal() {
      if (this._unbind) return
      // 바깥을 누르면 닫힘(고정 여부 무관). 캡처 단계라 그리드 등이 이벤트를 막아도 받는다.
      const onDown = (e) => {
        if (this.$refs.tip && !this.$refs.tip.contains(e.target)) closeTooltip()
      }
      const onKey = (e) => {
        if (e.key === 'Escape') closeTooltip()
      }
      // 고정 전 툴팁은 페이지가 스크롤되면 기준 위치와 어긋나므로 닫는다. 툴팁 안 스크롤은 제외.
      const onScroll = (e) => {
        if (this.state.pinned) return
        if (this.$refs.tip && e.target instanceof Node && this.$refs.tip.contains(e.target)) return
        closeTooltip()
      }
      document.addEventListener('pointerdown', onDown, true)
      document.addEventListener('keydown', onKey, true)
      window.addEventListener('scroll', onScroll, true)
      window.addEventListener('resize', closeTooltip)
      this._unbind = () => {
        document.removeEventListener('pointerdown', onDown, true)
        document.removeEventListener('keydown', onKey, true)
        window.removeEventListener('scroll', onScroll, true)
        window.removeEventListener('resize', closeTooltip)
        this._unbind = null
      }
    },

    unbindGlobal() {
      if (this._unbind) this._unbind()
    }
  }
}
</script>

<style>
/*
 * 검은 계열 한 가지로 라이트/다크 모두 쓴다.
 * 다크 화면(slate-900/800)에서도 묻히지 않게 배경을 그보다 한 단계 짙게 두고 옅은 흰 테두리로 윤곽을 준다.
 */
.app-tooltip {
  --tt-bg: rgba(15, 18, 26, 0.94);
  --tt-text: #f1f5f9;
  --tt-border: rgba(255, 255, 255, 0.14);
  --tt-accent: #60a5fa;

  position: fixed;
  z-index: 2100; /* 모달(1055)·토스트(2000) 위 */
  max-width: min(420px, calc(100vw - 16px));
  max-height: min(320px, calc(100vh - 16px));
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 7px 8px 7px 11px;
  border: 1px solid var(--tt-border);
  border-radius: 8px;
  background: var(--tt-bg);
  color: var(--tt-text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.3);
  font-size: 12.5px;
  line-height: 1.55;
  text-align: left;
  cursor: pointer;
  user-select: none;
  animation: app-tooltip-in 0.12s ease-out;
}

.app-tooltip-text {
  flex: 1 1 auto;
  min-width: 0;
  max-height: calc(min(320px, 100vh - 16px) - 16px);
  overflow-y: auto;
  white-space: pre-wrap; /* \n 줄바꿈 유지 + 폭을 넘으면 개행 */
  overflow-wrap: anywhere; /* 공백 없는 긴 문자열(URL 등)도 끊어서 개행 */
  word-break: keep-all; /* 한글은 어절 단위로 */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.app-tooltip-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
}
.app-tooltip-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}
/* 고정 전: 핀 아이콘은 툴팁에 마우스를 올렸을 때만 보인다 */
.app-tooltip-btn.is-hint {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;
}
.app-tooltip:hover .app-tooltip-btn.is-hint {
  opacity: 1;
}

.app-tooltip.is-pinned {
  border-color: var(--tt-accent);
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.35), 0 10px 28px rgba(0, 0, 0, 0.4);
  cursor: auto;
  user-select: text;
}

@keyframes app-tooltip-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: none; }
}
</style>
