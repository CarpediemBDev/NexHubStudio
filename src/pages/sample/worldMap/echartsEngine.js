/**
 * 세계지도 ECharts 렌더러. Canvas·SVG 엔진과 같은 데이터·디자인 설정으로 ECharts 옵션을 만든다.
 *
 * ECharts 로 옮기면서 쓰는 기본 기능
 *   - geo 컴포넌트 + 사용자 정의 투영: d3 투영(flatProj)을 그대로 넘겨 투영법·태평양 중심이 다른 렌더러와 같다
 *   - lines 시리즈 effect   : 서울발 연결선 위를 흐르는 빛
 *   - effectScatter 시리즈  : 본사 펄스(물결)
 *   - scatter 시리즈        : 도트·헥사곤 같은 격자형 디자인의 점, 히트맵 번짐, 도시 라벨
 *   - geo click / tooltip   : 나라 클릭 → 규제 화면, 툴팁
 *
 * 지구본 디자인은 echarts-gl(WebGL)로 그린다. 무거워서(약 600KB) 지구본을 처음 고를 때만 불러온다.
 *   - globe 컴포넌트: 우리 엔진이 그린 등장방형 텍스처를 구에 입힌다 + 조명·대기광·자동 회전
 *   - lines3D 시리즈 : 구 표면 위로 떠오르는 서울발 연결선 + 흐르는 빛
 *   - scatter3D 시리즈: 본사·거점 핀, 그리고 규제 대상 나라마다 클릭용 점
 *     (텍스처는 그림이라 나라를 알 수 없어서, 나라 중심에 점을 두고 그 점을 누르면 규제 화면으로 간다)
 *
 * ECharts 로 안 되는 것: 국경선 빛 번짐(outlineGlow), 엠보스 그림자 일부.
 */
import * as echarts from 'echarts/core'
import { MapChart, LinesChart, ScatterChart, EffectScatterChart } from 'echarts/charts'
import { GeoComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { geoInterpolate, geoDistance, geoCentroid } from 'd3-geo'
import * as engine from './mapEngine'
import { regCountryOf } from './countryLink'

// 필요한 부분만 등록해 번들을 줄인다 (echarts 전체 import 대비 절반 이하)
echarts.use([MapChart, LinesChart, ScatterChart, EffectScatterChart, GeoComponent, TooltipComponent, CanvasRenderer])

const MAP_NAME = 'nexhub-world'
let registered = false

// 지도 등록: 나라 이름 자리에 지도 코드(cid)를 넣어 클릭·색칠을 코드로 한다 (이름이 같은 나라가 없게)
function ensureMap() {
  if (registered) return
  echarts.registerMap(MAP_NAME, {
    type: 'FeatureCollection',
    features: engine.features.map((f) => ({
      type: 'Feature',
      properties: { name: f.cid, enName: f.properties.name },
      geometry: f.geometry
    }))
  })
  registered = true
}

export const isGlobeStyle = (s) => s.kind === 'globe' || s.kind === 'dotglobe'

/* ---------------- 3D 지구본 (echarts-gl) ---------------- */
let glReady = null
function ensureGL() {
  glReady ||= Promise.all([import('echarts-gl/components'), import('echarts-gl/charts')]).then(([c, ch]) => {
    echarts.use([c.GlobeComponent, ch.Lines3DChart, ch.Scatter3DChart])
  })
  return glReady
}

// 디자인마다 텍스처를 한 번만 그린다 (2048x1024 캔버스라 매번 그리면 아깝다)
const textureCache = new Map()
// echarts-gl 은 캔버스 요소를 텍스처로 줄 때 첫 장면에 비어 있는 경우가 있어 이미지 주소(dataURL)로 넘긴다
function textureOf(s) {
  if (!textureCache.has(s.key)) textureCache.set(s.key, engine.drawEquirectTexture(s, 2048).toDataURL('image/png'))
  return textureCache.get(s.key)
}

/** 지구본 칸 배경. echarts-gl 층은 그라데이션 배경을 못 그려서 칸(div)의 CSS 배경으로 깐다 */
export function cssBackground(s) {
  if (!Array.isArray(s.bg)) return s.bg
  const stops = s.bg.join(', ')
  return s.bgRadial ? `radial-gradient(ellipse at 50% 46%, ${stops})` : `linear-gradient(135deg, ${stops})`
}

// 규제 대상 나라의 중심점. 지구본에서 나라를 누르는 자리
let countryPins = null
function getCountryPins() {
  countryPins ||= engine.features
    .map((f) => ({ f, reg: regCountryOf(f.cid) }))
    .filter((x) => x.reg)
    .map(({ f, reg }) => ({ name: reg.name, cid: f.cid, value: [...geoCentroid(f), 0] }))
  return countryPins
}

/** 지구본 연결선: 대권 위 점들 + 가운데가 거리에 비례해 살짝 떠오르는 높이(지구 반지름 GLOBE_R=100 기준) */
function arcOnGlobe(a, b) {
  const d = geoDistance(a, b)
  const n = Math.max(12, Math.round(d * 30))
  const it = geoInterpolate(a, b)
  const peak = 4 + (d / Math.PI) * 18
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const [lon, lat] = it(t)
    return [lon, lat, Math.sin(Math.PI * t) * peak]
  })
}

