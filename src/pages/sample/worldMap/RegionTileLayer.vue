<template>
  <!-- 지도(Canvas/SVG/ECharts) 위에 겹치는 HTML 층. 타일 모양은 tileRender 가 SVG 로 그려 버튼 안에 넣는다
       (SVG·PNG 저장 파일과 같은 디자인) -->
  <div ref="layer" class="rt-layer" :class="{ editing: editable }" :style="{ '--rt-inv': inv }">
    <button
      v-for="t in tiles"
      :key="t.cd"
      type="button"
      class="rt-tile"
      :class="{ on: openCd === t.cd, dragging: drag && drag.cd === t.cd && drag.moved }"
      :style="t.boxStyle"
      :aria-expanded="openCd === t.cd"
      :aria-label="t.name"
      :title="editable ? '끌어서 위치를 옮기세요' : ''"
      @pointerdown="onDown($event, t)"
      @click.stop="onClick(t.cd)"
      v-html="t.svg"
    ></button>

    <!-- 타일 옆 드롭다운: 규제가 많은 주요 국가 → 누르면 규제 목록으로 -->
    <div
      v-if="openTile"
      class="rt-drop"
      :style="dropStyle"
      @click.stop
    >
      <div class="rt-drop-head">
        <span class="rt-drop-title">{{ openTile.name }}</span>
        <span class="rt-drop-sub">규제 {{ openTile.count }}건 · {{ openTile.countryTotal }}개국</span>
      </div>
      <button v-for="c in openTile.top" :key="c.code" type="button" class="rt-row" @click="goCountry(c.code)">
        <span class="rt-row-name">{{ c.name }}</span>
        <span class="rt-row-cnt">{{ c.count }}건</span>
        <i class="bi bi-chevron-right"></i>
      </button>
      <button type="button" class="rt-all" @click="goRegion(openTile)">
        {{ openTile.name }} 규제 전체 보기<i class="bi bi-arrow-right ms-1"></i>
      </button>
    </div>
  </div>
</template>

<script>
import * as engine from './mapEngine'
import { countryCodes } from '@/data/regulationMock'
import { useRegulationStore } from '@/stores/regulationStore'
import { tilePositions } from './regionTiles'
import { layoutTile, tileStandaloneSvg } from './tileRender'

const TOP_N = 6

