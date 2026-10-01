/**
 * 세계지도 캔버스 렌더러.
 *
 * 지도는 이미지가 아니라 world-atlas 의 국경 좌표(TopoJSON)를 d3-geo 로 투영해 캔버스에 직접 그린다.
 * 모든 좌표는 960 x 480 기준 좌표계로 계산하고, 실제 캔버스 크기에 맞춰 setTransform 으로 늘린다.
 *
 * 디자인(style)은 mapStyles.js 의 설정 객체 하나로 결정된다.
 *   kind: dot | hex | square | diamond | plus | scan | halftone  → 육지를 격자로 샘플링해 모양을 찍는다
 *         fill                                                   → 국가 면을 그대로 칠한다
 *         globe | dotglobe                                       → 정사영 지구본 (회전)
 *
 * 화면이 움직이는 부분(연결선 위를 흐르는 빛, 본사 펄스, 지구본 회전)은 drawFx/drawGlobe 가 시간 t 로 그린다.
 * 평면 지도는 육지 레이어를 오프스크린 캔버스에 한 번만 그려 두고 매 프레임 그 위에 효과만 얹는다.
 */
import {
  geoNaturalEarth1,
  geoEqualEarth,
  geoMercator,
  geoOrthographic,
  geoEquirectangular,
  geoPath,
  geoGraticule10,
  geoDistance,
  geoCentroid
} from 'd3-geo'
import { geoRobinson, geoWinkel3, geoMiller } from 'd3-geo-projection'
import { feature } from 'topojson-client'
import { regCountryOf } from './countryLink'
import world from 'world-atlas/countries-110m.json'

export const W = 960
export const H = 480

const HQ_ID = '410'

// 본사(서울)와 주요 거점. 키는 ISO 3166 숫자 코드(world-atlas 의 feature.id)
export const MARKETS = {
  410: { ll: [126.98, 37.57], city: '서울' },
  840: { ll: [-74.0, 40.71], city: '뉴욕' },
  276: { ll: [8.68, 50.11], city: '프랑크푸르트' },
  156: { ll: [121.47, 31.23], city: '상하이' },
  704: { ll: [105.85, 21.03], city: '하노이' },
  356: { ll: [77.21, 28.61], city: '뉴델리' },
  76: { ll: [-46.63, -23.55], city: '상파울루' },
  484: { ll: [-100.31, 25.69], city: '몬테레이' },
  826: { ll: [-0.13, 51.51], city: '런던' },
  784: { ll: [55.27, 25.2], city: '두바이' },
  36: { ll: [151.21, -33.87], city: '시드니' },
  392: { ll: [139.69, 35.69], city: '도쿄' }
}
export const HQ = MARKETS[HQ_ID]
export const ROUTES = Object.keys(MARKETS).filter((k) => k !== HQ_ID).map((k) => MARKETS[k])

// world-atlas 110m 에서 id 가 비어 있는 경우가 있어 이름으로 보정
const FIX = { France: '250', Norway: '578' }

// 국가 중심 좌표로 대략적인 권역을 나눈다 (파스텔 권역 디자인용 장식 구분, 업무 권역 코드와는 무관)
function regionOf([lon, lat]) {
  if (lon < -30) return lat > 13 ? 'NA' : 'LA'
  if (lon < 60 && lat > 36) return 'EU'
  if (lon >= 34 && lon < 63 && lat > 12) return 'ME'
  if (lon < 55 && lat <= 36) return 'AF'
  if (lon >= 110 && lat < -5) return 'OC'
  return 'AS'
}

export const features = feature(world, world.objects.countries)
  .features.filter((f) => f.properties.name !== 'Antarctica')
  .map((f) => {
    f.cid = String(Number(FIX[f.properties.name] || f.id || -1))
    f.region = regionOf(geoCentroid(f))
    return f
  })