const GLOBE_R = 100

function globeOption(s, { playing }) {
  const dark = s.tone === 'dark'
  const HQ = engine.HQ
  // echarts-gl 은 높이 값을 높이 축(0~1)으로 받아 (바깥 반지름 - 반지름) 길이로 늘려 그린다.
  // 그래서 높이는 최대값 대비 비율(0~1)로 넘기고, 바깥 반지름을 반지름 + 실제 최대 높이로 둔다
  const raw = engine.ROUTES.map((m) => arcOnGlobe(HQ.ll, m.ll))
  const maxAlt = Math.max(...raw.flat().map((p) => p[2]))
  const arcs = raw.map((pts) => pts.map(([lon, lat, alt]) => [lon, lat, alt / maxAlt]))
  return {
    backgroundColor: 'transparent',
    tooltip: {
      show: true,
      padding: [3, 8],
      backgroundColor: 'rgba(15,23,42,.85)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (p) => (p.data && p.data.cid ? `${p.data.name} · 규제 보기` : '')
    },
    globe: {
      baseTexture: textureOf(s),
      shading: 'lambert',
      environment: 'none',
      globeRadius: GLOBE_R,
      globeOuterRadius: GLOBE_R + maxAlt,
      // 밝은 디자인은 조명 음영이 색을 회색으로 덮으므로 주광을 약하게, 주변광을 세게
      light: {
        main: { intensity: dark ? 1.4 : 0.35, alpha: 30, beta: -40 },
        ambient: { intensity: dark ? 0.35 : 0.95 }
      },
      atmosphere: s.atmosphere
        ? { show: true, color: s.atmosphere.replace(/,[\d.]+\)$/, ',1)'), glowPower: dark ? 5 : 14, innerGlowPower: dark ? 2 : 5, offset: dark ? 6 : 3 }
        : { show: false },
      postEffect: dark && s.glow ? { enable: true, bloom: { enable: true, intensity: 0.12 } } : { enable: false },
      temporalSuperSampling: { enable: true },
      viewControl: {
        autoRotate: playing,
        autoRotateSpeed: (s.spin ?? 6) * 1.5,
        autoRotateAfterStill: 2,
        targetCoord: [127, 25],
        distance: 175,
        minDistance: 130,
        maxDistance: 400
      }
    },
    series: [
      {
        type: 'lines3D',
        coordinateSystem: 'globe',
        blendMode: dark ? 'lighter' : 'source-over',
        lineStyle: { width: 1, color: s.arc, opacity: 0.35 },
        effect: { show: true, period: 3, trailWidth: 2.5, trailLength: 0.18, trailOpacity: 1, trailColor: s.arc },
        // 기본 곡선은 먼 거리일수록 지구본 밖으로 크게 솟아서, 대권을 따라 점을 찍고 높이를 직접 준다
        polyline: true,
        // 거점·연결선을 끈 디자인(fx: false)이면 선을 그리지 않는다
        data: s.fx !== false && s.arc ? arcs.map((coords) => ({ coords })) : [],
        silent: true
      },
      {
        // 나라 클릭용 점: 평소엔 은은하게, 올리면 크게
        type: 'scatter3D',
        coordinateSystem: 'globe',
        symbolSize: 5,
        itemStyle: { color: s.mk, opacity: 0.55, borderWidth: 0 },
        emphasis: { itemStyle: { color: s.hq, opacity: 1 } },
        data: getCountryPins()
      },
      {
        type: 'scatter3D',
        coordinateSystem: 'globe',
        silent: true,
        symbolSize: 7,
        itemStyle: { color: s.pin || s.arc, opacity: 1 },
        // 거점·연결선을 끈 디자인(fx: false)이면 거점 점도 뺀다
        data: s.fx !== false ? engine.ROUTES.map((m) => [...m.ll, 0]) : []
      },
      {
        type: 'scatter3D',
        coordinateSystem: 'globe',
        silent: true,
        symbolSize: 13,
        itemStyle: { color: s.hqPulse || s.hq, opacity: 1 },
        label: { show: true, formatter: HQ.city, position: 'right', textStyle: { color: dark ? '#fff' : s.hq, fontSize: 12, fontWeight: 700, backgroundColor: 'transparent' } },
        data: s.fx !== false ? [[...HQ.ll, 0]] : []
      }
    ]
  }
}