export default {
  name: 'RegionTileLayer',
  props: {
    // 투영법·가운데 키. 바뀌면 타일 위치를 다시 계산하게 하는 신호로만 쓴다
    view: { type: String, default: '' },
    // 위치 편집 모드: 타일을 끌어 옮긴다 (드롭다운은 열지 않는다)
    editable: { type: Boolean, default: false },
    // 옮긴 위치 { R_ASIA: [lon, lat] }. 부모가 들고 있고 'move' 이벤트로 갱신한다
    tileLL: { type: Object, default: () => ({}) },
    // 타일 디자인 키 (tileRender.TILE_STYLES)
    tileStyle: { type: String, default: 'weather' },
    // 지도 밝기. 어두운 지도면 글자가 안 보이지 않게 밝은 색 변형을 쓴다
    mapTone: { type: String, default: 'light' },
    // 지도가 확대된 배율의 역수. 이 층이 지도와 같이 확대될 때 타일·드롭다운은 원래 크기로 보이게 되돌린다
    inv: { type: Number, default: 1 }
  },
  emits: ['move'],
  data() {
    return {
      store: useRegulationStore(),
      openCd: null,
      // 끄는 중인 타일 { cd, x, y(%), moved }. 놓기 전까지는 화면에서만 따라다닌다
      drag: null
    }
  },
  computed: {
    // 국가별 규제 건수. 규제 하나가 여러 나라에 걸리면 나라마다 1건씩 센다
    countryCounts() {
      const counts = {}
      this.store.records.forEach((r) => {
        new Set((r.targets || []).filter((t) => t.targetType === 'COUNTRY').map((t) => t.targetCd))
          .forEach((cd) => (counts[cd] = (counts[cd] || 0) + 1))
      })
      return counts
    },
    tiles() {
      void this.view // 투영이 바뀌면 다시 계산
      return tilePositions(engine.flatProj, this.tileLL).map(({ cd, en, name, x: px, y: py }) => {
        const dragged = this.drag && this.drag.cd === cd && this.drag.moved ? this.drag : null
        const countries = countryCodes.filter((c) => c.parentCd === cd)
        const codes = new Set(countries.map((c) => c.code))
        // 권역 건수는 "그 권역 나라에 하나라도 걸린 규제" 수 (나라별 합계가 아니라 중복 없이)
        const count = this.store.records.filter((r) =>
          (r.targets || []).some((t) => (t.targetType === 'COUNTRY' && codes.has(t.targetCd)) || (t.targetType === 'REGION' && t.targetCd === cd))
        ).length
        const withCount = countries
          .map((c) => ({ code: c.code, name: c.name, count: this.countryCounts[c.code] || 0 }))
          .filter((c) => c.count > 0)
          .sort((a, b) => b.count - a.count)
        const x = dragged ? dragged.x : (px / engine.W) * 100
        const y = dragged ? dragged.y : (py / engine.H) * 100
        // 타일 그림(여백 m 포함)을 상자 가운데가 (x, y) 에 오도록 놓는다. 크기는 지도 너비 비율이라 화면 크기를 따라간다
        const L = layoutTile(this.tileStyle, { cd, en, name }, this.mapTone)
        const { svg, vw, m } = tileStandaloneSvg(L, `rt-${cd}-`)
        const left = (((x / 100) * engine.W - L.w / 2 - m) / engine.W) * 100
        const top = (((y / 100) * engine.H - L.h / 2 - m) / engine.H) * 100
        return {
          cd,
          en,
          name,
          x,
          y,
          svg,
          halfW: (L.w / 2 / engine.W) * 100,
          boxStyle: { left: `${left}%`, top: `${top}%`, width: `${(vw / engine.W) * 100}%` },
          count,
          countryTotal: withCount.length,
          allCodes: withCount.map((c) => c.code),
          top: withCount.slice(0, TOP_N)
        }
      })
    },
    openTile() {
      return this.tiles.find((t) => t.cd === this.openCd) || null
    },
    // 기본은 타일 오른쪽 아래로 펼친다. 지도 오른편이면 왼쪽, 아래쪽이면 위로 (지도 칸 밖으로 잘리지 않게)
    dropStyle() {
      const t = this.openTile
      const right = t.x <= 62
      const dy = t.y > 50 ? 'calc(-100% + 24px)' : '-24px'
      // 타일은 inv 배로 줄어 보이므로 타일 끝 위치도 그만큼
      const half = t.halfW * this.inv
      return right
        ? { left: `calc(${t.x + half}% + ${10 * this.inv}px)`, top: `${t.y}%`, transform: `translate(0, ${dy})` }
        : { left: `calc(${t.x - half}% - ${10 * this.inv}px)`, top: `${t.y}%`, transform: `translate(-100%, ${dy})` }
    }
  },
  created() {
    this.store.ensureLoaded()
  },
  mounted() {
    document.addEventListener('click', this.close)
    document.addEventListener('keydown', this.onKey)
  },
  beforeUnmount() {
    this.onUp()
    document.removeEventListener('click', this.close)
    document.removeEventListener('keydown', this.onKey)
  },
  watch: {
    editable(on) {
      if (on) this.close()
    }
  },
  methods: {
    onClick(cd) {
      // 편집 모드이거나 방금 끌어 옮긴 직후의 click 은 드롭다운을 열지 않는다
      if (this.editable || this.justDragged) {
        this.justDragged = false
        return
      }
      this.openCd = this.openCd === cd ? null : cd
    },
    /* ---- 위치 편집: 포인터 드래그 (HTML5 DnD 는 쓰지 않는다) ---- */
    onDown(e, t) {
      if (!this.editable || e.button !== 0) return
      e.preventDefault()
      const box = this.$refs.layer.getBoundingClientRect()
      this.drag = {
        cd: t.cd,
        box,
        // 누른 지점과 타일 중심의 차이. 끌 때 타일이 손가락 밑으로 튀지 않게 유지한다
        offX: e.clientX - (box.left + (t.x / 100) * box.width),
        offY: e.clientY - (box.top + (t.y / 100) * box.height),
        startX: e.clientX,
        startY: e.clientY,
        x: t.x,
        y: t.y,
        moved: false
      }
      window.addEventListener('pointermove', this.onMove)
      window.addEventListener('pointerup', this.onUp)
      window.addEventListener('pointercancel', this.onUp)
    },
    onMove(e) {
      const d = this.drag
      if (!d) return
      if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 3) return
      const clamp = (v) => Math.min(97, Math.max(3, v))
      this.drag = {
        ...d,
        moved: true,
        x: clamp(((e.clientX - d.offX - d.box.left) / d.box.width) * 100),
        y: clamp(((e.clientY - d.offY - d.box.top) / d.box.height) * 100)
      }
    },
    onUp() {
      window.removeEventListener('pointermove', this.onMove)
      window.removeEventListener('pointerup', this.onUp)
      window.removeEventListener('pointercancel', this.onUp)
      const d = this.drag
      this.drag = null
      if (!d || !d.moved) return
      this.justDragged = true
      // 놓은 지점을 경위도로 바꿔 기억한다. 지도 밖(투영 범위 바깥)이면 되돌린다
      const px = [(d.x / 100) * engine.W, (d.y / 100) * engine.H]
      const ll = engine.flatProj.invert(px)
      if (!ll || !ll.every(Number.isFinite) || Math.abs(ll[1]) > 89) return
      const lon = ((((ll[0] + 180) % 360) + 360) % 360) - 180
      // 지도 테두리 바깥에서 놓으면 역변환 값이 반대편으로 넘어간다. 다시 투영해 제자리인지 확인
      const back = engine.flatProj([lon, ll[1]])
      if (!back || Math.hypot(back[0] - px[0], back[1] - px[1]) > 2) return
      this.$emit('move', d.cd, [Math.round(lon * 100) / 100, Math.round(ll[1] * 100) / 100])
    },
    close() {
      this.openCd = null
    },
    onKey(e) {
      if (e.key === 'Escape') this.close()
    },
    // 규제 목록은 ?country=KR,JP 를 읽어 국가 필터를 걸고 연다
    goCountry(code) {
      this.$router.push({ name: 'RegulationInfo', query: { country: code } })
    },
    goRegion(tile) {
      this.$router.push({ name: 'RegulationInfo', query: { country: tile.allCodes.join(',') } })
    }
  }
}
</script>