/* ---------------- 평면 지도 투영 ----------------
 * 둥근 지구를 평면에 펴는 방식(투영법)과 가운데 둘 경도(중심)를 고를 수 있다.
 * flatProj 는 export let 이라 바꾸면 가져다 쓰는 모듈(svgEngine, 타일 층)도 새 값을 본다(ES 모듈 live binding).
 * 바꾸면 육지 판정 래스터와 격자 샘플을 다시 만들어야 하므로 반드시 setFlatView 로만 바꾼다. */
export const PROJECTIONS = [
  { key: 'naturalEarth', label: 'Natural Earth', make: geoNaturalEarth1, desc: '왜곡이 적고 보기 편한 인포그래픽 표준' },
  { key: 'robinson', label: '로빈슨', make: geoRobinson, desc: '교과서·벽걸이 세계지도의 오랜 표준' },
  { key: 'winkel3', label: '빙켈 트리펠', make: geoWinkel3, desc: '내셔널지오그래픽 공식 세계지도 (면적·모양·거리 균형)' },
  { key: 'equalEarth', label: 'Equal Earth', make: geoEqualEarth, desc: '나라 면적을 실제 비율대로. 최근 공공기관·NASA' },
  { key: 'miller', label: '밀러', make: geoMiller, desc: '직사각형. 메르카토르보다 극지방이 덜 늘어남' },
  { key: 'mercator', label: '메르카토르', make: geoMercator, desc: '구글·네이버 지도 방식. 위로 갈수록 크게 늘어남' }
]
export const CENTERS = [
  { key: 'pacific', label: '태평양 중심', lon: 150, desc: '한국이 가운데. 국내 교과서·기업 자료 방식' },
  { key: 'atlantic', label: '유럽 중심', lon: 0, desc: '경도 0도(런던)가 가운데. 서양 표준' }
]
const ALL_LAND = { type: 'FeatureCollection', features }

function makeFlat(projKey, centerKey) {
  const def = PROJECTIONS.find((p) => p.key === projKey) || PROJECTIONS[0]
  const center = CENTERS.find((c) => c.key === centerKey) || CENTERS[0]
  // 남극을 뺀 육지가 화면에 꽉 차게 맞춘다. 위아래 여백은 연결선·핀이 잘리지 않을 만큼
  return def
    .make()
    .rotate([-center.lon, 0])
    .fitExtent([[14, 14], [W - 14, H - 10]], ALL_LAND)
}

export let flatView = { proj: 'naturalEarth', center: 'pacific' }
export let flatProj = makeFlat(flatView.proj, flatView.center)

/** 투영법·중심을 바꾼다. 바뀌었으면 true */
export function setFlatView(proj, center) {
  if (proj === flatView.proj && center === flatView.center) return false
  flatView = { proj, center }
  flatProj = makeFlat(proj, center)
  flatHit = null
  Object.keys(sampleCache).forEach((k) => delete sampleCache[k])
  return true
}

/* ---------------- 색 유틸 ---------------- */
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export function alpha(hex, a) {
  const [r, g, b] = rgb(hex)
  return `rgba(${r},${g},${b},${a})`
}
function mix(stops, k) {
  const seg = Math.min(stops.length - 2, Math.floor(k * (stops.length - 1)))
  const lk = k * (stops.length - 1) - seg
  const a = rgb(stops[seg])
  const b = rgb(stops[seg + 1])
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * lk))
  return `#${((1 << 24) + (c[0] << 16) + (c[1] << 8) + c[2]).toString(16).slice(1)}`
}

/* ---------------- 히트 래스터 ----------------
 * 국가마다 고유 색(인덱스)을 칠한 오프스크린 캔버스. 격자점 하나가 어느 나라 위에 있는지 픽셀 하나로 판정한다.
 * geoContains 를 수천 번 부르는 것보다 훨씬 빠르다. 경계의 안티앨리어싱 픽셀(alpha<255)은 버린다. */