/* ---------------- 색 ---------------- */
function bgColor(s) {
  if (!Array.isArray(s.bg)) return s.bg
  const colorStops = s.bg.map((c, i) => ({ offset: i / (s.bg.length - 1), color: c }))
  return s.bgRadial
    ? { type: 'radial', x: 0.5, y: 0.46, r: 0.7, colorStops }
    : { type: 'linear', x: 0, y: 0, x2: 1, y2: 1, colorStops }
}

function landColor(s, f) {
  if (s.landGradient && f.cid !== '410') {
    const stops = engine.isAccent(f) ? s.mkGradient : s.landGradient
    return { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: stops.map((c, i) => ({ offset: i / (stops.length - 1), color: c })) }
  }
  // 오로라는 경도 따라 색이 바뀌는 그라데이션이라 면 지도에서는 대표색으로
  if (s.palette === 'aurora') return engine.toneOf(s, f, engine.W / 2)
  return engine.toneOf(s, f, 0)
}

/* ---------------- 격자형 점 ---------------- */
const HEX_PATH = 'path://M0,-1L0.866,-0.5L0.866,0.5L0,1L-0.866,0.5L-0.866,-0.5Z'
const PLUS_PATH = 'path://M-1,-0.32H1V0.32H-1Z M-0.32,-1H0.32V1H-0.32Z'
const SYMBOL = { dot: 'circle', halftone: 'circle', square: 'rect', diamond: 'diamond', hex: HEX_PATH, plus: PLUS_PATH, scan: 'rect' }

// 960x480 격자점 → 경위도. 투영이 바뀌면 다시 계산해야 하므로 투영 키별로 캐시
const llCache = new Map()
function samplePoints(s) {
  const shape = s.kind === 'halftone' ? 'dot' : s.kind === 'scan' ? 'square' : s.kind
  const step = s.kind === 'scan' ? s.step * 1.4 : s.step
  const key = `${engine.flatView.proj}|${engine.flatView.center}|${shape}|${step}`
  if (llCache.has(key)) return llCache.get(key)
  const pts = engine
    .gridSamples(shape, step)
    .map((p) => ({ ...p, ll: engine.flatProj.invert([p.x, p.y]) }))
    .filter((p) => p.ll && p.ll.every(Number.isFinite))
  llCache.set(key, pts)
  return pts
}

/** 점 시리즈: 색이 같은 점끼리 한 시리즈로 묶는다 (시리즈 수를 줄여야 빠르다) */
function gridSeries(s, k) {
  const hp = engine.flatProj(engine.HQ.ll)
  const groups = new Map()
  samplePoints(s).forEach((p) => {
    const accent = engine.isAccent(p.f)
    const color = engine.toneOf(s, p.f, p.x)
    let r = accent ? s.rMk ?? s.r : s.r ?? 2
    if (s.kind === 'halftone' && !accent) r = Math.max(0.5, s.r * (1 - Math.hypot(p.x - hp[0], (p.y - hp[1]) * 1.6) / 760))
    if (s.kind === 'scan') r = (s.lw || 2) * 0.9
    const gk = `${color}|${accent}`
    if (!groups.has(gk)) groups.set(gk, { color, accent, data: [] })
    groups.get(gk).data.push([p.ll[0], p.ll[1], r])
  })
  return [...groups.values()].map((g) => ({
    type: 'scatter',
    coordinateSystem: 'geo',
    silent: true,
    symbol: SYMBOL[s.kind] || 'circle',
    symbolSize: (v) => Math.max(1, v[2] * 2 * k),
    itemStyle: {
      color: g.color,
      ...(g.accent && s.glow ? { shadowBlur: s.glow, shadowColor: g.color } : {})
    },
    data: g.data,
    z: 2
  }))
}

/* ---------------- 효과 ---------------- */
/**
 * 연결선은 대권(지구 위 최단 경로)을 따라 휘게 점을 찍어 polyline 으로 넘긴다.
 * lines 시리즈는 지도 테두리(태평양 중심이면 대서양 한가운데)를 넘는 선을 자르지 않고
 * 화면 반대편까지 직선으로 잇는다. 투영 좌표가 지도 폭의 절반 넘게 튀는 곳에서 선을 나눈다.
 */