<style scoped>
.rt-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none; /* 지도 호버는 그대로 통과시키고 타일·드롭다운만 받는다 */
}

/* 타일 버튼: 모양은 안에 든 SVG 가 그린다. 버튼은 위치·호버·포커스만 */
.rt-tile {
  position: absolute;
  pointer-events: auto;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  /* 지도가 확대돼도 타일은 원래 크기로 (scale 속성은 hover 의 transform 과 따로 적용된다) */
  scale: var(--rt-inv, 1);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.rt-tile:hover,
.rt-tile.on {
  transform: translateY(-3px);
  filter: brightness(1.04) drop-shadow(0 4px 6px rgba(4, 16, 36, 0.18));
}

.rt-tile:focus-visible {
  outline: 2px solid var(--b2b-color-primary, #0d6efd);
  outline-offset: -12px;
}

/* 위치 편집 모드: 잡을 수 있다는 표시 (그림자 여백만큼 안쪽에 점선) */
.rt-layer.editing .rt-tile {
  cursor: grab;
  touch-action: none;
  outline: 1.5px dashed rgba(245, 197, 24, 0.95);
  outline-offset: -14px;
}

.rt-tile.dragging {
  cursor: grabbing;
  transition: none;
  transform: translateY(-3px) scale(1.06);
  z-index: 4;
}

/* 드롭다운: 기본은 타일 오른쪽, 지도 오른편 타일이면 왼쪽으로 */
.rt-drop {
  position: absolute;
  pointer-events: auto;
  scale: var(--rt-inv, 1);
  transform-origin: 0 0;
  z-index: 3;
  width: 210px;
  background: var(--b2b-color-bg-card, #fff);
  color: var(--b2b-color-text-main, #212529);
  border: 1px solid var(--b2b-color-border, #dee2e6);
  border-radius: 10px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
  overflow: hidden;
  animation: rt-in 0.14s ease-out;
}

@keyframes rt-in {
  from {
    opacity: 0;
    margin-top: -4px;
  }
}

.rt-drop-head {
  padding: 10px 12px 8px;
  border-bottom: 1px solid var(--b2b-color-border, #dee2e6);
  display: flex;
  flex-direction: column;
}

.rt-drop-title {
  font-size: 13px;
  font-weight: 700;
}

.rt-drop-sub {
  font-size: 11px;
  color: var(--b2b-color-text-muted, #6c757d);
}

.rt-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: inherit;
  text-align: left;
}

.rt-row:hover {
  background: var(--b2b-color-hover-bg, #f1f3f5);
}

.rt-row-name {
  flex: 1;
}

.rt-row-cnt {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(var(--b2b-color-primary-rgb, 13, 110, 253), 0.1);
  color: var(--b2b-color-primary, #0d6efd);
  font-variant-numeric: tabular-nums;
}

.rt-row .bi {
  font-size: 11px;
  color: var(--b2b-color-text-muted, #6c757d);
}

.rt-all {
  width: 100%;
  border: none;
  border-top: 1px solid var(--b2b-color-border, #dee2e6);
  background: transparent;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--b2b-color-primary, #0d6efd);
  text-align: left;
}

.rt-all:hover {
  background: var(--b2b-color-hover-bg, #f1f3f5);
}
</style>