function buildHit(proj, w, h) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const path = geoPath(proj, ctx)
  features.forEach((f, i) => {
    const n = i + 1
    ctx.fillStyle = `rgb(${n >> 8},${n & 255},0)`
    ctx.beginPath()
    path(f)
    ctx.fill()
  })
  return { data: ctx.getImageData(0, 0, w, h).data, w, h }
}
function hitAt(hit, x, y) {
  const xi = x | 0
  const yi = y | 0
  if (xi < 0 || yi < 0 || xi >= hit.w || yi >= hit.h) return null
  const o = (yi * hit.w + xi) * 4
  if (hit.data[o + 3] !== 255) return null
  const i = (hit.data[o] << 8) + hit.data[o + 1]
  return i ? features[i - 1] : null
}

let flatHit = null
let eqHit = null
const getFlatHit = () => (flatHit ||= buildHit(flatProj, W, H))
// 지구본 도트용: 경위도 0.5도 간격 등장방형 래스터
const getEqHit = () =>
  (eqHit ||= buildHit(geoEquirectangular().scale(720 / (2 * Math.PI)).translate([360, 180]), 720, 360))

/**
 * 평면 지도에서 (x, y) 지점(960x480 기준)이 어느 나라 땅인지. 바다면 null.
 * Canvas 는 그림만 있어서 클릭한 나라를 이 래스터로 판정한다 (SVG 는 요소의 data-cid 로 바로 안다)
 */
export const countryAt = (x, y) => hitAt(getFlatHit(), x, y)

/* ---------------- 격자 샘플 ---------------- */
const sampleCache = {}
export function gridSamples(shape, step) {
  const key = `${shape}:${step}`
  if (sampleCache[key]) return sampleCache[key]
  const hit = getFlatHit()
  const out = []
  if (shape === 'hex') {
    const r = step * 0.6
    const dx = Math.sqrt(3) * r
    const dy = 1.5 * r
    for (let j = 0, y = r; y < H; j++, y += dy) {
      for (let x = (j % 2 ? dx / 2 : 0) + dx / 2; x < W; x += dx) {
        const f = hitAt(hit, x, y)
        if (f) out.push({ x, y, f })
      }
    }
  } else if (shape === 'scan') {
    // 가로줄: 행마다 같은 나라가 이어지는 구간을 선분 하나로 묶는다
    for (let y = step / 2; y < H; y += step) {
      let run = null
      for (let x = 0; x <= W; x += 1) {
        const f = x < W ? hitAt(hit, x, y) : null
        if (run && f === run.f) continue
        if (run) {
          run.x2 = x - 1
          if (run.x2 - run.x1 > 1) out.push(run)
        }
        run = f ? { x1: x, y, f } : null
      }
    }
  } else {
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        const f = hitAt(hit, x, y)
        if (f) out.push({ x, y, f })
      }
    }
  }
  sampleCache[key] = out
  return out
}

let globePts = null
export function getGlobePts() {
  if (globePts) return globePts
  const hit = getEqHit()
  globePts = []
  const step = 1.7
  for (let lat = -84; lat <= 84; lat += step) {
    const lstep = step / Math.max(0.15, Math.cos((lat * Math.PI) / 180))
    for (let lon = -180; lon < 180; lon += lstep) {
      const f = hitAt(hit, (lon + 180) * 2, (90 - lat) * 2)
      if (f) globePts.push({ ll: [lon, lat], f })
    }
  }
  return globePts
}

/* ---------------- 색 결정 ---------------- */
export function toneOf(s, f, x) {
  const hq = f.cid === HQ_ID
  const mk = !!MARKETS[f.cid]
  if (s.focusRegion) return hq ? s.hq : regCountryOf(f.cid)?.regionCd === s.focusRegion ? s.mk : s.land
  if (s.palette === 'region') return hq ? s.hq : s.regions[f.region]
  if (s.palette === 'aurora') {
    const c = mix(s.aurora, Math.max(0, Math.min(1, x / W)))
    return hq ? s.hq : mk ? c : alpha(c, s.landAlpha ?? 0.45)
  }
  return hq ? s.hq : mk ? s.mk : s.land
}
export const isAccent = (f) => !!MARKETS[f.cid]