function greatCircleSegments(a, b) {
  const n = Math.max(8, Math.round(geoDistance(a, b) * 40))
  const it = geoInterpolate(a, b)
  const segs = [[]]
  let prev = null
  for (let i = 0; i <= n; i++) {
    const ll = it(i / n)
    const p = engine.flatProj(ll)
    if (prev && Math.abs(p[0] - prev[0]) > engine.W / 2) segs.push([])
    segs[segs.length - 1].push(ll)
    prev = p
  }
  return segs.filter((s) => s.length > 1)
}

function fxSeries(s, k) {
  if (s.fx === false) return []
  const series = []
  const HQ = engine.HQ
  if (s.arc) {
    series.push({
      type: 'lines',
      coordinateSystem: 'geo',
      polyline: true,
      silent: true,
      lineStyle: { color: s.arc, opacity: s.arcBase ?? 0.35, width: 1.1 * k },
      effect: {
        show: true,
        period: 3.1,
        trailLength: 0.25,
        symbol: 'circle',
        symbolSize: 2.6 * k,
        color: s.arc
      },
      data: engine.ROUTES.flatMap((m) => greatCircleSegments(HQ.ll, m.ll).map((coords) => ({ coords }))),
      z: 4
    })
  }
  if (s.heat) {
    series.push({
      type: 'scatter',
      coordinateSystem: 'geo',
      silent: true,
      // 빛이 겹치면 더 밝아지게 (나이트 라이트)
      ...(s.heatBlend === 'lighter' ? { blendMode: 'lighter' } : {}),
      symbolSize: (v) => v[2] * 2 * k,
      itemStyle: {
        color: { type: 'radial', x: 0.5, y: 0.5, r: 0.5, colorStops: s.heat.map((c, i) => ({ offset: i / (s.heat.length - 1), color: c })) }
      },
      data: Object.values(engine.MARKETS).map((m, i) => [m.ll[0], m.ll[1], m === HQ ? 70 : 34 + (i % 4) * 9]),
      z: 3
    })
  }
  const pin = s.pin || s.arc || s.hq
  series.push({
    type: 'scatter',
    coordinateSystem: 'geo',
    silent: true,
    symbolSize: 6.8 * k,
    itemStyle: { color: pin, borderColor: s.pinRing || 'rgba(255,255,255,.9)', borderWidth: 1.4 * k },
    label: s.labels
      ? {
          show: true,
          position: 'right',
          formatter: (p) => p.data.city,
          fontSize: 11 * k,
          fontWeight: 500,
          color: s.labelText || '#334155',
          backgroundColor: s.labelBg || 'rgba(255,255,255,.92)',
          borderColor: s.labelBorder || 'rgba(15,23,42,.12)',
          borderWidth: 0.8,
          borderRadius: 9 * k,
          padding: [3 * k, 7 * k]
        }
      : undefined,
    data: engine.ROUTES.map((m) => ({ value: m.ll, city: m.city })),
    z: 5
  })
  // 본사: ECharts 기본 물결 효과
  series.push({
    type: 'effectScatter',
    coordinateSystem: 'geo',
    silent: true,
    symbolSize: 11 * k,
    rippleEffect: { brushType: 'stroke', scale: 4.5, period: 1.8, number: 2 },
    itemStyle: {
      color: s.hqPulse || s.hq,
      borderColor: s.pinRing || 'rgba(255,255,255,.95)',
      borderWidth: 2 * k,
      ...(s.glow ? { shadowBlur: 14, shadowColor: s.hqPulse || s.hq } : {})
    },
    label: s.labels ? { show: true, position: 'right', formatter: HQ.city, fontSize: 11 * k, fontWeight: 700, color: s.hq } : undefined,
    data: [HQ.ll],
    z: 6
  })
  return series
}

/**
 * ECharts 옵션.
 * geo 를 960x480 칸 안에 Canvas·SVG 와 같은 여백(fitExtent [[14,14],[946,470]])으로 맞춰 두면
 * 권역 타일(HTML 층)이 flatProj 로 계산한 위치에 그대로 겹친다.
 * @param k 화면 너비 / 960. 점·선 굵기는 px 단위라 지도 크기에 맞춰 곱한다
 */