/* ---------------- 배경 ---------------- */
function drawBg(ctx, s) {
  if (Array.isArray(s.bg)) {
    const g = s.bgRadial
      ? ctx.createRadialGradient(480, 220, 40, 480, 240, 620)
      : ctx.createLinearGradient(0, 0, W, H)
    s.bg.forEach((c, i) => g.addColorStop(i / (s.bg.length - 1), c))
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = s.bg
  }
  ctx.fillRect(0, 0, W, H)
  if (s.screenGrid) {
    ctx.strokeStyle = s.screenGrid
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 0; x <= W; x += 32) {
      ctx.moveTo(x + 0.5, 0)
      ctx.lineTo(x + 0.5, H)
    }
    for (let y = 0; y <= H; y += 32) {
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(W, y + 0.5)
    }
    ctx.stroke()
  }
}
function drawVignette(ctx, s) {
  if (!s.vignette) return
  const g = ctx.createRadialGradient(480, 240, 200, 480, 240, 600)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, s.vignette)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

/* ---------------- 격자형 육지 ---------------- */
function shapeInto(p, shape, x, y, r) {
  if (shape === 'square') p.rect(x - r, y - r, r * 2, r * 2)
  else if (shape === 'diamond') {
    p.moveTo(x, y - r)
    p.lineTo(x + r, y)
    p.lineTo(x, y + r)
    p.lineTo(x - r, y)
    p.closePath()
  } else if (shape === 'hex') {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30)
      const px = x + r * Math.cos(a)
      const py = y + r * Math.sin(a)
      i ? p.lineTo(px, py) : p.moveTo(px, py)
    }
    p.closePath()
  } else if (shape === 'plus') {
    const t = r * 0.32
    p.rect(x - r, y - t, r * 2, t * 2)
    p.rect(x - t, y - r, t * 2, r * 2)
  } else {
    p.moveTo(x + r, y)
    p.arc(x, y, r, 0, Math.PI * 2)
  }
}

function drawGridLand(ctx, s) {
  const shape = s.kind === 'halftone' ? 'dot' : s.kind
  const pts = gridSamples(shape, s.step)
  const groups = new Map()
  const add = (color, glow) => {
    const k = `${color}|${glow ? 1 : 0}`
    if (!groups.has(k)) groups.set(k, { color, glow, p: new Path2D() })
    return groups.get(k).p
  }
  if (shape === 'scan') {
    pts.forEach((sg) => {
      const p = add(toneOf(s, sg.f, sg.x1), isAccent(sg.f))
      p.moveTo(sg.x1, sg.y)
      p.lineTo(sg.x2, sg.y)
    })
    ctx.lineCap = 'round'
    ctx.lineWidth = s.lw || 2
    groups.forEach((g) => {
      ctx.save()
      if (g.glow && s.glow) {
        ctx.shadowColor = g.color
        ctx.shadowBlur = 8
      }
      ctx.strokeStyle = g.color
      ctx.stroke(g.p)
      ctx.restore()
    })
    return
  }
  const hx = HQ.ll
  const hp = flatProj(hx)
  pts.forEach(({ x, y, f }) => {
    let r = isAccent(f) ? s.rMk ?? s.r : s.r
    if (s.kind === 'halftone') {
      // 서울에서 멀어질수록 점이 작아지는 하프톤
      const d = Math.hypot(x - hp[0], (y - hp[1]) * 1.6)
      r = isAccent(f) ? s.rMk : Math.max(0.5, s.r * (1 - d / 760))
    }
    shapeInto(add(toneOf(s, f, x), isAccent(f)), shape, x, y, r)
  })
  groups.forEach((g) => {
    ctx.save()
    if (g.glow && s.glow) {
      ctx.shadowColor = g.color
      ctx.shadowBlur = s.glow
    }
    ctx.fillStyle = g.color
    ctx.fill(g.p)
    ctx.restore()
  })
}