export function buildOption(s, k = 1) {
  ensureMap()
  const isGrid = !['fill', 'globe', 'dotglobe'].includes(s.kind)
  const proj = engine.flatProj
  // 지구본·격자형은 면 대신 다른 방식으로 그리므로 면 색을 정한다
  const regions = engine.features.map((f) => {
    const reg = regCountryOf(f.cid)
    return {
      name: f.cid,
      silent: !reg, // 규제 대상이 아닌 나라는 호버·클릭에 반응하지 않는다 (커서도 그대로)
      itemStyle: {
        areaColor: isGrid ? 'rgba(0,0,0,0)' : landColor(s, f),
        borderColor: isGrid ? 'rgba(0,0,0,0)' : s.mkStroke && engine.isAccent(f) ? s.mkStroke : s.stroke || 'rgba(0,0,0,0)',
        borderWidth: isGrid ? 0 : (s.lw || 0.6) * k
      }
    }
  })
  return {
    backgroundColor: bgColor(s),
    animation: false,
    tooltip: {
      trigger: 'item',
      confine: true,
      padding: [3, 8],
      backgroundColor: 'rgba(15,23,42,.85)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 }
    },
    geo: {
      map: MAP_NAME,
      roam: false,
      projection: {
        project: (pt) => proj(pt),
        unproject: (pt) => proj.invert(pt),
        // 태평양 중심처럼 회전한 투영은 날짜변경선에서 도형이 찢어지므로 d3 스트림으로 잘라 그린다
        stream: (out) => proj.stream(out)
      },
      left: `${(14 / 960) * 100}%`,
      right: `${(14 / 960) * 100}%`,
      top: `${(14 / 480) * 100}%`,
      bottom: `${(10 / 480) * 100}%`,
      label: { show: false },
      itemStyle: { areaColor: 'rgba(0,0,0,0)', borderWidth: 0 },
      emphasis: {
        label: { show: false },
        itemStyle: isGrid ? { areaColor: 'rgba(255,255,255,.12)' } : { areaColor: s.hq, opacity: 0.85 }
      },
      select: { disabled: true },
      // geo 툴팁은 최상위 tooltip.formatter 를 쓰지 않아 여기 따로 둔다. 이름 자리에 cid 를 넣었으니 한글로 바꿔 보여 준다
      tooltip: {
        show: true,
        formatter: (p) => {
          const reg = regCountryOf(p.name)
          return reg ? `${reg.name} · 규제 보기` : ''
        }
      },
      regions
    },
    series: [...(isGrid ? gridSeries(s, k) : []), ...fxSeries(s, k)]
  }
}

/** ECharts 무대: 만들고, 디자인·크기 바뀌면 옵션을 다시 넣고, 나라 클릭을 알린다 */
export function createEchartsStage(el, { onCountryClick } = {}) {
  let chart = null
  let chartHasGL = false
  let style = null
  let playing = true
  // ECharts 는 차트를 만드는 순간 등록된 레이아웃 목록을 복사해 쓴다.
  // echarts-gl 을 나중에 불러오면 이미 만든 차트에는 lines3D·scatter3D 레이아웃이 없어 그리지 못하므로
  // echarts-gl 을 불러온 뒤 처음 지구본을 그릴 때 차트를 새로 만든다
  const createChart = () => {
    if (chart) chart.dispose()
    chart = echarts.init(el, null, { renderer: 'canvas' })
    chartHasGL = !!glReady
    chart.on('click', (p) => {
      if (!onCountryClick) return
      if (p.componentType === 'geo') onCountryClick(p.name) // 평면: 나라 면
      else if (p.data && p.data.cid) onCountryClick(p.data.cid) // 지구본: 나라 중심 점
    })
    api.chart = chart
  }
  /** 옵션을 넣고 걸린 시간(ms)을 돌려준다. 지구본은 처음 한 번 echarts-gl 을 불러온다 */
  const render = async () => {
    if (!style) return 0
    const s = style
    if (isGlobeStyle(s)) {
      await ensureGL()
      if (!chartHasGL) createChart()
    }
    el.style.background = isGlobeStyle(s) ? cssBackground(s) : ''
    if (s !== style) return 0 // 불러오는 사이 다른 디자인을 골랐으면 버린다
    const t0 = performance.now()
    const option = isGlobeStyle(s) ? globeOption(s, { playing }) : buildOption(s, (el.clientWidth || engine.W) / engine.W)
    chart.setOption(option, { notMerge: true })
    return performance.now() - t0
  }
  const api = {
    chart: null,
    setStyle(s) {
      style = s
      return render()
    },
    /** 멈춤: 평면은 ECharts 애니메이션을, 지구본은 자동 회전을 멈춘다 */
    setPlaying(on) {
      playing = on
      const anim = chart.getZr().animation
      if (on) anim.resume()
      else anim.pause()
      if (style && isGlobeStyle(style) && glReady) chart.setOption({ globe: { viewControl: { autoRotate: on } } })
    },
    refresh: render,
    resize() {
      chart.resize()
      return render()
    },
    destroy() {
      chart.dispose()
    }
  }
  createChart()
  return api
}