/* ---------------- 면 지도 ---------------- */
function landFill(ctx, s, f) {
  if (s.landGradient) {
    const hq = f.cid === HQ_ID
    if (hq) return s.hq
    const stops = isAccent(f) ? s.mkGradient : s.landGradient
    const g = ctx.createLinearGradient(0, 0, W, 0)
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c))
    return g
  }
  return toneOf(s, f, 0)
}

function drawFillLand(ctx, s) {
  const path = geoPath(flatProj, ctx)
  if (s.graticule) {
    ctx.beginPath()
    path(geoGraticule10())
    ctx.strokeStyle = s.graticule
    ctx.lineWidth = 0.6
    ctx.stroke()
  }
  if (s.sphere) {
    ctx.beginPath()
    path({ type: 'Sphere' })
    ctx.strokeStyle = s.sphere
    ctx.lineWidth = 0.8
    ctx.stroke()
  }
  // 엠보스: 전체 육지를 그림자와 함께 한 번 먼저 깐다
  if (s.shadow) {
    ctx.save()
    ctx.shadowColor = s.shadow.color
    ctx.shadowBlur = s.shadow.blur
    ctx.shadowOffsetY = s.shadow.dy
    ctx.beginPath()
    features.forEach((f) => path(f))
    ctx.fillStyle = s.land
    ctx.fill()
    ctx.restore()
  }
  if (s.outlineGlow) {
    ctx.save()
    ctx.shadowColor = s.outlineGlow
    ctx.shadowBlur = 12
    ctx.beginPath()
    features.forEach((f) => path(f))
    ctx.strokeStyle = s.stroke
    ctx.lineWidth = (s.lw || 0.6) + 0.6
    ctx.stroke()
    ctx.restore()
  }
  ctx.lineJoin = 'round'
  features.forEach((f) => {
    ctx.beginPath()
    path(f)
    ctx.fillStyle = landFill(ctx, s, f)
    ctx.fill()
    if (s.stroke) {
      ctx.strokeStyle = s.mkStroke && isAccent(f) ? s.mkStroke : s.stroke
      ctx.lineWidth = s.lw || 0.6
      ctx.stroke()
    }
  })
  if (s.heat) {
    // 거점마다 방사형 그라데이션을 겹쳐 히트맵처럼 보이게
    ctx.save()
    ctx.globalCompositeOperation = s.heatBlend || 'source-over'
    Object.values(MARKETS).forEach((m, i) => {
      const [x, y] = flatProj(m.ll)
      const r = m === HQ ? 70 : 34 + (i % 4) * 9
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      s.heat.forEach((c, k) => g.addColorStop(k / (s.heat.length - 1), c))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()
  }
}

/** 시간과 무관한 평면 지도 레이어(배경 + 육지) */
export function drawStatic(ctx, s) {
  drawBg(ctx, s)
  if (s.kind === 'fill') drawFillLand(ctx, s)
  else drawGridLand(ctx, s)
  drawVignette(ctx, s)
}

/* ---------------- 지구본 ---------------- */
export const GR = 214
function drawGlobe(ctx, s, t) {
  drawBg(ctx, s)
  const rot = [-100 - t * (s.spin ?? 6), -20]
  const proj = geoOrthographic().scale(GR).translate([480, 240]).rotate(rot).clipAngle(90)
  const path = geoPath(proj, ctx)
  const center = [-rot[0], -rot[1]]

  if (s.atmosphere) {
    const g = ctx.createRadialGradient(480, 240, GR * 0.92, 480, 240, GR + 34)
    g.addColorStop(0, s.atmosphere)
    g.addColorStop(1, alpha('#000000', 0))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(480, 240, GR + 34, 0, Math.PI * 2)
    ctx.fill()
  }
  const og = ctx.createRadialGradient(410, 170, 20, 480, 240, GR)
  s.ocean.forEach((c, i) => og.addColorStop(i / (s.ocean.length - 1), c))
  ctx.fillStyle = og
  ctx.beginPath()
  ctx.arc(480, 240, GR, 0, Math.PI * 2)
  ctx.fill()

  if (s.graticule) {
    ctx.beginPath()
    path(geoGraticule10())
    ctx.strokeStyle = s.graticule
    ctx.lineWidth = 0.6
    ctx.stroke()
  }

  if (s.kind === 'dotglobe') {
    const groups = new Map()
    getGlobePts().forEach(({ ll, f }) => {
      if (geoDistance(ll, center) > 1.55) return
      const [x, y] = proj(ll)
      const c = toneOf(s, f, 0)
      if (!groups.has(c)) groups.set(c, { p: new Path2D(), glow: isAccent(f) })
      const p = groups.get(c).p
      const r = isAccent(f) ? s.rMk ?? s.r : s.r
      p.moveTo(x + r, y)
      p.arc(x, y, r, 0, Math.PI * 2)
    })
    groups.forEach((g, c) => {
      ctx.save()
      if (g.glow && s.glow) {
        ctx.shadowColor = c
        ctx.shadowBlur = s.glow
      }
      ctx.fillStyle = c
      ctx.fill(g.p)
      ctx.restore()
    })
  } else {
    features.forEach((f) => {
      ctx.beginPath()
      path(f)
      ctx.fillStyle = toneOf(s, f, 0)
      ctx.fill()
      if (s.stroke) {
        ctx.strokeStyle = s.stroke
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    })
  }

  // 입체감: 왼쪽 위는 밝게, 오른쪽 아래는 어둡게
  if (s.shade) {
    const g = ctx.createRadialGradient(400, 160, 10, 480, 240, GR)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.7, 'rgba(0,0,0,0)')
    g.addColorStop(1, s.shade)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(480, 240, GR, 0, Math.PI * 2)
    ctx.fill()
  }
  if (s.rim) {
    ctx.strokeStyle = s.rim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(480, 240, GR, 0, Math.PI * 2)
    ctx.stroke()
  }
  return { proj, center }
}

/**
 * 3D 지구본(echarts-gl)에 입힐 텍스처. 경위도를 그대로 펼친 등장방형(가로:세로 = 2:1) 그림이라
 * 구에 감으면 제자리에 붙는다. 바다·육지·도트 색은 지구본 디자인 설정을 그대로 쓴다.
 */
export function drawEquirectTexture(s, w = 2048) {
  const h = w / 2
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const ctx = cv.getContext('2d')
  // 바다는 그라데이션 끝색(가장자리 색)으로. 밝은 디자인은 첫 색이 거의 흰색이라 흰 육지와 구분이 안 된다
  ctx.fillStyle = (s.ocean && s.ocean[s.ocean.length - 1]) || '#0B1A33'
  ctx.fillRect(0, 0, w, h)
  const proj = geoEquirectangular().scale(w / (2 * Math.PI)).translate([w / 2, h / 2])
  const path = geoPath(proj, ctx)
  if (s.graticule) {
    ctx.beginPath()
    path(geoGraticule10())
    ctx.strokeStyle = s.graticule
    ctx.lineWidth = w / 1600
    ctx.stroke()
  }
  if (s.kind === 'dotglobe') {
    // 도트는 지구본용 격자점(위도마다 경도 간격을 넓힌 점)을 펼친 좌표에 찍는다
    const k = w / 1100
    const groups = new Map()
    getGlobePts().forEach(({ ll, f }) => {
      const c = toneOf(s, f, 0)
      if (!groups.has(c)) groups.set(c, new Path2D())
      const p = groups.get(c)
      const x = ((ll[0] + 180) / 360) * w
      const y = ((90 - ll[1]) / 180) * h
      const r = (isAccent(f) ? s.rMk ?? s.r : s.r) * k
      // 위도가 높을수록 구에 감을 때 가로로 눌리므로 미리 가로로 늘려 둔다
      const sx = 1 / Math.max(0.2, Math.cos((ll[1] * Math.PI) / 180))
      p.moveTo(x + r * sx, y)
      p.ellipse(x, y, r * sx, r, 0, 0, Math.PI * 2)
    })
    groups.forEach((p, c) => {
      ctx.fillStyle = c
      ctx.fill(p)
    })
  } else {
    features.forEach((f) => {
      ctx.beginPath()
      path(f)
      ctx.fillStyle = toneOf(s, f, 0)
      ctx.fill()
      if (s.stroke) {
        ctx.strokeStyle = s.stroke
        ctx.lineWidth = w / 2400
        ctx.stroke()
      }
    })
  }
  return cv
}

/* ---------------- 효과: 연결선, 거점, 본사 펄스, 라벨 ---------------- */
function drawFx(ctx, s, proj, t, center) {
  if (s.fx === false) return
  const path = geoPath(proj, ctx)
  const scale = proj.scale()
  const visible = (ll) => !center || geoDistance(ll, center) < 1.5
  ctx.save()
  ctx.lineCap = 'round'

  if (s.arc) {
    ROUTES.forEach((m, i) => {
      const line = { type: 'LineString', coordinates: [HQ.ll, m.ll] }
      ctx.beginPath()
      path(line)
      ctx.strokeStyle = alpha(s.arc, s.arcBase ?? 0.35)
      ctx.lineWidth = 1.1
      ctx.stroke()
      // 선을 따라 흐르는 빛 조각
      const len = geoDistance(HQ.ll, m.ll) * scale * 1.15 + 20
      const phase = (t * 0.32 + i * 0.137) % 1
      ctx.save()
      if (s.glow) {
        ctx.shadowColor = s.arc
        ctx.shadowBlur = 10
      }
      ctx.setLineDash([28, 4000])
      ctx.lineDashOffset = -phase * len
      ctx.beginPath()
      path(line)
      ctx.strokeStyle = s.arc
      ctx.lineWidth = 2.2
      ctx.stroke()
      ctx.restore()
    })
  }

  const pin = s.pin || s.arc || s.hq
  ROUTES.forEach((m) => {
    if (!visible(m.ll)) return
    const [x, y] = proj(m.ll)
    ctx.beginPath()
    ctx.arc(x, y, 3.4, 0, Math.PI * 2)
    ctx.fillStyle = pin
    ctx.fill()
    ctx.lineWidth = 1.4
    ctx.strokeStyle = s.pinRing || 'rgba(255,255,255,.9)'
    ctx.stroke()
  })

  if (visible(HQ.ll)) {
    const [hx, hy] = proj(HQ.ll)
    for (let k = 0; k < 2; k++) {
      const ph = (t * 0.55 + k * 0.5) % 1
      ctx.beginPath()
      ctx.arc(hx, hy, 6 + ph * 24, 0, Math.PI * 2)
      ctx.strokeStyle = alpha(s.hqPulse || s.hq, (1 - ph) * 0.8)
      ctx.lineWidth = 1.6
      ctx.stroke()
    }
    ctx.save()
    if (s.glow) {
      ctx.shadowColor = s.hqPulse || s.hq
      ctx.shadowBlur = 14
    }
    ctx.beginPath()
    ctx.arc(hx, hy, 5.5, 0, Math.PI * 2)
    ctx.fillStyle = s.hqPulse || s.hq
    ctx.fill()
    ctx.restore()
    ctx.lineWidth = 2
    ctx.strokeStyle = s.pinRing || 'rgba(255,255,255,.95)'
    ctx.stroke()
  }

  if (s.labels) {
    ctx.font = '500 11px Pretendard, "Noto Sans KR", sans-serif'
    ctx.textBaseline = 'middle'
    Object.values(MARKETS).forEach((m) => {
      if (!visible(m.ll)) return
      const [x, y] = proj(m.ll)
      const tw = ctx.measureText(m.city).width
      const bx = x + 7
      const by = y - 18
      ctx.fillStyle = s.labelBg || 'rgba(255,255,255,.92)'
      ctx.beginPath()
      ctx.roundRect(bx, by, tw + 14, 18, 9)
      ctx.fill()
      ctx.strokeStyle = s.labelBorder || 'rgba(15,23,42,.12)'
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.fillStyle = m === HQ ? s.hq : s.labelText || '#334155'
      ctx.fillText(m.city, bx + 7, by + 9.5)
    })
  }
  ctx.restore()
}

/* ---------------- 공개 API ---------------- */
const isGlobe = (s) => s.kind === 'globe' || s.kind === 'dotglobe'

function fitCanvas(canvas, cssW) {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const cssH = (cssW * H) / W
  canvas.width = Math.round(cssW * dpr)
  canvas.height = Math.round(cssH * dpr)
  canvas.style.height = `${cssH}px`
  return (cssW * dpr) / W
}

/** 썸네일처럼 한 장면만 그린다 */
export function drawOnce(canvas, s, cssW = canvas.clientWidth || 240, t = 1.4) {
  const k = fitCanvas(canvas, cssW)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(k, 0, 0, k, 0, 0)
  if (isGlobe(s)) {
    const { proj, center } = drawGlobe(ctx, s, t)
    drawFx(ctx, s, proj, t, center)
  } else {
    drawStatic(ctx, s)
    drawFx(ctx, s, flatProj, t, null)
  }
}

/**
 * 메인 무대용 애니메이션 렌더러.
 * 평면 지도는 정적 레이어를 오프스크린에 캐시하고 매 프레임 효과만 다시 그린다.
 */
export function createStage(canvas) {
  let style = null
  let raf = 0
  let k = 1
  let cache = null
  let playing = true
  let t0 = performance.now()
  let tPaused = 0

  const rebuild = () => {
    k = fitCanvas(canvas, canvas.clientWidth || W)
    cache = null
    if (style && !isGlobe(style)) {
      cache = document.createElement('canvas')
      cache.width = canvas.width
      cache.height = canvas.height
      const cctx = cache.getContext('2d')
      cctx.setTransform(k, 0, 0, k, 0, 0)
      drawStatic(cctx, style)
    }
  }
  const frame = (now) => {
    const t = playing ? (now - t0) / 1000 : tPaused
    const ctx = canvas.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (cache) {
      ctx.drawImage(cache, 0, 0)
      ctx.setTransform(k, 0, 0, k, 0, 0)
      drawFx(ctx, style, flatProj, t, null)
    } else {
      ctx.setTransform(k, 0, 0, k, 0, 0)
      const { proj, center } = drawGlobe(ctx, style, t)
      drawFx(ctx, style, proj, t, center)
    }
    if (playing) raf = requestAnimationFrame(frame)
  }
  return {
    setStyle(s) {
      style = s
      rebuild()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(frame)
    },
    resize() {
      if (!style) return
      rebuild()
      if (!playing) requestAnimationFrame(frame)
    },
    setPlaying(on) {
      if (on === playing) return
      if (on) {
        t0 = performance.now() - tPaused * 1000
        playing = true
        raf = requestAnimationFrame(frame)
      } else {
        tPaused = (performance.now() - t0) / 1000
        playing = false
        cancelAnimationFrame(raf)
        // 멈춘 순간의 장면은 한 번 그려 둔다 (스타일을 바꾼 직후 멈추면 빈 화면이 되지 않게)
        raf = requestAnimationFrame(frame)
      }
    },
    destroy() {
      cancelAnimationFrame(raf)
    }
  }
}
